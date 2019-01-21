import sha1 from 'js-sha1';
import { FileSystem } from './FileSystem';

const getExtensionFromPath = (path: string): string => {
    const lastIndexOfDot = path.lastIndexOf('.');
    if (lastIndexOfDot !== -1) {
        return path.slice(lastIndexOfDot + 1);
    }
    return '';
};

export enum ImageStorePath {
    AVATARS = 'avatars',
}

const FILE_PREFIX = 'file://';

const calculateStoredImageHash = (url: string): string =>
    sha1.create().update(url).hex();

export const downloadImageAndStore = async (url: string, relativePath: ImageStorePath): Promise<string> => {
    if (url.startsWith(FILE_PREFIX)) {
        return url;
    }
    const extension = getExtensionFromPath(url);
    if (extension === '') {
        return url;
    }
    const hash = calculateStoredImageHash(url);
    const filename =  hash + '.' + extension;
    const path = FileSystem.getDocumentDir() + '/' + relativePath + '/' + filename;

    console.log('downloadImageAndStore', 'path', path);
    if (await FileSystem.exists(path)) {
        return FILE_PREFIX + path;
    }
    const resourcePath = FILE_PREFIX + await FileSystem.downloadFile(url, path);
    console.log('downloadImageAndStore', 'resourcePath', resourcePath);
    return resourcePath;
};

export const downloadAvatarAndStore = async (url: string): Promise<string> =>
    await downloadImageAndStore(url, ImageStorePath.AVATARS);
