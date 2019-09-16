import { PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Post, PrivatePost } from '../models/Post';
import { Author } from '../models/Author';
import { Metadata } from '../models/Metadata';
import { Settings } from '../models/Settings';
import { LocalFeed } from '../social/api';
import { AppStateV3 } from './version3';
import { Contact } from '../models/Contact';
import { makeEmptyPrivateChannel } from '../protocols/privateChannel';

export type PostListDict = {[key: string]: PrivatePost[]};

export interface AppStateV4 extends PersistedState {
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

export const migrateVersion3ToVersion4 = (state: PersistedState): AppStateV4 => {
    Debug.log('Migrate version 3 to version 4');
    const appStateV3 = state as AppStateV3;
    const appStateV4 = {
        ...appStateV3,
        lastEditingApp: null,
        privatePosts: {},
        contacts: appStateV3.contacts.map(contact => contact.type === 'mutual-contact'
            ? {
                ...contact,
                privateChannel: makeEmptyPrivateChannel(),
            }
            : contact
        ),
    };
    return appStateV4;
};
