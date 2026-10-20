import Link from 'next/link'

// The "Coming soon" card for a section with nothing in it yet (client, 20.10.2026: the
// demo news and businesses were deleted and the pages were left with a grey line). One
// card for Events, Home's news, News, the Directory, Shopping, Leisure and Cars Services:
// icon, "Coming soon", a headline, a line about what will be there, and on a line of its
// own the way to add something (the link never breaks in the middle).

const stroke = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: d }}
  />
)

const ICONS = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  news: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  store: '<path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6z"/><path d="M10 20v-5h4v5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
} as const

export function ComingSoon({
  icon,
  title,
  text,
  lead,
  linkLabel,
  href,
  className = '',
}: {
  icon: keyof typeof ICONS
  title: string
  text: string
  lead: string
  linkLabel: string
  href: string
  className?: string
}) {
  return (
    <div className={`coming-soon mx-auto max-w-[640px] ${className} rounded-xl border border-brand-line bg-white px-6 py-12 text-center`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecec] text-brand-red" aria-hidden="true">
        {stroke(ICONS[icon])}
      </div>
      <div className="eyebrow">Coming soon</div>
      <div className="mt-2 font-display text-2xl font-bold text-brand-navy">{title}</div>
      <div className="mx-auto mt-3 max-w-[48ch] text-brand-slate">{text}</div>
      <div className="mt-2 text-brand-slate">
        {lead}{' '}
        <Link href={href} className="whitespace-nowrap text-brand-navy underline">
          {linkLabel}
        </Link>
        .
      </div>
    </div>
  )
}

/** The news card — Home's "Latest news" and the News page. */
export const NewsSoon = ({ className }: { className?: string }) => (
  <ComingSoon
    className={className}
    icon="news"
    title="Seattle news is on its way"
    text="Local stories from every corner of the city — neighborhoods, city hall, transit, food and business."
    lead="Saw something newsworthy?"
    linkLabel="Share the news"
    href="/share-news"
  />
)
