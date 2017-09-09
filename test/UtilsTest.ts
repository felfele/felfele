import { Utils } from '../src/Utils';

beforeEach(() => {
    
});

afterEach(() => {
});

test('Test human hostname', async () => {
    const input = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const expectedResult = 'noaa.gov';
    const result = Utils.getHumanHostname(input);

    expect(result).toBe(expectedResult);
})

test('Test human hostname with numeric address', async () => {
    const input = 'http://192.168.1.49:2368/untitled-15/';
    const expectedResult = '1.49';
    const result = Utils.getHumanHostname(input);

    expect(result).toBe(expectedResult);
})

test('Test base url', async () => {
    const input = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/';
    const result = Utils.getBaseUrl(input);

    expect(result).toBe(expectedResult);
})

test('Test base url without protocol', async () => {
    const input = '//www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/';
    const result = Utils.getBaseUrl(input);

    expect(result).toBe(expectedResult);
})

test('Test url creation from urn', async () => {
    const baseUrl = 'https://www.gfdl.noaa.gov/';
    const urn = '/global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const result = Utils.createUrlFromUrn(urn, baseUrl);

    expect(result).toBe(expectedResult);
})

test('Test url creation from urn without trailing slash', async () => {
    const baseUrl = 'https://www.gfdl.noaa.gov/';
    const urn = 'global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const result = Utils.createUrlFromUrn(urn, baseUrl);

    expect(result).toBe(expectedResult);
})

test('Test url creation from urn without ending and trailing slash', async () => {
    const baseUrl = 'https://www.gfdl.noaa.gov';
    const urn = 'global-warming-and-hurricanes/';
    const expectedResult = 'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/';
    const result = Utils.createUrlFromUrn(urn, baseUrl);

    expect(result).toBe(expectedResult);
})

test('Test canonical url', () => {
    const inputs = ['example.com', '//example.com', 'https://example.com', 'https://example.com/'];
    const expectedResult = 'https://example.com/';

    for (const input of inputs) {
        const result = Utils.getCanonicalUrl(input);
        expect(result).toBe(expectedResult);
    }
})

test('Test canonical url with path', () => {
    const inputs = ['example.com/1', '//example.com/1', 'https://example.com/1'];
    const expectedResult = 'https://example.com/1';

    for (const input of inputs) {
        const result = Utils.getCanonicalUrl(input);
        expect(result).toBe(expectedResult);
    }
})
