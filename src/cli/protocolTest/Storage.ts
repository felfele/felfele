import { HexString } from '../../helpers/opaqueTypes';

export interface StorageFeeds<T> {
    read: (address: HexString, topic: HexString) => Promise<T | undefined>;
    write: (address: HexString, topic: HexString, data: T, signFeedDigest: (digest: number[]) => string | Promise<string>) => Promise<void>;
}

export interface Storage<T> {
    readonly feeds: StorageFeeds<T>;
    read: (contentHash: HexString) => Promise<T>;
    write: (data: T) => Promise<HexString>;
}
