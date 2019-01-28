import { PersistedState } from 'redux-persist';
import { ContentFilter } from './ContentFilter';
import { Feed } from './Feed';
import { Settings } from './Settings';
import { Post, Author } from './Post';
import { PostFeed } from '../PostFeed';
import { Dict } from '../helpers/types';

export interface Metadata {
    highestSeenPostId: number;
}

export interface ApplicationState extends PersistedState {
    contentFilters: ContentFilter[];
    feeds: Feed[];
    ownFeeds: PostFeed[];
    settings: Settings;
    author: Author;
    currentTimestamp: number;
    rssPosts: Post[];
    localPosts: Post[];
    draft: Post | null;
    metadata: Metadata;
    avatarStore: Dict<string>;
    postUploadQueue: Post[];
}
