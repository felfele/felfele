import {
    makeContactFromRecentPostFeed,
    makeBzzFeedUrlFromIdentity,
} from '../../src/helpers/feedHelpers';
import { RecentPostFeed } from '../../src/social/api';

const testIdentityA = {
    publicKey: '0x025ce06535cae2ba367dc3c79363a3eb1ace4b7e77c80afe48ff5c5b18dcd694ee',
    address: '0xad694fb8caa01944cdcb55aa10ca9156a223fac3',
};
const testFeedUrlA = makeBzzFeedUrlFromIdentity(testIdentityA);

const testIdentityB = {
    publicKey: '0x031d4d92816ce57e3be52cc3843e9fdd1432723e7169aa73c5bbe4549f321b3d3d',
    address: '0x5b1d86d64fbab664b00ed35d2c739fdf2db17ea3',
};

test('make contact from RecentPostFeed fails when there is no public key', () => {
    const feed: RecentPostFeed = {
        name: 'name',
        url: '',
        feedUrl: '',
        favicon: '',
        posts: [],
        authorImage: {},
    };
    const result = makeContactFromRecentPostFeed(feed);

    expect(result).toBeUndefined();
});

test('make contact from RecentPostFeed fails when the public key is empty', () => {
    const feed: RecentPostFeed = {
        name: 'name',
        url: '',
        feedUrl: '',
        favicon: '',
        posts: [],
        authorImage: {},
        publicKey: '',
    };
    const result = makeContactFromRecentPostFeed(feed);

    expect(result).toBeUndefined();
});

test('make contact from RecentPostFeed fails when the public key does not match the user address', () => {
    const feedUrl = testFeedUrlA;
    const feed: RecentPostFeed = {
        name: 'name',
        url: '',
        feedUrl,
        favicon: '',
        posts: [],
        authorImage: {},
        publicKey: testIdentityB.publicKey,
    };
    const result = makeContactFromRecentPostFeed(feed);

    expect(result).toBeUndefined();
});

test('make contact from RecentPostFeed succeeds when the public key does match the user address', () => {
    const feedUrl = testFeedUrlA;
    const feed: RecentPostFeed = {
        name: 'name',
        url: '',
        feedUrl,
        favicon: '',
        posts: [],
        authorImage: {},
        publicKey: testIdentityA.publicKey,
    };
    const result = makeContactFromRecentPostFeed(feed);

    expect(result).toBeDefined();
    if (result != null) {
        expect(result.identity).toEqual(testIdentityA);
    }
});
