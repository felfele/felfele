import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';

import { Debug } from '../Debug';
import { getAppGroup } from '../BuildEnvironment';
import { ImageData } from '../models/ImageData';

export const FILE_PROTOCOL = 'file://';

export const getAbsolutePathFromLocalPath = (localPath: string): string => {
    if (Platform.OS === 'ios') {
        return `${RNFS.DocumentDirectoryPath}/${localPath}`;
    } else {
        return localPath;
    }
};

export const copyToAppDataDir = async (currentPath: string, filename: string): Promise<string> => {
    const newPath = await getPathForFile(filename);
    try {
        await RNFS.copyFile(
            currentPath,
            newPath,
        );
    } catch (e) {
        Debug.log('copyToAppDataDir', e);
        throw e;
    }
    return `${FILE_PROTOCOL}${newPath}`;
};

export const getPathForFile = async (filename: string): Promise<string> => {
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
