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
import { ContactFeed } from '../models/ContactFeed';
import { MutualContact } from '../models/Contact';
import { publicKeyToIdentity } from './contactHelpers';
import { makeEmptyPrivateChannel } from '../protocols/privateChannel';

export const isRecentPostFeed = (feed: Feed): feed is RecentPostFeed => {
    return (feed as RecentPostFeed).authorImage != null;
};

export const isLocalFeed = (feed: Feed): feed is LocalFeed => {
    return (feed as LocalFeed).postCommandLog != null;
};

export const isContactFeed = (feed: Feed): feed is ContactFeed => {
    return (feed as ContactFeed).contact != null;
};

export const makeContactFeedFromMutualContact = (contact: MutualContact): ContactFeed => ({
    name: contact.name,
    url: makeBzzFeedUrlFromIdentity(contact.identity),
    feedUrl: makeBzzFeedUrlFromIdentity(contact.identity),
    favicon: contact.image.uri || '',
    followed: true,
    contact,
});

export const makeContactFromRecentPostFeed = (feed: RecentPostFeed): MutualContact | undefined => {
    if (feed.publicKey == null) {
        return undefined;
    }
    try {
        const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(feed.feedUrl);
        const identity = publicKeyToIdentity(feed.publicKey);
        if (feedAddress.user !== identity.address) {
            return undefined;
        }
        return {
            type: 'mutual-contact',
            name: feed.name,
            image: feed.authorImage,
            identity,
            privateChannel: makeEmptyPrivateChannel(),
        };
    } catch (e) {
        return undefined;
    }
};

export const getFeedImage = (feed: Feed): ImageData => {
    if (isBundledImage(feed.favicon)) {
        return {
            localPath: feed.favicon,
        };
    }
    const image: ImageData = (feed as RecentPostFeed).authorImage != null
        ? (feed as RecentPostFeed).authorImage
        : { uri: feed.favicon }
    ;
    return image;
};

export const sortFeedsByName = (feeds: Feed[]): Feed[] => {
    return feeds.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
};

export const makeBzzFeedUrlFromIdentity = (identity: PublicIdentity): string => {
    const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(identity);
    const feedUrl = Swarm.makeBzzFeedUrl(feedAddress);
    return feedUrl;
};

export const fetchRecentPostFeed = async (feedAddress: Swarm.FeedAddress, swarmGateway: string): Promise<RecentPostFeed | null> => {
    const bzzUrl = Swarm.makeBzzFeedUrl(feedAddress);
    const swarm = Swarm.makeReadableApi(feedAddress, swarmGateway);
    const feed: RecentPostFeed = await downloadRecentPostFeed(swarm, bzzUrl, 60 * 1000);
    return feed;
};

export const fetchFeedFromUrl = async (url: string, swarmGateway: string): Promise<Feed | RecentPostFeed | ContactFeed | null> => {
    try {
        if (url.startsWith(Swarm.defaultFeedPrefix)) {
            const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(url);
            const feed = await fetchRecentPostFeed(feedAddress, swarmGateway);
            if (feed != null && feed.publicKey != null) {
                return {
                    ...feed,
                    contact: makeContactFromRecentPostFeed(feed),
                };
            }
            return feed;
        } else {
            Debug.log('fetchFeedFromUrl', 'url', url);
            const canonicalUrl = urlUtils.getCanonicalUrl(url);
            Debug.log('fetchFeedFromUrl', 'canonicalUrl', canonicalUrl);
            const feed = await RSSFeedManager.fetchFeedFromUrl(canonicalUrl);
            Debug.log('fetchFeedFromUrl', 'feed', feed);
            return feed;
        }
    } catch (e) {
        Debug.log(e);
        return null;
    }
};

export const fetchRSSFeedFromUrl = async (url: string): Promise<Feed | null> => {
    try {
        Debug.log('fetchFeedFromUrl', 'url', url);
        const canonicalUrl = urlUtils.getCanonicalUrl(url);
        Debug.log('fetchFeedFromUrl', 'canonicalUrl', canonicalUrl);
        const feed = await RSSFeedManager.fetchFeedFromUrl(canonicalUrl);
        Debug.log('fetchFeedFromUrl', 'feed', feed);
        return feed;
    } catch (e) {
        Debug.log(e);
        return null;
    }
};
