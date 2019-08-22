import { Debug } from '../../Debug';
import { cryptoHash } from '../../protocols/group';
import { byteArrayToHex, stripHexPrefix } from '../../helpers/conversion';
import { HexString } from '../../helpers/opaqueTypes';
import { ProtocolStorage, ProtocolStorageFeeds } from '../../protocols/ProtocolStorage';

export class MemoryStorageFeeds implements ProtocolStorageFeeds {
    private feeds: {[name: string]: string} = {};

    public write = async (address: HexString, topic: HexString, data: string) => {
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

export class MemoryStorage implements ProtocolStorage {
    public readonly feeds = new MemoryStorageFeeds();
    private store: {[hash: string]: Uint8Array} = {};

    public write = async (data: Uint8Array): Promise<HexString> => {
        const hash = byteArrayToHex(cryptoHash([data]), false);
        this.store[hash] = data;
        Debug.log('Swarm.write', {hash});
        return hash;
    }

    public read = async (hash: HexString): Promise<Uint8Array> => {
        const data = this.store[hash];
        Debug.log('Swarm.read', {hash});
        return data;
    }
}
