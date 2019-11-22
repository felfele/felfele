import { assertEquals } from '../helpers/assertEquals';
import {
    GroupAction,
    GroupTestConfig,
    GroupProfile,
    makePost,
    execute,
    createGroup,
    invite,
    receivePrivateInvite,
    sync,
    sharePostText,
    listPosts,
    sharePost,
    removePost,
    debugState,
    listGroupContextMembers,
    removePeer,
} from './groupTestHelpers';
import { HexString } from '../helpers/opaqueTypes';
import deepEqual = require('deep-equal');

const sharedSecret = 'abc' as HexString;
const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString;

const ALICE = GroupProfile.ALICE;
const BOB = GroupProfile.BOB;
const CAROL = GroupProfile.CAROL;
const DAVID = GroupProfile.DAVID;
const EVE = GroupProfile.EVE;
const MALLORY = GroupProfile.MALLORY;

const groupTestConfig: GroupTestConfig = [
    [ ALICE, [BOB, CAROL]],
    [ BOB, [ALICE, CAROL]],
    [ CAROL, [ALICE, BOB, DAVID]],
    [ DAVID, [CAROL]],
    [ EVE, []],
    [ MALLORY, []],
];

const aliceAndBobInviteWithSyncActions: GroupAction[] = [
    [ALICE, createGroup(topic, sharedSecret)],
    [ALICE, invite(BOB)],
    [ALICE, sync()],
    [BOB, receivePrivateInvite(ALICE)],
    [BOB, sync()],
];

const aliceBobAndCarolInviteWithSyncActions: GroupAction[] = [
    [ALICE, createGroup(topic, sharedSecret)],
    [ALICE, invite(BOB)],
    [ALICE, invite(CAROL)],
    [ALICE, sync()],
    [BOB, receivePrivateInvite(ALICE)],
    [BOB, sync()],
    [CAROL, receivePrivateInvite(ALICE)],
    [CAROL, sync()],
    [ALICE, sync()],
];

export const groupProtocolTests = {
    testGroupCreateGroup: async () => {
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
        ];
        const outputState = await execute(actions, groupTestConfig);
        const aliceContext = outputState.contexts[ALICE];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(0, aliceContext.peers.length);
    },

    testGroupBasicInvite: async () => {
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [BOB, receivePrivateInvite(ALICE)],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const bobContext = outputState.contexts[BOB];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(1, aliceContext.peers.length);
        assertEquals(aliceContext.peers[0].address, bobContext.profile.identity.address);

        assertEquals(1, bobContext.peers.length);
        assertEquals(bobContext.peers[0].address, aliceContext.profile.identity.address);
    },

    testGroupBasicInviteWithSync: async () => {
        const actions = aliceAndBobInviteWithSyncActions;
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const bobContext = outputState.contexts[BOB];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(1, aliceContext.peers.length);
        assertEquals(aliceContext.peers[0].address, bobContext.profile.identity.address);
        assertEquals(1, aliceContext.ownSyncData.logicalTime);
        assertEquals(0, aliceContext.ownSyncData.joinLogicalTime);

        assertEquals(1, bobContext.peers.length);
        assertEquals(bobContext.peers[0].address, aliceContext.profile.identity.address);
        assertEquals(1, bobContext.ownSyncData.logicalTime);
        assertEquals(1, bobContext.ownSyncData.joinLogicalTime);
    },

    testGroupInviteTwo: async () => {
        const actions = aliceBobAndCarolInviteWithSyncActions;
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const bobContext = outputState.contexts[BOB];
        const carolContext = outputState.contexts[CAROL];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        const aliceMembers = listGroupContextMembers(aliceContext);
        const bobMembers = listGroupContextMembers(bobContext);
        const carolMembers = listGroupContextMembers(carolContext);

        assertEquals(aliceContext.profile.identity.address, aliceMembers[0]);
        assertEquals(bobContext.profile.identity.address, aliceMembers[1]);
        assertEquals(carolContext.profile.identity.address, aliceMembers[2]);

        assertEquals(3, aliceMembers.length);
        assertEquals(aliceMembers, bobMembers, deepEqual);
        assertEquals(aliceMembers, carolMembers, deepEqual);

        assertEquals(2, aliceContext.ownSyncData.logicalTime);
        assertEquals(0, aliceContext.ownSyncData.joinLogicalTime);

        assertEquals(2, bobContext.ownSyncData.logicalTime);
        assertEquals(1, bobContext.ownSyncData.joinLogicalTime);

        assertEquals(2, carolContext.ownSyncData.logicalTime);
        assertEquals(2, carolContext.ownSyncData.joinLogicalTime);
    },

    testGroupInviteTwoAlternative: async () => {
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [ALICE, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sync()],
            [ALICE, invite(CAROL)],
            [CAROL, receivePrivateInvite(ALICE)],
            [ALICE, sync()],
            [BOB, sync()],
            [CAROL, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const bobContext = outputState.contexts[BOB];
        const carolContext = outputState.contexts[CAROL];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        const aliceMembers = listGroupContextMembers(aliceContext);
        const bobMembers = listGroupContextMembers(bobContext);
        const carolMembers = listGroupContextMembers(carolContext);

        assertEquals(aliceContext.profile.identity.address, aliceMembers[0]);
        assertEquals(bobContext.profile.identity.address, aliceMembers[1]);
        assertEquals(carolContext.profile.identity.address, aliceMembers[2]);

        assertEquals(3, aliceMembers.length);
        assertEquals(aliceMembers, bobMembers, deepEqual);
        assertEquals(aliceMembers, carolMembers, deepEqual);
    },

    testGroupChainedInvite: async () => {
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [ALICE, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, invite(CAROL)],
            [BOB, sync()],
            [CAROL, receivePrivateInvite(BOB)],
            [ALICE, sync()],
            [BOB, sync()],
            [CAROL, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const bobContext = outputState.contexts[BOB];
        const carolContext = outputState.contexts[CAROL];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        const aliceMembers = listGroupContextMembers(aliceContext);
        const bobMembers = listGroupContextMembers(bobContext);
        const carolMembers = listGroupContextMembers(carolContext);

        assertEquals(aliceContext.profile.identity.address, aliceMembers[0]);
        assertEquals(bobContext.profile.identity.address, aliceMembers[1]);
        assertEquals(carolContext.profile.identity.address, aliceMembers[2]);

        assertEquals(3, aliceMembers.length);
        assertEquals(aliceMembers, bobMembers, deepEqual);
        assertEquals(aliceMembers, carolMembers, deepEqual);
    },

    testGroupChainedInviteNonContact: async () => {
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(CAROL)],
            [ALICE, sync()],
            [CAROL, receivePrivateInvite(ALICE)],
            [ALICE, sync()],
            [CAROL, invite(DAVID)],
            [CAROL, sync()],
            [DAVID, receivePrivateInvite(CAROL)],
            [DAVID, sync()],
            [ALICE, sync()],
            [CAROL, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const carolContext = outputState.contexts[CAROL];
        const davidContext = outputState.contexts[DAVID];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        assertEquals(sharedSecret, davidContext.sharedSecret);
        assertEquals(topic, davidContext.topic);

        const aliceMembers = listGroupContextMembers(aliceContext);
        const carolMembers = listGroupContextMembers(carolContext);
        const davidMembers = listGroupContextMembers(davidContext);

        assertEquals(aliceContext.profile.identity.address, aliceMembers[0]);
        assertEquals(carolContext.profile.identity.address, aliceMembers[1]);
        assertEquals(davidContext.profile.identity.address, aliceMembers[2]);

        assertEquals(3, aliceMembers.length);
        assertEquals(aliceMembers, carolMembers, deepEqual);
        assertEquals(aliceMembers, davidMembers, deepEqual);
    },

    testGroupBasicPost: async () => {
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [BOB, receivePrivateInvite(ALICE)],
            [ALICE, sharePostText('hello', 1)],
            [ALICE, sync()],
            [BOB, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);

        assertEquals(1, alicePosts.length);
        assertEquals(1, bobPosts.length);
    },

    testGroupMultiplePosts: async () => {
        const aText = 'A';
        const bText = 'B';
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sharePostText(bText, 1)],
            [BOB, sync()],
            [ALICE, sharePostText(aText, 1)],
            [ALICE, sync()],
            [BOB, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(aText, alicePosts[0].text);
        assertEquals(bText, alicePosts[1].text);

        assertEquals(2, bobPosts.length);
        assertEquals(aText, bobPosts[0].text);
        assertEquals(bText, bobPosts[1].text);
    },

    testGroupMultiplePostsWithThreePeers: async () => {
        const aPost = makePost('A', 1);
        const bPost = makePost('B', 1);
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, sharePost(aPost)],
            [ALICE, invite(BOB)],
            [ALICE, invite(CAROL)],
            [ALICE, sync()],
            [CAROL, receivePrivateInvite(ALICE)],
            [CAROL, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sharePost(bPost)],
            [BOB, sync()],
            [ALICE, sync()],
            [CAROL, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);
        const carolPosts = listPosts(outputState.contexts[CAROL]);

        assertEquals(2, alicePosts.length);
        assertEquals(aPost.text, alicePosts[0].text);
        assertEquals(bPost.text, alicePosts[1].text);

        assertEquals(2, bobPosts.length);
        assertEquals(aPost.text, bobPosts[0].text);
        assertEquals(bPost.text, bobPosts[1].text);

        assertEquals(2, carolPosts.length);
        assertEquals(aPost.text, carolPosts[0].text);
        assertEquals(bPost.text, carolPosts[1].text);
    },

    testGroupRemoveOwnPost: async () => {
        const aPost = makePost('A', 1);
        const bPost = makePost('B', 1);
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [ALICE, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sharePost(bPost)],
            [BOB, sync()],
            [ALICE, sharePost(aPost)],
            [ALICE, removePost(aPost._id)],
            [ALICE, sync()],
            [BOB, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);

        assertEquals(1, alicePosts.length);
        assertEquals(bPost._id, alicePosts[0]._id);

        assertEquals(1, bobPosts.length);
        assertEquals(bPost._id, bobPosts[0]._id);
    },

    testGroupRemoveOwnPostWithExtraSync: async () => {
        const aPost = makePost('A', 1);
        const bPost = makePost('B', 1);
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [ALICE, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sharePost(bPost)],
            [BOB, sync()],
            [ALICE, sharePost(aPost)],
            [ALICE, sync()],
            [ALICE, removePost(aPost._id)],
            [ALICE, sync()],
            [BOB, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);

        assertEquals(1, alicePosts.length);
        assertEquals(bPost._id, alicePosts[0]._id);

        assertEquals(1, bobPosts.length);
        assertEquals(bPost._id, bobPosts[0]._id);
    },

    testGroupRemovePostPeerShouldNotRemoveOwn: async () => {
        const aPost = makePost('A', 1);
        const bPost = makePost('B', 1);
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, invite(BOB)],
            [ALICE, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sharePost(bPost)],
            [BOB, sync()],
            [ALICE, sharePost(aPost)],
            [ALICE, removePost(bPost._id)],
            [ALICE, sync()],
            [BOB, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(aPost.text, alicePosts[0].text);
        assertEquals(bPost.text, alicePosts[1].text);

        assertEquals(2, bobPosts.length);
        assertEquals(aPost.text, bobPosts[0].text);
        assertEquals(bPost.text, bobPosts[1].text);
    },

    testGroupRemovePostPeerShouldNotRemoveOtherPeer: async () => {
        const aPost = makePost('A', 1);
        const bPost = makePost('B', 1);
        const actions: GroupAction[] = [
            [ALICE, createGroup(topic, sharedSecret)],
            [ALICE, sharePost(aPost)],
            [ALICE, invite(BOB)],
            [ALICE, invite(CAROL)],
            [ALICE, sync()],
            [BOB, receivePrivateInvite(ALICE)],
            [BOB, sharePost(bPost)],
            [BOB, sync()],
            [ALICE, sync()],
            [CAROL, receivePrivateInvite(ALICE)],
            [CAROL, removePost(aPost._id)],
            [CAROL, sync()],
            [ALICE, sync()],
            [BOB, sync()],
        ];
        const outputState = await execute(actions, groupTestConfig);

        const alicePosts = listPosts(outputState.contexts[ALICE]);
        const bobPosts = listPosts(outputState.contexts[BOB]);
        const carolPosts = listPosts(outputState.contexts[CAROL]);

        assertEquals(2, alicePosts.length);
        assertEquals(aPost.text, alicePosts[0].text);
        assertEquals(bPost.text, alicePosts[1].text);

        assertEquals(2, bobPosts.length);
        assertEquals(aPost.text, bobPosts[0].text);
        assertEquals(bPost.text, bobPosts[1].text);

        assertEquals(2, carolPosts.length);
        assertEquals(aPost.text, carolPosts[0].text);
        assertEquals(bPost.text, carolPosts[1].text);
    },

    testGroupRemovePeer_BasicRemoval: async () => {
        const actions = aliceAndBobInviteWithSyncActions
            .concat([
                [ALICE, removePeer(BOB)],
            ])
        ;
        const outputState = await execute(actions, groupTestConfig);

        const aliceContext = outputState.contexts[ALICE];
        const bobContext = outputState.contexts[BOB];

        console.log({aliceContext, bobContext});

        assertEquals(0, aliceContext.peers.length);

        assertEquals('', bobContext.topic);
    },
};
