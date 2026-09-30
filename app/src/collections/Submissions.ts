import type { Access, CollectionConfig, Where } from 'payload'

import { hasRole } from '../access/roles'

// Every public form lands here (spec §4, Submissions). Nobody creates them
// through the REST API — the forms post to their own route handlers
// (src/app/(frontend)/api/forms/*), which validate, rate-limit and then write
// with the local API. Who sees what follows the roles: editors get news tips,
// sales get business registrations and ad inquiries.

const TYPES = [
  { label: 'News tip', value: 'news_tip' },
  { label: 'Business registration', value: 'business_registration' },
  { label: 'Ad inquiry', value: 'ad_inquiry' },
] as const

const byRole: Access = ({ req }) => {
  if (hasRole(req, 'admin')) return true
  const types: string[] = []
  if (hasRole(req, 'editor')) types.push('news_tip')
  if (hasRole(req, 'sales')) types.push('business_registration', 'ad_inquiry')
  if (!types.length) return false
  return { type: { in: types } } as Where
}

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['type', 'name', 'businessName', 'status', 'createdAt'],
    group: 'Inbox',
    listSearchableFields: ['name', 'email', 'phone', 'businessName'],
  },
  defaultSort: '-createdAt',
  access: {
    create: () => false,
    read: byRole,
    update: byRole,
    delete: ({ req }) => hasRole(req, 'admin'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', required: true, options: TYPES.map((t) => ({ ...t })), index: true, admin: { readOnly: true } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'new',
          index: true,
          options: [
            { label: 'New', value: 'new' },
            { label: 'In progress', value: 'in_progress' },
            { label: 'Done', value: 'done' },
            { label: 'Rejected', value: 'rejected' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', admin: { readOnly: true } },
        { name: 'email', type: 'email', admin: { readOnly: true } },
        { name: 'phone', type: 'text', admin: { readOnly: true } },
      ],
    },
    { name: 'message', type: 'textarea', admin: { readOnly: true } },
    {
      type: 'collapsible',
      label: 'Business',
      admin: { condition: (d) => d?.type !== 'news_tip' },
      fields: [
        { name: 'businessName', type: 'text', admin: { readOnly: true } },
        { name: 'category', type: 'relationship', relationTo: 'business-categories', admin: { readOnly: true } },
        { name: 'desiredPackage', type: 'relationship', relationTo: 'packages', admin: { readOnly: true } },
        { name: 'desiredSlot', type: 'text', admin: { readOnly: true, description: 'Ad placement the visitor asked about' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'News tip',
      admin: { condition: (d) => d?.type === 'news_tip' },
      fields: [
        { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, admin: { readOnly: true } },
        { name: 'location', type: 'text', admin: { readOnly: true } },
      ],
    },
    { name: 'internalNotes', type: 'textarea', admin: { description: 'Only the team sees this.' } },
    {
      type: 'collapsible',
      label: 'Technical',
      admin: { initCollapsed: true },
      fields: [
        { name: 'ip', type: 'text', index: true, admin: { readOnly: true } },
        { name: 'userAgent', type: 'text', admin: { readOnly: true } },
      ],
    },
  ],
}
