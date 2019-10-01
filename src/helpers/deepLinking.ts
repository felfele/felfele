// @ts-ignore
import * as base64ab from 'base64-arraybuffer';
import { InvitedContact } from '../models/Contact';
import {
    InviteCode,
    INVITE_CODE_VERSION,
} from '../models/InviteCode';
import { hexToUint8Array, byteArrayToHex } from './conversion';
import { CONTACT_EXPIRY_THRESHOLD } from './contactHelpers';
import { Debug } from '../Debug';

export const BASE_URL = 'https://app.felfele.org/';
const SEPARATOR = '&';
const INVITE = 'invite/';

const urlSafeBase64Encode = (data: Uint8Array) => {
    const unsafeBase64 = base64ab.encode(data.buffer);
    return unsafeBase64.replace(/\//g, '_');
};

const urlSafeBase64Decode = (data: string) => {
    const unsafeBase64 = data.replace(/_/g, '/');
    return new Uint8Array(base64ab.decode(unsafeBase64));
};

export const getInviteLink = (contact: InvitedContact, profileName: string): string => {
    return `${BASE_URL}${INVITE}${makeInviteParams(contact, profileName)}`;
};

export const getInviteLinkWithParams = (params: string): string => {
    return `${BASE_URL}${INVITE}${params}`;
};

const makeInviteParams = (contact: InvitedContact, profileName: string): string => {
    const randomSeedBytes = hexToUint8Array(contact.randomSeed);
    const contactPublicKeyBytes = hexToUint8Array(contact.contactIdentity.publicKey);
    const base64RandomSeed = urlSafeBase64Encode(randomSeedBytes);
    const base64ContactPublicKey = urlSafeBase64Encode(contactPublicKeyBytes);
    return `\
${INVITE_CODE_VERSION}${SEPARATOR}\
${base64RandomSeed}${SEPARATOR}\
${base64ContactPublicKey}${SEPARATOR}\
${contact.createdAt + CONTACT_EXPIRY_THRESHOLD}\
${encodeURIComponent(profileName)}${SEPARATOR}\
`;
};

export const getInviteCodeFromInviteLink = (inviteLink: string): InviteCode | undefined => {
    if (!inviteLink.startsWith(`${BASE_URL}${INVITE}`)) {
        return undefined;
    }
    const strippedLink = inviteLink.replace(`${BASE_URL}${INVITE}`, '');
    try {
        const [versionString, ...rest] = strippedLink.split(SEPARATOR);
        const version = Number.parseInt(versionString, 10);
        switch (version) {
            case 1: return parseVersion1Params(rest);
            default: throw new Error('unknown version');
        }
    } catch (e) {
        Debug.log('deepLinking.getInviteCodeFromInviteLink', e);
        return undefined;
    }
};

const parseVersion1Params = (params: string[]): InviteCode => {
    if (params.length !== 4) {
        throw new Error('invalid parameters');
    }
    return {
        randomSeed: byteArrayToHex(urlSafeBase64Decode(params[0]), false),
        contactPublicKey: byteArrayToHex(urlSafeBase64Decode(params[1]), false),
        expiry: Number.parseInt(params[2], 10),
        profileName: decodeURIComponent(params[3]),
    };
};
