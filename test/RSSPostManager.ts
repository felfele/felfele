import { RSSPostManager } from '../src/RSSPostManager';

beforeEach(() => {
});

afterEach(() => {
});

test('Parse CDATA descriptions from RSS', async () => {
    const text = 'text';
    const description = `<![CDATA[${text}]]>`;
    const expectedResult = text;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse image from RSS', async () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<img src="${link}" alt="">`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse CDATA descriptions containing an image from RSS', async () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<![CDATA[<p><img src="${link}" alt=""></p>]]>`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse html with image', () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<p><img src="${link}" alt=""></p>`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse image from markdown', () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/07/photo-33.jpg'
    const markdown = `![](${link})`;
    const expectedResult = ['', [{uri: link}]];

    const result = RSSPostManager.extractTextAndImagesFromMarkdown(markdown, '');

    expect(result).toEqual(expectedResult);
})

test('Parse link', () => {
    const hostname = 'example.com';
    const link = `http://${hostname}/content/2017/08/`;
    const description = `<a href="${link}">description</a>`;
    const expectedResult = `[description](${link}) _(${hostname})_`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})
