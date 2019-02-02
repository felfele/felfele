import { keccak256 } from 'js-sha3';
import { ec } from 'elliptic';

import { PublicIdentity, PrivateIdentity } from './models/Identity';
import { Debug } from './Debug';
import { safeFetch, safeFetchWithTimeout } from './Network';

export const DefaultGateway = 'https://swarm-gateways.net';
export const DefaultUrlScheme = '/bzz-raw:/';
export const DefaultPrefix = 'bzz://';
export const DefaultFeedPrefix = 'bzz-feed:/';
export const HashLength = 64;

export const upload = async (data: string): Promise<string> => {
    Debug.log('upload to Swarm: ', data);
    try {
        const hash = await uploadData(data);
        Debug.log('hash is ', hash);
        return hash;
    } catch (e) {
        Debug.log('upload to Swarm failed: ', JSON.stringify(e));
        return '';
    }
};

export const download = async (hash: string): Promise<string> => {
    return await downloadData(hash);
};

export const getUrlFromHash = (hash: string): string => {
    return DefaultGateway + DefaultUrlScheme + hash;
};

export const uploadForm = async (data: FormData): Promise<string> => {
    Debug.log('uploadForm: ', data);
    const url = DefaultGateway + '/bzz:/';
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

export const uploadPhoto = async (localPath: string): Promise<string> => {
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

    const hash = await uploadForm(data);
    return DefaultPrefix + hash + '/' + name;
};

export const uploadData = async (data: string): Promise<string> => {
    Debug.log('uploadData: ', data);
    const url = DefaultGateway + '/bzz:/';
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

export const downloadData = async (hash: string, timeout: number = 0): Promise<string> => {
    const url = DefaultGateway + '/bzz:/' + hash + '/';
    const response = await safeFetchWithTimeout(url, undefined, timeout);
    const text = await response.text();
    return text;
};

interface FeedTemplate {
    feed: {
        topic: string;
        user: string;
    };
    epoch: {
        time: number;
        level: number;
    };
    protocolVersion: number;
}

export const downloadUserFeedTemplate = async (identity: PublicIdentity): Promise<FeedTemplate> => {
    const url = DefaultGateway + `/bzz-feed:/?user=${identity.address}&meta=1`;
    Debug.log('downloadFeedTemplate: ', url);
    const response = await safeFetch(url);
    const feedUpdateResponse = await response.json() as FeedTemplate;
    Debug.log('downloadFeedTemplate: ', feedUpdateResponse);
    return feedUpdateResponse;
};

export const updateUserFeed = async (feedTemplate: FeedTemplate, identity: PrivateIdentity, data: string) => {
    const digest = feedUpdateDigest(feedTemplate, data);

    if (digest == null) {
        throw new Error('digest is null');
    }
    const signature = signDigest(digest, identity);
    const url = DefaultGateway + `/bzz-feed:/?topic=${feedTemplate.feed.topic}&user=${identity.address}&level=${feedTemplate.epoch.level}&time=${feedTemplate.epoch.time}&signature=${signature}`;
    Debug.log('updateFeed: ', url);
    const options: RequestInit = {
        method: 'POST',
        body: data,
    };
    const response = await safeFetch(url, options);
    const text = await response.text();
    Debug.log('updateFeed: ', text);

    return '';
};

export const downloadUserFeed = async (identity: PublicIdentity): Promise<string> => {
    return await downloadFeed(`bzz-feed:/?user=${identity.address}`);
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
    update: (data: string) => Promise<void>;
    downloadFeed: (feedUri: string) => Promise<string>;
    getUri: () => string;
}

export const makeFeedApi = (identity: PrivateIdentity): FeedApi => {
    return {
        download: async (): Promise<string> => downloadUserFeed(identity),
        update: async (data: string): Promise<void> => {
            const feedTemplate = await downloadUserFeedTemplate(identity);
            await updateUserFeed(feedTemplate, identity, data);
        },
        downloadFeed: async (feedUri: string) => await downloadFeed(feedUri),
        getUri: () => `bzz-feed:/?user=${identity.address}`,
    };
};

const topicLength = 32;
const userLength = 20;
const timeLength = 7;
const levelLength = 1;
const headerLength = 8;
const updateMinLength = topicLength + userLength + timeLength + levelLength + headerLength;

export const hexToString = (hex: string): string => {
    const byteArray = hexToByteArray(hex);
    return byteArrayToString(byteArray);
};

const byteArrayToStringBuiltin = (byteArray: number[]): string => {
    if (String.fromCodePoint != null) {
        return String.fromCodePoint.apply(null, byteArray);
    } else {
        return String.fromCharCode.apply(null, byteArray);
    }
};

export const byteArrayToString = (byteArray: number[]): string => {
    const maxSize = 256;
    let index = 0;
    let result = '';
    while (index < byteArray.length) {
        const slice = byteArray.slice(index, index + maxSize);
        result += byteArrayToStringBuiltin(slice);
        index += slice.length;
    }
    return result;
};

export const stringToHex = (s: string) => byteArrayToHex(stringToByteArray(s));

// cheekily borrowed from https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
export const byteArrayToHex = (byteArray: number[] | Uint8Array): string => {
    return '0x' + Array.from(byteArray, (byte) => {
        // tslint:disable-next-line:no-bitwise
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};

// equally cheekily borrowed from https://stackoverflow.com/questions/17720394/javascript-string-to-byte-to-string
export const stringToByteArray = (str: string): number[] => {
    const result = new Array<number>();
    for (let i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
    }
    return result;
};

export const hexToByteArray = (hex: string): number[] => {
    const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
    const subStrings: string[] = [];
    for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        subStrings.push(hexWithoutPrefix.substr(i, 2));
    }
    return subStrings.map(s => parseInt(s, 16));
};

const isHexStrict = (s: string): boolean => {
    if (!s.startsWith('0x')) {
        return false;
    }
    if (s.length < 4) {
        return false;
    }
    if (s.length % 2 === 1) {
        return false;
    }
    const legalChars: string = '0123456789aAbBcCdDeEfF';
    for (let i = 2; i < s.length; i++) {
        if (!legalChars.includes(s.charAt(i))) {
            return false;
        }
    }
    return true;
};

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

function publicKeyToAddress(pubKey) {
    const pubBytes = pubKey.encode();
    return keccak256.array(pubBytes.slice(1)).slice(12);
}

const signDigest = (digest: number[], identity: PrivateIdentity) => {
    const curve = new ec('secp256k1');
    const keyPair = curve.keyFromPrivate(identity.privateKey.substring(2));
    const privateKey = keyPair.getPrivate();
    const sigRaw = curve.sign(digest, privateKey, { canonical: true });
    const signature = sigRaw.r.toArray().concat(sigRaw.s.toArray()).concat(sigRaw.recoveryParam);
    return byteArrayToHex(signature);
};

export const generateSecureIdentity = async (generateRandom: (length: number) => Promise<Uint8Array>): Promise<PrivateIdentity> => {
    const secureRandomUint8Array = await generateRandom(32);
    const secureRandom = byteArrayToHex(secureRandomUint8Array).substring(2);
    const curve = new ec('secp256k1');
    const keyPair = await curve.genKeyPair({
        entropy: secureRandom,
        entropyEnc: 'hex',
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
