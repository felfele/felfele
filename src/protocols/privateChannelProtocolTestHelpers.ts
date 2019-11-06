import { Post } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { randomNumbers, makeStorage, makeCrypto } from '../cli/protocolTest/protocolTestHelpers';
import { byteArrayToHex } from '../helpers/conversion';
import * as SwarmHelpers from '../swarm/Swarm';
import { PrivateProfile, PublicProfile } from '../models/Profile';
import { PublicIdentity } from '../models/Identity';
import { deriveSharedKey } from '../helpers/contactHelpers';
import { Debug } from '../Debug';
import { createDeterministicRandomGenerator } from '../helpers/unsecureRandom';
import { makePostId } from '../helpers/postHelpers';
import { makeEmptyPrivateChannel, privateChannelAddPost, privateChannelRemovePost, syncPrivateChannelWithContact, applyPrivateChannelUpdate, PrivateChannelSyncData, PrivateChannelCommand, PrivateChannelCommandPost, privateChannelInviteToGroup } from './privateChannel';
import { MutualContact } from '../models/Contact';
import { ProtocolCrypto } from './ProtocolCrypto';
import { ProtocolStorage } from './ProtocolStorage';
import { Timeline, PartialChapter } from './timeline';
import { postTimeCompare } from '../selectors/selectors';
import { Group } from './group';

export interface PrivateChannelContext {
    profile: PublicProfile;
    contactIdentity: PublicIdentity;
    syncData: PrivateChannelSyncData;
    sharedSecret: HexString;
    crypto: ProtocolCrypto;
    storage: ProtocolStorage;
    posts: Post[];
}

export enum PrivateChannelProfile {
    ALICE = 0,
    BOB = 1,
}

export type PrivateChannelFunction = (context: PrivateChannelContext) => Promise<PrivateChannelContext>;
export type PrivateChannelAction = [PrivateChannelProfile, PrivateChannelFunction];

export interface PrivateChannelState {
    contexts: [PrivateChannelContext, PrivateChannelContext];
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

export const listTimelinePosts = (timeline: Timeline<PrivateChannelCommand>): Post[] => {
    const timestampCompare = <T>(a: PartialChapter<T>, b: PartialChapter<T>) => a.timestamp - b.timestamp;
    const authorCompare = <T>(a: PartialChapter<T>, b: PartialChapter<T>) => a.author.localeCompare(b.author);
    const isPrivatePost = (command: PrivateChannelCommand): command is PrivateChannelCommandPost => command.type === 'post';
    const skipSet = new Set<string>();
    const posts = timeline
        .sort((a, b) => timestampCompare(b, a) || authorCompare(b, a))
        .filter(chapter => {
            if (chapter.content.type === 'remove') {
                skipSet.add(chapter.content.id);
                return false;
            }
            if (chapter.content.type === 'post') {
                const id = makePostId(chapter.content.post);
                if (skipSet.has(id)) {
                    return false;
                }
                skipSet.add(id);
            }
            return true;
        })
        .map(chapter => chapter.content)
        .filter(isPrivatePost)
        .map(command => ({
            ...command.post,
            _id: command.post._id || makePostId(command.post),
        }))
    ;
    return posts;
};

export interface PrivateChannelProtocolTester {
    ALICE: PrivateChannelProfile.ALICE;
    BOB: PrivateChannelProfile.BOB;
    sharePostText: (text: string, createdAt: number) => PrivateChannelFunction;
    sharePost: (post: Post & { _id: HexString }) => PrivateChannelFunction;
    deletePost: (id: HexString) => PrivateChannelFunction;
    invite: (group: Group, logicalTime: number) => PrivateChannelFunction;
    sync: () => PrivateChannelFunction;
    listPosts: (context: PrivateChannelContext) => Post[];
    makePosts: (profile: PrivateChannelProfile, numPosts: number) => Promise<PrivateChannelAction[]>;
    execute: (actions: PrivateChannelAction[]) => Promise<PrivateChannelState>;
    generateRandomHex: () => HexString;
    debugState: (state: PrivateChannelState) => void;
}

export const makePrivateChannelProtocolTester = async (randomSeed: string = randomNumbers[0]): Promise<PrivateChannelProtocolTester> => {
    const generateDeterministicRandom = createDeterministicRandomGenerator(randomSeed);
    const generateAsyncDeterministicRandom = (length: number) => Promise.resolve(generateDeterministicRandom(length));
    const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateAsyncDeterministicRandom);
    const generateRandomHex = () => byteArrayToHex(generateDeterministicRandom(32), false);
    let dateNow = 0;

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
    ): Promise<PrivateChannelContext> => ({
        profile,
        contactIdentity,
        syncData: makeEmptyPrivateChannel(),
        sharedSecret: deriveSharedKey(profile.identity, contactIdentity),
        storage,
        crypto: makeCrypto(profile.identity, generateAsyncDeterministicRandom),
        posts: [],
    });

    const composeState = async (state: PrivateChannelState, actions: PrivateChannelAction[]): Promise<PrivateChannelState> => {
        for (const action of actions) {
            const p = action[0];
            const f = action[1];
            const context = state.contexts[p];
            state.contexts[p] = await f(context);
        }
        return state;
    };

    const debugState = (state: PrivateChannelState) => {
        const ALICE = PrivateChannelProfile.ALICE;
        const postsAlice = listPosts(state.contexts[ALICE]);
        Debug.log({
            syncData: state.contexts[ALICE].syncData,
            postsAlice,
        });
        const BOB = PrivateChannelProfile.BOB;
        const postsBob = listPosts(state.contexts[BOB]);
        Debug.log({
            syncData: state.contexts[BOB].syncData,
            postsBob,
        });
        return state;
    };

    const inputState: PrivateChannelState = {
        contexts: [
            await makeContextFromProfiles(aliceProfile, bobProfile.identity),
            await makeContextFromProfiles(bobProfile, aliceProfile.identity),
        ],
    };

    const now = () => {
        dateNow += 1;
        return dateNow;
    };

    const sharePost = (post: Post & { _id: HexString }): PrivateChannelFunction => {
        return async (context) => {
            const syncData = privateChannelAddPost(context.syncData, post);
            return {
                ...context,
                syncData,
            };
        };
    };

    const listPosts = (context: PrivateChannelContext): Post[] => {
        const postId = (p: Post) => typeof p._id === 'string' ? p._id : '' + (p._id || '');
        const idCompare = (a: Post, b: Post) => postId(a).localeCompare(postId(b));
        return context.posts.sort((a, b) => postTimeCompare(a, b) || idCompare(a, b));
    };

    const executeCommand = (command: PrivateChannelCommand, posts: Post[]) => {
        switch (command.type) {
            case 'post': {
                const post = {
                    ...command.post,
                    _id: command.post._id || makePostId(command.post),
                };
                posts.push(post);
                return;
            }
            case 'remove': {
                const id = command.id;
                const index = posts.findIndex(post => post._id === id);
                if (index !== -1) {
                    posts.splice(index, 1);
                }
                return;
            }
        }
    };

    return {
        ALICE: PrivateChannelProfile.ALICE,
        BOB: PrivateChannelProfile.BOB,
        sharePostText: (text: string, createdAt: number = Date.now()) => {
            return sharePost(makePost(text, createdAt));
        },
        sharePost: (post: Post & { _id: HexString }) => {
            return sharePost(post);
        },
        deletePost: (id: HexString): PrivateChannelFunction => {
            return async (context) => {
                const syncData = privateChannelRemovePost(context.syncData, id);
                return {
                    ...context,
                    syncData,
                };
            };
        },
        invite: (group: Group, logicalTime: number): PrivateChannelFunction => {
            return async (context) => {
                const syncData = privateChannelInviteToGroup(context.syncData, group, logicalTime);
                return {
                    ...context,
                    syncData,
                };
            };
        },
        sync: (): PrivateChannelFunction => {
            return async (context) => {
                const contact: MutualContact = {
                    type: 'mutual-contact',
                    privateChannel: context.syncData,
                    name: '',
                    image: {},
                    identity: context.contactIdentity,
                };
                const update = await syncPrivateChannelWithContact(
                    contact,
                    context.profile.identity.address as HexString,
                    context.storage,
                    context.crypto,
                    (image) => Promise.resolve(image),
                );
                const posts = [...context.posts];

                const syncData = applyPrivateChannelUpdate(
                    update,
                    command => executeCommand(command, posts),
                    command => executeCommand(command, posts),
                );
                return {
                    ...context,
                    syncData,
                    posts,
                };
            };
        },
        listPosts,
        makePosts: async (profile: PrivateChannelProfile, numPosts: number): Promise<PrivateChannelAction[]> => {
            const actions: PrivateChannelAction[] = [];
            for (let i = 0; i < numPosts; i++) {
                const action: PrivateChannelAction = [profile, sharePost(makePost(`hello ${i}`))];
                actions.push(action);
            }
            return actions;
        },
        execute: async (actions: PrivateChannelAction[]): Promise<PrivateChannelState> => {
            return composeState(inputState, actions);
        },
        generateRandomHex,
        debugState,
    };
};
