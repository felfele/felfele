import { getStoredState } from 'redux-persist';
import { currentAppStateVersion } from './migration';
import { ApplicationState } from '../models/ApplicationState';
import { persistConfig } from './index';

export const getAppStateFromSerialized = async (serializedAppState: string): Promise<ApplicationState> => {
    const storagePersistConfig = {
        ...persistConfig,
        storage: {
            getItem: (key) => new Promise<string>((resolve, reject) => resolve(serializedAppState)),
            setItem: (key, value) => { },
            removeItem: (key) => { },
        },
    };
    const appState = await getStoredState(storagePersistConfig) as ApplicationState;
    return appState;
};
export const migrateAppStateToCurrentVersion = async (appState: ApplicationState): Promise<ApplicationState> => {
    const currentVersionAppState = await persistConfig.migrate(appState, currentAppStateVersion) as ApplicationState;
    return currentVersionAppState;
};
