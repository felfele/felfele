// @ts-ignore
import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';

import { ImageData } from './models/ImageData';

const USER_IMAGE_ASSET_DIR = 'custom';
const USER_IMAGE_NAME = 'user_circle.png';
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
