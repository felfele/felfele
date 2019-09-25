import { privateSharingTests } from '../../src/protocols/privateSharingTest';

describe('Test private sharing', () => {
    const tests: any = privateSharingTests;
    for (const privateSharingTest of Object.keys(tests)) {
        test('' + privateSharingTest, async () => {
            await tests[privateSharingTest]();
        });
    }
});
