import * as RNFS from 'react-native-fs';
import { getSwarmGatewayUrl } from '../Swarm';

export interface ImageData {
    uri?: string;
    width?: number;
    height?: number;
    data?: string;
    localPath?: string;
}

export const getLocalPath = (localPath: string): string => {
    const documentPath = 'file://' + RNFS.DocumentDirectoryPath + '/';
    return documentPath + localPath;
};

export const getImageUri = (image: ImageData): string => {
    if (image.localPath != null) {
        return getLocalPath(image.localPath);
    }
    if (image.uri != null) {
        return getSwarmGatewayUrl(image.uri);
    }
    return '';
};