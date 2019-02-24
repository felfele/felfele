// @ts-ignore
import * as RNFS from 'react-native-fs';

import { ModelHelper, Rectangle } from './ModelHelper';
import { Author } from './Post';
import { ImageData } from './ImageData';
import { getSwarmGatewayUrl } from '../swarm/Swarm';

export class ReactNativeModelHelper implements ModelHelper {
    public getAuthorImageUri(author: Author): string {
        // this is here for compatibility with previous version where
        // image was optional
        if (author.image == null) {
            return author.faviconUri;
        }
        if (author.image.localPath != null) {
            return this.getLocalPath(author.image.localPath);
        }
        if (author.image.uri != null) {
            return author.image.uri;
        }
        return author.faviconUri;
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
            return getSwarmGatewayUrl(image.uri);
        }
        return '';
    }

    public calculateImageDimensions(image: ImageData, maxWidth: number): Rectangle {
        if (image.width == null || image.height == null) {
            return {
                width: maxWidth,
                height: maxWidth,
            };
        }
        const ratio = image.width / maxWidth;
        const height = image.height / ratio;
        return {
            width: maxWidth,
            height: height,
        };
    }
}
