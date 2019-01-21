// tslint:disable-next-line:no-var-requires
const reduxPersist = require('redux-persist');
// tslint:disable-next-line:no-var-requires
const jsan = require('jsan');

export const immutableTransformHack = (config) => {
    config = config || {};

    const reviver = (key, value) => {
        if (typeof value === 'object' && value !== null && '__serializedType__'  in value) {
          const data = value.data;
          return data;
        }
        return value;
    };

    const serializer = {
        stringify: (data) => {
            return jsan.stringify(
                data,
            );
        },
        parse: data => {
            return jsan.parse(
                data,
                reviver,
            );
        },
    };

    return reduxPersist.createTransform(serializer.stringify, serializer.parse, config);
};
