import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['ad-slots', 'banners'], () => ['/advertise'])

export const AD_SIZES = ['970x250', '728x90', '300x250', '300x600', '320x100'] as const
export type AdSize = (typeof AD_SIZES)[number]

// Ad placements (spec §4, AdSlots). Each place on the site that shows a banner
// renders <AdSlot code="…"> with the same code, so the code is the link
// between this list and the page; renaming one breaks the slot. Sizes here
// are what a banner's images are checked against, and /advertise lists the
// active slots with their weekly price and whether they are booked.
export const AdSlots: CollectionConfig = {
  slug: 'ad-slots',
  admin: {
    useAsTitle: 'code',
    defaultColumns: [
      'code',
      'page',
      'position',
      'desktopSize',
      'mobileSize',
      'weeklyPrice',
      'isActive',
    ],
    group: 'Advertising',
    description:
      'Places on the site where banners appear. The code must match the slot in the page code — do not rename.',
  },
  defaultSort: 'sortOrder',
  access: {
    read: () => true,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { description: 'e.g. HOME_TOP' },
        },
        {
          name: 'name',
          type: 'text',
          admin: { description: 'Human name for /advertise, e.g. "Home — top banner"' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'page',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: 'Home', value: 'home' },
            { label: 'News', value: 'news' },
            { label: 'Business directory', value: 'directory' },
            { label: 'Shopping', value: 'shopping' },
            { label: 'Leisure', value: 'leisure' },
            { label: 'Business pages', value: 'business' },
            { label: 'Events', value: 'events' },
            { label: 'Cars', value: 'cars' },
            { label: 'Jobs', value: 'jobs' },
            { label: 'Weather', value: 'weather' },
            { label: 'All pages', value: 'all' },
          ],
        },
        {
          name: 'position',
          type: 'select',
          required: true,
          options: [
            { label: 'Leaderboard (top)', value: 'leaderboard' },
            { label: 'Sidebar', value: 'sidebar' },
            { label: 'In-feed', value: 'in-feed' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'desktopSize', type: 'select', required: true, options: [...AD_SIZES] },
        {
          name: 'mobileSize',
          type: 'select',
          options: [...AD_SIZES],
          admin: { description: 'Empty = the slot is hidden on phones' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'weeklyPrice',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: { description: 'USD per week. 0 = "Contact us"' },
        },
        { name: 'sortOrder', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Off = the slot shows nothing and is not offered on /advertise' },
    },
  ],
}
