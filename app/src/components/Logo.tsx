import Link from 'next/link'

// The client's own logo artwork (public/brand/logo.webp, and a copy with white
// lettering for the navy footer). Same sizing rules as the prototype:
// css/header.css `.site-logo-img`.
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
        className="site-logo-img"
      />
    </Link>
  )
}
