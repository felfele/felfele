import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../Swarm';
import { serialize, deserialize } from './serialization';
import { uploadPost } from '../PostUpload';
import { ModelHelper } from '../models/ModelHelper';
import { MockModelHelper } from '../models/__mocks__/ModelHelper';
import { Debug } from '../Debug';

type PostCommandType = 'update' | 'remove';

const PostCommandProtocolVersion = 1;

interface PostCommand {
    protocolVersion: number;

    timestamp: number;
    parentTimestamp: number;

    type: PostCommandType;
    post: Post;
    source: string;

    epoch?: Swarm.Epoch;
    previousEpoch?: Swarm.Epoch;
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

const getLatestPostCommandTimestampFromLog = (postCommandLog: PostCommandLog): number => {
    if (postCommandLog.commands.length === 0) {
        return 0;
    }
    return postCommandLog.commands[0].timestamp;
};

const getLatestPostCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.epoch != null) {
            return postCommand.epoch;
        }
    }
    return undefined;
};

const getPreviousCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    if (postCommandLog.commands.length === 0) {
        return undefined;
    }
    return postCommandLog.commands[0].epoch;
};

const getParentUpdateTimestampFromLog = (post: Post, postCommandLog: PostCommandLog): number => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.post._id === post._id) {
            return postCommand.timestamp;
        }
    }
    return 0;
};

const getPostCommandFromLogByTimestamp = (postCommandLog: PostCommandLog, timestamp: number): PostCommand | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.timestamp === timestamp) {
            return postCommand;
        }
    }
    return undefined;
};

const timestampCompare = (a: PostCommand, b: PostCommand) => {
    return a.timestamp - b.timestamp;
};

const sourceCompare = (a: PostCommand, b: PostCommand) => {
    return a.source.localeCompare(b.source);
};

const mergePostCommandLogs = (postCommandLogA: PostCommandLog, postCommandLogB: PostCommandLog): PostCommandLog => {
    const mergedPostCommandLog = {
        commands: postCommandLogA.commands.concat(postCommandLogB.commands),
    };
    const sortedPostCommandLog = {
        commands: mergedPostCommandLog.commands.sort((a, b) =>
            timestampCompare(a, b) || sourceCompare(a, b)),
    };
    return sortedPostCommandLog;
};

export const shareNewPost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
): PostCommandLog => {
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getLatestPostCommandTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp: 0,
        post,
        type: 'update',
        source,
        previousEpoch,
        epoch: undefined,
    };
    return {
        ...postCommandLog,
        commands: [postCommand, ...postCommandLog.commands],
    };
};

export const shareNewPostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
): Promise<PostCommandLog> => {
    const uploadedPost = await uploadPost(post, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getLatestPostCommandTimestampFromLog(postCommandLog) + 1;
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
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

export const updatePost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
): PostCommandLog => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('updatePost failed, no previous post with the same id: ' + post._id);
    }
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getLatestPostCommandTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp,
        post: post,
        type: 'update',
        source,
        previousEpoch,
        epoch: undefined,
    };
    return {
        ...postCommandLog,
        commands: [postCommand, ...postCommandLog.commands],
    };
};

export const updatePostSwarm = async (
    post: Post,
    source: string,
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
    const timestamp = getLatestPostCommandTimestampFromLog(postCommandLog) + 1;
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
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

export const removePost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
) => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('removePost failed, no previous post with the same id: ' + post._id);
    }
    const timestamp = getLatestPostCommandTimestampFromLog(postCommandLog) + 1;
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
    return {
        ...postCommandLog,
        commands: [postCommand, ...postCommandLog.commands],
    };
};

export const removePostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
) => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('removePost failed, no previous post with the same id: ' + post._id);
    }
    const timestamp = getLatestPostCommandTimestampFromLog(postCommandLog) + 1;
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

const addPostCommandToFeed = async (postCommand: PostCommand, swarmFeedApi: Swarm.FeedApi): Promise<PostCommand> => {
    const feedTemplate = await swarmFeedApi.downloadFeedTemplate();
    const updatedCommand = {
        ...postCommand,
        epoch: feedTemplate.epoch,
    };
    const data = serialize(updatedCommand);
    await swarmFeedApi.updateWithFeedTemplate(feedTemplate, data);
    return updatedCommand;
};

const syncPostCommandLogWithSwarm = async (postCommandLog: PostCommandLog, swarmApi: Swarm.Api): Promise<PostCommandLog> => {
    const latestEpoch = getLatestPostCommandEpochFromLog(postCommandLog);

    const swarmPostCommandLog = await fetchSwarmPostCommandLog(swarmApi.feed);
    const swarmLatestEpoch = getLatestPostCommandEpochFromLog(swarmPostCommandLog);

    Debug.log('syncPostCommandLogWithSwarm', latestEpoch, swarmLatestEpoch);

    return postCommandLog;
};

export const fetchSwarmPostCommandLog = async (swarmFeedApi: Swarm.FeedApi): Promise<PostCommandLog> => {
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

export const getLatestPostsFromLog = (postCommandLog: PostCommandLog, count: number | undefined = undefined): Post[] => {
    const updatePostCommands = getLatestUpdatePostCommandsFromLog(postCommandLog, count);
    const updatedPosts = updatePostCommands.map(postCommand => postCommand.post);
    return updatedPosts;
};

export const getLatestUpdatePostCommandsFromLog = (postCommandLog: PostCommandLog, count: number | undefined = undefined): PostCommand[] => {
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
    return updatePostCommands.slice(0, count);
};

const testIdentity = {
    privateKey: '0x12ce6e8759025973fe69dde3873fc2d9e040d79072135ab168369c57589413bc',
    publicKey: '0x042a8300b3447ffcc27ab32a0e0cf74a8a72022ca51420d9c15ea475d26da40d6ca866ad4504b1943edc784ee96e1f11e84ba62cedcd75ab719dcc626902877a28',
    address: '0x8f24f61d21a6e3087a7f0b3e158a639a624036cf',
};

const emptyPostCommandFeed: PostCommandLog = {
    commands: [],
};

export const testSharePost = (
    id: number = 1,
    postCommandLog: PostCommandLog = emptyPostCommandFeed,
    source: string = '',
): PostCommandLog => {
    const post: Post = {
        _id: id,
        text: 'hello' + id,
        images: [],
        createdAt: Date.now(),
    };
    return shareNewPost(post, source, postCommandLog);
};

export const testSharePostSwarm = async (
    id: number = 1,
    postCommandLog: PostCommandLog = emptyPostCommandFeed,
    source: string = '',
    swarmFeedApi = Swarm.makeFeedApi(testIdentity),
): Promise<PostCommandLog> => {
    const post: Post = {
        _id: id,
        text: 'hello' + id,
        images: [],
        createdAt: Date.now(),
    };
    return await shareNewPostSwarm(post, source, postCommandLog, swarmFeedApi);
};

export const testSharePosts = async () => {
    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2);

    Debug.log('testSharePosts', postCommandLogAfter3);
};

export const testSharePostsSwarm = async (source = ''): Promise<PostCommandLog> => {
    const postCommandLogAfter1 = await testSharePostSwarm(1, emptyPostCommandFeed, source);
    const postCommandLogAfter2 = await testSharePostSwarm(2, postCommandLogAfter1, source);
    const postCommandLogAfter3 = await testSharePostSwarm(3, postCommandLogAfter2, source);

    Debug.log('testSharePosts', postCommandLogAfter3);

    return postCommandLogAfter3;
};

export const testSharePostsWithUpdate = async () => {
    const source = '';

    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed);
    const post1 = postCommandLogAfter1.commands[0].post;
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2);
    const post1Update = {
        ...post1,
        text: 'Updated post1',
    };
    const postCommandLogAfter4 = updatePost(post1Update, source, postCommandLogAfter3);

    Debug.log('testSharePostsWithUpdate', postCommandLogAfter4);
};

export const testSharePostsWithRemove = async () => {
    const source = '';

    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = removePost(post3, source, postCommandLogAfter3);

    const posts = getLatestPostsFromLog(postCommandLogAfter4, 3);
    Debug.log('testSharePostsWithRemove', 'posts', posts);
};

export const testSharePostsWithRemoveOnSwarm = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    const source = '';

    const postCommandLogAfter1 = await testSharePostSwarm(1, emptyPostCommandFeed, source, swarmFeedApi);
    const postCommandLogAfter2 = await testSharePostSwarm(2, postCommandLogAfter1, source, swarmFeedApi);
    const postCommandLogAfter3 = await testSharePostSwarm(3, postCommandLogAfter2, source, swarmFeedApi);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = await removePostSwarm(post3, source, postCommandLogAfter3, swarmFeedApi);

    const swarmPostCommandLog = await fetchSwarmPostCommandLog(swarmFeedApi);
    const posts = getLatestPostsFromLog(swarmPostCommandLog, 3);
    Debug.log('testSharePostsWithRemove', 'posts', posts);
};

export const testListAllPosts = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    await fetchSwarmPostCommandLog(swarmFeedApi);
};

export const testFetchLastThreePosts = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    const swarmPostCommandLog = await fetchSwarmPostCommandLog(swarmFeedApi);
    const posts = await getLatestPostsFromLog(swarmPostCommandLog, 3);
    Debug.log('fetchLastTwoPosts', 'posts', posts);
};

export const testSyncPostCommandLogWithSwarm = async () => {
    const swarmApi = Swarm.makeApi(testIdentity);
    await testSharePostsSwarm();
    await syncPostCommandLogWithSwarm(emptyPostCommandFeed, swarmApi);
};

export const allTests: { [ index: string]: () => void } = {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testSharePostsWithRemoveOnSwarm,
    testListAllPosts,
    testFetchLastThreePosts,
    testSyncPostCommandLogWithSwarm,
};
