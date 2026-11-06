/**
 * pnpm clean-invisible — removes the invisible characters that were pasted into news from an
 * AI chat (lib/invisible.ts): in the Source field they break the link. It looks first and
 * changes nothing; with CLEAN_INVISIBLE_YES=1 it saves the cleaned values (title, excerpt,
 * source and text of the articles that have any). Safe to run again. New articles don't need
 * it: the News collection cleans these fields on every save.
 *
 * Production: pnpm clean-invisible:prod (scripts/prod.mjs).
 */
import { getPayload } from 'payload'

import { stripInvisibleDeep } from '../lib/invisible'
import config from '../payload.config'
import { revalidateSite } from './revalidate-site'

const log = (m: string) => console.log(`[clean-invisible] ${m}`)
const FIELDS = ['title', 'excerpt', 'source', 'content'] as const
const show = (v: unknown) => JSON.stringify(v).replace(/[​⁠﻿￼]/g, (c) => `<U+${c.codePointAt(0)!.toString(16).toUpperCase()}>`)

async function run() {
  const apply = process.env.CLEAN_INVISIBLE_YES === '1'
  const payload = await getPayload({ config })
  const docs = (await payload.find({ collection: 'news', pagination: false, depth: 0, select: { title: true, excerpt: true, source: true, content: true } })).docs

  let found = 0
  let saved = 0
  for (const doc of docs) {
    const data: Record<string, unknown> = {}
    for (const f of FIELDS) {
      const before = doc[f]
      if (before == null) continue
      const after = stripInvisibleDeep(before)
      if (JSON.stringify(after) !== JSON.stringify(before)) data[f] = after
    }
    const changed = Object.keys(data)
    if (!changed.length) continue
    found++
    log(`#${doc.id} ${doc.title.slice(0, 50)} — ${changed.join(', ')}`)
    if (changed.includes('source')) log(`    source: ${show(doc.source)}`)
    if (!apply) continue
    try {
      await payload.update({ collection: 'news', id: doc.id, data, depth: 0, context: { disableRevalidate: true } })
      saved++
    } catch (e) {
      console.error(`[clean-invisible] #${doc.id} not saved:`, e instanceof Error ? e.message : e)
    }
  }

  log(`${docs.length} articles checked, ${found} with invisible characters`)
  if (!apply) {
    log(found ? 'Nothing changed. Run again with CLEAN_INVISIBLE_YES=1 to save the cleaned values.' : 'Nothing to do.')
    return
  }
  log(`${saved} saved${saved < found ? `, ${found - saved} failed` : ''}`)
  if (saved) await revalidateSite(log)
}

try {
  await run()
} catch (e) {
  console.error('[clean-invisible] failed:', e instanceof Error ? e.message : e)
  process.exit(1)
}
process.exit(0)
