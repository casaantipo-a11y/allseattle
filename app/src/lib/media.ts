import type { Media } from '@/payload-types'

type Size = 'thumb' | 'card' | 'hero'

/** URL of a rendition, falling back to the original when the size wasn't generated. */
export function mediaUrl(media: Media | number | null | undefined, size?: Size): string | null {
  if (!media || typeof media === 'number') return null
  const sized = size ? media.sizes?.[size]?.url : null
  return sized || media.url || null
}

export function mediaAlt(media: Media | number | null | undefined, fallback = ''): string {
  if (!media || typeof media === 'number') return fallback
  return media.alt || fallback
}
