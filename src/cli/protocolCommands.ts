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
    // .
    // addCommand('privateGroup [randomSeed]', 'Test group private messaging', async (randomSeed?) => {
    //     randomSeed = randomSeed ? randomSeed : randomNumbers[0];
    //     const generateDeterministicRandom = createAsyncDeterministicRandomGenerator(randomSeed);
    //     const generateIdentity = () => SwarmHelpers.generateSecureIdentity(generateDeterministicRandom);

    //     interface Group {
    //         name?: string;
    //         sharedSecret: HexString;
    //         participants: PublicKey[];
    //     }

    //     interface GroupWithTimeline extends Group {
    //         timeline: Timeline<GroupCommand>;
    //     }

    //     interface ProfileWithGroup extends PrivateProfile {
    //         group: GroupWithTimeline;
    //     }

    //     interface InviteToGroupCommand {
    //         type: 'invite-to-group';
    //         group: Group;
    //     }

    //     const emptyGroupWithTimeline: GroupWithTimeline = {
    //         sharedSecret: 'secret' as HexString,
    //         participants: [],
    //         timeline: [],
    //     };
    //     const aliceProfile: ProfileWithGroup = {
    //         name: 'Alice',
    //         image: {},
    //         identity: await generateIdentity(),
    //         group: emptyGroupWithTimeline,
    //     };
    //     const bobProfile: ProfileWithGroup = {
    //         name: 'Bob',
    //         image: {},
    //         identity: await generateIdentity(),
    //         group: emptyGroupWithTimeline,
    //     };
    //     const carolProfile: ProfileWithGroup = {
    //         name: 'Carol',
    //         image: {},
    //         identity: await generateIdentity(),
    //         group: emptyGroupWithTimeline,
    //     };

    //     const calculateGroupTopic = (group: Group): HexString => {
    //         const secretWithoutPrefix = stripHexPrefix(group.sharedSecret);
    //         const bytes = hexToUint8Array(secretWithoutPrefix);
    //         const topicBytes = cryptoHash(bytes);
    //         return byteArrayToHex(topicBytes);
    //     };

    //     interface GroupProtocolState {
    //         profiles: ProfileWithGroup[];
    //         storage: ProtocolStorage;
    //         encryption: Encryption;
    //     }

    //     const readPrivateSharedTimeline = async <T>(
    //         storage: ProtocolStorage,
    //         publicKey: PublicKey,
    //         crypto: Crypto,
    //     ) => {
    //         const sharedKey = crypto.deriveSharedKey(publicKey as HexString);
    //         const topic = calculatePrivateTopic(sharedKey);
    //         const address = publicKeyToAddress(publicKey);
    //         Debug.log('readPrivateSharedFeed', {publicKey, address, topic});
    //         const hash = await storage.feeds.read(address, topic as HexString);
    //         if (hash == null) {
    //             return undefined;
    //         }
    //         const data = await storage.read(hash as HexString);
    //         if (data == null) {
    //             return undefined;
    //         }
    //         const secretBytes = hexToUint8Array(sharedKey);
    //         const decryptData = (dataBytes: Uint8Array): string => Uint8ArrayToString(crypto.decrypt(dataBytes, secretBytes));
    //         const chapter = deserialize(decryptData(data)) as PartialChapter<T>;
    //         Debug.log('readPrivateSharedFeed', {chapter});
    //         return chapter.content;
    //     };

    //     const readTimeline = async (storage: ProtocolStorage, address: HexString, topic: HexString): Promise<ChapterReference | undefined> => {
    //         const hash = await storage.feeds.read(address, topic);
    //         Debug.log('readTimeline', {hash});
    //         return hash as ChapterReference | undefined;
    //     };
    //     const readChapter = async <T>(storage: ProtocolStorage, reference: ChapterReference, decryptData: (data: Uint8Array) => string = Uint8ArrayToString): Promise<Chapter<T> | undefined> => {
    //         const data = await storage.read(reference as HexString);
    //         if (data == null) {
    //             return undefined;
    //         }
    //         const partialChapter = deserialize(decryptData(data)) as PartialChapter<T>;
    //         return {
    //             ...partialChapter,
    //             id: reference,
    //         };
    //     };
    //     const updatePrivateSharedTimeline = async <T>(
    //         storage: ProtocolStorage,
    //         ownerIdentity: PublicIdentity,
    //         crypto: Crypto,
    //         recipientIdentity: PublicIdentity,
    //         data: T,
    //     ) => {
    //         const sharedKey = crypto.deriveSharedKey(recipientIdentity.publicKey as HexString);
    //         const topic = calculatePrivateTopic(sharedKey);
    //         const random = await crypto.random(32);
    //         const encryptTimeline = (s: string): Uint8Array => {
    //             const dataBytes = stringToUint8Array(s);
    //             const secretBytes = hexToUint8Array(sharedKey);
    //             return crypto.encrypt(dataBytes, secretBytes, random);
    //         };
    //         return updateTimeline(storage, ownerIdentity, crypto.signDigest, topic as HexString, data, encryptTimeline);
    //     };
    //     const updateTimeline = async <T>(
    //         storage: ProtocolStorage,
    //         ownerIdentity: PublicIdentity,
    //         signFeed: (digest: number[]) => string | Promise<string>,
    //         topic: HexString,
    //         data: T,
    //         encryptTimeline: (data: string) => Uint8Array = stringToUint8Array
    //     ) => {
    //         Debug.log('updateTimeline', {ownerIdentity, topic, data});
    //         const previous = await storage.feeds.read(ownerIdentity.address as HexString, topic) as ChapterReference | undefined;
    //         const chapter: PartialChapter<T> = {
    //             protocol: 'timeline',
    //             version: '1.0.0',
    //             timestamp: Date.now(),
    //             author: ownerIdentity.address,
    //             type: 'application/json',
    //             content: data,
    //             previous,
    //         };
    //         const hash = await storage.write(encryptTimeline(serialize(chapter)));
    //         return storage.feeds.write(ownerIdentity.address as HexString, topic, hash, signFeed);
    //     };
    //     const sendGroupMessage = async (context: GroupProtocolContext, message: string): Promise<GroupWithTimeline> => {
    //         const command: GroupCommandPost = {
    //             type: 'group-command-post',
    //             protocol: 'group',
    //             version: 1,
    //             logicalTime: highestSeenLogicalTime(context.group.timeline) + 1,

    //             post: {
    //                 images: [],
    //                 text: message,
    //                 createdAt: Date.now(),
    //             },
    //         };
    //         return appendGroupCommandToTimeline(context, command);
    //     };
    //     const appendGroupCommandToTimeline = async (context: GroupProtocolContext, groupCommand: GroupCommand): Promise<GroupWithTimeline> => {
    //         const ownerIdentity = context.profile.identity;
    //         Debug.log('addGroupCommand', {ownerIdentity});
    //         const chapter: PartialChapter<GroupCommand> = {
    //             protocol: 'timeline',
    //             version: '1.0.0',
    //             timestamp: Date.now(),
    //             author: ownerIdentity.address,
    //             type: 'application/json',
    //             content: groupCommand,
    //             previous: undefined,
    //         };
    //         return {
    //             ...context.group,
    //             timeline: [chapter, ...context.group.timeline],
    //         };
    //     };
    //     const addToGroupAndSendCommand = async (context: GroupProtocolContext, invited: PublicProfile): Promise<GroupWithTimeline> => {
    //         const groupCommandAdd: GroupCommandAddMember = {
    //             type: 'group-command-add',
    //             protocol: 'group',
    //             version: 1,
    //             logicalTime: highestSeenLogicalTime(context.group.timeline) + 1,

    //             identity: {
    //                 address: invited.identity.address,
    //                 publicKey: invited.identity.publicKey,
    //             },
    //             name: invited.name,
    //         };
    //         const updatedGroup = await appendGroupCommandToTimeline(context, groupCommandAdd);
    //         return {
    //             ...updatedGroup,
    //             participants: [...updatedGroup.participants, invited.identity.publicKey as PublicKey],
    //         };
    //     };
    //     const uploadQueuedGroupCommands = async (context: GroupProtocolContext): Promise<GroupWithTimeline> => {
    //         const topic = calculateGroupTopic(context.group);
    //         const encryptChapter = async (c: PartialChapter<GroupCommand>): Promise<Uint8Array> => {
    //             const s = serialize(c);
    //             const dataBytes = stringToUint8Array(s);
    //             const secretBytes = hexToUint8Array(context.group.sharedSecret);
    //             const random = await context.crypto.random(32);
    //             return context.crypto.encrypt(dataBytes, secretBytes, random);
    //         };
    //         const uploadedTimeline = await uploadTimeline(
    //             context.group.timeline,
    //             context.storage,
    //             context.profile.identity.address as HexString,
    //             topic,
    //             encryptChapter,
    //             context.crypto.signDigest,
    //         );
    //         return {
    //             ...context.group,
    //             timeline: uploadedTimeline,
    //         };
    //     };
    //     const sendPrivateInvite = async (context: GroupProtocolContext, invited: PublicProfile): Promise<GroupWithTimeline> => {

    //         await updatePrivateSharedTimeline(context.storage, context.profile.identity, context.crypto, invited.identity, {
    //             type: 'invite-to-group',
    //             group: {
    //                 ...context.group,
    //                 timeline: undefined,
    //             },
    //         });

    //         return context.group;
    //     };
    //     const receivePrivateInvite = async (context: GroupProtocolContext, senderPublicKey: PublicKey): Promise<GroupWithTimeline> => {
    //         const data = await readPrivateSharedTimeline<InviteToGroupCommand>(context.storage, senderPublicKey, context.crypto);
    //         if (data == null) {
    //             return context.group;
    //         }
    //         const inviteCommand = data;
    //         return {
    //             ...inviteCommand.group,
    //             timeline: [],
    //         };
    //     };
    //     const executeRemoteGroupCommand = (group: GroupWithTimeline, command: PartialChapter<GroupCommand>): GroupWithTimeline => {
    //         switch (command.content.type) {
    //             case 'group-command-add': {
    //                 if (group.participants.indexOf(command.content.identity.publicKey as PublicKey) !== -1) {
    //                     return {
    //                         ...group,
    //                         timeline: [command, ...group.timeline],
    //                     };
    //                 }
    //                 return {
    //                     ...group,
    //                     timeline: [command, ...group.timeline],
    //                     participants: [...group.participants, command.content.identity.publicKey as PublicKey],
    //                 };
    //             }
    //             default: {
    //                 return {
    //                     ...group,
    //                     timeline: [command, ...group.timeline],
    //                 };
    //             }
    //         }
    //     };
    //     const receiveGroupCommands = async (context: GroupProtocolContext): Promise<GroupWithTimeline> => {
    //         return await receiveProfileGroupCommands(context.storage, context.profile, context.crypto, context.group);
    //     };
    //     const receiveProfileGroupCommands = async (storage: ProtocolStorage, profile: PublicProfile, crypto: Crypto, group: GroupWithTimeline): Promise<GroupWithTimeline> => {
    //         const lastSeenLogicalTime = highestSeenLogicalTime(group.timeline);
    //         const highestRemoteLogicalTime = highestSeenRemoteLogicalTime(group.timeline, profile.identity.address);
    //         const remoteCommands = await fetchGroupCommands(storage, group, highestRemoteLogicalTime, crypto);
    //         // Debug.log('receiveProfileGroupCommands', {groupTimeline: group.timeline, remoteCommands});
    //         const newCommands = remoteCommands
    //             .filter(command => command.author !== profile.identity.address)
    //             .filter(command => command.content.logicalTime > lastSeenLogicalTime)
    //             .sort((a, b) => a.content.logicalTime - b.content.logicalTime) // reverse order!
    //         ;
    //         return newCommands.reduce((prev, curr) => executeRemoteGroupCommand(prev, curr), group);
    //     };
    //     const fetchGroupTimeline = async (storage: ProtocolStorage, address: HexString, topic: HexString, until: number, crypto: Crypto, secretBytes: Uint8Array) => {
    //         let reference = await readTimeline(storage, address, topic);
    //         const timeline: Timeline<GroupCommand> = [];
    //         const decryptData = (data: Uint8Array): string => Uint8ArrayToString(crypto.decrypt(data, secretBytes));
    //         while (reference != null) {
    //             const chapter = await readChapter<GroupCommand>(storage, reference, decryptData);
    //             if (chapter == null) {
    //                 return timeline;
    //             }
    //             const command = chapter.content;
    //             if (command.logicalTime <= until) {
    //                 return timeline;
    //             }
    //             timeline.push(chapter);
    //             reference = chapter.previous;
    //         }
    //         return timeline;
    //     };
    //     const fetchGroupCommands = async (storage: ProtocolStorage, group: Group, highestRemoteLogicalTime: number, crypto: Crypto): Promise<Timeline<GroupCommand>> => {
    //         const topic = calculateGroupTopic(group);
    //         const secretBytes = hexToUint8Array(group.sharedSecret);
    //         const commandLists: Timeline<GroupCommand>[]  = [];
    //         for (const participant of group.participants) {
    //             const address = publicKeyToAddress(participant);
    //             const participantTimeline = await fetchGroupTimeline(storage, address, topic, highestRemoteLogicalTime, crypto, secretBytes);
    //             Debug.log('fetchGroupCommands', {participantTimeline, highestRemoteLogicalTime});
    //             commandLists.push(participantTimeline);
    //         }
    //         const commands = commandLists
    //             .reduce((prev, curr) => prev.concat(curr), [])
    //             .sort((a, b) => b.content.logicalTime - a.content.logicalTime)
    //         ;
    //         return commands;
    //     };
    //     const areGroupsEqual = (groupA: Group, groupB: Group): boolean => {
    //         return groupA.sharedSecret === groupB.sharedSecret &&
    //             groupA.participants.length === groupB.participants.length &&
    //             groupA.participants.join('/') === groupB.participants.join('/')
    //         ;
    //     };
    //     const assertProfileGroupStatesAreEqual = (groupState: GroupProtocolState): void | never => {
    //         const reducedGroups = groupState.profiles.reduce<Group[]>((prev, curr, ind, arr) =>
    //             ind > 0 && areGroupsEqual(curr.group, arr[ind - 1].group)
    //             ? prev
    //             : prev.concat(curr.group)
    //         , []);
    //         if (reducedGroups.length > 1) {
    //             throwError(`assertProfileGroupStatesAreEqual: failed ${JSON.stringify(reducedGroups)}`);
    //         }
    //     };
    //     const areCommandsEqual = (commandsA: GroupCommand[], commandsB: GroupCommand[]): boolean => {
    //         return JSON.stringify(commandsA) === JSON.stringify(commandsB);
    //     };
    //     const sortedProfileCommands = (profile: ProfileWithGroup) =>
    //         profile.group.timeline
    //             .map(timeline => timeline.content)
    //             .sort((a, b) => b.logicalTime - a.logicalTime)
    //     ;
    //     const assertProfileCommandsAreEqual = (groupState: GroupProtocolState): void | never => {
    //         for (let i = 1; i < groupState.profiles.length; i++) {
    //             const sortedProfileCommandsA = sortedProfileCommands(groupState.profiles[i - 1]);
    //             const sortedProfileCommandsB = sortedProfileCommands(groupState.profiles[i]);
    //             if (!areCommandsEqual(sortedProfileCommandsA, sortedProfileCommandsB)) {
    //                 throwError(`assertProfileCommandsAreEqual: failed at i == ${i},\n\n${JSON.stringify(sortedProfileCommandsA)}\n\n !==\n\n${JSON.stringify(sortedProfileCommandsB)}`);
    //             }
    //         }
    //     };
    //     const assertTimelineIsOrdered = (timeline: Timeline<GroupCommand>) => {
    //         for (let i = 1; i < timeline.length; i++) {
    //             if (timeline[i].content.logicalTime > timeline[i - 1].content.logicalTime) {
    //                 throwError(`assertCommandsAreOrdered: failed at i == ${i},\n\n${JSON.stringify(timeline)}`);
    //             }
    //         }
    //     };
    //     const assertGroupStateInvariants = (groupState: GroupProtocolState): GroupProtocolState | never => {
    //         groupState.profiles.map(profile => assertTimelineIsOrdered(profile.group.timeline));
    //         assertProfileGroupStatesAreEqual(groupState);
    //         assertProfileCommandsAreEqual(groupState);
    //         return groupState;
    //     };
    //     const debugState = (groupState: GroupProtocolState): GroupProtocolState => {
    //         Debug.log('debugState', groupState.profiles);
    //         return groupState;
    //     };

    //     const makeEncryption = makeNaclEncryption;
    //     const inputState: GroupProtocolState = {
    //         profiles: [aliceProfile, bobProfile, carolProfile],
    //         storage: await makeStorage(generateIdentity),
    //         encryption: await makeEncryption(),
    //     };
    //     enum Profile {
    //         ALICE = 0,
    //         BOB = 1,
    //         CAROL = 2,
    //     }

    //     const groupToContext = (context: GroupProtocolContext, group: GroupWithTimeline): GroupProtocolContext => ({
    //         ...context,
    //         group,
    //     });
    //     const composeGroupProtocolFunctions = async (context: GroupProtocolContext, functions: GroupProtocolFunction[]): Promise<GroupWithTimeline> => {
    //         for (const f of functions) {
    //             const group = await f(context);
    //             context = groupToContext(context, group);
    //         }
    //         return context.group;
    //     };
    //     interface GroupProtocolContext {
    //         storage: ProtocolStorage;
    //         profile: PublicProfile;
    //         crypto: Crypto;
    //         group: GroupWithTimeline;
    //         privateContexts: PrivateChannelContext[];
    //     }
    //     type GroupProtocolFunction = (context: GroupProtocolContext) => GroupWithTimeline | Promise<GroupWithTimeline>;
    //     type GroupProtocolAction = [Profile, GroupProtocolFunction];
    //     const GroupProtocol = {
    //         create: (sharedSecret: HexString): GroupProtocolFunction => {
    //             return async (initialContext) => {
    //                 return composeGroupProtocolFunctions(initialContext, [
    //                     () => ({
    //                         sharedSecret,
    //                         participants: [],
    //                         timeline: [],
    //                     }),
    //                     context => addToGroupAndSendCommand(context, context.profile),
    //                 ]);
    //             };
    //         },
    //         invite: (invitedProfile: PublicProfile): GroupProtocolFunction => {
    //             return async (initialContext) => {
    //                 return composeGroupProtocolFunctions(initialContext, [
    //                     context => addToGroupAndSendCommand(context, invitedProfile),
    //                     context => sendPrivateInvite(context, invitedProfile),
    //                 ]);
    //             };
    //         },
    //         sendMessage: (message: string): GroupProtocolFunction => {
    //             return async (context) => {
    //                 return sendGroupMessage(context, message);
    //             };
    //         },
    //         receive: (): GroupProtocolFunction => {
    //             return async (context) => {
    //                 return receiveGroupCommands(context);
    //             };
    //         },
    //         receivePrivate: (sender: PublicProfile): GroupProtocolFunction => {
    //             return async (context) => {
    //                 return receivePrivateInvite(context, sender.identity.publicKey as PublicKey);
    //             };
    //         },
    //         sync: (): GroupProtocolFunction => {
    //             return async (initialContext) => {
    //                 return composeGroupProtocolFunctions(initialContext, [
    //                     context => uploadQueuedGroupCommands(context),
    //                     context => receiveGroupCommands(context),
    //                     // context => { Debug.log('GroupProtocol.sync', context.group.timeline); return context.group; },
    //                 ]);
    //             };
    //         },
    //     };

    //     const composeGroupProtocolWithState = async (initialGroupState: GroupProtocolState, actions: GroupProtocolAction[]): Promise<GroupProtocolState> => {
    //         let state = initialGroupState;
    //         for (const action of actions) {
    //             const p = action[0];
    //             const f = action[1];
    //             const profile = state.profiles[p];
    //             const crypto = {
    //                 ...state.encryption,
    //                 signDigest: (digest: number[]) => SwarmHelpers.signDigest(digest, state.profiles[p].identity),
    //                 deriveSharedKey: (publicKey: HexString) => deriveSharedKey(state.profiles[p].identity, {publicKey, address: ''}),
    //                 random: (length: number) => generateDeterministicRandom(length),
    //             };
    //             const context: GroupProtocolContext = {
    //                 storage: state.storage,
    //                 profile,
    //                 crypto,
    //                 group: profile.group,
    //                 privateContexts: [],
    //             };
    //             const updatedGroup = await f(context);
    //             const updatedProfile = {
    //                 ...profile,
    //                 group: updatedGroup,
    //             };
    //             state = {
    //                 ...state,
    //                 profiles: [...state.profiles.slice(0, p), updatedProfile, ...state.profiles.slice(p + 1)],
    //             };
    //         }
    //         debugState(state);
    //         return state;
    //     };

    //     const outputState = await composeGroupProtocolWithState(inputState, [
    //         [Profile.ALICE, GroupProtocol.create('secret' as HexString)],
    //         [Profile.ALICE, GroupProtocol.invite(inputState.profiles[Profile.BOB])],
    //         [Profile.BOB, GroupProtocol.receivePrivate(inputState.profiles[Profile.ALICE])],
    //         [Profile.ALICE, GroupProtocol.sendMessage('hello Bob')],
    //         [Profile.ALICE, GroupProtocol.sync()],
    //         [Profile.BOB, GroupProtocol.sync()],
    //         [Profile.BOB, GroupProtocol.sendMessage('hello Alice')],
    //         [Profile.ALICE, GroupProtocol.sync()],
    //         [Profile.ALICE, GroupProtocol.sendMessage('test')],
    //         [Profile.BOB, GroupProtocol.sync()],
    //         [Profile.BOB, GroupProtocol.invite(inputState.profiles[Profile.CAROL])],
    //         [Profile.ALICE, GroupProtocol.sync()],
    //         [Profile.CAROL, GroupProtocol.receivePrivate(inputState.profiles[Profile.BOB])],
    //         [Profile.BOB, GroupProtocol.sendMessage('hello Carol')],
    //         [Profile.ALICE, GroupProtocol.sync()],
    //         [Profile.BOB, GroupProtocol.sync()],
    //         [Profile.CAROL, GroupProtocol.sync()],
    //     ]);

    //     assertGroupStateInvariants(outputState);

    //     const groupCommands = sortedProfileCommands(outputState.profiles[1]);
    //     const isGroupPost = (groupCommand: GroupCommand): groupCommand is GroupCommandPost & {source: HexString} => groupCommand.type === 'group-command-post';
    //     const groupPosts = groupCommands.map(gcws => gcws as GroupCommand).filter(isGroupPost).map(value => ({...value.post, source: value.source}));
    //     output(groupPosts);
    // })
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
