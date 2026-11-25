import type { Field, FieldHook, PayloadRequest } from 'payload'

import { staffOnlyField } from '../access/roles'

// Seattle has large Russian- and Ukrainian-speaking communities, and a business or a job is often
// titled in its own language. Cyrillic is written out in Latin letters; any other script (Chinese,
// Korean, emoji…) has nothing to keep, so `slugify` gives '' and the caller picks a word of its own.
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', є: 'ye', і: 'i', ї: 'yi', ґ: 'g', ў: 'u',
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[а-яёєіїґў]/g, (c) => CYRILLIC[c] ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

/** What a document is called in its address when its title has no letters `slugify` can keep. */
const SLUG_WORD: Record<string, string> = { businesses: 'business', 'car-listings': 'car', jobs: 'job', events: 'event' }
export const slugBase = (source: string, collection: string) => slugify(source) || SLUG_WORD[collection] || 'item'

const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    const given = typeof value === 'string' ? slugify(value) : ''
    if (given) return given
    const source = data?.[fallbackField] ?? originalDoc?.[fallbackField]
    // A title with no letters to keep (all Chinese, say) still needs an address, and '' would be taken once.
    return typeof source === 'string' ? slugify(source) || `item-${Date.now().toString(36)}` : value
  }

/**
 * Unique, indexed slug. Filled from `fromField` when left empty, always
 * normalised, editable in the sidebar.
 */
export const slugField = (fromField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Part of the page address. Leave empty to generate it from the title.',
  },
  hooks: { beforeValidate: [formatSlug(fromField)] },
})

/**
 * Earlier slugs of the document, so an old URL can answer with a 301 to the
 * current one (spec §9). Filled by `rememberOldSlug`, read-only in the admin.
 */
export const slugHistoryField: Field = {
  name: 'slugHistory',
  type: 'array',
  admin: {
    readOnly: true,
    position: 'sidebar',
    description: 'Old addresses of this page. They redirect here automatically.',
    initCollapsed: true,
  },
  fields: [{ name: 'slug', type: 'text', required: true }],
}

export const statusField: Field = {
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  index: true,
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  admin: { position: 'sidebar' },
}

/** Status of collections that take submissions from site customers (stage 3):
 *  `pending` waits for the team, `rejected` was sent back (the reason goes in
 *  `moderationNote`). Public queries show `published` only, as before. */
export const moderatedStatusField: Field = {
  ...(statusField as Extract<Field, { type: 'select' }>),
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending review', value: 'pending' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
  ],
  admin: { position: 'sidebar', description: 'Submissions from site accounts arrive as Pending review.' },
}

/** The site account that owns a document — a submitted car or job, or a business
 *  it manages (stage 3). Set by the account routes or by the team in the admin. */
export const ownerField = (description = 'The site account that submitted it.'): Field => ({
  name: 'owner',
  type: 'relationship',
  relationTo: 'customers',
  index: true,
  access: { read: staffOnlyField },
  admin: { position: 'sidebar', description },
})

/** The team's reason for a rejection, which the author sees in their account and in the email. */
export const moderationNoteField: Field = {
  name: 'moderationNote',
  type: 'textarea',
  access: { read: staffOnlyField },
  admin: { position: 'sidebar', description: 'If you reject it: why. The author sees this.' },
}

/** Owner, rejection note and views of the cars and jobs site customers post. */
export const submissionFields: Field[] = [
  ownerField(),
  moderationNoteField,
  {
    // Counted by /api/views (one per browser session), shown to the author in the account.
    name: 'viewsCount',
    type: 'number',
    defaultValue: 0,
    admin: { position: 'sidebar', readOnly: true },
  },
]

export const isDemoField: Field = {
  name: 'isDemo',
  type: 'checkbox',
  defaultValue: false,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Demo content. Removed in one go by `pnpm purge-demo` before launch.',
  },
}

/** `base`, or `base-2`, `base-3`… — the first one no other document uses. */
export async function uniqueSlug(req: PayloadRequest, collection: string, source: string, excludeId?: number | string) {
  const base = slugBase(source, collection)
  let candidate = base
  for (let i = 2; i < 500; i++) {
    const { totalDocs } = await req.payload.count({
      collection: collection as never,
      where: { and: [{ slug: { equals: candidate } }, ...(excludeId ? [{ id: { not_equals: excludeId } }] : [])] },
      req,
    })
    if (!totalDocs) return candidate
    candidate = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

/**
 * Slug for collections whose titles repeat (two "2021 Toyota Camry" listings,
 * many "Barista" jobs): generated from `fromField` when empty and made unique
 * with -2, -3… instead of failing on the unique index.
 */
export const uniqueSlugField = (collection: string, fromField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Part of the page address. Leave empty to generate it.',
  },
  hooks: {
    beforeValidate: [
      async ({ value, data, originalDoc, req }) => {
        // A partial update that doesn't touch the slug keeps it.
        if (value == null && originalDoc?.slug && data?.slug === undefined) return originalDoc.slug
        const source = typeof value === 'string' && value.trim() ? value : (data?.[fromField] ?? originalDoc?.[fromField])
        if (typeof source !== 'string' || !source.trim()) return value
        if (value && slugify(value) === originalDoc?.slug) return originalDoc.slug
        return uniqueSlug(req, collection, source, originalDoc?.id)
      },
    ],
  },
})
