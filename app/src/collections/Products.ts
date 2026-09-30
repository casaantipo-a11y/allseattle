import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { isDemoField } from '../fields'
import { assertCountWithin, packageOfBusiness, plural } from '../hooks/packageLimits'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['products', 'businesses'])

const withinProductLimit: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const business = data.business ?? originalDoc?.business
  const pkg = await packageOfBusiness(req.payload, business, req)
  if (!pkg) return data
  await assertCountWithin(req.payload, {
    collection: 'products',
    business,
    limit: pkg.maxProducts,
    selfId: originalDoc?.id,
    path: 'business',
    message:
      pkg.maxProducts === 0
        ? `${pkg.name} package doesn't include products`
        : `${pkg.name} package allows up to ${plural(pkg.maxProducts, 'product')}`,
    req,
  })
  return data
}

// Goods a business sells; shown on its page when the package allows products.
export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'business', 'price'], group: 'Business' },
  access: {
    read: () => true,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    beforeChange: [withinProductLimit],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'business', type: 'relationship', relationTo: 'businesses', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', min: 0, admin: { description: 'USD. Empty = "Ask for price".' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea' },
    isDemoField,
  ],
}
