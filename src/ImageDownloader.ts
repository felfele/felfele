import sha1 from 'js-sha1';
import { getSwarmGatewayUrl } from './Swarm';
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
export const downloadImageAndStore = async (url: string, relativePath: ImageStorePath): Promise<string> => {
    const extension = getExtensionFromPath(url);
    if (extension === '') {
        return url;
    }
    const hash = sha1.create().update(url).hex();
    const filename =  hash + '.' + extension;
    const path = FileSystem.getDocumentDir() + '/' + relativePath + '/' + filename;

    console.log('downloadImageAndStore', 'path', path);
    if (await FileSystem.exists(path)) {
        return FILE_PREFIX + path;
    }
    const downloadUrl = getSwarmGatewayUrl(url);
    const resourcePath = FILE_PREFIX + await FileSystem.downloadFile(downloadUrl, path);
    console.log('downloadImageAndStore', 'resourcePath', resourcePath);
    return resourcePath;
};
