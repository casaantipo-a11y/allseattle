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

function Placeholder({ size, variant }: { size: Size; variant: Variant }) {
  return (
    <Link
      href="/advertise"
      className={`ad-slot ${variantClass(variant)}`}
      style={boxStyle(size)}
      rel="nofollow"
    >
      <span className="ad-slot-inner">
        <span className="ad-slot-label">Your ad here</span>
        <span className="ad-slot-tier">{size}</span>
        <span className="ad-slot-status is-available">Place an ad &rarr;</span>
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
      {/* eslint-disable-next-line @next/next/no-img-element -- the advertiser's exact-size creative */}
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt={banner.advertiser}
        loading={eager ? 'eager' : 'lazy'}
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
}) {
  const [index, setIndex] = useState(initial)
  useEffect(() => {
    const now = Date.now()
    const live = banners.map((b, i) => (running(b, now) ? i : -1)).filter((i) => i >= 0)
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
            <Placeholder size="320x100" variant="standalone" />
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
                <Placeholder size={mobileSize} variant="mobile-only" />
              )
            ) : null}
          </>
        ) : (
          <>
            <Placeholder size={size} variant={mobileSize ? 'desktop' : 'standalone'} />
            {mobileSize ? <Placeholder size={mobileSize} variant="mobile-only" /> : null}
          </>
        )}
      </div>
    </div>
  )
}
