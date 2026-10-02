import path from 'node:path'

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

type Slot = Pick<
  AdSlot,
  'code' | 'name' | 'page' | 'position' | 'desktopSize' | 'mobileSize' | 'weeklyPrice'
>

const top = (code: string, page: AdSlot['page'], label: string, price: number): Slot => ({
  code,
  name: `${label} — top banner`,
  page,
  position: 'leaderboard',
  desktopSize: '728x90',
  mobileSize: '320x100',
  weeklyPrice: price,
})
const side = (
  code: string,
  page: AdSlot['page'],
  label: string,
  n: number,
  size: '300x250' | '300x600',
  price: number,
  mobile = true,
): Slot => ({
  code,
  name: `${label} — sidebar ${n} (${size})`,
  page,
  position: 'sidebar',
  desktopSize: size,
  mobileSize: mobile ? '320x100' : null,
  weeklyPrice: price,
})
const feed = (
  code: string,
  page: AdSlot['page'],
  label: string,
  n: number,
  price: number,
): Slot => ({
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
      top(`${p}_TOP`, page, label, 120),
      side(`${p}_SIDEBAR_1`, page, label, 1, '300x250', 100),
      side(`${p}_SIDEBAR_2`, page, label, 2, '300x600', 130),
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

// A demo creative: the business's photo with the advertiser, an offer and a
// call to action on a navy panel. Drawn at SCALE x the slot size (sharp on
// 2–3x screens; the admin accepts 2x images) — the SVG keeps slot-size
// coordinates and a viewBox, so text is rasterised at full resolution.
// Three layouts: wide leaderboard (photo | text | button), compact phone strip
// (photo | text with the call to action as a red line) and box (photo on top).
const SCALE = 2

export async function creative(
  w: number,
  h: number,
  photo: string,
  name: string,
  offer: string,
  cta: string,
) {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const W = w * SCALE
  const H = h * SCALE
  const wide = w / h > 2.5
  const compact = wide && w < 500
  // Photo area in slot pixels, and the strip where it fades into the panel.
  const ph = wide
    ? { x: 0, y: 0, w: compact ? 100 : 170, h }
    : { x: 0, y: 0, w, h: Math.round(h * 0.56) }
  // The photo's inner edge fades to transparent (an alpha mask), so it melts
  // into the panel's gradient wherever that edge falls — no seam.
  const fadeMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ph.w * SCALE}" height="${ph.h * SCALE}" viewBox="0 0 ${ph.w} ${ph.h}">
      <defs><linearGradient id="m" x1="0" y1="0" x2="${wide ? 1 : 0}" y2="${wide ? 0 : 1}">
        <stop offset="${wide ? 1 - 50 / ph.w : 1 - 40 / ph.h}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient></defs><rect width="${ph.w}" height="${ph.h}" fill="url(#m)"/></svg>`,
  )
  let text: string
  if (compact) {
    const x = ph.w + 10
    text = `<text x="${x}" y="${h * 0.36}" font-size="15" font-weight="800" fill="#fff">${esc(name)}</text>
      <text x="${x}" y="${h * 0.56}" font-size="11.5" fill="#c9d4e0">${esc(offer)}</text>
      <text x="${x}" y="${h * 0.8}" font-size="12.5" font-weight="700" fill="#ff6b66">${esc(cta)} &#8594;</text>`
  } else if (wide) {
    const x = ph.w + 20
    const pillW = 140
    const pillH = 40
    text = `<text x="${x}" y="${h * 0.46}" font-size="22" font-weight="800" fill="#fff">${esc(name)}</text>
      <text x="${x}" y="${h * 0.73}" font-size="15" fill="#c9d4e0">${esc(offer)}</text>
      <rect x="${w - 20 - pillW}" y="${(h - pillH) / 2}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#e53935"/>
      <text x="${w - 20 - pillW / 2}" y="${h / 2 + 5.5}" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${esc(cta)}</text>`
  } else {
    const top = ph.h
    const pillW = w * 0.5
    const pillH = 34
    text = `<text x="${w / 2}" y="${top + 30}" font-size="20" font-weight="800" fill="#fff" text-anchor="middle">${esc(name)}</text>
      <text x="${w / 2}" y="${top + 52}" font-size="13" fill="#c9d4e0" text-anchor="middle">${esc(offer)}</text>
      <rect x="${(w - pillW) / 2}" y="${h - pillH - 10}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#e53935"/>
      <text x="${w / 2}" y="${h - 10 - pillH / 2 + 5}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${esc(cta)}</text>`
  }
  const svg = (inner: string, bg: boolean) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${w} ${h}" font-family="Arial, Helvetica, sans-serif">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1b2a"/><stop offset="1" stop-color="#1b3a57"/></linearGradient></defs>
      ${bg ? `<rect width="${w}" height="${h}" fill="url(#g)"/>` : ''}${inner}</svg>`)
  const picture = await sharp(photo)
    .resize(ph.w * SCALE, ph.h * SCALE, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .composite([{ input: fadeMask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(svg('', true))
    .composite([
      { input: picture, left: ph.x * SCALE, top: ph.y * SCALE },
      { input: svg(text, false), left: 0, top: 0 },
    ])
    .webp({ quality: 90 })
    .toBuffer()
}

const DEMO_BANNERS = [
  {
    advertiser: 'Emerald Shine Car Wash',
    business: 'emerald-shine-car-wash',
    offer: 'First wash 20% off this month',
    cta: 'Book now',
    photo: 'img/cars/c1-2.webp',
    slots: ['HOME_TOP', 'CARS_TOP'],
    desktop: '728x90',
    mobile: '320x100',
  },
  {
    advertiser: 'Cascade Fitness Studio',
    business: 'cascade-fitness-studio',
    offer: 'Your first class is free',
    cta: 'Try it',
    photo: 'img/business/biz-6.webp',
    slots: ['HOME_SIDEBAR_1'],
    desktop: '300x250',
    mobile: null,
  },
] as const

export async function seedPhase4(payload: Payload, prototypeDir: string, log: (m: string) => void) {
  const slotIds = new Map<string, number>()
  let created = 0
  for (const [i, s] of SLOTS.entries()) {
    const found = (
      await payload.find({
        collection: 'ad-slots',
        where: { code: { equals: s.code } },
        limit: 1,
        depth: 0,
      })
    ).docs[0]
    if (found) {
      slotIds.set(s.code, found.id)
      continue
    }
    const doc = await payload.create({
      collection: 'ad-slots',
      data: { ...s, sortOrder: i, isActive: true },
      context: ctx(),
    })
    slotIds.set(s.code, doc.id)
    created++
  }
  log(`${SLOTS.length} ad slots (${created} new)`)

  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  let banners = 0
  for (const b of DEMO_BANNERS) {
    const exists = await payload.find({
      collection: 'banners',
      where: { advertiser: { equals: b.advertiser } },
      limit: 1,
      depth: 0,
    })
    if (exists.totalDocs) continue
    const upload = async (size: string) => {
      const [w, h] = size.split('x').map(Number)
      const data = await creative(
        w,
        h,
        path.join(prototypeDir, b.photo),
        b.advertiser,
        b.offer,
        b.cta,
      )
      const name = `banner-${b.business}-${w * SCALE}x${h * SCALE}.webp`
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
