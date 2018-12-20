import { Model } from './Model';

export interface Feed extends Model {
    name: string;
    url: string;
    feedUrl: string;
    favicon: string;
    favorite?: boolean;
    contentHash?: string;
}

export type FeedProperties = keyof Feed;

export function filterFeeds(property: FeedProperties, value: Feed[FeedProperties], feeds: Feed[]): Feed[] {
    return feeds.filter((feed: Feed) => {
        return feed[property] === value;
    });
}
