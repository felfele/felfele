import { keccak256 } from 'js-sha3';

import { Version } from './Version';
import { testSharePost, testSharePosts, testListAllPosts } from './social/api';
import * as Swarm from './Swarm';

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
            case 'testSharePost': {
                await testSharePost();
                break;
            }
            case 'testSharePosts': {
                await testSharePosts();
                break;
            }
            case 'testListAllPosts': {
                await testListAllPosts();
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
                                const hash = keccak256.hex(data);
                                console.log(hash);
                            } else {
                                console.log('usage: cli swarm sha3 <bzz-hash>');
                            }
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
