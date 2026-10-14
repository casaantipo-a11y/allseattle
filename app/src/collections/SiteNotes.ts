import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

// Notes on site pages for the admins only (client, 15.10.2026): an admin signed in
// to /admin sees a "Notes" button on every page of the site (components/AdminNotes)
// and can leave a note on that page — what to fix, what to check — for the other
// admins. Nobody else can read them, through the site or the API.

const stampAuthor: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' && req.user) data.author = req.user.id
  if (typeof data.path === 'string') data.path = data.path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  return data
}

export const SiteNotes: CollectionConfig = {
  slug: 'site-notes',
  labels: { singular: 'Site note', plural: 'Site notes' },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['path', 'text', 'author', 'resolved', 'createdAt'],
    group: 'Content',
    description: 'Notes left on site pages. Only admins see them — on the site (the Notes button) and here.',
  },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeChange: [stampAuthor] },
  fields: [
    { name: 'path', type: 'text', required: true, index: true, admin: { description: 'The page, e.g. /news or /biz/some-business.' } },
    { name: 'text', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'author', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'resolved', type: 'checkbox', defaultValue: false, index: true, admin: { position: 'sidebar', description: 'Done — kept for the record.' } },
  ],
}
