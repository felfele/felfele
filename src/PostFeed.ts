import { Feed } from './models/Feed';
import { PublicPost, Author } from './models/Post';
import { ImageData } from './models/ImageData';
import * as Swarm from './Swarm';
import { uploadPost, uploadImage } from './PostUpload';
import { Debug } from './Debug';
import { downloadImageAndStore, ImageStorePath } from './ImageDownloader';

export interface PostFeed extends Feed {
    posts: PublicPost[];
    authorImage: ImageData;
}

export const createPostFeed = async (swarmFeedApi: Swarm.FeedApi, author: Author, firstPost: PublicPost): Promise<PostFeed> => {
    const url = swarmFeedApi.getUri();
    Debug.log('createPostFeed: ', author);
    const uploadedImage = await uploadImage(author.image);
    const uploadedPost = await uploadPost(firstPost);
    const postFeed: PostFeed = {
        name: author.name,
        url,
        feedUrl: url,
        favicon: uploadedImage.localPath || '',
        posts: [uploadedPost],
        authorImage: uploadedImage,
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
        const url = swarmFeedApi.getUri();
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

export const downloadPostFeed = async (url: string): Promise<PostFeed> => {
    try {
        const timeout = 5000;
        const contentHash = await Swarm.downloadFeed(url, timeout);
        Debug.log('downloadPostFeed: contentHash: ', contentHash);

        const content = await Swarm.downloadData(contentHash, timeout);
        Debug.log('downloadPostFeed: content: ', content);

        const postFeed = JSON.parse(content) as PostFeed;
        const authorImage = {
            uri: Swarm.getSwarmGatewayUrl(postFeed.authorImage.uri || ''),
            localPath: postFeed.authorImage.uri
                ? await downloadImageAndStore(postFeed.authorImage.uri, ImageStorePath.AVATARS)
                : undefined,
        };
        const faviconUri = authorImage.localPath != null
            ? authorImage.localPath
            : authorImage.uri;
        const author: Author = {
            name: postFeed.name,
            uri: postFeed.url,
            faviconUri,
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
            favicon: faviconUri,
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

export const loadPosts = async (postFeeds: Feed[]): Promise<PublicPost[]> => {
    const loadFeedPromises = postFeeds.map(feed => downloadPostFeed(feed.feedUrl));
    const feeds = await Promise.all(loadFeedPromises);
    let posts: PublicPost[] = [];
    for (const feed of feeds) {
        posts = posts.concat(feed.posts);
    }
    return posts;
};
