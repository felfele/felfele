import { keccak256 } from 'js-sha3';

import { Version } from './Version';
import { allTests } from './social/api';
import * as Swarm from './swarm/Swarm';
import { generateUnsecureRandom } from './random';
import { stringToByteArray } from './conversion';

// tslint:disable-next-line:no-var-requires
const fetch = require('node-fetch');

declare var process: {
    argv: string[];
};
declare var global: any;

global.__DEV__ = true;
global.fetch = fetch;

const main = async () => {
    if (process.argv.length > 2) {
        switch (process.argv[2]) {
            case 'version': {
                console.log(Version);
                break;
            }
            case 'api': {
                if (process.argv.length > 3) {
                    const testName = process.argv[3];
                    const test = allTests[testName];
                    await test();
                }
                break;
            }
            case 'swarm': {
                if (process.argv.length > 3) {
                    switch (process.argv[3]) {
                        case 'get': {
                            if (process.argv.length > 4) {
                                const bzzHash = process.argv[4];
                                const data = await Swarm.download(bzzHash);
                                console.log(data);
                            } else {
                                console.log('usage: cli swarm get <bzz-hash>');
                            }
                            break;
                        }
                        case 'sha3': {
                            if (process.argv.length > 4) {
                                const data = process.argv[4];
                                const byteArrayData = stringToByteArray(data);
                                const paddingByteArray: number[] = new Array<number>(4096 - byteArrayData.length);
                                paddingByteArray.fill(0);
                                const hash = keccak256.hex(byteArrayData.concat(paddingByteArray));
                                console.log(hash);
                            } else {
                                console.log('usage: cli swarm sha3 <bzz-hash>');
                            }
                            break;
                        }
                        case 'testId': {
                            const identity = await Swarm.generateSecureIdentity(generateUnsecureRandom);
                            const identityString = `{
                                privateKey: '${identity.privateKey}',
                                publicKey: '${identity.publicKey}',
                                address: '${identity.address}',
                            }`;
                            console.log('Generated identity:', identityString);
                            console.warn('WARNING: This is using unsecure random, use it only for testing, not for production!!!');
                            break;
                        }
                    }
                }
                else {
                    console.log('usage: cli swarm [get | sha3]');
                }
                break;
            }
            default: {
                console.log('usage: cli [version | swarm]');
                break;
            }
        }
    }
};

main().then();
