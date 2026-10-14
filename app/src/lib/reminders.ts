import config from '@payload-config'
import { getPayload } from 'payload'

import type { Business, CarListing, Customer, Job, Package } from '@/payload-types'

import { emailLayout, sendMail } from './email'
import { absoluteUrl } from './site'

// Daily reminders (stage 3), run by Vercel Cron through /api/cron/daily: an owner
// hears 2–3 days ahead that a car or job is about to come off the site (it can
// be renewed in the account), or that a package the team set by hand is about to
// end (an online subscription renews by itself and isn't mentioned). The window
// is one day wide and the job runs once a day, so each reminder goes out once.

const DAY = 24 * 3600 * 1000
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' })

export async function sendDailyReminders(now = Date.now()) {
  const payload = await getPayload({ config })
  const from = new Date(now + 2 * DAY).toISOString()
  const to = new Date(now + 3 * DAY).toISOString()
  const window = { and: [{ greater_than: from }, { less_than_equal: to }] }
  const owners = new Map<number, Customer | null>()
  const ownerOf = async (id: unknown) => {
    const n = typeof id === 'object' && id ? (id as { id: number }).id : (id as number)
    if (!n) return null
    if (!owners.has(n)) owners.set(n, (await payload.findByID({ collection: 'customers', id: n, depth: 0, overrideAccess: true, disableErrors: true })) as Customer | null)
    return owners.get(n) ?? null
  }
  let sent = 0

  for (const [collection, kind] of [
    ['car-listings', 'car listing'],
    ['jobs', 'job posting'],
  ] as const) {
    const { docs } = await payload.find({
      collection,
      where: { and: [{ owner: { exists: true } }, { status: { equals: 'published' } }, { expiresAt: window.and[0] }, { expiresAt: window.and[1] }] },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of docs as (CarListing | Job)[]) {
      const owner = await ownerOf(doc.owner)
      if (!owner?.email || !doc.expiresAt) continue
      const mail = emailLayout({
        heading: `Your ${kind} ends soon`,
        paragraphs: [`“${doc.title}” comes off AllSeattle on ${fmt(doc.expiresAt)}.`, 'Still relevant? Renew it for another 30 days in your account — it takes one click.'],
        button: { label: 'Renew it', href: absoluteUrl('/account/listings') },
      })
      await sendMail({ to: owner.email, subject: `Ends ${fmt(doc.expiresAt)}: ${doc.title}`, ...mail })
      sent++
    }
  }

  const { docs: businesses } = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { owner: { exists: true } },
        { package: { exists: true } },
        { packageExpiresAt: window.and[0] },
        { packageExpiresAt: window.and[1] },
        { or: [{ subscriptionStatus: { exists: false } }, { subscriptionStatus: { equals: 'canceled' } }] },
      ],
    },
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })
  for (const biz of businesses as Business[]) {
    const owner = await ownerOf(biz.owner)
    const pkg = biz.package as Package | null
    if (!owner?.email || !pkg || !biz.packageExpiresAt) continue
    const mail = emailLayout({
      heading: `${pkg.name} package ends soon`,
      paragraphs: [
        `The ${pkg.name} package of “${biz.name}” ends on ${fmt(biz.packageExpiresAt)}. After that the business shows as a basic listing.`,
        'To keep it, renew from your account or write to us.',
      ],
      button: { label: 'Open my business', href: absoluteUrl(`/account/business/${biz.id}/package`) },
    })
    await sendMail({ to: owner.email, subject: `${pkg.name} package ends ${fmt(biz.packageExpiresAt)}: ${biz.name}`, ...mail })
    sent++
  }
  return { sent }
}
