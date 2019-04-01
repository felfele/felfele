import { serialize, deserialize } from '../../src/social/serialization';

test('Serializing should produce JSON', () => {
    const input = {test: 'test'};
    const expected = `{"test":"test"}`;
    const result = serialize(input);

    expect(result).toBe(expected);
});

test('Deserializing should produce the original object', () => {
    const input = `{"test":"test"}`;
    const expected = {test: 'test'};
    const result = deserialize(input);

    expect(result).toEqual(expected);
});

test('Serializing should skip properties starting with underscore', () => {
    const input = {_test: '_test'};
    const expected = `{}`;
    const result = serialize(input);

    expect(result).toBe(expected);
});

test('Serializing should skip properties starting with underscore but work with normal', () => {
    const input = {_test: '_test', test: 'test'};
    const expected = `{"test":"test"}`;
    const result = serialize(input);

    expect(result).toBe(expected);
});

test('Serializing should skip blacklisted names', () => {
    const input = {privateKey: 'privateKey', localPath: '/a/b/c'};
    const expected = `{}`;
    const result = serialize(input);

    expect(result).toBe(expected);
});

test('Serializing should skip blacklisted names but work with normal', () => {
    const input = {privateKey: 'privateKey', localPath: '/a/b/c', test: 'test'};
    const expected = `{"test":"test"}`;
    const result = serialize(input);

    expect(result).toBe(expected);
});

test('Serializing undefined should work', () => {
    const input = undefined;
    const expected = undefined;
    const result = serialize(input);

    expect(result).toBe(expected);
});

test('Serializing undefined key should work', () => {
    const input = {undefined};
    const expected = `{}`;
    const result = serialize(input);

    expect(result).toBe(expected);
});
