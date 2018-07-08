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

export interface AppState {
    contentFilters: List<ContentFilter>;
}
const defaultState: AppState = {
    contentFilters: List<ContentFilter>(),
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
    }
    return List<ContentFilter>();
};

export const reducer = combineReducers<AppState>({
    contentFilters: contentFiltersReducer,
});

export const store = createStore(
    reducer,
    defaultState,
    compose(
        applyMiddleware(thunkMiddleware),
    ),
);

console.log('store: ', store.getState());
store.subscribe(() => console.log(store.getState()));
