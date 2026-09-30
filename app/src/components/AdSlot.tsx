import Link from 'next/link'
import type { CSSProperties } from 'react'

// A static ad placement for phase 1: the "Your ad here — Place an ad"
// placeholder from spec §7, which itself sells the spot. Phase 4 replaces the
// body with the active banner for `code` (the AdSlots collection) and keeps
// this as the fallback. Same classes as the prototype's banner-ads.js, so the
// responsive desktop/mobile swap in components.css applies unchanged.

type Size = '970x250' | '728x90' | '300x250' | '300x600' | '320x100'

const dims = (size: Size) => {
  const [w, h] = size.split('x').map(Number)
  return { w, h }
}

function Box({ size, variant }: { size: Size; variant: 'desktop' | 'mobile-only' | 'standalone' }) {
  const { w, h } = dims(size)
  const style = { '--ad-max-w': `${w}px`, '--ad-w': w, '--ad-h': h } as CSSProperties
  const cls = variant === 'desktop' ? 'ad-slot--desktop' : variant === 'mobile-only' ? 'ad-slot--mobile-only' : ''
  return (
    <Link href="/advertise" className={`ad-slot ${cls}`} style={style} rel="nofollow">
      <span className="ad-slot-inner">
        <span className="ad-slot-label">Your ad here</span>
        <span className="ad-slot-tier">{size}</span>
        <span className="ad-slot-status is-available">Place an ad &rarr;</span>
      </span>
    </Link>
  )
}

export function AdSlot({
  code,
  size,
  mobileSize,
  className,
}: {
  code: string
  size: Size
  mobileSize?: Size
  className?: string
}) {
  return (
    <div className={className} data-ad-code={code}>
      <div className="ad-slot-wrap">
        <Box size={size} variant={mobileSize ? 'desktop' : 'standalone'} />
        {mobileSize ? <Box size={mobileSize} variant="mobile-only" /> : null}
      </div>
    </div>
  )
}

/** Mobile-only 320x100 echo of a sidebar slot, placed inside a feed. */
export function InlineMobileAd({ code }: { code: string }) {
  return (
    <div className="ad-mobile-inline-slot" data-ad-code={code}>
      <div className="ad-slot-wrap">
        <Box size="320x100" variant="standalone" />
      </div>
    </div>
  )
}
