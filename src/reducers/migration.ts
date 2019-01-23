import { MigrationManifest, PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { AppState } from '.';

export const currentAppStateVersion = 0;

const migrateUnversionedToVersion0 = (state: PersistedState): AppState => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as AppState;
    const version0AppState = {
        ...appState,
        feeds: appState.feeds.map(feed => ({
            ...feed,
            followed: true,
        })),
    };
    return version0AppState;
};

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
};
