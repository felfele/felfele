import { PersistedState } from 'redux-persist';
import { Debug, defaultGateway } from '@felfele/felfele-core';
import { ContentFilter } from '@felfele/felfele-core';
import { Feed } from '@felfele/felfele-core';
import { Post } from '@felfele/felfele-core';
import { Author } from '@felfele/felfele-core';
import { Metadata } from '@felfele/felfele-core';
import { Settings } from '@felfele/felfele-core';
import { LocalFeed } from '@felfele/felfele-core';
import { AppStateV1 } from './version1';

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
            swarmGatewayAddress: defaultGateway,
        },
    };
    return appStateV2;
};
