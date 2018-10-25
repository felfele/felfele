import { Feed } from './models/Feed';
import { PublicPost } from './models/Post';
import { generateUnsecureRandomString } from './random';
import * as Swarm from './Swarm';

interface PostFeed extends Feed {
    posts: PublicPost[];
}

const SWARM_PREFIX = Swarm.DefaultGateway + Swarm.DefaultUrlScheme;
const HASH_SERVICE_URL = 'http://feeds.helmethair.co/feeds/';

export const createPostFeed = async (name: string, favicon: string, firstPost: PublicPost): Promise<PostFeed> => {
    const randomHash = generateUnsecureRandomString(32);
    const url = SWARM_PREFIX + randomHash;
    const postFeed: PostFeed = {
        name,
        url,
        feedUrl: url,
        favicon,
        posts: [firstPost],
    };
    return await updatePostFeed(postFeed);
};

export const isPostFeedUrl = (url: string): boolean => {
    return url.startsWith(SWARM_PREFIX);
};

const hashFromUrl = (url: string): string => {
    if (isPostFeedUrl(url)) {
        return url.slice(SWARM_PREFIX.length);
    }
    return url;
};

export const updatePostFeed = async (postFeed: PostFeed): Promise<PostFeed> => {
    try {
        const postFeedJson = JSON.stringify(postFeed);
        const contentHash = await Swarm.upload(postFeedJson);
        const databaseId = await updateHash(hashFromUrl(postFeed.url), contentHash);
        return {
            ...postFeed,
        };
    } catch (e) {
        console.log('updatePostFeed failed, ', e);
        return postFeed;
    }
};

const updateHash = async (locationHash: string, contentHash: string): Promise<string> => {
    const timestamp = Date.now();
    const body = JSON.stringify({contentHash, locationHash, timestamp});
    const rawResponse = await fetch(HASH_SERVICE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body,
    });
    const response = await rawResponse.json();
    console.log('updateHash: response: ', response, rawResponse.status, body);
    return response.id;
};

const downloadHash = async (locationHash: string): Promise<string> => {
    const rawResponse = await fetch(HASH_SERVICE_URL + '?locationHash=' + locationHash + '&_sort=timestamp&_order=desc&_limit=1');
    const response = await rawResponse.json();
    console.log('downloadHash: response: ', response, response.contentHash, rawResponse.status);
    return response[0].contentHash;
};

export const downloadPostFeed = async (url: string): Promise<PostFeed> => {
    const hash = hashFromUrl(url);
    const contentHash = await downloadHash(hash);
    console.log('downloadPostFeed: contentHash: ', contentHash);
    try {
        const content = await Swarm.downloadData(contentHash);
        console.log('downloadPostFeed: content: ', content);
        const postFeed = JSON.parse(content);
        return postFeed;
    } catch (e) {
        console.log('downloadPostFeed failed: ', e);
        return {posts: [], name: '', url: '', feedUrl: '', favicon: ''};
    }
};

export const loadPosts = async (postFeeds: Feed[]): Promise<PublicPost[]> => {
    const loadFeedPromises = postFeeds.map(feed => downloadPostFeed(feed.feedUrl));
    const feeds = await Promise.all(loadFeedPromises);
    let posts: PublicPost[] = [];
    for (const feed of feeds) {
        posts = posts.concat(feed.posts);
    }
    return posts;
};
