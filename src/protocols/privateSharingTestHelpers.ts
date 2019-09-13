import { PrivateSharingContext, privateSharePost, privateDeletePost, privateSync, listTimelinePosts, calculatePrivateTopic } from '../protocols/privateSharing';
import { Post, PublicPost } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { randomNumbers, makeNaclEncryption, makeStorage, Crypto, makeCrypto } from '../cli/protocolTest/protocolTestHelpers';
import { hexToByteArray, byteArrayToHex } from '../helpers/conversion';
import * as SwarmHelpers from '../swarm/Swarm';
import { PrivateProfile } from '../models/Profile';
import { PrivateIdentity, PublicIdentity } from '../models/Identity';
import { deriveSharedKey } from '../helpers/contactHelpers';
import { Debug } from '../Debug';
import { createDeterministicRandomGenerator } from '../helpers/unsecureRandom';
import { cryptoHash } from '../helpers/crypto';
import { serialize } from '../social/serialization';
import { makePostId } from '../helpers/postHelpers';

export enum PrivateSharingProfile {
    ALICE = 0,
    BOB = 1,
}

export type PrivateSharingFunction = (context: PrivateSharingContext) => Promise<PrivateSharingContext>;
export type PrivateSharingAction = [PrivateSharingProfile, PrivateSharingFunction];

export interface PrivateSharingState {
    contexts: [PrivateSharingContext, PrivateSharingContext];
}

export const makePost = (text: string, createdAt: number = Date.now()): Post & { _id: HexString } => {
    const post = {
        text,
        images: [],
        createdAt,
    };
    const id = makePostId(post);
    return {
        ...post,
        _id: id,
    };
};

export interface PrivateSharingProtocolTester {
    ALICE: PrivateSharingProfile.ALICE;
    BOB: PrivateSharingProfile.BOB;
    sharePostText: (text: string) => PrivateSharingFunction;
    sharePost: (post: Post & { _id: HexString }) => PrivateSharingFunction;
    deletePost: (id: HexString) => PrivateSharingFunction;
    sync: () => PrivateSharingFunction;
    listPosts: (context: PrivateSharingContext) => Post[];
    makePosts: (profile: PrivateSharingProfile, numPosts: number) => Promise<PrivateSharingAction[]>;
    execute: (actions: PrivateSharingAction[]) => Promise<PrivateSharingState>;
    generateRandomHex: () => HexString;
    debugState: (state: PrivateSharingState) => void;
}

export const makePrivateSharingProtocolTester = async (randomSeed: string = randomNumbers[0]): Promise<PrivateSharingProtocolTester> => {
    const generateDeterministicRandom = createDeterministicRandomGenerator(randomSeed);
    const generateAsyncDeterministicRandom = (length: number) => Promise.resolve(generateDeterministicRandom(length));
    const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateAsyncDeterministicRandom);
    const generateRandomHex = () => byteArrayToHex(generateDeterministicRandom(32), false);

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
        crypto: makeCrypto(profile.identity, generateAsyncDeterministicRandom),
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

    const sharePost = (post: Post & { _id: HexString }): PrivateSharingFunction => {
        return async (context) => {
            const topic = calculatePrivateTopic(context.sharedSecret);
            const author = {
                name: context.profile.name,
                uri: '',
                image: context.profile.image,
            };
            return privateSharePost(context, {
                ...post,
                topic,
                author,
            });
        };
    };

    const listPosts = (context: PrivateSharingContext): Post[] => {
        return listTimelinePosts(context.localTimeline.concat(context.remoteTimeline));
    };

    return {
        ALICE: PrivateSharingProfile.ALICE,
        BOB: PrivateSharingProfile.BOB,
        sharePostText: (text: string) => {
            return sharePost(makePost(text));
        },
        sharePost: (post: Post & { _id: HexString }) => {
            return sharePost(post);
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
                const action: PrivateSharingAction = [profile, sharePost(makePost(`hello ${i}`))];
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
