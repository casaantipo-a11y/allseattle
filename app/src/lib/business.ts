import type { Business, BusinessCategory, Media, Package } from '@/payload-types'

// Rules shared by the directory, the business page and the map.

export type BusinessFull = Omit<Business, 'package' | 'categories' | 'cover' | 'logo'> & {
  package?: Package | null
  categories: BusinessCategory[]
  cover?: Media | null
  logo?: Media | null
}

/**
 * The package that is in force today. A business whose `packageExpiresAt` has
 * passed drops to the basic view and loses its priority (spec §5) — without
 * anyone touching it in the admin.
 */
export function effectivePackage(biz: Pick<BusinessFull, 'package' | 'packageExpiresAt'>, now = new Date()): Package | null {
  const pkg = biz.package
  if (!pkg || typeof pkg !== 'object') return null
  if (biz.packageExpiresAt && new Date(biz.packageExpiresAt) < now) return null
  return pkg
}

export type View = 'standard' | 'luxury' | 'premium'

/** Which of the three business-page designs applies. */
export function viewFor(pkg: Package | null): View {
  if (!pkg) return 'standard'
  if (pkg.brandedPage) return 'premium'
  if (pkg.maxProducts > 0 || pkg.priorityPlacement) return 'luxury'
  return 'standard'
}

/** Badge text/class, from the package name so a renamed package still reads right. */
export function badgeFor(pkg: Package | null): { label: string; cls: string } | null {
  if (!pkg) return null
  const v = viewFor(pkg)
  return { label: pkg.name, cls: v === 'premium' ? 'badge-premium' : v === 'luxury' ? 'badge-lux' : 'badge-standard' }
}

/**
 * Directory order (spec §5): packages with priority placement first, the more
 * expensive (higher `order`) ahead; then the manual `priority`, higher first;
 * then by name.
 */
export function compareBusinesses(a: BusinessFull, b: BusinessFull, now = new Date()): number {
  // Package `order` is 1, 2, 3…; anything without priority placement ranks 0.
  const rank = (x: BusinessFull) => {
    const p = effectivePackage(x, now)
    return p?.priorityPlacement ? Math.max(1, p.order) : 0
  }
  return rank(b) - rank(a) || (b.priority ?? 0) - (a.priority ?? 0) || a.name.localeCompare(b.name)
}

/** A category and everything under it. */
export function withDescendants(categories: BusinessCategory[], rootId: number): Set<number> {
  const ids = new Set([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const c of categories) {
      const parent = typeof c.parent === 'object' ? c.parent?.id : c.parent
      if (parent && ids.has(parent) && !ids.has(c.id)) {
        ids.add(c.id)
        grew = true
      }
    }
  }
  return ids
}

export const bizPath = (slug: string | null | undefined) => `/biz/${slug ?? ''}`

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

export function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return String(n)
}

export const priceText = (amount: number, currency = 'USD') =>
  amount > 0
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
    : 'Contact us'
