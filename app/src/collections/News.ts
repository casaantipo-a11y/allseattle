import type { CollectionConfig } from 'payload'

import { canWrite, publishedOrLoggedIn } from '../access/roles'
import { isDemoField, slugField, slugHistoryField, statusField } from '../fields'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'

// Every page that shows news reads it through unstable_cache tagged "news",
// and Next.js drops a route's cached HTML together with the data tags it used
// — so expiring the tag is enough, no per-URL list is needed.
const revalidate = revalidateCollection(['news'])

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Article', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt', 'isTop'],
    group: 'News',
    listSearchableFields: ['title', 'excerpt'],
  },
  defaultSort: '-publishedAt',
  access: {
    read: publishedOrLoggedIn,
    create: canWrite('editor'),
    update: canWrite('editor'),
    delete: canWrite('editor'),
  },
  hooks: {
    beforeChange: [rememberOldSlug],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'One or two sentences. Shown in the feed and used as the default search description.' },
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'source',
      type: 'text',
      admin: { description: 'Optional: where the story came from — a name or a link.' },
    },
    slugField('title'),
    statusField,
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', timeFormat: 'h:mm a' },
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'news-categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isTop',
      type: 'checkbox',
      defaultValue: false,
      label: 'Top news',
      admin: { position: 'sidebar', description: 'Shown in the Top news block.' },
    },
    { name: 'author', type: 'text', admin: { position: 'sidebar' } },
    { name: 'tags', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
    isDemoField,
    slugHistoryField,
  ],
}
