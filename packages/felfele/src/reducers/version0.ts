import { PersistedState } from 'redux-persist';
import { Debug } from '@felfele/felfele-core';
import { RecentPostFeed } from '@felfele/felfele-core';
import { ContentFilter } from '@felfele/felfele-core';
import { Feed } from '@felfele/felfele-core';
import { Post } from '@felfele/felfele-core';
import { Author } from '@felfele/felfele-core';
import { Metadata } from '@felfele/felfele-core';

interface SettingsV0 {
    saveToCameraRoll: boolean;
    showSquareImages: boolean;
    showDebugMenu: boolean;
}

export interface AppStateV0 extends PersistedState {
    contentFilters: ContentFilter[];
    feeds: Feed[];
    ownFeeds: RecentPostFeed[];
    settings: SettingsV0;
    author: Author;
    currentTimestamp: number;
    rssPosts: Post[];
    localPosts: Post[];
    draft: Post | null;
    metadata: Metadata;
    postUploadQueue: Post[];
}

export const migrateUnversionedToVersion0 = (state: PersistedState): AppStateV0 => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as any;
    const version0AppState = {
        ...appState,
        feeds: appState.feeds.map((feed: Feed) => ({
            ...feed,
            followed: true,
        })),
        postUploadQueue: [],
    };
    return version0AppState;
};
