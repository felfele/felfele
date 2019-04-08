import { addOption } from './cliParser';
import * as Swarm from '../swarm/Swarm';
import { makeSwarmStorage, makeSwarmStorageSyncer } from '../swarm-social/swarmStorage';
import { output, jsonPrettyPrint } from './cliHelpers';
import { swarmConfig } from './swarmConfig';
import { PrivateIdentity } from '../models/Identity';
import { shareNewPost, emptyPostCommandLog, RecentPostFeed } from '../social/api';
import { Post } from '../models/Post';

import fs from 'fs';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';

let privateIdentityFromFile: PrivateIdentity | undefined;
const loadIdentityFile = (filename: string) => {
    const data = fs.readFileSync(filename).toString();
    privateIdentityFromFile = JSON.parse(data) as PrivateIdentity;
};
const getPrivateIdentity = (): PrivateIdentity | undefined => privateIdentityFromFile;

const throwError = (msg: string): never => {
    throw new Error(msg);
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
        const storageApi = makeSwarmStorage(swarmApi);
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
        const storageApi = makeSwarmStorage(swarmApi);
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
        const source = '';
        const signer = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
        const swarmApi = Swarm.makeApi(feedAddress, signer, swarmConfig.gatewayAddress);
        const storageApi = makeSwarmStorage(swarmApi);
        const storageSyncApi = makeSwarmStorageSyncer(storageApi);
        const recentPostFeed = await storageApi.downloadRecentPostFeed(0);
        const post: Post = {
            text: markdownText,
            images: [],
            createdAt: Date.now(),
        };
        const postCommandLog = shareNewPost(post, source, emptyPostCommandLog);
        const storageSyncUpdate = storageSyncApi.sync(postCommandLog, recentPostFeed);
        output('Updated the feed');
    })
;
