import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
} from 'redux';
import { AsyncStorage } from 'react-native';
import thunkMiddleware from 'redux-thunk';
import {
    persistStore,
    persistReducer,
    PersistedState,
    createMigrate,
    getStoredState,
    KEY_PREFIX,
    PersistConfig,
} from 'redux-persist';

import { Actions, AsyncActions } from '../actions/Actions';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Settings } from '../models/Settings';
import { Post, Author } from '../models/Post';
import { Metadata } from '../models/Metadata';
import { Debug } from '../Debug';
import { LocalFeed } from '../social/api';
import { migrateAppState, currentAppStateVersion } from './migration';
import { immutableTransformHack } from './immutableTransformHack';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { removeFromArray, updateArrayItem, insertInArray } from '../helpers/immutable';

const modelHelper = new ReactNativeModelHelper();

export interface AppState extends PersistedState {
    contentFilters: ContentFilter[];
    feeds: Feed[];
    ownFeeds: LocalFeed[];
    settings: Settings;
    author: Author;
    currentTimestamp: number;
    rssPosts: Post[];
    localPosts: Post[];
    draft: Post | null;
    metadata: Metadata;
    postUploadQueue: Post[];
}

const defaultSettings: Settings = {
    saveToCameraRoll: true,
    showSquareImages: true,
    showDebugMenu: false,
};

const defaultAuthor: Author = {
    name: '',
    uri: '',
    faviconUri: '',
    image: {
        uri: '',
    },
    identity: undefined,
};

const onboardingAuthor: Author = {
    faviconUri: '',
    name: 'Felfele Assistant',
    uri: '',
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

const defaultLocalPosts = [defaultPost1, defaultPost2, defaultPost3];

const defaultCurrentTimestamp = 0;

const defaultMetadata = {
    highestSeenPostId: defaultLocalPosts.length - 1,
};

const defaultFeeds: Feed[] = [
    {
        name: 'The Verge',
        url: 'https://theverge.com/',
        feedUrl: 'https://www.theverge.com/rss/index.xml',
        favicon: 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395361/favicon-64x64.0.ico',
        followed: true,
    },
    {
        name: 'Wired Photos',
        url: 'https://www.wired.com/',
        feedUrl: 'https://www.wired.com/feed/category/photo/latest/rss',
        favicon: '',
        followed: true,
    },
    {
        name: '500px Blog',
        url: 'https://iso.500px.com',
        feedUrl: 'https://iso.500px.com/feed',
        favicon: 'https://iso.500px.com/wp-content/themes/photoform/favicon.ico',
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
    rssPosts: [],
    localPosts: defaultLocalPosts,
    draft: null,
    metadata: defaultMetadata,
    postUploadQueue: [],
};

const contentFiltersReducer = (contentFilters: ContentFilter[] = [], action: Actions): ContentFilter[] => {
    switch (action.type) {
        case 'ADD-CONTENT-FILTER': {
            const filter: ContentFilter = {
                text: action.payload.text,
                createdAt: action.payload.createdAt,
                validUntil: action.payload.validUntil,
            };
            return [...contentFilters, filter];
        }
        case 'REMOVE-CONTENT-FILTER': {
            const ind = contentFilters.findIndex(filter => filter != null && action.payload.filter.text === filter.text);
            if (ind === -1) {
                return contentFilters;
            }
            return removeFromArray(contentFilters, ind);
        }
        default: {
            return contentFilters;
        }
    }
};

const feedsReducer = (feeds: Feed[] = defaultFeeds, action: Actions): Feed[] => {
    switch (action.type) {
        case 'ADD-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind ===  -1) {
                return [...feeds, {
                    ...action.payload.feed,
                    followed: true,
                }];
            }
            return feeds;
        }
        case 'REMOVE-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return removeFromArray(feeds, ind);
        }
        case 'FOLLOW-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return updateArrayItem(feeds, ind, feed => {
                return {
                    ...feed,
                    followed: true,
                };
            });
        }
        case 'UNFOLLOW-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return updateArrayItem(feeds, ind, feed => {
                return {
                    ...feed,
                    favorite: false,
                    followed: false,
                };
            });
        }
        case 'UPDATE-FEED-FAVICON': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return updateArrayItem(feeds, ind, (feed) => ({
                ...feed,
                favicon: action.payload.favicon,
            }));
        }
        case 'TOGGLE-FEED-FAVORITE': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return updateArrayItem(feeds, ind, (feed) => ({
                ...feed,
                favorite: !feed.favorite,
            }));
        }
        default: {
            return feeds;
        }
    }
};

const ownFeedsReducer = (ownFeeds: LocalFeed[] = [], action: Actions): LocalFeed[] => {
    switch (action.type) {
        case 'ADD-OWN-FEED': {
            return [...ownFeeds, action.payload.feed];
        }
        case 'UPDATE-OWN-FEED': {
            const ind = ownFeeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return ownFeeds;
            }
            return updateArrayItem(ownFeeds, ind, (feed) => ({
                ...feed,
                ...action.payload.feed,
            }));

        }
        default: {
            return ownFeeds;
        }
    }
};

const settingsReducer = (settings = defaultSettings, action: Actions): Settings => {
    switch (action.type) {
        case 'CHANGE-SETTING-SAVE-TO-CAMERA-ROLL': {
            return {
                ...settings,
                saveToCameraRoll: action.payload.value,
            };
        }
        case 'CHANGE-SETTING-SHOW-SQUARE-IMAGES': {
            return {
                ...settings,
                showSquareImages: action.payload.value,
            };
        }
        case 'CHANGE-SETTING-SHOW-DEBUG-MENU': {
            return {
                ...settings,
                showDebugMenu: action.payload.value,
            };
        }
    }
    return settings;
};

const authorReducer = (author = defaultAuthor, action: Actions): Author => {
    switch (action.type) {
        case 'UPDATE-AUTHOR-NAME': {
            return {
                ...author,
                name: action.payload.name,
            };
        }
        case 'UPDATE-AUTHOR-PICTURE-PATH': {
            return {
                ...author,
                faviconUri: modelHelper.getImageUri(action.payload.image),
                image: action.payload.image,
            };
        }
        case 'UPDATE-AUTHOR-IDENTITY': {
            return {
                ...author,
                identity: action.payload.privateIdentity,
            };
        }
        default: {
            return author;
        }
    }
};

const currentTimestampReducer = (currentTimestamp = defaultCurrentTimestamp, action: Actions): number => {
    switch (action.type) {
        case 'TIME-TICK': {
            return Date.now();
        }
    }
    return currentTimestamp;
};

const rssPostsReducer = (rssPosts: Post[] = [], action: Actions): Post[] => {
    switch (action.type) {
        case 'UPDATE-RSS-POSTS': {
            return action.payload.posts;
        }
    }
    return rssPosts;
};

const localPostsReducer = (localPosts = defaultLocalPosts, action: Actions): Post[] => {
    switch (action.type) {
        case 'ADD-POST': {
            if (action.payload.post._id === defaultLocalPosts.length) {
                return [action.payload.post];
            }
            return insertInArray(localPosts, action.payload.post, 0);
        }
        case 'DELETE-POST': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return removeFromArray(localPosts, ind);
        }
        case 'UPDATE-POST-LINK': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return updateArrayItem(localPosts, ind, (post => ({...post, link: action.payload.link})));
        }
        case 'UPDATE-POST-IS-UPLOADING': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return updateArrayItem(localPosts, ind, (post => ({...post, isUploading: action.payload.isUploading})));
        }
        case 'UPDATE-POST-IMAGES': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return updateArrayItem(localPosts, ind, (post => ({...post, images: action.payload.images})));
        }
    }
    return localPosts;
};

const draftReducer = (draft: Post | null = null, action: Actions): Post | null => {
    switch (action.type) {
        case 'ADD-DRAFT': {
            return action.payload.draft;
        }
        case 'REMOVE-DRAFT': {
            return null;
        }
    }
    return draft;
};

const metadataReducer = (metadata: Metadata = defaultMetadata, action: Actions): Metadata => {
    switch (action.type) {
        case 'INCREASE-HIGHEST-SEEN-POST-ID': {
            return {
                ...metadata,
                highestSeenPostId: metadata.highestSeenPostId + 1,
            };
        }
        default: {
            return metadata;
        }
    }
};

const postUploadQueueReducer = (postUploadQueue: Post[] = [], action: Actions): Post[] => {
    switch (action.type) {
        case 'QUEUE-POST-FOR-UPLOAD': {
            return [...postUploadQueue, action.payload.post];
        }
        case 'REMOVE-POST-FOR-UPLOAD': {
            const ind = postUploadQueue.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return postUploadQueue;
            }
            return removeFromArray(postUploadQueue, ind);
        }
    }
    return postUploadQueue;
};

const appStateReducer = (state: AppState = defaultState, action: Actions): AppState => {
    Debug.log('appStateReducer', 'action', action);
    switch (action.type) {
        case 'APP-STATE-RESET': {
            Debug.log('App state reset');
            return defaultState;
        }
        case 'APP-STATE-SET': {
            Debug.log('App state set');
            return action.payload.appState;
        }
        default: {
            try {
                return combinedReducers(state, action);
            } catch (e) {
                Debug.log('reducer error: ', e);
                return state;
            }
        }
    }
};

class FelfelePersistConfig implements PersistConfig {
    public transforms = [immutableTransformHack({
        whitelist: ['contentFilters', 'feeds', 'ownFeeds', 'rssPosts', 'localPosts', 'postUploadQueue'],
    })];
    public blacklist = ['currentTimestamp'];
    public key = 'root';
    public storage = AsyncStorage;
    public version = currentAppStateVersion;
    public migrate = createMigrate(migrateAppState, { debug: false});
}

export const persistConfig = new FelfelePersistConfig();

export const combinedReducers = combineReducers<AppState>({
    contentFilters: contentFiltersReducer,
    feeds: feedsReducer,
    ownFeeds: ownFeedsReducer,
    settings: settingsReducer,
    author: authorReducer,
    currentTimestamp: currentTimestampReducer,
    rssPosts: rssPostsReducer,
    localPosts: localPostsReducer,
    draft: draftReducer,
    metadata: metadataReducer,
    postUploadQueue: postUploadQueueReducer,
});

const persistedReducer = persistReducer(persistConfig, appStateReducer);

export const store = createStore(
    persistedReducer,
    defaultState,
    compose(
        applyMiddleware(thunkMiddleware),
    ),
);

const initStore = () => {
    console.log('initStore: ', store.getState());
    // @ts-ignore
    store.dispatch(AsyncActions.cleanupContentFilters());
    // @ts-ignore
    for (const ownFeed of store.getState().ownFeeds) {
        store.dispatch(Actions.updateOwnFeed({
            ...ownFeed,
            isSyncing: false,
        }));
    }
    store.dispatch(Actions.timeTick());
    setInterval(() => store.dispatch(Actions.timeTick()), 60000);
};

export const persistor = persistStore(store, {}, initStore);

export const getSerializedAppState = async (): Promise<string> => {
    const serializedAppState = await persistConfig.storage.getItem(KEY_PREFIX + persistConfig.key);
    if (serializedAppState != null) {
        return serializedAppState;
    }
    throw new Error('serialized app state is null');
};

export const getAppStateFromSerialized = async (serializedAppState: string): Promise<AppState> => {
    const storagePersistConfig = {
        ...persistConfig,
        storage: {
            getItem: (key: string) => new Promise<string>((resolve, reject) => resolve(serializedAppState)),
            setItem: (key: string, value: any) => { /* do nothing */ },
            removeItem: (key: string) => { /* do nothing */ },
        },
    };
    const appState = await getStoredState(storagePersistConfig) as AppState;
    return appState;
};

export const migrateAppStateToCurrentVersion = async (appState: AppState): Promise<AppState> => {
    const currentVersionAppState = await persistConfig.migrate(appState, currentAppStateVersion) as AppState;
    return currentVersionAppState;
};
