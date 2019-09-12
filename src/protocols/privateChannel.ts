import { PrivateCommand, calculatePrivateTopic, PrivateCommandPost, PrivateCommandRemove } from './privateSharing';
import { ChapterReference, Timeline, PartialChapter, readTimeline, makePartialChapter, fetchTimeline, getNewestChapterId, uploadTimeline } from './timeline';
import { MutualContact } from '../models/Contact';
import { ProtocolStorage } from './ProtocolStorage';
import { HexString } from '../helpers/opaqueTypes';
import { serialize, deserialize } from '../social/serialization';
import { stringToUint8Array, hexToUint8Array, Uint8ArrayToString } from '../helpers/conversion';
import { ProtocolCrypto } from './ProtocolCrypto';
import { PrivatePost } from '../models/Post';
import { Debug } from '../Debug';

export interface PrivateChannel {
    unsyncedCommands: PrivateCommand[];
    lastSyncedChapterId: ChapterReference | undefined;
    peerLastSeenChapterId: ChapterReference | undefined;
}

export const makeEmptyPrivateChannel = (): PrivateChannel => ({
    unsyncedCommands: [],
    lastSyncedChapterId: undefined,
    peerLastSeenChapterId: undefined,
});

interface PrivateChannelUpdate {
    topic: HexString;
    privateChannel: PrivateChannel;
    syncedLocalTimeline: Timeline<PrivateCommand>;
    peerTimeline: Timeline<PrivateCommand>;
}

const privateChannelAppendCommand = (privateChannel: PrivateChannel, command: PrivateCommand): PrivateChannel => {
    return {
        ...privateChannel,
        unsyncedCommands: [command, ...privateChannel.unsyncedCommands],
    };
};

export const privateChannelAddPost = (privateChannel: PrivateChannel, post: PrivatePost): PrivateChannel => {
    const command: PrivateCommandPost = {
        type: 'post',
        version: 1,
        protocol: 'private',
        post,
    };
    return privateChannelAppendCommand(privateChannel, command);
};

export const privateChannelRemovePost = (privateChannel: PrivateChannel, id: HexString): PrivateChannel => {
    const command: PrivateCommandRemove = {
        type: 'remove',
        version: 1,
        protocol: 'private',
        id,
    };
    return privateChannelAppendCommand(privateChannel, command);
};

export const uploadUnsyncedTimeline = async (
    unsyncedTimeline: Timeline<PrivateCommand>,
    lastSyncedChapterId: ChapterReference | undefined,
    address: HexString,
    topic: HexString,
    sharedSecret: HexString,
    storage: ProtocolStorage,
    crypto: ProtocolCrypto,
): Promise<Timeline<PrivateCommand>> => {
    const encryptChapter = async (c: PartialChapter<PrivateCommand>): Promise<Uint8Array> => {
        const s = serialize(c);
        const dataBytes = stringToUint8Array(s);
        const secretBytes = hexToUint8Array(sharedSecret);
        const random = await crypto.random(32);
        return crypto.encrypt(dataBytes, secretBytes, random);
    };

    if (unsyncedTimeline.length === 0) {
        return [];
    }

    try {
        const syncedTimeline = await uploadTimeline(
            unsyncedTimeline,
            storage,
            address,
            topic,
            encryptChapter,
            crypto.signDigest,
            lastSyncedChapterId,
        );
        return syncedTimeline;
    } catch (e) {
        Debug.log('uploadUnsyncedTimeline error', {e});
        return [];
    }
};

export const fetchPeerTimeline = async (
    peerLastSeenChapterId: ChapterReference | undefined,
    address: HexString,
    topic: HexString,
    sharedSecret: HexString,
    storage: ProtocolStorage,
    crypto: ProtocolCrypto,
): Promise<Timeline<PrivateCommand>> => {
    const decryptChapter = (dataBytes: Uint8Array): PartialChapter<PrivateCommand> => {
        const secretBytes = hexToUint8Array(sharedSecret);
        const decryptedBytes = crypto.decrypt(dataBytes, secretBytes);
        const decryptedText = Uint8ArrayToString(decryptedBytes);
        return deserialize(decryptedText) as PartialChapter<PrivateCommand>;
    };

    try {
        const peerTimeline = await fetchTimeline(storage, address, topic, decryptChapter, peerLastSeenChapterId);
        return peerTimeline;
    } catch (e) {
        return [];
    }
};

export const syncPrivateChannelWithContact = async (
    contact: MutualContact,
    address: HexString,
    storage: ProtocolStorage,
    crypto: ProtocolCrypto,
): Promise<PrivateChannelUpdate> => {
    const sharedSecret = crypto.deriveSharedKey(contact.identity.publicKey as HexString);
    const topic = calculatePrivateTopic(sharedSecret);
    const privateChannel = contact.privateChannel;
    const unsyncedTimeline = privateChannel.unsyncedCommands.map(command =>
        makePartialChapter(address, command, Date.now())
    );

    const syncedTimeline = await uploadUnsyncedTimeline(
        unsyncedTimeline,
        privateChannel.lastSyncedChapterId,
        address,
        topic,
        sharedSecret,
        storage,
        crypto,
    );

    const peerTimeline = await fetchPeerTimeline(
        privateChannel.peerLastSeenChapterId,
        contact.identity.address as HexString,
        topic,
        sharedSecret,
        storage,
        crypto,
    );

    return {
        topic,
        privateChannel: contact.privateChannel,
        syncedLocalTimeline: syncedTimeline,
        peerTimeline,
    };
};

export const applyPrivateChannelUpdate = (
    update: PrivateChannelUpdate,
    executeRemoteCommand?: (command: PrivateCommand) => void,
    executeLocalCommand?: (command: PrivateCommand) => void,
): PrivateChannel => {
    Debug.log('applyPrivateChannelUpdate', update);
    if (executeLocalCommand != null) {
        update.syncedLocalTimeline.map(chapter => executeLocalCommand(chapter.content));
    }
    if (executeRemoteCommand != null) {
        update.peerTimeline.map(chapter => executeRemoteCommand(chapter.content));
    }
    const peerLastSeenChapterId = update.peerTimeline.length !== 0
        ? getNewestChapterId(update.peerTimeline)
        : update.privateChannel.peerLastSeenChapterId
    ;
    const lastSyncedChapterId = update.syncedLocalTimeline.length !== 0
        ? getNewestChapterId(update.syncedLocalTimeline)
        : update.privateChannel.lastSyncedChapterId
    ;
    const unsyncedCommands = update.syncedLocalTimeline.length !== 0
        ? []
        : update.privateChannel.unsyncedCommands
    ;
    return {
        peerLastSeenChapterId,
        lastSyncedChapterId,
        unsyncedCommands,
    };
};
