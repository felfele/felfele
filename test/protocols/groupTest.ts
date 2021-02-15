import { groupProtocolTests } from '../../src/protocols/groupTest';

describe('Test group protocol', () => {
    const protocolTests: any = groupProtocolTests;
    for (const protocolTest of Object.keys(protocolTests)) {
        test('' + protocolTest, async () => {
            await protocolTests[protocolTest]();
        });
    }
});
