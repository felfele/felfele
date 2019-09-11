import { BrandedType, HexString } from '../helpers/opaqueTypes';
import { ProtocolStorage } from './ProtocolStorage';
import { Debug } from '../Debug';

export type ChapterReference = BrandedType<HexString, 'ChapterReference'>;

export type PartialChapter<T> = {
    protocol: 'timeline',
    version: '1.0.0',
    timestamp: number,
    author: string,
    type: string,
    content: T,
    previous?: ChapterReference,
    references?: Array<ChapterReference>,
    signature?: string,
};

export type Chapter<T> = PartialChapter<T> & { id: ChapterReference };
export const isChapter = <T>(c: Chapter<T> | PartialChapter<T>): c is Chapter<T> => (c as Chapter<T>).id != null;

export type Timeline<T> = (Chapter<T> | PartialChapter<T>)[];

const getReverseUnsyncedChapters = <T>(timeline: Timeline<T>): Timeline<T> => {
    const unsyncedChapters: Timeline<T> = [];
    for (const chapter of timeline) {
        if (isChapter(chapter)) {
            break;
        }
        unsyncedChapters.push(chapter);
    }
    return unsyncedChapters.reverse();
};

export const uploadChapter = async <T>(
    storage: ProtocolStorage,
    chapter: PartialChapter<T>,
    encode: (c: PartialChapter<T>) => Promise<Uint8Array>
): Promise<Chapter<T>> => {
    const encodedData = await encode(chapter);
    const hash = await storage.write(encodedData);
    return {
        ...chapter,
        id: hash as ChapterReference,
    };
};

const getChapterId = <T>(chapter: Chapter<T> | PartialChapter<T>): ChapterReference | undefined => {
    return isChapter(chapter) ? chapter.id : undefined;
};

const findPreviousReference = <T>(timeline: Timeline<T>, author: string): ChapterReference | undefined => {
    for (const chapter of timeline) {
        if (chapter.author === author && getChapterId(chapter) != null) {
            return getChapterId(chapter);
        }
    }
    return undefined;
};

export const getNewestChapterId = <T>(timeline: Timeline<T>): ChapterReference | undefined => {
    if (timeline.length === 0) {
        return undefined;
    }
    const newestChapterId = getChapterId(timeline[0]);
    return newestChapterId;
};

export const uploadTimeline = async <T>(
    timeline: Timeline<T>,
    storage: ProtocolStorage,
    address: HexString,
    topic: HexString,
    encodeChapter: (c: PartialChapter<T>) => Promise<Uint8Array>,
    signDigest: (digest: number[]) => string | Promise<string>,
    previousReference?: ChapterReference | undefined,
): Promise<Timeline<T>> => {
    const reverseUnsyncedChapters = getReverseUnsyncedChapters(timeline);
    const previouslySyncedChapters = timeline.slice(reverseUnsyncedChapters.length);

    const syncedChapters: Timeline<T> = [];
    let previous = previousReference || findPreviousReference(previouslySyncedChapters, address);
    for (const chapter of reverseUnsyncedChapters) {
        const chapterWithPrevious = {
            ...chapter,
            previous,
        };

        const uploadedChapter = await uploadChapter(storage, chapterWithPrevious, encodeChapter);
        syncedChapters.unshift(uploadedChapter);

        previous = uploadedChapter.id;
    }
    const newestChapterId = getNewestChapterId(syncedChapters);
    if (newestChapterId != null) {
        await storage.feeds.write(address, topic, newestChapterId, signDigest);
    }
    return [...syncedChapters, ...previouslySyncedChapters];
};

export const makePartialChapter = <T>(author: string, content: T, timestamp: number = Date.now(), previous?: ChapterReference | undefined): PartialChapter<T> => ({
    protocol: 'timeline',
    version: '1.0.0',
    timestamp,
    author,
    type: 'application/json',
    content,
    previous,
});

export const appendToTimeline = <T>(timeline: Timeline<T>, author: string, content: T): Timeline<T> => {
    const chapter: PartialChapter<T> = {
        protocol: 'timeline',
        version: '1.0.0',
        timestamp: Date.now(),
        author,
        type: 'application/json',
        content,
        previous: undefined,
    };
    return [chapter, ...timeline];
};

export const readTimeline = async (storage: ProtocolStorage, address: HexString, topic: HexString): Promise<ChapterReference | undefined> => {
    const hash = await storage.feeds.read(address, topic);
    Debug.log('readTimeline', {hash});
    return hash as ChapterReference | undefined;
};

const readChapter = async <T>(
    storage: ProtocolStorage,
    reference: ChapterReference,
    decryptData: (data: Uint8Array) => PartialChapter<T>,
): Promise<Chapter<T> | undefined> => {
    const data = await storage.read(reference as HexString);
    if (data == null) {
        return undefined;
    }
    const partialChapter = decryptData(data);
    return {
        ...partialChapter,
        id: reference,
    };
};

export const fetchTimeline = async <T>(
    storage: ProtocolStorage,
    address: HexString,
    topic: HexString,
    decodeChapter: (data: Uint8Array) => PartialChapter<T>,
    lastSeenReference: ChapterReference | undefined = undefined,
) => {
    let reference = await readTimeline(storage, address, topic);
    const timeline: Timeline<T> = [];
    while (reference != null && reference !== lastSeenReference) {
        const chapter = await readChapter<T>(storage, reference, decodeChapter);
        if (chapter == null) {
            return timeline;
        }
        timeline.push(chapter);
        reference = chapter.previous;
    }
    return timeline;
};

export interface LogicalTime {
    logicalTime: number;
}

export const highestSeenLogicalTime = <T extends LogicalTime>(timeline: Timeline<T>) => {
    return timeline.reduce((prev, curr) => curr.content.logicalTime > prev
        ? curr.content.logicalTime
        : prev
    , 0);
};

export const highestSeenRemoteLogicalTime = <T extends LogicalTime>(timeline: Timeline<T>, author: string) => {
    return timeline.reduce((prev, curr) => curr.author !== author && curr.content.logicalTime > prev
        ? curr.content.logicalTime
        : prev
    , 0);
};
