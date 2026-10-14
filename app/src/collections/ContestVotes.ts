import type { CollectionConfig } from 'payload'

import { canWrite, isStaff } from '../access/roles'

// Contest votes (stage 3, step 6): one per email per contest, counted once the
// voter confirms it from the link we email (lib/contest-votes.ts). Created only
// by /api/contests/vote — never through REST — and readable by the team only:
// it holds email addresses.
export const ContestVotes: CollectionConfig = {
  slug: 'contest-votes',
  labels: { singular: 'Contest vote', plural: 'Contest votes' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'contest', 'entryTitle', 'confirmedAt', 'createdAt'],
    group: 'Content',
    description: 'Votes are counted once confirmed from the emailed link. Delete a vote here to take it back.',
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => isStaff(req),
    create: () => false,
    update: () => false,
    delete: canWrite('editor'),
  },
  indexes: [{ fields: ['contest', 'email'], unique: true }],
  fields: [
    { name: 'contest', type: 'relationship', relationTo: 'contests', required: true, index: true },
    { name: 'entryId', type: 'text', required: true, index: true, admin: { description: 'The entry row in the contest.' } },
    { name: 'entryTitle', type: 'text', admin: { description: 'The entry’s title when the vote was cast.' } },
    { name: 'email', type: 'email', required: true },
    { name: 'tokenHash', type: 'text', index: true, admin: { hidden: true } },
    { name: 'confirmedAt', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'ip', type: 'text', index: true },
    { name: 'sentAt', type: 'date', admin: { hidden: true } },
  ],
}
