import { List } from 'immutable';
import {
    createStore,
    combineReducers,
    applyMiddleware,
    compose,
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import {
    ActionTypes,
} from '../actions/Actions';
import { ContentFilter } from '../models/ContentFilter';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import * as immutableTransform from 'redux-persist-transform-immutable';
import { Feed } from '../models/Feed';

export interface AppState {
    contentFilters: List<ContentFilter>;
    feeds: List<Feed>;

}
const defaultState: AppState = {
    contentFilters: List<ContentFilter>(),
    feeds: List<Feed>(),
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
        default: {
            return List<ContentFilter>();
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
            return List<Feed>();
        }
    }
};
const persistConfig = {
    transforms: [immutableTransform()],
    key: 'root',
    storage,
};

export const reducer = combineReducers<AppState>({
    contentFilters: contentFiltersReducer,
    feeds: feedsReducer,
});

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = createStore(
    persistedReducer,
    defaultState,
    compose(
        applyMiddleware(thunkMiddleware),
    )
);
export const persistor = persistStore(store);

console.log('store: ', store.getState());
store.subscribe(() => console.log('store updated: ', store.getState()));
