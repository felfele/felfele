import { makePrivateSharingProtocolTester, PrivateSharingAction } from './privateSharingTestHelpers';
import { assertEquals } from '../helpers/assertEquals';
import { HexString } from '../helpers/opaqueTypes';

const areJSONEqual = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

const testPrivateSharingBasicSyncing = async () => {
    const tester = await makePrivateSharingProtocolTester();
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePost('hello Bob')],
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
        [tester.ALICE, tester.sharePost('hello Bob')],
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
        [tester.ALICE, tester.sharePost('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sharePost('hello Alice')],
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
    const postToBeDeletedId = 'cbdda25238b087fc48079b40c92b1f8de12344887c97f0b28696542321da5501' as HexString;
    const actions: PrivateSharingAction[] = [
        [tester.BOB, tester.sharePost('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sharePost('hello Bob')],
        [tester.ALICE, tester.sharePost('test', postToBeDeletedId)],
        [tester.ALICE, tester.deletePost(postToBeDeletedId)],
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
    const postToBeDeletedId = 'cbdda25238b087fc48079b40c92b1f8de12344887c97f0b28696542321da5501' as HexString;
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePost('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sharePost('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
        [tester.ALICE, tester.sharePost('test', postToBeDeletedId)],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.deletePost(postToBeDeletedId)],
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
    const postToBeDeletedId = 'cbdda25238b087fc48079b40c92b1f8de12344887c97f0b28696542321da5501' as HexString;
    const actions: PrivateSharingAction[] = [
        [tester.ALICE, tester.sharePost('hello Bob')],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sharePost('hello Alice')],
        [tester.BOB, tester.sync()],
        [tester.ALICE, tester.sync()],
        [tester.ALICE, tester.sharePost('test', postToBeDeletedId)],
        [tester.ALICE, tester.sync()],
        [tester.BOB, tester.sync()],
        [tester.BOB, tester.deletePost(postToBeDeletedId)],
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
