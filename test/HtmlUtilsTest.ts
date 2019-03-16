import { HtmlUtils } from '../src/HtmlUtils';

test('match html attributes', () => {
    const mimeType = 'application/rss+xml';
    const matcher = [{name: 'type', value: mimeType}];
    const link = {
        attrs: [
            {
                name: 'type',
                value: mimeType,
            },
        ],
    };
    const result = HtmlUtils.matchAttributes(link, matcher);

    expect(result).toBe(true);
});

test('find path in html document', () => {
    const html =
    `
    <html>
        <head>
            <link>
    `;
    const document = HtmlUtils.parse(html);
    const links = HtmlUtils.findPath(document, ['html', 'head', 'link']);

    expect(links.length).toBe(1);
});
