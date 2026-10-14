import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
} from 'payload'
import { ValidationError } from 'payload'

import { canWrite, publishedOrLoggedIn, staffOnlyField } from '../access/roles'
import { isDemoField, moderatedStatusField, moderationNoteField, ownerField } from '../fields'
import { notifyAuthorOfReview } from '../hooks/moderation'
import { revalidateCollection } from '../hooks/revalidate'
import type { AdSlot, Media } from '../payload-types'

const revalidate = revalidateCollection(['banners'], () => ['/advertise'])

const TOLERANCE = 2 // px, spec §4
// Sharp-screen ("retina") creatives: the slot size times 2 or 3. Phones and most
// laptops draw at 2–3x, and an image at exactly 728x90 looks soft there. The
// slot box stays the same size; the browser just has more pixels to draw.
const SCALES = [1, 2, 3]

const idOf = (v: unknown) =>
  typeof v === 'object' && v ? (v as { id: number }).id : (v as number | null | undefined)

/** Each image must be its slots' size (±2px), or exactly 2x/3x of it; a slot with a mobile size needs a mobile image. */
const checkSizes: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const errors: { path: string; message: string }[] = []
  const start = data.startAt ?? originalDoc?.startAt
  const end = data.endAt ?? originalDoc?.endAt
  if (start && end && new Date(end) <= new Date(start))
    errors.push({ path: 'endAt', message: 'The end must be after the start.' })
  const link = String(data.linkUrl ?? originalDoc?.linkUrl ?? '')
  if (!/^https?:\/\//i.test(link))
    errors.push({ path: 'linkUrl', message: 'Use a full address starting with https://' })

  const slotIds = ((data.slots ?? originalDoc?.slots ?? []) as unknown[])
    .map(idOf)
    .filter(Boolean) as number[]
  const desktopId = idOf(data.imageDesktop !== undefined ? data.imageDesktop : originalDoc?.imageDesktop)
  // A banner bought online starts without a picture (the buyer uploads it in the
  // account); it can't go live until it has one.
  if (!desktopId && (data.status ?? originalDoc?.status) === 'published')
    errors.push({ path: 'imageDesktop', message: 'Add the banner picture before publishing.' })
  const mobileId = idOf(
    data.imageMobile !== undefined ? data.imageMobile : originalDoc?.imageMobile,
  )
  const [slots, desktop, mobile] = await Promise.all([
    slotIds.length
      ? req.payload
          .find({
            collection: 'ad-slots',
            where: { id: { in: slotIds } },
            limit: slotIds.length,
            depth: 0,
            req,
          })
          .then((r) => r.docs)
      : Promise.resolve([] as AdSlot[]),
    desktopId
      ? req.payload
          .findByID({ collection: 'media', id: desktopId, depth: 0, req })
          .catch(() => null)
      : null,
    mobileId
      ? req.payload.findByID({ collection: 'media', id: mobileId, depth: 0, req }).catch(() => null)
      : null,
  ])

  const fits = (img: Media | null, size: string) => {
    if (!img?.width || !img?.height) return false
    const [w, h] = size.split('x').map(Number)
    return SCALES.some(
      (k) =>
        Math.abs(img.width! - w * k) <= TOLERANCE * k &&
        Math.abs(img.height! - h * k) <= TOLERANCE * k,
    )
  }
  const sizes = (size: string) => {
    const [w, h] = size.split('x').map(Number)
    return `${size} (or ${w * 2}x${h * 2} for sharp screens)`
  }
  const dims = (img: Media | null) =>
    img?.width && img?.height ? `${img.width}x${img.height}` : 'unknown size'

  for (const slot of slots) {
    if (desktop && !fits(desktop, slot.desktopSize))
      errors.push({
        path: 'imageDesktop',
        message: `Slot ${slot.code} needs a ${sizes(slot.desktopSize)} image; this one is ${dims(desktop)}.`,
      })
    // (a draft bought online has no pictures yet: the mobile one is asked for with the desktop one)
    if (slot.mobileSize && desktopId) {
      if (!mobile)
        errors.push({
          path: 'imageMobile',
          message: `Slot ${slot.code} is also shown on phones: add a ${slot.mobileSize} mobile image.`,
        })
      else if (!fits(mobile, slot.mobileSize))
        errors.push({
          path: 'imageMobile',
          message: `Slot ${slot.code} needs a ${sizes(slot.mobileSize)} mobile image; this one is ${dims(mobile)}.`,
        })
    }
  }
  if (errors.length) throw new ValidationError({ errors })
  return data
}

/** Stats rows point at the banner; remove them first so the delete goes through. */
const deleteStats: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({ collection: 'banner-stats', where: { banner: { equals: id } }, req })
}

// Banners (spec §4, §7). A banner shows in its slots while it is published
// and today is within startAt–endAt — nothing has to be taken down by hand.
// Several active banners in one slot rotate at random. Impressions and
// clicks are counted per day into BannerStats; the report and the CSV for
// the advertiser are on the banner's own page in the admin.
export const Banners: CollectionConfig = {
  slug: 'banners',
  admin: {
    useAsTitle: 'advertiser',
    defaultColumns: ['advertiser', 'slots', 'startAt', 'endAt', 'status'],
    description: 'Places bought online arrive as drafts; when the buyer uploads the picture the banner turns Pending review — check it and publish.',
    group: 'Advertising',
  },
  defaultSort: '-startAt',
  access: {
    // Drafts and banners waiting for review stay out of the public REST (the site reads banners server-side).
    read: publishedOrLoggedIn,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    beforeChange: [checkSizes],
    beforeDelete: [deleteStats],
    afterChange: [revalidate.afterChange, notifyAuthorOfReview('banner')],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Banner',
          fields: [
            { name: 'advertiser', type: 'text', required: true },
            {
              name: 'linkUrl',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Where a click leads, e.g. https://example.com — counted, then redirected.',
              },
            },
            {
              name: 'slots',
              type: 'relationship',
              relationTo: 'ad-slots',
              hasMany: true,
              required: true,
              label: 'Where it shows',
              admin: {
                description:
                  'Pick one or more places: page — position (size). The banner appears exactly there while it is published and today is between Start and End.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'imageDesktop',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      "The slot's desktop size (±2px), best at 2x — e.g. 1456x180 for 728x90",
                  },
                },
                {
                  name: 'imageMobile',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      "For slots shown on phones: the slot's mobile size, best at 2x — e.g. 640x200",
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'startAt',
                  type: 'date',
                  required: true,
                  index: true,
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'endAt',
                  type: 'date',
                  required: true,
                  index: true,
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
          ],
        },
        {
          label: 'Report',
          fields: [
            {
              name: 'report',
              type: 'ui',
              admin: { components: { Field: '/components/admin/BannerReport#BannerReport' } },
            },
          ],
        },
      ],
    },
    moderatedStatusField,
    ownerField('The site account that bought this place online.'),
    moderationNoteField,
    {
      // Set by the Stripe webhook for a place bought online (stage 3, lib/billing.ts):
      // each paid month moves endAt on.
      name: 'subscriptionStatus',
      type: 'select',
      options: [
        { label: 'Active (renews monthly)', value: 'active' },
        { label: 'Cancelled — runs to the end of the paid month', value: 'canceling' },
        { label: 'Payment failed — Stripe is retrying', value: 'past_due' },
        { label: 'Ended', value: 'canceled' },
      ],
      access: { read: staffOnlyField },
      admin: { position: 'sidebar', readOnly: true, description: 'Online subscription, set by Stripe.' },
    },
    { name: 'stripeSubscriptionId', type: 'text', index: true, access: { read: staffOnlyField }, admin: { position: 'sidebar', readOnly: true } },
    isDemoField,
  ],
}
