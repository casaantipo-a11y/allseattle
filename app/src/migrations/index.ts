import * as migration_20260930_162608_initial from './20260930_162608_initial';
import * as migration_20260930_181026_phase2_directory from './20260930_181026_phase2_directory';
import * as migration_20261001_110926_phase3_sections from './20261001_110926_phase3_sections';
import * as migration_20261001_140215_r2_object_key from './20261001_140215_r2_object_key';
import * as migration_20261001_150947_phase4_banners from './20261001_150947_phase4_banners';
import * as migration_20261002_170344_header_sub_links from './20261002_170344_header_sub_links';

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
    name: '20261001_110926_phase3_sections',
  },
  {
    up: migration_20261001_140215_r2_object_key.up,
    down: migration_20261001_140215_r2_object_key.down,
    name: '20261001_140215_r2_object_key',
  },
  {
    up: migration_20261001_150947_phase4_banners.up,
    down: migration_20261001_150947_phase4_banners.down,
    name: '20261001_150947_phase4_banners',
  },
  {
    up: migration_20261002_170344_header_sub_links.up,
    down: migration_20261002_170344_header_sub_links.down,
    name: '20261002_170344_header_sub_links'
  },
];
