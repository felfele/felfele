import { HexString } from '../helpers/opaqueTypes';

export interface ProtocolStorageFeeds {
    read: (address: HexString, topic: HexString) => Promise<string | undefined>;
    write: (address: HexString, topic: HexString, data: string, signFeedDigest: (digest: number[]) => string | Promise<string>) => Promise<void>;
}

export interface ProtocolStorage {
    readonly feeds: ProtocolStorageFeeds;
    read: (contentHash: HexString) => Promise<Uint8Array>;
    write: (data: Uint8Array) => Promise<HexString>;
}
