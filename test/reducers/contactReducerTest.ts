import { MutualContact, Contact, InvitedContact, AcceptedContact } from '../../src/models/Contact';
import { contactsReducer } from '../../src/reducers/contactsReducer';
import { ContactActions } from '../../src/actions/ContactActions';
import { HexString } from '../../src/helpers/opaqueTypes';
import { PublicIdentity } from '../../src/models/Identity';
import { PrivateChannelSyncData, makeEmptyPrivateChannel } from '../../src/protocols/privateChannel';
import { ChapterReference } from '../../src/protocols/timeline';
import { CONTACT_EXPIRE_THRESHOLD } from '../../src/helpers/contactHelpers';

const testRandomSeed = '9932c9eb82bfc80dace2d511b03ec391a1ea0d984f91a78ea3be13a0493d1803' as HexString;

const testRemoteContactIdentity: PublicIdentity = {
    publicKey: '0x045a171604f8307893d3da6df63a05e5e1bd7abb14eab84a31bf83fecf82ea022af3ec5741445c6d6a578e79df28f7dd2190f0c37d2ed1e38ae5094bcc471a2a34',
    address: '0x6335188b42ef84841993992dd9a534d6b7995f9b',
};

const testIdentity: PublicIdentity = {
    publicKey: '0x04b7d42279c506f36f98528ef21308e91d755e870db23cbd5800ff8a2417ea479a5efd2a457d9ab224897bdbfef4564c2f59024a03d9a4deee3d6c2fff3f82c7c5',
    address: '0x9deb38f523b66a0a1973551f6aedb3dc2859ed95',
};

const testContactIdentity = {
    privateKey: '0x6321af3e415fa2533a0a30d7b98dffe155df11d739a02569a7e082652b3b27fc',
    publicKey: '0x04d878f63e880d40ab684797469d38f7006c773a507624e4ec7a0cbf473bd52b4949a65ba56330a07647e0f0a2f7dd1d13cbe05c76206d532888f55fa79c51c41a',
    address: '0x9b125b2e1f900db6f967c7d77de25aff4a2a4317',
};

const testMutualContact: MutualContact = {
    type: 'mutual-contact',
    name: 'name',
    image: {},
    identity: testIdentity,
    privateChannel: makeEmptyPrivateChannel(),
};

const testInvitedContact: InvitedContact = {
    type: 'invited-contact',
    contactIdentity: testContactIdentity,
    randomSeed: testRandomSeed,
    createdAt: 0,
};

const testAcceptedContact: AcceptedContact = {
    type: 'accepted-contact',
    contactIdentity: testContactIdentity,
    remoteContactIdentity: testRemoteContactIdentity,
    sharedKey: '' as HexString,
    isPublicKeySent: false,
};

test('add contact succeeds', () => {
    const contact = testMutualContact;
    const contacts: Contact[] = [];
    const action = ContactActions.addContact(contact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([contact]);
});

test('add contact should not add if mutual contact is already added', () => {
    const contact = testMutualContact;
    const contacts = [contact];
    const action = ContactActions.addContact(contact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual(contacts);
});

test('update should work from invited to accepted', () => {
    const invitedContact = testInvitedContact;
    const acceptedContact = testAcceptedContact;
    const contacts = [invitedContact];
    const action = ContactActions.updateContactState(invitedContact, acceptedContact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([acceptedContact]);
});

test('update should work from accepted to mutual', () => {
    const acceptedContact = testAcceptedContact;
    const mutualContact = testMutualContact;
    const contacts = [acceptedContact];
    const action = ContactActions.updateContactState(acceptedContact, mutualContact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([mutualContact]);
});

test('update should remove when updating from accepted to mutual and mutual already exists', () => {
    const acceptedContact = testAcceptedContact;
    const mutualContact = testMutualContact;
    const contacts = [acceptedContact, mutualContact];
    const action = ContactActions.updateContactState(acceptedContact, mutualContact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([mutualContact]);
});

test('remove should work if mutual found', () => {
    const contact = testMutualContact;
    const contacts = [contact];
    const action = ContactActions.removeContact(contact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([]);
});

test('remove should work if non-mutual found', () => {
    const contact = testInvitedContact;
    const contacts = [contact];
    const action = ContactActions.removeContact(contact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([]);
});

test('remove should work if mutual not found', () => {
    const contact = testMutualContact;
    const contacts: Contact[] = [];
    const action = ContactActions.removeContact(contact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([]);
});

test('remove expired contacts should only remove expired contacts', () => {
    const expiredInvitedContact: InvitedContact = {
        type: 'invited-contact',
        contactIdentity: testContactIdentity,
        randomSeed: testRandomSeed,
        createdAt: Date.now() - (CONTACT_EXPIRE_THRESHOLD + 1),
    };
    const notExpiredInvitedContact: InvitedContact = {
        type: 'invited-contact',
        contactIdentity: testContactIdentity,
        randomSeed: testRandomSeed,
        createdAt: Date.now() - (CONTACT_EXPIRE_THRESHOLD - 1),
    };
    const contacts = [testAcceptedContact, expiredInvitedContact, notExpiredInvitedContact, testMutualContact];

    const action = ContactActions.removeExpiredContacts();
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([testAcceptedContact, notExpiredInvitedContact, testMutualContact]);
});

test('remove should not remove if found by key but different types', () => {
    const mutualContact = {
        ...testMutualContact,
        identity: testIdentity,
    };
    const invitedContact = testInvitedContact;
    const contacts = [mutualContact];
    const action = ContactActions.removeContact(invitedContact);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual(contacts);
});

test('update contact private channel should update contact if found', () => {
    const mutualContact = testMutualContact;
    const updatedPrivateChannel: PrivateChannelSyncData = {
        unsyncedCommands: [],
        peerLastSeenChapterId: '' as ChapterReference,
        lastSyncedChapterId: undefined,
    };
    const updatedContact = {
        ...mutualContact,
        privateChannel: updatedPrivateChannel,
    };
    const contacts = [mutualContact];
    const action = ContactActions.updateContactPrivateChannel(mutualContact, updatedPrivateChannel);
    const result = contactsReducer(contacts, action);

    expect(result).toEqual([updatedContact]);
});
