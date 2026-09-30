import type { Field, FieldHook } from 'payload'

export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
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
