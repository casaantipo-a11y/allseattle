import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { canWrite, publishedOrLoggedIn } from '../access/roles'
import { isDemoField, slugField, slugHistoryField, statusField, uniqueSlugField } from '../fields'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'
import { geocode } from '../lib/geocode'

const revalidate = revalidateCollection(['events'])

export const EventCategories: CollectionConfig = {
  slug: 'event-categories',
  labels: { singular: 'Event category', plural: 'Event categories' },
  admin: { useAsTitle: 'name', group: 'Events' },
  defaultSort: 'order',
  access: { read: () => true, create: canWrite('editor'), update: canWrite('editor'), delete: canWrite('editor') },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    isDemoField,
  ],
}

const datesAndPrice: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const start = data?.startAt ?? originalDoc?.startAt
  const end = data?.endAt ?? originalDoc?.endAt
  if (start && end && new Date(end) < new Date(start)) {
    throw new ValidationError({ errors: [{ path: 'endAt', message: 'Ends before it starts' }] })
  }
  return data
}

// Same rule as businesses: coordinates from the address when they're empty,
// never blocking the save.
const geocodeVenue: CollectionBeforeChangeHook = async ({ data, originalDoc, context }) => {
  if (context?.skipGeocode) return data
  const address = (data.address ?? originalDoc?.address) as string | undefined
  if (!address?.trim()) return data
  const changed = originalDoc && data.address !== undefined && data.address !== originalDoc.address
  if ((data.lat ?? originalDoc?.lat) != null && (data.lng ?? originalDoc?.lng) != null && !changed) return data
  const res = await geocode(address)
  if ('error' in res) return { ...data, geocodeNote: res.error }
  return { ...data, lat: res.lat, lng: res.lng, geocodeNote: '' }
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startAt', 'category', 'venueName', 'status'],
    group: 'Events',
  },
  defaultSort: 'startAt',
  access: {
    read: publishedOrLoggedIn,
    create: canWrite('editor'),
    update: canWrite('editor'),
    delete: canWrite('editor'),
  },
  hooks: {
    beforeValidate: [datesAndPrice],
    beforeChange: [rememberOldSlug, geocodeVenue],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'startAt',
          type: 'date',
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime', timeFormat: 'h:mm a' } },
        },
        { name: 'endAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime', timeFormat: 'h:mm a' } } },
      ],
    },
    { name: 'category', type: 'relationship', relationTo: 'event-categories', required: true },
    {
      type: 'row',
      fields: [
        { name: 'venueName', type: 'text', required: true },
        { name: 'address', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'lat', type: 'number', label: 'Latitude' },
        { name: 'lng', type: 'number', label: 'Longitude' },
      ],
    },
    { name: 'geocodeNote', type: 'text', label: 'Map lookup', admin: { readOnly: true, condition: (d) => Boolean(d?.geocodeNote) } },
    {
      type: 'row',
      fields: [
        { name: 'isFree', type: 'checkbox', defaultValue: false, label: 'Free' },
        { name: 'price', type: 'text', admin: { description: 'e.g. $35, or $20–60', condition: (d) => !d?.isFree } },
        { name: 'ticketUrl', type: 'text' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'summary', type: 'textarea', maxLength: 300, admin: { description: 'Two lines for the event card.' } },
    { name: 'description', type: 'richText' },
    uniqueSlugField('events'),
    statusField,
    isDemoField,
    slugHistoryField,
  ],
}
