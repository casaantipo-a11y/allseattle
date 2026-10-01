import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { canWrite, publishedOrLoggedIn } from '../access/roles'
import { isDemoField, slugHistoryField, statusField, uniqueSlug, uniqueSlugField } from '../fields'
import { withinListingLimit } from '../hooks/listingLimit'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['cars'])

// Title from year + make + model when left empty (still editable), and the
// model must be one of the make's models when that make has a list.
const titleAndModel: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data
  const makeId = data.make ?? originalDoc?.make
  const id = typeof makeId === 'object' && makeId ? makeId.id : makeId
  const make = id ? await req.payload.findByID({ collection: 'car-makes', id, depth: 0, req }).catch(() => null) : null
  const model = data.model ?? originalDoc?.model
  if (make && model && make.models?.length && !make.models.includes(model)) {
    throw new ValidationError({
      errors: [{ path: 'model', message: `${model} is not in the ${make.name} model list — add it under Car makes first` }],
    })
  }
  const title = data.title ?? originalDoc?.title
  if (!title && make && model) {
    const year = data.year ?? originalDoc?.year
    data.title = [year, make.name, model].filter(Boolean).join(' ')
  }
  // Field hooks (the slug's) run before this collection hook, so a title built
  // here would leave the slug empty — fill it from the new title.
  if (!data.slug && !originalDoc?.slug && data.title) data.slug = await uniqueSlug(req, 'car-listings', data.title, originalDoc?.id)
  return data
}

const opts = (values: string[]) => values.map((v) => ({ label: v, value: v }))

export const CarListings: CollectionConfig = {
  slug: 'car-listings',
  labels: { singular: 'Car listing', plural: 'Car listings' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'mileage', 'status', 'isFeatured', 'expiresAt'],
    group: 'Cars',
    listSearchableFields: ['title', 'vin', 'sellerName'],
  },
  defaultSort: '-createdAt',
  access: {
    read: publishedOrLoggedIn,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    beforeValidate: [titleAndModel],
    beforeChange: [rememberOldSlug, withinListingLimit('dealer')],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Leave empty: it is built from year, make and model.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'make', type: 'relationship', relationTo: 'car-makes', required: true },
        { name: 'model', type: 'text', required: true },
        { name: 'year', type: 'number', required: true, min: 1950, max: 2100 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', required: true, min: 0, admin: { description: 'USD' } },
        { name: 'mileage', type: 'number', required: true, min: 0, admin: { description: 'miles' } },
        { name: 'engine', type: 'text', admin: { description: 'e.g. 2.5L I4 Hybrid' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'transmission', type: 'select', required: true, options: opts(['Automatic', 'CVT Automatic', 'Manual']) },
        { name: 'fuelType', type: 'select', required: true, options: opts(['Gasoline', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric']) },
        { name: 'drivetrain', type: 'select', options: opts(['FWD', 'RWD', 'AWD', '4WD']) },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'bodyType',
          type: 'select',
          required: true,
          options: [
            { label: 'Sedan', value: 'sedan' },
            { label: 'SUV', value: 'suv' },
            { label: 'Truck', value: 'truck' },
            { label: 'Hatchback', value: 'hatchback' },
            { label: 'Coupe', value: 'coupe' },
            { label: 'Convertible', value: 'convertible' },
            { label: 'Wagon', value: 'wagon' },
            { label: 'Van / minivan', value: 'van' },
          ],
        },
        { name: 'exteriorColor', type: 'text' },
        { name: 'vin', type: 'text', label: 'VIN', maxLength: 17 },
      ],
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'The first photo is the cover.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'sellerName', type: 'text', required: true },
        { name: 'sellerPhone', type: 'text', required: true },
      ],
    },
    {
      name: 'dealer',
      type: 'relationship',
      relationTo: 'businesses',
      admin: { description: 'If a dealership sells it. Counts towards the dealer package’s listing limit.' },
    },
    uniqueSlugField('car-listings'),
    statusField,
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Featured',
      admin: { position: 'sidebar' },
    },
    {
      name: 'bumpedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: '"Bump" a listing to the top of the catalog by setting this to now.',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    { name: 'expiresAt', type: 'date', index: true, admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Added by the team', value: 'admin' },
        { label: 'Submitted by a user', value: 'user' },
      ],
      admin: { position: 'sidebar', readOnly: true, description: 'User submissions arrive in stage 3.' },
    },
    isDemoField,
    slugHistoryField,
  ],
}
