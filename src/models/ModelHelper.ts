import { Author } from './Post';
import { ImageData } from './ImageData';

export interface ModelHelper {
    getAuthorImageUri: (author: Author) => string;
    getLocalPath: (localPath: string) => string;
    getImageUri: (image: ImageData) => string;
}

export const calculateImageDimensions = (image: ImageData, maxWidth: number): number[] => {
    if (image.width == null || image.height == null) {
        return [maxWidth, maxWidth];
    }
    const ratio = image.width / maxWidth;
    const height = image.height / ratio;
    return [maxWidth, height];
};
