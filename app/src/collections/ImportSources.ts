import type { CollectionConfig, Field } from 'payload'

import { isAdmin, isStaff, staffOnlyField } from '../access/roles'

// Where the automatic import of events and news reads from (lib/import/). Each
// row is one Ticketmaster query, one ICS feed or one RSS feed. The importer
// only ever creates drafts; the last-run fields are filled by it, never by hand.
// Only admins change sources: a URL here is fetched by the server.

type SiblingData = { type?: string; target?: string }

export const ImportSources: CollectionConfig = {
  slug: 'import-sources',
  labels: { singular: 'Import source', plural: 'Import sources' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'target', 'enabled', 'lastRunAt', 'lastResult'],
    group: 'Import',
    description: 'Where events and news drafts come from. Imported items always arrive as drafts — publish them in Events / News.',
  },
  defaultSort: 'name',
  access: {
    read: ({ req }) => isStaff(req),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Ticketmaster', value: 'ticketmaster' },
            { label: 'ICS calendar', value: 'ics' },
            { label: 'RSS feed', value: 'rss' },
          ],
        },
        {
          name: 'target',
          type: 'select',
          required: true,
          options: [
            { label: 'Events', value: 'events' },
            { label: 'News', value: 'news' },
          ],
          validate: (value: string | null | undefined, { siblingData }: { siblingData: SiblingData }) => {
            if (!value) return 'Required'
            const need = siblingData.type === 'rss' ? 'news' : siblingData.type ? 'events' : null
            if (need && value !== need) return need === 'news' ? 'An RSS feed fills News' : 'Ticketmaster and ICS fill Events'
            return true
          },
        },
      ],
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'https:// address of the feed. Not used by Ticketmaster (its key is set on the server).',
        condition: (d) => d?.type !== 'ticketmaster',
      },
      validate: (value: string | null | undefined, { siblingData }: { siblingData: SiblingData }) => {
        if (siblingData.type === 'ticketmaster') return true
        if (!value?.trim()) return 'Required for ICS and RSS'
        return /^https:\/\/\S+$/.test(value.trim()) ? true : 'Must be an https:// address'
      },
    },
    {
      name: 'defaultCategory',
      type: 'relationship',
      relationTo: ['event-categories', 'news-categories'],
      required: true,
      admin: { description: 'Used when the item has no category of its own, or the source’s one is unknown. Pick one of the kind chosen in Target.' },
      validate: (value: unknown, { siblingData }: { siblingData: SiblingData }) => {
        const picked = value && typeof value === 'object' ? (value as { relationTo?: string }).relationTo : undefined
        if (!picked) return 'Required'
        const want = siblingData.target === 'news' ? 'news-categories' : siblingData.target === 'events' ? 'event-categories' : null
        return !want || picked === want ? true : `Target is ${siblingData.target}: pick a ${want === 'news-categories' ? 'news' : 'event'} category`
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'maxItemsPerRun', type: 'number', defaultValue: 20, min: 1, max: 100, admin: { description: 'How many items a run reads from the source, soonest first. Ones already imported are skipped; raise it to bring in more.' } },
      ],
    },
    {
      // External ids of items an editor deleted, so the next run doesn't bring them back
      // (lib/import/dismissed.ts). Written by the delete hook only, never from the admin.
      name: 'dismissed',
      type: 'json',
      access: { create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      type: 'collapsible',
      label: 'Last run',
      admin: { initCollapsed: false },
      fields: [
        { name: 'lastRunAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime', timeFormat: 'h:mm a' } } },
        { name: 'lastResult', type: 'text', admin: { readOnly: true, description: 'e.g. “12 new, 30 skipped”.' } },
        { name: 'lastError', type: 'textarea', admin: { readOnly: true, description: 'Empty when the last run went fine.' } },
      ],
    },
  ],
}

// Added to Events and News. The importer sets them; nobody edits them by hand, and
// the public REST never returns where an item came from. `origin` is public (a
// plain flag) but locked after creation: the cleanup deletes only `origin: import`
// drafts, so a manual item must never be switchable into one.
export const importFields: Field[] = [
  {
    name: 'origin',
    type: 'select',
    defaultValue: 'manual',
    index: true,
    options: [
      { label: 'Manual', value: 'manual' },
      { label: 'Import', value: 'import' },
    ],
    access: { update: () => false },
    admin: { position: 'sidebar', readOnly: true, description: 'Imported items arrive as drafts. Imported news carries the source’s own text: rewrite it in your own words and add a cover before publishing — feeds carry no usable pictures.' },
  },
  {
    name: 'importSource',
    type: 'relationship',
    relationTo: 'import-sources',
    access: { read: staffOnlyField, create: () => false, update: () => false },
    admin: { position: 'sidebar', readOnly: true, condition: (d) => d?.origin === 'import' },
  },
  {
    name: 'externalId',
    type: 'text',
    access: { read: staffOnlyField, create: () => false, update: () => false },
    admin: { position: 'sidebar', readOnly: true, condition: (d) => d?.origin === 'import', description: 'The source’s own id; keeps an item from being imported twice.' },
  },
]

// The pair is unique, so a repeated run can't create the same item twice. Manual
// items leave both empty and never collide (NULLs are distinct in Postgres).
export const importIndexes = [{ fields: ['importSource', 'externalId'], unique: true }]
