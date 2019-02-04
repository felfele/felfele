import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../Swarm';
import { serialize, deserialize } from './serialization';
import { uploadPost } from '../PostUpload';
import { ModelHelper } from '../models/ModelHelper';
import { MockModelHelper } from '../models/__mocks__/ModelHelper';
import { Debug } from '../Debug';
import { Utils } from '../Utils';

type PostCommandType = 'update' | 'remove';

const PostCommandProtocolVersion = 1;

interface PostCommand {
    protocolVersion: number;

    timestamp: number;
    parentTimestamp: number;

    type: PostCommandType;
    post: Post;

    previousEpoch?: Swarm.Epoch;
    _epoch?: Swarm.Epoch;
}

interface PostCommandLog {
    commands: PostCommand[];
}

interface PostOptions {
    shareFeedAddress: boolean;
    imageResizer: (image: ImageData, path: string) => Promise<string>;
    modelHelper: ModelHelper;
}

const DefaultImageResizer = (image: ImageData, path: string): Promise<string> => {
    return Promise.resolve(path);
};

const DefaultPostOptions: PostOptions = {
    shareFeedAddress: false,
    imageResizer: DefaultImageResizer,
    modelHelper: new MockModelHelper(),
};

const getPreviousPostCommandTimestampFromLog = (postCommandLog: PostCommandLog): number => {
    if (postCommandLog.commands.length === 0) {
        return 0;
    }
    return postCommandLog.commands[0].timestamp;
};

const getPreviousCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    if (postCommandLog.commands.length === 0) {
        return undefined;
    }
    return postCommandLog.commands[0]._epoch;
};

const getParentUpdateTimestampFromLog = (post: Post, postCommandLog: PostCommandLog): number => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.post._id === post._id) {
            return postCommand.timestamp;
        }
    }
    return 0;
};

export const shareNewPost = async (
    post: Post,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
): Promise<PostCommandLog> => {
    const uploadedPost = await uploadPost(post, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getPreviousPostCommandTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp: 0,
        post: uploadedPost,
        type: 'update',
        previousEpoch,
        _epoch: undefined,
    };
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

export const updatePost = async (
    post: Post,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
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
    const uploadedPost = await uploadPost(updatedPost, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getPreviousPostCommandTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp,
        post: uploadedPost,
        type: 'update',
        previousEpoch,
        _epoch: undefined,
    };
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

export const removePost = async (
    post: Post,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
) => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('removePost failed, no previous post with the same id: ' + post._id);
    }
    const timestamp = getPreviousPostCommandTimestampFromLog(postCommandLog) + 1;
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

const addPostCommandToFeed = async (postCommand: PostCommand, swarmFeedApi: Swarm.FeedApi): Promise<PostCommand> => {
    const data = serialize(postCommand);
    const feedTemplate = await swarmFeedApi.update(data);
    return {
        ...postCommand,
        _epoch: feedTemplate.epoch,
    };
};

export const getLatestPostsFromLog = (count: number, postCommandLog: PostCommandLog): Post[] => {
    const updatePostCommands = getLatestUpdatePostCommandsFromLog(count, postCommandLog);
    const updatedPosts = updatePostCommands.map(postCommand => postCommand.post);
    return updatedPosts;
};

export const getLatestUpdatePostCommandsFromLog = (count: number, postCommandLog: PostCommandLog): PostCommand[] => {
    const skipPostCommandSet = new Set<number>();
    const updatePostCommands = postCommandLog.commands.filter(postCommand => {
        if (postCommand.parentTimestamp !== 0) {
            skipPostCommandSet.add(postCommand.parentTimestamp);
        }
        if (postCommand.type === 'remove') {
            return false;
        }
        if (skipPostCommandSet.has(postCommand.timestamp)) {
            return false;
        }
        return true;
    });
    return Utils.take(updatePostCommands, count, []);
};

const testIdentity = {
    privateKey: '0x9e7cb8f7f92f0a62060f40dea2b782415e4ef70835b25f81bb942cb4994b5a3c',
    publicKey: '0x044d89c68f8bdc289764149ba5ed6fe2aeca546dfa3a36648946d546df41d52d6c5bf2bbadb1c5b74ebab9ca3bddf08d4b6fe4dc523b7358dc9c883fa6d0c39d79',
    address: '0xfe6368fe6f10dab84b95a1079929323fd256980f',
};

const testPostCommandFeed: PostCommandLog = {
    commands: [],
};

export const testSharePost = async (
    id: number = 1,
    postCommandLog: PostCommandLog = testPostCommandFeed
): Promise<PostCommandLog> => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    const post: Post = {
        _id: id,
        text: 'hello' + id,
        images: [],
        createdAt: Date.now(),
    };
    return await shareNewPost(post, postCommandLog, swarmFeedApi);
};

export const testSharePosts = async () => {
    const postCommandLogAfter1 = await testSharePost(1, testPostCommandFeed);
    const postCommandLogAfter2 = await testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = await testSharePost(3, postCommandLogAfter2);
};

export const testSharePostsWithUpdate = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);

    const postCommandLogAfter1 = await testSharePost(1, testPostCommandFeed);
    const post1 = postCommandLogAfter1.commands[0].post;
    const postCommandLogAfter2 = await testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = await testSharePost(3, postCommandLogAfter2);
    const post1Update = {
        ...post1,
        text: 'Updated post1',
    };
    const postCommandLogAfter4 = await updatePost(post1Update, postCommandLogAfter3, swarmFeedApi);
};

export const testSharePostsWithRemove = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);

    const postCommandLogAfter1 = await testSharePost(1, testPostCommandFeed);
    const postCommandLogAfter2 = await testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = await testSharePost(3, postCommandLogAfter2);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = await removePost(post3, postCommandLogAfter3, swarmFeedApi);

    const posts = await getLatestPostsFromLog(2, postCommandLogAfter4);
    Debug.log('testSharePostsWithRemove', 'posts', posts);
};

export const testListAllPosts = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    let postCommandJSON = await swarmFeedApi.download();
    while (true) {
        Debug.log('testListAllPosts', 'postCommandJSON', postCommandJSON);
        const postCommand = deserialize(postCommandJSON) as PostCommand;
        const previousEpoch = postCommand.previousEpoch;
        if (previousEpoch == null) {
            Debug.log('testListAllPosts', 'finished');
            break;
        }
        postCommandJSON = await swarmFeedApi.downloadPreviousVersion(previousEpoch);
    }
};

export const allTests = {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testListAllPosts,
};
