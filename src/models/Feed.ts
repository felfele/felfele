import { Model } from './Model';

export interface Feed extends Model {
    name: string;
    url: string;
    feedUrl: string;
    favicon: string;
    _localFavicon?: string;
    followed?: boolean;
    favorite?: boolean;
    contentHash?: string;
}
