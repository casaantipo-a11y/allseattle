import type { Metadata } from 'next'
import Link from 'next/link'

import { SEARCH_KINDS } from '@/search'
import { searchSite } from '@/lib/queries-phase3'

type Props = { searchParams: Promise<{ q?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = ((await searchParams).q ?? '').trim()
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false, follow: true } }
}

// Global search results, grouped by type (spec §6).
export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').trim()
  const hits = await searchSite(q, 100)
  const groups = Object.entries(SEARCH_KINDS)
    .map(([kind, label]) => ({ kind, label, items: hits.filter((h) => h.kind === kind) }))
    .filter((g) => g.items.length)

  return (
    <main id="content">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Search AllSeattle</span>
              <h1>{q ? <>Results for &ldquo;{q}&rdquo;</> : 'Search'}</h1>
            </div>
          </div>
          <form action="/search" method="get" role="search" className="mb-8 flex max-w-[640px] gap-2">
            <input type="search" name="q" defaultValue={q} minLength={2} placeholder="Businesses, news, jobs, events, cars…" aria-label="Search" className="min-h-11 flex-1" />
            <button type="submit" className="btn">
              Search
            </button>
          </form>

          {q.length < 2 ? (
            <p className="muted">Type at least two letters.</p>
          ) : !groups.length ? (
            <p className="muted">Nothing found for &ldquo;{q}&rdquo;. Try another word.</p>
          ) : (
            <div className="grid gap-10">
              <p className="muted m-0">
                {hits.length} result{hits.length === 1 ? '' : 's'}: {groups.map((g) => `${g.label} ${g.items.length}`).join(' · ')}
              </p>
              {groups.map((g) => (
                <section key={g.kind} aria-labelledby={`r-${g.kind}`}>
                  <h2 id={`r-${g.kind}`} className="mb-3 text-xl">
                    {g.label}
                  </h2>
                  <ul className="m-0 grid list-none gap-0 p-0">
                    {g.items.map((h) => (
                      <li key={h.id} className="border-b border-brand-line py-3">
                        <Link href={h.url} className="font-display text-base font-bold text-brand-navy hover:text-brand-red">
                          {h.title}
                        </Link>
                        {h.excerpt ? <p className="m-0 mt-1 text-sm text-brand-slate">{h.excerpt}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
