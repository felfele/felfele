import * as RNFS from 'react-native-fs';

import { ModelHelper } from './ModelHelper';
import { Author } from './Post';
import { ImageData } from './ImageData';
import { getSwarmGatewayUrl } from '../Swarm';

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

    public calculateImageDimensions(image: ImageData, maxWidth: number): number[] {
        if (image.width == null || image.height == null) {
            return [maxWidth, maxWidth];
        }
        const ratio = image.width / maxWidth;
        const height = image.height / ratio;
        return [maxWidth, height];
    }
}
