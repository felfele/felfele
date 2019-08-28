import { PrivateSharingContext } from './privateSharing';
import { PrivateProfile } from '../models/Profile';
import { PublicIdentity } from '../models/Identity';
import { deriveSharedKey } from '../helpers/contactHelpers';
import { ProtocolStorage } from './ProtocolStorage';
import { Crypto } from '../cli/protocolTest/protocolTestHelpers';

export const makePrivateSharingContextWithContact = async (
    profile: PrivateProfile,
    contactIdentity: PublicIdentity,
    storage: ProtocolStorage,
    crypto: Crypto,
): Promise<PrivateSharingContext> => {
    return {
        profile,
        contactIdentity,
        localTimeline: [],
        remoteTimeline: [],
        sharedSecret: deriveSharedKey(profile.identity, contactIdentity),
        storage,
        crypto,
    };
};
