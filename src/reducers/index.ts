import { List } from 'immutable';
import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
} from 'redux';
import { AsyncStorage } from 'react-native';
import thunkMiddleware from 'redux-thunk';

import {
    ActionTypes,
} from '../actions/Actions';
import { ContentFilter } from '../models/ContentFilter';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import * as immutableTransform from 'redux-persist-transform-immutable';
import { Feed } from '../models/Feed';
import { Settings } from '../models/Settings';

export interface AppState {
    contentFilters: List<ContentFilter>;
    feeds: List<Feed>;
    settings: Settings;
}

const defaultSettings: Settings = {
    saveToCameraRoll: true,
};

const defaultState: AppState = {
    contentFilters: List<ContentFilter>(),
    feeds: List<Feed>(),
    settings: defaultSettings,
};

const contentFiltersReducer = (contentFilters = List<ContentFilter>(), action: ActionTypes): List<ContentFilter> => {
    switch (action.type) {
        case 'ADD-CONTENT-FILTER': {
            const filter: ContentFilter = {
                filter: action.filter,
                createdAt: action.createdAt,
                validUntil: action.validUntil,
            };
            return contentFilters.push(filter);
        }
        case 'REMOVE-CONTENT-FILTER': {
            const ind = contentFilters.findIndex(filter => filter != null && action.filter.filter === filter.filter);
            return contentFilters.remove(ind);
        }
        default: {
            return contentFilters;
        }
    }
};

const feedsReducer = (feeds = List<Feed>(), action: ActionTypes): List<Feed> => {
    switch (action.type) {
        case 'ADD-FEED': {
            return feeds.push(action.feed);
        }
        case 'REMOVE-FEED': {
            const ind = feeds.findIndex(feed => feed != null && action.feed.feedUrl === feed.feedUrl);
            return feeds.remove(ind);
        }
        default: {
            return feeds;
        }
    }
};

const settingsReducer = (settings = defaultSettings, action: ActionTypes): Settings => {
    return settings;
};

const persistConfig = {
    transforms: [immutableTransform({
        whitelist: ['contentFilters', 'feeds'],
    })],
    blacklist: [''],
    key: 'root',
    storage: AsyncStorage,
};

export const reducer = combineReducers<AppState>({
    contentFilters: contentFiltersReducer,
    feeds: feedsReducer,
    settings: settingsReducer,
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
