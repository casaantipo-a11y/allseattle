import * as migration_20260930_162608_initial from './20260930_162608_initial';
import * as migration_20260930_181026_phase2_directory from './20260930_181026_phase2_directory';
import * as migration_20261001_110926_phase3_sections from './20261001_110926_phase3_sections';
import * as migration_20261001_140215_r2_object_key from './20261001_140215_r2_object_key';
import * as migration_20261001_150947_phase4_banners from './20261001_150947_phase4_banners';
import * as migration_20261002_170344_header_sub_links from './20261002_170344_header_sub_links';
import * as migration_20261007_105644_map_ad_slot_page from './20261007_105644_map_ad_slot_page';
import * as migration_20261012_132825_newsletter_submission_type from './20261012_132825_newsletter_submission_type';
import * as migration_20261014_030515_stage3_customers from './20261014_030515_stage3_customers';
import * as migration_20261014_032801_stage3_listings_moderation from './20261014_032801_stage3_listings_moderation';
import * as migration_20261014_042505_stage3_business_accounts from './20261014_042505_stage3_business_accounts';
import * as migration_20261014_045703_stage3_contest_votes from './20261014_045703_stage3_contest_votes';
import * as migration_20261014_050730_stage3_package_subscriptions from './20261014_050730_stage3_package_subscriptions';
import * as migration_20261014_052145_stage3_banner_places from './20261014_052145_stage3_banner_places';
import * as migration_20261014_164109_site_notes from './20261014_164109_site_notes';
import * as migration_20261014_174433_stage3_merge_client from './20261014_174433_stage3_merge_client';

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
    name: '20261002_170344_header_sub_links',
  },
  {
    up: migration_20261007_105644_map_ad_slot_page.up,
    down: migration_20261007_105644_map_ad_slot_page.down,
    name: '20261007_105644_map_ad_slot_page',
  },
  {
    up: migration_20261012_132825_newsletter_submission_type.up,
    down: migration_20261012_132825_newsletter_submission_type.down,
    name: '20261012_132825_newsletter_submission_type',
  },
  {
    up: migration_20261014_030515_stage3_customers.up,
    down: migration_20261014_030515_stage3_customers.down,
    name: '20261014_030515_stage3_customers',
  },
  {
    up: migration_20261014_032801_stage3_listings_moderation.up,
    down: migration_20261014_032801_stage3_listings_moderation.down,
    name: '20261014_032801_stage3_listings_moderation',
  },
  {
    up: migration_20261014_042505_stage3_business_accounts.up,
    down: migration_20261014_042505_stage3_business_accounts.down,
    name: '20261014_042505_stage3_business_accounts',
  },
  {
    up: migration_20261014_045703_stage3_contest_votes.up,
    down: migration_20261014_045703_stage3_contest_votes.down,
    name: '20261014_045703_stage3_contest_votes',
  },
  {
    up: migration_20261014_050730_stage3_package_subscriptions.up,
    down: migration_20261014_050730_stage3_package_subscriptions.down,
    name: '20261014_050730_stage3_package_subscriptions',
  },
  {
    up: migration_20261014_052145_stage3_banner_places.up,
    down: migration_20261014_052145_stage3_banner_places.down,
    name: '20261014_052145_stage3_banner_places',
  },
  {
    up: migration_20261014_164109_site_notes.up,
    down: migration_20261014_164109_site_notes.down,
    name: '20261014_164109_site_notes',
  },
  {
    up: migration_20261014_174433_stage3_merge_client.up,
    down: migration_20261014_174433_stage3_merge_client.down,
    name: '20261014_174433_stage3_merge_client'
  },
];
