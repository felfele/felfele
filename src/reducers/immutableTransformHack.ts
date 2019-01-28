// tslint:disable-next-line:no-var-requires
const reduxPersist = require('redux-persist');

export const immutableTransformHack = (config) => {
    config = config || {};

    const reviver = (key, value) => {
        if (typeof value === 'object' && value !== null && '__serializedType__'  in value) {
          const data = value.data;
          return data;
        }
        if (typeof value === 'object') {
            const objectValue = value as object;
            // tslint:disable-next-line:no-string-literal
            if (objectValue.hasOwnProperty('$jsan') && objectValue['$jsan'] === 'u') {
                return undefined;
            }
        }
        return value;
    };

    const serializer = {
        stringify: (data) => {
            return JSON.stringify(
                data,
            );
        },
        parse: data => {
            return JSON.parse(
                data,
                reviver,
            );
        },
    };

    return reduxPersist.createTransform(serializer.stringify, serializer.parse, config);
};
