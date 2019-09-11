import { HexString } from '../helpers/opaqueTypes';
import { hexToUint8Array, byteArrayToHex, stringToUint8Array, Uint8ArrayToString } from '../helpers/conversion';
import { cryptoHash } from '../helpers/crypto';
import { Post, PrivatePost } from '../models/Post';
import { Timeline, PartialChapter, uploadTimeline, getNewestChapterId, fetchTimeline, LogicalTime, appendToTimeline, ChapterReference, readTimeline, makePartialChapter, uploadChapter } from './timeline';
import { serialize, deserialize } from '../social/serialization';
import { ProtocolStorage } from './ProtocolStorage';
import { PublicProfile } from '../models/Profile';
import { PublicIdentity } from '../models/Identity';
import { MutualContact } from '../models/Contact';
import { Author } from '../models/Author';
import { copyPostPrivately, copyPostWithReferences } from '../helpers/postHelpers';
import { Debug } from '../Debug';
import { ProtocolCrypto } from './ProtocolCrypto';
import { makePostId } from './privateSharingTestHelpers';

interface PrivateCommandBase {
    protocol: 'private';    // TODO this could be a hash to the actual protocol description
    version: 1;
}

export interface PrivateCommandPost extends PrivateCommandBase {
    type: 'post';
    post: PrivatePost;
    version: 1;
}

export interface PrivateCommandRemove extends PrivateCommandBase {
    type: 'remove';
    version: 1;
    id: HexString;
}

export type PrivateCommand =
    | PrivateCommandPost
    | PrivateCommandRemove
;

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
    return byteArrayToHex(topicBytes, false);
};

export const uploadLocalPrivateCommands = async (context: PrivateSharingContext): Promise<Timeline<PrivateCommand>> => {
    const topic = calculatePrivateTopic(context.sharedSecret);
    const encryptChapter = async (c: PartialChapter<PrivateCommand>): Promise<Uint8Array> => {
        const s = serialize(c);
        const dataBytes = stringToUint8Array(s);
        const secretBytes = hexToUint8Array(context.sharedSecret);
        const random = await context.crypto.random(32);
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

export const listTimelinePosts = (timeline: Timeline<PrivateCommand>): Post[] => {
    const timestampCompare = <T>(a: PartialChapter<T>, b: PartialChapter<T>) => a.timestamp - b.timestamp;
    const authorCompare = <T>(a: PartialChapter<T>, b: PartialChapter<T>) => a.author.localeCompare(b.author);
    const isPrivatePost = (command: PrivateCommand): command is PrivateCommandPost => command.type === 'post';
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

export const privateSharePost = async (context: PrivateSharingContext, post: PrivatePost): Promise<PrivateSharingContext> => {
    const command: PrivateCommandPost = {
        protocol: 'private',
        version: 1,
        type: 'post',
        post,
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
    const command: PrivateCommandRemove = {
        protocol: 'private',
        version: 1,
        type: 'remove',
        id,
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

export const privateSharePostWithContact = async (
    originalPost: Post,
    contact: MutualContact,
    author: Author,
    profile: PublicProfile,
    storage: ProtocolStorage,
    crypto: ProtocolCrypto,
    postId: HexString,
): Promise<PrivatePost> => {
    const sharedSecret = crypto.deriveSharedKey(contact.identity.publicKey as HexString);
    const topic = calculatePrivateTopic(sharedSecret);

    const post = originalPost._id == null || originalPost.topic != null
        ? copyPostPrivately(originalPost, author, postId, topic)
        : {
            ...copyPostWithReferences(originalPost, author, postId, topic),
            topic,
            author,
            _id: postId,
        }
    ;

    const context: PrivateSharingContext = {
        profile,
        contactIdentity: contact.identity,
        localTimeline: [],
        remoteTimeline: [],
        sharedSecret,
        storage,
        crypto,
    };

    const localTimeline = await downloadUploadedLocalPrivateCommands(context);
    const contextBeforePost = {
        ...context,
        localTimeline,
    };
    const contextWithPost = await privateSharePost(contextBeforePost, post);
    Debug.log('shareWithContact', {contextWithPost, originalPost, post, postId});
    const updatedLocalTimeline = await uploadLocalPrivateCommands(contextWithPost);
    return post;
};
