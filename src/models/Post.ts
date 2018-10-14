import { Model } from './Model';

interface Location {
    latitude: number;
    longitude: number;
}

export interface ImageData {
    uri: string;
    width?: number;
    height?: number;
    data?: string;
    localPath?: string;
}

export interface Author {
    name: string;
    uri: string;
    faviconUri: string;
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
