import { PublicIdentity, PrivateIdentity } from './Identity';
import { ImageData } from './ImageData';
import { HexString } from '../helpers/opaqueTypes';

// Alice invites Bob with a QR code:
// Alice: InvitedContact -> AcceptedContact -> MutualContact
// Bob: CodeReceivedContact -> IncomingContact -> MutualContact

export interface InvitedContact {
    type: 'invited-contact';
    randomSeed: HexString;
    contactIdentity: PrivateIdentity;
    createdAt: number;
}

export interface CodeReceivedContact {
    type: 'code-received-contact';
    contactIdentity: PrivateIdentity;
    remoteRandomSeed: HexString;
    remoteContactIdentity: PublicIdentity;
    isContactPublicKeySent: boolean;
}

export interface AcceptedContact {
    type: 'accepted-contact';
    contactIdentity: PrivateIdentity;
    remoteContactIdentity: PublicIdentity;
    sharedKey: HexString;
    isPublicKeySent: boolean;
}

export interface IncomingContact {
    type: 'incoming-contact';
    contactIdentity: PrivateIdentity;
    remoteIdentity: PublicIdentity;
    sharedKey: HexString;
}

export interface MutualContact {
    type: 'mutual-contact';
    name: string;
    image: ImageData;
    identity: PublicIdentity;
    confirmed: boolean;
}

export type Contact = InvitedContact | AcceptedContact | CodeReceivedContact | IncomingContact | MutualContact;
