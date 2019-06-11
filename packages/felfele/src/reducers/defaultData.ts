import { AppState } from './AppState';
import {
    Settings,
    Author,
    defaultGateway,
    Post,
    Feed,
} from '@felfele/felfele-core';
import { defaultImages } from '../defaultImages';

export const defaultSettings: Settings = {
    saveToCameraRoll: true,
    showSquareImages: false,
    showDebugMenu: false,
    swarmGatewayAddress: defaultGateway,
};

export const DEFAULT_AUTHOR_NAME = '';

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
export const FELFELE_FOUNDATION_URL = 'bzz-feed:/?user=0xdbbac89704424c90dce46043686c743f0d9dbdda';

const onboardingAuthor: Author = {
    name: FELFELE_ASSISTANT_NAME,
    uri: FELFELE_ASSISTANT_URL,
    image: {
        localPath: defaultImages.felfeleAssistant,
    },
};

const defaultPost1: Post = {
    _id: 0,
    createdAt: Date.now(),
    images: [],
    text: `Basic features:

- Post text and images. If you post multiple images they will be displayed as a slide show.

- Follow other people using the Felfele app, or follow your favorite website/blog.

- Share interesting posts in your feed by pressing the three vertical dots on a post.

We would like to hear about you! You can always ask questions or send feedback to us at [hello@felfele.org](mailto:hello@felfele.org)

If you find something is broken or you don't like please send us a bug report from the Settings menu.

`,
    author: onboardingAuthor,
};

const defaultPost2: Post = {
    _id: 1,
    createdAt: Date.now(),
    images: [],
    text: `You can follow others by getting an invite link from them or scanning a QR code on their phones. Press the + button in the top right corner to do this.

Paste a link here or enter a website address.

If you want to share your posts, go to the Profile tab. Press the share button in the top right corner or show your QR code.
    `,
    author: onboardingAuthor,
};

const defaultPost3: Post = {
    _id: 2,
    createdAt: Date.now(),
    images: [],
    text: `You can also find new content if you press the All channels button on the top left, then the Explore button.

Enjoy!
`,
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
        favicon: defaultImages.felfeleAssistant,
        followed: true,
    },
    {
        name: 'Felfele Foundation',
        url: FELFELE_FOUNDATION_URL,
        feedUrl: FELFELE_FOUNDATION_URL,
        favicon: 'bzz:/f06957d9a208c1ef26b358e23726b16925f7f5eb32ab19438dfeaec1aa81b041/image.png',
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
