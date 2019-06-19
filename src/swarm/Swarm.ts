import { keccak256 } from 'js-sha3';
import { ec } from 'elliptic';

import { PublicIdentity, PrivateIdentity } from '../models/Identity';
import { Debug } from '../Debug';
import { safeFetch, safeFetchWithTimeout } from '../Network';
import { hexToByteArray, byteArrayToHex, stringToByteArray } from '../helpers/conversion';
import { Buffer } from 'buffer';
import { Utils } from '../Utils';

export const defaultGateway = 'https://swarm.felfele.com';
export const defaultUrlScheme = '/bzz-raw:/';
export const defaultPrefix = 'bzz:/';
export const defaultFeedPrefix = 'bzz-feed:/';
const hashLength = 64;

const upload = async (data: string, swarmGateway: string): Promise<string> => {
    try {
        const hash = await uploadString(data, swarmGateway);
        Debug.log('upload', {hash});
        return hash;
    } catch (e) {
        Debug.log('upload:', {e});
        throw e;
    }
};

// this is a workaround needed for compatibility with Node.js
interface ExtendedFormData extends FormData {
    getHeaders?: () => string[][];
}

const uploadForm = async (data: ExtendedFormData, swarmGateway: string): Promise<string> => {
    const url = swarmGateway + '/bzz:/';
    const options: RequestInit = {
        headers: {
            ...data.getHeaders != null ? data.getHeaders() : undefined,
            'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
    };
    options.body = data;
    Debug.log('uploadForm', 'url', url, 'options', options);
    const response = await safeFetch(url, options);
    const text = await response.text();
    Debug.log('uploadForm: response: ', text);
    return text;
};

export const isSwarmLink = (link: string): boolean => {
    return link.startsWith(defaultPrefix);
};

export const getSwarmGatewayUrl = (swarmUrl: string, gatewayAddress: string): string => {
    if (isSwarmLink(swarmUrl)) {
        const legacyDefaultPrefix = defaultPrefix + '/';
        const correctSwarmUrl = swarmUrl.startsWith(legacyDefaultPrefix)
            ? swarmUrl.replace(legacyDefaultPrefix, defaultPrefix)
            : swarmUrl
            ;
        return gatewayAddress + defaultUrlScheme + correctSwarmUrl.slice(defaultPrefix.length);
    }
    if (swarmUrl.length === hashLength) {
        return gatewayAddress + defaultUrlScheme + swarmUrl;
    }
    return swarmUrl;
};

export const calculateTopic = (topic: string): string => {
    return '0x' + keccak256.hex(topic);
};

type DefaultMimeType = 'application/octet-stream';

export type MimeType =
    | 'image/jpeg'
    | 'image/png'
    | DefaultMimeType
    ;

export const imageMimeTypeFromFilenameExtension = (path: string): MimeType => {
    if (path.endsWith('jpg')) {
        return 'image/jpeg';
    }
    if (path.endsWith('jpeg')) {
        return 'image/jpeg';
    }
    if (path.endsWith('png')) {
        return 'image/png';
    }
    return 'application/octet-stream';
};

export interface File {
    name: string;
    localPath: string;
    mimeType: MimeType;
}

const uploadFiles = async (files: File[], swarmGateway: string): Promise<string> => {
    if (Utils.isNodeJS()) {
        // avoid metro bundler to try to load the module
        const nodeRequire = require;
        const fs = nodeRequire('fs');
        const data = new FormData();
        for (const file of files) {
            const readStream = fs.createReadStream(file.localPath);
            data.append(file.name, readStream);
        }
        const hash = await uploadForm(data as ExtendedFormData, swarmGateway);
        return defaultPrefix + hash;
    } else {
        const data = new FormData();
        for (const file of files) {
            data.append(file.name, {
                uri: file.localPath,
                type: file.mimeType,
                name: file.name,
            } as any as Blob);
        }
        const hash = await uploadForm(data, swarmGateway);
        return defaultPrefix + hash;
    }
};

const uploadString = async (data: string, swarmGateway: string): Promise<string> => {
    Debug.log('uploadString', {data});
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

const uploadUint8Array = async (data: Uint8Array, swarmGateway: string): Promise<string> => {
    Debug.log('uploadUint8Array', 'data.length', data.length);
    const url = swarmGateway + defaultUrlScheme;
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

const downloadString = async (hash: string, timeout: number, swarmGateway: string): Promise<string> => {
    const url = swarmGateway + '/bzz:/' + hash + '/';
    Debug.log('downloadData', {url});
    const response = await safeFetchWithTimeout(url, undefined, timeout);
    const text = await response.text();
    return text;
};

const fetchArrayBuffer = (url: string, timeout: number): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        request.onload = (event) => {
            const response = request.response as ArrayBuffer;
            if (response != null) {
                resolve(new Uint8Array(response));
            }
        };

        request.onerror = () => reject();
        request.onabort = () => reject();

        if (timeout > 0) {
            setTimeout(() => reject(), timeout);
        }
        request.send();
    });
};

const downloadUint8Array = async (hash: string, timeout: number, swarmGateway: string): Promise<Uint8Array> => {
    const url = swarmGateway + defaultUrlScheme + hash + '/';
    Debug.log('downloadUint8Array', 'url', url);

    const response = await fetchArrayBuffer(url, timeout);
    Debug.log('downloadUint8Array', 'response.length', response.length);
    return response;
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

const calculateFeedAddressQueryString = (address: FeedAddress): string => {
    return `user=${address.user}` + (address.topic === '' ? '' : `&topic=${address.topic}`);
};

const downloadUserFeedTemplate = async (swarmGateway: string, address: FeedAddress): Promise<FeedTemplate> => {
    const addressPart = calculateFeedAddressQueryString(address);
    const response = await downloadFeed(swarmGateway, `bzz-feed:/?${addressPart}&meta=1`);
    const feedUpdateResponse = JSON.parse(response) as FeedTemplate;
    Debug.log('downloadUserFeedTemplate: ', feedUpdateResponse);
    return feedUpdateResponse;
};

const downloadUserFeed = async (swarmGateway: string, address: FeedAddress, timeout: number = 0): Promise<string> => {
    const addressPart = calculateFeedAddressQueryString(address);
    return await downloadFeed(swarmGateway, `bzz-feed:/?${addressPart}`);
};

const downloadUserFeedPreviousVersion = async (swarmGateyay: string, address: FeedAddress, epoch: Epoch): Promise<string> => {
    const addressPart = calculateFeedAddressQueryString(address);
    return await downloadFeed(swarmGateyay, `bzz-feed:/?${addressPart}&time=${epoch.time}`);
};

const downloadFeed = async (swarmGateway: string, feedUri: string, timeout: number = 0): Promise<string> => {
    const url = swarmGateway + '/' + feedUri;
    Debug.log('downloadFeed', {url});
    const response = await safeFetchWithTimeout(url, undefined, timeout);
    const text = await response.text();
    return text;
};

const updateUserFeedWithSignFunction = async (swarmGateway: string, feedTemplate: FeedTemplate, signFeedDigest: FeedDigestSigner, data: string): Promise<FeedTemplate> => {
    const digest = feedUpdateDigest(feedTemplate, data);
    if (digest == null) {
        throw new Error('digest is null');
    }
    const addressPart = calculateFeedAddressQueryString(feedTemplate.feed);
    const signature = await signFeedDigest(digest);
    const url = swarmGateway + `/bzz-feed:/?${addressPart}&level=${feedTemplate.epoch.level}&time=${feedTemplate.epoch.time}&signature=${signature}`;
    Debug.log('updateFeed', {url, data});
    const options: RequestInit = {
        method: 'POST',
        body: data,
    };
    const response = await safeFetch(url, options);
    const text = await response.text();
    Debug.log('updateFeed', {text});

    return feedTemplate;
};

export interface ReadableFeedApi {
    download: (timeout: number) => Promise<string>;
    downloadPreviousVersion: (epoch: Epoch) => Promise<string>;
    downloadFeedTemplate: () => Promise<FeedTemplate>;
    downloadFeed: (feedUri: string, timeout: number) => Promise<string>;
    getUri: () => string;

    readonly address: FeedAddress;
}

export const makeBzzFeedUrl = (address: FeedAddress): string => {
    const addressPart = calculateFeedAddressQueryString(address);
    return defaultFeedPrefix + '?' + addressPart;
};

export const makeFeedAddressFromBzzFeedUrl = (bzzFeedUrl: string): FeedAddress => {
    if (bzzFeedUrl.startsWith('bzz-feed:/?user=')) {
        return {
            topic: '',
            user: bzzFeedUrl.replace('bzz-feed:/?user=', ''),
        };
    }
    return {
        topic: '',
        user: '',
    };
};

export const makeFeedAddressFromPublicIdentity = (publicIdentity: PublicIdentity): FeedAddress => {
    return {
        topic: '',
        user: publicIdentity.address,
    };
};

export const makeReadableFeedApi = (address: FeedAddress, swarmGateway: string = defaultGateway): ReadableFeedApi => ({
    download: async (timeout: number = 0): Promise<string> => downloadUserFeed(swarmGateway, address, timeout),
    downloadPreviousVersion: async (epoch: Epoch) => downloadUserFeedPreviousVersion(swarmGateway, address, epoch),
    downloadFeedTemplate: async () => downloadUserFeedTemplate(swarmGateway, address),
    downloadFeed: async (feedUri: string, timeout: number = 0) => await downloadFeed(swarmGateway, feedUri, timeout),
    getUri: () => `bzz-feed:/?${calculateFeedAddressQueryString(address)}`,
    address,
});

export type FeedDigestSigner = (digest: number[]) => string | Promise<string>;

export interface FeedApi extends ReadableFeedApi {
    updateWithFeedTemplate: (feedTemplate: FeedTemplate, data: string) => Promise<FeedTemplate>;
    update: (data: string) => Promise<FeedTemplate>;
    signFeedDigest: FeedDigestSigner;
}

export const makeFeedApi = (address: FeedAddress, signFeedDigest: FeedDigestSigner, swarmGateway: string = defaultGateway): FeedApi => {
    return {
        ...makeReadableFeedApi(address, swarmGateway),

        updateWithFeedTemplate: async (feedTemplate: FeedTemplate, data) => await updateUserFeedWithSignFunction(swarmGateway, feedTemplate, signFeedDigest, data),
        update: async (data: string): Promise<FeedTemplate> => {
            const feedTemplate = await downloadUserFeedTemplate(swarmGateway, address);
            return await updateUserFeedWithSignFunction(swarmGateway, feedTemplate, signFeedDigest, data);
        },
        signFeedDigest,
    };
};

export interface BzzApi {
    downloadString: (hash: string, timeout: number) => Promise<string>;
    downloadUint8Array: (hash: string, timeout: number) => Promise<Uint8Array>;
    uploadString: (data: string) => Promise<string>;
    uploadUint8Array: (data: Uint8Array) => Promise<string>;
    uploadFiles: (files: File[]) => Promise<string>;
    getGatewayUrl: (swarmUrl: string) => string;
}

export const makeBzzApi = (swarmGateway: string = defaultGateway): BzzApi => {
    return {
        downloadString: (hash: string, timeout: number = 0) => downloadString(hash, timeout, swarmGateway),
        downloadUint8Array: (hash: string, timeout: number = 0) => downloadUint8Array(hash, timeout, swarmGateway),
        uploadString: (data: string) => upload(data, swarmGateway),
        uploadUint8Array: (data: Uint8Array) => uploadUint8Array(data, swarmGateway),
        uploadFiles: (files: File[]) => uploadFiles(files, swarmGateway),
        getGatewayUrl: (swarmUrl: string) => getSwarmGatewayUrl(swarmUrl, swarmGateway),
    };
};

export interface BaseApi {
    readonly swarmGateway: string;
}

export interface WriteableApi extends BaseApi {
    readonly bzz: BzzApi;
    readonly feed: FeedApi;
}

export type Api = WriteableApi;

export const makeApi = (address: FeedAddress, signFeedDigest: FeedDigestSigner, swarmGateway: string): Api => ({
    bzz: makeBzzApi(swarmGateway),
    feed: makeFeedApi(address, signFeedDigest, swarmGateway),
    swarmGateway,
});

export interface ReadableApi extends BaseApi {
    bzz: BzzApi;
    feed: ReadableFeedApi;
}

export const makeReadableApi = (address: FeedAddress, swarmGateway: string): ReadableApi => {
    return {
        bzz: makeBzzApi(swarmGateway),
        feed: makeReadableFeedApi(address, swarmGateway),
        swarmGateway,
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

export const signDigest = (digest: number[], identity: PrivateIdentity) => {
    const curve = new ec('secp256k1');
    const keyPair = curve.keyFromPrivate(Buffer.from(identity.privateKey.substring(2), 'hex'));
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
    const keyPair = curve.genKeyPair({
        entropy: secureRandom,
        entropyEnc: 'hex',
        pers: undefined,
    });
    const privateKey = '0x' + keyPair.getPrivate('hex');
    const publicKey = '0x' + keyPair.getPublic('hex');
    const address = byteArrayToHex(publicKeyToAddress(keyPair.getPublic()));
    return {
        privateKey,
        publicKey,
        address,
    };
};
