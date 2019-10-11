import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';
// @ts-ignore
import Identicon from 'identicon.js';

import { ImageData } from './models/ImageData';
import { Debug } from './Debug';
import { getAppGroup } from './BuildEnvironment';
import { generateUnsecureRandomHexString } from './helpers/unsecureRandom';

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
    } else if (image.localPath != null) {
        if (Platform.OS === 'ios') {
            const pathForGroup = await RNFS.pathForGroup(getAppGroup());
            return `${FILE_PROTOCOL}${pathForGroup}/${filename}`;
        } else if (Platform.OS === 'android') {
            return `${FILE_PROTOCOL}${RNFS.DocumentDirectoryPath}/${filename}`;
        } else {
            throw Error(`copyImageToApp, unsupported platform ${Platform.OS}`);
        }
    } else {
        throw Error(`copyImageToApp, unsupported image ${image}`);
    }
};

const getPathForFile = async (filename: string): Promise<string> => {
    if (Platform.OS === 'ios') {
        const pathForGroup = await RNFS.pathForGroup(getAppGroup());
        return `${pathForGroup}/${filename}`;
    } else if (Platform.OS === 'android') {
        return `${RNFS.DocumentDirectoryPath}/${filename}`;
    } else {
        throw Error('unsupported platform');
    }
};

export const writeImageToFile = async (filename: string, data: string): Promise<ImageData> => {
    const pathForGroup = await RNFS.pathForGroup(getAppGroup());
    const userImagePath = `${FILE_PROTOCOL}${pathForGroup}/${filename}.png`;
    try {
        await RNFS.writeFile(userImagePath, data, 'base64');
    } catch (e) {
        Debug.log('getFallbackUserImage', userImagePath, e);
    }
    return {
        localPath: userImagePath,
    };
};

export const createUserImage = (hash = generateUnsecureRandomHexString(15)): ImageData => {
    const data = new Identicon(hash, { size: 512, margin: 0.2 }).toString();
    return {
        data,
    };
};
