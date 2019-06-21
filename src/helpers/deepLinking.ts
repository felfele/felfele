// @ts-ignore
import * as base64 from 'base-64';
import { InvitedContact } from '../models/Contact';
import { InviteCode } from '../models/InviteCode';
import { HexString } from './opaqueTypes';

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

export const getInviteLink = (contact: InvitedContact): string => {
    return `${BASE_URL}${INVITE}${contact.randomSeed}/${contact.contactIdentity.publicKey}`;
};

export const getInviteCodeFromInviteLink = (inviteLink: string): InviteCode | undefined => {
    if (!inviteLink.startsWith(`${BASE_URL}${INVITE}`)) {
        return undefined;
    }
    const strippedLink = inviteLink.replace(`${BASE_URL}${INVITE}`, '');
    try {
        const [randomSeed, contactPublicKey] = strippedLink.split(SEPARATOR) as HexString[];
        return {
            randomSeed,
            contactPublicKey,
        };
    } catch (e) {
        return undefined;
    }
};
