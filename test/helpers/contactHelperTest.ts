import { ContactHelper, createInvitedContact, advanceContactState } from '../../src/helpers/contactHelpers';
import { HexString } from '../../src/helpers/opaqueTypes';
import { PrivateIdentity, PublicIdentity } from '../../src/models/Identity';
import { Debug } from '../../src/Debug';
import { AcceptedContact, CodeReceivedContact } from '../../src/models/Contact';

const testRandomSeed = '9932c9eb82bfc80dace2d511b03ec391a1ea0d984f91a78ea3be13a0493d1803' as HexString;
const testGenerateRandom = async (): Promise<HexString> => testRandomSeed;

const testContactIdentity = {
    privateKey: '0x6321af3e415fa2533a0a30d7b98dffe155df11d739a02569a7e082652b3b27fc',
    publicKey: '0x04d878f63e880d40ab684797469d38f7006c773a507624e4ec7a0cbf473bd52b4949a65ba56330a07647e0f0a2f7dd1d13cbe05c76206d532888f55fa79c51c41a',
    address: '0x9b125b2e1f900db6f967c7d77de25aff4a2a4317',
};
const testGenerateIdentity = async (randomSeed: HexString): Promise<PrivateIdentity> => testContactIdentity;

const testOwnIdentity: PublicIdentity = {
    publicKey: '0x04b7d42279c506f36f98528ef21308e91d755e870db23cbd5800ff8a2417ea479a5efd2a457d9ab224897bdbfef4564c2f59024a03d9a4deee3d6c2fff3f82c7c5',
    address: '0x9deb38f523b66a0a1973551f6aedb3dc2859ed95',
};

const testRemoteContactIdentity: PublicIdentity = {
    publicKey: '0x045a171604f8307893d3da6df63a05e5e1bd7abb14eab84a31bf83fecf82ea022af3ec5741445c6d6a578e79df28f7dd2190f0c37d2ed1e38ae5094bcc471a2a34',
    address: '0x6335188b42ef84841993992dd9a534d6b7995f9b',
};

const testRemoteIdentity: PublicIdentity = {
    publicKey: '0x04461bf4a2624da1dd27d5ecede1da4967510adb882649c3ada28ccee822341df3e1cd81630b12cb41c5c2860936e84a7b7c4111b666f03feecf4dae2834f4c11f',
    address: '0x402a3387abceef20ea3e384b62504a7d07541f1b',
};

const testRemoteProfileData = {
    name: 'Remote',
    image: {},
};

const testRemoteContactMessage = {
    ...testRemoteProfileData,
    publicKey: testRemoteIdentity.publicKey,
};

const encrypt = (data: string, secret: HexString): Promise<HexString> => Promise.resolve(data as HexString);
const decrypt = (data: HexString, secret: HexString): HexString => data;

const testContactHelper: ContactHelper = {
    read: (publicIdentity, timeout) => Promise.resolve(''),
    write: (privateIdentity, data, timeout) => Promise.resolve(),
    generateSecureRandom: testGenerateRandom,
    generateSecureIdentity: testGenerateIdentity,
    encrypt,
    decrypt,
    ownIdentity: testOwnIdentity,
    profileData: {
        name: 'name',
        image: {},
    },
};

const throwError = (message: string = ''): never => {
    throw new Error(message);
};

test('create invited contact', async () => {
    const helper = testContactHelper;
    const contact = await createInvitedContact(helper, 0);

    expect(contact.randomSeed).toEqual(testRandomSeed);
    expect(contact.contactIdentity).toEqual(testContactIdentity);
});

test('invited contact failed to read contact public key', async () => {
    const mockRead = jest.fn(x => throwError());
    const mockWrite = jest.fn(x => throwError());
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const invitedContact = await createInvitedContact(helper, 0);
    const acceptedContact = await advanceContactState(invitedContact, helper, 0);

    expect(acceptedContact).toEqual(invitedContact);
    expect(mockRead.mock.calls.length).toBe(1);
    expect(mockWrite.mock.calls.length).toBe(0);
});

test('invited contact failed to write public key', async () => {
    const mockRead = jest.fn(x => Promise.resolve(testRemoteContactIdentity.publicKey));
    const mockWrite = jest.fn(x => throwError());
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const invitedContact = await createInvitedContact(helper, 0);
    const acceptedContact = await advanceContactState(invitedContact, helper, 0);

    expect(acceptedContact.type).toEqual('accepted-contact');
    if (acceptedContact.type === 'accepted-contact') {
        expect(acceptedContact.contactIdentity).toEqual(testContactIdentity);
        expect(acceptedContact.remoteContactIdentity).toEqual(testRemoteContactIdentity);
        expect(acceptedContact.isPublicKeySent).toBe(false);
    }
});

test('successful invited contact to mutual contact', async () => {
    const mockRead = jest.fn()
        .mockReturnValueOnce(Promise.resolve(testRemoteContactIdentity.publicKey))
        .mockReturnValueOnce(Promise.resolve(JSON.stringify(testRemoteContactMessage)))
    ;
    const mockWrite = jest.fn(x => Promise.resolve({}));
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const invitedContact = await createInvitedContact(helper, 0);
    const contact = await advanceContactState(invitedContact, helper, 0);

    expect(contact.type).toEqual('mutual-contact');
    expect(mockRead.mock.calls.length).toBe(2);
    expect(mockWrite.mock.calls.length).toBe(1);
});

test('code receive contact failed to write contact key', async () => {
    const mockRead = jest.fn(x => throwError());
    const mockWrite = jest.fn(x => throwError());
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const codeReceivedContact: CodeReceivedContact = {
        type: 'code-received-contact',
        contactIdentity: testContactIdentity,
        remoteRandomSeed: testRandomSeed,
        remoteContactIdentity: testRemoteContactIdentity,
    };
    const contact = await advanceContactState(codeReceivedContact, helper, 0);

    expect(contact).toEqual(codeReceivedContact);
    expect(mockRead.mock.calls.length).toBe(0);
    expect(mockWrite.mock.calls.length).toBe(1);
});

test('code receive contact succeded', async () => {
    const mockRead = jest.fn(x => Promise.resolve(JSON.stringify(testRemoteContactMessage)));
    const mockWrite = jest.fn(x => Promise.resolve({}));
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const codeReceivedContact: CodeReceivedContact = {
        type: 'code-received-contact',
        contactIdentity: testContactIdentity,
        remoteRandomSeed: testRandomSeed,
        remoteContactIdentity: testRemoteContactIdentity,
    };
    const contact = await advanceContactState(codeReceivedContact, helper, 0);

    expect(contact.type).toEqual('mutual-contact');
    expect(mockRead.mock.calls.length).toBe(1);
    expect(mockWrite.mock.calls.length).toBe(2);
    if (contact.type === 'mutual-contact') {
        expect(contact.identity).toEqual(testRemoteIdentity);
        expect(contact.name).toEqual(testRemoteProfileData.name);
    }
});

test('successful accepted contact to mutual contact', async () => {
    const mockRead = jest.fn(x => Promise.resolve(JSON.stringify(testRemoteContactMessage)));
    const mockWrite = jest.fn(x => Promise.resolve({}));
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const acceptedContact: AcceptedContact = {
        type: 'accepted-contact',
        contactIdentity: testContactIdentity,
        remoteContactIdentity: testRemoteContactIdentity,
        sharedKey: '' as HexString,
        isPublicKeySent: true,
    };
    const mutualContact = await advanceContactState(acceptedContact, helper, 0);

    expect(mutualContact.type).toEqual('mutual-contact');
    if (mutualContact.type === 'mutual-contact') {
        expect(mutualContact.identity).toEqual(testRemoteIdentity);
        expect(mutualContact.name).toEqual(testRemoteProfileData.name);
        expect(mutualContact.confirmed).toBeFalsy();
    }
});

test('accepted contact failed to write public key', async () => {
    const mockRead = jest.fn(x => throwError());
    const mockWrite = jest.fn(x => throwError());
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const acceptedContact: AcceptedContact = {
        type: 'accepted-contact',
        contactIdentity: testContactIdentity,
        remoteContactIdentity: testRemoteContactIdentity,
        sharedKey: '' as HexString,
        isPublicKeySent: false,
    };
    const contact = await advanceContactState(acceptedContact, helper, 0);

    expect(contact).toEqual(acceptedContact);
    expect(mockRead.mock.calls.length).toBe(0);
    expect(mockWrite.mock.calls.length).toBe(1);
});

test('accepted contact succeeded to write public key but failed to read', async () => {
    const mockRead = jest.fn(x => throwError());
    const mockWrite = jest.fn(x => throwError());
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const acceptedContact: AcceptedContact = {
        type: 'accepted-contact',
        contactIdentity: testContactIdentity,
        remoteContactIdentity: testRemoteContactIdentity,
        sharedKey: '' as HexString,
        isPublicKeySent: true,
    };
    const contact = await advanceContactState(acceptedContact, helper, 0);

    expect(contact).toEqual(acceptedContact);
    expect(mockRead.mock.calls.length).toBe(1);
    expect(mockWrite.mock.calls.length).toBe(0);
});

test('accepted contact failed to read public key', async () => {
    const mockRead = jest.fn(x => throwError());
    const mockWrite = jest.fn(x => Promise.resolve({}));
    const helper: ContactHelper = {
        ...testContactHelper,
        read: (publicIdentity, timeout) => mockRead(),
        write: (privateIdentity, data, timeout) => mockWrite(),
    };
    const acceptedContact: AcceptedContact = {
        type: 'accepted-contact',
        contactIdentity: testContactIdentity,
        remoteContactIdentity: testRemoteContactIdentity,
        sharedKey: '' as HexString,
        isPublicKeySent: false,
    };
    const contact = await advanceContactState(acceptedContact, helper, 0);

    expect(contact).toEqual({
        ...acceptedContact,
        isPublicKeySent: true,
    });
    expect(mockRead.mock.calls.length).toBe(1);
    expect(mockWrite.mock.calls.length).toBe(1);
});
