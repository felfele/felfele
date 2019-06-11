import { PersistedState } from 'redux-persist';
import { Debug, defaultGateway } from '@felfele/felfele-core';
import {
    RecentPostFeed,
    PostCommandLog,
    shareNewPost,
    emptyPostCommandLog,
} from '@felfele/felfele-core';
import { ContentFilter } from '@felfele/felfele-core';
import { Feed } from '@felfele/felfele-core';
import { Post, PublicPost } from '@felfele/felfele-core';
import { Author } from '@felfele/felfele-core';
import { Metadata } from '@felfele/felfele-core';
import { Settings } from '@felfele/felfele-core';
import { AppStateV0 } from './version0';

const makePostCommandLogFromPosts = (posts: PublicPost[]): PostCommandLog => {
    return posts.reduceRight<PostCommandLog>(
        (log, post) => shareNewPost(post, '', log),
        emptyPostCommandLog,
    );
};

interface LocalFeedV1 extends RecentPostFeed {
    postCommandLog: PostCommandLog;
    isSyncing: boolean;
}

export interface AppStateV1 extends PersistedState {
    contentFilters: ContentFilter[];
    feeds: Feed[];
    ownFeeds: LocalFeedV1[];
    settings: Settings;
    author: Author;
    currentTimestamp: number;
    rssPosts: Post[];
    localPosts: Post[];
    draft: Post | null;
    metadata: Metadata;
}

export const migrateVersion0ToVersion1 = (state: PersistedState): AppStateV1 => {
    Debug.log('Migrate version 0 to version 1');
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
            swarmGatewayAddress: defaultGateway,
        },
        postUploadQueue: undefined,
    };
    return version1AppState;
};
