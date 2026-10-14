import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateCollection } from '../hooks/revalidate'

// Placement packages. Nothing about them is hard-coded on the site: prices,
// limits and feature flags all come from here, and the limits are enforced
// when a business or its products are saved (src/hooks/packageLimits.ts).
// A price of 0 is shown as "Contact us".
const revalidate = revalidateCollection(['packages', 'businesses'])

export const Packages: CollectionConfig = {
  slug: 'packages',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'priceMonthly', 'priceYearly', 'order'],
    group: 'Business',
  },
  defaultSort: 'order',
  access: {
    read: () => true,
    create: canWrite(),
    update: canWrite(),
    delete: canWrite(),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, unique: true },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 1,
          admin: { description: 'Higher = more expensive tier. Premium ranks above Luxury in the directory.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'priceMonthly', type: 'number', required: true, defaultValue: 0, min: 0, admin: { description: '0 = "Contact us"' } },
        { name: 'priceYearly', type: 'number', required: true, defaultValue: 0, min: 0, admin: { description: '0 = "Contact us"' } },
        {
          name: 'currency',
          type: 'select',
          required: true,
          defaultValue: 'USD',
          options: [{ label: 'USD', value: 'USD' }],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Limits',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'maxCategories', type: 'number', required: true, defaultValue: 2, min: 0 },
            { name: 'maxPhotos', type: 'number', required: true, defaultValue: 10, min: 0 },
            {
              name: 'maxListings',
              type: 'number',
              required: true,
              defaultValue: 5,
              min: 0,
              admin: { description: 'Car listings and job postings together' },
            },
            { name: 'maxProducts', type: 'number', required: true, defaultValue: 0, min: 0 },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Features',
      fields: [
        { name: 'mapPlacement', type: 'checkbox', defaultValue: true, label: 'Shown on the city map' },
        { name: 'promotions', type: 'checkbox', defaultValue: true, label: 'Can publish promotions' },
        { name: 'priceLists', type: 'checkbox', defaultValue: true, label: 'Can upload price lists and certificates' },
        { name: 'subdomain', type: 'checkbox', defaultValue: false, label: 'Own subdomain' },
        { name: 'priorityPlacement', type: 'checkbox', defaultValue: false, label: 'Priority in the directory and search' },
        { name: 'categoryBannerFirstMonth', type: 'checkbox', defaultValue: false, label: 'Banner in its category for the first month' },
        { name: 'brandedPage', type: 'checkbox', defaultValue: false, label: 'Branded business page (header image, brand colour, no other ads)' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      admin: { description: 'Bullet points for the packages table on /advertise.' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
}
