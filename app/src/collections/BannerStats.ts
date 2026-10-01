import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'

// Daily totals per banner (spec §4, BannerStats). Rows are written only by
// the tracking routes (src/app/(frontend)/api/banners/*) with an atomic
// upsert on the unique (banner, date) pair — see recordBannerStat in
// src/lib/banners.ts. In the admin they are read-only; the report on each
// banner's page sums them up.
export const BannerStats: CollectionConfig = {
  slug: 'banner-stats',
  admin: {
    defaultColumns: ['banner', 'date', 'impressions', 'clicks'],
    group: 'Advertising',
    description:
      'Daily impressions and clicks, written by the site. Read-only — see the report on a banner.',
  },
  defaultSort: '-date',
  access: {
    read: canWrite('sales'),
    create: () => false,
    update: () => false,
    delete: canWrite('sales'),
  },
  indexes: [{ fields: ['banner', 'date'], unique: true }],
  fields: [
    { name: 'banner', type: 'relationship', relationTo: 'banners', required: true, index: true },
    {
      name: 'date',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'YYYY-MM-DD, Seattle time' },
    },
    { name: 'impressions', type: 'number', required: true, defaultValue: 0 },
    { name: 'clicks', type: 'number', required: true, defaultValue: 0 },
  ],
}
