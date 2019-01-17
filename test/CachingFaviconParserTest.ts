import { CachingFaviconParserStatic } from '../src/CachingFaviconParser';

const mockFetchCreator  = (result: string) =>
    jest.fn(url => ({text: () => Promise.resolve(result)}));

test('Basic favicon test', async () => {
    const url = 'https://www.github.com';
    const expected = 'https://github.githubassets.com/favicon.ico';
    const mockFetch = mockFetchCreator(`<html><head><link rel="icon" href="${expected}" ></head></html`);
    const result = await new CachingFaviconParserStatic().getFavicon(url, mockFetch);

    expect(mockFetch.mock.calls.length).toBe(1);
    expect(result).toBe(expected);
});

test('Basic favicon caching test', async () => {
    const url = 'https://www.github.com';
    const expected = 'https://github.githubassets.com/favicon.ico';
    const mockFetch = mockFetchCreator(`<html><head><link rel="icon" href="${expected}" ></head></html`);
    const cachingFaviconParser = new CachingFaviconParserStatic();
    const result1 = await cachingFaviconParser.getFavicon(url, mockFetch);
    const result2 = await cachingFaviconParser.getFavicon(url, mockFetch);

    expect(mockFetch.mock.calls.length).toBe(1);
    expect(result1).toBe(expected);
    expect(result2).toBe(expected);
});
