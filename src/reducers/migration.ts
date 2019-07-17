import { MigrationManifest } from 'redux-persist';
import { migrateUnversionedToVersion0 } from './version0';
import { migrateVersion0ToVersion1 } from './version1';
import { migrateVersion1ToVersion2 } from './version2';
import { migrateVersion2ToVersion3 } from './version3';
import { migrateVersion3ToVersion4 } from './version4';

export const migrateAppState: MigrationManifest = {
    0: migrateUnversionedToVersion0,
    1: migrateVersion0ToVersion1,
    2: migrateVersion1ToVersion2,
    3: migrateVersion2ToVersion3,
    currentAppStateVersion: migrateVersion3ToVersion4,
};
