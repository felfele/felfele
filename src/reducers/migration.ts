import { MigrationManifest, PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { AppState, AppStateV0 } from '.';
import { List } from 'immutable';
import { Feed } from '../models/Feed';

export const currentAppStateVersion = 1;

const migrateUnversionedToVersion0 = (state: PersistedState): AppStateV0 => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as AppStateV0;
    const version0AppState = {
        ...appState,
        feeds: List<Feed>(appState.feeds.toArray().map(feed => ({
            ...feed,
            followed: true,
        }))),
    };
    return version0AppState;
};

const migrateFrom0toVersion1 = (state: PersistedState): AppState => {
    Debug.log('Migrate from version 0 to version 1');
    const appState = state as AppStateV0;
    const version1AppState: AppState = {
        ...appState,
        contentFilters: appState.contentFilters.toArray(),
        feeds: appState.feeds.toArray(),
        ownFeeds: appState.ownFeeds.toArray(),
        rssPosts: appState.rssPosts.toArray(),
        localPosts: appState.localPosts.toArray(),
        postUploadQueue: appState.postUploadQueue.toArray(),
    };
    return version1AppState;
};

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
    1: migrateFrom0toVersion1,
};
