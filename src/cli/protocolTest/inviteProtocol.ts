import { Debug } from '../../Debug';
import { ec } from 'elliptic';
import { genKeyPair, throwError, deriveSharedKey, publicKeyToAddress } from './protocolTestHelpers';
import { encrypt, decrypt, EncryptedData } from './protocolTestHelpers';
import { MemoryStorageFeeds } from './MemoryStorage';
import { HexString } from '../../helpers/opaqueTypes';

const contactTopic = 'contact' as HexString;

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

export const bobSharesContactPublicKeyAndContactFeed = async (
    bob: Bob,
    qrCode: RandomWithContactPublicKey,
    swarmFeeds: MemoryStorageFeeds<any>,
) => {
    Debug.log('\nBob shares contactPublicKey');

    bob.aliceContactPublicKey = qrCode.contactPublicKey;
    const contactFeedKeyPair = genKeyPair(qrCode.randomSeed);
    const contactPublicKey: ContactPublicKey = {
        contactPublicKey: bob.contactKeyPair.getPublic('hex') as string,
    };
    const address = publicKeyToAddress(contactFeedKeyPair);
    swarmFeeds.write(address, contactTopic, encrypt(qrCode.randomSeed, contactPublicKey));
};

export const aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey = async (
    alice: Alice,
    swarmFeeds: MemoryStorageFeeds<any>,
) => {
    Debug.log('\nAlice reads Bob\'s contactPublicKey and shares encrypted publicKey');

    const contactFeedKeyPair = genKeyPair(alice.randomSeed);
    const contactFeedAddress = publicKeyToAddress(contactFeedKeyPair);
    const encryptedContactFeedData = await swarmFeeds.read(contactFeedAddress, contactTopic) || throwError('contact feed is empty!');
    const contactFeedData = decrypt(encryptedContactFeedData, alice.randomSeed);
    const bobContactPublicKey = contactFeedData as ContactPublicKey;
    alice.bobContactPublicKey = bobContactPublicKey.contactPublicKey;

    const curve = new ec('secp256k1');
    const bobContactPublicKeyPair = curve.keyFromPublic(alice.bobContactPublicKey, 'hex');
    const sharedKey = deriveSharedKey(alice.contactKeyPair, bobContactPublicKeyPair);
    const aliceContactFeedAddress = publicKeyToAddress(alice.contactKeyPair);
    await swarmFeeds.write(aliceContactFeedAddress, contactTopic, encrypt(sharedKey, alice.ownKeyPair.getPublic('hex') as string));
};

export const bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey = async (
    bob: Bob,
    swarmFeeds: MemoryStorageFeeds<any>,
) => {
    Debug.log('\nBob reads Alice\'s contactPublicKey and shares encrypted publicKey');

    const curve = new ec('secp256k1');
    const aliceContactPublicKeyPair = curve.keyFromPublic(bob.aliceContactPublicKey!, 'hex');
    const sharedKey = deriveSharedKey(bob.contactKeyPair, aliceContactPublicKeyPair);
    const aliceContactFeedAddress = publicKeyToAddress(aliceContactPublicKeyPair);
    const aliceEncryptedPublicKey = await swarmFeeds.read(aliceContactFeedAddress, contactTopic) as EncryptedData<string>;
    bob.alicePublicKey = decrypt(aliceEncryptedPublicKey, sharedKey);

    Debug.log('bob', bob);

    const bobContactFeedAddress = publicKeyToAddress(bob.contactKeyPair);
    await swarmFeeds.write(bobContactFeedAddress, contactTopic, encrypt(sharedKey, bob.ownKeyPair.getPublic('hex') as string));
};

export const aliceReadsBobsEncryptedPublicKey = async (
    alice: Alice,
    swarmFeeds: MemoryStorageFeeds<any>,
) => {
    Debug.log('\nAlice reads Bob\'s encrypted publicKey');

    const curve = new ec('secp256k1');
    const bobContactPublicKeyPair = curve.keyFromPublic(alice.bobContactPublicKey!, 'hex');
    const sharedKey = deriveSharedKey(alice.contactKeyPair, bobContactPublicKeyPair);

    const bobContactFeedAddress = publicKeyToAddress(bobContactPublicKeyPair);
    const bobEncryptedPublicKey = await swarmFeeds.read(bobContactFeedAddress, contactTopic) as EncryptedData<string>;
    alice.bobPublicKey = decrypt(bobEncryptedPublicKey, sharedKey);

    Debug.log('alice', alice);
};
