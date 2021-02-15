import { addCommand } from './cliParser';
import { generateUnsecureRandom, createAsyncDeterministicRandomGenerator } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { byteArrayToHex, stripHexPrefix, hexToUint8Array, stringToUint8Array, Uint8ArrayToString } from '../helpers/conversion';
import { Debug } from '../Debug';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import * as SwarmHelpers from '../swarm/Swarm';
import { swarmConfig } from './swarmConfig';
import { createInvitedContact, createCodeReceivedContact, advanceContactState, deriveSharedKey } from '../helpers/contactHelpers';
import { HexString } from '../helpers/opaqueTypes';
import { SECOND } from '../DateUtils';
import { aliceReadsBobsEncryptedPublicKey, createBobForContact, aliceGeneratesQRCode, bobSharesContactPublicKeyAndContactFeed, aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey, bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey, createAliceForContact } from './protocolTest/inviteProtocol';
import { MemoryStorageFeeds } from './protocolTest/MemoryStorage';
import { ProtocolStorage } from '../protocols/ProtocolStorage';
import {
    throwError,
    randomNumbers,
    createRandomGenerator,
    PublicKey,
    publicKeyToAddress,
    makeNaclEncryption,
    makeStorage,
    Encryption,
    Crypto,
} from './protocolTest/protocolTestHelpers';
import { PrivateProfile, PublicProfile } from '../models/Profile';
import { GroupCommand, GroupCommandPost, GroupCommandAddMember } from '../protocols/group';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import { serialize, deserialize } from '../social/serialization';
import { Timeline, PartialChapter, ChapterReference, Chapter, uploadTimeline, highestSeenLogicalTime, highestSeenRemoteLogicalTime } from '../protocols/timeline';
import { calculatePrivateTopic, makeEmptyPrivateChannel, privateChannelAddPost, applyPrivateChannelUpdate, syncPrivateChannelWithContact } from '../protocols/privateChannel';
import { privateChannelProtocolTests } from '../protocols/privateChannelProtocolTest';
import fs from 'fs';
import { makePost, PrivateChannelContext, listTimelinePosts } from '../protocols/privateChannelProtocolTestHelpers';
import { cryptoHash } from '../helpers/crypto';
import { MutualContact } from '../models/Contact';

export const protocolTestCommandDefinition =
    addCommand('invite', 'Test invite protocol', async () => {
        const nextRandom = createRandomGenerator(randomNumbers);
        const swarmFeeds = new MemoryStorageFeeds();
        const alice = createAliceForContact(nextRandom);
        Debug.log('Alice publicKey', alice.ownKeyPair.getPublic('hex'));
        const bob = createBobForContact(nextRandom);
        Debug.log('Bob publicKey', bob.ownKeyPair.getPublic('hex'));

        const qrCode = aliceGeneratesQRCode(alice);
        Debug.log('\n<-- QR code read', qrCode);
        await bobSharesContactPublicKeyAndContactFeed(bob, qrCode, swarmFeeds);
        await aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey(alice, swarmFeeds);
        await bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey(bob, swarmFeeds);
        await aliceReadsBobsEncryptedPublicKey(alice, swarmFeeds);

        if (alice.bobPublicKey !== bob.ownKeyPair.getPublic('hex') ||
            bob.alicePublicKey !== alice.ownKeyPair.getPublic('hex')) {
                throwError('public keys are not matching');
        }
    })
    .
    addCommand('random', 'Generate 10 random strings', async () => {
        for (let i = 0; i < 10; i++) {
            const random = await generateUnsecureRandom(32);
            output(byteArrayToHex(random, false));
        }
    })
    .
    addCommand('swarmInvite [randomSeed]', 'Test invite protocol on Swarm', async (randomSeed?: string) => {
        randomSeed = randomSeed ? randomSeed : randomNumbers[0];
        const generateDeterministicRandom = createAsyncDeterministicRandomGenerator(randomSeed);
        const aliceIdentity = await SwarmHelpers.generateSecureIdentity(generateDeterministicRandom);
        const aliceProfile = {
            name: 'Alice',
            image: {},
            identity: aliceIdentity,
        };
        const aliceContactHelper = await createSwarmContactHelper(aliceProfile, swarmConfig.gatewayAddress, generateDeterministicRandom);
        const bobIdentity = await SwarmHelpers.generateSecureIdentity(generateDeterministicRandom);
        const bobProfile = {
            name: 'Bob',
            image: {},
            identity: bobIdentity,
        };
        const bobContactHelper = await createSwarmContactHelper(bobProfile, swarmConfig.gatewayAddress, generateDeterministicRandom);
        const createdAt = Date.now();
        const aliceInvitedContact = await createInvitedContact(aliceContactHelper, createdAt);
        const bobCodeReceivedContact = await createCodeReceivedContact(
            aliceInvitedContact.randomSeed,
            aliceInvitedContact.contactIdentity.publicKey as HexString,
            bobContactHelper
        );

        output({aliceInvitedContact, bobCodeReceivedContact});

        const timeout = 30 * SECOND;
        const [aliceContact, bobContact] = await Promise.all([
            advanceContactState(aliceInvitedContact, aliceContactHelper, timeout),
            advanceContactState(bobCodeReceivedContact, bobContactHelper, timeout),
        ]);

        output({aliceContact, bobContact});
    })
    .
    addCommand('privateSharing', 'Test 1on1 private messaging',
        addCommand('test [name]', 'Run tests', async (name?: string) => {
            const allTests: any = privateChannelProtocolTests;
            for (const test of Object.keys(allTests)) {
                if (typeof name === 'string' && !test.startsWith(name)) {
                    continue;
                }
                output('Running test:', test);
                await allTests[test]();
                if (Debug.isDebugMode) {
                    output('Finished test:', test, '\n\n');
                }
            }
        })
        .
        addCommand('post <identity-file> <contact-identity-file> <markdown>', 'Post private message', async (identityFile: string, contactIdentityFile: string, markdown: string) => {
            const loadIdentityFile = (filename: string) => {
                const data = fs.readFileSync(filename).toString();
                return JSON.parse(data) as PrivateIdentity;
            };
            const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
            const identity = loadIdentityFile(identityFile);
            const contactIdentity = loadIdentityFile(contactIdentityFile);
            const privateChannel = makeEmptyPrivateChannel();
            const contact: MutualContact = {
                type: 'mutual-contact',
                name: 'test',
                image: {},
                identity,
                privateChannel,
            };
            const storage = await makeStorage(() => Promise.resolve(identity));
            const signDigest = (digest: number[]) => SwarmHelpers.signDigest(digest, identity);
            const crypto: Crypto = {
                ...makeNaclEncryption(),
                signDigest,
                deriveSharedKey: (publicKey: HexString) => deriveSharedKey(identity, {publicKey, address: ''}),
                random: (length: number) => generateDeterministicRandom(length),
            };
            const sharedSecret = deriveSharedKey(identity, contactIdentity);
            const topic = calculatePrivateTopic(sharedSecret);
            const post = {
                ...makePost(markdown),
                topic,
            };
            const syncDataWithPost = await privateChannelAddPost(privateChannel, post);
            const update = await syncPrivateChannelWithContact(
                {
                    ...contact,
                    privateChannel: syncDataWithPost,
                },
                identity.address as HexString,
                storage,
                crypto,
                (image) => Promise.resolve(image),
            );
        })
        .
        addCommand('list <identity-file> <contact-identity-file>', 'List shared posts', async (identityFile: string, contactIdentityFile: string) => {
            const loadIdentityFile = (filename: string) => {
                const data = fs.readFileSync(filename).toString();
                return JSON.parse(data) as PrivateIdentity;
            };
            const generateDeterministicRandom = createAsyncDeterministicRandomGenerator();
            const identity = loadIdentityFile(identityFile);
            const contactIdentity = loadIdentityFile(contactIdentityFile);
            const profile: PrivateProfile = {
                name: 'test',
                image: {},
                identity,
            };
            const storage = await makeStorage(() => Promise.resolve(identity));
            const signDigest = (digest: number[]) => SwarmHelpers.signDigest(digest, identity);
            const crypto: Crypto = {
                ...makeNaclEncryption(),
                signDigest,
                deriveSharedKey: (publicKey: HexString) => deriveSharedKey(identity, {publicKey, address: ''}),
                random: (length: number) => generateDeterministicRandom(length),
            };
            const privateChannel = makeEmptyPrivateChannel();
            const contact: MutualContact = {
                type: 'mutual-contact',
                name: 'test',
                image: {},
                identity,
                privateChannel,
            };
            const update = await syncPrivateChannelWithContact(
                contact,
                identity.address as HexString,
                storage,
                crypto,
                (image) => Promise.resolve(image),
            );
            const posts = listTimelinePosts(update.peerTimeline);
            output(posts);
        })

    )
;
