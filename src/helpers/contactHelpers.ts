import { Contact, InvitedContact, CodeReceivedContact, AcceptedContact, MutualContact, IncomingContact } from '../models/Contact';
import { SECOND } from '../DateUtils';
import { PrivateIdentity, PublicIdentity } from '../models/Identity';
import { HexString } from './opaqueTypes';
import { byteArrayToHex } from './conversion';
import { ec } from 'elliptic';
import { keccak256 } from 'js-sha3';
import { Utils } from '../Utils';

const stripHexPrefix = (hex: string) => hex.startsWith('0x')
    ? hex.slice(2)
    : hex
;

const publicKeyToAddress = (publicKey: HexString): HexString => {
    const curve = new ec('secp256k1');
    const publicKeyWithoutPrefix = stripHexPrefix(publicKey);
    const publicKeyPair = curve.keyFromPublic(publicKeyWithoutPrefix, 'hex');
    const publicKeyBytes = publicKeyPair.getPublic().encode();
    return byteArrayToHex(keccak256.array(publicKeyBytes.slice(1)).slice(12));
};

export const publicKeyToIdentity = (publicKey: string): PublicIdentity => ({
    publicKey,
    address: publicKeyToAddress(publicKey as HexString),
});

export interface ContactHelper {
    read: (publicIdentity: PublicIdentity, timeout: number) => Promise<string | undefined>;
    write: (privateIdentity: PrivateIdentity, data: string, timeout: number) => Promise<void | never>;
    now: () => number;
    generateSecureIdentity: (randomSeed: HexString) => Promise<PrivateIdentity>;
    generateSecureRandom: () => Promise<HexString>;
    encrypt: (data: HexString, key: HexString) => Promise<HexString>;
    decrypt: (data: HexString, key: HexString) => HexString;
    ownIdentity: PublicIdentity;
}

export const createInvitedContact = async (
    helper: ContactHelper,
): Promise<InvitedContact> => {
    const randomSeed = await helper.generateSecureRandom();
    const contactIdentityRandomSeed = await helper.generateSecureRandom();
    const contactIdentity = await helper.generateSecureIdentity(contactIdentityRandomSeed);
    const createdAt = helper.now();
    return {
        type: 'invited-contact',
        randomSeed,
        contactIdentity,
        createdAt,
    };
};

export const createCodeReceivedContact = async (
    randomSeed: HexString,
    contactPublicKey: HexString,
    helper: ContactHelper,
): Promise<CodeReceivedContact> => {
    const remoteContactIdentity = publicKeyToIdentity(contactPublicKey);
    const contactIdentityRandomSeed = await helper.generateSecureRandom();
    const contactIdentity = await helper.generateSecureIdentity(contactIdentityRandomSeed);
    return {
        type: 'code-received-contact',
        remoteRandomSeed: randomSeed,
        remoteContactIdentity,
        contactIdentity,
        isContactPublicKeySent: false,
    };
};

export const advanceContactState = async (
    contact: Contact,
    helper: ContactHelper,
    timeout: number = 0
): Promise<Contact> => {
    switch (contact.type) {
        case 'invited-contact': return advanceInvitedContactState(contact, helper, timeout);
        case 'code-received-contact': return advanceCodeReceivedContactState(contact, helper, timeout);
        case 'incoming-contact': return advanceIncomingContactState(contact, helper, timeout);
        case 'accepted-contact': return advanceAcceptedContactState(contact, helper, timeout);
        case 'mutual-contact': return contact;
    }
};

const pollFeed = async (publicIdentity: PublicIdentity, helper: ContactHelper, timeout: number): Promise<string | undefined> => {
    const startTime = helper.now();
    const pollTimeout = 3 * SECOND;
    const maxTries = (timeout / pollTimeout) + 1;
    let numErrors = 0;
    while (helper.now() <= startTime + timeout && numErrors < maxTries) {
        const beforeRead = helper.now();
        try {
            const data = await helper.read(publicIdentity, pollTimeout);
            return data;
        } catch (e) {
            numErrors += 1;
            await Utils.waitUntil(beforeRead + pollTimeout);
        }
    }
    return undefined;
};

const deriveSharedKey = (privateIdentity: PrivateIdentity, publicIdentity: PublicIdentity): HexString => {
    const curve = new ec('secp256k1');
    const publicKeyPair = curve.keyFromPublic(stripHexPrefix(publicIdentity.publicKey), 'hex');
    const privateKeyPair = curve.keyFromPrivate(stripHexPrefix(privateIdentity.privateKey), 'hex');

    return privateKeyPair.derive(publicKeyPair.getPublic()).toString(16);
};

const advanceInvitedContactState = async (
    contact: InvitedContact,
    helper: ContactHelper,
    timeout: number
): Promise<InvitedContact | AcceptedContact | MutualContact> => {
    const randomFeedIdentity = await helper.generateSecureIdentity(contact.randomSeed);
    const pollData = await pollFeed(randomFeedIdentity, helper, timeout);
    if (pollData == null) {
        return contact;
    }

    const contactPublicKey = helper.decrypt(pollData as HexString, contact.randomSeed);
    const remoteContactIdentity = publicKeyToIdentity(contactPublicKey);
    const sharedKey = deriveSharedKey(contact.contactIdentity, remoteContactIdentity);
    const acceptedContact: AcceptedContact = {
        type: 'accepted-contact',
        contactIdentity: contact.contactIdentity,
        remoteContactIdentity,
        isPublicKeySent: false,
        sharedKey,
    };

    return advanceAcceptedContactState(acceptedContact, helper, timeout);
};

const advanceCodeReceivedContactState = async (
    contact: CodeReceivedContact,
    helper: ContactHelper,
    timeout: number
): Promise<CodeReceivedContact | IncomingContact | MutualContact> => {
    if (!contact.isContactPublicKeySent) {
        const randomFeedIdentity = await helper.generateSecureIdentity(contact.remoteRandomSeed);
        const encryptedContactPublicKey = await helper.encrypt(contact.contactIdentity.publicKey as HexString, contact.remoteRandomSeed);

        try {
            await helper.write(randomFeedIdentity, encryptedContactPublicKey, timeout);
        } catch (e) {
            return contact;
        }
    }

    const pollData = await pollFeed(contact.remoteContactIdentity, helper, timeout);
    if (pollData == null) {
        return {
            ...contact,
            isContactPublicKeySent: true,
        };
    }

    const sharedKey = deriveSharedKey(contact.contactIdentity, contact.remoteContactIdentity);
    const contactPublicKey = helper.decrypt(pollData as HexString, sharedKey);
    const remoteIdentity = publicKeyToIdentity(contactPublicKey);
    const incomingContact: IncomingContact = {
        type: 'incoming-contact',
        contactIdentity: contact.contactIdentity,
        remoteIdentity,
        sharedKey,
    };

    return advanceIncomingContactState(incomingContact, helper, timeout);
};

const advanceIncomingContactState = async (
    incomingContact: IncomingContact,
    helper: ContactHelper,
    timeout: number
): Promise<IncomingContact | MutualContact> => {
    const encryptedPublicKey = await helper.encrypt(helper.ownIdentity.publicKey as HexString, incomingContact.sharedKey);
    try {
        await helper.write(incomingContact.contactIdentity, encryptedPublicKey, timeout);
    } catch (e) {
        return incomingContact;
    }

    const mutualContact: MutualContact = {
        type: 'mutual-contact',
        name: '',
        image: {},
        identity: incomingContact.remoteIdentity,
        confirmed: false,
    };
    return mutualContact;
};

const advanceAcceptedContactState = async (
    acceptedContact: AcceptedContact,
    helper: ContactHelper,
    timeout: number
): Promise<AcceptedContact | MutualContact> => {
    if (!acceptedContact.isPublicKeySent) {
        const encryptedPublicKey = await helper.encrypt(helper.ownIdentity.publicKey as HexString, acceptedContact.sharedKey);
        try {
            await helper.write(acceptedContact.contactIdentity, encryptedPublicKey, timeout);
        } catch (e) {
            return acceptedContact;
        }
    }

    const pollData = await pollFeed(acceptedContact.remoteContactIdentity, helper, timeout);
    if (pollData == null) {
        return {
            ...acceptedContact,
            isPublicKeySent: true,
        };
    }

    const remotePublicKey = helper.decrypt(pollData as HexString, acceptedContact.sharedKey);
    const remoteIdentity = publicKeyToIdentity(remotePublicKey);
    const mutualContact: MutualContact = {
        type: 'mutual-contact',
        name: '',
        image: {},
        identity: remoteIdentity,
        confirmed: true,
    };

    return mutualContact;
};
