import { Debug } from '../../Debug';
import { HexString } from '../../helpers/opaqueTypes';
import { ProtocolStorage, ProtocolStorageFeeds } from '../../protocols/ProtocolStorage';
import * as Swarm from '../../swarm/Swarm';

export class SwarmStorageFeeds implements ProtocolStorageFeeds {
    public constructor(readonly swarmFeedApi: Swarm.FeedApi) {}

    public write = async (address: HexString, topic: HexString, data: string, signFeedDigest: Swarm.FeedDigestSigner = this.swarmFeedApi.signFeedDigest) => {
        const feedAddress: Swarm.FeedAddress = {
            user: address,
            topic,
        };
        const feed = Swarm.makeFeedApi(feedAddress, signFeedDigest, this.swarmFeedApi.swarmGateway);
        await feed.update(data);
    }

    public read = async (address: HexString, topic: HexString) => {
        const feedAddress: Swarm.FeedAddress = {
            user: address,
            topic,
        };
        const feed = Swarm.makeReadableFeedApi(feedAddress, this.swarmFeedApi.swarmGateway);
        try {
            const data = await feed.download(0);
            return data;
        } catch (e) {
            return undefined;
        }
    }
}

export class SwarmStorage implements ProtocolStorage {
    public readonly feeds = new SwarmStorageFeeds(this.swarm.feed);

    public constructor(readonly swarm: Swarm.Api) {}

    public write = async (data: Uint8Array): Promise<HexString> => {
        const hash = await this.swarm.bzz.uploadUint8Array(data) as HexString;
        return hash;
    }

    public read = async (hash: HexString): Promise<Uint8Array> => {
        const data = await this.swarm.bzz.downloadUint8Array(hash, 0);
        return data;
    }
}
