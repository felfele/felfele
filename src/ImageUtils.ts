import ImageResizer from 'react-native-image-resizer';

import { ImageData } from './models/ImageData';
import { Debug } from './Debug';
import { calculateImageDimensions } from './models/ModelHelper';

const MAX_UPLOADED_IMAGE_DIMENSION = 400;
const MAX_UPLOADED_IMAGE_SIZE = 500 * 1024;
const MAX_PLACEHOLDER_DIMENSION = 10;

const isImageExceedMaximumDimensions = (image: ImageData): boolean => {
    if (image.width != null && image.width >= MAX_UPLOADED_IMAGE_DIMENSION) {
        return true;
    }
    if (image.height != null && image.height >= MAX_UPLOADED_IMAGE_DIMENSION) {
        return true;
    }
    return false;
};

export const resizeImageIfNeeded = async (image: ImageData, path: string): Promise<string> => {
    return resizeImage(image, path, MAX_UPLOADED_IMAGE_DIMENSION, MAX_UPLOADED_IMAGE_SIZE);
};

export const resizeImageForPlaceholder = async (image: ImageData, path: string): Promise<string> => {
    const { width, height } = calculateImageDimensions(image, MAX_PLACEHOLDER_DIMENSION);
    const resizedImagePNG = await ImageResizer.createResizedImage(path, width, height, 'PNG', 100);
    Debug.log('resizeImageForPlaceholder: ', 'resizedImagePNG', resizedImagePNG);
    return resizedImagePNG.uri;
};

const resizeImage = async (
    image: ImageData,
    path: string,
    maxDimension: number,
    maxImageSize: number,
): Promise<string> => {
    if (isImageExceedMaximumDimensions(image)) {
        const { width, height } = calculateImageDimensions(image, maxDimension);
        const resizedImagePNG = await ImageResizer.createResizedImage(path, width, height, 'PNG', 100);
        Debug.log('resizeImageIfNeeded: ', 'resizedImagePNG', resizedImagePNG);
        if (resizedImagePNG.size != null && resizedImagePNG.size < maxImageSize) {
            return resizedImagePNG.uri;
        }
        const resizedImageJPEG = await ImageResizer.createResizedImage(path, width, height, 'JPEG', 100);
        Debug.log('resizeImageIfNeeded: ', 'resizedImageJPEG', resizedImageJPEG);
        return resizedImageJPEG.uri;
    }
    return path;
};
