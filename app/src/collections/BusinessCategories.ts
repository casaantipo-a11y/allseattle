import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { isDemoField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

// One tree of categories for three storefronts. `section` decides where a
// category lives: the Business Directory, Shopping or Leisure — those two are
// not separate entities, just the directory mechanics filtered to their
// section (spec §4). `parent` makes the tree; a business listed in a child
// category also shows up under its parent.
const revalidate = revalidateCollection(['business-categories', 'businesses'])

export const SECTIONS = [
  { label: 'Business Directory', value: 'directory' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Leisure', value: 'leisure' },
] as const
export type Section = (typeof SECTIONS)[number]['value']

export const BusinessCategories: CollectionConfig = {
  slug: 'business-categories',
  labels: { singular: 'Business category', plural: 'Business categories' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'section', 'parent', 'order'],
    group: 'Business',
  },
  defaultSort: 'order',
  access: {
    read: () => true,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'section',
      type: 'select',
      required: true,
      defaultValue: 'directory',
      options: SECTIONS.map((s) => ({ ...s })),
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'business-categories',
      admin: { position: 'sidebar', description: 'Leave empty for a top-level category.' },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    { name: 'icon', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    isDemoField,
  ],
}
