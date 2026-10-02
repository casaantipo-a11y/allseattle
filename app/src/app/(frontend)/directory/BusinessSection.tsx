import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { BizRow, CategoryTree, buildTree } from '@/components/business'
import { Pagination } from '@/components/news'
import { Svg, UI_ICONS } from '@/components/icons'
import type { Section } from '@/collections/BusinessCategories'
import { compareBusinesses, withDescendants } from '@/lib/business'
import { getActivePromotions, getAllBusinesses, getBusinessCategories } from '@/lib/queries'
import type { Business } from '@/payload-types'

// One storefront, three sections (spec §5): the Business Directory, Shopping
// and Leisure are the same list of businesses filtered to the categories of
// their section. Layout and CSS are the prototype's directory page
// (styles/directory.css): categories on the left, search and rows in the
// middle, ads on the right.

export const SECTION_META: Record<Section, { base: string; eyebrow: string; title: string; codePrefix: string }> = {
  directory: { base: '/directory', eyebrow: 'Business Directory', title: 'Find a Seattle business', codePrefix: 'DIRECTORY' },
  shopping: { base: '/shopping', eyebrow: 'Shopping', title: 'Shop local in Seattle', codePrefix: 'SHOPPING' },
  leisure: { base: '/leisure', eyebrow: 'Things to do', title: 'Leisure in Seattle', codePrefix: 'LEISURE' },
}

const PER_PAGE = 20

export async function BusinessSection({
  section,
  categorySlug,
  q = '',
  page = 1,
}: {
  section: Section
  categorySlug?: string
  q?: string
  page?: number
}) {
  const meta = SECTION_META[section]
  const [allCategories, allBusinesses] = await Promise.all([getBusinessCategories(), getAllBusinesses()])
  const categories = allCategories.filter((c) => c.section === section)
  const sectionIds = new Set(categories.map((c) => c.id))
  const active = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined
  if (categorySlug && !active) notFound()

  const catIds = (b: { categories: unknown[] }) =>
    (b.categories ?? []).map((c) => (typeof c === 'object' && c ? (c as { id: number }).id : (c as number)))
  const inSection = allBusinesses.filter((b) => catIds(b).some((id) => sectionIds.has(id)))

  // Counts include businesses of child categories.
  const counts = new Map<number, number>()
  for (const c of categories) {
    const ids = withDescendants(categories, c.id)
    counts.set(c.id, inSection.filter((b) => catIds(b).some((id) => ids.has(id))).length)
  }

  const scope = active ? withDescendants(categories, active.id) : sectionIds
  const needle = q.trim().toLowerCase()
  const found = inSection
    .filter((b) => catIds(b).some((id) => scope.has(id)))
    .filter((b) => {
      if (!needle) return true
      const names = (b.categories ?? []).map((c) => (typeof c === 'object' ? c.name : '')).join(' ')
      return [b.name, b.summary, b.address, names].some((f) => f?.toLowerCase().includes(needle))
    })
    .sort((a, b) => compareBusinesses(a, b))

  const totalPages = Math.max(1, Math.ceil(found.length / PER_PAGE))
  if (page > totalPages) notFound()
  const rows = found.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const base = active ? `${meta.base}/${active.slug}` : meta.base

  const deals =
    section === 'shopping'
      ? (await getActivePromotions()).filter((p) => {
          const biz = p.business as Business | number
          return typeof biz === 'object' && inSection.some((b) => b.id === biz.id)
        })
      : []

  return (
    <main id="content" data-page="directory">
      <section className="section">
        <div className="container">
          <AdSlot code={`${meta.codePrefix}_TOP`} size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <div className="section-head">
            <div>
              <span className="eyebrow">{meta.eyebrow}</span>
              <h1>{active ? active.name : meta.title}</h1>
            </div>
          </div>

          <div className="dir-layout">
            <aside className="dir-rail dir-rail--left">
              <CategoryTree tree={buildTree(categories, counts)} base={meta.base} activeSlug={active?.slug ?? undefined} total={inSection.length} />
              <div className="widget dir-cta">
                <div className="widget-head">Add your business</div>
                <div className="widget-body">
                  <p className="muted">Get listed and reach people searching Seattle every day.</p>
                  <Link href="/add-business" className="btn btn-sm btn-block">
                    Add your business
                  </Link>
                </div>
              </div>
            </aside>

            <div className="dir-main">
              <form className="dir-search" role="search" action={base} method="get">
                <span className="dir-search-icon">
                  <Svg html={UI_ICONS.search} />
                </span>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="I am looking for..."
                  aria-label={`Search ${meta.eyebrow.toLowerCase()}`}
                  autoComplete="off"
                />
              </form>

              {active?.description ? <p className="muted">{active.description}</p> : null}

              {deals.length ? (
                <div className="mb-6">
                  <h2 className="mb-3 text-xl">Deals this week</h2>
                  <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                    {deals.slice(0, 6).map((d) => {
                      const biz = d.business as Business
                      return (
                        <li key={d.id} className="rounded-lg border border-brand-line bg-white p-4">
                          <p className="m-0 text-sm font-semibold text-brand-red">
                            Until{' '}
                            {new Date(d.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                          </p>
                          <p className="mb-1 mt-1 font-display text-base font-bold text-brand-navy">{d.title}</p>
                          <Link href={`/biz/${biz.slug}`} className="text-sm text-brand-slate underline hover:text-brand-red">
                            {biz.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {rows.length ? (
                <div className="biz-list">
                  {rows.map((b) => (
                    <BizRow key={b.id} biz={b} sectionCategoryIds={sectionIds} />
                  ))}
                </div>
              ) : (
                <p className="muted">No businesses match that search yet.</p>
              )}
              <Pagination page={page} totalPages={totalPages} base={base} params={needle ? { q } : {}} />
            </div>

            <aside className="dir-rail dir-rail--right">
              <AdSlot code={`${meta.codePrefix}_SIDEBAR_1`} size="300x250" mobileSize="320x100" />
              <AdSlot code={`${meta.codePrefix}_SIDEBAR_2`} size="300x600" mobileSize="320x100" />
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
