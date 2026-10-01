import Link from 'next/link'

import { badgeFor, bizPath, type BusinessFull, effectivePackage, formatViews, telHref } from '@/lib/business'
import { mediaUrl } from '@/lib/media'
import type { BusinessCategory } from '@/payload-types'

// The prototype's directory row (css: components.css .biz-row) on real data,
// now linking to the business page. Standard listings carry the "upgrade"
// link the prototype had — it sells the next package.

/* eslint-disable @next/next/no-img-element -- fixed-size thumbnails from Payload renditions */

/** Paid = a package with priority placement or a branded page (Luxury, Premium). */
export const isPaid = (biz: BusinessFull) => {
  const pkg = effectivePackage(biz)
  return Boolean(pkg && (pkg.priorityPlacement || pkg.brandedPage))
}

export function BizRow({
  biz,
  sectionCategoryIds,
  gold = false,
}: {
  biz: BusinessFull
  sectionCategoryIds?: Set<number>
  /** One "Gold" look for every paid package (the Cars page list). */
  gold?: boolean
}) {
  const pkg = effectivePackage(biz)
  const goldRow = gold && isPaid(biz)
  const badge = goldRow ? { label: 'Gold', cls: 'badge-gold' } : badgeFor(pkg)
  const variant = goldRow ? 'gold' : badge?.cls === 'badge-premium' ? 'premium' : badge?.cls === 'badge-lux' ? 'lux' : 'standard'
  const img = mediaUrl(biz.cover ?? biz.logo, 'thumb')
  const cats = (biz.categories ?? []).filter((c) => typeof c === 'object' && (!sectionCategoryIds || sectionCategoryIds.has(c.id)))
  const href = bizPath(biz.slug)
  return (
    <article className={`biz-row biz-row--${variant}`}>
      {img ? <img className="biz-row-thumb" src={img} alt="" loading="lazy" /> : <span className="biz-row-thumb" />}
      <div className="biz-row-body">
        <div className="biz-row-meta">
          {badge ? <span className={`badge ${badge.cls}`}>{badge.label}</span> : null}
          {biz.viewsCount ? <span className="biz-row-views">{formatViews(biz.viewsCount)} views this month</span> : null}
          {variant === 'standard' ? (
            <Link className="biz-row-upsell" href="/advertise">
              Upgrade your listing &rarr;
            </Link>
          ) : null}
        </div>
        <Link href={href} className="biz-row-name">
          {biz.name}
        </Link>
        {cats.length ? <div className="biz-row-cat">{cats.map((c) => c.name).join(' · ')}</div> : null}
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
  const byId = new Map<number, Node>(categories.map((c) => [c.id, { ...c, children: [], count: counts.get(c.id) ?? 0 }]))
  const roots: Node[] = []
  for (const n of byId.values()) {
    const parent = typeof n.parent === 'object' ? n.parent?.id : n.parent
    const p = parent ? byId.get(parent) : undefined
    if (p) p.children.push(n)
    else roots.push(n)
  }
  return roots
}

/** The prototype's "Headings" widget, as links (one URL per category, so each is indexable). */
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
  const item = (n: Node, depth: number) => (
    <li key={n.id}>
      <Link
        href={`${base}/${n.slug}`}
        aria-current={n.slug === activeSlug ? 'page' : undefined}
        className={n.slug === activeSlug ? 'active' : undefined}
        style={depth ? { paddingLeft: `${depth * 16}px` } : undefined}
      >
        <span>{n.name}</span>
        <span className="dir-cats-num">{n.count}</span>
      </Link>
      {n.children.length ? <ul className="dir-cats">{n.children.map((c) => item(c, depth + 1))}</ul> : null}
    </li>
  )
  return (
    <nav className="widget" aria-label="Categories">
      <div className="widget-head">Headings</div>
      <div className="widget-body">
        <ul className="dir-cats">
          <li>
            <Link href={base} className={!activeSlug ? 'active' : undefined} aria-current={!activeSlug ? 'page' : undefined}>
              <span>All</span>
              <span className="dir-cats-num">{total}</span>
            </Link>
          </li>
          {tree.map((n) => item(n, 0))}
        </ul>
      </div>
    </nav>
  )
}
