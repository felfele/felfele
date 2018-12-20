import { List, Iterable } from 'immutable';
import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
} from 'redux';
import { AsyncStorage } from 'react-native';
import thunkMiddleware from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';

import immutableTransform from 'redux-persist-transform-immutable';
import { Actions, AsyncActions } from '../actions/Actions';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Settings } from '../models/Settings';
import { Post, Author } from '../models/Post';
import { Debug } from '../Debug';
import { getImageUri } from '../models/ImageData';
import { PostFeed } from '../PostFeed';

export interface AppState {
    contentFilters: List<ContentFilter>;
    feeds: List<Feed>;
    ownFeeds: List<PostFeed>;
    visitedFeeds: List<Feed>;
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

const defaultLocalPosts = List.of(defaultPost1, defaultPost2, defaultPost3);

const defaultCurrentTimestamp = 0;

const defaultMetadata = {
    highestSeenPostId: defaultLocalPosts.size - 1,
};

const defaultFeeds: Feed[] = [
    {
        name: 'The Verge',
        url: 'https://theverge.com/',
        feedUrl: 'https://www.theverge.com/rss/index.xml',
        favicon: 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395361/favicon-64x64.0.ico',
    },
    {
        name: 'Wired Photos',
        url: 'https://www.wired.com/',
        feedUrl: 'https://www.wired.com/feed/category/photo/latest/rss',
        favicon: '',
    },
    {
        name: '500px Blog',
        url: 'https://iso.500px.com',
        feedUrl: 'https://iso.500px.com/feed',
        favicon: 'https://iso.500px.com/wp-content/themes/photoform/favicon.ico',
    },
    {
        name: 'Favorite Places – Outdoor Photographer',
        url: 'https://www.outdoorphotographer.com',
        feedUrl: 'https://www.outdoorphotographer.com/on-location/favorite-places/feed/',
        favicon: 'https://www.outdoorphotographer.com/wp-content/themes/odp/assets/img/favicon.ico',
    },
];

const defaultState: AppState = {
    contentFilters: List<ContentFilter>(),
    feeds: List<Feed>(defaultFeeds),
    ownFeeds: List<PostFeed>(),
    visitedFeeds: List<Feed>(),
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

const feedsReducer = (feeds = List<Feed>(defaultFeeds), action: Actions): List<Feed> => {
    switch (action.type) {
        case 'ADD-FEED': {
            if (!feeds.find(feed => feed != null && feed.feedUrl === action.payload.feed.feedUrl)) {
                return feeds.push(action.payload.feed);
            }
            return feeds;
        }
        case 'REMOVE-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return feeds.remove(ind);
        }
        case 'UPDATE-FEED-FAVICON': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return feeds.update(ind, (feed) => ({
                ...feed,
                favicon: action.payload.favicon,
            }));
        }
        case 'TOGGLE-FEED-FAVORITE': {
            const ind = feeds.findIndex(feed => feed != null && action.payload.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return feeds;
            }
            return feeds.update(ind, (feed) => ({
                ...feed,
                favorite: !feed.favorite,
            }));
        }
        default: {
            return feeds;
        }
    }
};

const ownFeedsReducer = (ownFeeds = List<PostFeed>(), action: Actions): List<PostFeed> => {
    switch (action.type) {
        case 'ADD-OWN-FEED': {
            return ownFeeds.push(action.payload.feed);
        }
        default: {
            return ownFeeds;
        }
    }
};

const visitedFeedsReducer = (unfollowedFeeds = List<Feed>(), action: Actions): List<Feed> => {
    switch (action.type) {
        case 'ADD-FEED': {
            const ind = unfollowedFeeds.findIndex(feed => feed != null && action.payload.feed.feedUrl === feed.feedUrl);
            if (ind === -1) {
                return unfollowedFeeds;
            }
            return unfollowedFeeds.remove(ind);
        }
        case 'REMOVE-FEED': {
            return unfollowedFeeds.push(action.payload.feed);
        }
        default: {
            return unfollowedFeeds;
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

const removeItem = <T>(list: List<T>, predicate: (value?: T, index?: number, iter?: Iterable.Indexed<T>) => boolean): List<T> => {
    const ind = list.findIndex(predicate);
    if (ind >= 0) {
        return list.remove(ind);
    } else {
        return list;
    }
};

const localPostsReducer = (localPosts = defaultLocalPosts, action: Actions): List<Post> => {
    switch (action.type) {
        case 'ADD-POST': {
            if (action.payload.post._id === defaultLocalPosts.size) {
                return List.of(action.payload.post);
            }
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
        whitelist: ['contentFilters', 'feeds', 'ownFeeds', 'visitedFeeds', 'rssPosts', 'localPosts', 'postUploadQueue'],
    })],
    blacklist: ['currentTimestamp'],
    key: 'root',
    storage: AsyncStorage,
};

export const combinedReducers = combineReducers<AppState>({
    contentFilters: contentFiltersReducer,
    feeds: feedsReducer,
    ownFeeds: ownFeedsReducer,
    visitedFeeds: visitedFeedsReducer,
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
    // @ts-ignore
    store.dispatch(AsyncActions.cleanupContentFilters());
    // @ts-ignore
    store.dispatch(AsyncActions.uploadPostsFromQueue());
    patchState();
};

const patchState = () => {
    // placeholder to put patches to fix state
};

export const persistor = persistStore(store, {}, initStore);

Debug.log('store: ', store.getState());
