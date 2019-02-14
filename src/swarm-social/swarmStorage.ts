import {
    PostCommand,
    PostCommandLog,
    Storage,
    StorageSyncer,
    StorageSyncUpdate,
    RecentPostFeed,
    getLatestPostCommandEpochFromLog,
    getPostCommandUpdatesSinceEpoch,
    getLatestPostsFromLog,
    epochCompare,
} from '../social/api';
import { serialize, deserialize } from '../social/serialization';
import * as Swarm from '../swarm/Swarm';
import { Debug } from '../Debug';
import { Utils } from '../Utils';
import { PublicPost, Post, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { Feed } from '../models/Feed';
import { syncPostCommandLogWithStorage } from '../social/sync';

export interface SwarmHelpers {
    imageResizer: (image: ImageData, path: string) => Promise<string>;
    getLocalPath: (localPath: string) => string;
}

const defaultImageResizer = (image: ImageData, path: string): Promise<string> => {
    return Promise.resolve(path);
};

const defaultSwarmHelpers: SwarmHelpers = {
    imageResizer: defaultImageResizer,
    getLocalPath: (localPath) => localPath,
};

const DEFAULT_POST_COMMAND_LOG_TOPIC = 'felfele:posts';

interface SwarmStorage extends Storage {
    readonly swarmApi: Swarm.Api;
    readonly swarmHelpers: SwarmHelpers;
}

export const makeSwarmStorage = (swarmApi: Swarm.Api, swarmHelpers: SwarmHelpers = defaultSwarmHelpers): SwarmStorage => ({
    swarmApi,
    swarmHelpers,
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
        return await uploadPostCommandToSwarm(postCommand, newSwarmApi, swarmHelpers);
    },
    downloadPostCommandLog: async (until?: Swarm.Epoch) => {
        const postCommandLogFeedAddress = {
            ...swarmApi.feed.address,
            topic: Swarm.calculateTopic(DEFAULT_POST_COMMAND_LOG_TOPIC),
        };
        const feedApi = Swarm.makeReadableFeedApi(postCommandLogFeedAddress, swarmApi.swarmGateway);
        return await fetchSwarmPostCommandLog(feedApi, until);
    },
    uploadRecentPostFeed: async (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => {
        return await uploadRecentPostFeed(swarmApi, postCommandLog, recentPostFeed, swarmHelpers);
    },
    downloadRecentPostFeed: async (url: string, timeout: number = 0) => {
        return await downloadRecentPostFeed(swarmApi, url, timeout);
    },
});

export const makeSwarmStorageSyncer = (swarmStorage: SwarmStorage): StorageSyncer => ({
    sync: async (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed): Promise<StorageSyncUpdate> => {
        const lastSeenEpoch = getLatestPostCommandEpochFromLog(postCommandLog);
        const syncedPostCommandLog = await syncPostCommandLogWithStorage(postCommandLog, swarmStorage);
        const updatedRecentPostFeed = await swarmStorage.uploadRecentPostFeed(syncedPostCommandLog, recentPostFeed);
        const postCommandUpdates = getPostCommandUpdatesSinceEpoch(syncedPostCommandLog, lastSeenEpoch);
        console.log('swarmStorage.sync', 'syncedPostCommandLog', syncedPostCommandLog, 'lastSeenEpoch', lastSeenEpoch, 'postCommandUpdates', postCommandUpdates);
        const updatedPosts = getLatestPostsFromLog(postCommandUpdates);
        return {
            postCommandLog: syncedPostCommandLog,
            recentPostFeed: updatedRecentPostFeed,
            updatedPosts,
        };
    },
});

export const isPostFeedUrl = (url: string): boolean => {
    return url.startsWith(Swarm.defaultFeedPrefix);
};

const fetchSwarmPostCommandLog = async (swarmFeedApi: Swarm.ReadableFeedApi, until?: Swarm.Epoch): Promise<PostCommandLog> => {
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
            if (until != null && epochCompare(until, previousEpoch) === 0) {
                Debug.log('fetchSwarmPostCommandLog', 'finished until');
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

const uploadPostCommandPostToSwarm = async (postCommand: PostCommand, swarm: Swarm.BzzApi, postOptions: SwarmHelpers): Promise<PostCommand> => {
    if (postCommand.type === 'update') {
        const post = {
            ...postCommand.post,
            link: undefined,
        };
        const uploadedPost = await uploadPost(swarm, post, postOptions.imageResizer, postOptions.getLocalPath);
        return {
            ...postCommand,
            post: uploadedPost,
        };
    } else {
        return postCommand;
    }
};

const uploadPostCommandToSwarm = async (postCommand: PostCommand, swarmApi: Swarm.Api, postOptions: SwarmHelpers): Promise<PostCommand> => {
    const postCommandAfterUploadPost = await uploadPostCommandPostToSwarm(postCommand, swarmApi.bzz, postOptions);
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
    getLocalPath: (localPath: string) => string,
): Promise<ImageData> => {
    if (!isImageUploaded(image)) {
        if (image.localPath == null || image.localPath === '') {
            return image;
        }
        const path = getLocalPath(image.localPath);
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
    getLocalPath: (localPath: string) => string,
): Promise<ImageData[]> => {
    const updateImages: ImageData[] = [];
    for (const image of images) {
        const updateImage = await uploadImage(swarm, image, imageResizer, getLocalPath);
        updateImages.push(updateImage);
    }
    return updateImages;
};

const uploadAuthor = async (
    swarm: Swarm.BzzApi,
    author: Author,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    getLocalPath: (localPath: string) => string,
): Promise<Author | undefined> => {
    const uploadedImage = await uploadImage(swarm, author.image!, imageResizer, getLocalPath);
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
    getLocalPath: (localPath: string) => string,
): Promise<Post> => {
    if (post.link != null && Swarm.isSwarmLink(post.link)) {
        return post;
    }
    const uploadedImages = await uploadImages(swarm, post.images, imageResizer, getLocalPath);
    const uploadedPost = {
        ...post,
        images: uploadedImages,
        author: undefined,
    };

    const uploadedPostJSON = serialize(uploadedPost);
    const postContentHash = await swarm.upload(uploadedPostJSON);
    const postLink = Swarm.defaultPrefix + postContentHash;

    return {
        ...uploadedPost,
        link: postLink,
    };
};

const uploadPosts = async (
    swarm: Swarm.BzzApi,
    posts: Post[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    getLocalPath: (localPath: string) => string,
): Promise<Post[]> => {
    const uploadedPosts: Post[] = [];
    for (const post of posts) {
        const uploadedPost = await uploadPost(swarm, post, imageResizer, getLocalPath);
        uploadedPosts.push(uploadedPost);
    }
    return uploadedPosts;
};

const createRecentPostFeed = async (
    swarm: Swarm.Api,
    author: Author,
    firstPost: PublicPost,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    getLocalPath: (localPath: string) => string,
): Promise<RecentPostFeed> => {
    const url = swarm.feed.getUri();
    Debug.log('createPostFeed: ', author);
    const uploadedImage = await uploadImage(swarm.bzz, author.image, imageResizer, getLocalPath);
    const uploadedPost = await uploadPost(swarm.bzz, firstPost, imageResizer, getLocalPath);
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

const getPostAuthor = (author?: Author): Author | undefined => {
    if (author == null) {
        return undefined;
    }
    return {
        ...author,
        identity: undefined,
    };
};

const uploadRecentPostFeed = async (
    swarm: Swarm.Api,
    postCommandLog: PostCommandLog,
    recentPostFeed: RecentPostFeed,
    swarmHelpers: SwarmHelpers,
): Promise<RecentPostFeed> => {
    const feedPosts = getLatestPostsFromLog(postCommandLog, 20);
    const posts = feedPosts
        .map(p => ({
            ...p,
            author: getPostAuthor(p.author),
            images: p.images.map(image => ({
                ...image,
                localPath: undefined,
            })),
        }))
        ;

    const uploadedPosts = await uploadPosts(swarm.bzz, posts, swarmHelpers.imageResizer, swarmHelpers.getLocalPath);
    const postFeed = {
        ...recentPostFeed,
        posts: uploadedPosts,
        authorImage: {
            ...recentPostFeed.authorImage,
            localPath: '',
        },
    };
    Debug.log('uploadRecentPostFeed: after uploadPosts');

    const updatedRecentPostFeed = await updateRecentPostFeed(swarm, postFeed);
    Debug.log('uploadRecentPostFeed: after uploadPostFeed');
    return updatedRecentPostFeed;
};
