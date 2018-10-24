import { Model } from './Model';

export interface Feed extends Model {
    name: string;
    url: string;
    feedUrl: string;
    favicon: string;
    contentHash?: string;
}
