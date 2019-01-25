import { getStoredState } from 'redux-persist';
import { currentAppStateVersion } from './migration';
import { AppState } from '../models/AppState';
import { persistConfig } from './index';

export const getAppStateFromSerialized = async (serializedAppState: string): Promise<AppState> => {
    const storagePersistConfig = {
        ...persistConfig,
        storage: {
            getItem: (key) => new Promise<string>((resolve, reject) => resolve(serializedAppState)),
            setItem: (key, value) => { },
            removeItem: (key) => { },
        },
    };
    const appState = await getStoredState(storagePersistConfig) as AppState;
    return appState;
};
export const migrateAppStateToCurrentVersion = async (appState: AppState): Promise<AppState> => {
    const currentVersionAppState = await persistConfig.migrate(appState, currentAppStateVersion) as AppState;
    return currentVersionAppState;
};
