import { ec } from 'elliptic';
import { Debug } from '../../Debug';
import { publicKeyToAddress } from './flowTestHelpers';

export class SwarmFeeds {
    private feeds: {[name: string]: any} = {};

    public write = (keyPair: ec.KeyPair, topic: string, data: any) => {
        const address = publicKeyToAddress(keyPair.getPublic());
        const privateKey = keyPair.getPrivate() ? keyPair.getPrivate('hex') : null;
        const name = keyPair.getPublic('hex') + '/' + topic;
        Debug.log('\n--> SwarmFeeds.write', {address, privateKey, name, data});
        if (keyPair.getPrivate() == null) {
            throw new Error('missing private key');
        }
        this.feeds[name] = data;
    }

    public read = (keyPair: ec.KeyPair, topic: string): any | undefined => {
        const address = publicKeyToAddress(keyPair.getPublic());
        const name = keyPair.getPublic('hex') + '/' + topic;
        const data = this.feeds[name];
        Debug.log('\n<-- SwarmFeeds.read', {address, name, data});
        return data;
    }
}
