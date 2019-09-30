import { HexString } from '../helpers/opaqueTypes';

export const enum InviteCodeFields {
    version = 'version',
    randomSeed = 'randomSeed',
    contactPublicKey = 'contactPublicKey',
    profileName = 'profileName',
    expiry = 'expiry',
}

export const INVITE_CODE_VERSION = 1;

export interface InviteCode {
    [InviteCodeFields.version]: number;
    [InviteCodeFields.randomSeed]: HexString;
    [InviteCodeFields.contactPublicKey]: HexString;
    [InviteCodeFields.profileName]: string;
    [InviteCodeFields.expiry]: number;
}

export const isVersion1RawInviteCode = (jsonObj: any): boolean => {
    return Number.parseInt(jsonObj.version, 10) === 1
        && jsonObj.hasOwnProperty(InviteCodeFields.randomSeed)
        && jsonObj.hasOwnProperty(InviteCodeFields.contactPublicKey)
        && jsonObj.hasOwnProperty(InviteCodeFields.profileName)
        && jsonObj.hasOwnProperty(InviteCodeFields.expiry);
};
