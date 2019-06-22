// @ts-ignore
import * as base64 from 'base-64';
// @ts-ignore
import * as base64ab from 'base64-arraybuffer';
import { InvitedContact } from '../models/Contact';
import { InviteCode } from '../models/InviteCode';
import { hexToUint8Array, byteArrayToHex } from './conversion';

export const BASE_URL = 'https://app.felfele.org/';
const SEPARATOR = '/';
const FOLLOW = 'follow/';
export const FOLLOW_PATH = `${FOLLOW}:feedUrl`;
const INVITE = 'invite/';
export const INVITE_PATH = `${INVITE}:randomSeed${SEPARATOR}:contactPublicKey`;

export const getFollowLink = (url: string): string => {
    return `${BASE_URL}${FOLLOW}${base64.encode(url)}`;
};

const isFollowLink = (url: string): boolean => {
    return url.startsWith(`${BASE_URL}${FOLLOW}`);
};

export const getFeedUrlFromFollowLink = (followLink: string): string | undefined => {
    if (!isFollowLink(followLink)) {
        return undefined;
    }
    const base64FeedUrl = followLink.replace(`${BASE_URL}${FOLLOW}`, '');
    try {
        const feedUrl = base64.decode(base64FeedUrl);
        return feedUrl;
    } catch (e) {
        return undefined;
    }
};

const urlSafeBase64Encode = (data: Uint8Array) => {
    const unsafeBase64 = base64ab.encode(data.buffer);
    return unsafeBase64.replace(/\//g, '_');
};

const urlSafeBase64Decode = (data: string) => {
    const unsafeBase64 = data.replace(/_/g, '/');
    return new Uint8Array(base64ab.decode(unsafeBase64));
};

export const getInviteLink = (contact: InvitedContact): string => {
    const randomSeedBytes = hexToUint8Array(contact.randomSeed);
    const contactPulicKeyBytes = hexToUint8Array(contact.contactIdentity.publicKey);
    const base64RandomSeed = urlSafeBase64Encode(randomSeedBytes);
    const base64ContactPublicKey = urlSafeBase64Encode(contactPulicKeyBytes);
    return `${BASE_URL}${INVITE}${base64RandomSeed}/${base64ContactPublicKey}`;
};

export const getInviteCodeFromInviteLink = (inviteLink: string): InviteCode | undefined => {
    if (!inviteLink.startsWith(`${BASE_URL}${INVITE}`)) {
        return undefined;
    }
    const strippedLink = inviteLink.replace(`${BASE_URL}${INVITE}`, '');
    try {
        const [base64RandomSeed, base64ContactPublicKey] = strippedLink.split(SEPARATOR);
        const randomSeed = byteArrayToHex(urlSafeBase64Decode(base64RandomSeed), false);
        const contactPublicKey = byteArrayToHex(urlSafeBase64Decode(base64ContactPublicKey));
        return {
            randomSeed,
            contactPublicKey,
        };
    } catch (e) {
        return undefined;
    }
};
