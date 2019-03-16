import {
    PostCommand,
    PostCommandLog,
    sortAndFilterPostCommands,
    arePostCommandIdsEqual,
    getHighestSeenTimestampFromLog,
    shareNewPost,
    updatePost,
    removePost,
    mergePostCommandLogs,
    getLatestPostsFromLog,
    getPostCommandFromLogById,
} from './api';
import { Post} from '../models/Post';
import { Debug } from '../Debug';

const assertPostCommandsAreSortedAndUnique = (commands: PostCommand[]): void => {
    const sortedCommands = sortAndFilterPostCommands(commands);
    if (sortedCommands.length !== commands.length) {
        throw new Error(`assertPostCommandsAreSortedAndUnique failed: length: ${sortedCommands.length} !== ${commands.length}`);
    }
    for (let i = 0; i < sortedCommands.length; i++) {
        if (arePostCommandIdsEqual(sortedCommands[i].id, commands[i].id) === false) {
            throw new Error(`assertPostCommandsAreSortedAndUnique failed: diff ${i}: ${sortedCommands[i].id.timestamp} ${commands[i].id.timestamp}`);
        }
    }
};

const assertFirstPostCommandHasHighestTimestamp = (postCommandLog: PostCommandLog): void => {
    const highestTimestampFromLog = getHighestSeenTimestampFromLog(postCommandLog);
    const firstCommandTimestamp = postCommandLog.commands.length > 0
        ? postCommandLog.commands[0].id.timestamp
        : 0
        ;

    if (highestTimestampFromLog !== firstCommandTimestamp) {
        throw new Error(`assertFirstPostCommandHasHighestTimestamp first timestamp failed: ${firstCommandTimestamp} != ${highestTimestampFromLog}`);
    }

    for (const command of postCommandLog.commands) {
        if (command.id.timestamp > highestTimestampFromLog) {
            throw new Error(`assertFirstPostCommandHasHighestTimestamp failed: ${command.id.timestamp} > ${highestTimestampFromLog}, ${JSON.stringify(postCommandLog.commands)}`);
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

const assertParentsKeepCasualOrdering = (postCommandLog: PostCommandLog) => {
    for (let i = 0; i < postCommandLog.commands.length; i++) {
        const command = postCommandLog.commands[i];
        if (command.parentId.timestamp !== 0) {
            if (command.parentId.timestamp >= command.id.timestamp) {
                throw new Error(`assertParentsKeepCasualOrdering failed: command ${i} has timestamp ${command.id.timestamp} parent has ${command.parentId.timestamp}}`);
            }
        }
    }
};

const assertNoDanglingReferences = (postCommandLog: PostCommandLog) => {
    for (const command of postCommandLog.commands) {
        if (command.parentId.timestamp !== 0) {
            const parent = getPostCommandFromLogById(postCommandLog, command.parentId);
            if (parent == null) {
                throw new Error(`assertNoDanglingReferences failed: command ${command.id.timestamp} has dangling parent ${command.parentId.timestamp}}`);
            }
        }
    }
};

export const assertPostCommandLogInvariants = (postCommandLog: PostCommandLog): void => {
    assertPostCommandsAreSortedAndUnique(postCommandLog.commands);
    assertFirstPostCommandHasHighestTimestamp(postCommandLog);
    assertThereAreNoUnsyncedCommandsAfterSyncedCommands(postCommandLog);
    assertParentsKeepCasualOrdering(postCommandLog);
    assertNoDanglingReferences(postCommandLog);
};

export const assertPostCommandLogsAreEqual = (postCommandLogA: PostCommandLog, postCommandLogB: PostCommandLog) => {
    if (postCommandLogA.commands.length !== postCommandLogB.commands.length) {
        throw new Error(`assertPostCommandLogsAreEqual failed: ${postCommandLogA.commands.length} != ${postCommandLogB.commands.length}`);
    }
    for (let i = 0; i < postCommandLogA.commands.length; i++) {
        if (arePostCommandIdsEqual(postCommandLogA.commands[i].id, postCommandLogB.commands[i].id) === false) {
            throw new Error(`assertPostCommandLogsAreEqual failed: diff at ${i}`);
        }
    }
};

export const assertEquals = <T>(expected: T, actual: T) => {
    if (expected !== actual) {
        // tslint:disable-next-line:no-console
        console.log('expected: ', expected);
        // tslint:disable-next-line:no-console
        console.log('actual: ', actual);
        throw new Error(`assertEquals failed: expected: ${expected}, actual: ${actual}`);
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

export const testSharePosts = (source = '') => {
    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed, source);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1, source);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2, source);

    Debug.log('testSharePosts', postCommandLogAfter3);

    return postCommandLogAfter3;
};

export const testSharePostsWithUpdate = () => {
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

    return postCommandLogAfter4;
};

export const testSharePostsWithRemove = () => {
    const source = '';

    const postCommandLogAfter1 = testSharePost(1, emptyPostCommandFeed);
    const postCommandLogAfter2 = testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = testSharePost(3, postCommandLogAfter2);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = removePost(post3, source, postCommandLogAfter3);

    assertPostCommandLogInvariants(postCommandLogAfter4);

    const posts = getLatestPostsFromLog(postCommandLogAfter4, 3);
    Debug.log('testSharePostsWithRemove', 'posts', posts);

    return postCommandLogAfter4;
};

export const testMergeTwoLocalPostCommandLogs = () => {
    const localSource1 = 'local1';
    const localPostCommandFeed1 = testSharePosts(localSource1);
    assertPostCommandLogInvariants(localPostCommandFeed1);

    const localSource2 = 'local2';
    const localPostCommandFeed2 = testSharePosts(localSource2);
    assertPostCommandLogInvariants(localPostCommandFeed2);

    const mergedPostCommandLog = mergePostCommandLogs(localPostCommandFeed1, localPostCommandFeed2);
    Debug.log('testMergeTwoLocalPostCommandLogs', 'mergedPostCommandLog', mergedPostCommandLog);
    assertPostCommandLogInvariants(mergedPostCommandLog);

    const posts = getLatestPostsFromLog(mergedPostCommandLog);
    Debug.log('testMergeTwoLocalPostCommandLogs', 'posts', posts);
};

export const testGetLatestUpdatePostCommandsFromLogWithUpdate = () => {
    const postCommandLogAfterUpdate = testSharePostsWithUpdate();
    const posts = getLatestPostsFromLog(postCommandLogAfterUpdate);

    assertEquals(3, posts.length);
};

export const testGetLatestUpdatePostCommandsFromLogWithRemove = () => {
    const postCommandLogAfterRemove = testSharePostsWithRemove();
    const posts = getLatestPostsFromLog(postCommandLogAfterRemove);

    assertEquals(2, posts.length);
};

export const apiTests = {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testMergeTwoLocalPostCommandLogs,
    testGetLatestUpdatePostCommandsFromLogWithUpdate,
    testGetLatestUpdatePostCommandsFromLogWithRemove,
};
