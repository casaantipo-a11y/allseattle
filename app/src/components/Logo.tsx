import Link from 'next/link'

// The client's own logo artwork (public/brand/logo.png, and a copy with white
// lettering for the navy footer). Same sizing rules as the prototype:
// css/header.css `.site-logo-img`.
// The page uses the 372x120 WebP copies (logo-372.webp, logo-dark-372.webp,
// made from the PNGs at q 0.86): the logo is drawn at most 186x60, so that is
// 2x for sharp screens at under half the bytes of the 560px file, which was
// competing with the header photo for the first second of a phone's bandwidth
// (Lighthouse, 06.10.2026). The footer copy loads lazily — it is far below the fold.
// The 560px originals stay for the JSON-LD / OG uses.
export function Logo({ href = '/', variant = 'light' }: { href?: string; variant?: 'light' | 'dark' }) {
  const dark = variant === 'dark'
  return (
    <Link href={href} className={`site-logo${dark ? ' site-logo--dark' : ''}`} aria-label="AllSeattle — Seattle City Website">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size brand asset, sized by CSS */}
      <img
        src={dark ? '/brand/logo-dark-372.webp' : '/brand/logo-372.webp'}
        alt=""
        width={372}
        height={120}
        loading={dark ? 'lazy' : undefined}
        decoding="async"
        className="site-logo-img"
      />
    </Link>
  )
}
