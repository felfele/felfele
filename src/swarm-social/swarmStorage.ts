import {
    PostCommand,
    PostCommandLog,
    Storage,
    getLatestPostsFromLog,
} from '../social/api';
import { serialize, deserialize } from '../social/serialization';
import * as Swarm from '../swarm/Swarm';
import { Debug } from '../Debug';
import { Utils } from '../Utils';
import { PublicPost, Post, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';
import { MockModelHelper } from '../models/__mocks__/ModelHelper';
import { Feed } from '../models/Feed';
import { RecentPostFeed } from '../social/api';
import { syncPostCommandLogWithStorage } from '../social/sync';

interface PostOptions {
    shareFeedAddress: boolean;
    imageResizer: (image: ImageData, path: string) => Promise<string>;
    modelHelper: ModelHelper;
}

const defaultImageResizer = (image: ImageData, path: string): Promise<string> => {
    return Promise.resolve(path);
};

const defaultPostOptions: PostOptions = {
    shareFeedAddress: false,
    imageResizer: defaultImageResizer,
    modelHelper: new MockModelHelper(),
};

const DEFAULT_POST_COMMAND_LOG_TOPIC = 'posts';

interface SwarmStorage extends Storage {
    readonly swarmApi: Swarm.Api;
}

export const makeSwarmStorage = (swarmApi: Swarm.Api): SwarmStorage => ({
    swarmApi,
    uploadPostCommand: async (postCommand: PostCommand) => {
        const postCommandLogFeedAddress = {
            ...swarmApi.feed.address,
            topic: Swarm.calculateTopic(DEFAULT_POST_COMMAND_LOG_TOPIC),
        };
        const feedApi = Swarm.makeFeedApi(postCommandLogFeedAddress, swarmApi.feed.signFeedDigest, swarmApi.swarmGateway);
        const newSwarmApi = {
            ...swarmApi,
            feed: feedApi,
        };
        return await uploadPostCommandToSwarm(postCommand, newSwarmApi);
    },
    downloadPostCommandLog: async () => {
        const postCommandLogFeedAddress = {
            ...swarmApi.feed.address,
            topic: Swarm.calculateTopic(DEFAULT_POST_COMMAND_LOG_TOPIC),
        };
        const feedApi = Swarm.makeReadableFeedApi(postCommandLogFeedAddress, swarmApi.swarmGateway);
        return await fetchSwarmPostCommandLog(feedApi);
    },
    uploadRecentPostFeed: async (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => {
        return await uploadRecentPostFeed(swarmApi, postCommandLog, recentPostFeed);
    },
    downloadRecentPostFeed: async (url: string, timeout: number = 0) => {
        return await downloadRecentPostFeed(swarmApi, url, timeout);
    },
});

export const makeSwarmStorageSyncer = (swarmStorage: SwarmStorage) => ({
    sync: async (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => {
        const syncedPostCommandLog = await syncPostCommandLogWithStorage(postCommandLog, swarmStorage);
        const updatedRecentPostFeed = await uploadRecentPostFeed(swarmStorage.swarmApi, syncedPostCommandLog, recentPostFeed);
        return {
            postCommandLog: syncedPostCommandLog,
            recentPostFeed: updatedRecentPostFeed,
        };
    },
});

export const isPostFeedUrl = (url: string): boolean => {
    return url.startsWith(Swarm.DefaultFeedPrefix);
};

const fetchSwarmPostCommandLog = async (swarmFeedApi: Swarm.ReadableFeedApi): Promise<PostCommandLog> => {
    const postCommandLog: PostCommandLog = {
        commands: [],
    };
    try {
        let postCommandJSON = await swarmFeedApi.download();
        while (true) {
            Debug.log('fetchSwarmPostCommandLog', 'postCommandJSON', postCommandJSON);
            const postCommand = deserialize(postCommandJSON) as PostCommand;
            postCommandLog.commands.push(postCommand);
            const previousEpoch = postCommand.previousEpoch;
            if (previousEpoch == null) {
                Debug.log('fetchSwarmPostCommandLog', 'finished');
                break;
            }
            postCommandJSON = await swarmFeedApi.downloadPreviousVersion(previousEpoch);
        }
        return postCommandLog;
    } catch (e) {
        Debug.log('fetchSwarmPostCommandLog', e);
        return postCommandLog;
    }
};

const uploadPostCommandPostToSwarm = async (postCommand: PostCommand, swarm: Swarm.BzzApi): Promise<PostCommand> => {
    if (postCommand.type === 'update') {
        const post = {
            ...postCommand.post,
            link: undefined,
        };
        const uploadedPost = await uploadPost(swarm, post, defaultPostOptions.imageResizer, defaultPostOptions.modelHelper);
        return {
            ...postCommand,
            post: uploadedPost,
        };
    } else {
        return postCommand;
    }
};

const uploadPostCommandToSwarm = async (postCommand: PostCommand, swarmApi: Swarm.Api): Promise<PostCommand> => {
    const postCommandAfterUploadPost = await uploadPostCommandPostToSwarm(postCommand, swarmApi.bzz);
    const postCommandAfterFeedUpdated = await addPostCommandToFeed(postCommandAfterUploadPost, swarmApi.feed);
    const postCommandAfterRecentPostFeedUpdated = /* TODO */ postCommandAfterFeedUpdated;

    return postCommandAfterRecentPostFeedUpdated;
};

const addPostCommandToFeed = async (postCommand: PostCommand, swarmFeedApi: Swarm.WriteableFeedApi): Promise<PostCommand> => {
    const feedTemplate = await swarmFeedApi.downloadFeedTemplate();
    const updatedCommand = {
        ...postCommand,
        epoch: feedTemplate.epoch,
    };
    const data = serialize(updatedCommand);

    const currentTimeMillis = Date.now();
    await swarmFeedApi.updateWithFeedTemplate(feedTemplate, data);

    // Wait minimum one second between updates, because Swarm Feeds cannot handle well
    // multiple updates within one second
    await Utils.waitUntil(currentTimeMillis + 1000);

    return updatedCommand;
};

const isImageUploaded = (image: ImageData): boolean => {
    if (image.uri != null && Swarm.isSwarmLink(image.uri)) {
        return true;
    }
    return false;
};

const uploadImage = async (
    swarm: Swarm.BzzApi,
    image: ImageData,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<ImageData> => {
    if (!isImageUploaded(image)) {
        if (image.localPath == null || image.localPath === '') {
            return image;
        }
        const path = modelHelper.getLocalPath(image.localPath);
        const resizedImagePath = await imageResizer(image, path);
        const uri = await swarm.uploadPhoto(resizedImagePath);
        return {
            ...image,
            localPath: undefined,
            uri,
        };
    }
    return image;
};

const uploadImages = async (
    swarm: Swarm.BzzApi,
    images: ImageData[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<ImageData[]> => {
    const updateImages: ImageData[] = [];
    for (const image of images) {
        const updateImage = await uploadImage(swarm, image, imageResizer, modelHelper);
        updateImages.push(updateImage);
    }
    return updateImages;
};

const uploadAuthor = async (
    swarm: Swarm.BzzApi,
    author: Author,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Author | undefined> => {
    const uploadedImage = await uploadImage(swarm, author.image!, imageResizer, modelHelper);
    return {
        ...author,
        faviconUri: '',
        image: uploadedImage,
        identity: undefined,
    };
};

const uploadPost = async (
    swarm: Swarm.BzzApi,
    post: Post,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Post> => {
    if (post.link != null && Swarm.isSwarmLink(post.link)) {
        return post;
    }
    const uploadedImages = await uploadImages(swarm, post.images, imageResizer, modelHelper);
    const uploadedPost = {
        ...post,
        images: uploadedImages,
        author: undefined,
    };

    const uploadedPostJSON = serialize(uploadedPost);
    const postContentHash = await swarm.upload(uploadedPostJSON);
    const postLink = Swarm.DefaultPrefix + postContentHash;

    return {
        ...uploadedPost,
        link: postLink,
    };
};

const uploadPosts = async (
    swarm: Swarm.BzzApi,
    posts: Post[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Post[]> => {
    const uploadedPosts: Post[] = [];
    for (const post of posts) {
        const uploadedPost = await uploadPost(swarm, post, imageResizer, modelHelper);
        uploadedPosts.push(uploadedPost);
    }
    return uploadedPosts;
};

const createRecentPostFeed = async (
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

const updateRecentPostFeed = async (swarm: Swarm.Api, postFeed: RecentPostFeed): Promise<RecentPostFeed> => {
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

const uploadRecentPostFeed = async (swarm: Swarm.Api, postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed): Promise<RecentPostFeed> => {
    const feedPosts = getLatestPostsFromLog(postCommandLog, 20);
    const posts = feedPosts
        .map(p => ({
            ...p,
            images: p.images.map(image => ({
                ...image,
                localPath: undefined,
            })),
        }))
        ;

    const uploadedPosts = await uploadPosts(swarm.bzz, posts, defaultImageResizer, new MockModelHelper());
    const postFeed = {
        ...recentPostFeed,
        posts: uploadedPosts,
        authorImage: {
            ...recentPostFeed.authorImage,
            localPath: '',
        },
    };
    Debug.log('sharePost: after uploadPosts');

    const updatedRecentPostFeed = await updateRecentPostFeed(swarm, postFeed);
    Debug.log('sharePost: after uploadPostFeed');
    return updatedRecentPostFeed;
};
