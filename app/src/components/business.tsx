import Link from 'next/link'
import type React from 'react'

import {
  badgeFor,
  bizPath,
  type BusinessFull,
  effectivePackage,
  formatViews,
  telHref,
} from '@/lib/business'
import { mediaUrl } from '@/lib/media'
import type { BusinessCategory } from '@/payload-types'

// The prototype's directory row (css: components.css .biz-row) on real data,
// now linking to the business page. Standard listings carry the "upgrade"
// link the prototype had — it sells the next package.

/* eslint-disable @next/next/no-img-element -- fixed-size thumbnails from Payload renditions */

export function BizRow({
  biz,
  sectionCategoryIds,
}: {
  biz: BusinessFull
  sectionCategoryIds?: Set<number>
}) {
  const pkg = effectivePackage(biz)
  const badge = badgeFor(pkg)
  const variant =
    badge?.cls === 'badge-premium' ? 'premium' : badge?.cls === 'badge-lux' ? 'lux' : 'standard'
  const img = mediaUrl(biz.cover ?? biz.logo, 'thumb')
  const cats = (biz.categories ?? []).filter(
    (c) => typeof c === 'object' && (!sectionCategoryIds || sectionCategoryIds.has(c.id)),
  )
  const href = bizPath(biz.slug)
  return (
    <article className={`biz-row biz-row--${variant}`}>
      {img ? (
        <img className="biz-row-thumb" src={img} alt="" loading="lazy" />
      ) : (
        <span className="biz-row-thumb" />
      )}
      <div className="biz-row-body">
        <div className="biz-row-meta">
          {badge ? <span className={`badge ${badge.cls}`}>{badge.label}</span> : null}
          {biz.viewsCount ? (
            <span className="biz-row-views">{formatViews(biz.viewsCount)} views this month</span>
          ) : null}
          {variant === 'standard' ? (
            <Link className="biz-row-upsell" href="/advertise">
              Upgrade your listing &rarr;
            </Link>
          ) : null}
        </div>
        <Link href={href} className="biz-row-name">
          {biz.name}
        </Link>
        {cats.length ? (
          <div className="biz-row-cat">{cats.map((c) => c.name).join(' · ')}</div>
        ) : null}
        {biz.summary ? <p className="biz-row-desc">{biz.summary}</p> : null}
        <div className="biz-row-contact">
          {biz.address ? <span>{biz.address}</span> : null}
          {biz.phone ? <a href={telHref(biz.phone)}>{biz.phone}</a> : null}
        </div>
      </div>
    </article>
  )
}

type Node = BusinessCategory & { children: Node[]; count: number }

export function buildTree(categories: BusinessCategory[], counts: Map<number, number>): Node[] {
  const byId = new Map<number, Node>(
    categories.map((c) => [c.id, { ...c, children: [], count: counts.get(c.id) ?? 0 }]),
  )
  const roots: Node[] = []
  for (const n of byId.values()) {
    const parent = typeof n.parent === 'object' ? n.parent?.id : n.parent
    const p = parent ? byId.get(parent) : undefined
    if (p) p.children.push(n)
    else roots.push(n)
  }
  return roots
}

/** The "Headings" widget, as links (one URL per category, so each is
 * indexable), in the shared category-list look (components.css .cat-list):
 * sub-categories follow their parent, indented. */
export function CategoryTree({
  tree,
  base,
  activeSlug,
  total,
}: {
  tree: Node[]
  base: string
  activeSlug?: string
  total: number
}) {
  const rows: React.ReactNode[] = []
  const add = (n: Node, depth: number) => {
    const active = n.slug === activeSlug
    rows.push(
      <li key={n.id}>
        <Link
          href={`${base}/${n.slug}`}
          aria-current={active ? 'page' : undefined}
          className={`cat-row${depth ? ' cat-row--sub' : ''}${active ? ' is-active' : ''}`}
          style={depth ? ({ '--depth': depth } as React.CSSProperties) : undefined}
        >
          <span>{n.name}</span>
          <span className="cat-num">{n.count}</span>
        </Link>
      </li>,
    )
    for (const c of n.children) add(c, depth + 1)
  }
  for (const n of tree) add(n, 0)
  return (
    <nav className="widget" aria-label="Categories">
      <div className="widget-head">Headings</div>
      <ul className="cat-list">
        <li>
          <Link
            href={base}
            className={`cat-row${!activeSlug ? ' is-active' : ''}`}
            aria-current={!activeSlug ? 'page' : undefined}
          >
            <span>All</span>
            <span className="cat-num">{total}</span>
          </Link>
        </li>
        {rows}
      </ul>
    </nav>
  )
}
