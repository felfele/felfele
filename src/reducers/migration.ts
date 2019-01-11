import { MigrationManifest, PersistedState } from 'redux-persist';
import { List } from 'immutable';

import { Debug } from '../Debug';
import { AppState } from '.';
import { Feed } from '../models/Feed';

const migrateUnversionedToVersion0 = (state: PersistedState): AppState => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as AppState;
    const version0AppState = {
        ...appState,
        feeds: List<Feed>(appState.feeds.toArray().map(feed => ({
            ...feed,
            followed: true,
        }))),
    };
    return version0AppState;
};

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
};
