import { makePrivateSharingProtocolTester, PrivateSharingAction, makePost } from './privateSharingTestHelpers';
import { assertEquals } from '../helpers/assertEquals';

const areJSONEqual = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

const testPrivateSharingBasicSyncing = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePostText('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],
    ];
    const outputState = await tester.execute(actions);

    const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
    const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

    assertEquals(1, alicePosts.length);
    assertEquals(alicePosts, bobPosts, areJSONEqual);
};

const testPrivateSharingSyncingBeforePost = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePostText('hello Bob')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
    ];
    const outputState = await tester.execute(actions);

    const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
    const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

    assertEquals(1, alicePosts.length);
    assertEquals(0, bobPosts.length);
};

const testPrivateSharingBothSidesPostAndSync = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePostText('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sharePostText('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
    ];
    const outputState = await tester.execute(actions);

    const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
    const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

    assertEquals(2, alicePosts.length);
    assertEquals(alicePosts, bobPosts, areJSONEqual);
};

const testPrivateSharingRemovePostBeforeSyncing = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const post = makePost('test');
    const actions: PrivateSharingAction[] = [
        [tester.BOB, tester.sharePostText('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sharePostText('hello Bob')],
        [tester.ALICE, tester.sharePost(post)],
        [tester.ALICE, tester.deletePost(post._id)],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],

    ];
    const outputState = await tester.execute(actions);

    const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
    const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

    assertEquals(2, alicePosts.length);
    assertEquals(alicePosts, bobPosts, areJSONEqual);
};

const testPrivateSharingRemovePostAfterSyncing = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const post = makePost('test');
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePostText('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sharePostText('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
        [tester.ALICE, tester.sharePost(post)],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.deletePost(post._id)],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],

    ];
    const outputState = await tester.execute(actions);

    const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
    const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

    assertEquals(2, alicePosts.length);
    assertEquals(alicePosts, bobPosts, areJSONEqual);
};

const testPrivateSharingRemoveOthersPost = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const post = makePost('test');
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePostText('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sharePostText('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
        [tester.ALICE, tester.sharePost(post)],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],
        [tester.BOB, tester.deletePost(post._id)],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
    ];
    const outputState = await tester.execute(actions);

    const alicePosts = tester.listPosts(outputState.contexts[tester.ALICE]);
    const bobPosts = tester.listPosts(outputState.contexts[tester.BOB]);

    assertEquals(2, alicePosts.length);
    assertEquals(alicePosts, bobPosts, areJSONEqual);
};

export const privateSharingTests = {
    testPrivateSharingBasicSyncing,
    testPrivateSharingSyncingBeforePost,
    testPrivateSharingBothSidesPostAndSync,
    testPrivateSharingRemovePostBeforeSyncing,
    testPrivateSharingRemovePostAfterSyncing,
    testPrivateSharingRemoveOthersPost,
};
