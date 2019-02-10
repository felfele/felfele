export const markdownEscape = (markdown: string): string => {
    return markdown.replace(/([\\\`*_{}\(\)\[\]#\+\-\.!])/g, '\\$1');
};

export const markdownUnescape = (markdown: string): string => {
    return markdown.replace(/(\\([\\\`*_{}\(\)\[\]#\+\-\.!]))/g, '$2');
};
