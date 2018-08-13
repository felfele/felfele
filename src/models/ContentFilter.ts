import { Model } from './Model';
import { DateUtils } from '../DateUtils';

export interface ContentFilter extends Model {
    text: string;
    createdAt: number;
    validUntil: number;
}

export const filterValidUntilToText = (validUntil: number): string => {
    if (validUntil === 0) {
        return 'forever';
    }
    return DateUtils.printableElapsedTime(0, validUntil);
};
