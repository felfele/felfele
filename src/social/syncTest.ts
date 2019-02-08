import {
    makeSwarmStorage,
} from '../swarm-social/swarmStorage';
import * as Swarm from '../swarm/Swarm';
import {
    PostCommandLog,
    PostCommandLogStorage,
    removePost,
    getLatestPostsFromLog,
} from './api';
import {
    emptyPostCommandFeed,
    testSharePost,
    testSharePosts,
    assertPostCommandLogInvariants,
    assertPostCommandLogsAreEqual,
} from './apiTest';
import { Debug } from '../Debug';
import {
    syncPostCommandLogWithStorage,
    uploadUnsyncedPostCommandsToStorage,
} from './sync';

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

export const defaultStorage = makeSwarmStorage(defaultSwarmApi);

const testSharePostStorage = async (id: number, postCommandLog: PostCommandLog, source = 'storage', storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const postCommandLogAfterShare = await testSharePost(id, postCommandLog, source);
    const syncedCommandLog = await uploadUnsyncedPostCommandsToStorage(postCommandLogAfterShare, storage);
    Debug.log('testSharePostStorage', 'syncedCommandLog', syncedCommandLog);
    assertPostCommandLogInvariants(syncedCommandLog);

    return syncedCommandLog;
};

const testSharePostsStorage = async (source = 'storage', storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const postCommandLogAfter1 = await testSharePost(1, emptyPostCommandFeed, source);
    const postCommandLogAfter2 = await testSharePost(2, postCommandLogAfter1, source);
    const postCommandLogAfter3 = await testSharePost(3, postCommandLogAfter2, source);
    assertPostCommandLogInvariants(postCommandLogAfter3);

    const syncedCommandLog = await uploadUnsyncedPostCommandsToStorage(postCommandLogAfter3, storage);
    Debug.log('testSharePostsStorage', 'syncedCommandLog', syncedCommandLog);
    assertPostCommandLogInvariants(syncedCommandLog);

    return syncedCommandLog;
};

const testSharePostsWithRemoveOnStorage = async (source = '', storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const postCommandLogAfter3 = await testSharePostsStorage(source, storage);
    const post3 = postCommandLogAfter3.commands[2].post;
    const postCommandLogAfter4 = await removePost(post3, source, postCommandLogAfter3);

    const syncedCommandLog = await uploadUnsyncedPostCommandsToStorage(postCommandLogAfter4, storage);
    Debug.log('testSharePostsStorage', 'syncedCommandLog', syncedCommandLog);
    assertPostCommandLogInvariants(syncedCommandLog);

    const storagePostCommandLog = await storage.downloadPostCommandLog();
    const posts = getLatestPostsFromLog(storagePostCommandLog, 3);
    Debug.log('testSharePostsWithRemove', 'posts', posts);
    assertPostCommandLogInvariants(storagePostCommandLog);

    assertPostCommandLogsAreEqual(syncedCommandLog, storagePostCommandLog);

    return storagePostCommandLog;
};

const testListAllPosts = async (storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    return await storage.downloadPostCommandLog();
};

const testFetchLastThreePosts = async (storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const swarmPostCommandLog = await storage.downloadPostCommandLog();
    const posts = await getLatestPostsFromLog(swarmPostCommandLog, 3);
    Debug.log('fetchLastTwoPosts', 'posts', posts);
    return swarmPostCommandLog;
};

const testSyncLocalEmptyPostCommandLogWithStorage = async (source = 'storage', storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    await testSharePostsStorage(source, storage);
    const syncedPostCommandLog = await syncPostCommandLogWithStorage(emptyPostCommandFeed, storage);
    Debug.log('testSyncLocalEmptyPostCommandLogWithStorage', 'syncedPostCommandLog', syncedPostCommandLog);
    assertPostCommandLogInvariants(syncedPostCommandLog);

    return syncedPostCommandLog;
};

const testSyncLocalPostCommandLogWithStorage = async (storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const storageSource = 'storage';
    const storagePostCommandFeed = await testSharePostsStorage(storageSource, storage);
    assertPostCommandLogInvariants(storagePostCommandFeed);

    const localPostCommandFeed = await testSharePosts('local');
    assertPostCommandLogInvariants(localPostCommandFeed);

    const syncedPostCommandLog = await syncPostCommandLogWithStorage(localPostCommandFeed, storage);
    Debug.log('testSyncLocalPostCommandLogWithStorage', 'syncedPostCommandLog', syncedPostCommandLog);
    assertPostCommandLogInvariants(syncedPostCommandLog);

    const posts = getLatestPostsFromLog(syncedPostCommandLog);
    Debug.log('testSyncLocalPostCommandLogWithStorage', 'posts', posts);

    return syncedPostCommandLog;
};

const testResyncLocalPostCommandLogWithStorage = async (storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const storagePostCommandLog = await testSharePostsStorage('storage', storage);

    const localPostCommandLog = await testSharePosts('local');
    const syncedPostCommandLog = await syncPostCommandLogWithStorage(localPostCommandLog, storage);
    Debug.log('testResyncLocalPostCommandLogWithStorage', 'syncedPostCommandLog', syncedPostCommandLog);
    assertPostCommandLogInvariants(syncedPostCommandLog);

    const posts = getLatestPostsFromLog(syncedPostCommandLog);
    Debug.log('testResyncLocalPostCommandLogWithStorage', 'posts', posts);

    const resyncedPostCommandLog = await syncPostCommandLogWithStorage(syncedPostCommandLog, storage);
    assertPostCommandLogInvariants(resyncedPostCommandLog);
    assertPostCommandLogsAreEqual(resyncedPostCommandLog, syncedPostCommandLog);

    const resyncedPosts = getLatestPostsFromLog(resyncedPostCommandLog);
    Debug.log('testResyncLocalPostCommandLogWithStorage', 'posts', resyncedPosts);

    return resyncedPostCommandLog;
};

const testSyncConcurrentPostCommandLogWithStorage = async (storage: PostCommandLogStorage = defaultStorage): Promise<PostCommandLog> => {
    const storageSource = 'storage';
    const localSource = 'local';
    const storagePostCommandLog = await testSharePostsStorage(storageSource, storage);

    const localPostCommandLog = await testSharePosts(localSource);
    const syncedPostCommandLog = await syncPostCommandLogWithStorage(localPostCommandLog, storage);
    Debug.log('testSyncConcurrentPostCommandLogWithStorage', 'syncedPostCommandLog', syncedPostCommandLog);
    assertPostCommandLogInvariants(syncedPostCommandLog);

    const posts = getLatestPostsFromLog(syncedPostCommandLog);
    Debug.log('testSyncConcurrentPostCommandLogWithStorage', 'posts', posts);

    // concurrent update
    const localPostCommandLogAfterUpdate = await testSharePost(4, syncedPostCommandLog, localSource);
    assertPostCommandLogInvariants(localPostCommandLogAfterUpdate);

    const remotePostCommandLogAfterUpdate = await testSharePostStorage(4, syncedPostCommandLog, storageSource, storage);
    assertPostCommandLogInvariants(remotePostCommandLogAfterUpdate);

    const resyncedPostCommandLog = await syncPostCommandLogWithStorage(localPostCommandLogAfterUpdate, storage);
    Debug.log('testSyncConcurrentPostCommandLogWithStorage', 'syncedPostCommandLog', resyncedPostCommandLog);
    assertPostCommandLogInvariants(resyncedPostCommandLog);

    const resyncedPosts = getLatestPostsFromLog(resyncedPostCommandLog);
    Debug.log('testSyncConcurrentPostCommandLogWithStorage', 'resyncedPosts', resyncedPosts);

    return resyncedPostCommandLog;
};

const testDownloadFeedTemplate = async () => {
    const swarmApi = defaultSwarmApi;
    const feedTemplate = await swarmApi.feed.downloadFeedTemplate();

    Debug.log('testDownloadFeedTemplate', feedTemplate);
};

export const syncTests = {
    testSharePostStorage,
    testSharePostsStorage,
    testSharePostsWithRemoveOnStorage,
    testListAllPosts,
    testFetchLastThreePosts,
    testSyncLocalEmptyPostCommandLogWithStorage,
    testSyncLocalPostCommandLogWithStorage,
    testSyncConcurrentPostCommandLogWithStorage,
    testResyncLocalPostCommandLogWithStorage,
    testDownloadFeedTemplate,
};
