import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';
// @ts-ignore
import Identicon from 'identicon.js';

import { ImageData } from './models/ImageData';
import { Debug } from './Debug';
import { getAppGroup } from './BuildEnvironment';
import { generateUnsecureRandomHexString } from './helpers/unsecureRandom';
import { getPathForFile, FILE_PROTOCOL, copyToAppDataDir, getAbsolutePathFromLocalPath } from './helpers/filesystem';
import { isString } from 'util';

const USER_IMAGE_ASSET_DIR = 'custom';
const USER_IMAGE_NAME = 'defaultuser.png';

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

export const copyImageToApp = async (image: ImageData, filename: string): Promise<string> => {
    if (image.data != null) {
        const path = await getPathForFile(filename);
        if (!await RNFS.exists(path)) {
            try {
                await RNFS.writeFile(path, image.data, 'base64');
            } catch (e) {
                Debug.log('copyImageToApp', path, e);
                throw e;
            }
        }
        return `${FILE_PROTOCOL}${path}`;
    } else if (image.localPath != null && isString(image.localPath)) {
        return await copyToAppDataDir(getAbsolutePathFromLocalPath(image.localPath), filename);
    } else {
        throw Error(`copyImageToApp, unsupported image ${image}`);
    }
};

export const createUserImage = (hash = generateUnsecureRandomHexString(15)): ImageData => {
    const data = new Identicon(hash, { size: 512, margin: 0.2 }).toString();
    return {
        data,
    };
};
