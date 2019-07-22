import { PersistConfig, createMigrate, KEY_PREFIX, getStoredState } from 'redux-persist';
import { immutableTransformHack } from '../reducers/immutableTransformHack';
import { currentAppStateVersion, AppState } from '../reducers/AppState';
import { migrateAppState } from '../reducers/migration';
import { AsyncStorage, Platform } from 'react-native';
import { AppStateV3 } from '../reducers/version3';

class LegacyPersistConfig implements PersistConfig {
    public transforms = [immutableTransformHack({
        whitelist: ['contentFilters', 'feeds', 'ownFeeds', 'rssPosts', 'localPosts', 'postUploadQueue'],
    })];
    public blacklist = ['currentTimestamp'];
    public key = 'root';
    public storage = AsyncStorage;
    public version = currentAppStateVersion;
    public migrate = createMigrate(migrateAppState, { debug: false });
}

const legacyPersistConfig = new LegacyPersistConfig();

export const getLegacyAppState = async (): Promise<AppStateV3 | null> => {
    try {
        const serializedAppState = await getLegacySerializedAppState();
        const appState = await getLegacyAppStateFromSerialized(serializedAppState);
        return await migrateLegacyAppStateToCurrentVersion(appState);
    } catch (e) {
        return null;
    }

};

export const getLegacySerializedAppState = async (): Promise<string> => {
    const serializedAppState = await legacyPersistConfig.storage.getItem(KEY_PREFIX + legacyPersistConfig.key);
    if (serializedAppState != null) {
        return serializedAppState;
    }
    throw new Error('serialized app state is null');
};

export const getLegacyAppStateFromSerialized = async (serializedAppState: string): Promise<AppState> => {
    const storagePersistConfig = {
        ...legacyPersistConfig,
        storage: {
            getItem: (key: string) => new Promise<string>((resolve, reject) => resolve(serializedAppState)),
            setItem: (key: string, value: any) => { /* do nothing */ },
            removeItem: (key: string) => { /* do nothing */ },
        },
    };
    const appState = await getStoredState(storagePersistConfig) as AppState;
    return appState;
};

export const migrateLegacyAppStateToCurrentVersion = async (appState: AppState): Promise<AppState> => {
    const currentVersionAppState = await legacyPersistConfig.migrate(appState, currentAppStateVersion) as AppState;
    return currentVersionAppState;
};
