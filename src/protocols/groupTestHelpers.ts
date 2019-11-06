import { Post, PostWithId } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { randomNumbers, makeStorage, makeCrypto } from '../cli/protocolTest/protocolTestHelpers';
import * as SwarmHelpers from '../swarm/Swarm';
import { PrivateProfile, PublicProfile } from '../models/Profile';
import { PrivateIdentity } from '../models/Identity';
import { Debug } from '../Debug';
import { createDeterministicRandomGenerator } from '../helpers/unsecureRandom';
import { makePostId } from '../helpers/postHelpers';
import { ProtocolCrypto } from './ProtocolCrypto';
import { ProtocolStorage } from './ProtocolStorage';
import { postTimeCompare } from '../selectors/selectors';
import { groupAddMember, groupPost, groupSync, GroupSyncData, groupApplySyncUpdate, GroupCommand, GroupSyncPeer, groupRemovePost, Group, groupRemoveMember, GroupPeer } from './group';
import { PrivateChannelCommandInviteToGroup } from './privateChannel';

interface PeerPost extends Post {
    ownerAddress: HexString;
    logicalTime: number;
}

interface GroupContextContact extends GroupSyncPeer {
    invite?: PrivateChannelCommandInviteToGroup;
}

export interface GroupContext extends GroupSyncData {
    groupProfile: GroupProfile;
    profile: PublicProfile;
    crypto: ProtocolCrypto;
    storage: ProtocolStorage;
    posts: PeerPost[];
    contacts: GroupContextContact[];
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

type FixedArray<T> = [T, T, T, T, T, T];

const asyncMapFixedArray = async <T, K>(arr: FixedArray<T>, fun: (t: T) => Promise<K>): Promise<FixedArray<K>> => {
    const ret: FixedArray<K> = [
        await fun(arr[0]),
        await fun(arr[1]),
        await fun(arr[2]),
        await fun(arr[3]),
        await fun(arr[4]),
        await fun(arr[5]),
    ];
    return ret;
};

export interface GroupState {
    contexts: FixedArray<GroupContext>;
    profiles: FixedArray<PrivateProfile>;
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

const createProfiles = async (generateIdentity: () => Promise<PrivateIdentity>): Promise<FixedArray<PrivateProfile>> => {
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
    return profiles as FixedArray<PrivateProfile>;
};

type GroupTestContactConfig = [GroupProfile, GroupProfile[]];
export type GroupTestConfig = FixedArray<GroupTestContactConfig>;

export const debugState = (state: GroupState, profiles?: GroupProfile[]) => {
    for (const context of state.contexts) {
        if (profiles != null && profiles.indexOf(context.groupProfile) === -1) {
            continue;
        }
        const posts = listPosts(context);
        Debug.log({
            name: context.profile.name,
            posts,
        });
        Debug.log(context);
    }
    return state;
};

export const listPosts = (context: GroupContext): Post[] => {
    const postId = (p: Post) => typeof p._id === 'string' ? p._id : '' + (p._id || '');
    const idCompare = (a: Post, b: Post) => postId(a).localeCompare(postId(b));
    const logicalTimeCompare = (a: PeerPost, b: PeerPost) => a.logicalTime - b.logicalTime;
    return context.posts
        .sort((a, b) => logicalTimeCompare(a, b) || idCompare(a, b))
    ;
};

export const listMembers = (context: GroupContext): HexString[] => {
    const peerAdresses = context.peers.map(peer => ({
        address: peer.address,
        joinLogicalTime: peer.joinLogicalTime,
    }));
    return peerAdresses
        .concat([{
            address: context.profile.identity.address as HexString,
            joinLogicalTime: context.ownSyncData.joinLogicalTime,
        }])
        .sort((a, b) => a.joinLogicalTime - b.joinLogicalTime)
        .map(pa => pa.address)
    ;
};

const executeCommand = (command: GroupCommand, context: GroupContext, address: HexString) => {
    Debug.log('executeCommand', {
        profileName: context.profile.name,
        profileAddress: context.profile.identity.address,
        commandAddress: address,
        posts: context.posts,
        command,
    });
    switch (command.type) {
        case 'post': {
            const post = {
                ...command.post,
                ownerAddress: address,
                logicalTime: command.logicalTime,
                _id: command.post._id || makePostId(command.post),
            };
            context.posts.push(post);
            return;
        }
        case 'remove-post': {
            const isRemoveOwnPost = (post: PeerPost) => post._id === command.id && post.ownerAddress === address;
            context.posts = context.posts.filter(post =>
                post._id == null || isRemoveOwnPost(post) === false
            );
            Debug.log('executeCommand', command.type, {posts: context.posts});
            return;
        }
    }
};

export const createGroup = (topic: HexString, sharedSecret: HexString): GroupFunction => {
    return async (context) => {
        return {
            ...context,
            topic,
            sharedSecret,
            peers: [],
        };
    };
};

const sendPrivateInvite = (from: GroupProfile, to: GroupProfile, state: GroupState, logicalTime: number) => {
    const fromProfile = state.profiles[from];
    const index = state.contexts[to].contacts.findIndex(c => c.address === fromProfile.identity.address);
    if (index === -1) {
        throw new Error(`unknown contact: ${fromProfile.name} of ${state.profiles[to].name}`);
    }
    const contact = state.contexts[to].contacts[index];
    const group: Group = {
        ...state.contexts[from],
    };
    const inviteCommand: PrivateChannelCommandInviteToGroup = {
        type: 'invite',
        version: 1,
        protocol: 'private',
        group,
        logicalTime,
    };
    contact.invite = inviteCommand;
};

const findContactByGroupProfile = (context: GroupContext, state: GroupState, groupProfile: GroupProfile): GroupContextContact | never => {
    const profile = state.profiles[groupProfile];
    const profileAddress = profile.identity.address;
    const index = context.contacts.findIndex(c => c.address === profileAddress);
    if (index === -1) {
        throw new Error(`unknown contact: ${profile.name} of ${context.profile.name}`);
    }
    return context.contacts[index];
};

export const invite = (groupProfile: GroupProfile): GroupFunction => {
    return async (context, state) => {
        const contact = findContactByGroupProfile(context, state, groupProfile);
        const ownSyncData = groupAddMember(context.ownSyncData, contact);
        const invitedMember = {
            ...contact,
            joinLogicalTime: ownSyncData.logicalTime,
        };
        const members = [...context.peers, invitedMember];

        sendPrivateInvite(context.groupProfile, groupProfile, state, ownSyncData.logicalTime);

        return {
            ...context,
            ownSyncData,
            peers: members,
        };
    };
};

export const receivePrivateInvite = (from: GroupProfile): GroupFunction => {
    return async (context, state) => {
        const fromProfile = state.profiles[from];
        const fromProfileAddress = fromProfile.identity.address;
        const contact = findContactByGroupProfile(context, state, from);
        const inviteCommand = contact.invite;
        if (inviteCommand == null) {
            throw new Error(`missing invite: ${fromProfile.name} to ${context.profile.name}`);
        }
        const peers = inviteCommand.group.peers
            .filter(member => member.address !== context.profile.identity.address)
            .map(member => ({
                ...member,
                peerLastSeenChapterId: undefined,
            }))
            .concat([{
                ...fromProfile,
                address: fromProfileAddress as HexString,
                peerLastSeenChapterId: undefined,
                joinLogicalTime: state.contexts[from].ownSyncData.joinLogicalTime,
            }])
        ;
        const ownSyncData = {
            ...context.ownSyncData,
            logicalTime: inviteCommand.logicalTime,
            joinLogicalTime: inviteCommand.logicalTime,
        };
        return {
            ...context,
            ownSyncData,
            sharedSecret: inviteCommand.group.sharedSecret,
            topic: inviteCommand.group.topic,
            peers: peers,
        };
    };
};

export const sync = (): GroupFunction => {
    return async (context) => {
        Debug.log('sync', {
            profileName: context.profile.name,
            profileAddress: context.profile.identity.address,
        });
        const update = await groupSync(
            context,
            context.storage,
            context.crypto,
            (image) => Promise.resolve(image)
        );
        const groupSyncData = groupApplySyncUpdate(
            update,
            (command, address) => executeCommand(command, context, address),
            command => executeCommand(command, context, context.profile.identity.address as HexString),
        );
        const retval = {
            ...context,
            ...groupSyncData,
            posts: context.posts,
        };
        return retval;
    };
};

export const sharePostText = (text: string, createdAt: number = Date.now()): GroupFunction => {
    return sharePost(makePost(text, createdAt));
};

export const sharePost = (post: PostWithId) => {
    return async (context: GroupContext): Promise<GroupContext> => {
        const ownSyncData = groupPost(context.ownSyncData, post);
        return {
            ...context,
            ownSyncData,
        };
    };
};

export const removePost = (id: HexString): GroupFunction => {
    return async (context) => {
        const ownSyncData = groupRemovePost(context.ownSyncData, id);
        return {
            ...context,
            ownSyncData,
        };
    };
};

export const removePeer = (peerAddress: HexString): GroupFunction => {
    return async (context) => {
        const ownSyncData = groupRemoveMember(context.ownSyncData, peerAddress);
        return {
            ...context,
            ownSyncData,
        };
    };
};

export const execute = async (
    actions: GroupAction[],
    groupTestConfig: GroupTestConfig,
    randomSeed: string = randomNumbers[0],
): Promise<GroupState> => {
    const generateDeterministicRandom = createDeterministicRandomGenerator(randomSeed);
    const generateAsyncDeterministicRandom = (length: number) => Promise.resolve(generateDeterministicRandom(length));
    const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateAsyncDeterministicRandom);

    const storage = await makeStorage(generateIdentity);
    const profiles = await createProfiles(generateIdentity);

    const makeContextContact = (profile: PublicProfile): GroupSyncPeer => ({
        name: profile.name,
        image: profile.image,
        address: profile.identity.address as HexString,
        peerLastSeenChapterId: undefined,
        joinLogicalTime: 0,
    });

    const makeContextFromProfiles = async (
        groupProfile: GroupProfile,
        profile: PrivateProfile,
        contactProfiles: PublicProfile[],
    ): Promise<GroupContext> => ({
        topic: '' as HexString,
        sharedSecret: '' as HexString,
        ownSyncData: {
            ownAddress: profile.identity.address as HexString,
            unsyncedCommands: [],
            lastSyncedChapterId: undefined,
            logicalTime: 0,
            joinLogicalTime: 0,
        },
        groupProfile,
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
            testConfig[0],
            profiles[testConfig[0]],
            testConfig[1].map(profile => profiles[profile])
        )
    ;

    const contexts = await asyncMapFixedArray(groupTestConfig, makeContextFromTestConfig);
    const inputState: GroupState = {
        contexts,
        profiles,
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
};
