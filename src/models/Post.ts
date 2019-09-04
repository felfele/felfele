import { Model } from './Model';
import { ImageData } from './ImageData';
import { Author } from './Author';
import { HexString } from '../helpers/opaqueTypes';

interface Location {
    latitude: number;
    longitude: number;
}

type PostLink = string;

export interface PostReferences {
    parent: PostLink;
    original: PostLink;
    originalAuthor: Author;
}

export interface PublicPost extends Model {
    images: ImageData[];
    text: string;
    createdAt: number;
    references?: PostReferences;
}

export interface Post extends PublicPost {
    link?: string;
    location?: Location;
    deleted?: boolean;
    author?: Author;
    updatedAt?: number;
    liked?: boolean;
    isUploading?: boolean;
    topic?: HexString;
}
