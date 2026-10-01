import * as migration_20260930_162608_initial from './20260930_162608_initial';
import * as migration_20260930_181026_phase2_directory from './20260930_181026_phase2_directory';
import * as migration_20261001_110926_phase3_sections from './20261001_110926_phase3_sections';

export const migrations = [
  {
    up: migration_20260930_162608_initial.up,
    down: migration_20260930_162608_initial.down,
    name: '20260930_162608_initial',
  },
  {
    up: migration_20260930_181026_phase2_directory.up,
    down: migration_20260930_181026_phase2_directory.down,
    name: '20260930_181026_phase2_directory',
  },
  {
    up: migration_20261001_110926_phase3_sections.up,
    down: migration_20261001_110926_phase3_sections.down,
    name: '20261001_110926_phase3_sections'
  },
];
