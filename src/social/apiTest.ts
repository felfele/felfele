import {
    PostCommand,
    PostCommandLog,
    sortAndFilterPostCommands,
    arePostCommandsEqual,
    getHighestSeenTimestampFromLog,
    shareNewPost,
    updatePost,
    removePost,
    mergePostCommandLogs,
    getLatestPostsFromLog,
} from './api';
import { Post} from '../models/Post';
import { Debug } from '../Debug';

const assertPostCommandsAreSortedAndUnique = (commands: PostCommand[]): void => {
    const sortedCommands = sortAndFilterPostCommands(commands);
    if (sortedCommands.length !== commands.length) {
        throw new Error(`assertPostCommandsAreSortedAndUnique failed: length: ${sortedCommands.length} !== ${commands.length}`);
    }
    for (let i = 0; i < sortedCommands.length; i++) {
        if (arePostCommandsEqual(sortedCommands[i], commands[i]) === false) {
            throw new Error(`assertPostCommandsAreSortedAndUnique failed: diff ${i}: ${sortedCommands[i].timestamp} ${commands[i].timestamp}`);
        }
    }
};

const assertFirstPostCommandHasHighestTimestamp = (postCommandLog: PostCommandLog): void => {
    const highestTimestampFromLog = getHighestSeenTimestampFromLog(postCommandLog);
    const firstCommandTimestamp = postCommandLog.commands.length > 0
        ? postCommandLog.commands[0].timestamp
        : 0
        ;

    if (highestTimestampFromLog !== firstCommandTimestamp) {
        throw new Error(`assertFirstPostCommandHasHighestTimestamp first timestamp failed: ${firstCommandTimestamp} != ${highestTimestampFromLog}`);
    }

    for (const command of postCommandLog.commands) {
        if (command.timestamp > highestTimestampFromLog) {
            throw new Error(`assertFirstPostCommandHasHighestTimestamp failed: ${command.timestamp} > ${highestTimestampFromLog}, ${JSON.stringify(postCommandLog.commands)}`);
        }
    }
};

const assertThereAreNoUnsyncedCommandsAfterSyncedCommands = (postCommandLog: PostCommandLog) => {
    const firstSyncedCommand = postCommandLog.commands.findIndex(value => value.epoch != null);
    if (firstSyncedCommand === -1) {
        return;
    }
    for (let i = firstSyncedCommand; i < postCommandLog.commands.length; i++) {
        if (postCommandLog.commands[i].epoch == null) {
            throw new Error(`assertThereAreNoUnsyncedCommandsAfterSyncedCommands failed: command ${i} is unsynced}`);
        }
    }
};

export const assertPostCommandLogInvariants = (postCommandLog: PostCommandLog): void => {
    assertPostCommandsAreSortedAndUnique(postCommandLog.commands);
    assertFirstPostCommandHasHighestTimestamp(postCommandLog);
    assertThereAreNoUnsyncedCommandsAfterSyncedCommands(postCommandLog);
};

export const assertPostCommandLogsAreEqual = (postCommandLogA: PostCommandLog, postCommandLogB: PostCommandLog) => {
    if (postCommandLogA.commands.length !== postCommandLogB.commands.length) {
        throw new Error(`assertPostCommandLogsAreEqual failed: ${postCommandLogA.commands.length} != ${postCommandLogB.commands.length}`);
    }
    for (let i = 0; i < postCommandLogA.commands.length; i++) {
        if (arePostCommandsEqual(postCommandLogA.commands[i], postCommandLogB.commands[i]) === false) {
            throw new Error(`assertPostCommandLogsAreEqual failed: diff at ${i}`);
        }
    }
};

export const emptyPostCommandFeed: PostCommandLog = {
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

export const testSharePosts = async (source = ''): Promise<PostCommandLog> => {
    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed, source);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1, source);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2, source);

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

    assertPostCommandLogInvariants(postCommandLogAfter4);

    Debug.log('testSharePostsWithUpdate', postCommandLogAfter4);
};

export const testSharePostsWithRemove = async () => {
    const source = '';

    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = removePost(post3, source, postCommandLogAfter3);

    assertPostCommandLogInvariants(postCommandLogAfter4);

    const posts = getLatestPostsFromLog(postCommandLogAfter4, 3);
    Debug.log('testSharePostsWithRemove', 'posts', posts);
};

export const testMergeTwoLocalPostCommandLogs = async () => {
    const localSource1 = 'local1';
    const localPostCommandFeed1 = await testSharePosts(localSource1);
    assertPostCommandLogInvariants(localPostCommandFeed1);

    const localSource2 = 'local2';
    const localPostCommandFeed2 = await testSharePosts(localSource2);
    assertPostCommandLogInvariants(localPostCommandFeed2);

    const mergedPostCommandLog = await mergePostCommandLogs(localPostCommandFeed1, localPostCommandFeed2);
    Debug.log('testMergeTwoLocalPostCommandLogs', 'mergedPostCommandLog', mergedPostCommandLog);
    assertPostCommandLogInvariants(mergedPostCommandLog);

    const posts = getLatestPostsFromLog(mergedPostCommandLog);
    Debug.log('testMergeTwoLocalPostCommandLogs', 'posts', posts);
};

export const apiTests = {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testMergeTwoLocalPostCommandLogs,
};
