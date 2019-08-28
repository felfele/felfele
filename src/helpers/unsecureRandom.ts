import { HexString } from './opaqueTypes';
import { hexToByteArray, byteArrayToHex } from './conversion';
import { keccak256 } from 'js-sha3';

const generateUnsecureRandomValues = (length: number): number[] => {
    const values: number[] = [];
    for (let i = 0; i < length; i++) {
        values.push(Math.random() * 256);
    }
    return values;
};

export const generateUnsecureRandomHexString = (lengthInBytes: number): HexString => {
    const randomBytes = generateUnsecureRandomValues(lengthInBytes);
    return randomBytes.reduce<string>(
        (acc, value) => acc + ('0' + value.toString(16)).slice(-2),
        '',
    ) as HexString;
};

export const generateUnsecureRandomUint8Array = (lengthInBytes: number): Uint8Array => {
    const randomBytes = generateUnsecureRandomValues(lengthInBytes);
    return new Uint8Array(randomBytes);
};

export const generateUnsecureRandom = async (lengthInBytes: number): Promise<Uint8Array> => {
    return generateUnsecureRandomUint8Array(lengthInBytes);
};

export const createDeterministicRandomGenerator = (randomSeed: string = ''): (length: number) => Promise<Uint8Array> => {
    const nextRandomBlock = (): string => {
        const randomSeedBytes = hexToByteArray(randomSeed);
        randomSeed = byteArrayToHex(keccak256.array(randomSeedBytes), false);
        return randomSeed;
    };
    const createRandom = async (length: number) => {
        let randomHex = '';
        while (randomHex.length < length * 2) {
            const randomBlock = nextRandomBlock();
            randomHex += randomBlock;
        }
        return new Uint8Array(hexToByteArray(randomHex.slice(0, length * 2)));
    };
    return createRandom;
};
