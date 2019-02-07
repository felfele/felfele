import {
    PostCommand,
    PostCommandLog,
    PostCommandLogStorage,
} from '../social/api';
import { serialize, deserialize } from '../social/serialization';
import * as Swarm from '../swarm/Swarm';
import { Debug } from '../Debug';
import { Utils } from '../Utils';
import { Post, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';
import { MockModelHelper } from '../models/__mocks__/ModelHelper';

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
