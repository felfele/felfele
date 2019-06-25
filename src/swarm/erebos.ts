import { FeedAddress, defaultGateway, Epoch } from './Swarm';
import { DirectoryData, UploadOptions, SignBytesFunc } from '@erebos/api-bzz-browser/node_modules/@erebos/api-bzz-base';
import Bzz from '@erebos/api-bzz-browser';
import { Debug } from '../Debug';
import { SwarmHelpers } from '../swarm-social/swarmStorage';

export const defaultUrlScheme = '/bzz-raw:/';
export const defaultPrefix = 'bzz:/';
export const defaultFeedPrefix = 'bzz-feed:/';
const hashLength = 64;

interface FeedTemplate {
    feed: FeedAddress;
    epoch: Epoch;
    protocolVersion: number;
}

export class ErebosSwarm {
    private bzz: Bzz;
    constructor(
        public signBytes: SignBytesFunc,
        public readonly address: FeedAddress,
        public swarmGateway = defaultGateway,
        bzz: Bzz | null = null,
    ) {
        this.bzz = bzz || new Bzz({ url: `${this.swarmGateway}/`, signBytes });
    }

    public getUri = () => `bzz-feed:/?${calculateFeedAddressQueryString(this.address)}`;

    public uploadDirectory = async (directory: DirectoryData, options?: UploadOptions): Promise<string> => {
        return await this.bzz.uploadDirectory(directory, options);
    }

    public upload = async (data: string): Promise<string> => {
        return await this.bzz.upload(data);
    }

    public download = async (hash: string, timeout: number): Promise<string> => {
        const response = await this.bzz.download(hash, { timeout });
        return response.text();
    }

    public downloadFeedFromUrl = async (url: string, timeout: number): Promise<string> => {
        Debug.log('DOWNLOAD FEED 1', url);
        const user = url.split('=')[1];
        const response = await this.bzz.getFeedChunk({ user }, { timeout });
        Debug.log('DOWNLOAD FEED 4', response);
        return response.text();
    }

    public downloadPreviousVersion = async (epoch: Epoch, timeout: number): Promise<string> => {
        const response = await this.bzz.getFeedChunk({ ...this.address, time: epoch.time }, { timeout });
        Debug.log('DOWNLOAD FEED 4', response);
        return response.text();
    }

    public downloadFeedFromAddress = async (address: FeedAddress, timeout: number): Promise<string> => {
        const response = await this.bzz.getFeedChunk({ ...address }, { timeout });
        Debug.log('DOWNLOAD FEED 4', response);
        return response.text();
    }
    public setFeedContent = async (data: string): Promise<string> => {
        return await this.bzz.setFeedContent({
            ...this.address,
        }, data);
    }

    // public downloadUserFeedTemplate = async (address: FeedAddress): Promise<FeedTemplate> => {
    //     const addressPart = calculateFeedAddressQueryString(address);
    //     const response = await this.bzz.getFeedContent({
    //         ...address,
    //     });
    //     if (response != null && response.body != null) {
    //         const feedUpdateResponse = await response.json() as FeedTemplate;
    //         Debug.log('downloadUserFeedTemplate: ', feedUpdateResponse);
    //         return feedUpdateResponse;
    //     }
    //     throw Error();
    // }

    public downloadUserFeedTemplate = async (): Promise<FeedTemplate> => {
        return this.bzz.getFeedMetadata({
            ...this.address,
        });
    }

    public isSwarmLink = (link: string): boolean => {
        return link.startsWith(defaultPrefix);
    }

    public getGatewayUrl = (swarmUrl: string): string => {
        if (this.isSwarmLink(swarmUrl)) {
            const legacyDefaultPrefix = defaultPrefix + '/';
            const correctSwarmUrl = swarmUrl.startsWith(legacyDefaultPrefix)
                ? swarmUrl.replace(legacyDefaultPrefix, defaultPrefix)
                : swarmUrl
                ;
            return this.swarmGateway + defaultUrlScheme + correctSwarmUrl.slice(defaultPrefix.length);
        }
        if (swarmUrl.length === hashLength) {
            return this.swarmGateway + defaultUrlScheme + swarmUrl;
        }
        return swarmUrl;
    }
}

const calculateFeedAddressQueryString = (address: FeedAddress): string => {
    return `user=${address.user}` + (address.topic === '' ? '' : `&topic=${address.topic}`);
};
