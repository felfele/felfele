import { ec } from 'elliptic';
import { Debug } from '../../Debug';
import { publicKeyToAddress } from './flowTestHelpers';
import { keyDerivationFunction } from '../../helpers/groupHelpers';
import { stringToByteArray, byteArrayToHex, stripHexPrefix } from '../../helpers/conversion';
import { HexString } from '../../helpers/opaqueTypes';

export class SwarmFeeds {
    private feeds: {[name: string]: any} = {};

    public write = (keyPair: ec.KeyPair, topic: HexString, data: any) => {
        const address = publicKeyToAddress(keyPair.getPublic());
        const privateKey = keyPair.getPrivate() ? keyPair.getPrivate('hex') : null;
        const name = keyPair.getPublic(true, 'hex') + '/' + stripHexPrefix(topic);
        Debug.log('\n--> SwarmFeeds.write', {address, privateKey, name, data});
        if (keyPair.getPrivate() == null) {
            throw new Error('missing private key');
        }
        this.feeds[name] = data;
    }

    public read = (keyPair: ec.KeyPair, topic: HexString): any | undefined => {
        const address = publicKeyToAddress(keyPair.getPublic());
        const name = keyPair.getPublic(true, 'hex') + '/' + stripHexPrefix(topic);
        const data = this.feeds[name];
        Debug.log('\n<-- SwarmFeeds.read', {address, name, data});
        return data;
    }
}

export class Swarm {
    public readonly feeds: SwarmFeeds = new SwarmFeeds();
    private store: {[hash: string]: string} = {};

    public write = (data: string): HexString => {
        const hash = byteArrayToHex(keyDerivationFunction([new Uint8Array(stringToByteArray(data))]), false);
        this.store[hash] = data;
        Debug.log('Swarm.write', {data, hash});
        return hash;
    }

    public read = (hash: HexString): string => {
        const data = this.store[hash];
        Debug.log('Swarm.read', {data, hash});
        return data;
    }
}
