import { MigrationManifest, PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { AppState } from '.';
import { RecentPostFeed, shareNewPost } from '../social/api';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Settings } from '../models/Settings';
import { PublicPost, Post, Author } from '../models/Post';
import { Metadata } from '../models/Metadata';
import { PostCommandLog, emptyPostCommandLog } from '../social/api';

export const currentAppStateVersion = 1;

const migrateUnversionedToVersion0 = (state: PersistedState): AppState => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as AppState;
    const version0AppState = {
        ...appState,
        feeds: appState.feeds.map(feed => ({
            ...feed,
            followed: true,
        })),
    };
    return version0AppState;
};

export interface AppStateV0 extends PersistedState {
    contentFilters: ContentFilter[];
    feeds: Feed[];
    ownFeeds: RecentPostFeed[];
    settings: Settings;
    author: Author;
    currentTimestamp: number;
    rssPosts: Post[];
    localPosts: Post[];
    draft: Post | null;
    metadata: Metadata;
    postUploadQueue: Post[];
}

const makePostCommandLogFromPosts = (posts: PublicPost[]): PostCommandLog => {
    return posts.reduceRight<PostCommandLog>(
        (log, post) => shareNewPost(post, '', log),
        emptyPostCommandLog,
    );
};

const migrateVersion0ToVersion1 = (state: PersistedState): AppState => {
    Debug.log('Migrate unversioned to version 0');
    const appState = state as AppStateV0;
    const version1AppState = {
        ...appState,
        ownFeeds: appState.ownFeeds.map(ownFeed => ({
            ...ownFeed,
            isSyncing: false,
            postCommandLog: makePostCommandLogFromPosts(ownFeed.posts),
        })),
    };
    return version1AppState;
};

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
    1: migrateVersion0ToVersion1,
};
