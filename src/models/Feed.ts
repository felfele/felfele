import { Model } from './Model';
import { ImageDataRequiredSource } from './ImageData';

export interface Feed extends Model {
    name: string;
    url: string;
    feedUrl: string;
    favicon: string | ImageDataRequiredSource;
    followed?: boolean;
    favorite?: boolean;
    contentHash?: string;
}
