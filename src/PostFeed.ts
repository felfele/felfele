import { Feed } from './models/Feed';
import { PublicPost } from './models/Post';
import * as Swarm from './Swarm';
import { uploadPost } from './PostUpload';

interface PostFeed extends Feed {
    posts: PublicPost[];
}

const SWARM_PREFIX = Swarm.DefaultPrefix;
const HASH_SERVICE_URL = 'http://feeds.helmethair.co/feeds/';

export const createPostFeed = async (swarmFeedApi: Swarm.FeedApi, name: string, favicon: string, firstPost: PublicPost): Promise<PostFeed> => {
    const url = swarmFeedApi.getUri();
    const uploadedFavicon = await Swarm.uploadPhoto(favicon);
    const uploadedPost = await uploadPost(firstPost);
    const postFeed: PostFeed = {
        name,
        url,
        feedUrl: url,
        favicon: uploadedFavicon,
        posts: [uploadedPost],
    };
    return await updatePostFeed(swarmFeedApi, postFeed);
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

export const updatePostFeed = async (swarmFeedApi: Swarm.FeedApi, postFeed: PostFeed): Promise<PostFeed> => {
    try {
        const postFeedJson = JSON.stringify(postFeed);
        const contentHash = await Swarm.upload(postFeedJson);
        await swarmFeedApi.update(contentHash);
        return {
            ...postFeed,
        };
    } catch (e) {
        console.log('updatePostFeed failed, ', e);
        return postFeed;
    }
};

const updateHashFromService = async (locationHash: string, contentHash: string): Promise<string> => {
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

const downloadHashFromService = async (locationHash: string): Promise<string> => {
    const rawResponse = await fetch(HASH_SERVICE_URL + '?locationHash=' + locationHash + '&_sort=timestamp&_order=desc&_limit=1');
    const response = await rawResponse.json();
    console.log('downloadHash: response: ', response, response.contentHash, rawResponse.status);
    return response[0].contentHash;
};

export const downloadPostFeed = async (swarmFeedApi: Swarm.FeedApi, url: string): Promise<PostFeed> => {
    const contentHash = await swarmFeedApi.downloadFeed(url);
    console.log('downloadPostFeed: contentHash: ', contentHash);
    try {
        const content = await Swarm.downloadData(contentHash);
        console.log('downloadPostFeed: content: ', content);
        const postFeed = JSON.parse(content) as PostFeed;
        const postFeedWithGatewayImageLinks = {
            ...postFeed,
            posts: postFeed.posts.map(post => ({
                ...post,
                images: post.images.map(image => ({
                    ...image,
                    uri: Swarm.getSwarmGatewayUrl(image.uri!),
                })),
            })),
        };
        return postFeedWithGatewayImageLinks;
    } catch (e) {
        console.log('downloadPostFeed failed: ', e);
        return {posts: [], name: '', url: '', feedUrl: '', favicon: ''};
    }
};

export const loadPosts = async (swarmFeedApi: Swarm.FeedApi, postFeeds: Feed[]): Promise<PublicPost[]> => {
    const loadFeedPromises = postFeeds.map(feed => downloadPostFeed(swarmFeedApi, feed.feedUrl));
    const feeds = await Promise.all(loadFeedPromises);
    let posts: PublicPost[] = [];
    for (const feed of feeds) {
        posts = posts.concat(feed.posts);
    }
    return posts;
};
