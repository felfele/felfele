import { Feed } from './models/Feed';
import { PublicPost, Author } from './models/Post';
import { ImageData } from './models/ImageData';
import * as Swarm from './Swarm';
import { uploadPost, uploadImages } from './PostUpload';
import { Debug } from './Debug';

interface PostFeed extends Feed {
    posts: PublicPost[];
    authorImage: ImageData;
}

const SWARM_PREFIX = Swarm.DefaultPrefix;
const HASH_SERVICE_URL = 'http://feeds.helmethair.co/feeds/';

export const createPostFeed = async (swarmFeedApi: Swarm.FeedApi, author: Author, firstPost: PublicPost): Promise<PostFeed> => {
    const url = swarmFeedApi.getUri();
    const uploadedImages = await uploadImages([author.image!]);
    const uploadedPost = await uploadPost(firstPost);
    const postFeed: PostFeed = {
        name: author.name,
        url,
        feedUrl: url,
        favicon: uploadedImages[0].localPath!,
        posts: [uploadedPost],
        authorImage: uploadedImages[0],
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
        Debug.log('updatePostFeed failed, ', e);
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
    Debug.log('updateHash: response: ', response, rawResponse.status, body);
    return response.id;
};

const downloadHashFromService = async (locationHash: string): Promise<string> => {
    const rawResponse = await fetch(HASH_SERVICE_URL + '?locationHash=' + locationHash + '&_sort=timestamp&_order=desc&_limit=1');
    const response = await rawResponse.json();
    Debug.log('downloadHash: response: ', response, response.contentHash, rawResponse.status);
    return response[0].contentHash;
};

export const downloadPostFeed = async (swarmFeedApi: Swarm.FeedApi, url: string): Promise<PostFeed> => {
    const contentHash = await swarmFeedApi.downloadFeed(url);
    Debug.log('downloadPostFeed: contentHash: ', contentHash);
    try {
        const content = await Swarm.downloadData(contentHash);
        Debug.log('downloadPostFeed: content: ', content);
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
        Debug.log('downloadPostFeed failed: ', e);
        return {
            posts: [],
            name: '',
            url: '',
            feedUrl: '',
            favicon: '',
            authorImage: {
                localPath: '',
            },
        };
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
