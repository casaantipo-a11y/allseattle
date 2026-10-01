import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { isDemoField } from '../fields'

// Files that aren't pictures: businesses' price lists and certificates (PDF,
// or a scan as an image). Stored like Media — R2 when configured.
export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: { useAsTitle: 'title', group: 'Business' },
  access: {
    read: () => true,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  upload: {
    staticDir: process.env.MEDIA_DIR ? `${process.env.MEDIA_DIR}-documents` : 'documents',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Shown as the link text, e.g. "Spring menu 2026"' } },
    isDemoField,
  ],
}
