import { BrandedType } from '../helpers/opaqueTypes';

export type ImageDataRequiredSource = BrandedType<number, 'ImageDataRequiredSource'>;

export interface ImageData {
    uri?: string;
    width?: number;
    height?: number;
    data?: string;
    localPath?: string | ImageDataRequiredSource;
}
