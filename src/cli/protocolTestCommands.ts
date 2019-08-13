import { addCommand } from './cliParser';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { byteArrayToHex, hexToByteArray, stripHexPrefix, hexToUint8Array } from '../helpers/conversion';
import { Debug } from '../Debug';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import * as SwarmHelpers from '../swarm/Swarm';
import { swarmConfig } from './swarmConfig';
import { createInvitedContact, createCodeReceivedContact, advanceContactState, deriveSharedKey } from '../helpers/contactHelpers';
import { HexString, BrandedType } from '../helpers/opaqueTypes';
import { SECOND } from '../DateUtils';
import { aliceReadsBobsEncryptedPublicKey, createBobForContact, aliceGeneratesQRCode, bobSharesContactPublicKeyAndContactFeed, aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey, bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey, createAliceForContact } from './protocolTest/inviteProtocol';
import { MemoryStorageFeeds, MemoryStorage } from './protocolTest/MemoryStorage';
import { Storage } from './protocolTest/Storage';
import { throwError, createDeterministicRandomGenerator, randomNumbers, createRandomGenerator, privateKeyFromPrivateIdentity, publicKeyFromPublicIdentity, publicKeyToAddress } from './protocolTest/protocolTestHelpers';
import { PrivateProfile } from '../models/Profile';
import { GroupCommand, GroupCommandPost, keyDerivationFunction, GroupCommandAdd, GroupCommandWithSource } from '../helpers/groupHelpers';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import { serialize, deserialize } from '../social/serialization';
import { SwarmStorage } from './protocolTest/SwarmStorage';

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

        interface GroupWithCommands extends Group {
            commands: GroupCommand[];
        }

        interface ProfileWithState extends PrivateProfile {
            group: GroupWithCommands;
        }

        interface InviteToGroupCommand {
            type: 'invite-to-group';
            group: Group;
        }

        const aliceProfile: ProfileWithState = {
            name: 'Alice',
            image: {},
            identity: await generateIdentity(),
            group: {
                sharedSecret: 'secret' as HexString,
                participants: [],
                commands: [],
            },
        };
        const bobProfile: ProfileWithState = {
            name: 'Bob',
            image: {},
            identity: await generateIdentity(),
            group: {
                sharedSecret: '' as HexString,
                participants: [],
                commands: [],
            },
        };
        const carolProfile: ProfileWithState = {
            name: 'Carol',
            image: {},
            identity: await generateIdentity(),
            group: {
                sharedSecret: '' as HexString,
                participants: [],
                commands: [],
            },
        };

        const calculateGroupTopic = (group: Group): HexString => {
            const secretWithoutPrefix = stripHexPrefix(group.sharedSecret);
            const bytes = hexToUint8Array(secretWithoutPrefix);
            const topicBytes = keyDerivationFunction([bytes]);
            return byteArrayToHex(topicBytes);
        };

        type ProtocolStorage = Storage<string>;

        interface GroupProtocolState {
            profiles: ProfileWithState[];
            storage: ProtocolStorage;
        }

        type ChapterReference = BrandedType<HexString, 'ChapterReference'>;

        type PartialChapter<T> = {
            protocol: 'timeline',
            version: 1,
            timestamp: number,
            author: string,
            type: string,
            content: T,
            previous?: ChapterReference,
            references?: Array<ChapterReference>,
            signature?: string,
        };

        type Chapter<T> = PartialChapter<T> & { id: string };

        const highestSeenTimestamp = (commands: GroupCommand[]) => {
            return commands.reduce((prev, curr) => curr.timestamp > prev
                ? curr.timestamp
                : prev
            , 0);
        };
        const highestSeenRemoteTimestamp = (commands: GroupCommandWithSource[]) => {
            return commands.reduce((prev, curr) => curr.source != null && curr.timestamp > prev
                ? curr.timestamp
                : prev
            , 0);
        };

        const readPrivateSharedFeed = async <T>(storage: ProtocolStorage, ownerIdentity: PrivateIdentity, recipientIdentity: PublicIdentity) => {
            const topic = '0x' + deriveSharedKey(ownerIdentity, recipientIdentity);
            Debug.log('readPrivateSharedFeed', {ownerIdentity, recipientIdentity});
            const hash = await storage.feeds.read(ownerIdentity.address as HexString, topic as HexString);
            if (hash == null) {
                return undefined;
            }
            const data = await storage.read(hash as HexString);
            if (data == null) {
                return undefined;
            }
            const chapter = deserialize(data) as PartialChapter<T>;
            return chapter.content;
        };
        const readTimeline = async (storage: ProtocolStorage, address: HexString, topic: HexString): Promise<ChapterReference | undefined> => {
            const hash = await storage.feeds.read(address, topic);
            Debug.log('readTimeline', {hash});
            return hash as ChapterReference | undefined;
        };
        const readChapter = async <T>(storage: ProtocolStorage, reference: ChapterReference): Promise<PartialChapter<T> | undefined> => {
            const data = await storage.read(reference as HexString);
            if (data == null) {
                return undefined;
            }
            const chapter = deserialize(data) as PartialChapter<T>;
            return chapter;
        };
        const updatePrivateSharedFeed = <T>(storage: ProtocolStorage, ownerIdentity: PrivateIdentity, recipientIdentity: PublicIdentity, data: T) => {
            const topic = '0x' + deriveSharedKey(ownerIdentity, recipientIdentity);
            return updateTimeline(storage, ownerIdentity, topic as HexString, data);
        };
        const updateTimeline = async <T>(storage: ProtocolStorage, ownerIdentity: PrivateIdentity, topic: HexString, data: T) => {
            Debug.log('updateTimeline', {ownerIdentity, topic, data});
            const previous = await storage.feeds.read(ownerIdentity.address as HexString, topic) as ChapterReference | undefined;
            const chapter: PartialChapter<T> = {
                protocol: 'timeline',
                version: 1,
                timestamp: Date.now(),
                author: ownerIdentity.address,
                type: 'application/json',
                content: data,
                previous,
            };
            const hash = await storage.write(serialize(chapter));
            const signFeed = (digest: number[]) => SwarmHelpers.signDigest(digest, ownerIdentity);
            return storage.feeds.write(ownerIdentity.address as HexString, topic, hash, signFeed);
        };
        const sendGroupCommand = async (state: GroupProtocolState, senderIndex: number, groupCommand: GroupCommand): Promise<GroupProtocolState> => {
            const sender = state.profiles[senderIndex];
            const topic = calculateGroupTopic(sender.group);
            await updateTimeline(state.storage, sender.identity, topic, groupCommand);
            const updatedSender = {
                ...sender,
                group: {
                    ...sender.group,
                    commands: [groupCommand, ...sender.group.commands],
                },
            };
            return {
                ...state,
                profiles: [...state.profiles.slice(0, senderIndex), updatedSender, ...state.profiles.slice(senderIndex + 1)],
            };
        };
        const sendGroupMessage = async (state: GroupProtocolState, senderIndex: number, message: string): Promise<GroupProtocolState> => {
            const sender = state.profiles[senderIndex];
            const command: GroupCommandPost = {
                type: 'group-command-post',
                timestamp: highestSeenTimestamp(sender.group.commands) + 1,

                post: {
                    images: [],
                    text: message,
                    createdAt: Date.now(),
                },
            };
            return sendGroupCommand(state, senderIndex, command);
        };
        const addToGroup = (state: GroupProtocolState, senderIndex: number, invitedIndex: number): GroupProtocolState => {
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
        const addToGroupAndSendCommand = async (state: GroupProtocolState, senderIndex: number, invitedIndex: number): Promise<GroupProtocolState> => {
            const sender = state.profiles[senderIndex];
            const invited = state.profiles[invitedIndex];
            const groupCommandAdd: GroupCommandAdd = {
                type: 'group-command-add',
                timestamp: highestSeenTimestamp(sender.group.commands) + 1,

                identity: {
                    address: invited.identity.address,
                    publicKey: invited.identity.publicKey,
                },
                name: invited.name,
            };
            const updatedState = await sendGroupCommand(state, senderIndex, groupCommandAdd);
            return addToGroup(updatedState, senderIndex, invitedIndex);
        };
        const createGroupAndInvite = async (groupState: GroupProtocolState, creatorIndex: number, invitedIndex: number): Promise<GroupProtocolState> => {
            if (creatorIndex === invitedIndex) {
                throwError('creatorIndex cannot be equal to invitedIndex');
            }
            return compose([
                state => addToGroupAndSendCommand(state, creatorIndex, creatorIndex),
                state => addToGroupAndSendCommand(state, creatorIndex, invitedIndex),
            ])(groupState);
        };
        const sendPrivateInvite = async (state: GroupProtocolState, senderIndex: number, invitedIndex: number): Promise<GroupProtocolState> => {
            if (senderIndex === invitedIndex) {
                throwError('senderIndex cannot be equal to invitedIndex');
            }
            const sender = state.profiles[senderIndex];
            const invited = state.profiles[invitedIndex];

            await updatePrivateSharedFeed(state.storage, sender.identity, invited.identity, {
                type: 'invite-to-group',
                group: {
                    ...sender.group,
                    commands: undefined,
                },
            });

            return state;
        };
        const receivePrivateInvite = async (state: GroupProtocolState, senderIndex: number, invitedIndex: number): Promise<GroupProtocolState> => {
            if (senderIndex === invitedIndex) {
                throwError('senderIndex cannot be equal to invitedIndex');
            }
            const sender = state.profiles[senderIndex];
            const invited = state.profiles[invitedIndex];

            const data = await readPrivateSharedFeed<InviteToGroupCommand>(state.storage, sender.identity, invited.identity);
            if (data == null) {
                return state;
            }
            const inviteCommand = data;
            const updatedInvited = {
                ...invited,
                group: {
                    ...inviteCommand.group,
                    commands: [],
                },
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
                            group: {
                                ...profile.group,
                                commands: [command, ...profile.group.commands],
                            },
                        };
                    }
                    return {
                        ...profile,
                        group: {
                            ...profile.group,
                            commands: [command, ...profile.group.commands],
                            participants: [...profile.group.participants, command.identity.publicKey as HexString],
                        },
                    };
                }
                default: {
                    return {
                        ...profile,
                        group: {
                            ...profile.group,
                            commands: [command, ...profile.group.commands],
                        },
                    };
                }
            }
        };
        const receiveProfileGroupCommands = async (storage: ProtocolStorage, profile: ProfileWithState): Promise<ProfileWithState> => {
            const lastSeenTimestamp = highestSeenTimestamp(profile.group.commands);
            const highestRemoteTimestamp = highestSeenRemoteTimestamp(profile.group.commands as GroupCommandWithSource[]);
            const remoteCommands = await fetchGroupCommands(storage, profile.group, highestRemoteTimestamp);
            const newCommands = remoteCommands
                .filter(command => command.source !== profile.identity.publicKey as HexString)
                .filter(command => command.timestamp > lastSeenTimestamp)
                .sort((a, b) => a.timestamp - b.timestamp) // reverse order!
            ;
            return newCommands.reduce((prev, curr) => executeRemoteGroupCommand(prev, curr), profile);
        };
        const receiveGroupCommands = async (state: GroupProtocolState, receiverIndex: number): Promise<GroupProtocolState> => {
            Debug.log('receiveGroupCommands', receiverIndex);
            const receiver = state.profiles[receiverIndex];
            const updatedReceiver = await receiveProfileGroupCommands(state.storage, receiver);
            return {
                ...state,
                profiles: [...state.profiles.slice(0, receiverIndex), updatedReceiver, ...state.profiles.slice(receiverIndex + 1)],
            };
        };
        const fetchGroupTimeline = async (storage: ProtocolStorage, address: HexString, topic: HexString, until: number) => {
            let reference = await readTimeline(storage, address, topic);
            const commands: GroupCommand[] = [];
            while (reference != null) {
                const chapter = await readChapter<GroupCommand>(storage, reference);
                if (chapter == null) {
                    return commands;
                }
                const command = chapter.content;
                if (command.timestamp <= until) {
                    return commands;
                }
                commands.push(command);
                reference = chapter.previous;
            }
            return commands;
        };
        const fetchGroupCommands = async (storage: ProtocolStorage, group: Group, highestRemoteTimestamp: number): Promise<GroupCommandWithSource[]> => {
            const topic = calculateGroupTopic(group);
            const commandLists: GroupCommandWithSource[][]  = [];
            for (const participant of group.participants) {
                const address = publicKeyToAddress(publicKeyFromPublicIdentity({publicKey: participant, address: ''}));
                const participantCommands = await fetchGroupTimeline(storage, address, topic, highestRemoteTimestamp);
                commandLists.push(participantCommands.map(command => ({
                    ...command,
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
        const assertProfileGroupStatesAreEqual = (groupState: GroupProtocolState): void | never => {
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
        const sortedProfileCommands = (profile: ProfileWithState, withSource: boolean = false) =>
            profile.group.commands
                .map(command => ({...command, source: withSource ? (command as GroupCommandWithSource).source : undefined}))
                .sort((a, b) => b.timestamp - a.timestamp)
        ;
        const assertProfileCommandsAreEqual = (groupState: GroupProtocolState): void | never => {
            for (let i = 1; i < groupState.profiles.length; i++) {
                const sortedProfileCommandsA = sortedProfileCommands(groupState.profiles[i - 1]);
                const sortedProfileCommandsB = sortedProfileCommands(groupState.profiles[i]);
                if (!areCommandsEqual(sortedProfileCommandsA, sortedProfileCommandsB)) {
                    throwError(`assertProfileCommandsAreEqual: failed at i == ${i},\n\n${JSON.stringify(sortedProfileCommandsA)}\n\n !==\n\n${JSON.stringify(sortedProfileCommandsB)}`);
                }
            }
        };
        const assertCommandsAreOrdered = (commands: GroupCommand[]) => {
            for (let i = 1; i < commands.length; i++) {
                if (commands[i].timestamp > commands[i - 1].timestamp) {
                    throwError(`assertCommandsAreOrdered: failed at i == ${i},\n\n${JSON.stringify(commands)}`);
                }
            }
        };
        const assertGroupStateInvariants = (groupState: GroupProtocolState): GroupProtocolState | never => {
            groupState.profiles.map(profile => assertCommandsAreOrdered(profile.group.commands));
            assertProfileGroupStatesAreEqual(groupState);
            assertProfileCommandsAreEqual(groupState);
            return groupState;
        };
        const debugState = (groupState: GroupProtocolState): GroupProtocolState => {
            Debug.log('debugState', groupState.profiles);
            return groupState;
        };

        const compose = (functions: ((state: GroupProtocolState) => GroupProtocolState | Promise<GroupProtocolState>)[]) => {
            return async (initialState: GroupProtocolState) => {
                let returnState = initialState;
                for (const f of functions) {
                    returnState = await f(returnState);
                }
                return returnState;
            };
        };

        const makeStorage = async () => {
            const swarmApiIdentity = await generateIdentity();
            const swarmApiSigner = (digest: number[]) => SwarmHelpers.signDigest(digest, swarmApiIdentity);
            const swarmGateway = process.env.SWARM_GATEWAY || '';
            const swarmApi = SwarmHelpers.makeApi({user: '', topic: ''}, swarmApiSigner, swarmGateway);
            const swarmStorage = new SwarmStorage(swarmApi);
            const memoryStorage = new MemoryStorage();
            const storage = swarmGateway !== ''
                ? swarmStorage
                : memoryStorage
            ;
            return storage;
        };
        const inputState: GroupProtocolState = {
            profiles: [aliceProfile, bobProfile, carolProfile],
            storage: await makeStorage(),
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
            (state) => debugState(state),
        ])(inputState);

        assertGroupStateInvariants(outputState);

        const groupCommands = sortedProfileCommands(outputState.profiles[1], true);
        const isGroupPost = (groupCommand: GroupCommandWithSource): groupCommand is GroupCommandPost & {source: HexString} => groupCommand.type === 'group-command-post';
        const groupPosts = groupCommands.map(gcws => gcws as GroupCommandWithSource).filter(isGroupPost).map(value => ({...value.post, source: value.source}));
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
