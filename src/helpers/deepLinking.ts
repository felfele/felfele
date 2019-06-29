// @ts-ignore
import * as base64 from 'base-64';

export const BASE_URL = 'https://app.felfele.org/';
const FOLLOW = 'follow/';
export const FOLLOW_PATH = `${FOLLOW}:feedUrl`;

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
