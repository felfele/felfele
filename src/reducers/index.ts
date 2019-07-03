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
    createMigrate,
    getStoredState,
    KEY_PREFIX,
    PersistConfig,
} from 'redux-persist';

import { Actions, AsyncActions } from '../actions/Actions';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Settings } from '../models/Settings';
import { Post } from '../models/Post';
import { Author } from '../models/Author';
import { Metadata } from '../models/Metadata';
import { Debug } from '../Debug';
import { LocalFeed, RecentPostFeed } from '../social/api';
import { migrateAppState } from './migration';
import { immutableTransformHack } from './immutableTransformHack';
import { removeFromArray, updateArrayItem, insertInArray, containsItem, replaceItemInArray } from '../helpers/immutable';
import {
    defaultFeeds,
    defaultSettings,
    defaultAuthor,
    defaultCurrentTimestamp,
    defaultLocalPosts,
    defaultMetadata,
    defaultState,
} from './defaultData';
import { AppState, currentAppStateVersion } from './AppState';
import { Contact } from '../models/Contact';
import { contactsReducer } from './contactsReducer';

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
        case 'UPDATE-FEEDS-DATA': {
            const updatedFeeds = feeds.map(feed => {
                const updatedFeed = action.payload.feeds.find(value => feed.feedUrl === value.feedUrl);
                return updatedFeed != null
                    ? {
                        ...feed,
                        name: updatedFeed.name,
                        authorImage: updatedFeed.authorImage,
                    }
                    : feed;
            });

            return updatedFeeds;
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
        case 'CLEAN-FEEDS-FROM-OWN-FEEDS': {
            const feedsWithoutOwnFeeds = feeds
                .filter((feed: Feed) => !containsItem(action.payload.feedUrls, (feedUrl: string) => feedUrl === feed.feedUrl));
            return feedsWithoutOwnFeeds;
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
            const ind = ownFeeds.findIndex(feed => action.payload.partialFeed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return ownFeeds;
            }
            return updateArrayItem(ownFeeds, ind, (feed) => ({
                ...feed,
                ...action.payload.partialFeed,
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
        case 'CHANGE-SETTING-SWARM-GATEWAY-ADDRESS': {
            return {
                ...settings,
                swarmGatewayAddress: action.payload.value,
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
        case 'UPDATE-AUTHOR-IMAGE': {
            return {
                ...author,
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

const appStateReducer = (state: AppState = defaultState, action: Actions): AppState => {
    const startTime = Date.now();
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
                const newState = combinedReducers(state, action);
                if (action.type !== 'TIME-TICK') {
                    const elapsed = Date.now() - startTime;
                    // tslint:disable-next-line:no-console
                    console.log('appStateReducer', 'elapsed', elapsed, 'action', action, 'newState', newState);
                }
                return newState;
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
    contacts: contactsReducer,
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
    // tslint:disable-next-line:no-console
    console.log('initStore: ', store.getState());

    // @ts-ignore
    store.dispatch(AsyncActions.cleanupContentFilters());
    store.dispatch(Actions.cleanFeedsFromOwnFeeds(store.getState().ownFeeds.map(feed => feed.feedUrl)));
    for (const ownFeed of store.getState().ownFeeds) {
        store.dispatch(Actions.updateOwnFeed({
            ...ownFeed,
            isSyncing: false,
        }));
    }
    // @ts-ignore
    store.dispatch(AsyncActions.cleanUploadingPostState());
    store.dispatch(Actions.timeTick());
    // @ts-ignore
    store.dispatch(AsyncActions.registerBackgroundTasks());
    // @ts-ignore
    store.dispatch(AsyncActions.downloadFollowedFeedPosts());

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
