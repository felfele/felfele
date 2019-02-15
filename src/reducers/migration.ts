import { MigrationManifest, PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { AppState } from '.';
import { RecentPostFeed, shareNewPost } from '../social/api';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { PublicPost, Post, Author } from '../models/Post';
import { Metadata } from '../models/Metadata';
import { PostCommandLog, emptyPostCommandLog } from '../social/api';
import * as Swarm from '../swarm/Swarm';

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

export interface SettingsV0 {
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

const makePostCommandLogFromPosts = (posts: PublicPost[]): PostCommandLog => {
    return posts.reduceRight<PostCommandLog>(
        (log, post) => shareNewPost(post, '', log),
        emptyPostCommandLog,
    );
};

const migrateVersion0ToVersion1 = (state: PersistedState): AppState => {
    Debug.log('Migrate unversioned to version 0');
    const appStateV0 = state as AppStateV0;
    const version1AppState = {
        ...appStateV0,
        ownFeeds: appStateV0.ownFeeds.map(ownFeed => ({
            ...ownFeed,
            isSyncing: false,
            postCommandLog: makePostCommandLogFromPosts(ownFeed.posts),
        })),
        settings: {
            ...appStateV0.settings,
            swarmGatewayAddress: Swarm.defaultGateway,
        },
    };
    return version1AppState;
};

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
    1: migrateVersion0ToVersion1,
};
