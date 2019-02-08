import { markdownEscape, markdownUnescape } from '../src/markdown';

test('markdown should escape words starting with a hashtag with two backslash', () => {
    const markdownText = '#hashtag';
    const escapedText = '\\' + markdownText;
    const result = markdownEscape(markdownText);

    expect(result).toEqual(escapedText);
});

test('markdown should not escape words starting with two backslashes and a hashtag', () => {
    const markdownText = '#hashtag';
    const escapedText = '\\' + markdownText;
    const preResult = markdownEscape(markdownText);
    const result = markdownEscape(preResult);

    expect(result).toEqual(escapedText);
});

// why equal?
test('markdown should not unescape hashtag preceded by one backslash', () => {
    const markdownText = '\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).not.toEqual(unescapedText);
});

test('markdown should unescape hashtag preceded by two backslash', () => {
    const markdownText = '\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).toEqual(unescapedText);
});

// why equal?
test('markdown should not unescape hashtag preceded by three backslash', () => {
    const markdownText = '\\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).not.toEqual(unescapedText);
});

test('markdown should not unescape hashtag preceded by four backslash', () => {
    const markdownText = '\\\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).not.toEqual(unescapedText);
});
