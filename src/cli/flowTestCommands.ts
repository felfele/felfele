import { ec } from 'elliptic';
import { keccak256 } from 'js-sha3';
import { addCommand } from './cliParser';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { stringToByteArray, byteArrayToHex, hexToByteArray } from '../helpers/conversion';
import { Debug } from '../Debug';

const stringToUint8Array = (s: string): Uint8Array => new Uint8Array(stringToByteArray(s));

const randomNumbers = [
    'c0b0c6949e687b3547f2048740ba86651acca488580c385de1291ed072edadf1',
    '74cfcb1fdbb910c360168c6b96dbd7465ead4c0a471d884d7df813bf81bdc4c9',
    'aa3819ed921333cc5207d29474f0a6a01c4b927abab20fe0852873b5641503af',
    'deb6660af88ed2d1f31eb2591ac291e9c4299b52ff910717266506354327b7ae',
    'b216798e60e9757fc8981d07f50b65619e27a48a7aa7ca8b5beafc7960c43932',
    '99db8a93d2cb20223a7d6dbd53974eaf9f7b96073a716fdcf0a3fa74468ce2cf',
    '65730a8c68b175de243c24bd52e77cbbf7627bd1846b8b26507e0623fa86b22b',
    '17a8357e529fde7d2a62362ed151cf83ed5ecbf46d39f82c497c55ad2139d8f2',
    '4326ddcf514b26c2ed1af1aa3c5a49c744ba3fe87a1a3e2c5ffa951ec0b7975a',
    'cd55f0448a915e2383633e707ba6305fbfc2855e795469eeaf20d1c4fb8aa761',
];

function publicKeyToAddress(pubKey: any) {
    const pubBytes = pubKey.encode();
    return byteArrayToHex(keccak256.array(pubBytes.slice(1)).slice(12));
}

const genKeyPair = (randomHex: string): ec.KeyPair => {
    const curve = new ec('secp256k1');
    const keyPairOptions = {
        entropy: stringToUint8Array(randomHex),
        entropyEnc: 'hex',
    };
    const keyPair = curve.genKeyPair(keyPairOptions);
    return keyPair;
};

const deriveSharedKey = (privateKeyPair: ec.KeyPair, publicKeyPair: ec.KeyPair): string => {
    return privateKeyPair.derive(publicKeyPair.getPublic()).toString(16);
};

const createRandomGenerator = (randomArray: string[]) => {
    let i = 0;
    const nextRandom = () => {
        if (i >= randomArray.length) {
            throw new Error('nextRandom: ran out of random numbers');
        }
        const random = randomArray[i];
        i += 1;
        return random;
    };
    return nextRandom;
};

const throwError = (msg: string): never => {
    throw new Error(msg);
};

const contactTopic = 'contact';

interface EncryptedData<T> {
    secret: string;
    data: T;
}

const encrypt = <T>(secret: string, data: T): EncryptedData<T> => ({
    secret,
    data,
});

const decrypt = <T>(encryptedData: EncryptedData<T>, secret: string): T | never => {
    if (encryptedData.secret !== secret) {
        throw new Error('decrypt: secret does not match!');
    }
    return encryptedData.data;
};

interface User {
    ownKeyPair: ec.KeyPair;
}

interface Alice extends User {
    randomSeed: string;
    contactKeyPair: ec.KeyPair;
    bobContactPublicKey?: string | undefined;
    bobPublicKey?: string | undefined;
}

const createAlice = (nextRandom: () => string): Alice => {
    const ownRandom = nextRandom();
    const randomSeed = nextRandom();
    const contactRandom = nextRandom();
    return {
        randomSeed,
        ownKeyPair: genKeyPair(ownRandom),
        contactKeyPair: genKeyPair(contactRandom),
    };
};

interface ContactPublicKey {
    contactPublicKey: string;
}

interface RandomWithContactPublicKey {
    randomSeed: string;
    contactPublicKey: string;
}

const aliceGeneratesQRCode = (alice: Alice): RandomWithContactPublicKey => {
    return {
        randomSeed: alice.randomSeed,
        contactPublicKey: alice.contactKeyPair.getPublic('hex') as string,
    };
};

interface Bob extends User {
    contactKeyPair: ec.KeyPair;
    aliceContactPublicKey?: string | undefined;
    alicePublicKey?: string | undefined;
}

const createBob = (nextRandom: () => string): Bob => {
    const ownRandom = nextRandom();
    const contactRandom = nextRandom();
    return {
        ownKeyPair: genKeyPair(ownRandom),
        contactKeyPair: genKeyPair(contactRandom),
    };
};

const bobSharesContactPublicKeyAndContactFeed = (
    bob: Bob,
    qrCode: RandomWithContactPublicKey,
    swarmFeeds: SwarmFeeds,
) => {
    Debug.log('\nBob shares contactPublicKey');

    bob.aliceContactPublicKey = qrCode.contactPublicKey;
    const contactFeedKeyPair = genKeyPair(qrCode.randomSeed);
    const contactPublicKey: ContactPublicKey = {
        contactPublicKey: bob.contactKeyPair.getPublic('hex') as string,
    };
    swarmFeeds.write(contactFeedKeyPair, contactTopic, encrypt(qrCode.randomSeed, contactPublicKey));
};

const aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey = (
    alice: Alice,
    swarmFeeds: SwarmFeeds,
) => {
    Debug.log('\nAlice reads Bob\'s contactPublicKey and shares encrypted publicKey');

    const contactFeedKeyPair = genKeyPair(alice.randomSeed);
    const encryptedContactFeedData = swarmFeeds.read(contactFeedKeyPair, contactTopic) || throwError('contact feed is empty!');
    const contactFeedData = decrypt(encryptedContactFeedData, alice.randomSeed);
    const bobContactPublicKey = contactFeedData as ContactPublicKey;
    alice.bobContactPublicKey = bobContactPublicKey.contactPublicKey;

    const curve = new ec('secp256k1');
    const bobContactPublicKeyPair = curve.keyFromPublic(alice.bobContactPublicKey, 'hex');
    const sharedKey = deriveSharedKey(alice.contactKeyPair, bobContactPublicKeyPair);

    swarmFeeds.write(alice.contactKeyPair, contactTopic, encrypt(sharedKey, alice.ownKeyPair.getPublic('hex') as string));
};

const bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey = (
    bob: Bob,
    swarmFeeds: SwarmFeeds,
) => {
    Debug.log('\nBob reads Alice\'s contactPublicKey and shares encrypted publicKey');

    const curve = new ec('secp256k1');
    const aliceContactPublicKeyPair = curve.keyFromPublic(bob.aliceContactPublicKey!, 'hex');
    const sharedKey = deriveSharedKey(bob.contactKeyPair, aliceContactPublicKeyPair);
    const aliceEncryptedPublicKey = swarmFeeds.read(aliceContactPublicKeyPair, contactTopic) as EncryptedData<string>;
    bob.alicePublicKey = decrypt(aliceEncryptedPublicKey, sharedKey);

    Debug.log('bob', bob);

    swarmFeeds.write(bob.contactKeyPair, contactTopic, encrypt(sharedKey, bob.ownKeyPair.getPublic('hex') as string));
};

const aliceReadsBobsEncryptedPublicKey = (
    alice: Alice,
    swarmFeeds: SwarmFeeds,
) => {
    Debug.log('\nAlice reads Bob\'s encrypted publicKey');

    const curve = new ec('secp256k1');
    const bobContactPublicKeyPair = curve.keyFromPublic(alice.bobContactPublicKey!, 'hex');
    const sharedKey = deriveSharedKey(alice.contactKeyPair, bobContactPublicKeyPair);

    const bobEncryptedPublicKey = swarmFeeds.read(bobContactPublicKeyPair, contactTopic) as EncryptedData<string>;
    alice.bobPublicKey = decrypt(bobEncryptedPublicKey, sharedKey);

    Debug.log('alice', alice);
};

class SwarmFeeds {
    private feeds: {[name: string]: any} = {};

    public write = (keyPair: ec.KeyPair, topic: string, data: any) => {
        const address = publicKeyToAddress(keyPair.getPublic());
        const privateKey = keyPair.getPrivate() ? keyPair.getPrivate('hex') : null;
        const name = keyPair.getPublic('hex') + '/' + topic;
        Debug.log('\n--> SwarmFeeds.write', {address, privateKey, name, data});
        if (keyPair.getPrivate() == null) {
            throw new Error('missing private key');
        }
        this.feeds[name] = data;
    }

    public read = (keyPair: ec.KeyPair, topic: string): any | undefined => {
        const address = publicKeyToAddress(keyPair.getPublic());
        const name = keyPair.getPublic('hex') + '/' + topic;
        const data = this.feeds[name];
        Debug.log('\n<-- SwarmFeeds.read', {address, name, data});
        return data;
    }
}

export const flowTestCommandDefinition =
    addCommand('invite', 'Test invite process', async () => {
        const nextRandom = createRandomGenerator(randomNumbers);
        const swarmFeeds = new SwarmFeeds();
        const alice = createAlice(nextRandom);
        Debug.log('Alice publicKey', alice.ownKeyPair.getPublic('hex'));
        const bob = createBob(nextRandom);
        Debug.log('Bob publicKey', bob.ownKeyPair.getPublic('hex'));

        const qrCode = aliceGeneratesQRCode(alice);
        Debug.log('\n<-- QR code read', qrCode);
        bobSharesContactPublicKeyAndContactFeed(bob, qrCode, swarmFeeds);
        aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey(alice, swarmFeeds);
        bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey(bob, swarmFeeds);
        aliceReadsBobsEncryptedPublicKey(alice, swarmFeeds);

        if (alice.bobPublicKey !== bob.ownKeyPair.getPublic('hex') ||
            bob.alicePublicKey !== alice.ownKeyPair.getPublic('hex')) {
                throwError('public keys are not matching');
        }
    })
    .
    addCommand('random', 'Generate 10 random strings', async () => {
        for (let i = 0; i < 10; i++) {
            const random = await generateUnsecureRandom(32);
            output(byteArrayToHex(random, false));
        }
    })
;
