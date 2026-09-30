import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { canWrite, publishedOrLoggedIn } from '../access/roles'
import { isDemoField, slugField, slugHistoryField, statusField } from '../fields'
import { assertBusinessWithinPackage } from '../hooks/packageLimits'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'
import { geocode } from '../lib/geocode'

const revalidate = revalidateCollection(['businesses'])

// Limits of the business's package, checked against the document as it will
// be after this save (a partial update is merged with what's stored).
const enforcePackage: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  await assertBusinessWithinPackage({ ...(originalDoc ?? {}), ...data }, req.payload, req)
  return data
}

// Fills lat/lng from the address when they're empty or the address changed.
// A failed lookup never blocks the save: the reason goes into `geocodeNote`,
// which the admin shows next to the coordinates.
const geocodeAddress: CollectionBeforeChangeHook = async ({ data, originalDoc, context }) => {
  if (context?.skipGeocode) return data
  const address = (data.address ?? originalDoc?.address) as string | undefined
  if (!address?.trim()) return data
  const addressChanged = originalDoc && data.address !== undefined && data.address !== originalDoc.address
  const lat = data.lat ?? originalDoc?.lat
  const lng = data.lng ?? originalDoc?.lng
  const coordsTouched = data.lat !== undefined && data.lat !== originalDoc?.lat
  if (lat != null && lng != null && !addressChanged) return data
  if (addressChanged && coordsTouched) return data // the editor typed coordinates themselves
  const res = await geocode(address)
  if ('error' in res) return { ...data, geocodeNote: res.error }
  return { ...data, lat: res.lat, lng: res.lng, geocodeNote: '' }
}

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'package', 'packageExpiresAt', 'status', 'categories'],
    group: 'Business',
    listSearchableFields: ['name', 'address', 'phone'],
  },
  defaultSort: 'name',
  access: {
    read: publishedOrLoggedIn,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    beforeChange: [rememberOldSlug, enforcePackage, geocodeAddress],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'business-categories',
              hasMany: true,
              required: true,
              admin: { description: 'How many are allowed depends on the package.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'logo', type: 'upload', relationTo: 'media' },
                { name: 'cover', type: 'upload', relationTo: 'media', admin: { description: 'The picture in the directory list.' } },
              ],
            },
            {
              name: 'summary',
              type: 'textarea',
              maxLength: 240,
              admin: { description: 'One or two sentences for the directory list and search engines.' },
            },
            { name: 'description', type: 'richText' },
          ],
        },
        {
          label: 'Contacts & map',
          fields: [
            { name: 'address', type: 'text', admin: { description: 'Street address in Seattle. Coordinates are filled in from it automatically.' } },
            {
              type: 'row',
              fields: [
                { name: 'lat', type: 'number', label: 'Latitude', admin: { step: 0.000001 } },
                { name: 'lng', type: 'number', label: 'Longitude', admin: { step: 0.000001 } },
              ],
            },
            {
              name: 'geocodeNote',
              type: 'text',
              label: 'Map lookup',
              admin: {
                readOnly: true,
                condition: (data) => Boolean(data?.geocodeNote),
                description: 'The address could not be placed on the map automatically.',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text' },
                { name: 'email', type: 'email' },
                { name: 'website', type: 'text' },
              ],
            },
            {
              name: 'hours',
              type: 'array',
              labels: { singular: 'Opening hours', plural: 'Opening hours' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'days', type: 'text', required: true, admin: { description: 'e.g. Mon–Fri' } },
                    { name: 'time', type: 'text', required: true, admin: { description: 'e.g. 7:00 AM – 6:00 PM, or Closed' } },
                  ],
                },
              ],
            },
            {
              name: 'socials',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'facebook', type: 'text' },
                    { name: 'instagram', type: 'text' },
                    { name: 'x', type: 'text', label: 'X (Twitter)' },
                    { name: 'yelp', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Photos & files',
          fields: [
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, admin: { description: 'How many are allowed depends on the package.' } },
            { name: 'priceLists', type: 'upload', relationTo: 'documents', hasMany: true },
            { name: 'certificates', type: 'upload', relationTo: 'documents', hasMany: true },
          ],
        },
        {
          label: 'Package',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'package', type: 'relationship', relationTo: 'packages' },
                {
                  name: 'packageExpiresAt',
                  type: 'date',
                  admin: {
                    date: { pickerAppearance: 'dayOnly' },
                    description: 'After this date the business drops to the basic listing automatically.',
                  },
                },
                {
                  name: 'priority',
                  type: 'number',
                  defaultValue: 0,
                  admin: { description: 'Manual ordering inside the same package: higher shows first.' },
                },
              ],
            },
            {
              name: 'subdomain',
              type: 'text',
              unique: true,
              index: true,
              validate: (v: string | null | undefined) =>
                !v || /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(v) || 'Lowercase letters, digits and hyphens only',
              admin: { description: 'yourname → yourname.<site domain>. Luxury and Premium only.' },
            },
            {
              name: 'branding',
              type: 'group',
              admin: { description: 'Used only with a package that includes a branded page.' },
              fields: [
                { name: 'headerImage', type: 'upload', relationTo: 'media' },
                {
                  name: 'brandColor',
                  type: 'text',
                  validate: (v: string | null | undefined) => !v || /^#[0-9a-fA-F]{6}$/.test(v) || 'A hex colour like #1E6B52',
                },
              ],
            },
          ],
        },
      ],
    },
    slugField('name'),
    statusField,
    { name: 'viewsCount', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    isDemoField,
    slugHistoryField,
  ],
}
