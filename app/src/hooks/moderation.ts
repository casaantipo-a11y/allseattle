import type { CollectionAfterChangeHook } from 'payload'

import { isStaff } from '../access/roles'
import { emailLayout, sendMail } from '../lib/email'
import { absoluteUrl } from '../lib/site'

type Kind = 'car' | 'job' | 'business' | 'banner'
const WHAT: Record<Kind, string> = { car: 'car listing', job: 'job posting', business: 'business listing', banner: 'banner' }
const PATH: Record<Kind, string> = { car: '/cars/', job: '/jobs/', business: '/biz/', banner: '' }
const ACCOUNT: Record<Kind, string> = { car: '/account/listings', job: '/account/listings', business: '/account/business', banner: '/account/ads' }

// Stage 3: when the team approves or rejects a car, a job, a business or a banner that a
// site customer sent, the author gets an email (with the reason, if rejected).
export const notifyAuthorOfReview =
  (kind: Kind): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req, operation }) => {
    if (operation !== 'update' || !isStaff(req)) return doc
    if (!doc.owner || (doc.source && doc.source !== 'user') || previousDoc?.status === doc.status) return doc
    if (doc.status !== 'published' && doc.status !== 'rejected') return doc
    try {
      const ownerId = typeof doc.owner === 'object' ? doc.owner.id : doc.owner
      const owner = await req.payload.findByID({ collection: 'customers', id: ownerId, depth: 0, overrideAccess: true, req })
      if (!owner?.email) return doc
      const what = WHAT[kind]
      const name = kind === 'business' ? doc.name : kind === 'banner' ? doc.advertiser : doc.title
      const live = doc.status === 'published'
      const mail = emailLayout({
        heading: live ? `Your ${what} is live` : `Your ${what} needs changes`,
        paragraphs: live
          ? [`“${name}” passed review and is now on AllSeattle.`, 'You can edit it from your account.']
          : [`“${name}” was not published.`, doc.moderationNote ? `Reason: ${doc.moderationNote}` : 'Please check the details and send it again.'],
        button:
          live && PATH[kind]
            ? { label: 'View it on the site', href: absoluteUrl(`${PATH[kind]}${doc.slug}`) }
            : { label: 'Open your account', href: absoluteUrl(ACCOUNT[kind]) },
      })
      await sendMail({ to: owner.email, subject: live ? `Published: ${name}` : `Not published: ${name}`, ...mail })
    } catch (e) {
      console.error('[moderation] could not email the author', e)
    }
    return doc
  }
