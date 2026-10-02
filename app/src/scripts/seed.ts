/**
 * pnpm seed — fills an empty database with the demo content and the
 * structure the site needs (spec §10). Safe to run again: anything that
 * already exists (matched by slug, email or name) is left alone.
 *
 *  - the first admin user from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *  - news categories and the 28 articles of the stage 1 prototype, with their
 *    photos, all marked isDemo (so `pnpm purge-demo` removes them)
 *  - Site settings, Header (menu, announcements), Footer
 *  - placeholder Pages: About, Advertise, Contact, Privacy Policy, Terms of Use
 *  - phase 2 (seed-businesses.ts): the three packages, business categories,
 *    the prototype's businesses and venues, promotions, a few products
 *
 *  - phase 3 (seed-phase3.ts): car makes, and the prototype's cars, jobs,
 *    events (moved forward to upcoming dates) and the contest
 *
 *  - phase 4 (seed-phase4.ts): the ad slots and two demo banners
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { getPayload } from 'payload'

import config from '../payload.config'
import { revalidateSite } from './revalidate-site'
import { slugify } from '../fields'
import { doc, h2, p, paragraphsFrom } from './lexical'
import { seedBusinesses } from './seed-businesses'
import { seedPhase3 } from './seed-phase3'
import { seedPhase4 } from './seed-phase4'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// The stage 1 prototype sits next to the app in the same repository.
const PROTOTYPE = path.resolve(dirname, '../../..')

type MockArticle = {
  id: string
  title: string
  category: string
  author?: string
  publishedAt: string
  photo: string
  excerpt: string
  body: string
}

// A fresh object per call: Payload hands `context` to hooks by reference, and the
// R2 storage plugin leaves `skipCloudStorage` set on it after an upload — a
// shared object made every later upload in the run skip R2.
const ctx = () => ({ disableRevalidate: true })

async function run() {
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  // ---- Admin user -------------------------------------------------------
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (email && password) {
    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'users', data: { email, password, name: 'Admin', roles: ['admin'] } })
      log(`admin user created: ${email}`)
    } else log(`admin user exists: ${email}`)
  } else log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin user created')

  // ---- News categories + articles from the prototype ------------------------
  const mock = (await import(pathToFileURL(path.join(PROTOTYPE, 'js/mock-data/news.js')).href)) as {
    NEWS_ARTICLES: MockArticle[]
    TOP_NEWS_IDS: string[]
  }
  const categoryNames = [...new Set(mock.NEWS_ARTICLES.map((a) => a.category))].sort()
  const categoryIds = new Map<string, number>()
  for (const [i, name] of categoryNames.entries()) {
    const slug = slugify(name)
    const found = await payload.find({ collection: 'news-categories', where: { slug: { equals: slug } }, limit: 1 })
    const cat =
      found.docs[0] ??
      (await payload.create({
        collection: 'news-categories',
        data: { name, slug, order: i, isDemo: true },
        context: ctx(),
      }))
    categoryIds.set(name, cat.id)
  }
  log(`${categoryIds.size} news categories`)

  let created = 0
  for (const a of mock.NEWS_ARTICLES) {
    const slug = slugify(a.title)
    const exists = await payload.find({ collection: 'news', where: { slug: { equals: slug } }, limit: 1 })
    if (exists.totalDocs) continue
    const cover = await payload.create({
      collection: 'media',
      data: { alt: a.title, isDemo: true },
      filePath: path.join(PROTOTYPE, a.photo),
      context: ctx(),
    })
    // Prototype dates are Seattle wall-clock time without an offset (PDT in September).
    const publishedAt = new Date(`${a.publishedAt}-07:00`).toISOString()
    await payload.create({
      collection: 'news',
      data: {
        title: a.title,
        slug,
        excerpt: a.excerpt,
        content: paragraphsFrom(a.body),
        cover: cover.id,
        category: categoryIds.get(a.category)!,
        author: a.author,
        publishedAt,
        isTop: mock.TOP_NEWS_IDS.includes(a.id),
        status: 'published',
        isDemo: true,
      },
      context: ctx(),
    })
    created++
  }
  log(`${created} demo articles created (${mock.NEWS_ARTICLES.length - created} already there)`)

  // ---- Phase 2: packages, business categories, businesses, promotions, products
  await seedBusinesses(payload, PROTOTYPE, log)

  // ---- Phase 3: car makes, cars, jobs, events, the contest -------------------
  await seedPhase3(payload, PROTOTYPE, log)
  await seedPhase4(payload, PROTOTYPE, log)

  // ---- Globals ------------------------------------------------------------
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: 'AllSeattle',
      tagline: "If you're not on this website, you don't exist.",
      description: 'AllSeattle — the Seattle city portal for news, businesses, events, jobs and cars.',
      phone: '+1 (206) 331-8216',
      address: 'Seattle, WA',
      socials: { instagram: '', facebook: '' },
    },
    context: ctx(),
  })

  const menu = [
    { label: 'Home', url: '/', row: 'primary', icon: 'home' },
    { label: 'News', url: '/news', row: 'primary', icon: 'news' },
    { label: 'Business Directory', url: '/directory', row: 'primary', icon: 'directory' },
    { label: 'Cars', url: '/cars', row: 'primary', icon: 'cars' },
    { label: 'Shopping', url: '/shopping', row: 'secondary', icon: 'none' },
    { label: 'Jobs', url: '/jobs', row: 'secondary', icon: 'none' },
    { label: 'Leisure', url: '/leisure', row: 'secondary', icon: 'none' },
    { label: 'Events', url: '/events', row: 'secondary', icon: 'none' },
    { label: 'Weather', url: '/weather', row: 'secondary', icon: 'none' },
    { label: 'City Map', url: '/map', row: 'secondary', icon: 'none' },
  ] as const
  await payload.updateGlobal({
    slug: 'header',
    data: {
      menu: menu.map((m) => ({ ...m })),
      announcements: [
        {
          label: 'Contest',
          text: 'Police in the eyes of a child',
          url: '/contests/police-in-the-eyes-of-a-child',
          highlight: true,
        },
        { label: 'Readers', text: 'Saw something newsworthy? Share the news', url: '/share-news', highlight: false },
      ],
    },
    context: ctx(),
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      columns: [
        {
          title: 'Explore',
          links: [
            ...menu.filter((m) => m.url !== '/').map((m) => ({ label: m.label, url: m.url })),
            { label: 'Advertise', url: '/advertise' },
            { label: 'About', url: '/about' },
            { label: 'Contact', url: '/contact' },
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Use', url: '/terms' },
          ],
        },
      ],
      copyright: 'AllSeattle. All rights reserved.',
    },
    context: ctx(),
  })
  log('site settings, header and footer')

  // ---- Placeholder pages --------------------------------------------------
  const pages = [
    {
      title: 'About',
      slug: 'about',
      intro: 'AllSeattle is the city portal for Seattle: local news, businesses, events, jobs and cars in one place.',
      content: doc(p('Replace this text with the story of AllSeattle.')),
    },
    {
      title: 'Advertise',
      slug: 'advertise',
      intro: 'Put your business in front of Seattle.',
      content: doc(
        p('Banner placements on the home page, in the news and in every section of the directory are available by the week.'),
        p('Ask us about combining a package with banners — send the form below and we will prepare options.'),
      ),
    },
    {
      title: 'Contact',
      slug: 'contact',
      intro: 'Call us at +1 (206) 331-8216.',
      content: doc(p('Replace this text with contact details and office hours.')),
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      intro: 'How AllSeattle collects and uses information.',
      content: doc(
        h2('Placeholder'),
        p('This is a placeholder. Replace it with a privacy policy reviewed by a lawyer before launch.'),
        h2('Cookies and analytics'),
        p('Google Analytics loads only after you accept cookies in the banner at the bottom of the page.'),
      ),
    },
    {
      title: 'Terms of Use',
      slug: 'terms',
      intro: 'The rules for using AllSeattle.',
      content: doc(p('This is a placeholder. Replace it with terms of use reviewed by a lawyer before launch.')),
    },
  ]
  let pagesCreated = 0
  for (const page of pages) {
    const exists = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1 })
    if (exists.totalDocs) continue
    await payload.create({ collection: 'pages', data: { ...page, status: 'published' }, context: ctx() })
    pagesCreated++
  }
  log(`${pagesCreated} pages created`)
  await revalidateSite(log)
  log('done')
}

await run()
process.exit(0)
