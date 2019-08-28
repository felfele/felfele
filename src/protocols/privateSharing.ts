import { HexString } from '../helpers/opaqueTypes';
import { hexToUint8Array, byteArrayToHex, stringToUint8Array, Uint8ArrayToString } from '../helpers/conversion';
import { cryptoHash } from './group';
import { Post } from '../models/Post';
import { Timeline, PartialChapter, uploadTimeline, getNewestChapterId, fetchTimeline, LogicalTime, appendToTimeline, ChapterReference } from './timeline';
import * as SwarmHelpers from '../swarm/Swarm';
import { serialize, deserialize } from '../social/serialization';
import { ProtocolStorage } from './ProtocolStorage';
import { PublicProfile } from '../models/Profile';
import { PublicIdentity } from '../models/Identity';

interface PrivateCommandBase {
    protocol: 'private';    // TODO this could be a hash to the actual protocol description
    logicalTime: number;
    id: HexString;
    version: 1;
}

export interface PrivateCommandPost extends PrivateCommandBase {
    type: 'post';
    post: Post;
    version: 1;
}

export interface PrivateCommandRemove extends PrivateCommandBase {
    type: 'remove';
    version: 1;
}

export type PrivateCommand =
    | PrivateCommandPost
    | PrivateCommandRemove
;

interface Encryption {
    encrypt: (data: Uint8Array, key: Uint8Array, random: Uint8Array) => Uint8Array;
    decrypt: (data: Uint8Array, key: Uint8Array) => Uint8Array;
}

interface ProtocolCrypto extends Encryption {
    signDigest: SwarmHelpers.FeedDigestSigner;
    deriveSharedKey: (publicKey: HexString) => HexString;
    random: (length: number) => Promise<Uint8Array>;
}

export interface PrivateSharingContext {
    profile: PublicProfile;
    contactIdentity: PublicIdentity;
    localTimeline: Timeline<PrivateCommand>;
    remoteTimeline: Timeline<PrivateCommand>;
    sharedSecret: HexString;
    crypto: ProtocolCrypto;
    storage: ProtocolStorage;
}

export const calculatePrivateTopic = (sharedKey: HexString): HexString => {
    const sharedKeyBytes = hexToUint8Array(sharedKey);
    const topicBytes = cryptoHash(sharedKeyBytes);
    return byteArrayToHex(topicBytes);
};

export const uploadLocalPrivateCommands = async (context: PrivateSharingContext): Promise<Timeline<PrivateCommand>> => {
    const topic = calculatePrivateTopic(context.sharedSecret);
    const random = await context.crypto.random(32);
    const encryptChapter = (c: PartialChapter<PrivateCommand>): Uint8Array => {
        const s = serialize(c);
        const dataBytes = stringToUint8Array(s);
        const secretBytes = hexToUint8Array(context.sharedSecret);
        return context.crypto.encrypt(dataBytes, secretBytes, random);
    };
    const uploadedTimeline = await uploadTimeline(
        context.localTimeline,
        context.storage,
        context.profile.identity.address as HexString,
        topic,
        encryptChapter,
        context.crypto.signDigest,
    );
    return uploadedTimeline;
};

const downloadPrivateCommands = async (
    storage: ProtocolStorage,
    crypto: ProtocolCrypto,
    identity: PublicIdentity,
    sharedSecret: HexString,
    lastSeenReference?: ChapterReference | undefined,
): Promise<Timeline<PrivateCommand>> => {
    const topic = calculatePrivateTopic(sharedSecret);
    const decryptChapter = (dataBytes: Uint8Array): PartialChapter<PrivateCommand> => {
        const secretBytes = hexToUint8Array(sharedSecret);
        const decryptedBytes = crypto.decrypt(dataBytes, secretBytes);
        const decryptedText = Uint8ArrayToString(decryptedBytes);
        return deserialize(decryptedText) as PartialChapter<PrivateCommand>;
    };
    const timeline = await fetchTimeline(
        storage,
        identity.address as HexString,
        topic,
        decryptChapter,
        lastSeenReference,
    );
    return timeline;

};

export const downloadUploadedLocalPrivateCommands = async (context: PrivateSharingContext): Promise<Timeline<PrivateCommand>> => {
    const newestChapterId = getNewestChapterId(context.localTimeline);
    const localTimeline = await downloadPrivateCommands(
        context.storage,
        context.crypto,
        context.profile.identity,
        context.sharedSecret,
        newestChapterId,
    );
    return [...localTimeline, ...context.localTimeline];
};

export const downloadRemotePrivateCommands = async (context: PrivateSharingContext): Promise<Timeline<PrivateCommand>> => {
    const newestChapterId = getNewestChapterId(context.remoteTimeline);
    const remoteTimeline = await downloadPrivateCommands(
        context.storage,
        context.crypto,
        context.contactIdentity,
        context.sharedSecret,
        newestChapterId,
    );
    return [...remoteTimeline, ...context.remoteTimeline];
};

const firstLogicalTime = <T extends LogicalTime>(timeline: Timeline<T>, defaultTime = 0) => {
    return timeline.length > 0
        ? timeline[0].content.logicalTime
        : defaultTime
    ;
};

export const highestLogicalTime = (context: PrivateSharingContext) => {
    return Math.max(
        firstLogicalTime(context.localTimeline),
        firstLogicalTime(context.remoteTimeline),
    );
};

export const listTimelinePosts = (timeline: Timeline<PrivateCommand>): Post[] => {
    const logicalTimeCompare = <T extends LogicalTime>(a: PartialChapter<T>, b: PartialChapter<T>) => a.content.logicalTime - b.content.logicalTime;
    const timestampCompare = <T>(a: PartialChapter<T>, b: PartialChapter<T>) => a.timestamp - b.timestamp;
    const authorCompare = <T>(a: PartialChapter<T>, b: PartialChapter<T>) => a.author.localeCompare(b.author);
    const isPrivatePost = (command: PrivateCommand): command is PrivateCommandPost => command.type === 'post';
    const skipSet = new Set<string>();
    const posts = timeline
        .sort((a, b) => timestampCompare(b, a) || authorCompare(b, a) || logicalTimeCompare(b, a))
        .filter(chapter => {
            if (chapter.content.type === 'remove') {
                skipSet.add(chapter.content.id);
                return false;
            }
            if (chapter.content.type === 'post'
                && skipSet.has(chapter.content.id)
            ) {
                return false;
            }
            skipSet.add(chapter.content.id);
            return true;
        })
        .map(chapter => chapter.content)
        .filter(isPrivatePost)
        .map(command => ({
            ...command.post,
            _id: command.id,
        }))
    ;
    return posts;
};

export const privateSharePost = async (context: PrivateSharingContext, post: Post, id: HexString): Promise<PrivateSharingContext> => {
    const logicalTime = highestLogicalTime(context) + 1;
    const command: PrivateCommandPost = {
        protocol: 'private',
        version: 1,
        type: 'post',
        id,
        post,
        logicalTime,
    };
    return {
        ...context,
        localTimeline: appendToTimeline(
            context.localTimeline,
            context.profile.identity.address,
            command,
        ),
    };
};

export const privateDeletePost = async (context: PrivateSharingContext, id: HexString): Promise<PrivateSharingContext> => {
    const logicalTime = highestLogicalTime(context) + 1;
    const command: PrivateCommandRemove = {
        protocol: 'private',
        version: 1,
        type: 'remove',
        id,
        logicalTime,
    };
    return {
        ...context,
        localTimeline: appendToTimeline(
            context.localTimeline,
            context.profile.identity.address,
            command,
        ),
    };
};

export const privateSync = async (context: PrivateSharingContext): Promise<PrivateSharingContext> => {
    const uploadedLocalTimeline = await uploadLocalPrivateCommands(context);
    const downloadedRemoteTimeline = await downloadRemotePrivateCommands(context);
    return {
        ...context,
        localTimeline: uploadedLocalTimeline,
        remoteTimeline: downloadedRemoteTimeline,
    };
};
