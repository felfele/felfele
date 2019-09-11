import { Contact, InvitedContact, CodeReceivedContact, AcceptedContact, MutualContact } from '../models/Contact';
import { PrivateIdentity, PublicIdentity } from '../models/Identity';
import { HexString } from './opaqueTypes';
import { byteArrayToHex, stripHexPrefix } from './conversion';
import { ec } from 'elliptic';
import { keccak256 } from 'js-sha3';
import { Debug } from '../Debug';
import { ImageData } from '../models/ImageData';
import { serialize } from '../social/serialization';

export interface UnknownContact {
    type: 'unknown-contact';
}

export const findContactByPublicKey = (publicKey: string, contacts: Contact[]): Contact | undefined => {
    return contacts.find(
        c => c.type === 'mutual-contact' &&
        c.identity.publicKey === publicKey
    );
};

const publicKeyToAddress = (publicKey: HexString): HexString => {
    const curve = new ec('secp256k1');
    const publicKeyWithoutPrefix = stripHexPrefix(publicKey);
    const publicKeyPair = curve.keyFromPublic(publicKeyWithoutPrefix, 'hex');
    const publicKeyBytes = publicKeyPair.getPublic(true).encode();
    return byteArrayToHex(keccak256.array(publicKeyBytes.slice(1)).slice(12));
};

export const publicKeyToIdentity = (publicKey: string): PublicIdentity => ({
    publicKey,
    address: publicKeyToAddress(publicKey as HexString),
});

export const calculateVerificationCode = (publicKey: string): string => {
    const start = 4;
    const numHexDigits = 5;
    const hexValue = publicKey.slice(start, start + numHexDigits * 2);
    const numericValue = parseInt(hexValue, 16);
    const prefix = (s: number, p: string) => ('' + p + s).substring(('' + s).length);
    const prefix12 = (s: number) => prefix(s, '000000000000');
    const stringValue = prefix12(numericValue);
    return `${stringValue.slice(0, 4)}-${stringValue.slice(4, 8)}-${stringValue.slice(8)}`;
};

export interface ContactRandomHelper {
    generateSecureIdentity: (randomSeed: HexString) => Promise<PrivateIdentity>;
    generateSecureRandom: () => Promise<HexString>;
}

export interface ContactHelper extends ContactRandomHelper {
    read: (publicIdentity: PublicIdentity, timeout: number) => Promise<string | never>;
    write: (privateIdentity: PrivateIdentity, data: string, timeout: number) => Promise<void | never>;
    encrypt: (data: string, key: HexString) => Promise<HexString>;
    decrypt: (data: HexString, key: HexString) => string;

    profileData: ProfileData;
    ownIdentity: PublicIdentity;
}

export interface ProfileData {
    name: string;
    image: ImageData;
}

interface ContactMessage extends ProfileData {
    publicKey: string;
}

const tryRead = async (helper: ContactHelper, publicIdentity: PublicIdentity, timeout: number) => {
    try {
        const data = await helper.read(publicIdentity, timeout);
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

export const deriveSharedKey = (privateIdentity: PrivateIdentity, publicIdentity: PublicIdentity): HexString => {
    const curve = new ec('secp256k1');
    const publicKeyPair = curve.keyFromPublic(stripHexPrefix(publicIdentity.publicKey as HexString), 'hex');
    const privateKeyPair = curve.keyFromPrivate(stripHexPrefix(privateIdentity.privateKey as HexString), 'hex');

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

    Debug.log('advanceInvitedContactState', 'after tryRead', pollData, contact);
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

const writeEncryptedContactMessage = async (
    acceptedContact: AcceptedContact,
    helper: ContactHelper,
    timeout: number
): Promise<void | never> => {
    const contactMessage: ContactMessage = {
        ...helper.profileData,
        publicKey: helper.ownIdentity.publicKey,
    };
    const serializedContactMessage = serialize(contactMessage);
    const encryptedContactMessage = await helper.encrypt(serializedContactMessage, acceptedContact.sharedKey);
    Debug.log('writeEncryptedContactMessage', 'write', acceptedContact.contactIdentity.address);
    await helper.write(acceptedContact.contactIdentity, encryptedContactMessage, timeout);
};

const tryDeserializeContactMessage = (data: string): ContactMessage | undefined => {
    try {
        const contactMessage = JSON.parse(data) as ContactMessage;
        return contactMessage;
    } catch (e) {
        return undefined;
    }
};

const advanceAcceptedContactState = async (
    acceptedContact: AcceptedContact,
    helper: ContactHelper,
    timeout: number
): Promise<AcceptedContact | MutualContact> => {
    if (!acceptedContact.isPublicKeySent) {
        try {
            await writeEncryptedContactMessage(acceptedContact, helper, timeout);
        } catch (e) {
            return acceptedContact;
        }
    }

    Debug.log('advanceAcceptedContactState', 'read', acceptedContact.remoteContactIdentity.address);
    const encryptedContactMessage = await tryRead(helper, acceptedContact.remoteContactIdentity, timeout);
    if (encryptedContactMessage == null) {
        return {
            ...acceptedContact,
            isPublicKeySent: true,
        };
    }

    const contactMessageJSON = helper.decrypt(encryptedContactMessage as HexString, acceptedContact.sharedKey);
    const contactMessage = tryDeserializeContactMessage(contactMessageJSON);
    if (contactMessage == null) {
        return {
            ...acceptedContact,
            isPublicKeySent: true,
        };
    }
    const remoteIdentity = publicKeyToIdentity(contactMessage.publicKey);
    const mutualContact: MutualContact = {
        type: 'mutual-contact',
        name: contactMessage.name,
        image: contactMessage.image,
        identity: remoteIdentity,
    };

    return mutualContact;
};
