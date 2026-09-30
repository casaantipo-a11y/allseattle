import type { Block, CollectionConfig } from 'payload'

import { canWrite, publishedOrLoggedIn } from '../access/roles'
import { isDemoField, slugField, slugHistoryField, statusField } from '../fields'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['pages'])

// Static pages: About, Advertise, Contact, Privacy Policy, Terms of Use.
// Rich text for the body, plus a couple of blocks for what plain text can't do.
const ContentBlock: Block = {
  slug: 'content',
  labels: { singular: 'Text', plural: 'Text' },
  fields: [{ name: 'body', type: 'richText', required: true }],
}

const CallToActionBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'text', type: 'textarea', required: true },
    { name: 'buttonLabel', type: 'text', required: true },
    { name: 'buttonUrl', type: 'text', required: true },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'status'], group: 'Content' },
  access: {
    read: publishedOrLoggedIn,
    create: canWrite(),
    update: canWrite('editor'),
    delete: canWrite(),
  },
  hooks: {
    beforeChange: [rememberOldSlug],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'intro', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'blocks', type: 'blocks', blocks: [ContentBlock, CallToActionBlock] },
    slugField('title'),
    statusField,
    isDemoField,
    slugHistoryField,
  ],
}
