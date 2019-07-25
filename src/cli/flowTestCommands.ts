import { addCommand } from './cliParser';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { byteArrayToHex, hexToByteArray, stripHexPrefix, hexToUint8Array } from '../helpers/conversion';
import { Debug } from '../Debug';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import * as Swarm from '../swarm/Swarm';
import { swarmConfig } from './swarmConfig';
import { createInvitedContact, createCodeReceivedContact, advanceContactState, deriveSharedKey } from '../helpers/contactHelpers';
import { HexString } from '../helpers/opaqueTypes';
import { SECOND } from '../DateUtils';
import { aliceReadsBobsEncryptedPublicKey, createBobForContact, aliceGeneratesQRCode, bobSharesContactPublicKeyAndContactFeed, aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey, bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey, createAliceForContact } from './flowTest/inviteFlow';
import { SwarmFeeds } from './flowTest/SwarmFeeds';
import { throwError, createDeterministicRandomGenerator, randomNumbers, createRandomGenerator, privateKeyFromPrivateIdentity, publicKeyFromPublicIdentity } from './flowTest/flowTestHelpers';
import { PrivateProfile } from '../models/Profile';
import { GroupCommand, GroupCommandPost, keyDerivationFunction, GroupCommandAdd } from '../helpers/groupHelpers';

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
    addCommand('privateGroup', 'Test 1on1 private messaging', async (randomSeed?) => {
        randomSeed = randomSeed ? randomSeed : randomNumbers[0];
        const nextRandom = createDeterministicRandomGenerator(randomSeed);
        const generateDeterministicRandom = async (length: number) => {
            const randomString = nextRandom();
            const randomBytes = new Uint8Array(hexToByteArray(randomString)).slice(0, length);
            return randomBytes;
        };
        const generateIdentity = () => Swarm.generateSecureIdentity(generateDeterministicRandom);
        const generateRandomSecret = () => generateDeterministicRandom(32);

        interface Group {
            name?: string;
            sharedSecret: HexString;
            participants: HexString[];
        }

        interface ProfileWithState extends PrivateProfile {
            commands: GroupCommand[];
            group: Group;
        }

        interface InviteToGroupCommand {
            type: 'invite-to-group';
            group: Group;
        }

        const aliceProfile: ProfileWithState = {
            name: 'Alice',
            image: {},
            identity: await generateIdentity(),
            commands: [],
            group: {
                sharedSecret: '' as HexString,
                participants: [],
            },
        };
        const bobProfile = {
            name: 'Bob',
            image: {},
            identity: await generateIdentity(),
            commands: [],
            group: {
                sharedSecret: '' as HexString,
                participants: [],
            },
        };

        const calculateTopic = (secret: HexString, participants: HexString[]): HexString => {
            const secretWithoutPrefix = stripHexPrefix(secret);
            const participantList = participants
                .map(p => stripHexPrefix(p))
                .sort((a, b) => b.localeCompare(a))
                .join('')
            ;
            const bytes = hexToUint8Array(secretWithoutPrefix + participantList);
            const topicBytes = keyDerivationFunction([bytes]);
            return byteArrayToHex(topicBytes);
        };

        interface GroupFlowState extends Group {
            profiles: ProfileWithState[];
        }

        const swarmFeeds = new SwarmFeeds();

        const highestSeenTimestamp = (state: GroupFlowState) => {
            const allCommands = state.profiles.map(profile => profile.commands);
            return allCommands.reduce((prev, curr) => curr.length > 0 && curr[0].timestamp > prev
                ? curr[0].timestamp
                : prev
            , 0);
        };
        const sendGroupCommand = async (state: GroupFlowState, senderIndex: number, groupCommand: GroupCommand): Promise<GroupFlowState> => {
            const sender = state.profiles[senderIndex];
            const topic = calculateTopic(state.sharedSecret, state.participants);
            swarmFeeds.write(privateKeyFromPrivateIdentity(sender.identity), topic, groupCommand);
            const updatedSender = {
                ...sender,
                commands: [groupCommand, ...sender.commands],
            };
            return {
                ...state,
                profiles: [...state.profiles.slice(0, senderIndex), updatedSender, ...state.profiles.slice(senderIndex + 1)],
            };
        };
        const sendGroupMessage = async (state: GroupFlowState, senderIndex: number, message: string): Promise<GroupFlowState> => {
            const command: GroupCommandPost = {
                type: 'group-command-message',
                timestamp: highestSeenTimestamp(state) + 1,

                post: {
                    images: [],
                    text: message,
                    createdAt: Date.now(),
                },
            };
            return sendGroupCommand(state, senderIndex, command);
        };
        const createGroupAndInvite = async (state: GroupFlowState, creatorIndex: number, invitedIndex: number): Promise<GroupFlowState> => {
            if (creatorIndex === invitedIndex) {
                throwError('creatorIndex cannot be equal to invitedIndex');
            }
            const creator = state.profiles[creatorIndex];
            const invited = state.profiles[invitedIndex];

            const addCreatorCommand: GroupCommandAdd = {
                type: 'group-command-add',
                timestamp: highestSeenTimestamp(state) + 1,

                identity: creator.identity,
                name: creator.name,
            };
            const groupStateWithCreator = await sendGroupCommand(state, creatorIndex, addCreatorCommand);

            const addInvitedCommand: GroupCommandAdd = {
                type: 'group-command-add',
                timestamp: highestSeenTimestamp(groupStateWithCreator) + 1,

                identity: invited.identity,
                name: invited.name,
            };
            const groupStateWithInvited = await sendGroupCommand(groupStateWithCreator, creatorIndex, addInvitedCommand);

            return groupStateWithInvited;
        };

        const inputState = {
            sharedSecret: '' as HexString,
            participants: [],
            profiles: [aliceProfile, bobProfile],
        };

        const compose = (functions: ((state: GroupFlowState) => Promise<GroupFlowState>)[]) => {
            return async (initialState: GroupFlowState) => {
                let returnState = initialState;
                for (const f of functions) {
                    returnState = await f(returnState);
                }
                return returnState;
            };
        };

        const outputState = await compose([
            (state) => createGroupAndInvite(state, 0, 1),
            (state) => sendGroupMessage(state, 0, 'hello Bob'),
            (state) => sendGroupMessage(state, 1, 'hello Alice'),
            (state) => sendGroupMessage(state, 0, 'test'),
        ])(inputState);

        output(outputState);
    })
;
/*

Group
- participants list
- on participant remove -> new key? / later
- flow:
    1. Alice creates group
        participantList = PublicKey(Alice)
        groupSharedSecret = Random()
        groupTopic = KDF(groupSharedSecret || participantList)
    2. Alice invites Bob
        aliceBobSharedSecret = ECDH(Alice, Bob)
        topic = KDF(aliceBobSharedSecret)
        postType = inviteToGroup(groupSharedSecret, groupTopic)
    3. Alice posts in the group
        participantList = SortByPublicKey(PublicKey(Alice), PublicKey(Bob))
        topic = KDF(groupSharedSecret || participantList)
        encryptedPost = Encrypt(groupSharedSecret, post)
        share(topic, Encrypt(groupSharedSecret, Hash(encryptedPost)))
*/
