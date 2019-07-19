import { addCommand } from './cliParser';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { byteArrayToHex, hexToByteArray } from '../helpers/conversion';
import { Debug } from '../Debug';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import * as Swarm from '../swarm/Swarm';
import { swarmConfig } from './swarmConfig';
import { createInvitedContact, createCodeReceivedContact, advanceContactState } from '../helpers/contactHelpers';
import { HexString } from '../helpers/opaqueTypes';
import { SECOND } from '../DateUtils';
import { aliceReadsBobsEncryptedPublicKey, createBobForContact, aliceGeneratesQRCode, bobSharesContactPublicKeyAndContactFeed, aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey, bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey, createAliceForContact } from './flowTest/inviteFlow';
import { SwarmFeeds } from './flowTest/SwarmFeeds';
import { throwError, createDeterministicRandomGenerator, randomNumbers, createRandomGenerator } from './flowTest/flowTestHelpers';

export const flowTestCommandDefinition =
    addCommand('invite', 'Test invite process', async () => {
        const nextRandom = createRandomGenerator(randomNumbers);
        const swarmFeeds = new SwarmFeeds();
        const alice = createAliceForContact(nextRandom);
        Debug.log('Alice publicKey', alice.ownKeyPair.getPublic('hex'));
        const bob = createBobForContact(nextRandom);
        Debug.log('Bob publicKey', bob.ownKeyPair.getPublic('hex'));

        const qrCode = aliceGeneratesQRCode(alice);
        Debug.log('\n<-- QR code read', qrCode);
        bobSharesContactPublicKeyAndContactFeed(bob, qrCode, swarmFeeds);
        aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey(alice, swarmFeeds);
        bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey(bob, swarmFeeds);
        aliceReadsBobsEncryptedPublicKey(alice, swarmFeeds);

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
    addCommand('swarmInvite [randomSeed]', 'Test invite flow on Swarm', async (randomSeed?: string) => {
        randomSeed = randomSeed ? randomSeed : randomNumbers[0];
        const nextRandom = createDeterministicRandomGenerator(randomSeed);
        const generateDeterministicRandom = async (length: number) => {
            const randomString = nextRandom();
            Debug.log('generateDeterministicRandom', {randomString});
            const randomBytes = new Uint8Array(hexToByteArray(randomString)).slice(0, length);
            return randomBytes;
        };
        const aliceIdentity = await Swarm.generateSecureIdentity(generateDeterministicRandom);
        const aliceProfile = {
            name: 'Alice',
            image: {},
            identity: aliceIdentity,
        };
        const aliceContactHelper = await createSwarmContactHelper(aliceProfile, swarmConfig.gatewayAddress, generateDeterministicRandom);
        const bobIdentity = await Swarm.generateSecureIdentity(generateDeterministicRandom);
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
    addCommand('privateMessaging', 'Test 1on1 private messaging', async () => {

    })
;
