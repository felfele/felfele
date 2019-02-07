import { Feed } from '../models/Feed';
import { PublicPost, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../swarm/Swarm';
import { uploadPost, uploadImage } from './swarmStorage';
import { Debug } from '../Debug';
import { ModelHelper } from '../models/ModelHelper';

export interface RecentPostFeed extends Feed {
    posts: PublicPost[];
    authorImage: ImageData;
}

export const createRecentPostFeed = async (
    swarm: Swarm.Api,
    author: Author,
    firstPost: PublicPost,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper
): Promise<RecentPostFeed> => {
    const url = swarm.feed.getUri();
    Debug.log('createPostFeed: ', author);
    const uploadedImage = await uploadImage(swarm.bzz, author.image, imageResizer, modelHelper);
    const uploadedPost = await uploadPost(swarm.bzz, firstPost, imageResizer, modelHelper);
    const postFeed: RecentPostFeed = {
        name: author.name,
        url,
        feedUrl: url,
        favicon: uploadedImage.localPath || '',
        posts: [uploadedPost],
        authorImage: uploadedImage,
    };
    return await updateRecentPostFeed(swarm, postFeed);
};

export const isPostFeedUrl = (url: string): boolean => {
    return url.startsWith(Swarm.DefaultFeedPrefix);
};

export const updateRecentPostFeed = async (swarm: Swarm.Api, postFeed: RecentPostFeed): Promise<RecentPostFeed> => {
    try {
        const postFeedJson = JSON.stringify(postFeed);
        const contentHash = await swarm.bzz.upload(postFeedJson);
        await swarm.feed.update(contentHash);
        const url = swarm.feed.getUri();
        return {
            ...postFeed,
            url,
            feedUrl: url,
        };
    } catch (e) {
        Debug.log('updatePostFeed failed, ', e);
        return postFeed;
    }
};

export const downloadRecentPostFeed = async (swarm: Swarm.ReadableApi, url: string, timeout: number = 5000): Promise<RecentPostFeed> => {
    try {
        const contentHash = await swarm.feed.downloadFeed(url, timeout);
        Debug.log('downloadPostFeed: contentHash: ', contentHash);

        const content = await swarm.bzz.download(contentHash, timeout);
        Debug.log('downloadPostFeed: content: ', content);

        const postFeed = JSON.parse(content) as RecentPostFeed;
        const authorImage = {
            uri: Swarm.getSwarmGatewayUrl(postFeed.authorImage.uri || ''),
        };
        const author: Author = {
            name: postFeed.name,
            uri: postFeed.url,
            faviconUri: authorImage.uri,
            image: authorImage,
        };
        const postFeedWithGatewayImageLinks = {
            ...postFeed,
            posts: postFeed.posts.map(post => ({
                ...post,
                author,
                images: post.images.map(image => ({
                    ...image,
                    uri: Swarm.getSwarmGatewayUrl(image.uri!),
                })),
            })),
            favicon: authorImage.uri,
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

export const loadRecentPosts = async (swarm: Swarm.ReadableApi, postFeeds: Feed[]): Promise<PublicPost[]> => {
    const loadFeedPromises = postFeeds.map(feed => downloadRecentPostFeed(swarm, feed.feedUrl));
    const feeds = await Promise.all(loadFeedPromises);
    let posts: PublicPost[] = [];
    for (const feed of feeds) {
        posts = posts.concat(feed.posts);
    }
    return posts;
};
