import { ContactHelper } from './contactHelpers';
import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import * as Swarm from '../swarm/Swarm';
import { HexString } from './opaqueTypes';
import { hexToByteArray, byteArrayToHex } from './conversion';
import { encrypt, decrypt } from './crypto';

export const createSwarmContactHelper = (
    ownIdentity: PublicIdentity,
    swarmGateway: string,
    generateRandom: (length: number) => Promise<Uint8Array>
): ContactHelper => {
    return {
        read: async (publicIdentity: PublicIdentity, timeout: number) => {
            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(publicIdentity);
            const feed = Swarm.makeReadableFeedApi(feedAddress, swarmGateway);
            const data = await feed.download(timeout);
            return data;
        },
        write: async (privateIdentity: PrivateIdentity, data: string, timeout: number) => {
            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(privateIdentity);
            const signDigest = (digest: number[]) => Swarm.signDigest(digest, privateIdentity);
            const feed = Swarm.makeFeedApi(feedAddress, signDigest, swarmGateway);
            await feed.update(data);
        },
        now: Date.now,
        generateSecureIdentity: async (randomSeed: HexString) => {
            const generateRandomFromSeed = (length: number) =>
                Promise.resolve(new Uint8Array(hexToByteArray(randomSeed)));

            return Swarm.generateSecureIdentity(generateRandomFromSeed);
        },
        generateSecureRandom: async () => {
            const randomBytes = await generateRandom(32);
            return byteArrayToHex(randomBytes, false);
        },
        encrypt: async (data: HexString, key: HexString) => {
            const dataBytes = new Uint8Array(hexToByteArray(data));
            const keyBytes = hexToByteArray(key);
            const encryptedBytes = await encrypt(dataBytes, keyBytes, generateRandom);
            return byteArrayToHex(encryptedBytes, false);
        },
        decrypt: (data: HexString, key: HexString) => {
            const dataBytes = new Uint8Array(hexToByteArray(data));
            const keyBytes = hexToByteArray(key);
            const decryptedBytes = decrypt(dataBytes, keyBytes);
            return byteArrayToHex(decryptedBytes, false);
        },
        ownIdentity,
    };
};
