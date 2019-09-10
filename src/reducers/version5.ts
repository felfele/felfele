import { PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Author } from '../models/Author';
import { Metadata } from '../models/Metadata';
import { Settings } from '../models/Settings';
import { LocalFeed } from '../social/api';
import { AppStateV4 } from './version4';
import { Contact } from '../models/Contact';

export type PostListDict = {[key: string]: Post[]};

export interface AppStateV5 extends PersistedState {
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
    lastEditingApp: string | null;
    privatePosts: PostListDict;
}

export const migrateVersion4ToVersion5 = (state: PersistedState): AppStateV5 => {
    Debug.log('Migrate version 4 to version 5');
    const appStateV4 = state as AppStateV4;
    const appStateV5 = {
        ...appStateV4,
        privatePosts: {},
    };
    return appStateV5;
};