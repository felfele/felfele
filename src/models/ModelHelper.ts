import { Author } from './Post';
import { ImageData } from './ImageData';

export interface Rectangle {
    width: number;
    height: number;
}

export interface ModelHelper {
    getAuthorImageUri: (author: Author) => string;
    getLocalPath: (localPath: string) => string;
    getImageUri: (image: ImageData) => string;
    calculateImageDimensions(image: ImageData, maxWidth: number): Rectangle;
}
