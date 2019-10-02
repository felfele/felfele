import { HexString } from '../helpers/opaqueTypes';

export const INVITE_CODE_VERSION = 1;

export interface InviteCode {
    randomSeed: HexString;
    contactPublicKey: HexString;
    profileName: string;
    expiry: number;
}
