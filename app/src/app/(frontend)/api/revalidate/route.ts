import { revalidateTag } from 'next/cache'

// POST /api/revalidate — expires every cached query at once. The seed and
// purge-demo scripts run outside Next.js, so their changes can't trigger the
// usual on-save revalidation; they call this at the end instead. Guarded by
// PAYLOAD_SECRET in the `x-revalidate-secret` header.

const ALL_TAGS = [
  'news',
  'news-categories',
  'pages',
  'site-settings',
  'header',
  'footer',
  'businesses',
  'business-categories',
  'packages',
  'promotions',
  'products',
  'cars',
  'jobs',
  'events',
  'contests',
  'weather',
  'ad-slots',
  'banners',
]

export async function POST(req: Request) {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  for (const tag of ALL_TAGS) revalidateTag(tag, { expire: 0 })
  return Response.json({ ok: true, tags: ALL_TAGS.length })
}
