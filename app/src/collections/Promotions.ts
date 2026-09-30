import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { canWrite } from '../access/roles'
import { isDemoField } from '../fields'
import { packageOfBusiness } from '../hooks/packageLimits'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['promotions', 'businesses'])

const packageAllowsPromotions: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const pkg = await packageOfBusiness(req.payload, data.business ?? originalDoc?.business, req)
  if (pkg && !pkg.promotions)
    throw new ValidationError({ errors: [{ path: 'business', message: `${pkg.name} package doesn't include promotions` }] })
  const from = data.validFrom ?? originalDoc?.validFrom
  const until = data.validUntil ?? originalDoc?.validUntil
  if (from && until && new Date(until) < new Date(from))
    throw new ValidationError({ errors: [{ path: 'validUntil', message: 'Ends before it starts' }] })
  return data
}

// A business's offers. Expired ones disappear from the site on their own —
// queries only return promotions whose validUntil hasn't passed.
export const Promotions: CollectionConfig = {
  slug: 'promotions',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'business', 'validFrom', 'validUntil'], group: 'Business' },
  defaultSort: '-validFrom',
  access: {
    read: () => true,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    beforeChange: [packageAllowsPromotions],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'business', type: 'relationship', relationTo: 'businesses', required: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'validFrom', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'validUntil', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
    isDemoField,
  ],
}
