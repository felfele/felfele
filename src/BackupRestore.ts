import { keccak256 } from 'js-sha3';
import nacl from 'ecma-nacl';
import * as base64 from 'base64-arraybuffer';
import { generateSecureRandom } from 'react-native-securerandom';

import { hexToByteArray } from './conversion';
import { Version } from './Version';
import * as utf8 from 'utf8-encoder';

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

export const createBackupFromString = async (data: string, secretHex: string, generateRandom: (num: number) => Promise<Uint8Array> = generateSecureRandom): Promise<string> => {
    const dataUint8Array = utf8.fromString(data);
    const secureRandomUint8Array = await generateRandom(24);
    const secretUint8Array = new Uint8Array(keccak256.array(hexToByteArray(secretHex)));
    const encryptedData = nacl.secret_box.formatWN.pack(dataUint8Array, secureRandomUint8Array, secretUint8Array);
    const encryptedDataBase64 = base64.encode(encryptedData);
    const backupText = wrapWithHeaderAndFooter(encryptedDataBase64);
    return backupText;
};

export const restoreBackupToString = async (backupText: string, secretHex: string): Promise<string> => {
    const encryptedDataBase64 = stripHeaderAndFooter(backupText);
    const secretUint8Array = new Uint8Array(keccak256.array(hexToByteArray(secretHex)));
    const encryptedBytes = new Uint8Array(base64.decode(encryptedDataBase64));
    const decryptedData = nacl.secret_box.formatWN.open(encryptedBytes, secretUint8Array);
    const originalText = utf8.toString(decryptedData);
    return originalText;
};
