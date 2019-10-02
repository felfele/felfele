import { getInviteLink, getInviteCodeFromInviteLink } from '../../src/helpers/deepLinking';
import { InvitedContact } from '../../src/models/Contact';
import { HexString } from '../../src/helpers/opaqueTypes';
import { CONTACT_EXPIRY_THRESHOLD } from '../../src/helpers/contactHelpers';

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

    const inviteLink = getInviteLink(invitedContact, 'testName');
    const inviteCode = getInviteCodeFromInviteLink(inviteLink);

    expect(inviteCode).not.toBeUndefined();
    expect(inviteCode!.randomSeed).toEqual(randomSeed);
    expect(inviteCode!.contactPublicKey).toEqual(contactIdentity.publicKey);
    expect(inviteCode!.expiry).toEqual(invitedContact.createdAt + CONTACT_EXPIRY_THRESHOLD);
});

test('correct version 1 invite link can be parsed', () => {
    const inviteLink = 'https://app.felfele.org/invite/1&7NWsGi+_Zad6oxtWcZnG6a3IDIg96aXzI59rGK08No8=&A0htzKYoCkSsjKbKMWhGTxYpWkSlf+uDiUILUXLbRLXO&1570552184258&fff';
    expect(() => getInviteCodeFromInviteLink(inviteLink)).not.toThrow();
});

test('invite link with unknown version throws error', () => {
    const inviteLink = 'https://app.felfele.org/invite/2&7NWsGi+_Zad6oxtWcZnG6a3IDIg96aXzI59rGK08No8=&A0htzKYoCkSsjKbKMWhGTxYpWkSlf+uDiUILUXLbRLXO&1570552184258&fff';
    expect(() => getInviteCodeFromInviteLink(inviteLink)).toThrow('unknown version');
});

test('version 1 malformed invite link throws error', () => {
    const inviteLink = 'https://app.felfele.org/invite/2&7NWsGi+_Zad6oxtWcZnG6a3IDIg96aXzI59rGK08No8=&A0htzKYoCkSsjKbKMWhGTxYpWkSlf+uDiUILUXLbRLXO&1570552184258';
    expect(() => getInviteCodeFromInviteLink(inviteLink)).toThrow('unknown version');
});
