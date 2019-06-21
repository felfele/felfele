import { Contact, InvitedContact, CodeReceivedContact, AcceptedContact, MutualContact } from '../models/Contact';
import { PrivateIdentity, PublicIdentity } from '../models/Identity';
import { HexString } from './opaqueTypes';
import { byteArrayToHex } from './conversion';
import { ec } from 'elliptic';
import { keccak256 } from 'js-sha3';
import { Debug } from '../Debug';

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

export interface ContactRandomHelper {
    generateSecureIdentity: (randomSeed: HexString) => Promise<PrivateIdentity>;
    generateSecureRandom: () => Promise<HexString>;
}

export interface ContactHelper extends ContactRandomHelper {
    read: (publicIdentity: PublicIdentity, timeout: number) => Promise<string | never>;
    write: (privateIdentity: PrivateIdentity, data: string, timeout: number) => Promise<void | never>;
    encrypt: (data: HexString, key: HexString) => Promise<HexString>;
    decrypt: (data: HexString, key: HexString) => HexString;
    ownIdentity: PublicIdentity;
}

const tryRead = (helper: ContactHelper, publicIdentity: PublicIdentity, timeout: number) => {
    try {
        const data = helper.read(publicIdentity, timeout);
        return data;
    } catch (e) {
        return undefined;
    }
};

export const createInvitedContact = async (
    helper: ContactRandomHelper,
    createdAt: number,
): Promise<InvitedContact> => {
    const randomSeed = await helper.generateSecureRandom();
    const contactIdentityRandomSeed = await helper.generateSecureRandom();
    const contactIdentity = await helper.generateSecureIdentity(contactIdentityRandomSeed);
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
    helper: ContactRandomHelper,
): Promise<CodeReceivedContact> => {
    const remoteContactIdentity = publicKeyToIdentity(contactPublicKey);
    const contactIdentityRandomSeed = await helper.generateSecureRandom();
    const contactIdentity = await helper.generateSecureIdentity(contactIdentityRandomSeed);
    return {
        type: 'code-received-contact',
        remoteRandomSeed: randomSeed,
        remoteContactIdentity,
        contactIdentity,
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
        case 'accepted-contact': return advanceAcceptedContactState(contact, helper, timeout);
        case 'mutual-contact': return contact;
    }
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
    Debug.log('advanceInvitedContactState', 'read', randomFeedIdentity.address);
    const pollData = await tryRead(helper, randomFeedIdentity, timeout);
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
): Promise<CodeReceivedContact | AcceptedContact | MutualContact> => {
    const randomFeedIdentity = await helper.generateSecureIdentity(contact.remoteRandomSeed);
    const encryptedContactPublicKey = await helper.encrypt(contact.contactIdentity.publicKey as HexString, contact.remoteRandomSeed);

    try {
        Debug.log('advanceCodeReceivedContactState', 'write', randomFeedIdentity.address);
        await helper.write(randomFeedIdentity, encryptedContactPublicKey, timeout);
    } catch (e) {
        return contact;
    }

    const sharedKey = deriveSharedKey(contact.contactIdentity, contact.remoteContactIdentity);
    const acceptedContact: AcceptedContact = {
        type: 'accepted-contact',
        contactIdentity: contact.contactIdentity,
        remoteContactIdentity: contact.remoteContactIdentity,
        sharedKey,
        isPublicKeySent: false,
    };

    return advanceAcceptedContactState(acceptedContact, helper, timeout);
};

const advanceAcceptedContactState = async (
    acceptedContact: AcceptedContact,
    helper: ContactHelper,
    timeout: number
): Promise<AcceptedContact | MutualContact> => {
    if (!acceptedContact.isPublicKeySent) {
        const encryptedPublicKey = await helper.encrypt(helper.ownIdentity.publicKey as HexString, acceptedContact.sharedKey);
        try {
            Debug.log('advanceAcceptedContactState', 'write', acceptedContact.contactIdentity.address);
            await helper.write(acceptedContact.contactIdentity, encryptedPublicKey, timeout);
        } catch (e) {
            return acceptedContact;
        }
    }

    Debug.log('advanceInvitedContactState', 'read', acceptedContact.remoteContactIdentity.address);
    const pollData = await tryRead(helper, acceptedContact.remoteContactIdentity, timeout);
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
