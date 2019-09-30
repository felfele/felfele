// @ts-ignore
import * as base64ab from 'base64-arraybuffer';
import { InvitedContact } from '../models/Contact';
import { InviteCode, isVersion1RawInviteCode, InviteCodeFields, INVITE_CODE_VERSION } from '../models/InviteCode';
import { hexToUint8Array, byteArrayToHex } from './conversion';
import { CONTACT_EXPIRY_THRESHOLD } from './contactHelpers';

export const BASE_URL = 'https://app.felfele.org/';
const SEPARATOR = '&';
const INVITE = 'invite/';

const urlSafeBase64Encode = (data: Uint8Array) => {
    const unsafeBase64 = base64ab.encode(data.buffer);
    return unsafeBase64.replace(/\//g, '_');
};

const urlSafeBase64Decode = (data: string) => {
    const unsafeBase64 = data.replace(/_/g, '/');
    return new Uint8Array(base64ab.decode(unsafeBase64));
};

export const getInviteLink = (contact: InvitedContact, profileName: string): string => {
    return `${BASE_URL}${INVITE}${makeInviteParams(contact, profileName)}`;
};

export const getInviteLinkWithParams = (params: string): string => {
    return `${BASE_URL}${INVITE}${params}`;
};

const makeInviteParams = (contact: InvitedContact, profileName: string): string => {
    const randomSeedBytes = hexToUint8Array(contact.randomSeed);
    const contactPublicKeyBytes = hexToUint8Array(contact.contactIdentity.publicKey);
    const base64RandomSeed = urlSafeBase64Encode(randomSeedBytes);
    const base64ContactPublicKey = urlSafeBase64Encode(contactPublicKeyBytes);
    return `\
${InviteCodeFields.randomSeed}=${base64RandomSeed}${SEPARATOR}\
${InviteCodeFields.contactPublicKey}=${base64ContactPublicKey}${SEPARATOR}\
${InviteCodeFields.profileName}=${encodeURIComponent(profileName)}${SEPARATOR}\
${InviteCodeFields.expiry}=${contact.createdAt + CONTACT_EXPIRY_THRESHOLD}${SEPARATOR}\
${InviteCodeFields.version}=${INVITE_CODE_VERSION}\
`;
};

export const getInviteLinkWithBase64Params = (
    base64RandomSeed: string,
    base64ContactPublicKey: string,
    urlEncodedProfileName?: string,
    expiry?: number,
) => {
    return urlEncodedProfileName != null
        ? `${BASE_URL}${INVITE}${base64RandomSeed}/${base64ContactPublicKey}/${urlEncodedProfileName}/${expiry}`
        : `${BASE_URL}${INVITE}${base64RandomSeed}/${base64ContactPublicKey}`
    ;
};

export const getInviteCodeFromInviteLink = (inviteLink: string): InviteCode | undefined => {
    if (!inviteLink.startsWith(`${BASE_URL}${INVITE}`)) {
        return undefined;
    }
    const strippedLink = inviteLink.replace(`${BASE_URL}${INVITE}`, '');
    try {
        const jsonObj = makeJsonObjFromParams(strippedLink);
        if (isVersion1RawInviteCode(jsonObj)) {
            return {
                version: Number.parseInt(jsonObj.version, 10),
                randomSeed: byteArrayToHex(urlSafeBase64Decode(jsonObj.randomSeed), false),
                contactPublicKey: byteArrayToHex(urlSafeBase64Decode(jsonObj.contactPublicKey)),
                expiry: Number.parseInt(jsonObj.expiry, 10),
                profileName: decodeURIComponent(jsonObj.profileName),
            };
        } else {
            throw Error(`malformed invite link ${strippedLink}`);
        }
    } catch (e) {
        return undefined;
    }
};

const makeJsonObjFromParams = (params: string) => {
    const paramsArr = params.split(SEPARATOR);
    const obj: { [k: string]: string } = {};
    for (const item of paramsArr) {
        const [ key, value] = item.split('=');
        obj[key] = value;
    }
    return obj;
};
