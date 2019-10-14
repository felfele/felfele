import { makePrivateChannelProtocolTester, PrivateSharingAction, makePost } from './privateChannelProtocolTestHelpers';
import { assertEquals } from '../helpers/assertEquals';
import deepEqual from 'deep-equal';

export const privateChannelProtocolTests = {
    testPrivateChannelProtocolBasicSyncing: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const actions: PrivateSharingAction[] = [
            [tester.ALICE, tester.sharePostText('hello Bob', 1)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sync()],
        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(1, alicePosts.length);
        assertEquals(alicePosts, bobPosts, deepEqual);
    },
    testPrivateChannelProtocolSyncingBeforePost: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const actions: PrivateSharingAction[] = [
            [tester.ALICE, tester.sharePostText('hello Bob', 1)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sync()],
        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(1, alicePosts.length);
        assertEquals(0, bobPosts.length);
    },
    testPrivateChannelProtocolBothSidesPostAndSync: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const actions: PrivateSharingAction[] = [
            [tester.ALICE, tester.sharePostText('hello Bob', 1)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sharePostText('hello Alice', 2)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sync()],
        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(alicePosts, bobPosts, deepEqual);
    },
    testPrivateChannelProtocolBothSidesPostAndSyncSameTime: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const actions: PrivateSharingAction[] = [
            [tester.ALICE, tester.sharePostText('hello Bob', 1)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sharePostText('hello Alice', 1)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sync()],
        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(alicePosts, bobPosts, deepEqual);
    },
    testPrivateChannelProtocolRemovePostBeforeSyncing: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const post1 = makePost('hello Alice', 1);
        const post2 = makePost('hello Bob', 2);
        const post3 = makePost('test', 3);
        const actions: PrivateSharingAction[] = [
            [tester.BOB, tester.sharePost(post1)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sharePost(post2)],
            [tester.ALICE, tester.sharePost(post3)],
            [tester.ALICE, tester.deletePost(post3._id)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sync()],

        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(alicePosts, bobPosts, deepEqual);
    },
    testPrivateChannelProtocolRemovePostAfterSyncing: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const post1 = makePost('hello Alice', 1);
        const post2 = makePost('hello Bob', 2);
        const post3 = makePost('test', 3);
        const actions: PrivateSharingAction[] = [
            [tester.ALICE, tester.sharePost(post1)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sharePost(post2)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sync()],
            [tester.ALICE, tester.sharePost(post3)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.deletePost(post3._id)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sync()],

        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(alicePosts, bobPosts, deepEqual);
    },
    testPrivateChannelProtocolRemoveOthersPost: async () => {
        const tester = await makePrivateChannelProtocolTester();
        const post1 = makePost('hello Alice', 1);
        const post2 = makePost('hello Bob', 2);
        const post3 = makePost('test', 3);
        const actions: PrivateSharingAction[] = [
            [tester.ALICE, tester.sharePost(post1)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sharePost(post2)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sync()],
            [tester.ALICE, tester.sharePost(post3)],
            [tester.ALICE, tester.sync()],
            [tester.BOB, tester.sync()],
            [tester.BOB, tester.deletePost(post3._id)],
            [tester.BOB, tester.sync()],
            [tester.ALICE, tester.sync()],
        ];
        const outputState = await tester.execute(actions);

        const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
        const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(alicePosts, bobPosts, deepEqual);
    },
};
