import RNFetchBlob from 'rn-fetch-blob';
import sha1 from 'js-sha1';
import { getSwarmGatewayUrl } from './Swarm';

const getExtensionFromPath = (path: string): string => {
    const lastIndexOfDot = path.lastIndexOf('.');
    if (lastIndexOfDot !== -1) {
        return path.slice(lastIndexOfDot + 1);
    }
    return '';
};

export const ImageStorePath = {
    AVATARS: 'avatars',
};

const FILE_PREFIX = 'file://';
export const downloadImageAndStore = async (url: string, relativePath: string = ''): Promise<string> => {
    const dirs = RNFetchBlob.fs.dirs;
    const extension = getExtensionFromPath(url);
    if (extension === '') {
        return url;
    }
    const hash = sha1.create().update(url).hex();
    const filename =  hash + '.' + extension;
    const path = dirs.DocumentDir + '/' + relativePath + '/' + filename;

    console.log('downloadImageAndStore', 'path', path);
    if (await RNFetchBlob.fs.exists(path)) {
        return FILE_PREFIX + path;
    }
    const downloadUrl = getSwarmGatewayUrl(url);
    const resource = await RNFetchBlob
        .config({
            path,
        })
        .fetch('GET', downloadUrl)
        ;

    const resourcePath = FILE_PREFIX + resource.path();
    console.log('downloadImageAndStore', 'resourcePath', resourcePath);
    return resourcePath;
};
