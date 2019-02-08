export const markdownEscape = (markdown: string): string => {
    return markdown.replace(/^#/g, '\\#');
};

export const markdownUnescape = (markdown: string): string => {
    return markdown.replace(/^\\#/g, '#');
};
