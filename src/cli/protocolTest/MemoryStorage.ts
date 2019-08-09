import { Debug } from '../../Debug';
import { keyDerivationFunction } from '../../helpers/groupHelpers';
import { stringToByteArray, byteArrayToHex, stripHexPrefix } from '../../helpers/conversion';
import { HexString } from '../../helpers/opaqueTypes';
import { Storage, StorageFeeds } from './Storage';

export class MemoryStorageFeeds<T> implements StorageFeeds<T> {
    private feeds: {[name: string]: T} = {};

    public write = async (address: HexString, topic: HexString, data: T) => {
        const name = stripHexPrefix(address) + '/' + stripHexPrefix(topic);
        Debug.log('\n--> SwarmFeeds.write', {address, name, data});
        this.feeds[name] = data;
    }

    public read = async (address: HexString, topic: HexString) => {
        if (address === '') {
            Debug.log('\n<-- SwarmFeeds.read', 'address is empty');
            throw new Error('address is empty');
        }
        const name = stripHexPrefix(address) + '/' + stripHexPrefix(topic);
        const data = this.feeds[name];
        Debug.log('\n<-- SwarmFeeds.read', {address, name, data});
        return data;
    }
}

export class MemoryStorage implements Storage<string> {
    public readonly feeds = new MemoryStorageFeeds<string>();
    private store: {[hash: string]: string} = {};

    public write = async (data: string): Promise<HexString> => {
        const hash = byteArrayToHex(keyDerivationFunction([new Uint8Array(stringToByteArray(data))]), false);
        this.store[hash] = data;
        Debug.log('Swarm.write', {data, hash});
        return hash;
    }

    public read = async (hash: HexString): Promise<string> => {
        const data = this.store[hash];
        Debug.log('Swarm.read', {data, hash});
        return data;
    }
}
