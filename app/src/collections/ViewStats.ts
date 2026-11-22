import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'

// Daily page views (counters block, 22.11.2026). One row per (kind, docId, date):
// kind `car` / `job` / `business` with the document's id, or `site` with docId 0 for
// every public page of the site. Rows are written only by POST /api/views with an
// atomic upsert on the unique index — see recordView in src/lib/stats.ts. In the
// admin they are read-only. `kind` is plain text, not a select, so a new kind
// later needs no enum migration.
export const ViewStats: CollectionConfig = {
  slug: 'view-stats',
  admin: {
    defaultColumns: ['kind', 'docId', 'date', 'views'],
    group: 'Advertising',
    description:
      'Daily page views, written by the site. Read-only. kind: site (all pages, docId 0), business, car, job.',
  },
  defaultSort: '-date',
  access: {
    read: canWrite('sales'),
    create: () => false,
    update: () => false,
    delete: canWrite('sales'),
  },
  indexes: [{ fields: ['kind', 'docId', 'date'], unique: true }],
  fields: [
    { name: 'kind', type: 'text', required: true, index: true },
    { name: 'docId', type: 'number', required: true, defaultValue: 0, admin: { description: 'Id of the business / car / job; 0 for the whole site.' } },
    { name: 'date', type: 'text', required: true, index: true, admin: { description: 'YYYY-MM-DD, Seattle time' } },
    { name: 'views', type: 'number', required: true, defaultValue: 0 },
  ],
}
