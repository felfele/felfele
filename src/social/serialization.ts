export const serialize = (data: any): string => {
    return JSON.stringify(data, (key, value) => key.startsWith('_') ? undefined : value);
};

export const deserialize = (data: string): any => {
    return JSON.parse(data);
};
