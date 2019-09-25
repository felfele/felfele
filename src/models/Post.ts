import { Model } from './Model';
import { ImageData } from './ImageData';
import { Author } from './Author';
import { HexString } from '../helpers/opaqueTypes';

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
    author?: Author;
    updatedAt?: number;
    isUploading?: boolean;
    topic?: HexString;
}

export interface PostWithId extends Post {
    _id: HexString;
}

export interface PrivatePost extends PostWithId {
    author: Author;
    topic: HexString;
}
