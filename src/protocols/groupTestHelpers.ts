import { Post, PostWithId } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { randomNumbers, makeStorage, makeCrypto } from '../cli/protocolTest/protocolTestHelpers';
import { byteArrayToHex } from '../helpers/conversion';
import * as SwarmHelpers from '../swarm/Swarm';
import { PrivateProfile, PublicProfile } from '../models/Profile';
import { PrivateIdentity } from '../models/Identity';
import { Debug } from '../Debug';
import { createDeterministicRandomGenerator } from '../helpers/unsecureRandom';
import { makePostId } from '../helpers/postHelpers';
import { ProtocolCrypto } from './ProtocolCrypto';
import { ProtocolStorage } from './ProtocolStorage';
import { postTimeCompare } from '../selectors/selectors';
import { groupAddMember, GroupPeer, groupPost, Group, OwnSyncData, groupSync, GroupSyncData, groupApplySyncUpdate, GroupCommandPost, GroupCommand, GroupSyncPeer, groupRemovePost } from './group';

export interface GroupContext extends GroupSyncData {
    profile: PublicProfile;
    crypto: ProtocolCrypto;
    storage: ProtocolStorage;
    posts: Post[];
    contacts: GroupSyncPeer[];
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
    profiles: [
        PrivateProfile,
        PrivateProfile,
        PrivateProfile,
        PrivateProfile,
        PrivateProfile,
        PrivateProfile,
    ];
}

export const makePost = (text: string, createdAt: number = Date.now()): PostWithId => {
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
    receivePrivateInvite: (from: GroupProfile) => GroupFunction;
    sharePostText: (text: string, createdAt: number) => GroupFunction;
    sharePost: (post: Post & { _id: HexString }) => GroupFunction;
    removePost: (id: HexString) => GroupFunction;
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

type GroupTestContactConfig = [GroupProfile, GroupProfile[]];

export type GroupTestConfig = [
    GroupTestContactConfig,
    GroupTestContactConfig,
    GroupTestContactConfig,
    GroupTestContactConfig,
    GroupTestContactConfig,
    GroupTestContactConfig,
];

export const makeGroupProtocolTester = async (groupTestConfig: GroupTestConfig, randomSeed: string = randomNumbers[0]): Promise<GroupProtocolTester> => {
    const generateDeterministicRandom = createDeterministicRandomGenerator(randomSeed);
    const generateAsyncDeterministicRandom = (length: number) => Promise.resolve(generateDeterministicRandom(length));
    const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateAsyncDeterministicRandom);
    const generateRandomHex = () => byteArrayToHex(generateDeterministicRandom(32), false);

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

    const executeCommand = (command: GroupCommand, context: GroupContext) => {
        switch (command.type) {
            case 'post': {
                const post = {
                    ...command.post,
                    _id: command.post._id || makePostId(command.post),
                };
                context.posts.push(post);
                return;
            }
            case 'remove-post': {
                context.posts = context.posts.filter(post => post._id == null || post._id !== command.id);
                return;
            }
        }
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
                return {
                    ...context,
                    topic,
                    sharedSecret,
                    peers: [],
                };
            };
        },
        invite: (groupProfile: GroupProfile) => {
            return async (context, state) => {
                const profile = state.profiles[groupProfile];
                const profileAddress = profile.identity.address;
                const index = context.contacts.findIndex(c => c.address === profileAddress);
                if (index === -1) {
                    return context;
                }
                const contact = context.contacts[index];
                const ownSyncData = groupAddMember(context.ownSyncData, contact);
                const members = [...context.peers, contact];
                return {
                    ...context,
                    ownSyncData,
                    peers: members,
                };
            };
        },
        receivePrivateInvite: (from: GroupProfile) => {
            return async (context, state) => {
                // TODO that's cheating, because we get the values from the state
                // instead of proper messaging between the two profiles, possibly
                // members can be in a different state already
                const fromContext = state.contexts[from];
                const members = fromContext.peers
                    .filter(member => member.address !== context.profile.identity.address)
                    .concat([{
                        ...fromContext.profile,
                        address: fromContext.profile.identity.address as HexString,
                        peerLastSeenChapterId: undefined,
                    }])
                ;
                return {
                    ...context,
                    sharedSecret: fromContext.sharedSecret,
                    topic: fromContext.topic,
                    peers: members,
                };
            };
        },
        sync: () => {
            return async (context) => {
                const update = await groupSync(
                    context,
                    context.storage,
                    context.crypto,
                    (image) => Promise.resolve(image)
                );
                const groupSyncData = groupApplySyncUpdate(
                    update,
                    command => executeCommand(command, context),
                    command => executeCommand(command, context),
                );
                const posts = context.posts;
                const retval = {
                    ...context,
                    ...groupSyncData,
                    posts,
                };
                return retval;
            };
        },
        sharePostText: (text: string, createdAt: number = Date.now()) => {
            return sharePost(makePost(text, createdAt));
        },
        sharePost: (post: PostWithId) => {
            return sharePost(post);
        },
        removePost: (id: HexString): GroupFunction => {
            return async (context) => {
                const ownSyncData = groupRemovePost(context.ownSyncData, id);
                return {
                    ...context,
                    ownSyncData,
                };
            };
        },
        listPosts,
        makePosts: async (): Promise<GroupAction[]> => {
            const actions: GroupAction[] = [];
            return actions;
        },
        execute: async (actions: GroupAction[]): Promise<GroupState> => {
            const storage = await makeStorage(generateIdentity);
            const profiles = await createProfiles(generateIdentity);

            const makeContextContact = (profile: PublicProfile): GroupSyncPeer => ({
                name: profile.name,
                image: profile.image,
                address: profile.identity.address as HexString,
                peerLastSeenChapterId: undefined,
            });

            const makeContextFromProfiles = async (
                profile: PrivateProfile,
                contactProfiles: PublicProfile[],
            ): Promise<GroupContext> => ({
                topic: '' as HexString,
                sharedSecret: '' as HexString,
                ownSyncData: {
                    ownAddress: profile.identity.address as HexString,
                    unsyncedCommands: [],
                    lastSyncedChapterId: undefined,
                },
                profile,
                storage,
                crypto: makeCrypto(profile.identity, generateAsyncDeterministicRandom),
                posts: [],
                peers: [],
                contacts: contactProfiles.map(contactProfile => makeContextContact(contactProfile)),
            });

            const makeContextFromTestConfig = async (
                testConfig: GroupTestContactConfig
            ): Promise<GroupContext> =>
                makeContextFromProfiles(
                    profiles[testConfig[0]],
                    testConfig[1].map(profile => profiles[profile])
                )
            ;

            const inputState: GroupState = {
                contexts: [
                    await makeContextFromTestConfig(groupTestConfig[GroupProfile.ALICE]),
                    await makeContextFromTestConfig(groupTestConfig[GroupProfile.BOB]),
                    await makeContextFromTestConfig(groupTestConfig[GroupProfile.CAROL]),
                    await makeContextFromTestConfig(groupTestConfig[GroupProfile.DAVID]),
                    await makeContextFromTestConfig(groupTestConfig[GroupProfile.EVE]),
                    await makeContextFromTestConfig(groupTestConfig[GroupProfile.MALLORY]),
                ],
                profiles: [
                    profiles[GroupProfile.ALICE],
                    profiles[GroupProfile.BOB],
                    profiles[GroupProfile.CAROL],
                    profiles[GroupProfile.DAVID],
                    profiles[GroupProfile.EVE],
                    profiles[GroupProfile.MALLORY],
                ],
            };

            const composeState = async (state: GroupState, groupActions: GroupAction[]): Promise<GroupState> => {
                for (const action of groupActions) {
                    const p = action[0];
                    const f = action[1];
                    const context = state.contexts[p];
                    state.contexts[p] = await f(context, state);
                }
                return state;
            };

            return composeState(inputState, actions);
        },
        generateRandomHex,
        debugState,
    };
};
