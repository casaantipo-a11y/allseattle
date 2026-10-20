import type { Field, GlobalConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateGlobal } from '../hooks/revalidate'

// The client's SEO texts (AllSeattle_SEO_Texts_English.txt): one per section, shown at the
// bottom of the section's first page, above the footer, in a quiet small type (client,
// 20.10.2026: "at the bottom, so the phone picture isn't broken"). The first sentence of the
// text is the section's Google description unless one is typed here.
export const SEO_SECTIONS = [
  { key: 'home', label: 'Home' },
  { key: 'news', label: 'News' },
  { key: 'directory', label: 'Business Directory' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'leisure', label: 'Leisure' },
  { key: 'events', label: 'Events' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'cars', label: 'Cars' },
  { key: 'carServices', label: 'Cars — Services' },
  { key: 'weather', label: 'Weather' },
  { key: 'map', label: 'City Map' },
] as const

export type SeoSection = (typeof SEO_SECTIONS)[number]['key']

const sectionFields = (): Field[] => [
  { name: 'heading', type: 'text', admin: { description: 'The text block’s heading, e.g. "Seattle local news on AllSeattle".' } },
  {
    name: 'body',
    type: 'textarea',
    admin: {
      rows: 12,
      description: 'Shown at the bottom of the section. An empty line starts a new paragraph. Leave empty to show nothing.',
    },
  },
  {
    name: 'metaDescription',
    type: 'textarea',
    maxLength: 300,
    admin: {
      rows: 3,
      description: 'Optional: the line Google shows under the link (about 150 characters). Empty — the first sentence of the text.',
    },
  },
]

export const SeoTexts: GlobalConfig = {
  slug: 'seo-texts',
  label: 'SEO texts',
  admin: { group: 'Settings' },
  access: { read: () => true, update: canWrite() },
  hooks: { afterChange: [revalidateGlobal(['seo-texts'])] },
  fields: [
    {
      type: 'tabs',
      tabs: SEO_SECTIONS.map((s) => ({ name: s.key, label: s.label, fields: sectionFields() })),
    },
  ],
}
