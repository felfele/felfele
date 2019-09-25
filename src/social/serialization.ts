import { Debug } from '../Debug';

const keyBlacklist = new Set<string>()
    .add('localPath')
    .add('privateKey')
    .add('isUploading')
    ;

export const isKeySerializable = (key: string): boolean =>
    key.startsWith('_') || keyBlacklist.has(key)
;

export const serialize = (data: any): string => {
    try {
        const serializedData = JSON.stringify(data, (key, value) => {
            return (typeof key === 'string' && isKeySerializable(key))
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
