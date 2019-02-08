import { keccak256 } from 'js-sha3';
import { ec } from 'elliptic';

import { PublicIdentity, PrivateIdentity } from './models/Identity';
import { Debug } from './Debug';
import { safeFetch, safeFetchWithTimeout } from './Network';
import { hexToByteArray, byteArrayToHex, stringToByteArray } from './conversion';
import { Buffer } from 'buffer';

export const DefaultGateway = 'https://swarm.felfele.com';
export const DefaultUrlScheme = '/bzz-raw:/';
export const DefaultPrefix = 'bzz://';
export const DefaultFeedPrefix = 'bzz-feed:/';
export const HashLength = 64;

export const upload = async (data: string, swarmGateway: string = DefaultGateway): Promise<string> => {
    Debug.log('upload: to Swarm: ', data);
    try {
        const hash = await uploadData(data, swarmGateway);
        Debug.log('upload:', 'hash is', hash);
        return hash;
    } catch (e) {
        Debug.log('upload:', 'failed', JSON.stringify(e));
        return '';
    }
};

export const download = async (hash: string, swarmGateway: string = DefaultGateway): Promise<string> => {
    return await downloadData(hash, 0, swarmGateway);
};

export const getUrlFromHash = (hash: string): string => {
    return DefaultGateway + DefaultUrlScheme + hash;
};

const uploadForm = async (data: FormData, swarmGateway: string = DefaultGateway): Promise<string> => {
    Debug.log('uploadForm: ', data);
    const url = swarmGateway + '/bzz:/';
    const options: RequestInit = {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
    };
    options.body = data;
    Debug.log('uploadForm: ', url, options);
    const response = await safeFetch(url, options);
    const text = await response.text();
    Debug.log('uploadForm: response: ', text);
    return text;
};

export const isSwarmLink = (link: string): boolean => {
    return link.startsWith(DefaultPrefix);
};

export const getSwarmGatewayUrl = (swarmUrl: string): string => {
    if (isSwarmLink(swarmUrl)) {
        return DefaultGateway + DefaultUrlScheme + swarmUrl.slice(DefaultPrefix.length);
    }
    if (swarmUrl.length === HashLength) {
        return DefaultGateway + DefaultUrlScheme + swarmUrl;
    }
    return swarmUrl;
};

const imageMimeTypeFromPath = (path: string): string => {
    if (path.endsWith('jpg')) {
        return 'jpeg';
    }
    if (path.endsWith('jpeg')) {
        return 'jpeg';
    }
    if (path.endsWith('png')) {
        return 'png';
    }
    return 'unknown';
};

export const uploadPhoto = async (localPath: string, swarmGateway: string = DefaultGateway): Promise<string> => {
    Debug.log('uploadPhoto: ', localPath);
    const data = new FormData();
    const imageMimeType = imageMimeTypeFromPath(localPath);
    const name = 'photo.' + imageMimeType;
    data.append('photo', {
        uri: localPath,
        type: 'image/' + imageMimeType,
        name,
    } as any as Blob);
    data.append('title', 'photo');

    const hash = await uploadForm(data, swarmGateway);
    return DefaultPrefix + hash + '/' + name;
};

const uploadData = async (data: string, swarmGateway: string = DefaultGateway): Promise<string> => {
    Debug.log('uploadData: ', data);
    const url = swarmGateway + '/bzz:/';
    const options: RequestInit = {
        headers: {
            'Content-Type': 'text/plain',
        },
        method: 'POST',
    };
    options.body = data;
    const response = await safeFetch(url, options);
    const text = await response.text();
    return text;
};

export const downloadData = async (hash: string, timeout: number = 0, swarmGateway: string = DefaultGateway): Promise<string> => {
    const url = swarmGateway + '/bzz:/' + hash + '/';
    Debug.log('downloadData:', url);
    const response = await safeFetchWithTimeout(url, undefined, timeout);
    const text = await response.text();
    return text;
};

export const DefaultEpoch = {
    time: 0,
    level: 0,
};

export interface Epoch {
    time: number;
    level: number;
}

export interface FeedAddress {
    topic: string;
    user: string;
}

interface FeedTemplate {
    feed: FeedAddress;
    epoch: Epoch;
    protocolVersion: number;
}

export const downloadUserFeedTemplate = async (identity: PublicIdentity): Promise<FeedTemplate> => {
    const url = DefaultGateway + `/bzz-feed:/?user=${identity.address}&meta=1`;
    Debug.log('downloadUserFeedTemplate: ', url);
    const response = await safeFetch(url);
    const feedUpdateResponse = await response.json() as FeedTemplate;
    Debug.log('downloadUserFeedTemplate: ', feedUpdateResponse);
    return feedUpdateResponse;
};

export const updateUserFeed = async (feedTemplate: FeedTemplate, identity: PrivateIdentity, data: string): Promise<FeedTemplate> => {
    const digest = feedUpdateDigest(feedTemplate, data);

    if (digest == null) {
        throw new Error('digest is null');
    }
    const signature = signDigest(digest, identity);
    const url = DefaultGateway + `/bzz-feed:/?topic=${feedTemplate.feed.topic}&user=${identity.address}&level=${feedTemplate.epoch.level}&time=${feedTemplate.epoch.time}&signature=${signature}`;
    Debug.log('updateFeed: ', url, data);
    const options: RequestInit = {
        method: 'POST',
        body: data,
    };
    const response = await safeFetch(url, options);
    const text = await response.text();
    Debug.log('updateFeed: ', text);

    return feedTemplate;
};

export const downloadUserFeed = async (identity: PublicIdentity): Promise<string> => {
    return await downloadFeed(`bzz-feed:/?user=${identity.address}`);
};

export const downloadUserFeedPreviousVersion = async (address: string, epoch: Epoch): Promise<string> => {
    return await downloadFeed(`bzz-feed:/?user=${address}&time=${epoch.time}`);
};

export const downloadFeed = async (feedUri: string, timeout: number = 0): Promise<string> => {
    const url = DefaultGateway + '/' + feedUri;
    Debug.log('downloadFeed: ', url);
    const response = await safeFetchWithTimeout(url, undefined, timeout);
    const text = await response.text();
    return text;
};

export interface FeedApi {
    download: () => Promise<string>;
    downloadPreviousVersion: (epoch: Epoch) => Promise<string>;
    downloadFeedTemplate: () => Promise<FeedTemplate>;
    updateWithFeedTemplate: (feedTemplate: FeedTemplate, data: string) => Promise<FeedTemplate>;
    update: (data: string) => Promise<FeedTemplate>;
    downloadFeed: (feedUri: string) => Promise<string>;
    getUri: () => string;
}

export const makeFeedApi = (identity: PrivateIdentity): FeedApi => {
    return {
        download: async (): Promise<string> => downloadUserFeed(identity),
        downloadPreviousVersion: async (epoch: Epoch) => downloadUserFeedPreviousVersion(identity.address, epoch),
        downloadFeedTemplate: async () => downloadUserFeedTemplate(identity),
        updateWithFeedTemplate: async (feedTemplate: FeedTemplate, data) => await updateUserFeed(feedTemplate, identity, data),
        update: async (data: string): Promise<FeedTemplate> => {
            const feedTemplate = await downloadUserFeedTemplate(identity);
            return await updateUserFeed(feedTemplate, identity, data);
        },
        downloadFeed: async (feedUri: string) => await downloadFeed(feedUri),
        getUri: () => `bzz-feed:/?user=${identity.address}`,
    };
};

export interface BzzApi {
    download: (hash: string) => Promise<string>;
    upload: (data: string) => Promise<string>;
    uploadPhoto: (localPath: string) => Promise<string>;
}

export const makeBzzApi = (swarmGateway: string = DefaultGateway): BzzApi => {
    return {
        download: (hash: string) => download(hash, swarmGateway),
        upload: (data: string) => upload(data, swarmGateway),
        uploadPhoto: (localPath: string) => uploadPhoto(localPath, swarmGateway),
    };
};

export interface Api {
    bzz: BzzApi;
    feed: FeedApi;
}

export const makeApi = (identity: PrivateIdentity, swarmGateway: string = DefaultGateway): Api => {
    return {
        bzz: makeBzzApi(swarmGateway),
        feed: makeFeedApi(identity),
    };
};

const topicLength = 32;
const userLength = 20;
const timeLength = 7;
const levelLength = 1;
const headerLength = 8;
const updateMinLength = topicLength + userLength + timeLength + levelLength + headerLength;

function feedUpdateDigest(feedTemplate: FeedTemplate, data: string): number[] {
    const digestData = feedUpdateDigestData(feedTemplate, data);
    Debug.log('updateUserFeed', 'digest', byteArrayToHex(digestData));
    return keccak256.array(digestData);
}

function feedUpdateDigestData(feedTemplate: FeedTemplate, data: string): number[] {
    const dataBytes = stringToByteArray(data);

    const buf = new ArrayBuffer(updateMinLength + dataBytes.length);
    const view = new DataView(buf);
    let cursor = 0;

    view.setUint8(cursor, feedTemplate.protocolVersion); // first byte is protocol version.
    cursor += headerLength; // leave the next 7 bytes (padding) set to zero

    const topicArray = hexToByteArray(feedTemplate.feed.topic);
    topicArray.forEach((v) => {
        view.setUint8(cursor, v);
        cursor++;
    });

    const userArray = hexToByteArray(feedTemplate.feed.user);
    userArray.forEach((v) => {
        view.setUint8(cursor, v);
        cursor++;
    });

    // time is little endian
    const timeBuf = new ArrayBuffer(4);
    const timeView = new DataView(timeBuf);
    // view.setUint32(cursor, o.time);
    timeView.setUint32(0, feedTemplate.epoch.time);
    const timeBufArray = new Uint8Array(timeBuf);
    for (let i = 0; i < 4; i++) {
        view.setUint8(cursor, timeBufArray[3 - i]);
        cursor++;
    }

    for (let i = 0; i < 3; i++) {
        view.setUint8(cursor, 0);
        cursor++;
    }

    // cursor += 4;
    view.setUint8(cursor, feedTemplate.epoch.level);
    cursor++;

    dataBytes.forEach((v) => {
        view.setUint8(cursor, v);
        cursor++;
    });

    const numArray = new Array<number>();
    const uint8Array = new Uint8Array(buf);
    for (let i = 0; i < uint8Array.byteLength; i++) {
        numArray.push(uint8Array[i]);
    }

    return numArray;
}

const calculateRecovery = (rec: string): string => {
    switch (rec) {
        case '1b': return '00';
        case '1c': return '01';
        case '1d': return '02';
        case '1e': return '03';
    }
    throw new Error('invalid recovery: ' + rec);
};

function publicKeyToAddress(pubKey: any) {
    const pubBytes = pubKey.encode();
    return keccak256.array(pubBytes.slice(1)).slice(12);
}

const signDigest = (digest: number[], identity: PrivateIdentity) => {
    const curve = new ec('secp256k1');
    const keyPair = curve.keyFromPrivate(new Buffer(identity.privateKey.substring(2), 'hex'));
    const sigRaw = curve.sign(digest, keyPair, { canonical: true, pers: undefined });
    const partialSignature = sigRaw.r.toArray().concat(sigRaw.s.toArray());
    if (sigRaw.recoveryParam != null) {
        const signature = partialSignature.concat(sigRaw.recoveryParam);
        return byteArrayToHex(signature);
    }
    throw new Error('signDigest recovery param was null');
};

export const generateSecureIdentity = async (generateRandom: (length: number) => Promise<Uint8Array>): Promise<PrivateIdentity> => {
    const secureRandomUint8Array = await generateRandom(32);
    const secureRandom = byteArrayToHex(secureRandomUint8Array).substring(2);
    const curve = new ec('secp256k1');
    const keyPair = await curve.genKeyPair({
        entropy: secureRandom,
        entropyEnc: 'hex',
        pers: undefined,
    });
    Debug.log('generateSecureIdentity: ', keyPair, secureRandom);
    const privateKey = '0x' + keyPair.getPrivate('hex');
    const publicKey = '0x' + keyPair.getPublic('hex');
    const address = byteArrayToHex(publicKeyToAddress(keyPair.getPublic()));
    return {
        privateKey,
        publicKey,
        address,
    };
};
