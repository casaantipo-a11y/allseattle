import type { SeoSection } from '@/globals/SeoTexts'

import { getSeoTexts } from './queries'

// The client's section texts (Settings → SEO texts in the admin): the block at the bottom of
// a section and its Google description.

export type SeoBlock = { heading: string; paragraphs: string[] }

/** The section's text block, or null while its text is empty. */
export async function seoBlock(section: SeoSection): Promise<SeoBlock | null> {
  const t = (await getSeoTexts())[section]
  const paragraphs = (t?.body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
  return paragraphs.length ? { heading: t?.heading?.trim() ?? '', paragraphs } : null
}

/** Google's description for the section: the one typed in the admin, else the text's first
 *  sentence, else `fallback` (the description the page had before). */
export async function seoDescription(section: SeoSection, fallback: string): Promise<string> {
  const t = (await getSeoTexts())[section]
  const typed = t?.metaDescription?.trim()
  if (typed) return typed
  const first = (t?.body ?? '').trim().split(/(?<=[.!?])\s+/)[0]?.replace(/\s+/g, ' ').trim()
  return first || fallback
}
