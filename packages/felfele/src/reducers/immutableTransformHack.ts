import { createTransform, PersistConfig } from 'redux-persist';

export const immutableTransformHack = (config: Pick<PersistConfig, 'whitelist' | 'blacklist'>) => {
    config = config || {};

    const reviver = (key: any, value: any) => {
        if (typeof value === 'object' && value !== null && '__serializedType__'  in value) {
          const data = value.data;
          return data;
        }
        if (typeof value === 'object' && value.hasOwnProperty('$jsan')) {
            const objectValue: { [index: string]: any } = value as object;
            if (objectValue.$jsan === 'u') {
                return undefined;
            }
        }
        return value;
    };

    const serializer = {
        stringify: (data: any) => {
            return JSON.stringify(
                data,
            );
        },
        parse: (data: string) => {
            return JSON.parse(
                data,
                reviver,
            );
        },
    };

    return createTransform(serializer.stringify, serializer.parse, config);
};
