import nacl from 'ecma-nacl';

import { addCommand } from './cliParser';
import { output } from './cliHelpers';
import { deriveSharedKey } from '../helpers/contactHelpers';
import * as Swarm from '../swarm/Swarm';
import { stringToUint8Array, hexToUint8Array } from '../helpers/conversion';
import { cryptoHash } from '../helpers/crypto';

const parseNumber = (s: string = '1') => parseInt(s, 10);

export const benchmarkCommandDefinition =
    addCommand('deriveSharedKey [num]', '', async (optionalNum?: string) => {
        const num = parseNumber(optionalNum);
        const testIdentity = {
            privateKey: '0xebe044bec1031e8e2fa494620dce3e50111a9f5336c358dc08d4d785e4c62ead',
            publicKey: '0x029fbcea33cea864a1b6ec940dd6ba5d7b5d38f4cfe4da7cfc4bc6072bfc750e36',
            address: '0x30117e1b4aadfe67956c0b0ce844d1cee202382a',
        };
        const contactIdentity = {
            privateKey: '0x75c5d37dd6b51cc6b69ab1003993ac8a05d2abb94851f4bdabb2cbf8ce391d1e',
            publicKey: '0x036aa0c5e02b03d0eb63629fdd22fa88386ef86ee34fb2fe253d0ec68c0323f5e8',
            address: '0xa62061e671a5aaf1e62197912064c3e0777ed049',
        };
        const startDate = Date.now();
        for (let i = 0; i < num; i++) {
            const sharedSecret = deriveSharedKey(testIdentity, contactIdentity);
        }
        const elapsed = Date.now() - startDate;
        output(`Number of iterations: ${num}, elapsed: ${elapsed} msec, avg: ${elapsed / num} msec`);
    })
    .
    addCommand('generateIdentity [num]', '', async (optionalNum?: string) => {
        const num = parseNumber(optionalNum);
        const randomUint8Array = hexToUint8Array(
            '0xebe044bec1031e8e2fa494620dce3e50111a9f5336c358dc08d4d785e4c62ead'
        );
        const promiseUint8Array = Promise.resolve(randomUint8Array);
        const generateRandom = () => promiseUint8Array;
        const startDate = Date.now();
        for (let i = 0; i < num; i++) {
            await Swarm.generateSecureIdentity(generateRandom);
        }
        const elapsed = Date.now() - startDate;
        output(`Number of iterations: ${num}, elapsed: ${elapsed} msec, avg: ${elapsed / num} msec`);
    })
    .
    addCommand('hash [num] [start]', '', async (numValue: string = '1', startValue: string = '0x0000000000000000000000000000000000000000000000000000000000000000') => {
        const num = parseNumber(numValue);
        let valueBytes = hexToUint8Array(startValue);
        const startDate = Date.now();
        for (let i = 0; i < num; i++) {
            valueBytes = cryptoHash(valueBytes);
        }
        const elapsed = Date.now() - startDate;
        output(`Number of iterations: ${num}, elapsed: ${elapsed} msec, avg: ${elapsed / num} msec`);
    })
    .
    addCommand('encrypt [num] [start]', '', async (numValue: string = '1', startValue: string = '0x0000000000000000000000000000000000000000000000000000000000000000') => {
        const num = parseNumber(numValue);
        let valueBytes = hexToUint8Array(startValue);
        const secretBytes = hexToUint8Array(
            '0xebe044bec1031e8e2fa494620dce3e50111a9f5336c358dc08d4d785e4c62ead'
        );
        const randomBytes = hexToUint8Array(
            '75c5d37dd6b51cc6b69ab1003993ac8a05d2abb94851f4bd'
        );
        const startDate = Date.now();
        const encryptor = nacl.secret_box.formatWN.makeEncryptor(secretBytes, randomBytes);
        for (let i = 0; i < num; i++) {
            const result = encryptor.pack(valueBytes);
            valueBytes = result.slice(24 + 16);
        }
        const elapsed = Date.now() - startDate;
        output(`Number of iterations: ${num}, elapsed: ${elapsed} msec, avg: ${elapsed / num} msec`);
    })
;
