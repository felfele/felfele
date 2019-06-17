import { PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Author } from '../models/Author';
import { Metadata } from '../models/Metadata';
import { Settings } from '../models/Settings';
import { LocalFeed } from '../social/api';
import { AppStateV2 } from './version2';
import { Contact } from '../models/Contact';

export interface AppStateV3 extends PersistedState {
    contentFilters: ContentFilter[];
    feeds: Feed[];
    ownFeeds: LocalFeed[];
    settings: Settings;
    author: Author;
    currentTimestamp: number;
    rssPosts: Post[];
    localPosts: Post[];
    draft: Post | null;
    metadata: Metadata;
    contacts: Contact[];
}

export const migrateVersion2ToVersion3 = (state: PersistedState): AppStateV3 => {
    Debug.log('Migrate version 2 to version 3');
    const appStateV2 = state as AppStateV2;
    const appStateV3 = {
        ...appStateV2,
        contacts: [],
    };
    return appStateV3;
};
