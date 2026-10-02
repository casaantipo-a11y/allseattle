import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { BizRow, CategoryTree, buildTree } from '@/components/business'
import { Pagination } from '@/components/news'
import { Svg, UI_ICONS } from '@/components/icons'
import { LiveBizSearch } from '@/components/LiveBizSearch'
import type { Section } from '@/collections/BusinessCategories'
import { compareBusinesses, withDescendants } from '@/lib/business'
import { getActivePromotions, getAllBusinesses, getBusinessCategories } from '@/lib/queries'
import type { Business } from '@/payload-types'

// One storefront, three sections (spec §5): the Business Directory, Shopping
// and Leisure are the same list of businesses filtered to the categories of
// their section. Layout and CSS are the prototype's directory page
// (styles/directory.css): categories on the left, search and rows in the
// middle, ads on the right.

export const SECTION_META: Record<
  Section,
  { base: string; eyebrow: string; title: string; codePrefix: string }
> = {
  directory: {
    base: '/directory',
    eyebrow: 'Business Directory',
    title: 'Find a Seattle business',
    codePrefix: 'DIRECTORY',
  },
  shopping: {
    base: '/shopping',
    eyebrow: 'Shopping',
    title: 'Shop local in Seattle',
    codePrefix: 'SHOPPING',
  },
  leisure: {
    base: '/leisure',
    eyebrow: 'Things to do',
    title: 'Leisure in Seattle',
    codePrefix: 'LEISURE',
  },
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
  const [allCategories, allBusinesses] = await Promise.all([
    getBusinessCategories(),
    getAllBusinesses(),
  ])
  const categories = allCategories.filter((c) => c.section === section)
  const sectionIds = new Set(categories.map((c) => c.id))
  const active = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined
  if (categorySlug && !active) notFound()

  const catIds = (b: { categories: unknown[] }) =>
    (b.categories ?? []).map((c) =>
      typeof c === 'object' && c ? (c as { id: number }).id : (c as number),
    )
  const inSection = allBusinesses.filter((b) => catIds(b).some((id) => sectionIds.has(id)))

  // Counts include businesses of child categories.
  const counts = new Map<number, number>()
  for (const c of categories) {
    const ids = withDescendants(categories, c.id)
    counts.set(c.id, inSection.filter((b) => catIds(b).some((id) => ids.has(id))).length)
  }

  const scope = active ? withDescendants(categories, active.id) : sectionIds
  const needle = q.trim().toLowerCase()
  // What a search matches: name, summary, address and category names.
  const searchText = (b: (typeof inSection)[number]) =>
    [
      b.name,
      b.summary,
      b.address,
      ...(b.categories ?? []).map((c) => (typeof c === 'object' ? c.name : '')),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  const scoped = inSection
    .filter((b) => catIds(b).some((id) => scope.has(id)))
    .sort((a, b) => compareBusinesses(a, b))
  const found = needle ? scoped.filter((b) => searchText(b).includes(needle)) : scoped

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
          <AdSlot
            code={`${meta.codePrefix}_TOP`}
            size="728x90"
            mobileSize="320x100"
            className="ad-slot-top"
          />
          <div className="section-head">
            <div>
              <span className="eyebrow">{meta.eyebrow}</span>
              <h1>{active ? active.name : meta.title}</h1>
            </div>
          </div>

          <div className="dir-layout">
            <aside className="dir-rail dir-rail--left">
              <CategoryTree
                tree={buildTree(categories, counts)}
                base={meta.base}
                activeSlug={active?.slug ?? undefined}
                total={inSection.length}
              />
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
              <LiveBizSearch
                action={base}
                initialQuery={q}
                label={`Search ${meta.eyebrow.toLowerCase()}`}
                icon={<Svg html={UI_ICONS.search} />}
                items={scoped.map((b) => ({
                  id: b.id,
                  text: searchText(b),
                  node: <BizRow key={b.id} biz={b} sectionCategoryIds={sectionIds} />,
                }))}
              >
                {active?.description ? <p className="muted">{active.description}</p> : null}

                {deals.length ? (
                  <div className="deals">
                    <div className="deals-head">
                      <span className="eyebrow">Shopping deals</span>
                      <h2>Deals this week</h2>
                    </div>
                    <ul className="deals-grid">
                      {deals.slice(0, 6).map((d) => {
                        const biz = d.business as Business
                        // "25% off: Seasonal bouquet" → badge "25% off", title "Seasonal bouquet".
                        const cut = d.title.indexOf(': ')
                        const badge = cut > 0 && cut <= 20 ? d.title.slice(0, cut) : null
                        const title = badge ? d.title.slice(cut + 2) : d.title
                        return (
                          <li key={d.id}>
                            <Link href={`/biz/${biz.slug}`} className="deal-card">
                              <span className="deal-top">
                                {badge ? <span className="deal-badge">{badge}</span> : null}
                                <span className="deal-until">
                                  Until{' '}
                                  {new Date(d.validUntil).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'UTC',
                                  })}
                                </span>
                              </span>
                              <span className="deal-title">{title}</span>
                              <span className="deal-shop">{biz.name} &rarr;</span>
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
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  base={base}
                  params={needle ? { q } : {}}
                />
              </LiveBizSearch>
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
