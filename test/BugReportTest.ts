import { escapePII, PIIKeys } from '../src/components/BugReportView';

test('escapePII does not omit when filtered fields are empty', () => {
    const text = '{"privateKey":"secret"}';
    const filterFields: string[] = [];
    const expected = text;

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields: privateKey', () => {
    const text = '{"privateKey":"secret"}';
    const expected = '{"privateKey":"OMITTED"}';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields when incomplete: privateKey', () => {
    const text = '{"privateKey":"sec';
    const expected = '{"privateKey":"OMITTED"';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields: name', () => {
    const text = '{"name":"secret"}';
    const expected = '{"name":"OMITTED"}';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields: publicKey', () => {
    const text = '{"publicKey":"secret"}';
    const expected = '{"publicKey":"OMITTED"}';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields: address', () => {
    const text = '{"address":"secret"}';
    const expected = '{"address":"OMITTED"}';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields: localPath', () => {
    const text = '{"localPath":"secret"}';
    const expected = '{"localPath":"OMITTED"}';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields: user', () => {
    const text = '{"user":"secret"}';
    const expected = '{"user":"OMITTED"}';

    const result = escapePII(text, PIIKeys);

    expect(result).toEqual(expected);
});

test('escapePII does omit filtered fields with unicode', () => {
    const text = '{"name":"☺"}';
    const filterFields = ['name'];
    const expected = '{"name":"OMITTED"}';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does not omit other filtered fields', () => {
    const text = '{"privateKey":"secret","any":"value"}';
    const filterFields = ['privateKey'];
    const expected = '{"privateKey":"OMITTED","any":"value"}';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit local file path in other fields', () => {
    const text = '{"favicon":"file:///Documents/id"}';
    const filterFields: string[] = [];
    const expected = '{"favicon":"OMITTED"}';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit local file path in other fields when incomplete', () => {
    const text = '{"favicon":"file:///Docum';
    const filterFields: string[] = [];
    const expected = '{"favicon":"OMITTED"';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit local file path in other fields with other path format', () => {
    const text = '{"favicon":"/Documents/id"}';
    const filterFields: string[] = [];
    const expected = '{"favicon":"OMITTED"}';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit bzz-feed url in other fields', () => {
    const text = '{"feedUrl":"bzz-feed:/?user=0x663865c36a8a6e28631757e77105e51d8ef378f9"}';
    const filterFields: string[] = [];
    const expected = '{"feedUrl":"OMITTED"}';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit bzz-feed gateway url in other fields', () => {
    const text = '{"feedUrl":"https://swarm-gateways.net/bzz-feed:/?user=0x663865c36a8a6e28631757e77105e51d8ef378f9"}';
    const filterFields: string[] = [];
    const expected = '{"feedUrl":"https://swarm-gateways.net/OMITTED"}';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});

test('escapePII does omit bzz-feed gateway url in other fields when incomplete', () => {
    const text = '{"feedUrl":"https://swarm-gateways.net/bzz-feed:/?user=0x663865c3';
    const filterFields: string[] = [];
    const expected = '{"feedUrl":"https://swarm-gateways.net/OMITTED"';

    const result = escapePII(text, filterFields);

    expect(result).toEqual(expected);
});
