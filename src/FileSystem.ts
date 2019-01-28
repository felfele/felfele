import RNFetchBlob from 'rn-fetch-blob';
import { getSwarmGatewayUrl } from './Swarm';
import { Platform } from 'react-native';

// tslint:disable-next-line:no-var-requires
const RNGRP = require('react-native-get-real-path');

class FileSystemStatic {
    public getDocumentDir = () => RNFetchBlob.fs.dirs.DocumentDir;

    public exists = (path: string) => RNFetchBlob.fs.exists(path);

    public downloadFile = async (url: string, path: string): Promise<string> => {
        const downloadUrl = getSwarmGatewayUrl(url);
        const resource = await RNFetchBlob
            .config({
                path,
            })
            .fetch('GET', downloadUrl)
            ;

        return resource.path();
    }

    public isLocalPath = (path: string): boolean => {
         return path.startsWith('file://');
    }

    public getLocalPath = (localPath: string): string => {
        if (FileSystem.isLocalPath(localPath)) {
            return localPath;
        }
        const documentPath = 'file://' + this.getDocumentDir() + '/';
        return documentPath + localPath;
    }

    public getRealPathFromURI = async (uri: string): Promise<string> => {
        return RNGRP.getRealPathFromURI(uri);
    }

    public normalizeImagePathForPlatform = async (imagePath: string): Promise<string> => {
        if (Platform.OS === 'ios') {
            const documentPath = 'file://' + FileSystem.getDocumentDir() + '/';
            if (imagePath.startsWith(documentPath)) {
                return imagePath.substring(documentPath.length);
            }
        } else if (Platform.OS === 'android') {
            const filePath = await FileSystem.getRealPathFromURI(imagePath);
            return 'file://' + filePath;
        }
        return imagePath;
    }
}

export const FileSystem = new FileSystemStatic();
