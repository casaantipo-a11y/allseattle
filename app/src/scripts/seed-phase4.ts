import type { Payload } from 'payload'
import sharp from 'sharp'

import type { AdSlot } from '../payload-types'

// Phase 4 of the seed (spec §7, §10): the ad slots — every <AdSlot code> the
// pages render, with placeholder weekly prices — and two demo banners, so the
// "Booked" state and the report can be shown before real advertisers exist.
// The demo creatives are drawn here at the exact slot sizes and link to the
// demo businesses' own pages. Slots are structure (kept by purge-demo); the
// banners are isDemo.

const ctx = () => ({ disableRevalidate: true })

type Slot = Pick<AdSlot, 'code' | 'name' | 'page' | 'position' | 'desktopSize' | 'mobileSize' | 'weeklyPrice'>

const top = (code: string, page: AdSlot['page'], label: string, price: number): Slot => ({
  code,
  name: `${label} — top banner`,
  page,
  position: 'leaderboard',
  desktopSize: '728x90',
  mobileSize: '320x100',
  weeklyPrice: price,
})
const side = (code: string, page: AdSlot['page'], label: string, n: number, size: '300x250' | '300x600', price: number, mobile = true): Slot => ({
  code,
  name: `${label} — sidebar ${n} (${size})`,
  page,
  position: 'sidebar',
  desktopSize: size,
  mobileSize: mobile ? '320x100' : null,
  weeklyPrice: price,
})
const feed = (code: string, page: AdSlot['page'], label: string, n: number, price: number): Slot => ({
  code,
  name: `${label} — in the feed ${n}`,
  page,
  position: 'in-feed',
  desktopSize: '728x90',
  mobileSize: '320x100',
  weeklyPrice: price,
})

export const SLOTS: Slot[] = [
  top('HOME_TOP', 'home', 'Home', 250),
  side('HOME_SIDEBAR_1', 'home', 'Home', 1, '300x250', 150, false),
  side('HOME_SIDEBAR_2', 'home', 'Home', 2, '300x250', 120, false),
  side('HOME_SIDEBAR_3', 'home', 'Home', 3, '300x600', 180, false),
  feed('HOME_INFEED_1', 'home', 'Home', 1, 150),
  feed('HOME_INFEED_2', 'home', 'Home', 2, 120),
  top('NEWS_TOP', 'news', 'News', 180),
  side('NEWS_SIDEBAR_1', 'news', 'News', 1, '300x250', 110),
  side('NEWS_SIDEBAR_2', 'news', 'News', 2, '300x600', 140),
  ...(['DIRECTORY', 'SHOPPING', 'LEISURE'] as const).flatMap((p) => {
    const page = p.toLowerCase() as AdSlot['page']
    const label = { DIRECTORY: 'Business directory', SHOPPING: 'Shopping', LEISURE: 'Leisure' }[p]
    return [
      side(`${p}_SIDEBAR_1`, page, label, 1, '300x250', 100),
      side(`${p}_SIDEBAR_2`, page, label, 2, '300x600', 130),
      { ...feed(`${p}_INFEED_1`, page, label, 1, 120), name: `${label} — bottom banner` },
    ]
  }),
  top('BUSINESS_TOP', 'business', 'Business pages', 120),
  side('BUSINESS_SIDEBAR_1', 'business', 'Business pages', 1, '300x250', 90),
  top('CARS_TOP', 'cars', 'Cars', 150),
  feed('CARS_INFEED_1', 'cars', 'Cars', 1, 110),
  side('CARS_SIDEBAR_1', 'cars', 'Cars', 1, '300x250', 90),
  side('CARS_SIDEBAR_2', 'cars', 'Cars', 2, '300x600', 120),
  side('CARS_SIDEBAR_3', 'cars', 'Cars', 3, '300x250', 90),
  side('CARS_SIDEBAR_4', 'cars', 'Cars', 4, '300x600', 120),
  top('JOBS_TOP', 'jobs', 'Jobs', 120),
  side('JOBS_SIDEBAR_1', 'jobs', 'Jobs', 1, '300x250', 90),
  top('EVENTS_TOP', 'events', 'Events', 130),
  side('EVENTS_SIDEBAR_1', 'events', 'Events', 1, '300x250', 90),
  feed('EVENTS_INFEED_1', 'events', 'Events', 1, 100),
  top('WEATHER_TOP', 'weather', 'Weather', 100),
]

// A simple branded creative: navy panel, the advertiser, an offer and a red
// call-to-action pill, laid out for wide or boxy formats.
export function creative(w: number, h: number, name: string, offer: string, cta: string) {
  const wide = w / h > 2.5
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  // Wide formats: text left, button right. Font sizes follow the height but
  // are capped by the width, so the 320x100 phone format doesn't overflow.
  const t = Math.min(h * 0.24, w * 0.048)
  const pillW = Math.min(h * 1.9, w * 0.3)
  const pillH = Math.min(h * 0.44, t * 2)
  const body = wide
    ? `<text x="${w * 0.04}" y="${h * 0.45}" font-size="${t}" font-weight="800" fill="#fff">${esc(name)}</text>
       <text x="${w * 0.04}" y="${h * 0.45 + t * 1.25}" font-size="${t * 0.72}" fill="#c9d4e0">${esc(offer)}</text>
       <rect x="${w * 0.96 - pillW}" y="${(h - pillH) / 2}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#e53935"/>
       <text x="${w * 0.96 - pillW / 2}" y="${h / 2 + t * 0.28}" font-size="${t * 0.78}" font-weight="700" fill="#fff" text-anchor="middle">${esc(cta)}</text>`
    : `<text x="${w / 2}" y="${h * 0.36}" font-size="${w * 0.085}" font-weight="800" fill="#fff" text-anchor="middle">${esc(name)}</text>
       <text x="${w / 2}" y="${h * 0.52}" font-size="${w * 0.058}" fill="#c9d4e0" text-anchor="middle">${esc(offer)}</text>
       <rect x="${w * 0.2}" y="${h * 0.66}" width="${w * 0.6}" height="${Math.min(h * 0.16, 44)}" rx="${Math.min(h * 0.08, 22)}" fill="#e53935"/>
       <text x="${w / 2}" y="${h * 0.66 + Math.min(h * 0.16, 44) * 0.66}" font-size="${w * 0.055}" font-weight="700" fill="#fff" text-anchor="middle">${esc(cta)}</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" font-family="Arial, Helvetica, sans-serif">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1b2a"/><stop offset="1" stop-color="#1b3a57"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>${body}</svg>`
  return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer()
}

const DEMO_BANNERS = [
  {
    advertiser: 'Emerald Shine Car Wash',
    business: 'emerald-shine-car-wash',
    offer: 'First wash 20% off this month',
    cta: 'Book now',
    slots: ['HOME_TOP', 'CARS_TOP'],
    desktop: '728x90',
    mobile: '320x100',
  },
  {
    advertiser: 'Cascade Fitness Studio',
    business: 'cascade-fitness-studio',
    offer: 'Your first class is free',
    cta: 'Try it',
    slots: ['HOME_SIDEBAR_1'],
    desktop: '300x250',
    mobile: null,
  },
] as const

export async function seedPhase4(payload: Payload, log: (m: string) => void) {
  const slotIds = new Map<string, number>()
  let created = 0
  for (const [i, s] of SLOTS.entries()) {
    const found = (await payload.find({ collection: 'ad-slots', where: { code: { equals: s.code } }, limit: 1, depth: 0 })).docs[0]
    if (found) {
      slotIds.set(s.code, found.id)
      continue
    }
    const doc = await payload.create({ collection: 'ad-slots', data: { ...s, sortOrder: i, isActive: true }, context: ctx() })
    slotIds.set(s.code, doc.id)
    created++
  }
  log(`${SLOTS.length} ad slots (${created} new)`)

  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  let banners = 0
  for (const b of DEMO_BANNERS) {
    const exists = await payload.find({ collection: 'banners', where: { advertiser: { equals: b.advertiser } }, limit: 1, depth: 0 })
    if (exists.totalDocs) continue
    const upload = async (size: string) => {
      const [w, h] = size.split('x').map(Number)
      const data = await creative(w, h, b.advertiser, b.offer, b.cta)
      const name = `banner-${b.business}-${size}.webp`
      return (
        await payload.create({
          collection: 'media',
          data: { alt: `${b.advertiser} — ${b.offer}`, isDemo: true },
          file: { data, mimetype: 'image/webp', name, size: data.length },
          context: ctx(),
        })
      ).id
    }
    const now = Date.now()
    await payload.create({
      collection: 'banners',
      data: {
        advertiser: b.advertiser,
        linkUrl: `${site}/biz/${b.business}`,
        slots: b.slots.map((c) => slotIds.get(c)!).filter(Boolean),
        imageDesktop: await upload(b.desktop),
        imageMobile: b.mobile ? await upload(b.mobile) : undefined,
        startAt: new Date(now - 86_400_000).toISOString(),
        endAt: new Date(now + 60 * 86_400_000).toISOString(),
        status: 'published',
        isDemo: true,
      },
      context: ctx(),
    })
    banners++
  }
  log(`${banners} demo banners`)
}
