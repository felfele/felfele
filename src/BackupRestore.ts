import { keccak256 } from 'js-sha3';
import nacl from 'ecma-nacl';
// @ts-ignore
import * as base64 from 'base64-arraybuffer';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
// @ts-ignore
import * as utf8 from 'utf8-encoder';

import { hexToByteArray } from './conversion';
import { Version } from './Version';
import { encrypt, decrypt } from './cryptoHelpers';

const header = `-----BEGIN FELFELE BACKUP-----`;
const headerFields = `
Version: Felfele v${Version}
`;
const separator = '\n\n';
const footer = `-----END FELFELE BACKUP-----`;

export const stripHeaderAndFooter = (backupText: string): string => {
    if (!isValidBackup(backupText)) {
        throw new Error('invalid backup header');
    }
    const backupDataParts = backupText.split(separator);
    if (backupDataParts.length !== 3) {
        throw new Error('invalid backup data parts');
    }
    return backupDataParts[1].replace('\n', '');
};

const wrapWithHeaderAndFooter = (data: string): string => {
    return header + headerFields + separator + data + separator + footer;
};

export const isValidBackup = (backupText: string): boolean => {
    if (!backupText.startsWith(header)) {
        return false;
    }
    return true;
};

export const createBinaryBackupFromString = async (data: string, secretHex: string, generateRandom: (num: number) => Promise<Uint8Array> = generateSecureRandom): Promise<Uint8Array> => {
    const dataUint8Array: Uint8Array = utf8.fromString(data);
    const secretByteArray = hexToByteArray(secretHex);
    const encryptedData = await encrypt(dataUint8Array, secretByteArray, generateRandom);
    return encryptedData;
};

export const createTextBackupFromString = async (data: string, secretHex: string, generateRandom: (num: number) => Promise<Uint8Array> = generateSecureRandom): Promise<string> => {
    const encryptedData = await createBinaryBackupFromString(data, secretHex, generateRandom);
    const encryptedDataBase64 = base64.encode(encryptedData.buffer);
    const backupText = wrapWithHeaderAndFooter(encryptedDataBase64);
    return backupText;
};

export const restoreBinaryBackupToString = (encryptedBackup: Uint8Array, secretHex: string): string => {
    const secretByteArray = hexToByteArray(secretHex);
    const decryptedData = decrypt(encryptedBackup, secretByteArray);
    const originalText = utf8.toString(decryptedData);
    return originalText;
};

export const restoreTextBackupToString = (backupText: string, secretHex: string): string => {
    const encryptedDataBase64 = stripHeaderAndFooter(backupText);
    const encryptedBytes = new Uint8Array(base64.decode(encryptedDataBase64));
    const originalText = restoreBinaryBackupToString(encryptedBytes, secretHex);
    return originalText;
};
