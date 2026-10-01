import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '../access/roles'
import { isDemoField } from '../fields'

// Uploads go to Cloudflare R2 when the S3_* variables are set (see
// payload.config.ts), otherwise to ./media on local disk. Every image gets
// three WebP renditions sized to where the site actually shows them.
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  upload: {
    // Local folder when R2 is off; MEDIA_DIR lets a throwaway test database
    // keep its files apart from the real ones.
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 320, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'card', width: 640, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'hero', width: 1600, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'What the picture shows, for screen readers and search engines.' },
    },
    { name: 'credit', type: 'text' },
    isDemoField,
  ],
}
