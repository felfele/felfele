import { escapePII } from '../src/components/BugReportView';

test('escapePII does omit filtered fields', () => {
    const text = '{"privateKey":"secret"}';
    const filterFields = ['privateKey'];
    const expected = '{"privateKey":"OMITTED"}';

    const result = escapePII(text, filterFields);

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
