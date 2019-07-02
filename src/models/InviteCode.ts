import { HexString } from '../helpers/opaqueTypes';

export interface InviteCode {
    randomSeed: HexString;
    contactPublicKey: HexString;
}
