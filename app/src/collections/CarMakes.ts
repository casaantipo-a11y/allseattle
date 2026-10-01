import type { CollectionConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateCollection } from '../hooks/revalidate'

// Makes and their models — the source of the Make/Model choices in car
// listings (spec §4). Seeded with the makes popular in the US.
const revalidate = revalidateCollection(['cars'])

export const CarMakes: CollectionConfig = {
  slug: 'car-makes',
  labels: { singular: 'Car make', plural: 'Car makes' },
  admin: { useAsTitle: 'name', group: 'Cars' },
  defaultSort: 'name',
  access: { read: () => true, create: canWrite('sales'), update: canWrite('sales'), delete: canWrite('sales') },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'models', type: 'text', hasMany: true, admin: { description: 'Type a model and press Enter.' } },
  ],
}
