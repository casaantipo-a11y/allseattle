import * as migration_20260930_162608_initial from './20260930_162608_initial';

export const migrations = [
  {
    up: migration_20260930_162608_initial.up,
    down: migration_20260930_162608_initial.down,
    name: '20260930_162608_initial'
  },
];
