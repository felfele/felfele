// @ts-ignore
import * as base64 from 'base64-arraybuffer';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
// @ts-ignore
import * as utf8 from 'utf8-encoder';

import { hexToByteArray, stringToByteArray, byteArrayToHex } from '../helpers/conversion';
import { Version } from '../Version';
import { encrypt, decrypt } from '../helpers/crypto';
import * as Swarm from '../swarm/Swarm';
import { Debug } from '../Debug';
import { HexString } from './opaqueTypes';

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

export const backupToSwarm = async (bzz: Swarm.BzzApi, data: string, secretHex: HexString): Promise<HexString> => {
    Debug.log('backupToSwarm', 'secretHex', secretHex);
    const encryptedBackup = await createBinaryBackupFromString(data, secretHex);
    const contentHash = await bzz.uploadUint8Array(encryptedBackup) as HexString;
    Debug.log('backupToSwarm', 'contentHash', contentHash);
    return contentHash;
};

export const generateBackupLinkData = async (contentHash: HexString, randomSecret: HexString, backupPassword: string): Promise<HexString> => {
    const backupData = `${contentHash}${randomSecret}` as HexString;
    const plainData = new Uint8Array(hexToByteArray(backupData));
    const backupPasswordByteArray = stringToByteArray(backupPassword);
    const encryptedBackupData = await encrypt(plainData, backupPasswordByteArray);
    const encryptedHexBackup = byteArrayToHex(encryptedBackupData, false);
    return encryptedHexBackup;
};

export const generateBackupRandomSecret = async (
    generateRandom: (num: number) => Promise<Uint8Array> = generateSecureRandom,
): Promise<HexString> => {
    const randomSecretBytes = await generateRandom(32);
    const randomSecret = byteArrayToHex(randomSecretBytes, false);
    return randomSecret;
};
