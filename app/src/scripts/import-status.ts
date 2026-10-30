/**
 * pnpm import-status — read-only look at the automatic import: every source with its last
 * run, and how many imported drafts wait in News and Events. Changes nothing.
 *
 * Production: pnpm import-status:prod (scripts/prod.mjs).
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const payload = await getPayload({ config })

const sources = (await payload.find({ collection: 'import-sources', pagination: false, depth: 0, sort: 'id' })).docs
for (const s of sources) {
  console.log(`[import-status] #${s.id} ${s.name} | ${s.type} → ${s.target} | ${s.enabled ? 'enabled' : 'DISABLED'} | last run: ${s.lastRunAt ?? 'never'} | ${s.lastResult ?? '-'} | error: ${s.lastError || 'none'}`)
}

const draftsOf = async (collection: 'news' | 'events') =>
  (await payload.count({ collection, where: { and: [{ origin: { equals: 'import' } }, { status: { equals: 'draft' } }] } })).totalDocs
console.log(`[import-status] imported drafts waiting: news ${await draftsOf('news')}, events ${await draftsOf('events')}`)
for (const collection of ['news', 'events'] as const) {
  const published = (await payload.count({ collection, where: { and: [{ origin: { equals: 'import' } }, { status: { equals: 'published' } }] } })).totalDocs
  console.log(`[import-status] imported and published (${collection}): ${published}`)
}
process.exit(0)
