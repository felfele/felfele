import { MutualContact } from '../../src/models/Contact';
import { syncPrivateChannelWithContact, privateChannelAddPost, makeEmptyPrivateChannel } from '../../src/protocols/privateChannel';
import { HexString } from '../../src/helpers/opaqueTypes';
import { makeStorage, makeCrypto } from '../../src/cli/protocolTest/protocolTestHelpers';
import { createAsyncDeterministicRandomGenerator } from '../../src/helpers/unsecureRandom';
import { ImageData } from '../../src/models/ImageData';
import { privateChannelProtocolTests } from '../../src/protocols/privateChannelProtocolTest';
import { makePost } from '../../src/protocols/privateChannelProtocolTestHelpers';

const testContactIdentity = {
    publicKey: '0x04d878f63e880d40ab684797469d38f7006c773a507624e4ec7a0cbf473bd52b4949a65ba56330a07647e0f0a2f7dd1d13cbe05c76206d532888f55fa79c51c41a',
    address: '0x9b125b2e1f900db6f967c7d77de25aff4a2a4317',
};
const testOwnIdentity = {
    privateKey: '0x0424d0337309246a5812446212016534bf77e9229710cc1c888ce9317c23c0ad',
    publicKey: '0x02205b2793180e51af329269f56ded8e575b00968a7aa80b4d4422286b3b353286',
    address: '0x7009930d1c758b972885494ec894d36a0df27072',
};
const testAddress = testOwnIdentity.address as HexString;
const testMutualContact: MutualContact = {
    type: 'mutual-contact',
    name: '',
    image: {},
    identity: testContactIdentity,
    privateChannel: makeEmptyPrivateChannel(),
};

const uploadImage = (image: ImageData): Promise<ImageData> => Promise.resolve(image);

describe('Test private sharing', () => {
    const tests: any = privateChannelProtocolTests;
    for (const privateSharingTest of Object.keys(tests)) {
        test('' + privateSharingTest, async () => {
            await tests[privateSharingTest]();
        });
    }
});

describe('uploadUnsyncedCommands', () => {
});

describe('syncing', () => {
    it('should sync with empty result', async () => {
        const mutualContact = testMutualContact;
        const address = testAddress;
        const storage = await makeStorage(() => Promise.resolve(testOwnIdentity));
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
        const crypto = makeCrypto(testOwnIdentity, generateDeterministicRandom);

        const update = await syncPrivateChannelWithContact(
            mutualContact,
            address,
            storage,
            crypto,
            uploadImage
        );

        expect(update.peerTimeline.length).toBe(0);
        expect(update.syncedLocalTimeline.length).toBe(0);
    });

    it('should sync when has posts', async () => {
        const post = makePost('test');
        const mutualContact = {
            ...testMutualContact,
            privateChannel: privateChannelAddPost(testMutualContact.privateChannel, post),
        };
        const address = testAddress;
        const storage = await makeStorage(() => Promise.resolve(testOwnIdentity));
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
        const crypto = makeCrypto(testOwnIdentity, generateDeterministicRandom);

        const update = await syncPrivateChannelWithContact(
            mutualContact,
            address,
            storage,
            crypto,
            uploadImage
        );

        expect(update.peerTimeline.length).toBe(0);
        expect(update.syncedLocalTimeline.length).toBe(1);
        expect(update.syncedLocalTimeline[0].content.type).toBe('post');
        if (update.syncedLocalTimeline[0].content.type === 'post') {
            expect(update.syncedLocalTimeline[0].content.post).toEqual(post);
        }
    });
});
