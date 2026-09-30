import * as migration_20260930_162608_initial from './20260930_162608_initial';
import * as migration_20260930_181026_phase2_directory from './20260930_181026_phase2_directory';

export const migrations = [
  {
    up: migration_20260930_162608_initial.up,
    down: migration_20260930_162608_initial.down,
    name: '20260930_162608_initial',
  },
  {
    up: migration_20260930_181026_phase2_directory.up,
    down: migration_20260930_181026_phase2_directory.down,
    name: '20260930_181026_phase2_directory'
  },
];
