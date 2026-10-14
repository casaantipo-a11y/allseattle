import type { CollectionAfterChangeHook } from 'payload'

import { isStaff } from '../access/roles'
import { emailLayout, sendMail } from '../lib/email'
import { absoluteUrl } from '../lib/site'

// Stage 3, user listings: when the team approves or rejects a car or a job a site
// customer submitted, the author gets an email (with the reason, if rejected).
export const notifyAuthorOfReview =
  (kind: 'car' | 'job'): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req, operation }) => {
    if (operation !== 'update' || !isStaff(req)) return doc
    if (doc.source !== 'user' || !doc.owner || previousDoc?.status === doc.status) return doc
    if (doc.status !== 'published' && doc.status !== 'rejected') return doc
    try {
      const ownerId = typeof doc.owner === 'object' ? doc.owner.id : doc.owner
      const owner = await req.payload.findByID({ collection: 'customers', id: ownerId, depth: 0, overrideAccess: true, req })
      if (!owner?.email) return doc
      const what = kind === 'car' ? 'car listing' : 'job posting'
      const live = doc.status === 'published'
      const mail = emailLayout({
        heading: live ? `Your ${what} is live` : `Your ${what} needs changes`,
        paragraphs: live
          ? [`“${doc.title}” passed review and is now on AllSeattle.`, 'You can edit, hide or renew it from your account.']
          : [`“${doc.title}” was not published.`, doc.moderationNote ? `Reason: ${doc.moderationNote}` : 'Please check the details and send it again.'],
        button: live
          ? { label: 'View it on the site', href: absoluteUrl(kind === 'car' ? `/cars/${doc.slug}` : `/jobs/${doc.slug}`) }
          : { label: 'Open your listings', href: absoluteUrl('/account/listings') },
      })
      await sendMail({ to: owner.email, subject: live ? `Published: ${doc.title}` : `Not published: ${doc.title}`, ...mail })
    } catch (e) {
      console.error('[moderation] could not email the author', e)
    }
    return doc
  }
