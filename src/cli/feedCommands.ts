import { addOption } from './cliParser';
import * as Swarm from '../swarm/Swarm';
import { makeSwarmPostStorage, makeSwarmPostStorageSyncer } from '../swarm-social/swarmStorage';
import { output, jsonPrettyPrint } from './cliHelpers';
import { swarmConfig } from './swarmConfig';
import { PrivateIdentity } from '../models/Identity';
import { shareNewPost, emptyPostCommandLog, RecentPostFeed } from '../social/api';
import { Post } from '../models/Post';

import fs from 'fs';
import { generateUnsecureRandomHexString } from '../helpers/unsecureRandom';
import { hexToByteArray, byteArrayToHex } from '../helpers/conversion';
import { keccak256 } from 'js-sha3';
import { HexString } from '../helpers/opaqueTypes';
// @ts-ignore
import Identicon from 'identicon.js';
import { Debug } from '../Debug';

let privateIdentityFromFile: PrivateIdentity | undefined;
const loadIdentityFile = (filename: string) => {
    const data = fs.readFileSync(filename).toString();
    privateIdentityFromFile = JSON.parse(data) as PrivateIdentity;
};
const getPrivateIdentity = (): PrivateIdentity | undefined => privateIdentityFromFile;

const throwError = (msg: string): never => {
    throw new Error(msg);
};

const createDeterministicRandomGenerator = (randomSeed: HexString): () => string => {
    return () => {
        const randomSeedBytes = hexToByteArray(randomSeed);
        randomSeed = byteArrayToHex(keccak256.array(randomSeedBytes), false);
        return randomSeed;
    };
};

export const feedCommandDefinition =
    addOption('-i, --identity <identity-file>', 'Identity file', (identityFile) => loadIdentityFile(identityFile))
    .
    addCommand('list [user]', 'List feed', async (optionalUser) => {
        const privateIdentity = getPrivateIdentity();
        const user = optionalUser != null
            ? optionalUser
            : privateIdentity != null
                ? privateIdentity.address
                : throwError('user is not provided')
        ;
        const feedAddress: Swarm.FeedAddress = {
            topic: '',
            user,
        };
        const dummySigner = (digest: number[]) => '';
        const swarmApi = Swarm.makeApi(feedAddress, dummySigner, swarmConfig.gatewayAddress);
        const storageApi = makeSwarmPostStorage(swarmApi);
        const recentPostFeed = await storageApi.downloadRecentPostFeed(0);
        output('Recent post feed', jsonPrettyPrint(recentPostFeed));

        output('Posts:');
        const postCommandLog = await storageApi.downloadPostCommandLog();
        output(jsonPrettyPrint(postCommandLog.commands));
    })
    .
    addCommand('create <name> [image]', 'Create new feed', async (name, localPath) => {
        const privateIdentity = getPrivateIdentity() || throwError('missing identity file, please provide one with the -i option');
        const feedAddress: Swarm.FeedAddress = {
            topic: '',
            user: privateIdentity.address,
        };
        const signer = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
        const swarmApi = Swarm.makeApi(feedAddress, signer, swarmConfig.gatewayAddress);
        const storageApi = makeSwarmPostStorage(swarmApi);
        const address = Swarm.makeFeedAddressFromPublicIdentity(privateIdentity);
        const feedUrl = Swarm.makeBzzFeedUrl(address);
        const recentPostFeed: RecentPostFeed = {
            posts: [],
            authorImage: {
                localPath,
            },
            name,
            url: feedUrl,
            feedUrl: feedUrl,
            favicon: '',
        };
        await storageApi.uploadRecentPostFeed(emptyPostCommandLog, recentPostFeed);
    })
    .
    addCommand('post <markdown> [image-files...]', 'Share a new post in an existing feed', async (markdownText, image) => {
        const privateIdentity = getPrivateIdentity() || throwError('missing identity file, please provide one with the -i option');
        const feedAddress: Swarm.FeedAddress = {
            topic: '',
            user: privateIdentity.address,
        };
        const source = generateUnsecureRandomHexString(32);
        const signer = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
        const swarmApi = Swarm.makeApi(feedAddress, signer, swarmConfig.gatewayAddress);
        const storageApi = makeSwarmPostStorage(swarmApi);
        const storageSyncApi = makeSwarmPostStorageSyncer(storageApi);
        const recentPostFeed = await storageApi.downloadRecentPostFeed(0);
        const post: Post = {
            text: markdownText,
            images: [],
            createdAt: Date.now(),
            author: {
                image: recentPostFeed.authorImage,
                name: recentPostFeed.name,
                uri: recentPostFeed.url,
            },
        };
        const postCommandLog = shareNewPost(post, source, emptyPostCommandLog);
        const storageSyncUpdate = await storageSyncApi.sync(postCommandLog, recentPostFeed);
        output('Updated the feed', storageSyncUpdate.updatedPosts.length);
    })
    .
    addCommand('sharePublicKey', 'Share the public key in the feed', async () => {
        const privateIdentity = getPrivateIdentity() || throwError('missing identity file, please provide one with the -i option');
        const feedAddress: Swarm.FeedAddress = {
            topic: '',
            user: privateIdentity.address,
        };
        const signer = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
        const swarmApi = Swarm.makeApi(feedAddress, signer, swarmConfig.gatewayAddress);
        const storageApi = makeSwarmPostStorage(swarmApi);
        const recentPostFeed = await storageApi.downloadRecentPostFeed(0);
        const publicRecentPostFeed = {
            ...recentPostFeed,
            publicKey: privateIdentity.publicKey,
        };
        await storageApi.uploadRecentPostFeed(emptyPostCommandLog, publicRecentPostFeed);
    })
    .
    addCommand('createMany [numFeeds] [numPosts]', 'Create feeds with posts', async (numFeedsArg, numPostsArg) => {
        const numFeeds = parseInt(numFeedsArg, 10);
        const numPosts = parseInt(numPostsArg, 10);

        const syncFunctions: Promise<PrivateIdentity | undefined>[] = [];

        const randomSeed = generateUnsecureRandomHexString(32);
        const nextRandom = createDeterministicRandomGenerator(randomSeed);
        const generateDeterministicRandom = async (length: number) => {
            const randomString = nextRandom();
            const randomBytes = new Uint8Array(hexToByteArray(randomString)).slice(0, length);
            return randomBytes;
        };
        const generateRandomName = (length: number = 10, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') => {
            const randomBytes = hexToByteArray(nextRandom()).slice(0, length);
            const chars = randomBytes.map(byte => alphabet[Math.floor(byte / 256 * alphabet.length)]);
            return chars.join('');
        };
        for (let f = 0; f < numFeeds; f++) {
            const privateIdentity = await Swarm.generateSecureIdentity(generateDeterministicRandom);
            const identiconHash = byteArrayToHex(keccak256.array(privateIdentity.publicKey), false);
            const identiconData = new Identicon(identiconHash, {size: 16, margin: 0.2}).toString();
            const identiconUri = `data:image/png;base64,${identiconData}`;
            const address = Swarm.makeFeedAddressFromPublicIdentity(privateIdentity);
            const signer = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
            const swarmApi = Swarm.makeApi(address, signer, swarmConfig.gatewayAddress);
            const storageApi = makeSwarmPostStorage(swarmApi);
            const storageSyncApi = makeSwarmPostStorageSyncer(storageApi);
            const feedUrl = Swarm.makeBzzFeedUrl(address);
            const authorName = generateRandomName();
            const authorImage = {
                uri: identiconUri,
            };
            const recentPostFeed: RecentPostFeed = {
                posts: [],
                authorImage,
                name: authorName,
                url: feedUrl,
                feedUrl: feedUrl,
                favicon: '',
                publicKey: privateIdentity.publicKey,
            };

            let postCommandLog = emptyPostCommandLog;
            const author = {
                name: authorName,
                image: authorImage,
                uri: feedUrl,
            };
            for (let p = 0; p < numPosts; p++) {
                const post: Post = {
                    text: `Post ${p} of Author ${f}`,
                    images: [],
                    createdAt: Date.now(),
                    author,
                };
                postCommandLog = shareNewPost(post, '', postCommandLog);
            }
            const safeSync = async () => {
                try {
                    output(`Syncing ${f}`);
                    const storageSyncUpdate = await storageSyncApi.sync(postCommandLog, recentPostFeed);
                    return privateIdentity;
                } catch (e) {
                    output('Error', e);
                    return undefined;
                }
            };

            syncFunctions.push(safeSync());
        }
        const isIdentity = (identity?: PrivateIdentity): identity is PrivateIdentity => identity != null;
        const result = await Promise.all(syncFunctions);
        const identities = result.filter(isIdentity);
        output(JSON.stringify(identities));
        const numErrors = numFeeds - identities.length;
        Debug.log(`number of errors: ${numErrors}`);
    })
;
