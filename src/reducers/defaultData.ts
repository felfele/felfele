import { AppState } from './AppState';
import { Settings } from '../models/Settings';
import * as Swarm from '../swarm/Swarm';
import { Author } from '../models/Author';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

export const defaultSettings: Settings = {
    saveToCameraRoll: true,
    showSquareImages: false,
    showDebugMenu: false,
    swarmGatewayAddress: Swarm.defaultGateway,
};

export const DEFAULT_AUTHOR_NAME = 'Space Cowboy';

export const defaultAuthor: Author = {
    name: DEFAULT_AUTHOR_NAME,
    uri: '',
    image: {
        uri: '',
    },
    identity: undefined,
};

export const FELFELE_ASSISTANT_NAME = 'Felfele Assistant';
export const FELFELE_ASSISTANT_URL = 'local/onboarding';

// TODO change back to original URL after finished testing
// export const FELFELE_FOUNDATION_URL = 'bzz-feed:/?user=0xdbbac89704424c90dce46043686c743f0d9dbdda';
export const FELFELE_FOUNDATION_URL = 'bzz-feed:/?user=0xc168ddd069062f184e553369e17d66f6bc315180';

const onboardingAuthor: Author = {
    name: FELFELE_ASSISTANT_NAME,
    uri: FELFELE_ASSISTANT_URL,
    image: {},
};

const defaultPost1: Post = {
    _id: 0,
    createdAt: Date.now(),
    images: [],
    text: `Basic features:.

Post text and images privately, and later add the posts to your public feed.

Follow the public feed of others, or add your favorite RSS/Atom feeds.

If you feel overwhelmed by the news, you can define your own filters in the Settings.`,
    author: onboardingAuthor,
};

const defaultPost2: Post = {
    _id: 1,
    createdAt: Date.now(),
    images: [],
    text: `You can follow others by getting an invite link from them. It can be sent on any kind of channel, or you can read your friend's QR code from his phone`,
    author: onboardingAuthor,
};

const defaultPost3: Post = {
    _id: 2,
    createdAt: Date.now(),
    images: [],
    text: `We have added some feeds that you follow automatically on the news tab (second tab). You can unfollow them if you don't like them. Enjoy!`,
    author: onboardingAuthor,
};

export const defaultLocalPosts = [defaultPost1, defaultPost2, defaultPost3];

export const defaultCurrentTimestamp = 0;

export const defaultMetadata = {
    highestSeenPostId: defaultLocalPosts.length - 1,
};

export const defaultFeeds: Feed[] = [
    {
        name: 'Felfele Assistant',
        url: FELFELE_ASSISTANT_URL,
        feedUrl: FELFELE_ASSISTANT_URL,
        favicon: '',
        followed: true,
    },
    {
        name: 'Felfele Foundation',
        url: FELFELE_FOUNDATION_URL,
        feedUrl: FELFELE_FOUNDATION_URL,
        favicon: 'bzz:/f06957d9a208c1ef26b358e23726b16925f7f5eb32ab19438dfeaec1aa81b041/image.png',
        followed: true,
    },
    {
        name: 'The Verge',
        url: 'https://theverge.com/',
        feedUrl: 'https://www.theverge.com/rss/index.xml',
        favicon: 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395351/android-chrome-192x192.0.png',
        followed: true,
    },
    {
        name: 'Wired Photos',
        url: 'https://www.wired.com/',
        feedUrl: 'https://www.wired.com/feed/category/photo/latest/rss',
        favicon: 'https://static.savings-united.com/image_setting/132/logo/wired_coupons_logo.png',
        followed: true,
    },
    {
        name: '500px Blog',
        url: 'https://iso.500px.com',
        feedUrl: 'https://iso.500px.com/feed',
        favicon: 'https://iso.500px.com/wp-content/uploads/2017/10/cropped-FAVICON-180x180.png',
        followed: true,
    },
    {
        name: 'Favorite Places – Outdoor Photographer',
        url: 'https://www.outdoorphotographer.com',
        feedUrl: 'https://www.outdoorphotographer.com/on-location/favorite-places/feed/',
        favicon: 'https://www.outdoorphotographer.com/wp-content/themes/odp/assets/img/favicon.ico',
        followed: true,
    },
];

export const defaultState: AppState = {
    contentFilters: [],
    feeds: defaultFeeds,
    ownFeeds: [],
    settings: defaultSettings,
    author: defaultAuthor,
    currentTimestamp: defaultCurrentTimestamp,
    rssPosts: defaultLocalPosts,
    localPosts: [],
    draft: null,
    metadata: defaultMetadata,
};
