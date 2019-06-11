// @ts-ignore
import * as base64 from 'base64-arraybuffer';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
// @ts-ignore
import * as utf8 from 'utf8-encoder';

import { hexToByteArray, stringToByteArray, byteArrayToHex, isHexString } from '@felfele/felfele-core';
import { Version } from '../Version';
import { encrypt, decrypt, ENCRYPTED_HEX_HEADER_LENGTH } from '../helpers/crypto';
import { Debug, BzzApi } from '@felfele/felfele-core';
import { HexString } from '@felfele/felfele-core';

const CONTENT_HASH_OFFSET = 0;
const CONTENT_HASH_LENGTH = 64;
const SECRET_OFFSET = 64;
const SECRET_LENGTH = 64;
const BACKUP_DATA_LENGTH = CONTENT_HASH_LENGTH + SECRET_LENGTH;

const ENCRYPTED_BACKUP_LINK_DATA_LENGHT = ENCRYPTED_HEX_HEADER_LENGTH + BACKUP_DATA_LENGTH;

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

export const backupToSwarm = async (bzz: BzzApi, data: string, secretHex: HexString): Promise<HexString> => {
    Debug.log('backupToSwarm', 'secretHex', secretHex);
    const encryptedBackup = await createBinaryBackupFromString(data, secretHex);
    const contentHash = await bzz.uploadUint8Array(encryptedBackup) as HexString;
    Debug.log('backupToSwarm', 'contentHash', contentHash);
    return contentHash;
};

export const encryptBackupLinkData = async (contentHash: HexString, randomSecret: HexString, backupPassword: string): Promise<HexString> => {
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

export const isValidBackupLinkData = (s: string): boolean => {
    if (s.length !== ENCRYPTED_BACKUP_LINK_DATA_LENGHT) {
        return false;
    }
    return isHexString(s);
};

export const downloadBackupFromSwarm = async (bzz: BzzApi, backupLinkData: HexString, backupPassword: string): Promise<string> => {
    const backupPasswordByteArray = stringToByteArray(backupPassword);
    const backupDataUint8Array = new Uint8Array(hexToByteArray(backupLinkData));
    const decryptedBackupData = decrypt(backupDataUint8Array, backupPasswordByteArray);
    const backupData = byteArrayToHex(decryptedBackupData, false);

    Debug.log('downloadBackupFromSwarm', 'backupData', backupData);

    const contentHash = backupData.slice(CONTENT_HASH_OFFSET, SECRET_OFFSET) as HexString;
    const secret = backupData.slice(SECRET_OFFSET) as HexString;
    const encryptedBackup = await bzz.downloadUint8Array(contentHash, 0);
    const backupString = restoreBinaryBackupToString(encryptedBackup, secret);

    return backupString;
};
