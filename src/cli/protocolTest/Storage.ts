import { HexString } from '../../helpers/opaqueTypes';

export interface StorageFeeds<T> {
    read: (address: HexString, topic: HexString) => Promise<T>;
    write: (address: HexString, topic: HexString, data: T) => Promise<void>;
}

export interface Storage<T> {
    readonly feeds: StorageFeeds<T>;
    read: (contentHash: HexString) => Promise<T>;
    write: (data: T) => Promise<HexString>;
}
