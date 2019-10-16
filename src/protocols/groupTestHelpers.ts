import { Post, PostWithId } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { randomNumbers, makeStorage, makeCrypto } from '../cli/protocolTest/protocolTestHelpers';
import { byteArrayToHex } from '../helpers/conversion';
import * as SwarmHelpers from '../swarm/Swarm';
import { PrivateProfile, PublicProfile } from '../models/Profile';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import { deriveSharedKey } from '../helpers/contactHelpers';
import { Debug } from '../Debug';
import { createDeterministicRandomGenerator } from '../helpers/unsecureRandom';
import { makePostId } from '../helpers/postHelpers';
import { ProtocolCrypto } from './ProtocolCrypto';
import { ProtocolStorage } from './ProtocolStorage';
import { postTimeCompare } from '../selectors/selectors';
import { GroupSyncData, groupAddMember, GroupMember, groupPost, Group } from './group';

interface GroupContextContact {
    identity: PublicIdentity;
    sharedSecret: HexString;
}

export interface GroupContext extends GroupSyncData {
    profile: PublicProfile;
    contacts: GroupContextContact[];
    crypto: ProtocolCrypto;
    storage: ProtocolStorage;
    posts: Post[];
}

// For reference see https://en.wikipedia.org/wiki/Alice_and_Bob
export enum GroupProfile {
    ALICE,
    BOB,
    CAROL,
    DAVID,
    EVE, // eavesdropper
    MALLORY, // malicious attacker
}

export type GroupFunction = (context: GroupContext, state: GroupState) => Promise<GroupContext>;
export type GroupAction = [GroupProfile, GroupFunction];

export interface GroupState {
    contexts: [
        GroupContext,
        GroupContext,
        GroupContext,
        GroupContext,
        GroupContext,
        GroupContext,
    ];
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

export interface GroupProtocolTester {
    ALICE: GroupProfile.ALICE;
    BOB: GroupProfile.BOB;
    CAROL: GroupProfile.CAROL;
    DAVID: GroupProfile.DAVID;
    EVE: GroupProfile.EVE;
    MALLORY: GroupProfile.MALLORY;
    createGroup: (topic: HexString, sharedSecret: HexString) => GroupFunction;
    invite: (profile: GroupProfile) => GroupFunction;
    receiveInvite: (from: GroupProfile) => GroupFunction;
    sharePostText: (text: string, createdAt: number) => GroupFunction;
    sharePost: (post: Post & { _id: HexString }) => GroupFunction;
    deletePost: (id: HexString) => GroupFunction;
    sync: () => GroupFunction;
    listPosts: (context: GroupContext) => Post[];
    makePosts: (profile: GroupProfile, numPosts: number) => Promise<GroupAction[]>;
    execute: (actions: GroupAction[]) => Promise<GroupState>;
    generateRandomHex: () => HexString;
    debugState: (state: GroupState) => void;
}

const createProfiles = async (generateIdentity: () => Promise<PrivateIdentity>): Promise<PrivateProfile[]> => {
    const profiles: PrivateProfile[] = [];
    for (const profileName of Object.values(GroupProfile)) {
        if (typeof profileName === 'string') {
            const profile: PrivateProfile = {
                name: profileName,
                image: {},
                identity: await generateIdentity(),
            };
            profiles.push(profile);
        }
    }
    return profiles;
};

export const makeGroupProtocolTester = async (randomSeed: string = randomNumbers[0]): Promise<GroupProtocolTester> => {
    const generateDeterministicRandom = createDeterministicRandomGenerator(randomSeed);
    const generateAsyncDeterministicRandom = (length: number) => Promise.resolve(generateDeterministicRandom(length));
    const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateAsyncDeterministicRandom);
    const generateRandomHex = () => byteArrayToHex(generateDeterministicRandom(32), false);

    const profiles = await createProfiles(generateIdentity);

    const storage = await makeStorage(generateIdentity);

    const makeContextContact = (profileIdentity: PrivateIdentity, identity: PublicIdentity): GroupContextContact => ({
        identity,
        sharedSecret: deriveSharedKey(profileIdentity, identity),
    });

    const makeContextFromProfiles = async (
        profile: PrivateProfile,
        contactProfiles: PublicProfile[],
    ): Promise<GroupContext> => ({
        profile,
        storage,
        sharedSecret: '' as HexString,
        topic: '' as HexString,
        ownSyncData: {
            unsyncedCommands: [],
            lastSyncedChapterId: undefined,
        },
        peers: [],
        members: [],
        crypto: makeCrypto(profile.identity, generateAsyncDeterministicRandom),
        posts: [],
        contacts: contactProfiles.map(contactProfile => makeContextContact(profile.identity, contactProfile.identity)),
    });

    const composeState = async (state: GroupState, actions: GroupAction[]): Promise<GroupState> => {
        for (const action of actions) {
            const p = action[0];
            const f = action[1];
            const context = state.contexts[p];
            state.contexts[p] = await f(context, state);
        }
        return state;
    };

    const debugState = (state: GroupState) => {
        for (const context of state.contexts) {
            const posts = listPosts(context);
            Debug.log({
                name: context.profile.name,
                posts,
            });
            Debug.log(context);
        }
        return state;
    };

    const inputState: GroupState = {
        contexts: [
            await makeContextFromProfiles(
                profiles[GroupProfile.ALICE],
                [
                    profiles[GroupProfile.BOB],
                    profiles[GroupProfile.CAROL],
                ]
            ),
            await makeContextFromProfiles(
                profiles[GroupProfile.BOB],
                [
                    profiles[GroupProfile.ALICE],
                    profiles[GroupProfile.CAROL],
                ]
            ),
            await makeContextFromProfiles(
                profiles[GroupProfile.CAROL],
                [
                    profiles[GroupProfile.ALICE],
                    profiles[GroupProfile.BOB],
                ]
            ),
            await makeContextFromProfiles(
                profiles[GroupProfile.DAVID],
                []
            ),
            await makeContextFromProfiles(
                profiles[GroupProfile.EVE],
                []
            ),
            await makeContextFromProfiles(
                profiles[GroupProfile.MALLORY],
                []
            ),
        ],
    };

    const listPosts = (context: GroupContext): Post[] => {
        const postId = (p: Post) => typeof p._id === 'string' ? p._id : '' + (p._id || '');
        const idCompare = (a: Post, b: Post) => postId(a).localeCompare(postId(b));
        return context.posts.sort((a, b) => postTimeCompare(a, b) || idCompare(a, b));
    };

    const sharePost = (post: PostWithId) => {
        return async (context: GroupContext): Promise<GroupContext> => {
            const ownSyncData = groupPost(context.ownSyncData, post);
            return {
                ...context,
                ownSyncData,
            };
        };
    };

    return {
        ALICE: GroupProfile.ALICE,
        BOB: GroupProfile.BOB,
        CAROL: GroupProfile.CAROL,
        DAVID: GroupProfile.DAVID,
        EVE: GroupProfile.EVE,
        MALLORY: GroupProfile.MALLORY,
        createGroup: (topic: HexString, sharedSecret: HexString): GroupFunction => {
            return async (context) => {
                const selfMember: GroupMember = {
                    address: context.profile.identity.address as HexString,
                    name: context.profile.name,
                    image: context.profile.image,
                };
                return {
                    ...context,
                    topic,
                    sharedSecret,
                    members: [selfMember, ...context.members],
                };
            };
        },
        invite: (groupProfile: GroupProfile) => {
            return async (context) => {
                const profile = profiles[groupProfile];
                const profilePublicKey = profile.identity.publicKey;
                const index = context.contacts.findIndex(c => c.identity.publicKey === profilePublicKey);
                if (index === -1) {
                    return context;
                }
                const contact = context.contacts[index];
                const member: GroupMember = {
                    address: contact.identity.address as HexString,
                    name: profile.name,
                    image: profile.image,
                };
                const ownSyncData = groupAddMember(context.ownSyncData, member);
                const members = [member, ...context.members];
                return {
                    ...context,
                    ownSyncData,
                    members,
                };
            };
        },
        receiveInvite: (from: GroupProfile) => {
            return async (context, state) => {
                // TODO that's cheating, because we get the values from the state
                // instead of proper messaging between the two profiles, possibly
                // members can be in a different state already
                const fromProfile = state.contexts[from];
                return {
                    ...context,
                    sharedSecret: fromProfile.sharedSecret,
                    topic: fromProfile.topic,
                    members: fromProfile.members,
                };
            };
        },
        sync: () => {
            return async (context) => {
                return context;
            };
        },
        sharePostText: (text: string, createdAt: number = Date.now()) => {
            return sharePost(makePost(text, createdAt));
        },
        sharePost: (post: PostWithId) => {
            return sharePost(post);
        },
        deletePost: (): GroupFunction => {
            return async (context) => context;
        },
        listPosts,
        makePosts: async (): Promise<GroupAction[]> => {
            const actions: GroupAction[] = [];
            return actions;
        },
        execute: async (actions: GroupAction[]): Promise<GroupState> => {
            return composeState(inputState, actions);
        },
        generateRandomHex,
        debugState,
    };
};
