import { keccak256 } from 'js-sha3';

import { Version } from './Version';
import { apiTests } from './social/apiTest';
import { syncTests } from './social/syncTest';
import * as Swarm from './swarm/Swarm';
import { generateUnsecureRandom } from './random';
import { stringToByteArray } from './conversion';
import { Debug } from './Debug';

// tslint:disable-next-line:no-var-requires
const fetch = require('node-fetch');

// tslint:disable-next-line:no-var-requires
const FormData = require('form-data');

declare var process: {
    argv: string[];
    env: any;
};
declare var global: any;

global.__DEV__ = true;
global.fetch = fetch;
global.FormData = FormData;

// tslint:disable-next-line:no-console
const output = console.log;

Debug.setDebug(true);

const main = async () => {
    if (process.argv.length > 2) {
        switch (process.argv[2]) {
            case 'version': {
                output(Version);
                break;
            }
            case 'api': {
                if (process.argv.length > 3) {
                    const testName = process.argv[3];
                    const allTests: any = {
                        ...apiTests,
                        ...syncTests,
                    };
                    if (testName === 'allTests') {
                        for (const test of Object.keys(allTests)) {
                            output('\nRunning test: ', test);
                            await allTests[test]();
                        }
                    } else {
                        const test = allTests[testName];
                        await test();
                    }
                }
                break;
            }
            case 'swarm': {
                if (process.argv.length > 3) {
                    switch (process.argv[3]) {
                        case 'get': {
                            if (process.argv.length > 4) {
                                const bzzHash = process.argv[4];
                                const bzz = Swarm.makeBzzApi();
                                const data = await bzz.download(bzzHash, 0);
                                output(data);
                            } else {
                                output('usage: cli swarm get <bzz-hash>');
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
                                output(hash);
                            } else {
                                output('usage: cli swarm sha3 <bzz-hash>');
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
                            output('Generated identity:', identityString);
                            output('WARNING: This is using unsecure random, use it only for testing, not for production!!!');
                            break;
                        }
                        case 'uploadImage': {
                            if (process.argv.length > 4) {
                                const localPath = process.argv[4];
                                const swarmGateway = process.env.SWARM_GATEWAY || Swarm.defaultGateway;
                                const bzz = Swarm.makeBzzApi(swarmGateway);
                                const files: Swarm.File[] = [
                                    {
                                        name: 'image',
                                        localPath,
                                        mimeType: Swarm.imageMimeTypeFromFilenameExtension(localPath),
                                    },
                                ];
                                const hash = await bzz.uploadFiles(files);
                                output(hash);
                            } else {
                                output('usage: cli swarm uploadImage <path-to-image>');
                            }
                            break;
                        }
                    }
                }
                else {
                    output('usage: cli swarm [get | sha3]');
                }
                break;
            }
            default: {
                output('usage: cli [version | swarm]');
                break;
            }
        }
    }
};

main().then();
