import { DateUtils } from '../src/DateUtils';

const now = 1503058728706;

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

test('Test printable time output', () => {
    const createdTimes = [1503058235000, 1503057385000, 1503056192000, 1503053712000];
    const expectedResults = ['8 minutes ago', '22 minutes ago', '42 minutes ago', '1 hour ago'];

    const results = createdTimes.map(time => DateUtils.printableElapsedTime(time, now));

    expect(results).toEqual(expectedResults);
})
