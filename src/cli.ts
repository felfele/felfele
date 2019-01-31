import { Version } from './Version';

declare var process: {
    argv: string[];
};

if (process.argv.length > 2) {
    switch (process.argv[2]) {
        case 'version': {
            console.log(Version);
            break;
        }
        default: {
            console.log('usage: cli [version]');
            break;
        }
    }
}
