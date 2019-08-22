import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import { PublicProfile } from '../models/Profile';
import * as Swarm from '../swarm/Swarm';
import { generateUnsecureRandom } from '../helpers/unsecureRandom';
import { SECOND } from '../DateUtils';
import { assertEquals } from '../helpers/assertEquals';

const defaultIdentity = {
    privateKey: '0x6321af3e415fa2533a0a30d7b98dffe155df11d739a02569a7e082652b3b27fc',
    publicKey: '0x04d878f63e880d40ab684797469d38f7006c773a507624e4ec7a0cbf473bd52b4949a65ba56330a07647e0f0a2f7dd1d13cbe05c76206d532888f55fa79c51c41a',
    address: '0x9b125b2e1f900db6f967c7d77de25aff4a2a4317',
};

const defaultProfile: PublicProfile = {
    name: '',
    image: {},
    identity: defaultIdentity,
};

const defaultHelper = createSwarmContactHelper(
    defaultProfile,
    'http://localhost:8500',
    generateUnsecureRandom,
    () => false,
);

const defaultTimeout = 5 * SECOND;

const testSwarmHelperFeedWriteAndRead = async (helper = defaultHelper) => {
    const data = 'data';
    const feedIdentity = await Swarm.generateSecureIdentity(generateUnsecureRandom);
    const writer = helper.write(feedIdentity, data, defaultTimeout);
    const reader = helper.read(feedIdentity, defaultTimeout);

    const [_, result] = await Promise.all([writer, reader]);

    assertEquals(data, result);
};

export const swarmHelperTests = {
    testSwarmHelperFeedWriteAndRead,
};
