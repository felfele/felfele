import { uploadTimeline, Timeline, PartialChapter, makePartialChapter, Chapter, getNewestChapterId } from '../../src/protocols/timeline';
import { makeStorage, makeCrypto } from '../../src/cli/protocolTest/protocolTestHelpers';
import { createAsyncDeterministicRandomGenerator } from '../../src/helpers/unsecureRandom';
import { stringToUint8Array } from '../../src/helpers/conversion';
import { HexString } from '../../src/helpers/opaqueTypes';

const testOwnIdentity = {
    privateKey: '0x0424d0337309246a5812446212016534bf77e9229710cc1c888ce9317c23c0ad',
    publicKey: '0x02205b2793180e51af329269f56ded8e575b00968a7aa80b4d4422286b3b353286',
    address: '0x7009930d1c758b972885494ec894d36a0df27072',
};

describe('uploadTimeline', () => {
    it('should do nothing when timeline is empty', async () => {
        const emptyTimeline: Timeline<PartialChapter<number>> = [];
        const address = testOwnIdentity.address as HexString;
        const topic = '0xd539306144f12f2af003f89ef72da7a46cd0c6d3c99705afa539498ff6c8da39' as HexString;
        const storage = await makeStorage(() => Promise.resolve(testOwnIdentity));
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
        const crypto = makeCrypto(testOwnIdentity, generateDeterministicRandom);

        const result = await uploadTimeline(
            emptyTimeline,
            storage,
            address,
            topic,
            (c) => Promise.resolve(stringToUint8Array(JSON.stringify(c))),
            crypto.signDigest,
            undefined,
        );

        expect(result.length).toBe(0);
    });

    it('should add value to timeline', async () => {
        const address = testOwnIdentity.address as HexString;
        const value = 1;
        const timeline = [makePartialChapter(address, value)];
        const topic = '0xd539306144f12f2af003f89ef72da7a46cd0c6d3c99705afa539498ff6c8da39' as HexString;
        const storage = await makeStorage(() => Promise.resolve(testOwnIdentity));
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
        const crypto = makeCrypto(testOwnIdentity, generateDeterministicRandom);

        const result = await uploadTimeline(
            timeline,
            storage,
            address,
            topic,
            (c) => Promise.resolve(stringToUint8Array(JSON.stringify(c))),
            crypto.signDigest,
            undefined,
        );

        expect(result.length).toBe(1);
        expect(result[0].previous).toBeUndefined();
        expect(result[0].content).toBe(value);
        expect((result[0] as Chapter<number>).id).toBeDefined();
    });

    it('should add two values to timeline', async () => {
        const address = testOwnIdentity.address as HexString;
        const values = [1, 2];
        const timeline = values.map(value => makePartialChapter(address, value));
        const topic = '0xd539306144f12f2af003f89ef72da7a46cd0c6d3c99705afa539498ff6c8da39' as HexString;
        const storage = await makeStorage(() => Promise.resolve(testOwnIdentity));
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
        const crypto = makeCrypto(testOwnIdentity, generateDeterministicRandom);

        const result = await uploadTimeline(
            timeline,
            storage,
            address,
            topic,
            (c) => Promise.resolve(stringToUint8Array(JSON.stringify(c))),
            crypto.signDigest,
            undefined,
        );

        expect(result.length).toBe(2);
        expect(result[0].content).toBe(values[0]);
        expect(result[1].content).toBe(values[1]);
        expect(result[0].previous).toBe((result[1] as Chapter<number>).id);
        expect(result[1].previous).toBeUndefined();
        expect((result[0] as Chapter<number>).id).toBeDefined();
        expect((result[1] as Chapter<number>).id).toBeDefined();
    });

    it('should add two values to timeline when invoked twice', async () => {
        const address = testOwnIdentity.address as HexString;
        const values = [1, 2];
        const timeline1 = [makePartialChapter(address, values[1])];
        const topic = '0xd539306144f12f2af003f89ef72da7a46cd0c6d3c99705afa539498ff6c8da39' as HexString;
        const storage = await makeStorage(() => Promise.resolve(testOwnIdentity));
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
        const crypto = makeCrypto(testOwnIdentity, generateDeterministicRandom);

        const uploadedTimeline1 = await uploadTimeline(
            timeline1,
            storage,
            address,
            topic,
            (c) => Promise.resolve(stringToUint8Array(JSON.stringify(c))),
            crypto.signDigest,
            undefined,
        );

        const previous = getNewestChapterId(uploadedTimeline1);
        const timeline2 = [makePartialChapter(address, values[0]), ...uploadedTimeline1];
        const result = await uploadTimeline(
            timeline2,
            storage,
            address,
            topic,
            (c) => Promise.resolve(stringToUint8Array(JSON.stringify(c))),
            crypto.signDigest,
            previous,
        );

        expect(result.length).toBe(2);
        expect(result[0].content).toBe(values[0]);
        expect(result[1].content).toBe(values[1]);
        expect(result[0].previous).toBe((result[1] as Chapter<number>).id);
        expect(result[1].previous).toBeUndefined();
        expect((result[0] as Chapter<number>).id).toBeDefined();
        expect((result[1] as Chapter<number>).id).toBeDefined();
    });
});
