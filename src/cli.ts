import { keccak256 } from 'js-sha3';

import { Version } from './Version';
import { apiTests } from './social/apiTest';
import { syncTests } from './social/syncTest';
import * as Swarm from './swarm/Swarm';
import { generateUnsecureRandom } from './random';
import { stringToByteArray } from './conversion';
import { Debug } from './Debug';
import commander from 'commander';

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

commander
    .command('version')
    .action(() => output(Version))
    ;

commander
    .command('test [name]')
    .action(async (testName) => {
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
    })
    ;

commander
    .command('swarm <get|sha3|testId|uploadImage> [args...]')
    .action(async (swarmCommand, args) => {
        switch (swarmCommand) {
            case 'get': {
                if (args.length > 0) {
                    const bzzHash = args[0];
                    const bzz = Swarm.makeBzzApi();
                    const data = await bzz.download(bzzHash, 0);
                    output(data);
                } else {
                    output('usage: cli swarm get <bzz-hash>');
                }
                break;
            }
            case 'sha3': {
                if (args.length > 0) {
                    const data = args[0];
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
                if (args.length > 0) {
                    const localPath = args[0];
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
    })
    ;

commander
    .option('-q, --quiet', 'No debug output')
    .parse(process.argv);

if (commander.quiet) {
    Debug.setDebug(false);
}
