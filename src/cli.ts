import { Version } from './Version';
import { testSharePost } from './social/api';

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
            default: {
                console.log('usage: cli [version]');
                break;
            }
        }
    }
};

main().then();
