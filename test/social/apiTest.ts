import {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testMergeTwoLocalPostCommandLogs,
    testMergeSameLocalPostCommandLogs,
    testMergeTwoLocalPostCommandLogsWithCommonAncestors,
    testMergeTwoCommandLogsWithCommonAncestors,
    testMergeTwoCommandLogsWithUndefinedLeft,
    testMergeTwoCommandLogsWithUndefinedRight,
    testGetLatestUpdatePostCommandsFromLogWithUpdate,
    testGetLatestUpdatePostCommandsFromLogWithRemove,
} from '../../src/social/apiTest';
import { Debug } from '../../src/Debug';

beforeEach(() => Debug.setDebug(false));

test('Test sharing post', async () => testSharePost());
test('Test sharing multiple posts', async () => testSharePosts());
test('Test sharing posts with update', async () => testSharePostsWithUpdate());
test('Test sharing posts with remove', async () => testSharePostsWithRemove());
test('Test merging two local post command logs', async () => testMergeTwoLocalPostCommandLogs());
test('Test merging the same local post command logs', async () => testMergeSameLocalPostCommandLogs());
test('Test merging two local local post command logs with common ancestors', async () => testMergeTwoLocalPostCommandLogsWithCommonAncestors());
test('Test merging two post command logs with common ancestors', async () => testMergeTwoCommandLogsWithCommonAncestors());
test('Test merging two post command logs with undefined epoch on the left', async () => testMergeTwoCommandLogsWithUndefinedLeft());
test('Test merging two post command logs with undefined epoch on the right', async () => testMergeTwoCommandLogsWithUndefinedRight());
test('Test getting posts from the log after update', async () => testGetLatestUpdatePostCommandsFromLogWithUpdate());
test('Test getting posts from the log after remove', async () => testGetLatestUpdatePostCommandsFromLogWithRemove());
