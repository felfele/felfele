import { addCommand } from './cliParser';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { output } from './cliHelpers';
import { byteArrayToHex, hexToByteArray, stripHexPrefix, hexToUint8Array } from '../helpers/conversion';
import { Debug } from '../Debug';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import * as SwarmHelpers from '../swarm/Swarm';
import { swarmConfig } from './swarmConfig';
import { createInvitedContact, createCodeReceivedContact, advanceContactState, deriveSharedKey } from '../helpers/contactHelpers';
import { HexString, BrandedType, BrandedString } from '../helpers/opaqueTypes';
import { SECOND } from '../DateUtils';
import { aliceReadsBobsEncryptedPublicKey, createBobForContact, aliceGeneratesQRCode, bobSharesContactPublicKeyAndContactFeed, aliceReadsBobsContactPublicKeyAndSharesEncryptedPublicKey, bobReadsAlicesEncryptedPublicKeyAndSharesEncryptedPublicKey, createAliceForContact } from './protocolTest/inviteProtocol';
import { MemoryStorageFeeds, MemoryStorage } from './protocolTest/MemoryStorage';
import { Storage } from './protocolTest/Storage';
import { throwError, createDeterministicRandomGenerator, randomNumbers, createRandomGenerator, ecPrivateKeyFromPrivateIdentity, ecPublicKeyFromPublicIdentity, ecPublicKeyToAddress, PublicKey, Address, publicKeyToAddress } from './protocolTest/protocolTestHelpers';
import { PrivateProfile, PublicProfile } from '../models/Profile';
import { GroupCommand, GroupCommandPost, keyDerivationFunction, GroupCommandAdd, GroupCommandWithSource } from '../helpers/groupHelpers';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import { serialize, deserialize } from '../social/serialization';
import { SwarmStorage } from './protocolTest/SwarmStorage';
import { assertEquals } from '../helpers/assertEquals';

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
    addCommand('privateGroup [randomSeed]', 'Test 1on1 private messaging', async (randomSeed?) => {
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
            participants: PublicKey[];
        }

        interface GroupWithCommands extends Group {
            commands: GroupCommand[];
        }

        interface ProfileWithGroup extends PrivateProfile {
            group: GroupWithCommands;
        }

        interface InviteToGroupCommand {
            type: 'invite-to-group';
            group: Group;
        }

        const aliceProfile: ProfileWithGroup = {
            name: 'Alice',
            image: {},
            identity: await generateIdentity(),
            group: {
                sharedSecret: 'secret' as HexString,
                participants: [],
                commands: [],
            },
        };
        const bobProfile: ProfileWithGroup = {
            name: 'Bob',
            image: {},
            identity: await generateIdentity(),
            group: {
                sharedSecret: '' as HexString,
                participants: [],
                commands: [],
            },
        };
        const carolProfile: ProfileWithGroup = {
            name: 'Carol',
            image: {},
            identity: await generateIdentity(),
            group: {
                sharedSecret: '' as HexString,
                participants: [],
                commands: [],
            },
        };

        assertEquals(publicKeyToAddress(aliceProfile.identity.publicKey as PublicKey), aliceProfile.identity.address as Address);

        const calculateGroupTopic = (group: Group): HexString => {
            const secretWithoutPrefix = stripHexPrefix(group.sharedSecret);
            const bytes = hexToUint8Array(secretWithoutPrefix);
            const topicBytes = keyDerivationFunction([bytes]);
            return byteArrayToHex(topicBytes);
        };

        type ProtocolStorage = Storage<string>;

        interface GroupProtocolState {
            profiles: ProfileWithGroup[];
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

        const readPrivateSharedFeed = async <T>(storage: ProtocolStorage, publicKey: PublicKey, signer: Signer) => {
            const topic = '0x' + signer.deriveSharedKey(publicKey as HexString);
            const address = publicKeyToAddress(publicKey);
            Debug.log('\n\n\nreadPrivateSharedFeed', {publicKey, address, topic}, '\n\n\n');
            const hash = await storage.feeds.read(address, topic as HexString);
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
        const updatePrivateSharedFeed = <T>(storage: ProtocolStorage, ownerIdentity: PublicIdentity, signer: Signer, recipientIdentity: PublicIdentity, data: T) => {
            const topic = '0x' + signer.deriveSharedKey(recipientIdentity.publicKey as HexString);
            return updateTimeline(storage, ownerIdentity, signer.signDigest, topic as HexString, data);
        };
        const updateTimeline = async <T>(storage: ProtocolStorage, ownerIdentity: PublicIdentity, signFeed: (digest: number[]) => string | Promise<string>, topic: HexString, data: T) => {
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
            return storage.feeds.write(ownerIdentity.address as HexString, topic, hash, signFeed);
        };
        const sendGroupMessage = async (context: GroupProtocolContext, message: string): Promise<GroupWithCommands> => {
            const command: GroupCommandPost = {
                type: 'group-command-post',
                timestamp: highestSeenTimestamp(context.group.commands) + 1,

                post: {
                    images: [],
                    text: message,
                    createdAt: Date.now(),
                },
            };
            return sendGroupCommand(context, command);
        };
        const sendGroupCommand = async (context: GroupProtocolContext, groupCommand: GroupCommand): Promise<GroupWithCommands> => {
            const topic = calculateGroupTopic(context.group);
            await updateTimeline(context.storage, context.profile.identity, context.profile.signDigest, topic, groupCommand);
            return {
                ...context.group,
                commands: [groupCommand, ...context.group.commands],
            };
        };
        const addToGroupAndSendCommand = async (context: GroupProtocolContext, invited: PublicProfile): Promise<GroupWithCommands> => {
            const groupCommandAdd: GroupCommandAdd = {
                type: 'group-command-add',
                timestamp: highestSeenTimestamp(context.group.commands) + 1,

                identity: {
                    address: invited.identity.address,
                    publicKey: invited.identity.publicKey,
                },
                name: invited.name,
            };
            const updatedGroup = await sendGroupCommand(context, groupCommandAdd);
            return {
                ...updatedGroup,
                participants: [...updatedGroup.participants, invited.identity.publicKey as PublicKey],
            };
        };
        const sendPrivateInvite = async (context: GroupProtocolContext, invited: PublicProfile): Promise<GroupWithCommands> => {
            await updatePrivateSharedFeed(context.storage, context.profile.identity, context.profile, invited.identity, {
                type: 'invite-to-group',
                group: {
                    ...context.group,
                    commands: undefined,
                },
            });

            return context.group;
        };
        const receivePrivateInvite = async (context: GroupProtocolContext, senderPublicKey: PublicKey): Promise<GroupWithCommands> => {
            const data = await readPrivateSharedFeed<InviteToGroupCommand>(context.storage, senderPublicKey, context.profile);
            if (data == null) {
                return context.group;
            }
            const inviteCommand = data;
            return {
                ...inviteCommand.group,
                commands: [],
            };
        };
        const executeRemoteGroupCommand = (group: GroupWithCommands, command: GroupCommand): GroupWithCommands => {
            switch (command.type) {
                case 'group-command-add': {
                    if (group.participants.indexOf(command.identity.publicKey as PublicKey) !== -1) {
                        return {
                            ...group,
                            commands: [command, ...group.commands],
                        };
                    }
                    return {
                        ...group,
                        commands: [command, ...group.commands],
                        participants: [...group.participants, command.identity.publicKey as PublicKey],
                    };
                }
                default: {
                    return {
                        ...group,
                        commands: [command, ...group.commands],
                    };
                }
            }
        };
        const receiveProfileGroupCommands = async (storage: ProtocolStorage, profile: PublicProfile, group: GroupWithCommands): Promise<GroupWithCommands> => {
            const lastSeenTimestamp = highestSeenTimestamp(group.commands);
            const highestRemoteTimestamp = highestSeenRemoteTimestamp(group.commands as GroupCommandWithSource[]);
            const remoteCommands = await fetchGroupCommands(storage, group, highestRemoteTimestamp);
            const newCommands = remoteCommands
                .filter(command => command.source !== profile.identity.publicKey as HexString)
                .filter(command => command.timestamp > lastSeenTimestamp)
                .sort((a, b) => a.timestamp - b.timestamp) // reverse order!
            ;
            return newCommands.reduce((prev, curr) => executeRemoteGroupCommand(prev, curr), group);
        };
        const receiveGroupCommands = async (context: GroupProtocolContext): Promise<GroupWithCommands> => {
            return await receiveProfileGroupCommands(context.storage, context.profile, context.group);
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
                const address = ecPublicKeyToAddress(ecPublicKeyFromPublicIdentity({publicKey: participant, address: ''}));
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
        const sortedProfileCommands = (profile: ProfileWithGroup, withSource: boolean = false) =>
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
        enum Profile {
            ALICE = 0,
            BOB = 1,
            CAROL = 2,
        }

        const groupToContext = (context: GroupProtocolContext, group: GroupWithCommands): GroupProtocolContext => ({
            ...context,
            group,
        });
        const composeGroupProtocolFunctions = async (context: GroupProtocolContext, functions: GroupProtocolFunction[]): Promise<GroupWithCommands> => {
            for (const f of functions) {
                const group = await f(context);
                context = groupToContext(context, group);
            }
            return context.group;
        };
        interface Signer {
            signDigest: SwarmHelpers.FeedDigestSigner;
            deriveSharedKey: (publicKey: HexString) => HexString;
        }
        type ProfileWithSigner = PublicProfile & Signer;
        interface GroupProtocolContext {
            storage: ProtocolStorage;
            profile: ProfileWithSigner;
            group: GroupWithCommands;
        }
        type GroupProtocolFunction = (context: GroupProtocolContext) => GroupWithCommands | Promise<GroupWithCommands>;
        type GroupProtocolAction = [Profile, GroupProtocolFunction];
        const GroupProtocol = {
            create: (sharedSecret: HexString): GroupProtocolFunction => {
                return async (initialContext) => {
                    return composeGroupProtocolFunctions(initialContext, [
                        context => ({
                            sharedSecret,
                            participants: [],
                            commands: [],
                        }),
                        context => addToGroupAndSendCommand(context, context.profile),
                    ]);
                };
            },
            invite: (invitedProfile: PublicProfile): GroupProtocolFunction => {
                return async (initialContext) => {
                    return composeGroupProtocolFunctions(initialContext, [
                        context => addToGroupAndSendCommand(context, invitedProfile),
                        context => sendPrivateInvite(context, invitedProfile),
                    ]);
                };
            },
            sendMessage: (message: string): GroupProtocolFunction => {
                return async (context) => {
                    return sendGroupMessage(context, message);
                };
            },
            receive: (): GroupProtocolFunction => {
                return async (context) => {
                    return receiveGroupCommands(context);
                };
            },
            receivePrivate: (sender: PublicProfile): GroupProtocolFunction => {
                return async (context) => {
                    return receivePrivateInvite(context, sender.identity.publicKey as PublicKey);
                };
            },
        };

        const composeGroupProtocolWithState = async (initialGroupState: GroupProtocolState, actions: GroupProtocolAction[]): Promise<GroupProtocolState> => {
            let state = initialGroupState;
            for (const action of actions) {
                const p = action[0];
                const f = action[1];
                const profile = {
                    ...state.profiles[p],
                    signDigest: (digest: number[]) => SwarmHelpers.signDigest(digest, state.profiles[p].identity),
                    deriveSharedKey: (publicKey: HexString) => deriveSharedKey(state.profiles[p].identity, {publicKey, address: ''}),
                };
                const context: GroupProtocolContext = {
                    storage: state.storage,
                    profile,
                    group: profile.group,
                };
                const updatedGroup = await f(context);
                const updatedProfile = {
                    ...profile,
                    group: updatedGroup,
                };
                state = {
                    ...state,
                    profiles: [...state.profiles.slice(0, p), updatedProfile, ...state.profiles.slice(p + 1)],
                };
            }
            debugState(state);
            return state;
        };

        const outputState = await composeGroupProtocolWithState(inputState, [
            [Profile.ALICE, GroupProtocol.create('secret' as HexString)],
            [Profile.ALICE, GroupProtocol.invite(inputState.profiles[Profile.BOB])],
            [Profile.BOB, GroupProtocol.receivePrivate(inputState.profiles[Profile.ALICE])],
            [Profile.ALICE, GroupProtocol.sendMessage('hello Bob')],
            [Profile.BOB, GroupProtocol.receive()],
            [Profile.BOB, GroupProtocol.sendMessage('hello Alice')],
            [Profile.ALICE, GroupProtocol.receive()],
            [Profile.ALICE, GroupProtocol.sendMessage('test')],
            [Profile.BOB, GroupProtocol.receive()],
            [Profile.BOB, GroupProtocol.invite(inputState.profiles[Profile.CAROL])],
            [Profile.ALICE, GroupProtocol.receive()],
            [Profile.CAROL, GroupProtocol.receivePrivate(inputState.profiles[Profile.BOB])],
            [Profile.BOB, GroupProtocol.sendMessage('hello Carol')],
            [Profile.ALICE, GroupProtocol.receive()],
            [Profile.BOB, GroupProtocol.receive()],
            [Profile.CAROL, GroupProtocol.receive()],
        ]);

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
