// @ts-ignore
import * as RNFS from 'react-native-fs';

import { ModelHelper } from './ModelHelper';
import { ImageData } from './ImageData';
import { getSwarmGatewayUrl } from '../swarm/Swarm';

export class ReactNativeModelHelper implements ModelHelper {
    public constructor(private readonly gatewayAddress: string) {
    }

    public getLocalPath(localPath: string): string {
        if (localPath.startsWith('file://')) {
            return localPath;
        }
        const documentPath = 'file://' + RNFS.DocumentDirectoryPath + '/';
        return documentPath + localPath;
    }

    public getImageUri(image: ImageData): string {
        if (image.localPath != null) {
            return this.getLocalPath(image.localPath);
        }
        if (image.uri != null) {
            return getSwarmGatewayUrl(image.uri, this.gatewayAddress);
        }
        return '';
    }
}
