import { searchPlugin } from '@payloadcms/plugin-search'
import type { BeforeSync } from '@payloadcms/plugin-search/types'

import { slugify } from './fields'

// Global search (spec §6) through @payloadcms/plugin-search: every document of
// the five collections below gets a row in the `search` collection, kept in
// sync on save. Each row carries what the results page needs — the public URL,
// a type label, a short text — so a search is one query, not five.
// Drafts stay in the index with isPublished=false and are filtered out at
// query time, so un-publishing removes a document from results at once.

export const SEARCH_KINDS: Record<string, string> = {
  news: 'News',
  businesses: 'Businesses',
  'car-listings': 'Cars',
  jobs: 'Jobs',
  events: 'Events',
}

const idOf = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number | undefined))

const beforeSync: BeforeSync = async ({ collectionSlug, originalDoc, searchDoc, payload, req }) => {
  const doc = originalDoc
  let url = ''
  let title = searchDoc.title || doc.title || doc.name || ''
  let excerpt = ''
  switch (collectionSlug) {
    case 'news': {
      const catId = idOf(doc.category)
      const cat = catId
        ? await payload.findByID({ collection: 'news-categories', id: catId, depth: 0, req }).catch(() => null)
        : null
      url = `/news/${cat?.slug ?? 'news'}/${doc.slug}`
      excerpt = doc.excerpt ?? ''
      break
    }
    case 'businesses':
      title = doc.name
      url = `/biz/${doc.slug}`
      excerpt = doc.summary ?? doc.address ?? ''
      break
    case 'car-listings':
      url = `/cars/${doc.slug}`
      excerpt = [doc.price ? `$${Number(doc.price).toLocaleString('en-US')}` : '', doc.mileage ? `${Number(doc.mileage).toLocaleString('en-US')} mi` : '', doc.transmission]
        .filter(Boolean)
        .join(' · ')
      break
    case 'jobs':
      url = `/jobs/${doc.slug}`
      excerpt = [doc.companyName, doc.location, doc.summary].filter(Boolean).join(' · ')
      break
    case 'events':
      url = `/events/${doc.slug}`
      excerpt = [doc.venueName, doc.summary].filter(Boolean).join(' · ')
      break
  }
  return {
    ...searchDoc,
    title,
    url,
    excerpt: String(excerpt).slice(0, 300),
    kind: collectionSlug,
    keywords: slugify(`${title} ${excerpt}`).replace(/-/g, ' '),
    isPublished: doc.status === 'published' && !!doc.slug,
  }
}

export const search = searchPlugin({
  collections: Object.keys(SEARCH_KINDS),
  defaultPriorities: { businesses: 40, news: 30, events: 20, jobs: 20, 'car-listings': 10 },
  beforeSync,
  searchOverrides: {
    admin: { group: 'Settings', defaultColumns: ['title', 'kind', 'isPublished'] },
    access: { read: () => true },
    fields: ({ defaultFields }) => [
      ...defaultFields,
      { name: 'url', type: 'text', admin: { readOnly: true } },
      { name: 'excerpt', type: 'textarea', admin: { readOnly: true } },
      { name: 'kind', type: 'text', index: true, admin: { readOnly: true } },
      { name: 'keywords', type: 'text', admin: { readOnly: true, hidden: true } },
      { name: 'isPublished', type: 'checkbox', index: true, admin: { readOnly: true } },
    ],
  },
})
