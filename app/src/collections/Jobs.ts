import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { canWrite, publishedOrLoggedIn } from '../access/roles'
import { isDemoField, slugField, slugHistoryField, statusField, uniqueSlugField } from '../fields'
import { withinListingLimit } from '../hooks/listingLimit'
import { rememberOldSlug, revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection(['jobs'])

// Job categories — their own small collection so the owner can add one
// without a developer.
export const JobCategories: CollectionConfig = {
  slug: 'job-categories',
  labels: { singular: 'Job category', plural: 'Job categories' },
  admin: { useAsTitle: 'name', group: 'Jobs' },
  defaultSort: 'name',
  access: { read: () => true, create: canWrite('sales'), update: canWrite('sales'), delete: canWrite('sales') },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [{ name: 'name', type: 'text', required: true }, slugField('name'), isDemoField],
}

const companyOrBusiness: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const business = data?.business ?? originalDoc?.business
  const company = data?.companyName ?? originalDoc?.companyName
  if (!business && !company?.trim?.()) {
    throw new ValidationError({ errors: [{ path: 'companyName', message: 'Choose a business or type the company name' }] })
  }
  const min = data?.salaryMin ?? originalDoc?.salaryMin
  const max = data?.salaryMax ?? originalDoc?.salaryMax
  if (min != null && max != null && max < min) {
    throw new ValidationError({ errors: [{ path: 'salaryMax', message: 'Maximum is below the minimum' }] })
  }
  return data
}

// Fields from the spec plus the prototype's work.ua-style extras (work mode,
// who it suits, perks, languages, urgent/featured), which the job board's
// filters and check-lines are built from.
export const Jobs: CollectionConfig = {
  slug: 'jobs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'business', 'companyName', 'category', 'status', 'expiresAt'],
    group: 'Jobs',
    listSearchableFields: ['title', 'companyName'],
  },
  defaultSort: '-createdAt',
  access: {
    read: publishedOrLoggedIn,
    create: canWrite('sales'),
    update: canWrite('sales'),
    delete: canWrite('sales'),
  },
  hooks: {
    beforeValidate: [companyOrBusiness],
    beforeChange: [rememberOldSlug, withinListingLimit('business')],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'business', type: 'relationship', relationTo: 'businesses', admin: { description: 'A business from the directory…' } },
        { name: 'companyName', type: 'text', admin: { description: '…or just the company name.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'relationship', relationTo: 'job-categories', required: true },
        {
          name: 'employmentType',
          type: 'select',
          required: true,
          options: [
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Temporary', value: 'temporary' },
          ],
        },
        {
          name: 'workMode',
          type: 'select',
          defaultValue: 'on-site',
          options: [
            { label: 'On-site', value: 'on-site' },
            { label: 'Hybrid', value: 'hybrid' },
            { label: 'Remote', value: 'remote' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'salaryMin', type: 'number', min: 0 },
        { name: 'salaryMax', type: 'number', min: 0 },
        {
          name: 'salaryPeriod',
          type: 'select',
          defaultValue: 'hour',
          options: [
            { label: 'per hour', value: 'hour' },
            { label: 'per year', value: 'year' },
          ],
        },
      ],
    },
    { name: 'location', type: 'text', admin: { description: 'Neighbourhood or address, e.g. Capitol Hill' } },
    { name: 'description', type: 'richText' },
    { name: 'summary', type: 'textarea', maxLength: 300, admin: { description: 'Two lines for the job board list.' } },
    { name: 'howToApply', type: 'textarea', required: true, admin: { description: 'Email, phone or link — shown on the job page.' } },
    {
      type: 'collapsible',
      label: 'Extras for the job board filters',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'openTo',
          type: 'select',
          hasMany: true,
          label: 'Suits',
          options: [
            { label: 'No experience needed', value: 'noExperience' },
            { label: 'Students welcome', value: 'students' },
            { label: 'Accessible workplace', value: 'accessible' },
            { label: '50+ welcome', value: 'fiftyPlus' },
          ],
        },
        { name: 'perks', type: 'text', hasMany: true },
        { name: 'languages', type: 'text', hasMany: true, label: 'Languages a plus' },
        {
          type: 'row',
          fields: [
            { name: 'isUrgent', type: 'checkbox', label: 'Urgent' },
            { name: 'isFeatured', type: 'checkbox', label: 'Featured' },
          ],
        },
      ],
    },
    uniqueSlugField('jobs'),
    statusField,
    { name: 'expiresAt', type: 'date', index: true, admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: 'Added by the team', value: 'admin' },
        { label: 'Submitted by a user', value: 'user' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    isDemoField,
    slugHistoryField,
  ],
}
