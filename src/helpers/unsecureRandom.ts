import { HexString } from './opaqueTypes';

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
