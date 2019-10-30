import { assertEquals } from '../helpers/assertEquals';
import {
    makeGroupProtocolTester,
    GroupAction,
    GroupTestConfig,
    GroupProfile,
} from './groupTestHelpers';
import { HexString } from '../helpers/opaqueTypes';

const sharedSecret = 'abc' as HexString;
const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString;

const groupTestConfig: GroupTestConfig = [
    [
        GroupProfile.ALICE, [
            GroupProfile.BOB,
            GroupProfile.CAROL,
        ],
    ],
    [
        GroupProfile.BOB, [
            GroupProfile.ALICE,
            GroupProfile.CAROL,
        ],
    ],
    [
        GroupProfile.CAROL, [
            GroupProfile.ALICE,
            GroupProfile.BOB,
            GroupProfile.DAVID,
        ],
    ],
    [
        GroupProfile.DAVID, [
            GroupProfile.CAROL,
        ],
    ],
    [
        GroupProfile.EVE, [],
    ],
    [
        GroupProfile.MALLORY, [],
    ],
];

export const groupProtocolTests = {
    testGroupCreate: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
        ];
        const outputState = await t.execute(actions);
        const aliceContext = outputState.contexts[t.ALICE];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(0, aliceContext.peers.length);
    },

    testGroupBasicInvite: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.BOB)],
            [t.BOB, t.receivePrivateInvite(t.ALICE)],
        ];
        const outputState = await t.execute(actions);

        const aliceContext = outputState.contexts[t.ALICE];
        const bobContext = outputState.contexts[t.BOB];

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
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.BOB)],
            [t.BOB, t.receivePrivateInvite(t.ALICE)],
            [t.ALICE, t.sync()],
            [t.BOB, t.sync()],
        ];
        const outputState = await t.execute(actions);

        const aliceContext = outputState.contexts[t.ALICE];
        const bobContext = outputState.contexts[t.BOB];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(1, aliceContext.peers.length);
        assertEquals(aliceContext.peers[0].address, bobContext.profile.identity.address);

        assertEquals(1, bobContext.peers.length);
        assertEquals(bobContext.peers[0].address, aliceContext.profile.identity.address);
    },

    testGroupInviteTwo: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.BOB)],
            [t.ALICE, t.sync()],
            [t.BOB, t.receivePrivateInvite(t.ALICE)],
            [t.BOB, t.sync()],
            [t.ALICE, t.invite(t.CAROL)],
            [t.CAROL, t.receivePrivateInvite(t.ALICE)],
            [t.ALICE, t.sync()],
            [t.BOB, t.sync()],
            [t.CAROL, t.sync()],
        ];
        const outputState = await t.execute(actions);
        t.debugState(outputState);

        const aliceContext = outputState.contexts[t.ALICE];
        const bobContext = outputState.contexts[t.BOB];
        const carolContext = outputState.contexts[t.CAROL];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        assertEquals(2, aliceContext.peers.length);
        assertEquals(aliceContext.peers[0].address, bobContext.profile.identity.address);
        assertEquals(aliceContext.peers[1].address, carolContext.profile.identity.address);

        assertEquals(2, bobContext.peers.length);
        assertEquals(bobContext.peers[0].address, aliceContext.profile.identity.address);
        assertEquals(bobContext.peers[1].address, carolContext.profile.identity.address);

        assertEquals(2, carolContext.peers.length);
        assertEquals(carolContext.peers[0].address, bobContext.profile.identity.address);
        assertEquals(carolContext.peers[1].address, aliceContext.profile.identity.address);
    },

    testGroupChainedInvite: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.BOB)],
            [t.ALICE, t.sync()],
            [t.BOB, t.receivePrivateInvite(t.ALICE)],
            [t.BOB, t.invite(t.CAROL)],
            [t.BOB, t.sync()],
            [t.CAROL, t.receivePrivateInvite(t.BOB)],
            [t.ALICE, t.sync()],
            [t.BOB, t.sync()],
            [t.CAROL, t.sync()],
        ];
        const outputState = await t.execute(actions);
        t.debugState(outputState);

        const aliceContext = outputState.contexts[t.ALICE];
        const bobContext = outputState.contexts[t.BOB];
        const carolContext = outputState.contexts[t.CAROL];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        assertEquals(2, aliceContext.peers.length);
        assertEquals(aliceContext.peers[0].address, bobContext.profile.identity.address);
        assertEquals(aliceContext.peers[1].address, carolContext.profile.identity.address);

        assertEquals(2, bobContext.peers.length);
        assertEquals(bobContext.peers[0].address, aliceContext.profile.identity.address);
        assertEquals(bobContext.peers[1].address, carolContext.profile.identity.address);

        assertEquals(2, carolContext.peers.length);
        assertEquals(carolContext.peers[0].address, aliceContext.profile.identity.address);
        assertEquals(carolContext.peers[1].address, bobContext.profile.identity.address);
    },

    testGroupChainedInviteNonContact: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.CAROL)],
            [t.ALICE, t.sync()],
            [t.CAROL, t.receivePrivateInvite(t.ALICE)],
            [t.ALICE, t.sync()],
            [t.CAROL, t.invite(t.DAVID)],
            [t.CAROL, t.sync()],
            [t.DAVID, t.receivePrivateInvite(t.CAROL)],
            [t.DAVID, t.sync()],
            [t.ALICE, t.sync()],
            [t.CAROL, t.sync()],
        ];
        const outputState = await t.execute(actions);
        t.debugState(outputState);

        const aliceContext = outputState.contexts[t.ALICE];
        const carolContext = outputState.contexts[t.CAROL];
        const davidContext = outputState.contexts[t.DAVID];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        assertEquals(sharedSecret, davidContext.sharedSecret);
        assertEquals(topic, davidContext.topic);

        assertEquals(2, aliceContext.peers.length);
        assertEquals(aliceContext.peers[0].address, carolContext.profile.identity.address);
        assertEquals(aliceContext.peers[1].address, davidContext.profile.identity.address);

        assertEquals(2, carolContext.peers.length);
        assertEquals(carolContext.peers[0].address, aliceContext.profile.identity.address);
        assertEquals(carolContext.peers[1].address, davidContext.profile.identity.address);

        assertEquals(2, davidContext.peers.length);
        assertEquals(davidContext.peers[0].address, aliceContext.profile.identity.address);
        assertEquals(davidContext.peers[1].address, carolContext.profile.identity.address);
    },

    testGroupBasicPost: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.BOB)],
            [t.BOB, t.receivePrivateInvite(t.ALICE)],
            [t.ALICE, t.sharePostText('hello', 1)],
            [t.ALICE, t.sync()],
            [t.BOB, t.sync()],
        ];
        const outputState = await t.execute(actions);

        const aliceContext = outputState.contexts[t.ALICE];
        const bobContext = outputState.contexts[t.BOB];

        assertEquals(1, aliceContext.posts.length);
        assertEquals(1, bobContext.posts.length);
    },

    testGroupMultiplePosts: async () => {
        const t = await makeGroupProtocolTester(groupTestConfig);
        const bText = 'B';
        const aText = 'A';
        const actions: GroupAction[] = [
            [t.ALICE, t.createGroup(topic, sharedSecret)],
            [t.ALICE, t.invite(t.BOB)],
            [t.BOB, t.receivePrivateInvite(t.ALICE)],
            [t.BOB, t.sharePostText(bText, 1)],
            [t.BOB, t.sync()],
            [t.ALICE, t.sharePostText(aText, 1)],
            [t.ALICE, t.sync()],
            [t.BOB, t.sync()],
        ];
        const outputState = await t.execute(actions);

        const alicePosts = t.listPosts(outputState.contexts[t.ALICE]);
        const bobPosts = t.listPosts(outputState.contexts[t.BOB]);

        assertEquals(2, alicePosts.length);
        assertEquals(aText, alicePosts[0].text);
        assertEquals(bText, alicePosts[1].text);

        assertEquals(2, bobPosts.length);
        assertEquals(aText, bobPosts[0].text);
        assertEquals(bText, bobPosts[1].text);
    },

};
