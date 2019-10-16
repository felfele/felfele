import { PublicIdentity } from '../models/Identity';
import { Post, PostWithId } from '../models/Post';
import { HexString } from '../helpers/opaqueTypes';
import { ImageData } from '../models/ImageData';
import { ChapterReference } from './timeline';
import { PublicProfile } from '../models/Profile';

interface PeerSyncData {
    peerLastSeenChapterId: ChapterReference | undefined;
}

interface GroupPeer extends PeerSyncData, PublicProfile {
}

interface OwnSyncData {
    unsyncedCommands: GroupCommand[];
    lastSyncedChapterId: ChapterReference | undefined;
}

export interface GroupMember {
    address: HexString;
    publicKey?: HexString | undefined;
    name: string;
    image: ImageData;
}

export interface Group {
    sharedSecret: HexString;
    topic: HexString;
    members: GroupMember[];
}

export interface GroupSyncData extends Group {
    ownSyncData: OwnSyncData;
    peers: GroupPeer[];
}

interface GroupSyncUpdate {
}

interface GroupCommandBase {
    protocol: 'group';
    version: 1;
}

export interface GroupCommandAddMember extends GroupCommandBase {
    type: 'add-member';

    member: GroupMember;
}

export interface GroupCommandRemoveMember extends GroupCommandBase {
    type: 'remove-member';

    address: HexString;
}

export interface GroupCommandPost extends GroupCommandBase {
    type: 'post';

    post: Post;
}

export type GroupCommand = GroupCommandAddMember | GroupCommandRemoveMember | GroupCommandPost;

const groupAppendCommand = (syncData: OwnSyncData, command: GroupCommand): OwnSyncData => {
    return {
        ...syncData,
        unsyncedCommands: [command, ...syncData.unsyncedCommands],
    };
};

export const groupAddMember = (syncData: OwnSyncData, member: GroupMember): OwnSyncData => {
    const command: GroupCommandAddMember = {
        type: 'add-member',
        version: 1,
        protocol: 'group',
        member,
    };
    return groupAppendCommand(syncData, command);
};

export const groupPost = (syncData: OwnSyncData, post: PostWithId): OwnSyncData => {
    const command: GroupCommandPost = {
        type: 'post',
        version: 1,
        protocol: 'group',
        post,
    };
    return groupAppendCommand(syncData, command);
};

export const groupSync = async (syncData: OwnSyncData): Promise<GroupSyncUpdate> => {
    return {};
};
