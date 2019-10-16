import { assertEquals } from '../helpers/assertEquals';
import deepEqual from 'deep-equal';
import {
    makeGroupProtocolTester,
    GroupAction,
} from './groupTestHelpers';
import { HexString } from '../helpers/opaqueTypes';

const sharedSecret = 'abc' as HexString;
const topic = 'def' as HexString;

export const groupProtocolTests = {
    testGroupCreate: async () => {
        const tester = await makeGroupProtocolTester();
        const actions: GroupAction[] = [
            [tester.ALICE, tester.createGroup(topic, sharedSecret)],
        ];
        const outputState = await tester.execute(actions);
        const aliceContext = outputState.contexts[tester.ALICE];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(1, aliceContext.members.length);
        assertEquals(aliceContext.profile.identity.address, aliceContext.members[0].address);
    },

    testGroupBasicInvite: async () => {
        const tester = await makeGroupProtocolTester();
        const actions: GroupAction[] = [
            [tester.ALICE, tester.createGroup(topic, sharedSecret)],
            [tester.ALICE, tester.invite(tester.BOB)],
            [tester.BOB, tester.receiveInvite(tester.ALICE)],
        ];
        const outputState = await tester.execute(actions);

        const aliceContext = outputState.contexts[tester.ALICE];
        const bobContext = outputState.contexts[tester.BOB];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(2, aliceContext.members.length);
        assertEquals(bobContext.members.length, aliceContext.members.length, deepEqual);
    },

    testGroupChainedInvite: async () => {
        const tester = await makeGroupProtocolTester();
        const actions: GroupAction[] = [
            [tester.ALICE, tester.createGroup(topic, sharedSecret)],
            [tester.ALICE, tester.invite(tester.BOB)],
            [tester.BOB, tester.receiveInvite(tester.ALICE)],
            [tester.BOB, tester.invite(tester.CAROL)],
            [tester.CAROL, tester.receiveInvite(tester.BOB)],
        ];
        const outputState = await tester.execute(actions);
        tester.debugState(outputState);

        const aliceContext = outputState.contexts[tester.ALICE];
        const bobContext = outputState.contexts[tester.BOB];
        const carolContext = outputState.contexts[tester.CAROL];

        assertEquals(sharedSecret, aliceContext.sharedSecret);
        assertEquals(topic, aliceContext.topic);

        assertEquals(sharedSecret, bobContext.sharedSecret);
        assertEquals(topic, bobContext.topic);

        assertEquals(sharedSecret, carolContext.sharedSecret);
        assertEquals(topic, carolContext.topic);

        assertEquals(3, aliceContext.members.length);
        assertEquals(bobContext.members.length, aliceContext.members.length, deepEqual);
        assertEquals(carolContext.members.length, aliceContext.members.length, deepEqual);
    },
};
