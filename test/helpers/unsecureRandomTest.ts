import { createDeterministicRandomGenerator } from '../../src/helpers/unsecureRandom';
import { byteArrayToHex } from '../../src/helpers/conversion';

const firstTenDefaultRandomValues = [
    'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    '10ca3eff73ebec87d2394fc58560afeab86dac7a21f5e402ea0a55e5c8a6758f',
    '1cf8eebf67df4cc8de3bc92242c7a5691a7cdd7efe364b62c1b97063ed450b75',
    '5608ca83f9a41a423fa54d5a12c1dd1212e5c699b157bfbddbcb16ee12c07dce',
    'f84e0fd035cb7aa5b5d93fb7a3e3baff3911a59cb3827879018353b06342a63b',
    'bf20e740d22f181bfdd8f8db34136a75f0ccd86be3aca96bfb4d41557b8ba386',
    '49eebf720c26adce6d5321848f714894bc76b0a48ee66881adbc87694f82f64c',
    'eaba7afcb363158c96bf72e8412151eef8fcec5f9fb5b1e4126f922c432adebf',
    'ae466f1467a43e40378245fcfa009f669ed7b07e3f90abf850ea32161b8c1c5e',
    '2350eae71e3c126ed6e4ea21ed84d0b600468c32aecf4de01477d81b8c385894',
];

test('deterministic random generator from default empty seed', async () => {
    const generateDeterministicRandom = createDeterministicRandomGenerator();
    const length = 32;

    const randomValues: string[] = [];

    for (let i = 0; i < 10; i++) {
        const random = byteArrayToHex(await generateDeterministicRandom(length), false);
        randomValues.push(random);
    }

    expect(randomValues).toEqual(firstTenDefaultRandomValues);
});

test('two deterministic random generators from default empty seed', async () => {
    const generateDeterministicRandom1 = createDeterministicRandomGenerator();
    const generateDeterministicRandom2 = createDeterministicRandomGenerator();
    const length = 32;

    const randomValues1: string[] = [];
    const randomValues2: string[] = [];

    for (let i = 0; i < 10; i++) {
        const random1 = byteArrayToHex(await generateDeterministicRandom1(length), false);
        randomValues1.push(random1);

        const random2 = byteArrayToHex(await generateDeterministicRandom2(length), false);
        randomValues2.push(random2);
    }

    expect(randomValues1).toEqual(firstTenDefaultRandomValues);
    expect(randomValues2).toEqual(firstTenDefaultRandomValues);
});

test('deterministic random generator from non-default seed', async () => {
    const generateDeterministicRandom = createDeterministicRandomGenerator('0');
    const length = 32;

    const firstTenRandomValues = [
        'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a',
        'c741bfe7740ec80f9d6965a49bf8af6488a0fd9505c271ea546b61a4a50a7945',
        '357a815b6fffc3f38b08de8f1e754bef7d52acc551d7b5cd58b4634854fe674c',
        '674ed52c0333bbf8a7b4513640d9f59e44f87f89ce01f7633de85b36885dc1fa',
        '07249866ab9e6415a0d1d972eda9e0ab1cc3788602cbfcec30a01697d51a9cf1',
        'edd8b27e7c7ab8ad3be4de30a24d602265bc101559a43fc997ef3851d2e8bd6a',
        'cd3bbe386fec3e7dfc37d87d1c18b5de1d655885927b9a7087c6af56eb0e3e2a',
        '0a1f767f0babe992c23eaa8767ce8e19770941bc563fe48d8405371071b0c853',
        'd7cd9c6c64d702a2deadd9ae68a3abbd13432dfdd0758212c3e3e9207a9f5442',
        '8624012c939bf17c322a3da6cb7b7af12a81a96f7d5cac3003d0674b94003fa1',
    ];
    const randomValues: string[] = [];

    for (let i = 0; i < 10; i++) {
        const random = byteArrayToHex(await generateDeterministicRandom(length), false);
        randomValues.push(random);
    }

    expect(randomValues).toEqual(firstTenRandomValues);
});
