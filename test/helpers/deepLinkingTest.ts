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
    const randomSeed = '755c77b5753fd526605c532dd07e46fb3cdd7d13a244eab1de871fc8e8250653' as HexString;
    const contactIdentity = {
        privateKey: '0x42b7f2ac218f1808cc8b8606e3e645267637cbc7cf553e13be2419c1479031dd',
        publicKey: '0x04ea4180c3449661a60bf908f76d6b11abab7b8dbad4c8a35bd939ea7ed48d265bcb5687c43e11d65b38c5b3c27582255170d3c578845117af6e280950b44915a5',
        address: '0x358e785e70666ee7a633677f675b11bbff2560f3',
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
