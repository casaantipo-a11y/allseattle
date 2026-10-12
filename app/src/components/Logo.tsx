import Link from 'next/link'

// The client's own logo artwork (public/brand/logo.png, and a copy with white
// lettering for the navy footer). Same sizing rules as the prototype:
// css/header.css `.site-logo-img`.
// The 560x180 WebP — the same file the prototype shows. From 06.10.2026 the page
// used 372x120 copies re-encoded at q 0.86 to save bytes; on the client's screen
// that blurred the small "Seattle City Website" line (12.10.2026: "the logo is
// blurry"), so the full-size file is back. Drawn at most 186x60, so 3x for sharp
// screens. The footer copy loads lazily — it is far below the fold.
export function Logo({ href = '/', variant = 'light' }: { href?: string; variant?: 'light' | 'dark' }) {
  const dark = variant === 'dark'
  return (
    <Link href={href} className={`site-logo${dark ? ' site-logo--dark' : ''}`} aria-label="AllSeattle — Seattle City Website">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size brand asset, sized by CSS */}
      <img
        src={dark ? '/brand/logo-dark.webp' : '/brand/logo.webp'}
        alt=""
        width={560}
        height={180}
        loading={dark ? 'lazy' : undefined}
        decoding="async"
        className="site-logo-img"
      />
    </Link>
  )
}
