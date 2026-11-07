import { createHash } from 'node:crypto'

import type { CollectionAfterDeleteHook, Payload } from 'payload'
import sharp from 'sharp'

import { errorMessage } from './types'
import { fetchImage } from './http'

// A news story's picture, taken from the feed (rss.ts `imagesOf`) for a source with
// "Import pictures" on. Only fetchImage reaches the network: https, public hosts, every
// redirect checked, 4 MB, JPEG / PNG / WebP by type and by the file's own bytes.
// The picture is then decoded (a file that is not one fails here), refused when it is too
// small to be a cover, scaled to at most 1600 px wide and stored in Media as a WebP — the
// same collection every editor upload goes to (Payload makes the card and thumb sizes).
// Nothing here points at the source's own server: the copy is ours, with the source named
// as the credit. A picture that fails is skipped; the draft is made without a cover.

/** Under the width of the site's card (640 px) a picture is soft; a 150 px WordPress cut never passes. */
const MIN_WIDTH = 640
const MIN_HEIGHT = 300
/** A decompression bomb is a small file with a huge pixel count. */
const MAX_PIXELS = 50_000_000
/** Candidates tried per story: the original and the cut a WordPress feed carries, and a couple more. */
const MAX_TRIES = 4

type Options = {
  /** Addresses from the feed, best first. */
  candidates: string[]
  alt: string
  /** Shown under the cover on the article page. */
  credit: string
  /** Epoch ms: no new request is started with less than 2 s left. */
  until: number
  /** Addresses that already failed in this run; a feed that repeats a dead one is not asked again. Filled in here. */
  failed: Set<string>
}

/** The id of the Media item made from the first candidate that works, else null. */
export async function storePicture(payload: Payload, { candidates, alt, credit, until, failed }: Options): Promise<number | null> {
  for (const url of candidates.slice(0, MAX_TRIES)) {
    if (failed.has(url)) continue
    const left = until - Date.now()
    if (left < 2000) return null
    let host = '?'
    try {
      host = new URL(url).hostname
    } catch {}
    try {
      const { data } = await fetchImage(url, { timeoutMs: Math.min(8000, left) })
      const meta = await sharp(data, { limitInputPixels: MAX_PIXELS }).metadata()
      if (!meta.width || !meta.height || meta.width < MIN_WIDTH || meta.height < MIN_HEIGHT) {
        failed.add(url)
        continue
      }
      const webp = await sharp(data, { limitInputPixels: MAX_PIXELS }).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
      const media = await payload.create({
        collection: 'media',
        depth: 0,
        overrideAccess: true,
        data: { alt: alt.slice(0, 200), credit },
        file: { data: webp, mimetype: 'image/webp', name: `import-${createHash('sha1').update(url).digest('hex').slice(0, 10)}.webp`, size: webp.length },
      })
      return media.id
    } catch (e) {
      failed.add(url)
      // The host and the reason only; the address of a picture is not worth a log line.
      console.warn(`[import] picture skipped (${host}): ${errorMessage(e)}`)
    }
  }
  return null
}

/**
 * afterDelete of News: the picture the importer stored for a story goes with it. Without
 * this a photo nobody wanted (or may not use) would stay in Media — public, and listed in the
 * API. Only the importer's own copies qualify (file `import-…`, credit "Photo: …"), and not
 * one another story still uses. Never blocks the deletion.
 */
export const dropImportedCover: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (doc?.origin !== 'import' || !doc.cover) return doc
  const id = typeof doc.cover === 'object' ? doc.cover.id : doc.cover
  try {
    // `req` carries the delete's own transaction, where the story being deleted is already gone;
    // the `id` filter also keeps it out of the count if it is not.
    const media = await req.payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true, disableErrors: true, req })
    if (!media || !media.filename?.startsWith('import-') || !media.credit?.startsWith('Photo: ')) return doc
    const others = await req.payload.count({ collection: 'news', where: { and: [{ cover: { equals: id } }, { id: { not_equals: doc.id } }] }, overrideAccess: true, req })
    if (others.totalDocs > 0) return doc
    await req.payload.delete({ collection: 'media', id, overrideAccess: true, req })
  } catch (e) {
    console.error('[import] could not delete the picture of a deleted draft', e)
  }
  return doc
}
