import { Feed } from '../models/Feed';
import { LocalFeed } from '../social/api';
import { ImageData } from '../models/ImageData';
import { isBundledImage } from './imageDataHelpers';
import * as Swarm from '../swarm/Swarm';
import { downloadRecentPostFeed } from '../swarm-social/swarmStorage';
import { Debug } from '../Debug';
import * as urlUtils from '../helpers/urlUtils';
import { RSSFeedManager } from '../RSSPostManager';

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

export const fetchFeedFromUrl = async (url: string, swarmGateway: string): Promise<Feed | null> => {
    try {
        if (url.startsWith(Swarm.defaultFeedPrefix)) {
            const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(url);
            const swarm = Swarm.makeReadableApi(feedAddress, swarmGateway);
            const feed: Feed = await downloadRecentPostFeed(swarm, url, 60 * 1000);
            return feed;
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
