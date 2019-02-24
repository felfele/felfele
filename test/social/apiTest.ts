import {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testSharePostsWithRemove,
    testMergeTwoLocalPostCommandLogs,
} from '../../src/social/apiTest';
import { Debug } from '../../src/Debug';

beforeAll(() => Debug.setDebug(false));

test('Test sharing post', async () => testSharePost());
test('Test sharing multiple posts', async () => testSharePosts());
test('Test sharing posts with update', async () => testSharePostsWithUpdate());
test('Test sharing posts with remove', async () => testSharePostsWithRemove());
test('Test merging two local post command logs', async () => testMergeTwoLocalPostCommandLogs());
