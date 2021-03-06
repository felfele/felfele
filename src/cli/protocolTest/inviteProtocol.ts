import { Debug } from '../../Debug';
import { ec } from 'elliptic';
import { ecGenKeyPair, throwError, ecDeriveSharedKey, ecPublicKeyToAddress } from './protocolTestHelpers';
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
        ownKeyPair: ecGenKeyPair(ownRandom),
        contactKeyPair: ecGenKeyPair(contactRandom),
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
        ownKeyPair: ecGenKeyPair(ownRandom),
        contactKeyPair: ecGenKeyPair(contactRandom),
    };
};

export const bobSharesContactPublicKeyAndContactFeed = async (
    bob: Bob,
    qrCode: RandomWithContactPublicKey,
    swarmFeeds: MemoryStorageFeeds,
) => {
    Debug.log('\nBob shares contactPublicKey');

    bob.aliceContactPublicKey = qrCode.contactPublicKey;
    const contactFeedKeyPair = ecGenKeyPair(qrCode.randomSeed);
    const contactPublicKey: ContactPublicKey = {
        contactPublicKey: bob.contactKeyPair.getPublic('hex') as string,
    };
    const address = ecPublicKeyToAddress(contactFeedKeyPair);
    swarmFeeds.write(address, contactTopic, JSON.stringify(encrypt(qrCode.randomSeed, contactPublicKey)));
};

export const aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey = async (
    alice: Alice,
    swarmFeeds: MemoryStorageFeeds,
) => {
    Debug.log('\nAlice reads Bob\'s contactPublicKey and shares encrypted publicKey');

    const contactFeedKeyPair = ecGenKeyPair(alice.randomSeed);
    const contactFeedAddress = ecPublicKeyToAddress(contactFeedKeyPair);
    const encryptedContactFeedDataJSON = await swarmFeeds.read(contactFeedAddress, contactTopic) || throwError('contact feed is empty!');
    const encryptedContactFeedData = JSON.parse(encryptedContactFeedDataJSON) as EncryptedData<ContactPublicKey>;
    const contactFeedData = decrypt(encryptedContactFeedData, alice.randomSeed);
    const bobContactPublicKey = contactFeedData as ContactPublicKey;
    alice.bobContactPublicKey = bobContactPublicKey.contactPublicKey;

    const curve = new ec('secp256k1');
    const bobContactPublicKeyPair = curve.keyFromPublic(alice.bobContactPublicKey, 'hex');
    const sharedKey = ecDeriveSharedKey(alice.contactKeyPair, bobContactPublicKeyPair);
    const aliceContactFeedAddress = ecPublicKeyToAddress(alice.contactKeyPair);
    await swarmFeeds.write(aliceContactFeedAddress, contactTopic, JSON.stringify(encrypt(sharedKey, alice.ownKeyPair.getPublic('hex'))));
};

export const bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey = async (
    bob: Bob,
    swarmFeeds: MemoryStorageFeeds,
) => {
    Debug.log('\nBob reads Alice\'s contactPublicKey and shares encrypted publicKey');

    const curve = new ec('secp256k1');
    const aliceContactPublicKeyPair = curve.keyFromPublic(bob.aliceContactPublicKey!, 'hex');
    const sharedKey = ecDeriveSharedKey(bob.contactKeyPair, aliceContactPublicKeyPair);
    const aliceContactFeedAddress = ecPublicKeyToAddress(aliceContactPublicKeyPair);
    const aliceEncryptedPublicKeyJSON = await swarmFeeds.read(aliceContactFeedAddress, contactTopic);
    const aliceEncryptedPublicKey = JSON.parse(aliceEncryptedPublicKeyJSON) as EncryptedData<string>;
    bob.alicePublicKey = decrypt(aliceEncryptedPublicKey, sharedKey);

    Debug.log('bob', bob);

    const bobContactFeedAddress = ecPublicKeyToAddress(bob.contactKeyPair);
    await swarmFeeds.write(bobContactFeedAddress, contactTopic, JSON.stringify(encrypt(sharedKey, bob.ownKeyPair.getPublic('hex'))));
};

export const aliceReadsBobsEncryptedPublicKey = async (
    alice: Alice,
    swarmFeeds: MemoryStorageFeeds,
) => {
    Debug.log('\nAlice reads Bob\'s encrypted publicKey');

    const curve = new ec('secp256k1');
    const bobContactPublicKeyPair = curve.keyFromPublic(alice.bobContactPublicKey!, 'hex');
    const sharedKey = ecDeriveSharedKey(alice.contactKeyPair, bobContactPublicKeyPair);

    const bobContactFeedAddress = ecPublicKeyToAddress(bobContactPublicKeyPair);
    const bobEncryptedPublicKeyJSON = await swarmFeeds.read(bobContactFeedAddress, contactTopic);
    const bobEncryptedPublicKey = JSON.parse(bobEncryptedPublicKeyJSON) as EncryptedData<string>;
    alice.bobPublicKey = decrypt(bobEncryptedPublicKey, sharedKey);

    Debug.log('alice', alice);
};
