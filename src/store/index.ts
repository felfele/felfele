// @ts-ignore
import FSStorage from 'redux-persist-fs-storage';
// @ts-ignore
import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import thunkMiddleware from 'redux-thunk';
import {
    createMigrate,
    PersistConfig,
    persistReducer,
    persistStore,
    getStoredState,
} from 'redux-persist';
import { createStore, compose, applyMiddleware } from 'redux';

import { currentAppStateVersion, AppState } from '../reducers/AppState';
import { migrateAppState } from '../reducers/migration';
import { immutableTransformHack } from '../reducers/immutableTransformHack';
import { appStateReducer } from '../reducers';
import { defaultState } from '../reducers/defaultData';
import { Actions, AsyncActions } from '../actions/Actions';
import { getLegacyAppState } from './legacy';

// This is not very nice, but it's initialized at app startup
export let persistConfig: FelfelePersistConfig;

const getStorageEngine = async () => {
    return Platform.OS === 'ios'
        ? await RNFS.pathForGroup('group.app.felfele').then((folder: any) => FSStorage(folder))
        : FSStorage();
};

class FelfelePersistConfig implements PersistConfig {
    public transforms = [immutableTransformHack({
        whitelist: ['contentFilters', 'feeds', 'ownFeeds', 'rssPosts', 'localPosts', 'postUploadQueue'],
    })];
    public blacklist = ['currentTimestamp'];
    public key = 'root';
    public keyPrefix = '';
    public version = currentAppStateVersion;
    public migrate = createMigrate(migrateAppState, { debug: false });

    constructor(public storage: any) { }
}

export const initStore = async () => {
    const storageEngine = await getStorageEngine();
    persistConfig = new FelfelePersistConfig(storageEngine);
    const persistedReducer = persistReducer(persistConfig, appStateReducer);

    const legacyAppState = await getLegacyAppState();
    const initialState = legacyAppState != null ? legacyAppState : defaultState;

    const storeInner = createStore(
        persistedReducer,
        initialState,
        compose(
            applyMiddleware(thunkMiddleware),
        ),
    );

    const initAppActions = () => {
        // tslint:disable-next-line:no-console
        console.log('initStore: ', storeInner.getState());

        // @ts-ignore
        storeInner.dispatch(AsyncActions.cleanupContentFilters());
        storeInner.dispatch(Actions.cleanFeedsFromOwnFeeds(storeInner.getState().ownFeeds.map(feed => feed.feedUrl)));
        for (const ownFeed of storeInner.getState().ownFeeds) {
            storeInner.dispatch(Actions.updateOwnFeed({
                ...ownFeed,
                isSyncing: false,
            }));
        }
        // @ts-ignore
        storeInner.dispatch(AsyncActions.cleanUploadingPostState());
        storeInner.dispatch(Actions.timeTick());
        // @ts-ignore
        storeInner.dispatch(AsyncActions.registerBackgroundTasks());
        // @ts-ignore
        storeInner.dispatch(AsyncActions.downloadFollowedFeedPosts());

        setInterval(() => storeInner.dispatch(Actions.timeTick()), 60000);
    };

    const persistorInner = persistStore(storeInner, {}, () => {
        initAppActions();
    });

    return {
        store: storeInner,
        persistor: persistorInner,
        persistConfig,
    };
};

export const getSerializedAppState = async (): Promise<string> => {
    const serializedAppState = await persistConfig.storage.getItem(persistConfig.key);
    if (serializedAppState != null) {
        return serializedAppState;
    }
    throw new Error('serialized app state is null');
};

export const getAppStateFromSerialized = async (serializedAppState: string): Promise<AppState> => {
    const storagePersistConfig = {
        ...persistConfig,
        storage: {
            getItem: (key: string) => new Promise<string>((resolve, reject) => resolve(serializedAppState)),
            setItem: (key: string, value: any) => { /* do nothing */ },
            removeItem: (key: string) => { /* do nothing */ },
        },
    };
    const appState = await getStoredState(storagePersistConfig) as AppState;
    return appState;
};

export const migrateAppStateToCurrentVersion = async (appState: AppState): Promise<AppState> => {
    const currentVersionAppState = await persistConfig.migrate(appState, currentAppStateVersion) as AppState;
    return currentVersionAppState;
};
