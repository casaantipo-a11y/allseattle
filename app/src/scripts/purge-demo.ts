/**
 * pnpm purge-demo — deletes every document marked isDemo, after a
 * confirmation in the console (spec §10). Run it once before the real launch.
 *
 *   pnpm purge-demo                     asks "type DELETE to continue"
 *   PURGE_DEMO_YES=1 pnpm purge-demo    no question (for scripted use;
 *                                       `payload run` doesn't forward flags)
 *
 * Order matters: articles first, then what they point to (categories, media),
 * so nothing is deleted while still referenced.
 */
import readline from 'node:readline/promises'

import { getPayload, type CollectionSlug } from 'payload'

import config from '../payload.config'
import { revalidateSite } from './revalidate-site'

// Collections added in later phases join this list, content before its media.
const ORDER: CollectionSlug[] = [
  'products',
  'promotions',
  'car-listings',
  'jobs',
  'events',
  'contests',
  'news',
  'businesses',
  'news-categories',
  'business-categories',
  'job-categories',
  'event-categories',
  'pages',
  'documents',
  'media',
]

async function run() {
  const payload = await getPayload({ config })

  const counts: [CollectionSlug, number][] = []
  for (const slug of ORDER) {
    const { totalDocs } = await payload.count({ collection: slug, where: { isDemo: { equals: true } } })
    counts.push([slug, totalDocs])
  }
  const total = counts.reduce((n, [, c]) => n + c, 0)
  console.log('\nDemo documents to delete:')
  for (const [slug, c] of counts) console.log(`  ${slug.padEnd(18)} ${c}`)
  if (!total) {
    console.log('\nNothing to delete.')
    return
  }

  if (process.env.PURGE_DEMO_YES !== '1' && !process.argv.includes('--yes')) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`\nThis permanently deletes ${total} documents. Type DELETE to continue: `)
    rl.close()
    if (answer.trim() !== 'DELETE') {
      console.log('Cancelled, nothing deleted.')
      return
    }
  }

  for (const [slug, c] of counts) {
    if (!c) continue
    const res = await payload.delete({
      collection: slug,
      where: { isDemo: { equals: true } },
      context: { disableRevalidate: true },
    })
    console.log(`  deleted ${res.docs.length} from ${slug}${res.errors.length ? `, ${res.errors.length} failed` : ''}`)
  }
  await revalidateSite((m) => console.log(`  ${m}`))
  console.log('\nDone.')
}

await run()
process.exit(0)
