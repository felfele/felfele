import { ImageData, BundledImage } from './ImageData';

export interface Rectangle {
    width: number;
    height: number;
}

export interface ModelHelper {
    getLocalPath: (localPath: string) => string;
    getImageUri: (image: ImageData) => string | BundledImage;
}

export const calculateImageDimensions = (image: ImageData, maxWidth: number, maxHeight: number): Rectangle => {
    if (image.width == null || image.height == null) {
        return {
            width: maxWidth,
            height: maxHeight,
        };
    }
    const ratio = image.width / maxWidth;
    const height = image.height / ratio;
    return {
        width: maxWidth,
        height: height,
    };
};
