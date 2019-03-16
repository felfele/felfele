import { PrivateIdentity } from './Identity';
import { ImageData } from './ImageData';

export const DEFAULT_AUTHOR_NAME = 'Space Cowboy';

export interface Author {
    name: string;
    uri: string;
    faviconUri: string;
    image: ImageData;
    identity?: PrivateIdentity;
}
