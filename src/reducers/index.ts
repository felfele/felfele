import { List } from 'immutable';
import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
} from 'redux';
import { AsyncStorage } from 'react-native';
import thunkMiddleware from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';

import { immutableTransform } from './immutableTransform';
import { Actions, AsyncActions } from '../actions/Actions';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Settings } from '../models/Settings';
import { Post, Author } from '../models/Post';
import { Debug } from '../Debug';
import { getImageUri } from '../models/ImageData';

export interface AppState {
    contentFilters: List<ContentFilter>;
    feeds: List<Feed>;
    ownFeeds: List<Feed>;
    settings: Settings;
    author: Author;
    currentTimestamp: number;
    rssPosts: List<Post>;
    localPosts: List<Post>;
    draft: Post | null;
    metadata: Metadata;
    postUploadQueue: List<Post>;
}

interface Metadata {
    highestSeenPostId: number;
}

const defaultSettings: Settings = {
    saveToCameraRoll: true,
    showSquareImages: true,
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
};

const defaultPost1: Post = {
    _id: 0,
    createdAt: 0,
    images: [],
    text: `Basic features:.

Post text and images privately, and later add the posts to your public feed.

Follow the public feed of others, or add your favorite RSS/Atom feeds.

If you feel overwhelmed by the news, you can define your own filters in the Settings.`,
    author: onboardingAuthor,
};
const defaultPost2: Post = {
    _id: 1,
    createdAt: 0,
    images: [{
        uri: '../../images/addrss.gif',
    }],
    text: `Adding an RSS feed`,
    author: onboardingAuthor,
};

const defaultPost3: Post = {
    _id: 2,
    createdAt: 0,
    images: [],
    text: `You can follow others by getting an invite link from them. It can be sent on any kind of channel, or you can read your friend's QR code from his phone`,
    author: onboardingAuthor,
};

const defaultLocalPosts = List.of(defaultPost1, defaultPost2, defaultPost3);

const defaultCurrentTimestamp = 0;

const defaultMetadata = {
    highestSeenPostId: 2,
};

const defaultState: AppState = {
    contentFilters: List<ContentFilter>(),
    feeds: List<Feed>(),
    ownFeeds: List<Feed>(),
    settings: defaultSettings,
    author: defaultAuthor,
    currentTimestamp: defaultCurrentTimestamp,
    rssPosts: List<Post>(),
    localPosts: defaultLocalPosts,
    draft: null,
    metadata: defaultMetadata,
    postUploadQueue: List<Post>(),
};

const contentFiltersReducer = (contentFilters = List<ContentFilter>(), action: Actions): List<ContentFilter> => {
    switch (action.type) {
        case 'ADD-CONTENT-FILTER': {
            const filter: ContentFilter = {
                text: action.payload.text,
                createdAt: action.payload.createdAt,
                validUntil: action.payload.validUntil,
            };
            return contentFilters.push(filter);
        }
        case 'REMOVE-CONTENT-FILTER': {
            const ind = contentFilters.findIndex(filter => filter != null && action.payload.filter.text === filter.text);
            if (ind === -1) {
                return contentFilters;
            }
            return contentFilters.remove(ind);
        }
        default: {
            return contentFilters;
        }
    }
};

const feedsReducer = (feeds = List<Feed>(), action: Actions): List<Feed> => {
    switch (action.type) {
        case 'ADD-FEED': {
            return feeds.push(action.payload.feed);
        }
        case 'REMOVE-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return feeds.remove(ind);
        }
        default: {
            return feeds;
        }
    }
};

const ownFeedsReducer = (ownFeeds = List<Feed>(), action: Actions): List<Feed> => {
    switch (action.type) {
        case 'ADD-OWN-FEED': {
            return ownFeeds.push(action.payload.feed);
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
                faviconUri: getImageUri(action.payload.image),
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

const rssPostsReducer = (rssPosts = List<Post>(), action: Actions): List<Post> => {
    switch (action.type) {
        case 'UPDATE-RSS-POSTS': {
            return List<Post>(action.payload.posts);
        }
    }
    return rssPosts;
};

const localPostsReducer = (localPosts = defaultLocalPosts, action: Actions): List<Post> => {
    switch (action.type) {
        case 'ADD-POST': {
            return localPosts.insert(0, action.payload.post);
        }
        case 'DELETE-POST': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return localPosts.remove(ind);
        }
        case 'UPDATE-POST-LINK': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return localPosts.update(ind, (post => ({...post, link: action.payload.link})));
        }
        case 'UPDATE-POST-IS-UPLOADING': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return localPosts.update(ind, (post => ({...post, isUploading: action.payload.isUploading})));
        }
        case 'UPDATE-POST-IMAGES': {
            const ind = localPosts.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return localPosts;
            }
            return localPosts.update(ind, (post => ({...post, images: action.payload.images})));
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

const postUploadQueueReducer = (postUploadQueue = List<Post>(), action: Actions): List<Post> => {
    switch (action.type) {
        case 'QUEUE-POST-FOR-UPLOAD': {
            return postUploadQueue.push(action.payload.post);
        }
        case 'REMOVE-POST-FOR-UPLOAD': {
            const ind = postUploadQueue.findIndex(post => post != null && action.payload.post._id === post._id);
            if (ind === -1) {
                return postUploadQueue;
            }
            return postUploadQueue.remove(ind);
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
        default: {
            return combinedReducers(state, action);
        }
    }
};

const persistConfig = {
    transforms: [immutableTransform({
        whitelist: ['contentFilters', 'feeds', 'ownFeeds', 'rssPosts', 'localPosts', 'postUploadQueue'],
    })],
    blacklist: ['currentTimestamp'],
    key: 'root',
    storage: AsyncStorage,
};

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
    Debug.log('initStore: ', store.getState());
    store.dispatch(AsyncActions.cleanupContentFilters());
    store.dispatch(AsyncActions.uploadPostsFromQueue());
    patchState();
};

const patchState = () => {
    // placeholder to put patches to fix state
};

export const persistor = persistStore(store, {}, initStore);

Debug.log('store: ', store.getState());
