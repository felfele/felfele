import {
    PostCommand,
    PostCommandLog,
    PostCommandLogStorage,
    PostCommandProtocolVersion,
    getPreviousCommandEpochFromLog,
    getHighestSeenTimestampFromLog,
    getParentUpdateTimestampFromLog,
    getUnsyncedPostCommandLog,
    getLatestPostCommandEpochFromLog,
    epochCompare,
    mergePostCommandLogs,
} from '../social/api';
import { serialize, deserialize } from '../social/serialization';
import * as Swarm from '../swarm/Swarm';
import { Debug } from '../Debug';
import { Utils } from '../Utils';
import { Post, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';
import { MockModelHelper } from '../models/__mocks__/ModelHelper';
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

export const makeSwarmPostCommandLogStorage = (swarmApi: Swarm.Api): PostCommandLogStorage => ({
    uploadPostCommand: async (postCommand: PostCommand) => {
        return await uploadPostCommandToSwarm(postCommand, swarmApi);
    },
    fetchPostCommandLog: async () => {
        return fetchSwarmPostCommandLog(swarmApi.feed);
    },
});

const fetchSwarmPostCommandLog = async (swarmFeedApi: Swarm.WriteableFeedApi): Promise<PostCommandLog> => {
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
    const postCommandAfterPostFeedUpdated = /* TODO */ postCommandAfterFeedUpdated;

    return postCommandAfterPostFeedUpdated;
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

export const uploadImage = async (
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

export const uploadAuthor = async (
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

export const uploadPost = async (
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

export const uploadPosts = async (
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

const shareNewPostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarm: Swarm.WriteableApi,
    options: PostOptions = defaultPostOptions,
): Promise<PostCommandLog> => {
    const uploadedPost = await uploadPost(swarm.bzz, post, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp: 0,
        post: uploadedPost,
        type: 'update',
        source,
        previousEpoch,
        epoch: undefined,
    };
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarm.feed);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

const updatePostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarm: Swarm.WriteableApi,
    options: PostOptions = defaultPostOptions,
): Promise<PostCommandLog> => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('updatePost failed, no previous post with the same id: ' + post._id);
    }
    // This is a hack now to force upload to Swarm
    const updatedPost = {
        ...post,
        link: undefined,
    };
    const uploadedPost = await uploadPost(swarm.bzz, updatedPost, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp,
        post: uploadedPost,
        type: 'update',
        source,
        previousEpoch,
        epoch: undefined,
    };
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarm.feed);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

const removePostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.WriteableFeedApi,
) => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('removePost failed, no previous post with the same id: ' + post._id);
    }
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);

    const removedPost: Post = {
        _id: post._id,
        text: '',
        images: [],
        createdAt: post.createdAt,
    };
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        post: removedPost,
        type: 'remove',
        source,
        timestamp,
        parentTimestamp,
        previousEpoch,
    };
    const removedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [removedPostCommand, ...postCommandLog.commands],
    };
};

const uploadUnsyncedPostCommandsToSwarm = async (postCommandLog: PostCommandLog, swarmApi: Swarm.Api): Promise<PostCommandLog> => {
    const unsyncedCommandLog = getUnsyncedPostCommandLog(postCommandLog);
    const syncedCommands = postCommandLog.commands.slice(unsyncedCommandLog.commands.length);
    const reversedUnsyncedCommands = [...unsyncedCommandLog.commands].reverse();

    const previousSyncedEpoch = getLatestPostCommandEpochFromLog({commands: syncedCommands});

    let previousEpoch = previousSyncedEpoch;
    const uploadedCommands: PostCommand[] = [];
    for (const postCommand of reversedUnsyncedCommands) {
        const postCommandWithPreviousEpoch = {
            ...postCommand,
            previousEpoch,
        };

        const uploadedCommand = await uploadPostCommandToSwarm(postCommandWithPreviousEpoch, swarmApi);

        uploadedCommands.push(uploadedCommand);

        previousEpoch = uploadedCommand.epoch;
    }

    return {
        commands: uploadedCommands.reverse().concat(syncedCommands),
    };
};

const syncPostCommandLogWithSwarm = async (postCommandLog: PostCommandLog, swarmApi: Swarm.Api): Promise<PostCommandLog> => {
    const latestEpoch = getLatestPostCommandEpochFromLog(postCommandLog);

    const swarmPostCommandLog = await fetchSwarmPostCommandLog(swarmApi.feed);
    const swarmLatestEpoch = getLatestPostCommandEpochFromLog(swarmPostCommandLog);

    Debug.log('syncPostCommandLogWithSwarm', latestEpoch, swarmLatestEpoch);
    if (epochCompare(latestEpoch, swarmLatestEpoch) === 0) {
        return postCommandLog;
    }

    const mergedPostCommandLog = mergePostCommandLogs(postCommandLog, swarmPostCommandLog);
    Debug.log('syncPostCommandLogWithSwarm', 'mergedPostCommandLog', mergedPostCommandLog);

    const uploadedPostCommandLog = await uploadUnsyncedPostCommandsToSwarm(mergedPostCommandLog, swarmApi);

    return uploadedPostCommandLog;
};

const emptyPostCommandFeed: PostCommandLog = {
    commands: [],
};

const testIdentity = {
    privateKey: '0x12ce6e8759025973fe69dde3873fc2d9e040d79072135ab168369c57589413bc',
    publicKey: '0x042a8300b3447ffcc27ab32a0e0cf74a8a72022ca51420d9c15ea475d26da40d6ca866ad4504b1943edc784ee96e1f11e84ba62cedcd75ab719dcc626902877a28',
    address: '0x8f24f61d21a6e3087a7f0b3e158a639a624036cf',
};

export const defaultSwarmApi = Swarm.makeApi(
    Swarm.makeFeedAddressFromPublicIdentity(testIdentity),
    (digest) => Swarm.signDigest(digest, testIdentity),
);

export const defaultSwarmFeedApi = defaultSwarmApi.feed;

const testSharePostSwarm = async (
    id: number = 1,
    postCommandLog: PostCommandLog = emptyPostCommandFeed,
    source: string = '',
    swarmApi = defaultSwarmApi,
): Promise<PostCommandLog> => {
    const post: Post = {
        _id: id,
        text: 'hello' + id,
        images: [],
        createdAt: Date.now(),
    };
    return await shareNewPostSwarm(post, source, postCommandLog, swarmApi);
};
