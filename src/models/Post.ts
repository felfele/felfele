import { Model } from './Model';
import { ImageData, getLocalPath } from './ImageData';

interface Location {
    latitude: number;
    longitude: number;
}

export interface PublicIdentity {
    publicKey: string;
    address: string;
}

export interface PrivateIdentity extends PublicIdentity {
    privateKey: string;
}

export interface Author {
    name: string;
    uri: string;
    faviconUri: string;
    image?: ImageData;
    identity?: PrivateIdentity;
}

export interface PublicPost extends Model {
    images: ImageData[];
    text: string;
    createdAt: number;
}

export interface Post extends PublicPost {
    link?: string;
    location?: Location;
    deleted?: boolean;
    author?: Author;
    updatedAt?: number;
    liked?: boolean;
}

export const getAuthorImageUri = (author: Author): string => {
    if (author.image != null) {
        if (author.image.localPath != null) {
            return getLocalPath(author.image.localPath);
        }
        if (author.image.uri != null) {
            return author.image.uri;
        }
    }
    return author.faviconUri;
};
