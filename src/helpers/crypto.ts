import nacl from 'ecma-nacl';
import { keccak256 } from 'js-sha3';

export const ENCRYPTED_HEADER_LENGTH_IN_BYTES = 40;
export const ENCRYPTED_HEX_HEADER_LENGTH = 2 * ENCRYPTED_HEADER_LENGTH_IN_BYTES;

export const encrypt = async (plainData: Uint8Array, secret: Uint8Array | number[], generateRandom: (lengthInBytes: number) => Promise<Uint8Array>): Promise<Uint8Array> => {
    const secureRandomUint8Array = await generateRandom(nacl.secret_box.NONCE_LENGTH);
    const secretUint8Array = new Uint8Array(keccak256.array(secret));
    const encryptedData = nacl.secret_box.formatWN.pack(plainData, secureRandomUint8Array, secretUint8Array);
    return encryptedData;
};

export const encryptWithNonce = (plainData: Uint8Array, secret: Uint8Array | number[], nonce: Uint8Array): Uint8Array => {
    const nonceHashUint8Array = new Uint8Array(keccak256.array(nonce)).slice(0, nacl.secret_box.NONCE_LENGTH);
    const secretUint8Array = new Uint8Array(keccak256.array(secret));
    const encryptedData = nacl.secret_box.formatWN.pack(plainData, nonceHashUint8Array, secretUint8Array);
    return encryptedData;
};

export const decrypt = (encryptedData: Uint8Array, secret: Uint8Array | number[]): Uint8Array => {
    const secretUint8Array = new Uint8Array(keccak256.array(secret));
    const decryptedData = nacl.secret_box.formatWN.open(encryptedData, secretUint8Array);
    return decryptedData;
};
