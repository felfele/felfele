import { Model } from './Model';

export interface ContentFilter extends Model {
    filter: string;
    createdAt: number;
    validUntil: number;
}
