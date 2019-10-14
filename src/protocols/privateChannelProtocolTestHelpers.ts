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
import { makeEmptyPrivateChannel, privateChannelAddPost, privateChannelRemovePost, syncPrivateChannelWithContact, applyPrivateChannelUpdate, PrivateChannelSyncData, PrivateChannelCommand, PrivateChannelCommandPost } from './privateChannel';
import { MutualContact } from '../models/Contact';
import { ProtocolCrypto } from './ProtocolCrypto';
import { ProtocolStorage } from './ProtocolStorage';
import { Timeline, PartialChapter } from './timeline';
import { postTimeCompare } from '../selectors/selectors';

export interface PrivateSharingContext {
    profile: PublicProfile;
    contactIdentity: PublicIdentity;
    syncData: PrivateChannelSyncData;
    sharedSecret: HexString;
    crypto: ProtocolCrypto;
    storage: ProtocolStorage;
    posts: Post[];
}

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

export interface PrivateSharingProtocolTester {
    ALICE: PrivateSharingProfile.ALICE;
    BOB: PrivateSharingProfile.BOB;
    sharePostText: (text: string, createdAt: number) => PrivateSharingFunction;
    sharePost: (post: Post & { _id: HexString }) => PrivateSharingFunction;
    deletePost: (id: HexString) => PrivateSharingFunction;
    sync: () => PrivateSharingFunction;
    listPosts: (context: PrivateSharingContext) => Post[];
    makePosts: (profile: PrivateSharingProfile, numPosts: number) => Promise<PrivateSharingAction[]>;
    execute: (actions: PrivateSharingAction[]) => Promise<PrivateSharingState>;
    generateRandomHex: () => HexString;
    debugState: (state: PrivateSharingState) => void;
}

export const makePrivateChannelProtocolTester = async (randomSeed: string = randomNumbers[0]): Promise<PrivateSharingProtocolTester> => {
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
    ): Promise<PrivateSharingContext> => ({
        profile,
        contactIdentity,
        syncData: makeEmptyPrivateChannel(),
        sharedSecret: deriveSharedKey(profile.identity, contactIdentity),
        storage,
        crypto: makeCrypto(profile.identity, generateAsyncDeterministicRandom),
        posts: [],
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
        const ALICE = PrivateSharingProfile.ALICE;
        const postsAlice = listPosts(state.contexts[ALICE]);
        Debug.log({
            syncData: state.contexts[ALICE].syncData,
            postsAlice,
        });
        const BOB = PrivateSharingProfile.BOB;
        const postsBob = listPosts(state.contexts[BOB]);
        Debug.log({
            syncData: state.contexts[BOB].syncData,
            postsBob,
        });
        return state;
    };

    const inputState: PrivateSharingState = {
        contexts: [
            await makeContextFromProfiles(aliceProfile, bobProfile.identity),
            await makeContextFromProfiles(bobProfile, aliceProfile.identity),
        ],
    };

    const now = () => {
        dateNow += 1;
        return dateNow;
    };

    const sharePost = (post: Post & { _id: HexString }): PrivateSharingFunction => {
        return async (context) => {
            const syncData = privateChannelAddPost(context.syncData, post);
            return {
                ...context,
                syncData,
            };
        };
    };

    const listPosts = (context: PrivateSharingContext): Post[] => {
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
        ALICE: PrivateSharingProfile.ALICE,
        BOB: PrivateSharingProfile.BOB,
        sharePostText: (text: string, createdAt: number = Date.now()) => {
            return sharePost(makePost(text, createdAt));
        },
        sharePost: (post: Post & { _id: HexString }) => {
            return sharePost(post);
        },
        deletePost: (id: HexString): PrivateSharingFunction => {
            return async (context) => {
                const syncData = privateChannelRemovePost(context.syncData, id);
                return {
                    ...context,
                    syncData,
                };
            };
        },
        sync: (): PrivateSharingFunction => {
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
