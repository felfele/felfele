import { addCommand } from './cliParser';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { byteArrayToHex, hexToByteArray, stripHexPrefix, hexToUint8Array } from '../helpers/conversion';
import { Debug } from '../Debug';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import * as SwarmHelpers from '../swarm/Swarm';
import { swarmConfig } from './swarmConfig';
import { createInvitedContact, createCodeReceivedContact, advanceContactState, deriveSharedKey } from '../helpers/contactHelpers';
import { HexString } from '../helpers/opaqueTypes';
import { SECOND } from '../DateUtils';
import { aliceReadsBobsEncryptedPublicKey, createBobForContact, aliceGeneratesQRCode, bobSharesContactPublicKeyAndContactFeed, aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey, bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey, createAliceForContact } from './flowTest/inviteFlow';
import { SwarmFeeds, Swarm } from './flowTest/SwarmFeeds';
import { throwError, createDeterministicRandomGenerator, randomNumbers, createRandomGenerator, privateKeyFromPrivateIdentity, publicKeyFromPublicIdentity } from './flowTest/flowTestHelpers';
import { PrivateProfile } from '../models/Profile';
import { GroupCommand, GroupCommandPost, keyDerivationFunction, GroupCommandAdd, GroupCommandWithSource } from '../helpers/groupHelpers';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import { serialize, deserialize } from '../social/serialization';

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
    addCommand('privateGroup', 'Test 1on1 private messaging', async (randomSeed?) => {
        randomSeed = randomSeed ? randomSeed : randomNumbers[0];
        const nextRandom = createDeterministicRandomGenerator(randomSeed);
        const generateDeterministicRandom = async (length: number) => {
            const randomString = nextRandom();
            const randomBytes = new Uint8Array(hexToByteArray(randomString)).slice(0, length);
            return randomBytes;
        };
        const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateDeterministicRandom);
        const generateRandomSecret = () => generateDeterministicRandom(32);

        interface Group {
            name?: string;
            sharedSecret: HexString;
            participants: HexString[];
        }

        interface ProfileWithState extends PrivateProfile {
            ownCommands: GroupCommand[];
            remoteCommands: GroupCommand[];
            highestSeenTimestamp: number;
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
            ownCommands: [],
            remoteCommands: [],
            highestSeenTimestamp: 0,
            group: {
                sharedSecret: 'secret' as HexString,
                participants: [],
            },
        };
        const bobProfile: ProfileWithState = {
            name: 'Bob',
            image: {},
            identity: await generateIdentity(),
            ownCommands: [],
            remoteCommands: [],
            highestSeenTimestamp: 0,
            group: {
                sharedSecret: '' as HexString,
                participants: [],
            },
        };
        const carolProfile: ProfileWithState = {
            name: 'Carol',
            image: {},
            identity: await generateIdentity(),
            ownCommands: [],
            remoteCommands: [],
            highestSeenTimestamp: 0,
            group: {
                sharedSecret: '' as HexString,
                participants: [],
            },
        };

        const calculateGroupTopic = (group: Group): HexString => {
            const secretWithoutPrefix = stripHexPrefix(group.sharedSecret);
            const bytes = hexToUint8Array(secretWithoutPrefix);
            const topicBytes = keyDerivationFunction([bytes]);
            return byteArrayToHex(topicBytes);
        };

        interface GroupFlowState {
            profiles: ProfileWithState[];
        }

        type PartialChapter<T> = {
            protocol: 'timeline',
            version: 1,
            timestamp: number,
            author: string,
            type: string,
            content: T,
            previous?: string,
            references?: Array<string>,
            signature?: string,
        };

        type Chapter<T> = PartialChapter<T> & { id: string };

        const swarm = new Swarm();

        const groupHighestSeenTimestamp = (state: GroupFlowState) => {
            const allCommands = state.profiles.map(profile => profile.ownCommands);
            return allCommands.reduce((prev, curr) => curr.length > 0 && curr[0].timestamp > prev
                ? curr[0].timestamp
                : prev
            , 0);
        };
        const highestSeenTimestamp = (commands: GroupCommand[]) => {
            return commands.reduce((prev, curr) => curr.timestamp > prev
                ? curr.timestamp
                : prev
            , 0);
        };
        const readPrivateSharedFeed = async (ownerIdentity: PrivateIdentity, recipientIdentity: PublicIdentity) => {
            const topic = deriveSharedKey(ownerIdentity, recipientIdentity);
            const hash = swarm.feeds.read(publicKeyFromPublicIdentity(ownerIdentity), topic);
            if (hash == null) {
                return undefined;
            }
            const data = swarm.read(hash);
            if (data == null) {
                return undefined;
            }
            const chapter = deserialize(data) as PartialChapter<string>;
            return chapter.content;
        };
        const readTimeline = async <T>(ownerIdentity: PublicIdentity, topic: HexString): Promise<PartialChapter<T>[]> => {
            let hash = swarm.feeds.read(publicKeyFromPublicIdentity(ownerIdentity), topic);
            if (hash == null) {
                return [];
            }
            const chapters: any[] = [];
            while (true) {
                const data = swarm.read(hash);
                if (data == null) {
                    return chapters;
                }
                const chapter = deserialize(data) as PartialChapter<string>;
                chapters.push(chapter);
                if (chapter.previous == null) {
                    return chapters;
                }
                hash = chapter.previous;
            }
        };
        const updatePrivateSharedFeed = (ownerIdentity: PrivateIdentity, recipientIdentity: PublicIdentity, data: string) => {
            const topic = deriveSharedKey(ownerIdentity, recipientIdentity);
            return updateTimeline(ownerIdentity, topic, data);
        };
        const updateTimeline = (ownerIdentity: PrivateIdentity, topic: HexString, data: string) => {
            const previous = swarm.feeds.read(publicKeyFromPublicIdentity(ownerIdentity), topic);
            const chapter: PartialChapter<string> = {
                protocol: 'timeline',
                version: 1,
                timestamp: Date.now(),
                author: ownerIdentity.address,
                type: 'text/plain',
                content: data,
                previous,
            };
            const hash = swarm.write(serialize(chapter));
            return swarm.feeds.write(privateKeyFromPrivateIdentity(ownerIdentity), topic, hash);
        };
        const sendGroupCommand = (state: GroupFlowState, senderIndex: number, groupCommand: GroupCommand): GroupFlowState => {
            const sender = state.profiles[senderIndex];
            const topic = calculateGroupTopic(sender.group);
            updateTimeline(sender.identity, topic, serialize(groupCommand));
            const updatedSender = {
                ...sender,
                ownCommands: [groupCommand, ...sender.ownCommands],
            };
            return {
                ...state,
                profiles: [...state.profiles.slice(0, senderIndex), updatedSender, ...state.profiles.slice(senderIndex + 1)],
            };
        };
        const sendGroupMessage = async (state: GroupFlowState, senderIndex: number, message: string): Promise<GroupFlowState> => {
            const command: GroupCommandPost = {
                type: 'group-command-post',
                timestamp: groupHighestSeenTimestamp(state) + 1,

                post: {
                    images: [],
                    text: message,
                    createdAt: Date.now(),
                },
            };
            return sendGroupCommand(state, senderIndex, command);
        };
        const addToGroup = (state: GroupFlowState, senderIndex: number, invitedIndex: number): GroupFlowState => {
            const sender = state.profiles[senderIndex];
            const invited = state.profiles[invitedIndex];

            const updatedSender = {
                ...sender,
                group: {
                    ...sender.group,
                    participants: [...sender.group.participants, invited.identity.publicKey as HexString],
                },
            };
            return {
                ...state,
                profiles: [...state.profiles.slice(0, senderIndex), updatedSender, ...state.profiles.slice(senderIndex + 1)],
            };
        };
        const addToGroupAndSendCommand = (state: GroupFlowState, senderIndex: number, invitedIndex: number): GroupFlowState => {
            const invited = state.profiles[invitedIndex];
            const groupCommandAdd: GroupCommandAdd = {
                type: 'group-command-add',
                timestamp: groupHighestSeenTimestamp(state) + 1,

                identity: {
                    address: invited.identity.address,
                    publicKey: invited.identity.publicKey,
                },
                name: invited.name,
            };
            const updatedState = sendGroupCommand(state, senderIndex, groupCommandAdd);
            return addToGroup(updatedState, senderIndex, invitedIndex);
        };
        const createGroupAndInvite = async (groupState: GroupFlowState, creatorIndex: number, invitedIndex: number): Promise<GroupFlowState> => {
            if (creatorIndex === invitedIndex) {
                throwError('creatorIndex cannot be equal to invitedIndex');
            }
            return compose([
                state => addToGroupAndSendCommand(state, creatorIndex, creatorIndex),
                state => addToGroupAndSendCommand(state, creatorIndex, invitedIndex),
            ])(groupState);
        };
        const sendPrivateInvite = async (state: GroupFlowState, senderIndex: number, invitedIndex: number): Promise<GroupFlowState> => {
            if (senderIndex === invitedIndex) {
                throwError('senderIndex cannot be equal to invitedIndex');
            }
            const sender = state.profiles[senderIndex];
            const invited = state.profiles[invitedIndex];

            updatePrivateSharedFeed(sender.identity, invited.identity, serialize({
                type: 'invite-to-group',
                group: sender.group,
            }));

            return state;
        };
        const receivePrivateInvite = async (state: GroupFlowState, senderIndex: number, invitedIndex: number): Promise<GroupFlowState> => {
            if (senderIndex === invitedIndex) {
                throwError('senderIndex cannot be equal to invitedIndex');
            }
            const sender = state.profiles[senderIndex];
            const invited = state.profiles[invitedIndex];

            const data = await readPrivateSharedFeed(sender.identity, invited.identity);
            if (data == null) {
                return state;
            }
            const inviteCommand = deserialize(data) as InviteToGroupCommand;

            const updatedInvited = {
                ...invited,
                group: inviteCommand.group,
            };

            return {
                ...state,
                profiles: [...state.profiles.slice(0, invitedIndex), updatedInvited, ...state.profiles.slice(invitedIndex + 1)],
            };
        };
        const executeRemoteGroupCommand = (profile: ProfileWithState, command: GroupCommand): ProfileWithState => {
            switch (command.type) {
                case 'group-command-add': {
                    if (profile.group.participants.indexOf(command.identity.publicKey as HexString) !== -1) {
                        return {
                            ...profile,
                            remoteCommands: [command, ...profile.remoteCommands],
                        };
                    }
                    return {
                        ...profile,
                        group: {
                            ...profile.group,
                            participants: [...profile.group.participants, command.identity.publicKey as HexString],
                        },
                        remoteCommands: [command, ...profile.remoteCommands],
                    };
                }
                default: {
                    return {
                        ...profile,
                        remoteCommands: [command, ...profile.remoteCommands],
                    };
                }
            }
        };
        const receiveProfileGroupCommands = async (profile: ProfileWithState): Promise<ProfileWithState> => {
            const remoteCommands = await fetchGroupCommands(profile.group);
            const lastSeenTimestamp = highestSeenTimestamp(profile.remoteCommands);
            const newCommands = remoteCommands
                .filter(command => command.source !== profile.identity.publicKey as HexString)
                .filter(command => command.timestamp > lastSeenTimestamp)
                .sort((a, b) => b.timestamp - a.timestamp)
            ;
            return newCommands.reduce((prev, curr) => executeRemoteGroupCommand(prev, curr), profile);
        };
        const receiveGroupCommands = async (state: GroupFlowState, receiverIndex: number): Promise<GroupFlowState> => {
            Debug.log('receiveGroupCommands', receiverIndex);
            const receiver = state.profiles[receiverIndex];
            const updatedReceiver = await receiveProfileGroupCommands(receiver);
            return {
                ...state,
                profiles: [...state.profiles.slice(0, receiverIndex), updatedReceiver, ...state.profiles.slice(receiverIndex + 1)],
            };
        };
        const fetchGroupCommands = async (group: Group): Promise<GroupCommandWithSource[]> => {
            const topic = calculateGroupTopic(group);
            const commandLists: GroupCommandWithSource[][]  = [];
            for (const participant of group.participants) {
                const chapters = await readTimeline<string>({publicKey: participant, address: ''}, topic);
                commandLists.push(chapters.map(chapter => ({
                    ...deserialize(chapter.content) as GroupCommand,
                    source: participant,
                })));
            }
            const commands = commandLists
                .reduce((prev, curr) => prev.concat(curr), [])
                .sort((a, b) => b.timestamp - a.timestamp)
            ;
            return commands;
        };
        const areGroupsEqual = (groupA: Group, groupB: Group): boolean => {
            return groupA.sharedSecret === groupB.sharedSecret &&
                groupA.participants.length === groupB.participants.length &&
                groupA.participants.join('/') === groupB.participants.join('/')
            ;
        };
        const assertProfileGroupStatesAreEqual = (groupState: GroupFlowState): void | never => {
            const reducedGroups = groupState.profiles.reduce<Group[]>((prev, curr, ind, arr) =>
                ind > 0 && areGroupsEqual(curr.group, arr[ind - 1].group)
                ? prev
                : prev.concat(curr.group)
            , []);
            if (reducedGroups.length > 1) {
                throwError(`assertProfileGroupStatesAreEqual: failed ${JSON.stringify(reducedGroups)}`);
            }
        };
        const areCommandsEqual = (commandsA: GroupCommand[], commandsB: GroupCommand[]): boolean => {
            return JSON.stringify(commandsA) === JSON.stringify(commandsB);
        };
        const sortedProfileCommands = (profile: ProfileWithState) =>
            profile.remoteCommands
                .concat(profile.ownCommands)
                .map(command => ({...command, source: undefined}))
                .sort((a, b) => b.timestamp - a.timestamp)
        ;
        const assertProfileCommandsAreEqual = (groupState: GroupFlowState): void | never => {
            for (let i = 1; i < groupState.profiles.length; i++) {
                const sortedProfileCommandsA = sortedProfileCommands(groupState.profiles[i - 1]);
                const sortedProfileCommandsB = sortedProfileCommands(groupState.profiles[i]);
                if (!areCommandsEqual(sortedProfileCommandsA, sortedProfileCommandsB)) {
                    throwError(`assertProfileCommandsAreEqual: failed at i=${i},\n\n${JSON.stringify(sortedProfileCommandsA)}\n\n !==\n\n${JSON.stringify(sortedProfileCommandsB)}`);
                }
            }
        };
        const assertGroupStateInvariants = (groupState: GroupFlowState): void | never => {
            assertProfileGroupStatesAreEqual(groupState);
            assertProfileCommandsAreEqual(groupState);
        };

        const compose = (functions: ((state: GroupFlowState) => GroupFlowState | Promise<GroupFlowState>)[]) => {
            return async (initialState: GroupFlowState) => {
                let returnState = initialState;
                for (const f of functions) {
                    returnState = await f(returnState);
                }
                return returnState;
            };
        };

        const inputState: GroupFlowState = {
            profiles: [aliceProfile, bobProfile, carolProfile],
        };

        const outputState = await compose([
            (state) => createGroupAndInvite(state, 0, 1),
            (state) => sendPrivateInvite(state, 0, 1),
            (state) => receivePrivateInvite(state, 0, 1),
            (state) => sendGroupMessage(state, 0, 'hello Bob'),
            (state) => receiveGroupCommands(state, 1),
            (state) => sendGroupMessage(state, 1, 'hello Alice'),
            (state) => receiveGroupCommands(state, 0),
            (state) => sendGroupMessage(state, 0, 'test'),
            (state) => receiveGroupCommands(state, 1),
            (state) => addToGroupAndSendCommand(state, 1, 2),
            (state) => receiveGroupCommands(state, 0),
            (state) => sendPrivateInvite(state, 1, 2),
            (state) => receivePrivateInvite(state, 1, 2),
            (state) => sendGroupMessage(state, 1, 'hello Carol'),
            (state) => receiveGroupCommands(state, 0),
            (state) => receiveGroupCommands(state, 1),
            (state) => receiveGroupCommands(state, 2),
        ])(inputState);

        assertGroupStateInvariants(outputState);

        const groupCommands = sortedProfileCommands(outputState.profiles[1]);
        output(groupCommands);

        const isGroupPost = (groupCommand: GroupCommand): groupCommand is GroupCommandPost => groupCommand.type === 'group-command-post';
        const groupPosts = groupCommands.map(gcws => gcws as GroupCommand).filter(isGroupPost).map(value => value.post);
        output(groupPosts);
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
