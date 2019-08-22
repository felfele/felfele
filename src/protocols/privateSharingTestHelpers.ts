import { PrivateSharingContext, privateSharePost, privateDeletePost, privateSync, listTimelinePosts } from '../protocols/privateSharing';
import { Post } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { createDeterministicRandomGenerator, randomNumbers, makeNaclEncryption, makeStorage, Crypto } from '../cli/protocolTest/protocolTestHelpers';
import { hexToByteArray, byteArrayToHex } from '../helpers/conversion';
import * as SwarmHelpers from '../swarm/Swarm';
import { PrivateProfile } from '../models/Profile';
import { PrivateIdentity, PublicIdentity } from '../models/Identity';
import { deriveSharedKey } from '../helpers/contactHelpers';
import { Debug } from '../Debug';

export enum PrivateSharingProfile {
    ALICE = 0,
    BOB = 1,
}

export type PrivateSharingFunction = (context: PrivateSharingContext) => Promise<PrivateSharingContext>;
export type PrivateSharingAction = [PrivateSharingProfile, PrivateSharingFunction];

export interface PrivateSharingState {
    contexts: [PrivateSharingContext, PrivateSharingContext];
}

export const makePost = (text: string): Post => ({
    text,
    images: [],
    createdAt: Date.now(),
});

export interface PrivateSharingProtocolTester {
    ALICE: PrivateSharingProfile.ALICE;
    BOB: PrivateSharingProfile.BOB;
    sharePost: (text: string, id?: HexString | undefined) => PrivateSharingFunction;
    deletePost: (id: HexString) => PrivateSharingFunction;
    sync: () => PrivateSharingFunction;
    listPosts: (context: PrivateSharingContext) => Post[];
    makePosts: (profile: PrivateSharingProfile, numPosts: number) => Promise<PrivateSharingAction[]>;
    execute: (actions: PrivateSharingAction[]) => Promise<PrivateSharingState>;
    generateRandomHex: () => Promise<HexString>;
    debugState: (state: PrivateSharingState) => void;
}

export const makePrivateSharingProtocolTester = async (randomSeed: string = randomNumbers[0]): Promise<PrivateSharingProtocolTester> => {
    const nextRandom = createDeterministicRandomGenerator(randomSeed);
    const generateDeterministicRandom = async (length: number) => {
        const randomString = nextRandom();
        const randomBytes = new Uint8Array(hexToByteArray(randomString)).slice(0, length);
        return randomBytes;
    };
    const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateDeterministicRandom);
    const generateRandomHex = async () => byteArrayToHex(await generateDeterministicRandom(32), false);

    const aliceProfile: PrivateProfile = {
        name: 'Alice',
        image: {},
        identity: await generateIdentity(),
    };
    const bobProfile: PrivateProfile = {
        name: 'Bob',
        image: {},
        identity: await generateIdentity(),
    };

    const makeCrypto = (identity: PrivateIdentity): Crypto => ({
        ...makeNaclEncryption(),
        signDigest: (digest: number[]) => SwarmHelpers.signDigest(digest, identity),
        deriveSharedKey: (publicKey: HexString) => deriveSharedKey(identity, {publicKey, address: ''}),
        random: (length: number) => generateDeterministicRandom(length),
    });

    const storage = await makeStorage(generateIdentity);
    const makeContextFromProfiles = async (
        profile: PrivateProfile,
        contactIdentity: PublicIdentity,
    ): Promise<PrivateSharingContext> => ({
        profile,
        contactIdentity,
        localTimeline: [],
        remoteTimeline: [],
        sharedSecret: deriveSharedKey(profile.identity, contactIdentity),
        storage,
        crypto: makeCrypto(profile.identity),
    });

    const composeState = async (state: PrivateSharingState, actions: PrivateSharingAction[]): Promise<PrivateSharingState> => {
        for (const action of actions) {
            const p = action[0];
            const f = action[1];
            const context = state.contexts[p];
            state.contexts[p] = await f(context);
        }
        return state;
    };

    const debugState = (state: PrivateSharingState) => {
        const posts0 = listPosts(state.contexts[0]);
        Debug.log({
            localTimeline: state.contexts[0].localTimeline,
            remoteTimeline: state.contexts[0].remoteTimeline,
            posts: posts0,
        });
        const posts1 = listPosts(state.contexts[1]);
        Debug.log({
            localTimeline: state.contexts[1].localTimeline,
            remoteTimeline: state.contexts[1].remoteTimeline,
            posts: posts1,
        });
        return state;
    };

    const inputState: PrivateSharingState = {
        contexts: [
            await makeContextFromProfiles(aliceProfile, bobProfile.identity),
            await makeContextFromProfiles(bobProfile, aliceProfile.identity),
        ],
    };

    const sharePost = (post: Post, id: HexString | undefined): PrivateSharingFunction => {
        return async (context) => {
            id = id || await generateRandomHex();
            return privateSharePost(context, post, id);
        };
    };

    const listPosts = (context: PrivateSharingContext): Post[] => {
        return listTimelinePosts(context.localTimeline.concat(context.remoteTimeline));
    };

    return {
        ALICE: PrivateSharingProfile.ALICE,
        BOB: PrivateSharingProfile.BOB,
        sharePost: (text: string, id: HexString | undefined) => {
            return sharePost(makePost(text), id);
        },
        deletePost: (id: HexString): PrivateSharingFunction => {
            return async (context) => {
                return privateDeletePost(context, id);
            };
        },
        sync: (): PrivateSharingFunction => {
            return async (context) => {
                return privateSync(context);
            };
        },
        listPosts,
        makePosts: async (profile: PrivateSharingProfile, numPosts: number): Promise<PrivateSharingAction[]> => {
            const actions: PrivateSharingAction[] = [];
            for (let i = 0; i < numPosts; i++) {
                const id = await generateRandomHex();
                const action: PrivateSharingAction = [profile, sharePost(makePost(`hello ${i}`), id)];
                actions.push(action);
            }
            return actions;
        },
        execute: async (actions: PrivateSharingAction[]): Promise<PrivateSharingState> => {
            return composeState(inputState, actions);
        },
        generateRandomHex,
        debugState,
    };
};
