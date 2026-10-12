import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { Payload } from 'payload'

import { slugify } from '../fields'
import { BUSINESS_SUBCATEGORY, DIRECTORY_TREE, OLD_DIRECTORY_SLUGS, categorySlug } from '../lib/directory-tree'
import { doc, p } from './lexical'

// Phase 2 seed: packages (structure, not demo), business categories and the
// prototype's businesses, venues, deals and a few products (all isDemo).

type MockBiz = {
  id: string
  name: string
  category: string
  description: string
  phone: string
  address: string
  views: number
  package: 'Standard' | 'Lux' | 'Premium'
  photo: string
}
type MockVenue = { id: string; name: string; kind: string; neighborhood: string; price: string; hours: string; photo: string; description: string }
type MockDeal = { id: string; businessId: string; title: string; discount: string; category: string; validUntil: string; terms: string }

// A fresh object per call: Payload hands `context` to hooks by reference, and the
// R2 storage plugin leaves `skipCloudStorage` set on it after an upload — a
// shared object made every later upload in the run skip R2.
const ctx = () => ({ disableRevalidate: true, skipGeocode: true })

// Neighbourhood centres (the prototype's City Map data plus the ones its
// addresses mention). Demo businesses are placed around them — no geocoding
// requests for made-up addresses.
const HOODS: Record<string, [number, number]> = {
  Ballard: [47.6687, -122.3847],
  'Green Lake': [47.6798, -122.3285],
  Fremont: [47.651, -122.35],
  Wallingford: [47.6615, -122.3348],
  'Queen Anne': [47.637, -122.3571],
  'Capitol Hill': [47.6253, -122.3222],
  Downtown: [47.609, -122.338],
  'Pioneer Square': [47.6015, -122.3343],
  Georgetown: [47.547, -122.32],
  'Columbia City': [47.5594, -122.2866],
  Belltown: [47.6145, -122.348],
  Northgate: [47.7066, -122.3255],
  SoDo: [47.5801, -122.335],
  'South Lake Union': [47.6256, -122.3344],
  'West Seattle': [47.5667, -122.3868],
  Westlake: [47.636, -122.342],
}

const jitter = (i: number): [number, number] => [((i * 37) % 11 - 5) * 0.0009, ((i * 53) % 13 - 6) * 0.0011]
const coordsFor = (hood: string, i: number) => {
  const base = HOODS[hood] ?? HOODS.Downtown
  const [dy, dx] = jitter(i)
  return { lat: +(base[0] + dy).toFixed(6), lng: +(base[1] + dx).toFixed(6) }
}

const PACKAGES = [
  {
    name: 'Standard',
    order: 1,
    maxCategories: 2,
    maxPhotos: 10,
    maxListings: 5,
    maxProducts: 0,
    subdomain: false,
    priorityPlacement: false,
    categoryBannerFirstMonth: false,
    brandedPage: false,
    features: ['Directory listing and business page', 'City map placement', 'Promotions and price lists'],
  },
  {
    name: 'Luxury',
    order: 2,
    maxCategories: 10,
    maxPhotos: 100,
    maxListings: 50,
    maxProducts: 100,
    subdomain: true,
    priorityPlacement: true,
    categoryBannerFirstMonth: false,
    brandedPage: false,
    features: ['Everything in Standard', 'Products, jobs and promotions tabs', 'Priority in the directory', 'Own subdomain'],
  },
  {
    name: 'Premium',
    order: 3,
    maxCategories: 15,
    maxPhotos: 1000,
    maxListings: 1000,
    maxProducts: 1000,
    subdomain: true,
    priorityPlacement: true,
    categoryBannerFirstMonth: true,
    brandedPage: true,
    features: ['Everything in Luxury', 'Branded page, no other ads on it', 'Banner in your category for the first month'],
  },
]

// Shopping's own categories (the directory's are lib/directory-tree.ts).
const SHOPPING: Record<string, string> = {
  'Elliott Bay Boutique': 'Clothing',
  'Pike & Pine Bookshop': 'Books & Media',
  'Blossom & Bay Florist': 'Home & Garden',
  'Duwamish Hardware & Supply': 'Home & Garden',
  'Fremont Sourdough Bakery': 'Food & Drink',
  'Scoop City Creamery': 'Food & Drink',
  'Emerald City Coffee Roasters': 'Food & Drink',
}

const BRAND: Record<string, { color: string; header: string; subdomain?: string }> = {
  'Emerald City Coffee Roasters': { color: '#1E6B52', header: 'img/hero/pike-place.webp', subdomain: 'emeraldcoffee' },
  'Cascade Fitness Studio': { color: '#2B5C8A', header: 'img/hero/mount-rainier.webp' },
  'Skyline Brewing Taproom': { color: '#9A4B16', header: 'img/hero/waterfront.webp' },
  'Cascade Tire & Wheel': { color: '#3A3F47', header: 'img/hero/downtown.webp' },
  'Rainier Car Rental': { color: '#7A1F2B', header: 'img/hero/space-needle.webp' },
}

const PRODUCTS: Record<string, [string, number | null, string][]> = {
  'Emerald City Coffee Roasters': [
    ['Ethiopia Guji, 12 oz', 19, 'Washed, light roast. Peach, jasmine, black tea.'],
    ['House espresso blend, 2 lb', 34, 'Chocolate and toffee; the blend behind the bar.'],
    ['Cupping class for two', 60, 'Saturday mornings, ninety minutes, beans to take home.'],
  ],
  'Elliott Bay Boutique': [
    ['Waxed canvas rain jacket', 185, 'Made in Portland. Sizes XS–XL.'],
    ['Merino beanie', 38, 'Four colours, knitted in Tacoma.'],
  ],
  'Scoop City Creamery': [
    ['Pint to go', 11, 'Any flavour from the case.'],
    ['Ice cream cake', null, 'Order 48 hours ahead; price depends on size.'],
  ],
  'Skyline Brewing Taproom': [
    ['Crowler, 32 oz', 12, 'Any beer on tap, sealed to go.'],
    ['Taproom gift card', 50, 'Good for food, beer and merch.'],
  ],
}

const HOURS: Record<string, { days: string; time: string }[]> = {
  default: [
    { days: 'Mon–Fri', time: '9:00 AM – 6:00 PM' },
    { days: 'Sat', time: '10:00 AM – 4:00 PM' },
    { days: 'Sun', time: 'Closed' },
  ],
  food: [
    { days: 'Mon–Fri', time: '7:00 AM – 7:00 PM' },
    { days: 'Sat–Sun', time: '8:00 AM – 5:00 PM' },
  ],
}

export async function seedBusinesses(payload: Payload, prototypeDir: string, log: (m: string) => void) {
  const load = async <T>(file: string) => (await import(pathToFileURL(path.join(prototypeDir, file)).href)) as T

  // ---- Packages (structure — kept by purge-demo) --------------------------
  const pkgIds: Record<string, number> = {}
  for (const pk of PACKAGES) {
    const found = await payload.find({ collection: 'packages', where: { name: { equals: pk.name } }, limit: 1 })
    const docu =
      found.docs[0] ??
      (await payload.create({
        collection: 'packages',
        data: {
          ...pk,
          priceMonthly: 0,
          priceYearly: 0,
          currency: 'USD',
          mapPlacement: true,
          promotions: true,
          priceLists: true,
          features: pk.features.map((text) => ({ text })),
        },
        context: ctx(),
      }))
    pkgIds[pk.name] = docu.id
  }
  log('3 packages (Standard, Luxury, Premium; prices 0 = "Contact us")')

  // ---- Categories -----------------------------------------------------------
  const catIds = new Map<string, number>() // key: `${section}:${name}`
  async function category(section: 'directory' | 'shopping' | 'leisure', name: string, order: number, parent?: number) {
    const key = `${section}:${name}`
    if (catIds.has(key)) return catIds.get(key)!
    const slug = slugify(name)
    const found = await payload.find({
      collection: 'business-categories',
      where: { and: [{ slug: { equals: slug } }, { section: { equals: section } }] },
      limit: 1,
    })
    const docu =
      found.docs[0] ??
      (await payload.create({
        collection: 'business-categories',
        data: { name, slug, section, order, parent, isDemo: true },
        context: ctx(),
      }))
    catIds.set(key, docu.id)
    return docu.id
  }

  const { BUSINESSES } = await load<{ BUSINESSES: MockBiz[] }>('js/mock-data/businesses.js')
  const { VENUES } = await load<{ VENUES: MockVenue[] }>('js/mock-data/entertainment.js')
  const { SHOPPING_DEALS } = await load<{ SHOPPING_DEALS: MockDeal[] }>('js/mock-data/shopping.js')

  // The directory's 13 sections and their sub-categories (client, 12.10.2026;
  // lib/directory-tree.ts). A row with the same slug from the old list (Car Wash,
  // Towing, Restaurants, Shopping & Retail…) is reused and re-parented, so its
  // businesses and URL stay.
  const dirCatIds = new Set<number>()
  async function dirCategory(name: string, order: number, parentName?: string, parentId?: number) {
    const slug = categorySlug(name, parentName)
    const found = (
      await payload.find({
        collection: 'business-categories',
        where: { and: [{ slug: { equals: slug } }, { section: { equals: 'directory' } }] },
        limit: 1,
        depth: 0,
      })
    ).docs[0]
    const data = { name, order, parent: parentId ?? null }
    let id: number
    if (!found) {
      id = (await payload.create({ collection: 'business-categories', data: { ...data, slug, section: 'directory', isDemo: true }, context: ctx() })).id
    } else {
      id = found.id
      const parentNow = typeof found.parent === 'object' ? found.parent?.id ?? null : found.parent ?? null
      if (found.name !== name || found.order !== order || parentNow !== data.parent) {
        await payload.update({ collection: 'business-categories', id, data, context: ctx() })
      }
    }
    catIds.set(`directory:${parentName ? `${parentName}/` : ''}${name}`, id)
    dirCatIds.add(id)
    return id
  }
  for (const [i, [section, children]] of DIRECTORY_TREE.entries()) {
    const parentId = await dirCategory(section, i)
    for (const [j, child] of children.entries()) await dirCategory(child, j, section, parentId)
  }
  for (const [i, name] of [...new Set(Object.values(SHOPPING))].sort().entries()) await category('shopping', name, i)
  for (const [i, kind] of [...new Set(VENUES.map((v) => v.kind))].sort().entries()) await category('leisure', kind, i)
  log(`${catIds.size} business categories`)

  // ---- Media, uploaded once per file -----------------------------------------
  const mediaIds = new Map<string, number>()
  async function media(file: string, alt: string) {
    if (mediaIds.has(file)) return mediaIds.get(file)!
    // The news seed may already have uploaded the same picture.
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: path.basename(file) } }, limit: 1 })
    if (existing.docs[0]) {
      mediaIds.set(file, existing.docs[0].id)
      return existing.docs[0].id
    }
    const m = await payload.create({ collection: 'media', data: { alt, isDemo: true }, filePath: path.join(prototypeDir, file), context: ctx() })
    mediaIds.set(file, m.id)
    return m.id
  }
  // Extra gallery photos for Luxury/Premium demo pages: Seattle scenery, not
  // other businesses' shops (a garage in a restaurant's gallery looks broken).
  const photoPool = ['downtown', 'waterfront', 'pike-place', 'space-needle', 'mount-rainier'].map((n) => `img/hero/${n}.webp`)

  // ---- Businesses -----------------------------------------------------------
  const bizIds = new Map<string, number>() // mock id → db id
  const nextYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
  let created = 0

  const upsertBusiness = async (mockId: string, data: Record<string, unknown>) => {
    const slug = slugify(data.name as string)
    const found = await payload.find({ collection: 'businesses', where: { slug: { equals: slug } }, limit: 1 })
    if (found.docs[0]) {
      bizIds.set(mockId, found.docs[0].id)
      return
    }
    const docu = await payload.create({ collection: 'businesses', data: { ...data, slug } as never, context: ctx() })
    bizIds.set(mockId, docu.id)
    created++
  }

  for (const [i, b] of BUSINESSES.entries()) {
    const pkgName = b.package === 'Lux' ? 'Luxury' : b.package
    const hood = b.address.split(', ').pop() ?? 'Downtown'
    const sub = BUSINESS_SUBCATEGORY[b.name]
    const categories = sub ? [catIds.get(`directory:${sub[0]}/${sub[1]}`)!] : []
    if (SHOPPING[b.name]) categories.push(catIds.get(`shopping:${SHOPPING[b.name]}`)!)
    const cover = await media(b.photo, b.name)
    const extra = pkgName === 'Standard' ? [] : [...photoPool.slice(i % 5), ...photoPool.slice(0, i % 5)].slice(0, pkgName === 'Premium' ? 4 : 2)
    const gallery = [cover, ...(await Promise.all(extra.map((f) => media(f, `${b.name} — photo`))))]
    const brand = BRAND[b.name]
    const isFood = /coffee|bakery|creamery|restaurant|kitchen|brewing/i.test(b.name + b.category)
    await upsertBusiness(b.id, {
      name: b.name,
      status: 'published',
      isDemo: true,
      categories,
      cover,
      summary: b.description,
      description: doc(
        p(b.description),
        p(`Find us at ${b.address}. Call ${b.phone} or stop by — we're happy to help.`),
      ),
      address: b.address,
      ...coordsFor(hood, i),
      phone: b.phone,
      email: `hello@${slugify(b.name).replace(/-/g, '')}.example`,
      website: `https://${slugify(b.name).replace(/-/g, '')}.example`,
      hours: isFood ? HOURS.food : HOURS.default,
      socials: pkgName === 'Standard' ? {} : { instagram: `https://instagram.com/${slugify(b.name).replace(/-/g, '')}` },
      gallery,
      package: pkgIds[pkgName],
      packageExpiresAt: nextYear,
      priority: 0,
      viewsCount: b.views,
      ...(brand && pkgName === 'Premium'
        ? {
            branding: { brandColor: brand.color, headerImage: await media(brand.header, `${b.name} — header`) },
            ...(brand.subdomain ? { subdomain: brand.subdomain } : {}),
          }
        : {}),
    })
  }

  // ---- Existing businesses → the new directory tree (12.10.2026) -----------------
  // Demo businesses by name; any other business by its old category's slug. A
  // business keeps its Shopping / Leisure categories. Then the old directory
  // categories nobody uses any more are removed; one still in use is kept and
  // reported, never deleted under a business.
  {
    const allCats = (await payload.find({ collection: 'business-categories', limit: 1000, depth: 0, pagination: false })).docs
    const bySlug = new Map(allCats.map((c) => [c.slug, c]))
    const oldDir = allCats.filter((c) => c.section === 'directory' && !dirCatIds.has(c.id))
    const oldIds = new Set(oldDir.map((c) => c.id))
    const all = (await payload.find({ collection: 'businesses', limit: 5000, depth: 0, pagination: false })).docs
    let moved = 0
    for (const biz of all) {
      const ids = (biz.categories ?? []).map((c) => (typeof c === 'object' ? c.id : c))
      const sub = BUSINESS_SUBCATEGORY[biz.name]
      let next = ids
      if (sub) {
        const target = catIds.get(`directory:${sub[0]}/${sub[1]}`)!
        next = [target, ...ids.filter((id) => !dirCatIds.has(id) && !oldIds.has(id))]
      } else {
        next = ids.map((id) => {
          if (!oldIds.has(id)) return id
          const slug = OLD_DIRECTORY_SLUGS[oldDir.find((c) => c.id === id)!.slug ?? '']
          return (slug && bySlug.get(slug)?.id) || id
        })
      }
      next = [...new Set(next)]
      if (next.join() !== ids.join()) {
        await payload.update({ collection: 'businesses', id: biz.id, data: { categories: next }, context: ctx() })
        moved++
      }
    }
    const stillUsed = new Set(
      (await payload.find({ collection: 'businesses', limit: 5000, depth: 0, pagination: false })).docs.flatMap((b) =>
        (b.categories ?? []).map((c) => (typeof c === 'object' ? c.id : c)),
      ),
    )
    // Children before parents, so no category is left pointing at a deleted parent.
    const removable = oldDir.filter((c) => !stillUsed.has(c.id)).sort((a, b) => Number(Boolean(b.parent)) - Number(Boolean(a.parent)))
    for (const c of removable) await payload.delete({ collection: 'business-categories', id: c.id, context: ctx() })
    const kept = oldDir.filter((c) => stillUsed.has(c.id)).map((c) => c.name)
    log(`directory tree: ${dirCatIds.size} categories, ${moved} businesses moved, ${removable.length} old categories removed${kept.length ? `, kept (still in use): ${kept.join(', ')}` : ''}`)
  }

  for (const [i, v] of VENUES.entries()) {
    const pkgName = i % 4 === 0 ? 'Luxury' : 'Standard'
    const cover = await media(v.photo, v.name)
    await upsertBusiness(v.id, {
      name: v.name,
      status: 'published',
      isDemo: true,
      categories: [catIds.get(`leisure:${v.kind}`)!],
      cover,
      summary: v.description,
      description: doc(p(v.description), p(`Price range: ${v.price}.`)),
      address: `${v.neighborhood}, Seattle, WA`,
      ...coordsFor(v.neighborhood, i + 40),
      phone: `(206) 555-02${String(10 + i).padStart(2, '0')}`,
      hours: [{ days: 'Opening hours', time: v.hours }],
      gallery: [cover],
      package: pkgIds[pkgName],
      packageExpiresAt: nextYear,
      priority: 0,
      viewsCount: 300 + i * 97,
    })
  }
  log(`${created} demo businesses created (${BUSINESSES.length + VENUES.length - created} already there)`)

  // ---- Promotions from the prototype's Shopping deals -------------------------
  let promos = 0
  for (const d of SHOPPING_DEALS) {
    const business = bizIds.get(d.businessId)
    if (!business) continue
    const title = `${d.discount}: ${d.title}`
    const exists = await payload.find({
      collection: 'promotions',
      where: { and: [{ business: { equals: business } }, { title: { equals: title } }] },
      limit: 1,
    })
    if (exists.totalDocs) continue
    const until = new Date(`${d.validUntil}, 2026 23:59:00 GMT-0700`)
    await payload.create({
      collection: 'promotions',
      data: {
        business,
        title,
        description: d.terms,
        validFrom: new Date().toISOString(),
        validUntil: until.toISOString(),
        isDemo: true,
      },
      context: ctx(),
    })
    promos++
  }
  log(`${promos} demo promotions`)

  // ---- Products for a few Luxury/Premium businesses ---------------------------
  let products = 0
  for (const [bizName, items] of Object.entries(PRODUCTS)) {
    const mock = BUSINESSES.find((b) => b.name === bizName)
    const business = mock ? bizIds.get(mock.id) : undefined
    if (!business) continue
    for (const [name, price, description] of items) {
      const exists = await payload.find({
        collection: 'products',
        where: { and: [{ business: { equals: business } }, { name: { equals: name } }] },
        limit: 1,
      })
      if (exists.totalDocs) continue
      await payload.create({
        collection: 'products',
        data: { business, name, price: price ?? undefined, description, image: mediaIds.get(mock!.photo), isDemo: true },
        context: ctx(),
      })
      products++
    }
  }
  log(`${products} demo products`)
}
