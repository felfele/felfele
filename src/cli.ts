import { keccak256 } from 'js-sha3';

import { Version } from './Version';
import { apiTests } from './social/apiTest';
import { syncTests } from './social/syncTest';
import * as Swarm from './swarm/Swarm';
import { generateUnsecureRandom } from './helpers/unsecureRandom';
import { stringToByteArray } from './helpers/conversion';
import { Debug } from './Debug';
import { parseArguments, addOption } from './cliParser';
import { makeSwarmStorage } from './swarm-social/swarmStorage';

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
let output = console.log;
Debug.setDebug(false);
let swarmGateway = process.env.SWARM_GATEWAY || Swarm.defaultGateway;
const jsonPrettyPrint = (obj: any) => JSON.stringify(obj, null, 4);

const definitions =
    addOption('-q, --quiet', 'quiet mode', () => output = () => {})
    .
    addOption('-v, --verbose', 'verbose mode', () => Debug.setDebug(true))
    .
    addCommand('version', 'Print app version', () => output(Version))
    .
    addCommand('test [name]', 'Run integration tests', async (testName) => {
            const allTests: any = {
                ...apiTests,
                ...syncTests,
            };
            if (testName == null) {
                for (const test of Object.keys(allTests)) {
                    output('\nRunning test: ', test);
                    await allTests[test]();
                }
            } else {
                const test = allTests[testName];
                output('\nRunning test: ', testName);
                await test();
            }
    })
    .addCommand('swarm', 'Swarm related commands',
        addOption('--gateway <address>', 'Swarm gateway address', (gatewayAddress) => swarmGateway = gatewayAddress)
        .
        addCommand('get <hash>', 'Download the data by hash', async (hash: string) => {
            const bzz = Swarm.makeBzzApi(swarmGateway);
            const data = await bzz.downloadString(hash, 0);
            output(data);
        })
        .
        addCommand('sha3 <input>', 'Generate SHA3 hash of input', (input) => {
            const byteArrayData = stringToByteArray(input);
            const paddingByteArray: number[] = new Array<number>(4096 - byteArrayData.length);
            paddingByteArray.fill(0);
            const hash = keccak256.hex(byteArrayData.concat(paddingByteArray));
            output(hash);
        })
        .
        addCommand('testId', 'Generate a test identity', async () => {
            const identity = await Swarm.generateSecureIdentity(generateUnsecureRandom);
            const identityString = `{
                privateKey: '${identity.privateKey}',
                publicKey: '${identity.publicKey}',
                address: '${identity.address}',
            }`;
            output('Generated identity:', identityString);
            output('WARNING: This is using unsecure random, use it only for testing, not for production!!!');
        })
        .
        addCommand('uploadImage <path-to-image>', 'Upload an image to Swarm', async (localPath) => {
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
        })
        .
        addCommand('feed <user>', 'List feed', async (user) => {
            const feedAddress: Swarm.FeedAddress = {
                topic: '',
                user,
            };
            const dummySigner = (digest: number[]) => '';
            const swarmApi = Swarm.makeApi(feedAddress, dummySigner, swarmGateway);
            const storageApi = makeSwarmStorage(swarmApi);
            const recentPostFeed = await storageApi.downloadRecentPostFeed(0);
            output('Recent post feed', jsonPrettyPrint(recentPostFeed));

            output('Posts:');
            const postCommandLog = await storageApi.downloadPostCommandLog();
            output(jsonPrettyPrint(postCommandLog.commands));
        })
    )
;

parseArguments(process.argv, definitions, output, output);
