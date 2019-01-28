import { MigrationManifest, PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { ApplicationState } from '../models/ApplicationState';

export const currentAppStateVersion = 1;

const migrateUnversionedToVersion0 = (state: PersistedState): ApplicationState => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as ApplicationState;
    const version0AppState = {
        ...appState,
        feeds: appState.feeds.map(feed => ({
            ...feed,
            followed: true,
        })),
    };
    return version0AppState;
};

const migrateVersion0ToVersion1 = (state: PersistedState): ApplicationState => {
    Debug.log('Migrate unversioned to version 0');
    const version0AppState = state as ApplicationState;
    const version1AppState = {
        ...version0AppState,
        avatarStore: {},
    };
    return version1AppState;
};

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
    1: migrateVersion0ToVersion1,
};
