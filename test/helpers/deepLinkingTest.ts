import { getFollowLink, getFeedUrlFromFollowLink, getInviteLink, getInviteCodeFromInviteLink } from '../../src/helpers/deepLinking';
import { InvitedContact } from '../../src/models/Contact';
import { HexString } from '../../src/helpers/opaqueTypes';

test('follow link encoding and decoding', () => {
    const feedUrl = 'bzz://abcdef';
    const followLink = getFollowLink(feedUrl);
    const result = getFeedUrlFromFollowLink(followLink);

    expect(result).toEqual(feedUrl);
});

test('invite link encoding and decoding', () => {
    const randomSeed = 'randomSeed' as HexString;
    const contactIdentity = {
        privateKey: 'privateKey',
        publicKey: 'publicKey',
        address: 'address',
    };
    const invitedContact: InvitedContact = {
        type: 'invited-contact',
        randomSeed,
        contactIdentity,
        createdAt: 0,
    };
    const inviteLink = getInviteLink(invitedContact);
    const inviteCode = getInviteCodeFromInviteLink(inviteLink);

    expect(inviteCode).not.toBeUndefined();
    expect(inviteCode!.randomSeed).toEqual(randomSeed);
    expect(inviteCode!.contactPublicKey).toEqual(contactIdentity.publicKey);
});
