import { getFelfeleLinkFromClipboardData } from '../../src/helpers/feedInfoHelper';

describe('getFelfeleLinkFromClipboard', () => {
    it('returns undefined for http link', () => {
        const clipboardData = 'http://index.hu';
        const result = getFelfeleLinkFromClipboardData(clipboardData);
        expect(result).toBe(undefined);
    });

    it('returns undefined for https link', () => {
        const clipboardData = 'https://index.hu';
        const result = getFelfeleLinkFromClipboardData(clipboardData);
        expect(result).toBe(undefined);
    });

    it('returns undefined for web link without protocol', () => {
        const clipboardData = 'index.hu';
        const result = getFelfeleLinkFromClipboardData(clipboardData);
        expect(result).toBe(undefined);
    });

    it('returns original link for follow link', () => {
        const clipboardData = 'https://app.felfele.org/follow/some_random_string';
        const result = getFelfeleLinkFromClipboardData(clipboardData);
        expect(result).toBe(clipboardData);
    });

    it('returns original link for bzz feed link', () => {
        const clipboardData = 'bzz-feed:/?user=0xdbbac89704424c90dce46043686c743f0d9dbdda';
        const result = getFelfeleLinkFromClipboardData(clipboardData);
        expect(result).toBe(clipboardData);
    });
});
