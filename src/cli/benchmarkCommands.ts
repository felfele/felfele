import { addCommand } from './cliParser';
import { output } from './cliHelpers';
import { deriveSharedKey } from '../helpers/contactHelpers';

export const benchmarkCommandDefinition =
    addCommand('deriveSharedKey [num]', '', async (optionalNum?: string) => {
        const num = parseInt(optionalNum != null
            ? optionalNum
            : '1'
        , 10);
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
;
