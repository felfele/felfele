import { Debug } from '../../Debug';
import { ec } from 'elliptic';
import { genKeyPair, throwError, deriveSharedKey } from './flowTestHelpers';
import { encrypt, decrypt, EncryptedData } from './flowTestHelpers';
import { SwarmFeeds } from './SwarmFeeds';

const contactTopic = 'contact';

interface User {
    ownKeyPair: ec.KeyPair;
}

interface Alice extends User {
    randomSeed: string;
    contactKeyPair: ec.KeyPair;
    bobContactPublicKey?: string | undefined;
    bobPublicKey?: string | undefined;
}

export const createAliceForContact = (nextRandom: () => string): Alice => {
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

export const aliceGeneratesQRCode = (alice: Alice): RandomWithContactPublicKey => {
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

export const createBobForContact = (nextRandom: () => string): Bob => {
    const ownRandom = nextRandom();
    const contactRandom = nextRandom();
    return {
        ownKeyPair: genKeyPair(ownRandom),
        contactKeyPair: genKeyPair(contactRandom),
    };
};

export const bobSharesContactPublicKeyAndContactFeed = (
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

export const aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey = (
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

export const bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey = (
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

export const aliceReadsBobsEncryptedPublicKey = (
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
