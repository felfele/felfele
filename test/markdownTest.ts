import { markdownEscape, markdownUnescape } from '../src/markdown';

const complexText = `
# Contributor Covenant Code of Conduct

## Our Standards

*Examples* of *behavior* that contributes to creating a positive environment
_include_:

* Using welcoming and inclusive language
* Being _respectful_ of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

- Using welcoming and inclusive language
- Being _respectful_ of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members
`;

const complexTextEscaped = `
\\\# Contributor Covenant Code of Conduct

\\\#\\\# Our Standards

\\\*Examples\\\* of \\\*behavior\\\* that contributes to creating a positive environment
\\\_include\\\_:

\\\* Using welcoming and inclusive language
\\\* Being \\\_respectful\\\_ of differing viewpoints and experiences
\\\* Gracefully accepting constructive criticism
\\\* Focusing on what is best for the community
\\\* Showing empathy towards other community members

\\\- Using welcoming and inclusive language
\\\- Being \\\_respectful\\\_ of differing viewpoints and experiences
\\\- Gracefully accepting constructive criticism
\\\- Focusing on what is best for the community
\\\- Showing empathy towards other community members
`;

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

test('Long text markdown escape', () => {
    const result = markdownEscape(complexText);
    expect(result).toEqual(complexTextEscaped);
});

test('Long text markdown escape then unescape gives back original', () => {
    const result = markdownUnescape(markdownEscape(complexText));
    expect(result).toEqual(complexText);
});
