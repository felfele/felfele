import { Utils } from '../src/Utils';

test('Test human hostname', async () => {
    const input = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const expectedResult = 'noaa.gov';
    const result = Utils.getHumanHostname(input);

    expect(result).toBe(expectedResult);
});

test('Test human hostname with numeric address', async () => {
    const input = 'http://192.168.1.49:2368/untitled-15/';
    const expectedResult = '1.49';
    const result = Utils.getHumanHostname(input);

    expect(result).toBe(expectedResult);
});

test('Test base url', async () => {
    const input = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/';
    const result = Utils.getBaseUrl(input);

    expect(result).toBe(expectedResult);
});

test('Test base url without protocol', async () => {
    const input = '//www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/';
    const result = Utils.getBaseUrl(input);

    expect(result).toBe(expectedResult);
});

test('Test url creation from urn', async () => {
    const baseUrl = 'https://www.gfdl.noaa.gov/';
    const urn = '/global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const result = Utils.createUrlFromUrn(urn, baseUrl);

    expect(result).toBe(expectedResult);
});

test('Test url creation from urn without trailing slash', async () => {
    const baseUrl = 'https://www.gfdl.noaa.gov/';
    const urn = 'global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const result = Utils.createUrlFromUrn(urn, baseUrl);

    expect(result).toBe(expectedResult);
});

test('Test url creation from urn without ending and trailing slash', async () => {
    const baseUrl = 'https://www.gfdl.noaa.gov';
    const urn = 'global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const result = Utils.createUrlFromUrn(urn, baseUrl);

    expect(result).toBe(expectedResult);
});

test('Test canonical url', () => {
    const inputs = ['example.com', '//example.com', 'https://example.com', 'https://example.com/'];
    const expectedResult = 'https://example.com/';

    for (const input of inputs) {
        const result = Utils.getCanonicalUrl(input);
        expect(result).toBe(expectedResult);
    }
});

test('Test canonical url with path', () => {
    const inputs = ['example.com/1', '//example.com/1', 'https://example.com/1'];
    const expectedResult = 'https://example.com/1';

    for (const input of inputs) {
        const result = Utils.getCanonicalUrl(input);
        expect(result).toBe(expectedResult);
    }
});

test('Test getLinkFromText with https link', () => {
    const link = 'https://swarm-gateways.net/';
    const input = `Lorem ipsum ${link}`;
    const result = Utils.getLinkFromText(input);

    expect(result).toBe(link);
});

test('Test getLinkFromText with https link in a sentence', () => {
    const link = 'https://swarm-gateways.net/';
    const input = `Lorem ipsum ${link} dolor sit amet`;
    const result = Utils.getLinkFromText(input);

    expect(result).toBe(link);
});

test('Test getLinkFromText with bzz-feed link', () => {
    const link = 'bzz-feed:/?user=0x2668dd69812af4fdf63b241acbb62051308de4df';
    const input = `Lorem ipsum ${link}`;
    const result = Utils.getLinkFromText(input);

    expect(result).toBe(link);
});

test('Test getLinkFromText with bzz link', () => {
    const link = 'bzz://ebe1491e2e3463c11af327b1bd26e5f6f1e04b9daaecb02c8ce774bc090cc7d4';
    const input = `Lorem ipsum ${link}`;
    const result = Utils.getLinkFromText(input);

    expect(result).toBe(link);
});
