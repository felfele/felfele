import { MigrationManifest } from 'redux-persist';
import { migrateUnversionedToVersion0 } from './version0';
import { migrateVersion0ToVersion1 } from './version1';
import { migrateVersion1ToVersion2 } from './version2';

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
    1: migrateVersion0ToVersion1,
    currentAppStateVersion: migrateVersion1ToVersion2,
};
