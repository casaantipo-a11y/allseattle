import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import { isBot } from '@/lib/banners'

// POST /api/views {kind: car | job, id} — one view of a car or job page (sent
// once per browser session by ViewBeacon). A direct atomic UPDATE: going through
// payload.update would run the collection hooks and revalidate the pages on
// every view. Only published listings count.

export async function POST(req: Request) {
  if (isBot(req.headers.get('user-agent'))) return new Response(null, { status: 204 })
  const body = (await req.json().catch(() => null)) as { kind?: unknown; id?: unknown } | null
  const id = Number(body?.id)
  if (!Number.isInteger(id) || id <= 0 || (body?.kind !== 'car' && body?.kind !== 'job')) {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
  const db = (await getPayload({ config })).db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
  try {
    await db.drizzle.execute(
      body.kind === 'car'
        ? sql`UPDATE "car_listings" SET "views_count" = COALESCE("views_count", 0) + 1 WHERE "id" = ${id} AND "status" = 'published'`
        : sql`UPDATE "jobs" SET "views_count" = COALESCE("views_count", 0) + 1 WHERE "id" = ${id} AND "status" = 'published'`,
    )
  } catch (e) {
    console.error('[views]', e)
    return Response.json({ error: 'Not saved' }, { status: 500 })
  }
  return new Response(null, { status: 204 })
}
