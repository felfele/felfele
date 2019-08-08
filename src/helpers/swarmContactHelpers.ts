// @ts-ignore
import * as utf8 from 'utf8-encoder';

import { ContactHelper, ContactRandomHelper, ProfileData } from './contactHelpers';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import * as Swarm from '../swarm/Swarm';
import { HexString } from './opaqueTypes';
import { hexToByteArray, byteArrayToHex } from './conversion';
import { encrypt, decrypt } from './crypto';
import { SECOND } from '../DateUtils';
import { Utils } from '../Utils';
import { Debug } from '../Debug';
import { PublicProfile } from '../models/Profile';
import { ZERO_TOPIC } from '../swarm/Swarm';

export const createSwarmContactRandomHelper = (
    generateRandom: (length: number) => Promise<Uint8Array>
): ContactRandomHelper => ({
    generateSecureIdentity: async (randomSeed: HexString) => {
        const generateRandomFromSeed = (length: number) =>
            Promise.resolve(new Uint8Array(hexToByteArray(randomSeed)));

        return Swarm.generateSecureIdentity(generateRandomFromSeed);
    },
    generateSecureRandom: async () => {
        const randomBytes = await generateRandom(32);
        return byteArrayToHex(randomBytes, false);
    },
});

export const createSwarmContactHelper = (
    profile: PublicProfile,
    swarmGateway: string,
    generateRandom: (length: number) => Promise<Uint8Array>,
    isCanceled: () => boolean = () => false,
): ContactHelper => {
    return {
        ...createSwarmContactRandomHelper(generateRandom),

        read: async (publicIdentity: PublicIdentity, timeout: number) => {
            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(publicIdentity);
            const feed = Swarm.makeReadableFeedApi(feedAddress, swarmGateway);
            const startTime = Date.now();
            const pollTimeout = 1 * SECOND;
            const maxTries = (timeout / pollTimeout) + 1;
            let numErrors = 0;
            while (Date.now() <= startTime + timeout && numErrors < maxTries) {
                const beforeRead = Date.now();
                try {
                    const data = await feed.download(pollTimeout);
                    return data;
                } catch (e) {
                    numErrors += 1;
                    const waited = await Utils.waitUntil(beforeRead + pollTimeout, Date.now());
                    Debug.log('readWithTimeout', {address: publicIdentity.address, waited, numErrors});
                }
                if (isCanceled()) {
                    throw new Error('SwarmContactHelper.read: canceled');
                }
            }
            throw new Error('SwarmContactHelper.read: timeout');
        },
        write: async (privateIdentity: PrivateIdentity, data: string, timeout: number) => {
            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(privateIdentity, ZERO_TOPIC);
            const signDigest = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
            const feed = Swarm.makeFeedApi(feedAddress, signDigest, swarmGateway);
            const feedTemplate: Swarm.FeedTemplate = {
                feed: feedAddress,
                epoch: {
                    time: Math.floor(Date.now() / 1000),
                    level: 25,
                },
                protocolVersion: 0,
            };
            Debug.log('swarmContactHelpers.write', feedTemplate);
            await feed.updateWithFeedTemplate(feedTemplate, data);
        },
        encrypt: async (data: string, key: HexString) => {
            const dataBytes = utf8.fromString(data);
            const keyBytes = hexToByteArray(key);
            const encryptedBytes = await encrypt(dataBytes, keyBytes, generateRandom);
            return byteArrayToHex(encryptedBytes, false);
        },
        decrypt: (data: HexString, key: HexString): string => {
            const dataBytes = new Uint8Array(hexToByteArray(data));
            const keyBytes = hexToByteArray(key);
            const decryptedBytes = decrypt(dataBytes, keyBytes);
            Debug.log('decrypt', decryptedBytes);
            return utf8.toString(decryptedBytes);
        },
        ownIdentity: profile.identity,
        profileData: {
            name: profile.name,
            image: profile.image,
        },
    };
};
