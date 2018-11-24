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
    return url.startsWith(Swarm.DefaultFeedPrefix);
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

export const downloadPostFeed = async (swarmFeedApi: Swarm.FeedApi, url: string): Promise<PostFeed> => {
    const contentHash = await swarmFeedApi.downloadFeed(url);
    Debug.log('downloadPostFeed: contentHash: ', contentHash);
    try {
        const content = await Swarm.downloadData(contentHash);
        Debug.log('downloadPostFeed: content: ', content);
        const postFeed = JSON.parse(content) as PostFeed;
        const authorImage = {
            uri: Swarm.getSwarmGatewayUrl(postFeed.authorImage.uri || ''),
        };
        const author: Author = {
            name: postFeed.name,
            uri: postFeed.url,
            faviconUri: '',
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
