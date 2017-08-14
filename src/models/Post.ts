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

export interface Post extends Model {
    images: ImageData[];
    text: string;
    createdAt: number;
    location?: Location;
    syncId?: number;
    deleted?: boolean;
}