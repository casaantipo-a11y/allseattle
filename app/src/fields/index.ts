import type { Field, FieldHook, PayloadRequest } from 'payload'

export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim() !== '') return slugify(value)
    const source = data?.[fallbackField] ?? originalDoc?.[fallbackField]
    return typeof source === 'string' ? slugify(source) : value
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
  const base = slugify(source)
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
