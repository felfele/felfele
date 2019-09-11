import { HexString } from '../helpers/opaqueTypes';
import * as SwarmHelpers from '../swarm/Swarm';

interface Encryption {
    encrypt: (data: Uint8Array, key: Uint8Array, random: Uint8Array) => Uint8Array;
    decrypt: (data: Uint8Array, key: Uint8Array) => Uint8Array;
}

export interface ProtocolCrypto extends Encryption {
    signDigest: SwarmHelpers.FeedDigestSigner;
    deriveSharedKey: (publicKey: HexString) => HexString;
    random: (length: number) => Promise<Uint8Array>;
}
