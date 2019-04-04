import { encrypt, decrypt } from '../../src/helpers/crypto';
import { stringToByteArray } from '../../src/helpers/conversion';

const stringToUint8Array = (s: string): Uint8Array => new Uint8Array(stringToByteArray(s));

const generateRandom = async (num: number): Promise<Uint8Array> => {
    return stringToUint8Array('e4219722f9eefbdfe9c66ae9');
};

test('Test basic encrypt & decrypt', async () => {
    const input = stringToUint8Array('hello world');
    const secret = stringToUint8Array('6cec0ab9211bc17d5c8c422fa11e2ad4ca4a6b2ea9c830bea436752f8bf241c641a3a684844f3cc39bf6ef4c28f238b73bf2e244a14938d06883830bf414ec4a');
    const encryptedData = await encrypt(input, secret, generateRandom);
    const result = await decrypt(encryptedData, secret);

    expect(result).toEqual(input);
});

test('Test fails with different secrets', async () => {
    const t = async (): Promise<Uint8Array> => {
        const input = stringToUint8Array('hello world');
        const encryptSecret = stringToUint8Array('6cec0ab9211bc17d5c8c422fa11e2ad4ca4a6b2ea9c830bea436752f8bf241c641a3a684844f3cc39bf6ef4c28f238b73bf2e244a14938d06883830bf414ec4a');
        const decryptSecret = stringToUint8Array('ad9eb0192095b728bb8eb959b15245e66a272fd40a86ec0defb3ac34f6b4c4d52c170753bc03657569e562917eae77057eb1313722ff737e4097a3b6ab3af32c');
        const encryptedData = await encrypt(input, encryptSecret, generateRandom);
        const result = await decrypt(encryptedData, decryptSecret);
        return result;
    };

    await expect(t()).rejects.toThrow('Cipher bytes fail verification.');
});
