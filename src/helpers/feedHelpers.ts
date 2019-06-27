import { Feed } from '../models/Feed';
import { LocalFeed, RecentPostFeed } from '../social/api';
import { ImageData } from '../models/ImageData';
import { isBundledImage } from './imageDataHelpers';
import * as Swarm from '../swarm/Swarm';
import { downloadRecentPostFeed } from '../swarm-social/swarmStorage';
import { Debug } from '../Debug';
import * as urlUtils from '../helpers/urlUtils';
import { RSSFeedManager } from '../RSSPostManager';
import { PublicIdentity } from '../models/Identity';

export const getFeedImage = (feed: Feed): ImageData => {
    if (isBundledImage(feed.favicon)) {
        return {
            localPath: feed.favicon,
        };
    }
    const image: ImageData = (feed as LocalFeed).authorImage != null
        ? (feed as LocalFeed).authorImage
        : { uri: feed.favicon }
    ;
    return image;
};

export const sortFeedsByName = (feeds: Feed[]): Feed[] => {
    return feeds.sort((a, b) => a.name.localeCompare(b.name));
};

export const makeBzzFeedUrlFromIdentity = (identity: PublicIdentity): string => {
    const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(identity);
    return Swarm.makeBzzFeedUrl(feedAddress);
};

export const fetchRecentPostFeed = async (feedAddress: Swarm.FeedAddress, swarmGateway: string): Promise<RecentPostFeed | null> => {
    const bzzUrl = Swarm.makeBzzFeedUrl(feedAddress);
    const swarm = Swarm.makeReadableApi(feedAddress, swarmGateway);
    const feed: RecentPostFeed = await downloadRecentPostFeed(swarm, bzzUrl, 60 * 1000);
    return feed;
};

export const fetchFeedFromUrl = async (url: string, swarmGateway: string): Promise<Feed | RecentPostFeed| null> => {
    try {
        if (url.startsWith(Swarm.defaultFeedPrefix)) {
            const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(url);
            return fetchRecentPostFeed(feedAddress, swarmGateway);
        } else {
            Debug.log('fetchFeedFromUrl', 'url', url);
            const canonicalUrl = urlUtils.getCanonicalUrl(url);
            Debug.log('fetchFeedFromUrl', 'canonicalUrl', canonicalUrl);
            const feed = await RSSFeedManager.fetchFeedFromUrl(url);
            Debug.log('fetchFeedFromUrl', 'feed', feed);
            return feed;
        }
    } catch (e) {
        Debug.log(e);
        return null;
    }
};
