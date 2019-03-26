import { PrivateIdentity } from './Identity';
import { ImageData } from './ImageData';

export interface Author {
    name: string;
    uri: string;
    image: ImageData;
    identity?: PrivateIdentity;
}
