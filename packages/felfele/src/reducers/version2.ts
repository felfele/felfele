import { PersistedState } from 'redux-persist';
import { Debug } from '../Debug';
import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Author } from '../models/Author';
import { Metadata } from '../models/Metadata';
import { Settings } from '../models/Settings';
import { LocalFeed } from '../social/api';
import { AppStateV1 } from './version1';
import * as Swarm from '../swarm/Swarm';

export interface AppStateV2 extends PersistedState {
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
}

export const migrateVersion1ToVersion2 = (state: PersistedState): AppStateV2 => {
    Debug.log('Migrate version 1 to version 2');
    const appStateV1 = state as AppStateV1;
    const appStateV2 = {
        ...appStateV1,
        ownFeeds: appStateV1.ownFeeds.map(localFeed => ({
            ...localFeed,
            autoShare: false,
        })),
        settings: {
            ...appStateV1.settings,
            swarmGatewayAddress: Swarm.defaultGateway,
        },
    };
    return appStateV2;
};
