import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { isDemoField, slugField, slugHistoryField } from '../fields'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['contests'])

// Contests (spec §4). Entries are children's work, so the record keeps as
// little as possible: a first name and an age — never a surname or contact —
// and an entry can't be saved without the parent's consent ticked. Voting
// arrives in a later stage; the page shows "Voting opens soon".
export const Contests: CollectionConfig = {
  slug: 'contests',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'startAt', 'endAt'], group: 'Content' },
  access: {
    // Public: everything but upcoming drafts is visible — a contest has its own status.
    read: ({ req }) => (req.user ? true : { status: { in: ['active', 'finished', 'upcoming'] } }),
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
    { name: 'description', type: 'textarea' },
    { name: 'rules', type: 'richText' },
    {
      type: 'row',
      fields: [
        { name: 'startAt', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'endAt', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
    {
      name: 'entries',
      type: 'array',
      labels: { singular: 'Entry', plural: 'Entries' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'title', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            {
              name: 'participantFirstName',
              type: 'text',
              required: true,
              label: 'First name',
              admin: { description: 'First name only — no surname.' },
            },
            { name: 'participantAge', type: 'number', required: true, min: 2, max: 18, label: 'Age' },
          ],
        },
        {
          name: 'parentConsent',
          type: 'checkbox',
          required: true,
          label: 'A parent or guardian agreed to publishing this work',
          validate: (v: boolean | null | undefined) => v === true || 'Parental consent is required to publish an entry',
        },
      ],
    },
    slugField('title'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Active', value: 'active' },
        { label: 'Finished', value: 'finished' },
      ],
      admin: { position: 'sidebar' },
    },
    isDemoField,
    slugHistoryField,
  ],
}
