import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Fragment } from 'react'

import { AdSlot } from '@/components/AdSlot'
import { DropPanel } from '@/components/DropPanel'
import { BizRow, CategoryTree, buildTree } from '@/components/business'
import { Pagination } from '@/components/news'
import { StatsWidget } from '@/components/home'
import { Svg, UI_ICONS } from '@/components/icons'
import { LiveBizSearch } from '@/components/LiveBizSearch'
import type { Section } from '@/collections/BusinessCategories'
import { compareBusinesses, withDescendants } from '@/lib/business'
import { getAllBusinesses, getBusinessCategories } from '@/lib/queries'
import { getSiteStats } from '@/lib/queries-phase3'

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

// The directory lists 10 businesses a page, the client found 20 too many
// (09.10.2026); Shopping and Leisure keep 20.
const PER_PAGE: Record<Section, number> = { directory: 10, shopping: 20, leisure: 20 }

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
  const [allCategories, allBusinesses, stats] = await Promise.all([
    getBusinessCategories(),
    getAllBusinesses(),
    section === 'directory' ? getSiteStats() : null,
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

  const perPage = PER_PAGE[section]
  const totalPages = Math.max(1, Math.ceil(found.length / perPage))
  if (page > totalPages) notFound()
  const rows = found.slice((page - 1) * perPage, page * perPage)
  const base = active ? `${meta.base}/${active.slug}` : meta.base

  // The right column's banners inside the list below 1024px, after the first and the second
  // third of the page's rows (the Directory's full page of 10: after 2 and 5, its B2 after 8) —
  // so none lands next to another banner, including Shopping / Leisure's B2 under the list.
  const n = rows.length
  const [adA, adB] = section === 'directory' && n >= 8 ? [2, 5] : [Math.max(1, Math.round(n / 3)), Math.max(1, Math.round((2 * n) / 3))]
  const feedAds = [
    { code: `${meta.codePrefix}_SIDEBAR_1`, size: '300x250' as const, after: adA },
    { code: `${meta.codePrefix}_SIDEBAR_2`, size: '300x600' as const, after: adB },
  ]

  return (
    <main id="content" data-page="directory">
      {/* 16px from the last block (pagination, or Shopping / Leisure's B2 banner) to the
          footer, as on News and Cars (12.10.2026). */}
      <section className="section section--footer-tight">
        <div className="container">
          <AdSlot
            code={`${meta.codePrefix}_TOP`}
            size="728x90"
            mobileSize="320x100"
            className="ad-slot-top"
          />
          {/* Shopping and Leisure sit 8px closer to the banner (client, 09.10.2026). */}
          <div className={`section-head dir-head--${section}${section === 'directory' ? '' : ' section-head--snug'}`}>
            <div>
              <span className="eyebrow">{meta.eyebrow}</span>
              <h1>{active ? active.name : meta.title}</h1>
            </div>
          </div>

          <div className="dir-layout">
            <aside className="dir-rail dir-rail--left">
              {/* Below 1024 the tree is the "Category" button above the list instead. */}
              <div className="from-1024">
                <CategoryTree
                  tree={buildTree(categories, counts)}
                  base={meta.base}
                  activeSlug={active?.slug ?? undefined}
                  total={inSection.length}
                />
              </div>
              {/* Desktop only (client, 19.10.2026: not on phones and tablets). */}
              <div className="widget dir-cta from-1024-block">
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
                {/* Phones and tablets: the categories above the list (client, 19.10.2026) — the
                    left column drops under the whole list there. */}
                <DropPanel className="below-1024" label="Category" current={active?.name ?? 'All'}>
                  <CategoryTree bare tree={buildTree(categories, counts)} base={meta.base} activeSlug={active?.slug ?? undefined} total={inSection.length} />
                </DropPanel>
                {active?.description ? <p className="muted">{active.description}</p> : null}

                {rows.length ? (
                  <div className="biz-list">
                    {rows.map((b, i) => (
                      <Fragment key={b.id}>
                        <BizRow biz={b} sectionCategoryIds={sectionIds} />
                        {/* Below 1024 the right column's banners stand inside the list — under it they
                            ended up back to back (client, 19.10.2026). Same places, other position.
                            ("At a glance" is not repeated in the list: the client didn't want it there.) */}
                        {feedAds.filter((a) => a.after === i + 1).map((a) => (
                          <div key={a.code} className="below-1024">
                            <AdSlot code={a.code} size={a.size} mobileSize="320x100" className="biz-infeed-ad" />
                          </div>
                        ))}
                        {/* Directory B2: the strip in the list after the 8th business (client's scheme, 12.10.2026). */}
                        {section === 'directory' && i === 7 && rows.length > 8 ? (
                          <AdSlot code="DIRECTORY_INFEED_1" size="728x90" mobileSize="320x100" className="biz-infeed-ad" />
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No businesses match that search yet.</p>
                )}
                {feedAds.filter((a) => a.after > rows.length).map((a) => (
                  <div key={a.code} className="below-1024">
                    <AdSlot code={a.code} size={a.size} mobileSize="320x100" className="biz-infeed-ad" />
                  </div>
                ))}
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  base={base}
                  params={needle ? { q } : {}}
                />
                {/* Shopping / Leisure B2: under the list ("other sections" scheme). */}
                {section !== 'directory' ? (
                  <AdSlot code={`${meta.codePrefix}_INFEED_1`} size="728x90" mobileSize="320x100" className="biz-infeed-ad biz-infeed-ad--last" />
                ) : null}
              </LiveBizSearch>
            </div>

            <aside className="dir-rail dir-rail--right">
              <div className="from-1024">
                <AdSlot code={`${meta.codePrefix}_SIDEBAR_1`} size="300x250" mobileSize="320x100" />
              </div>
              {/* "AllSeattle at a glance" between C1 and C2, as in the prototype's directory
                  (client, 12.10.2026) — the same live counts as Home's widget. */}
              {stats ? (
                <div className="from-1024">
                  <StatsWidget stats={stats} />
                </div>
              ) : null}
              <div className="from-1024">
                <AdSlot code={`${meta.codePrefix}_SIDEBAR_2`} size="300x600" mobileSize="320x100" />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
