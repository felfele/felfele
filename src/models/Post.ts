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

export interface Post extends Model {
    images: ImageData[];
    text: string;
    createdAt: number;
    link?: string;
    location?: Location;
    deleted?: boolean;
    author?: Author;
    updatedAt?: number;
    liked?: boolean;
}
