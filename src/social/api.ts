import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../swarm/Swarm';
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
    /*
     * There assumptions that must held in order to this works correctly:
     *
     * TODO: write an assert function that checks these invariants in tests
     *
     * - The posts are ordered by epoch in the array, when there is no epoch
     *   the posts are ordered by timestamp
     */
    readonly commands: PostCommand[];
}

const arePostCommandsEqual = (a: PostCommand, b: PostCommand): boolean =>
    a.timestamp === b.timestamp && a.source === b.source;

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

const epochCompare = (a?: Swarm.Epoch, b?: Swarm.Epoch): number => {
    if (a == null && b == null) {
        return 0;
    }
    if (a == null) {
        return 1;
    }
    if (b == null) {
        return 0;
    }
    const timeDiff = a.time - b.time;
    if (timeDiff !== 0) {
        return timeDiff;
    }
    return a.level - b.level;
};

const mergePostCommandLogs = (postCommandLogA: PostCommandLog, postCommandLogB: PostCommandLog): PostCommandLog => {
    const commands = postCommandLogA.commands.concat(postCommandLogB.commands);

    const sortedCommands = commands.sort((a, b) =>
            // reversed time ordering
            epochCompare(b.epoch, a.epoch)
        ).filter((value, index, cmds) =>
            // filter out doubles
            index === 0
            ? true
            : arePostCommandsEqual(value, cmds[index - 1]) === false
        );

    return {
        commands: sortedCommands,
    };
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

const shareNewPostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = defaultPostOptions,
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

const updatePostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
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

const removePostSwarm = async (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
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

const getUnsyncedPostCommandLog = (postCommandLog: PostCommandLog): PostCommandLog => {
    const unsyncedCommands: PostCommand[] = [];
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.epoch != null) {
            return {
                ...postCommandLog,
                commands: unsyncedCommands,
            };
        }
        unsyncedCommands.push(postCommand);
    }
    return {
        ...postCommandLog,
        commands: unsyncedCommands,
    };
};

const uploadPostCommandPost = async (postCommand: PostCommand): Promise<PostCommand> => {
    if (postCommand.type === 'update') {
        const post = {
            ...postCommand.post,
            link: undefined,
        };
        const uploadedPost = await uploadPost(post,  defaultPostOptions.imageResizer, defaultPostOptions.modelHelper);
        return {
            ...postCommand,
            post: uploadedPost,
        };
    } else {
        return postCommand;
    }
};

const uploadPostCommandToSwarm = async (postCommand: PostCommand, swarmApi: Swarm.Api): Promise<PostCommand> => {
    const postCommandAfterUploadPost = await uploadPostCommandPost(postCommand);
    const postCommandAfterFeedUpdated = await addPostCommandToFeed(postCommandAfterUploadPost, swarmApi.feed);
    const postCommandAfterPostFeedUpdated = /* TODO */ postCommandAfterFeedUpdated;
    return postCommandAfterPostFeedUpdated;
};

const uploadUnsyncedPostCommandsToSwarm = async (postCommandLog: PostCommandLog, swarmApi: Swarm.Api): Promise<PostCommandLog> => {
    const unsyncedCommandLog = getUnsyncedPostCommandLog(postCommandLog);
    const syncedCommands = postCommandLog.commands.slice(unsyncedCommandLog.commands.length);
    const reversedUnsyncedCommands = unsyncedCommandLog.commands.reverse();

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
    const uploadedPostCommandLog = await uploadUnsyncedPostCommandsToSwarm(mergedPostCommandLog, swarmApi);

    return uploadedPostCommandLog;
};

const fetchSwarmPostCommandLog = async (swarmFeedApi: Swarm.FeedApi): Promise<PostCommandLog> => {
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

const getLatestPostsFromLog = (postCommandLog: PostCommandLog, count: number | undefined = undefined): Post[] => {
    const updatePostCommands = getLatestUpdatePostCommandsFromLog(postCommandLog, count);
    const updatedPosts = updatePostCommands.map(postCommand => postCommand.post);
    return updatedPosts;
};

const getLatestUpdatePostCommandsFromLog = (postCommandLog: PostCommandLog, count: number | undefined = undefined): PostCommand[] => {
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

const testSharePost = (
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

const testSharePostSwarm = async (
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

const testSharePosts = async (source = ''): Promise<PostCommandLog> => {
    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed, source);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1, source);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2, source);

    Debug.log('testSharePosts', postCommandLogAfter3);

    return postCommandLogAfter3;
};

const testSharePostsSwarm = async (source = ''): Promise<PostCommandLog> => {
    const postCommandLogAfter1 = await testSharePostSwarm(1, emptyPostCommandFeed, source);
    const postCommandLogAfter2 = await testSharePostSwarm(2, postCommandLogAfter1, source);
    const postCommandLogAfter3 = await testSharePostSwarm(3, postCommandLogAfter2, source);

    Debug.log('testSharePostsSwarm', postCommandLogAfter3);

    return postCommandLogAfter3;
};

const testSharePostsWithUpdate = async () => {
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

const testSharePostsWithRemove = async () => {
    const source = '';

    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = removePost(post3, source, postCommandLogAfter3);

    const posts = getLatestPostsFromLog(postCommandLogAfter4, 3);
    Debug.log('testSharePostsWithRemove', 'posts', posts);
};

const testSharePostsWithRemoveOnSwarm = async () => {
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

const testListAllPosts = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    await fetchSwarmPostCommandLog(swarmFeedApi);
};

const testFetchLastThreePosts = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    const swarmPostCommandLog = await fetchSwarmPostCommandLog(swarmFeedApi);
    const posts = await getLatestPostsFromLog(swarmPostCommandLog, 3);
    Debug.log('fetchLastTwoPosts', 'posts', posts);
};

const testSyncLocalEmptyPostCommandLogWithSwarm = async () => {
    const swarmApi = Swarm.makeApi(testIdentity);
    const swarmSource = 'swarm';
    await testSharePostsSwarm(swarmSource);
    const syncedPostCommandLog = await syncPostCommandLogWithSwarm(emptyPostCommandFeed, swarmApi);
    Debug.log('testSyncPostCommandLogWithSwarm', 'syncedPostCommandLog', syncedPostCommandLog);
};

const testSyncLocalPostCommandLogWithSwarm = async () => {
    const swarmApi = Swarm.makeApi(testIdentity);
    const swarmSource = 'swarm';
    await testSharePostsSwarm(swarmSource);

    const localPostCommandFeed = await testSharePosts('local');
    const syncedPostCommandLog = await syncPostCommandLogWithSwarm(localPostCommandFeed, swarmApi);
    Debug.log('testSyncPostCommandLogWithSwarm', 'syncedPostCommandLog', syncedPostCommandLog);

    const posts = getLatestPostsFromLog(syncedPostCommandLog);
    Debug.log('testSyncPostCommandLogWithSwarm', 'posts', posts);
};

const testResyncLocalPostCommandLogWithSwarm = async () => {
    const swarmApi = Swarm.makeApi(testIdentity);
    const swarmSource = 'swarm';
    await testSharePostsSwarm(swarmSource);

    const localPostCommandFeed = await testSharePosts('local');
    const syncedPostCommandLog = await syncPostCommandLogWithSwarm(localPostCommandFeed, swarmApi);
    Debug.log('testResyncLocalPostCommandLogWithSwarm', 'syncedPostCommandLog', syncedPostCommandLog);

    const posts = getLatestPostsFromLog(syncedPostCommandLog);
    Debug.log('testResyncLocalPostCommandLogWithSwarm', 'posts', posts);

    const resyncedPostCommandLog = await syncPostCommandLogWithSwarm(syncedPostCommandLog, swarmApi);
    const resyncedPosts = getLatestPostsFromLog(resyncedPostCommandLog);
    Debug.log('testResyncLocalPostCommandLogWithSwarm', 'posts', resyncedPosts);
};

const testSyncConcurrentPostCommandLogWithSwarm = async () => {
    const swarmApi = Swarm.makeApi(testIdentity);
    const swarmSource = 'swarm';
    const localSource = 'local';
    await testSharePostsSwarm(swarmSource);

    const localPostCommandLog = await testSharePosts(localSource);
    const syncedPostCommandLog = await syncPostCommandLogWithSwarm(localPostCommandLog, swarmApi);
    Debug.log('testSyncConcurrentPostCommandLogWithSwarm', 'syncedPostCommandLog', syncedPostCommandLog);

    const posts = getLatestPostsFromLog(syncedPostCommandLog);
    Debug.log('testSyncConcurrentPostCommandLogWithSwarm', 'posts', posts);

    // concurrent update
    const localPostCommandLogAfterUpdate = await testSharePost(4, syncedPostCommandLog, localSource);
    const remotePostCommandLogAfterUpdate = await testSharePostSwarm(4, syncedPostCommandLog, swarmSource);

    const resyncedPostCommandLog = await syncPostCommandLogWithSwarm(localPostCommandLogAfterUpdate, swarmApi);
    Debug.log('testSyncConcurrentPostCommandLogWithSwarm', 'syncedPostCommandLog', resyncedPostCommandLog);

    const resyncedPosts = getLatestPostsFromLog(resyncedPostCommandLog);
    Debug.log('testSyncConcurrentPostCommandLogWithSwarm', 'resyncedPosts', resyncedPosts);
};

const testDownloadFeedTemplate = async () => {
    const swarmApi = Swarm.makeApi(testIdentity);
    const feedTemplate = await swarmApi.feed.downloadFeedTemplate();

    Debug.log('testDownloadFeedTemplate', feedTemplate);
};

export const allTests = {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testSharePostsWithRemoveOnSwarm,
    testListAllPosts,
    testFetchLastThreePosts,
    testSyncLocalEmptyPostCommandLogWithSwarm,
    testSyncLocalPostCommandLogWithSwarm,
    testSyncConcurrentPostCommandLogWithSwarm,
    testResyncLocalPostCommandLogWithSwarm,
    testDownloadFeedTemplate,
};
