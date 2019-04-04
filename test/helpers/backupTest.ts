import { createTextBackupFromString, restoreTextBackupToString } from '../../src/helpers/backup';
import { stringToByteArray } from '../../src/helpers/conversion';

const generateRandom = async (num: number): Promise<Uint8Array> => {
    return new Uint8Array(stringToByteArray('e4219722f9eefbdfe9c66ae9'));
};

test('Test basic backup & restore', async () => {
    const input = 'hello world';
    const secretHex = '0x6cec0ab9211bc17d5c8c422fa11e2ad4ca4a6b2ea9c830bea436752f8bf241c641a3a684844f3cc39bf6ef4c28f238b73bf2e244a14938d06883830bf414ec4a';
    const backupText = await createTextBackupFromString(input, secretHex, generateRandom);
    const result = await restoreTextBackupToString(backupText, secretHex);

    expect(result).toBe(input);
});

test('Test fails with different secrets', async () => {
    const t = async (): Promise<string> => {
        const input = 'hello world';
        const encryptSecretHex = '0x6cec0ab9211bc17d5c8c422fa11e2ad4ca4a6b2ea9c830bea436752f8bf241c641a3a684844f3cc39bf6ef4c28f238b73bf2e244a14938d06883830bf414ec4a';
        const decryptSecretHex = '0xad9eb0192095b728bb8eb959b15245e66a272fd40a86ec0defb3ac34f6b4c4d52c170753bc03657569e562917eae77057eb1313722ff737e4097a3b6ab3af32c';
        const backupText = await createTextBackupFromString(input, encryptSecretHex, generateRandom);
        const result = await restoreTextBackupToString(backupText, decryptSecretHex);
        return result;
    };

    await expect(t()).rejects.toThrow('Cipher bytes fail verification.');
});
