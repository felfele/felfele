import { PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { RecentPostFeed } from '../social/api';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Author } from '../models/Author';
import { Metadata } from '../models/Metadata';

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
