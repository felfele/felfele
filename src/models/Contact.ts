import { PublicIdentity } from './Identity';
import { ImageData } from './ImageData';

export interface Contact {
    name: string;
    image: ImageData;
    identity: PublicIdentity;
}
