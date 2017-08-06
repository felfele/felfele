import { Model } from './Model';

export const SyncStateDefaultKey = 'default';

export interface SyncState extends Model {
    highestSeenSyncId: number;
    highestSyncedPostId: number;
}