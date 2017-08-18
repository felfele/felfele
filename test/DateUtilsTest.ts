import { DateUtils } from '../src/DateUtils';

beforeEach(() => {
});

afterEach(() => {
});

test('Test ISO8601 complete format to UTC timestamp', async () => {
    const input = '2017-08-17T15:01:26.000Z';
    const result = DateUtils.parseDateString(input);

    expect(result).toBe(1502982086000);
})

test('Test UTC timestamp to ISO8601 complete format', async () => {
    const input = 1502982086000;
    const result = DateUtils.timestampToDateString(input);

    expect(result).toEqual('2017-08-17T15:01:26.000Z');
})
