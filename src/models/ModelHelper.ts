import { getSwarmGatewayUrl } from '../Swarm';
import { Author } from './Post';
import { ImageData } from './ImageData';
import { FileSystem } from '../FileSystem';

export class ModelHelper {
    public getAuthorImageUri(author: Author): string {
        // this is here for compatibility with previous version where
        // image was optional
        if (author.image == null) {
            return author.faviconUri;
        }
        if (author.image.localPath != null) {
            return FileSystem.getLocalPath(author.image.localPath);
        }
        if (author.image.uri != null) {
            return author.image.uri;
        }
        return author.faviconUri;
    }

    public getImageUri(image: ImageData): string {
        if (image.localPath != null) {
            return FileSystem.getLocalPath(image.localPath);
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
