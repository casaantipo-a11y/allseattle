'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import type { ActiveBanner, BannerImage } from '@/lib/banners'

import { trackImpressions } from './bannerTracker'

// One ad placement in the browser (spec §7): the running banner for the slot,
// or the "Your ad here — Place an ad" placeholder that sells the spot. The
// server renders the first banner that is running; after hydration the slot
// re-checks the clock (the page may be an hour-old ISR copy, and a banner
// stops at its endAt) and picks one of the running banners at random.
// Same classes as the prototype's banner-ads.js, so the desktop/mobile swap
// in components.css applies unchanged.

export type Size = '970x250' | '728x90' | '300x250' | '300x600' | '320x100'
type Variant = 'desktop' | 'mobile-only' | 'standalone'

const running = (b: ActiveBanner, now: number) =>
  new Date(b.startAt).getTime() <= now && now < new Date(b.endAt).getTime()

const boxStyle = (size: Size) => {
  const [w, h] = size.split('x').map(Number)
  return { '--ad-max-w': `${w}px`, '--ad-w': w, '--ad-h': h } as CSSProperties
}
const variantClass = (v: Variant) =>
  v === 'desktop' ? 'ad-slot--desktop' : v === 'mobile-only' ? 'ad-slot--mobile-only' : ''

/** The client's position and monthly price for a slot (lib/ad-placements.ts). */
export type SlotOffer = { position: string; price: number }

// The "for sale" box an empty slot shows (client, 07.10.2026: the old dashed box with
// three tiny lines looked unfinished). A small tag, a heading, a line of copy and a
// "Place an ad" button, laid out by the slot's shape: a row for wide slots (728x90,
// 320x100), a centred stack with the site's tinted icon circle for boxes and towers
// (300x250, 300x600). Styles: .ad-slot--house in components.css.
// For a position on the client's price sheets the text is the prototype's (client,
// 12.10.2026): "Your Ad Here", "Block B1 · 728×90" and "Available · $149/month".
function Placeholder({ size, variant, offer }: { size: Size; variant: Variant; offer?: SlotOffer }) {
  const [w, h] = size.split('x').map(Number)
  const shape = w / h >= 2.5 ? 'wide' : h > w * 1.5 ? 'tall' : 'box'
  const compact = shape === 'wide' && w <= 320
  return (
    <Link
      href="/advertise"
      className={`ad-slot ad-slot--house ad-slot--${shape}${compact ? ' ad-slot--compact' : ''} ${variantClass(variant)}`}
      style={boxStyle(size)}
      rel="nofollow"
      aria-label={`Advertise here: ${size} placement${offer ? `, $${offer.price} a month` : ''} — place an ad`}
    >
      <span className="ad-house-tag">
        {offer ? `Block ${offer.position}` : 'Advertisement'} · {size.replace('x', '×')}
      </span>
      <span className="ad-house">
        {shape !== 'wide' ? (
          <span className="ad-house-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
              <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
            </svg>
          </span>
        ) : null}
        <span className="ad-house-text">
          <span className="ad-house-title">{offer ? 'Your Ad Here' : 'Your business here'}</span>
          {offer ? (
            <span className="ad-house-sub">
              <span className="ad-slot-status is-available">Available</span> · ${offer.price}/month
            </span>
          ) : compact ? null : (
            <span className="ad-house-sub">
              {shape === 'tall' ? 'Reach Seattle readers on this page every day' : 'Reach Seattle locals on this page'}
            </span>
          )}
        </span>
        <span className="ad-house-cta">Place an ad &rarr;</span>
      </span>
    </Link>
  )
}

function Creative({
  banner,
  image,
  size,
  variant,
  eager,
}: {
  banner: ActiveBanner
  image: BannerImage
  size: Size
  variant: Variant
  eager: boolean
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  useEffect(() => (ref.current ? trackImpressions(ref.current) : undefined), [banner.id])
  return (
    <a
      ref={ref}
      href={`/api/banners/click/${banner.id}`}
      className={`ad-slot ad-slot--banner ${variantClass(variant)}`}
      style={boxStyle(size)}
      data-banner-id={banner.id}
      target="_blank"
      rel="sponsored noopener"
      aria-label={`Advertisement: ${banner.advertiser}`}
    >
      {/* Lazy even for the *_TOP slots: a slot renders a desktop and a phone creative
          and CSS hides one of them. An eager image loads even when hidden, so every
          phone downloaded the desktop banner too; a lazy one is skipped while hidden,
          and the visible one, being on screen, still starts right away. Below the
          top slot creatives fetch at low priority, so they never compete with the
          header photo (the page's largest paint). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- the advertiser's exact-size creative */}
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt={banner.advertiser}
        loading="lazy"
        fetchPriority={eager ? 'auto' : 'low'}
      />
    </a>
  )
}

export function BannerSlot({
  code,
  size,
  mobileSize,
  className,
  banners,
  initial,
  echo = false,
  offer,
}: {
  code: string
  size: Size
  mobileSize?: Size
  className?: string
  banners: ActiveBanner[]
  /** Index of the banner the server rendered, -1 for the placeholder. */
  initial: number
  /** Mobile echo of a sidebar slot inside a feed: one box, phone only. */
  echo?: boolean
  /** Position and price, when the slot is on the client's price sheets. */
  offer?: SlotOffer
}) {
  const [index, setIndex] = useState(initial)
  useEffect(() => {
    // Paid banners first: a demo filler only shows while no paid banner runs here.
    const now = Date.now()
    const runningNow = banners.map((b, i) => (running(b, now) ? i : -1)).filter((i) => i >= 0)
    const paid = runningNow.filter((i) => !banners[i].demo)
    const live = paid.length ? paid : runningNow
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the pick depends on the visitor's clock, unknown during SSR
    setIndex(live.length ? live[Math.floor(Math.random() * live.length)] : -1)
  }, [banners])
  const banner = index >= 0 ? banners[index] : null
  const eager = code.endsWith('_TOP')

  if (echo) {
    // A sidebar slot has no phone size of its own; on phones it sits in the
    // feed — the 300x250 creative itself, or the small placeholder.
    return (
      <div className="ad-mobile-inline-slot" data-ad-code={code}>
        <div className="ad-slot-wrap">
          {banner ? (
            <Creative
              banner={banner}
              image={banner.desktop}
              size={size}
              variant="standalone"
              eager={false}
            />
          ) : (
            <Placeholder offer={offer} size="320x100" variant="standalone" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className} data-ad-code={code}>
      <div className="ad-slot-wrap">
        {banner ? (
          <>
            <Creative
              banner={banner}
              image={banner.desktop}
              size={size}
              variant={mobileSize ? 'desktop' : 'standalone'}
              eager={eager}
            />
            {mobileSize ? (
              banner.mobile ? (
                <Creative
                  banner={banner}
                  image={banner.mobile}
                  size={mobileSize}
                  variant="mobile-only"
                  eager={eager}
                />
              ) : (
                <Placeholder offer={offer} size={mobileSize} variant="mobile-only" />
              )
            ) : null}
          </>
        ) : (
          <>
            <Placeholder offer={offer} size={size} variant={mobileSize ? 'desktop' : 'standalone'} />
            {mobileSize ? <Placeholder offer={offer} size={mobileSize} variant="mobile-only" /> : null}
          </>
        )}
      </div>
    </div>
  )
}
