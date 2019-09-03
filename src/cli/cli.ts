import { keccak256 } from 'js-sha3';

import { Version } from '../Version';
import { apiTests } from '../social/apiTest';
import { syncTests } from '../social/syncTest';
import * as Swarm from '../swarm/Swarm';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { stringToByteArray } from '../helpers/conversion';
import { Debug } from '../Debug';
import { parseArguments, addOption } from './cliParser';
import { feedCommandDefinition } from './feedCommands';
import { output, setOutput, jsonPrettyPrint } from './cliHelpers';
import { swarmConfig } from './swarmConfig';
import { RSSFeedManager } from '../RSSPostManager';
import * as urlUtils from '../helpers/urlUtils';
import { fetchOpenGraphData } from '../helpers/openGraph';
import { fetchHtmlMetaData } from '../helpers/htmlMetaData';
import { protocolTestCommandDefinition as protocolCommandDefinition } from './protocolCommands';
import { swarmHelperTests } from './swarmHelperTest';
import { privateSharingTests } from '../protocols/privateSharingTest';
import { deriveSharedKey } from '../helpers/contactHelpers';

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

Debug.setDebugMode(false);
Debug.showTimestamp = true;

const definitions =
    addOption('-q, --quiet', 'quiet mode', () => setOutput(() => {}))
    .
    addOption('-v, --verbose', 'verbose mode', () => Debug.setDebugMode(true))
    .
    addOption('-n, --no-colors', 'no colors in output', () => Debug.useColors = false)
    .
    addCommand('version', 'Print app version', () => output(Version))
    .
    addCommand('test [name]', 'Run integration tests', async (testName) => {
            const allTests: any = {
                ...apiTests,
                ...syncTests,
                ...swarmHelperTests,
                ...privateSharingTests,
            };
            if (process.env.SWARM_GATEWAY != null) {
                output('Running with SWARM at', process.env.SWARM_GATEWAY);
            }
            if (testName == null) {
                for (const test of Object.keys(allTests)) {
                    output('Running test:', test);
                    await allTests[test]();
                    if (Debug.isDebugMode) {
                        output('Finished test:', test, '\n\n');
                    }
                }
                output(`${Object.keys(allTests).length} tests passed succesfully`);
            } else {
                const test = allTests[testName];
                output('\nRunning test: ', testName);
                await test();
            }
    })
    .addCommand('bugreport [endpoint]', 'Send bugreport to endpoint', async (endpoint) => {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'text/plain',
            },
            method: 'POST',
            body: 'Bugreport',
        });
    })
    .addCommand('swarm', 'Swarm related commands',
        addOption('--gateway <address>', 'Swarm gateway address', (gatewayAddress) => swarmConfig.gatewayAddress = gatewayAddress)
        .
        addCommand('get <hash>', 'Download the data by hash', async (hash: string) => {
            const bzz = Swarm.makeBzzApi(swarmConfig.gatewayAddress);
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
            output('Generated identity:', jsonPrettyPrint(identity));
            output('WARNING: This is using unsecure random, use it only for testing, not for production!!!');
        })
        .
        addCommand('uploadImage <path-to-image>', 'Upload an image to Swarm', async (localPath) => {
            const bzz = Swarm.makeBzzApi(swarmConfig.gatewayAddress);
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
        addCommand('feed', 'Swarm Feed related commands', feedCommandDefinition)
    )
    .
    addCommand('rss <url>', 'Fetch RSS feed of url', async (url: string) => {
        const canonicalUrl = urlUtils.getCanonicalUrl(url);
        const feed = await RSSFeedManager.fetchFeedFromUrl(canonicalUrl);
        output('rss feed', {feed});
    })
    .
    addCommand('opengraph <url>', 'Fetch OpenGraph data of url', async (url: string) => {
        const canonicalUrl = urlUtils.getHttpsUrl(urlUtils.getCanonicalUrl(url));
        const data = await fetchOpenGraphData(canonicalUrl);
        output({data});
    })
    .
    addCommand('metadata <url>', 'Fetch metadata of url', async (url: string) => {
        const canonicalUrl = urlUtils.getHttpsUrl(urlUtils.getCanonicalUrl(url));
        const data = await fetchHtmlMetaData(canonicalUrl);
        output({data});
    })
    .
    addCommand('protocol', 'Test protocols', protocolCommandDefinition)
    .
    addCommand('timing [num]', '', async (optionalNum?: string) => {
        const num = parseInt(optionalNum != null
            ? optionalNum
            : '1'
        , 10);
        const testIdentity = {
            privateKey: '0xebe044bec1031e8e2fa494620dce3e50111a9f5336c358dc08d4d785e4c62ead',
            publicKey: '0x029fbcea33cea864a1b6ec940dd6ba5d7b5d38f4cfe4da7cfc4bc6072bfc750e36',
            address: '0x30117e1b4aadfe67956c0b0ce844d1cee202382a',
        };
        const contactIdentity = {
            privateKey: '0x75c5d37dd6b51cc6b69ab1003993ac8a05d2abb94851f4bdabb2cbf8ce391d1e',
            publicKey: '0x036aa0c5e02b03d0eb63629fdd22fa88386ef86ee34fb2fe253d0ec68c0323f5e8',
            address: '0xa62061e671a5aaf1e62197912064c3e0777ed049',
        };
        const startDate = Date.now();
        for (let i = 0; i < num; i++) {
            const sharedSecret = deriveSharedKey(testIdentity, contactIdentity);
        }
        const endDate = Date.now();
        output(`Number of iterations: ${num}, elapsed: ${endDate - startDate}`);
    })
;

parseArguments(process.argv, definitions, output, output);
