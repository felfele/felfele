// @ts-ignore
import aesjs from 'aes-js';
// @ts-ignore
import * as base64ab from 'base64-arraybuffer';
import nacl from 'ecma-nacl';

import { output } from './cliHelpers';
import { addCommand } from './cliParser';
import { hexToUint8Array, byteArrayToHex, stringToByteArray } from '../helpers/conversion';
import { generateUnsecureRandomHexString } from '../helpers/unsecureRandom';
import { HexString } from '../helpers/opaqueTypes';
import console = require('console');

const urlSafeBase64Encode = (data: Uint8Array) => {
    const unsafeBase64 = base64ab.encode(data.buffer);
    return unsafeBase64.replace(/\//g, '_');
};

const encryptWithAES = (data: HexString, key: HexString, iv: HexString): HexString => {
    const inputBytes = hexToUint8Array(data);
    const ivBytes = hexToUint8Array(iv);
    const keyBytes = hexToUint8Array(key);

    const aesCtrEncryptor = new aesjs.ModeOfOperation.ctr(keyBytes, ivBytes);
    const encryptedBytes = aesCtrEncryptor.encrypt(inputBytes);

    const encryptedHex = byteArrayToHex(encryptedBytes, false);
    return (iv + encryptedHex) as HexString;
};

const decryptWithAES = (dataWithIV: HexString, key: HexString): HexString => {
    const iv = dataWithIV.slice(0, 32);
    const data = dataWithIV.slice(32);
    const ivBytes = hexToUint8Array(iv);
    const dataBytes = hexToUint8Array(data);
    const keyBytes = hexToUint8Array(key);

    const aesCtrDecryptor = new aesjs.ModeOfOperation.ctr(keyBytes, ivBytes);
    const decryptedBytes = aesCtrDecryptor.decrypt(dataBytes);
    const decryptedHex = byteArrayToHex(decryptedBytes, false);

    return decryptedHex;
};

const deriveKeyFromPassword = (password: string): HexString => {
    const logN = 17;
    const r = 8;
    const p = 2;
    const salt = new Uint8Array(stringToByteArray('felfele'));
    const passwordBytes = new Uint8Array(stringToByteArray(password));
    const key = nacl.scrypt(passwordBytes, salt, logN, r, p, 32, (pDone) => output('derivation progress', pDone));
    return byteArrayToHex(key, false);
};

export const aesTestCommandDefinition =
    addCommand('ctr', 'Test CTR encryption method', async () => {
        const data = 'c0b0c6949e687b3547f2048740ba86651acca488580c385de1291ed072edadf1' as HexString;
        const randomSecret = 'aa3819ed921333cc5207d29474f0a6a01c4b927abab20fe0852873b5641503af' as HexString;
        const key = deriveKeyFromPassword('hello');
        // const wrongKey = deriveKeyFromPassword('hallo');
        const iv = generateUnsecureRandomHexString(16);

        const encryptedHex = encryptWithAES(data + randomSecret as HexString , key, iv);
        output({iv, randomSecret, encryptedHex});

        const encryptedBytes = hexToUint8Array(encryptedHex);
        const base64EncryptedBytes = urlSafeBase64Encode(encryptedBytes);
        output({base64EncryptedBytes});

        const decryptedHex = decryptWithAES(encryptedHex, key);
        output({
            decryptedData: decryptedHex.slice(0, 64),
            decryptedSecret: decryptedHex.slice(64),
        });
    })
;
