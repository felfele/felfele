import { ImageData } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';

export const getImageSource = (imageData: ImageData, modelHelper: ModelHelper, defaultImage?: number) => {
    const sourceImageUri = modelHelper.getImageUri(imageData);
    if (typeof sourceImageUri === 'number') {
        return sourceImageUri;
    }
    const source = sourceImageUri !== '' || defaultImage == null
        ? { uri: sourceImageUri }
        : defaultImage;
    return source;
};
