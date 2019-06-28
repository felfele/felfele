import { PrivateIdentity, PublicIdentity } from './Identity';
import { ImageData } from './ImageData';

export interface PublicProfile {
    name: string;
    image: ImageData;
    identity: PublicIdentity;
}

export interface PrivateProfile {
    name: string;
    image: ImageData;
    identity: PrivateIdentity;
}
