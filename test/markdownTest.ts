import { markdownEscape, markdownUnescape } from '../src/markdown';

test('Basic markdown escape', () => {
    const markdownText = '#hashtag';
    const escapedText = '\\' + markdownText;
    const result = markdownEscape(markdownText);

    expect(result).toEqual(escapedText);
});

test('Basic markdown unescape', () => {
    const markdownText = '\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).toEqual(unescapedText);
});
