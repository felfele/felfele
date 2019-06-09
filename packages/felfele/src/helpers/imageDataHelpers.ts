import { ImageData, BundledImage } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';

export const getImageSource = (
    imageData: ImageData,
    modelHelper: ModelHelper,
    defaultImage?: BundledImage,
): BundledImage | { uri: string } => {
    const sourceImageUri = modelHelper.getImageUri(imageData);
    if (isBundledImage(sourceImageUri)) {
        return sourceImageUri;
    }
    const source = sourceImageUri !== '' || defaultImage == null
        ? { uri: sourceImageUri }
        : defaultImage
    ;
    return source;
};

export const isBundledImage = (path?: string | BundledImage): path is BundledImage => {
    return typeof path === 'number';
};
