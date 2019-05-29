import { Model } from './Model';
import { BundledImage } from './ImageData';

export interface Feed extends Model {
    name: string;
    url: string;
    feedUrl: string;
    favicon: string | BundledImage;
    followed?: boolean;
    favorite?: boolean;
    contentHash?: string;
}
