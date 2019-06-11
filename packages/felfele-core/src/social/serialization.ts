import { Debug } from '../helpers/Debug';

const keyBlacklist = new Set<string>()
    .add('localPath')
    .add('privateKey')
    .add('isUploading')
    ;

export const serialize = (data: any): string => {
    try {
        const serializedData = JSON.stringify(data, (key, value) => {
            return (typeof key === 'string' && (key.startsWith('_') || keyBlacklist.has(key)))
                ? undefined
                : value
            ;
        });
        return serializedData;
    } catch (e) {
        Debug.log('serialize', 'e', e, 'data', data);
        throw e;
    }
};

export const deserialize = (data: string): any => {
    return JSON.parse(data);
};
