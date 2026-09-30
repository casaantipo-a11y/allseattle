import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { isDemoField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['news', 'news-categories'], (doc) =>
  doc.slug ? [`/news/${doc.slug}`] : [],
)

export const NewsCategories: CollectionConfig = {
  slug: 'news-categories',
  labels: { singular: 'News category', plural: 'News categories' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'order'], group: 'News' },
  defaultSort: 'order',
  access: {
    read: () => true,
    create: canWrite('editor'),
    update: canWrite('editor'),
    delete: canWrite('editor'),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    isDemoField,
  ],
}
