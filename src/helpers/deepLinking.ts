// @ts-ignore
import * as base64ab from 'base64-arraybuffer';
import { InvitedContact } from '../models/Contact';
import { InviteCode } from '../models/InviteCode';
import { hexToUint8Array, byteArrayToHex } from './conversion';

export const BASE_URL = 'https://app.felfele.org/';
const SEPARATOR = '/';
const INVITE = 'invite/';
export const INVITE_PATH = `${INVITE}:randomSeed${SEPARATOR}:contactPublicKey`;

const urlSafeBase64Encode = (data: Uint8Array) => {
    const unsafeBase64 = base64ab.encode(data.buffer);
    return unsafeBase64.replace(/\//g, '_');
};

const urlSafeBase64Decode = (data: string) => {
    const unsafeBase64 = data.replace(/_/g, '/');
    return new Uint8Array(base64ab.decode(unsafeBase64));
};

export const getInviteLink = (contact: InvitedContact, profileName: string): string => {
    const randomSeedBytes = hexToUint8Array(contact.randomSeed);
    const contactPulicKeyBytes = hexToUint8Array(contact.contactIdentity.publicKey);
    const base64RandomSeed = urlSafeBase64Encode(randomSeedBytes);
    const base64ContactPublicKey = urlSafeBase64Encode(contactPulicKeyBytes);
    const inviteLinkWithoutUsername = getInviteLinkWithBase64Params(base64RandomSeed, base64ContactPublicKey);
    return `${inviteLinkWithoutUsername}/${encodeURIComponent(profileName)}`;
};

export const getInviteLinkWithBase64Params = (base64RandomSeed: string, base64ContactPublicKey: string) => {
    return `${BASE_URL}${INVITE}${base64RandomSeed}/${base64ContactPublicKey}`;
};

export const getInviteCodeFromInviteLink = (inviteLink: string): InviteCode | undefined => {
    if (!inviteLink.startsWith(`${BASE_URL}${INVITE}`)) {
        return undefined;
    }
    const strippedLink = inviteLink.replace(`${BASE_URL}${INVITE}`, '');
    try {
        const [base64RandomSeed, base64ContactPublicKey, urlEncodedProfileName] = strippedLink.split(SEPARATOR);
        const randomSeed = byteArrayToHex(urlSafeBase64Decode(base64RandomSeed), false);
        const contactPublicKey = byteArrayToHex(urlSafeBase64Decode(base64ContactPublicKey));
        const profileName = decodeURIComponent(urlEncodedProfileName);
        return {
            randomSeed,
            contactPublicKey,
            profileName,
        };
    } catch (e) {
        return undefined;
    }
};
