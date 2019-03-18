import { ImageData } from './ImageData';

export interface Rectangle {
    width: number;
    height: number;
}

export interface ModelHelper {
    getLocalPath: (localPath: string) => string;
    getImageUri: (image: ImageData) => string;
}

export const calculateImageDimensions = (image: ImageData, maxWidth: number): Rectangle => {
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
};
