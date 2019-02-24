import ImageResizer from 'react-native-image-resizer';

import { ImageData } from './models/ImageData';
import { ReactNativeModelHelper } from './models/ReactNativeModelHelper';
import { Debug } from './Debug';

const MAX_UPLOADED_IMAGE_DIMENSION = 400;
const MAX_UPLOADED_IMAGE_SIZE = 500 * 1024;

const modelHelper = new ReactNativeModelHelper();

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
    if (isImageExceedMaximumDimensions(image)) {
        const { width, height } = modelHelper.calculateImageDimensions(image, MAX_UPLOADED_IMAGE_DIMENSION);
        const resizedImagePNG = await ImageResizer.createResizedImage(path, width, height, 'PNG', 100);
        Debug.log('resizeImageIfNeeded: ', 'resizedImagePNG', resizedImagePNG);
        if (resizedImagePNG.size != null && resizedImagePNG.size < MAX_UPLOADED_IMAGE_SIZE) {
            return resizedImagePNG.uri;
        }
        const resizedImageJPEG = await ImageResizer.createResizedImage(path, width, height, 'JPEG', 100);
        Debug.log('resizeImageIfNeeded: ', 'resizedImageJPEG', resizedImageJPEG);
        return resizedImageJPEG.uri;
    }
    return path;
};
