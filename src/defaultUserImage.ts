import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';

import { ImageData } from './models/ImageData';
import { byteArrayToHex } from './helpers/conversion';
import { keccak256 } from 'js-sha3';
// @ts-ignore
import Identicon from 'identicon.js';
import { Debug } from './Debug';
import { getAppGroup } from './BuildEnvironment';

const USER_IMAGE_ASSET_DIR = 'custom';
const USER_IMAGE_NAME = 'defaultuser.png';
const FILE_PROTOCOL = 'file://';

export const getDefaultUserImage = async (): Promise<ImageData> => {
    if (Platform.OS === 'android') {
        const defaultUserImagePath = RNFS.DocumentDirectoryPath + '/' + USER_IMAGE_NAME;
        if (!await RNFS.exists(defaultUserImagePath)) {
            await RNFS.copyFileAssets(
                USER_IMAGE_ASSET_DIR + '/' + USER_IMAGE_NAME,
                defaultUserImagePath
            );
        }
        return {
            localPath: FILE_PROTOCOL + defaultUserImagePath,
        };
    } else if (Platform.OS === 'ios') {
        return {
            localPath: FILE_PROTOCOL + RNFS.MainBundlePath + '/' + USER_IMAGE_NAME,
        };
    } else {
        throw new Error('unsupported platform: ' + Platform.OS);
    }
};

export const getFallbackUserImage = async (publicKey: string): Promise<ImageData> => {
    const pathForGroup = await RNFS.pathForGroup(getAppGroup());
    const userImagePath = `${FILE_PROTOCOL}${pathForGroup}/${publicKey}.png`;
    if (!await RNFS.exists(userImagePath)) {
        try {
            await RNFS.writeFile(userImagePath, createUserImage(publicKey), 'base64');
        } catch (e) {
            Debug.log('error', userImagePath, e);
        }
    }
    return {
        localPath: userImagePath,
    };
};

const createUserImage = (publicKey: string): string => {
    const identiconHash = byteArrayToHex(keccak256.array(publicKey), false);
    return new Identicon(identiconHash, { size: 512, margin: 0.2 }).toString();
};
