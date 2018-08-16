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
import { HOUR } from '../DateUtils';
import { Post } from '../models/Post';

export interface AppState {
    contentFilters: List<ContentFilter>;
    feeds: List<Feed>;
    settings: Settings;
    currentTimestamp: number;
    rssPosts: List<Post>;
}

const defaultSettings: Settings = {
    saveToCameraRoll: true,
};

const defaultCurrentTimestamp = 0;

const defaultState: AppState = {
    contentFilters: List<ContentFilter>(),
    feeds: List<Feed>(),
    settings: defaultSettings,
    currentTimestamp: defaultCurrentTimestamp,
    rssPosts: List<Post>(),
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
            return feeds.remove(ind);
        }
        default: {
            return feeds;
        }
    }
};

const settingsReducer = (settings = defaultSettings): Settings => {
    return settings;
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

const persistConfig = {
    transforms: [immutableTransform({
        whitelist: ['contentFilters', 'feeds', 'rssPosts'],
    })],
    blacklist: ['currentTimestamp'],
    key: 'root',
    storage: AsyncStorage,
};

export const reducer = combineReducers<AppState>({
    contentFilters: contentFiltersReducer,
    feeds: feedsReducer,
    settings: settingsReducer,
    currentTimestamp: currentTimestampReducer,
    rssPosts: rssPostsReducer,
});

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = createStore(
    persistedReducer,
    defaultState,
    compose(
        applyMiddleware(thunkMiddleware),
    ),
);
export const persistor = persistStore(store);

console.log('store: ', store.getState());
store.subscribe(() => console.log('store updated: ', store.getState()));

store.dispatch(AsyncActions.loadLocalPosts());
store.dispatch(AsyncActions.cleanupContentFiltersAction());
setInterval(() => store.dispatch(AsyncActions.cleanupContentFiltersAction()), HOUR);
