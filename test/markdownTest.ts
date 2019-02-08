import { markdownEscape, markdownUnescape } from '../src/markdown';

test('Basic markdown escape', () => {
    const markdownText = '#hashtag';
    const escapedText = '\\' + markdownText;
    const result = markdownEscape(markdownText);

    expect(result).toEqual(escapedText);
});

test('double markdown escape', () => {
    const markdownText = '#hashtag';
    const escapedText = '\\' + markdownText;
    const preResult = markdownEscape(markdownText);
    const result = markdownEscape(preResult);

    expect(result).toEqual(escapedText);
});

// why equal?
test('Basic markdown unescape', () => {
    const markdownText = '\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).not.toEqual(unescapedText);
});

test('Basic markdown unescape', () => {
    const markdownText = '\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).toEqual(unescapedText);
});

// why equal?
test('Does not unescape other starting text', () => {
    const markdownText = '\\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).not.toEqual(unescapedText);
});

test('Does not unescape other starting text', () => {
    const markdownText = '\\\\#hashtag';
    const unescapedText = '#hashtag';
    const result = markdownUnescape(markdownText);

    expect(result).not.toEqual(unescapedText);
});
