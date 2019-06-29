import { getFollowLink, getFeedUrlFromFollowLink } from '../../src/helpers/deepLinking';

test('follow link encoding and decoding', () => {
    const feedUrl = 'bzz://abcdef';
    const followLink = getFollowLink(feedUrl);
    const result = getFeedUrlFromFollowLink(followLink);

    expect(result).toEqual(feedUrl);
});
