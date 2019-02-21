const keyBlacklist = new Set<string>()
    .add('localPath')
    .add('privateKey')
    ;

export const serialize = (data: any): string => {
    return JSON.stringify(data, (key, value) =>
        (key.startsWith('_') || keyBlacklist.has(key)) ? undefined : value);
};

export const deserialize = (data: string): any => {
    return JSON.parse(data);
};
