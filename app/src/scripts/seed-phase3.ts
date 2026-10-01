import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { Payload } from 'payload'

import { slugify } from '../fields'
import { doc, p } from './lexical'

// Phase 3 seed: car makes (structure, kept by purge-demo), and from the
// prototype's mock data — car listings, jobs, events, the contest — all isDemo.

const ctx = { disableRevalidate: true, skipGeocode: true }

// Popular US makes and their main models (spec §4, CarMakes).
const MAKES: Record<string, string[]> = {
  Acura: ['Integra', 'MDX', 'RDX', 'TLX'],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  BMW: ['3 Series', '5 Series', 'X1', 'X3', 'X5', 'i4'],
  Buick: ['Enclave', 'Encore', 'Envision'],
  Cadillac: ['Escalade', 'XT4', 'XT5', 'Lyriq'],
  Chevrolet: ['Bolt EV', 'Camaro', 'Colorado', 'Equinox', 'Malibu', 'Silverado 1500', 'Tahoe', 'Traverse', 'Trax'],
  Chrysler: ['Pacifica', '300'],
  Dodge: ['Charger', 'Durango', 'Hornet'],
  Ford: ['Bronco', 'Escape', 'Explorer', 'F-150', 'Maverick', 'Mustang', 'Mustang Mach-E', 'Ranger'],
  GMC: ['Acadia', 'Canyon', 'Sierra 1500', 'Terrain', 'Yukon'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Odyssey', 'Pilot', 'Ridgeline'],
  Hyundai: ['Elantra', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Tucson'],
  Jeep: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Wrangler'],
  Kia: ['EV6', 'Forte', 'Seltos', 'Sorento', 'Sportage', 'Telluride'],
  Lexus: ['ES', 'IS', 'NX', 'RX', 'GX'],
  Mazda: ['3', 'CX-30', 'CX-5', 'CX-50', 'CX-90', 'MX-5 Miata'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'Sprinter'],
  Nissan: ['Altima', 'Frontier', 'Leaf', 'Pathfinder', 'Rogue', 'Sentra'],
  Ram: ['1500', '2500', 'ProMaster'],
  Subaru: ['Ascent', 'Crosstrek', 'Forester', 'Impreza', 'Outback', 'WRX'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  Toyota: ['4Runner', 'Camry', 'Corolla', 'Highlander', 'Prius', 'RAV4', 'Sienna', 'Tacoma', 'Tundra'],
  Volkswagen: ['Atlas', 'Golf', 'ID.4', 'Jetta', 'Tiguan'],
  Volvo: ['S60', 'XC40', 'XC60', 'XC90'],
}

const HOODS: Record<string, [number, number]> = {
  Fremont: [47.651, -122.35],
  Ballard: [47.6687, -122.3847],
  SoDo: [47.5801, -122.335],
  Downtown: [47.609, -122.338],
  'Capitol Hill': [47.6253, -122.3222],
  Georgetown: [47.547, -122.32],
  'Green Lake': [47.6798, -122.3285],
  'Columbia City': [47.5594, -122.2866],
  'Chinatown-International District': [47.5987, -122.3244],
}

type MockCar = {
  id: string
  make: string
  model: string
  year: number
  bodyType: string
  price: number
  mileage: number
  engine: string
  transmission: string
  color: string
  fuel: string
  description: string
  seller: { name: string; phone: string }
  photos: string[]
}
type MockJob = {
  id: string
  title: string
  company: string
  category: string
  type: string
  salaryMin: number
  salaryMax: number
  salaryUnit: 'hr' | 'yr'
  neighborhood: string
  workMode: string
  openTo: string[]
  perks: string[]
  languages: string[]
  contact: string[]
  urgent: boolean
  featured: boolean
  description: string
}
type MockEvent = {
  id: string
  title: string
  category: string
  venue: string
  neighborhood: string
  startsAt: string
  price: string
  photo: string
  description: string
}
type MockEntry = { id: string; title: string; author: string; photo: string }

export async function seedPhase3(payload: Payload, prototypeDir: string, log: (m: string) => void) {
  const load = async <T>(file: string) => (await import(pathToFileURL(path.join(prototypeDir, file)).href)) as T

  const mediaIds = new Map<string, number>()
  async function media(file: string, alt: string) {
    const rel = file.replace(/^(\.\.\/)+/, '')
    if (mediaIds.has(rel)) return mediaIds.get(rel)!
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: path.basename(rel) } }, limit: 1 })
    const id =
      existing.docs[0]?.id ??
      (await payload.create({ collection: 'media', data: { alt, isDemo: true }, filePath: path.join(prototypeDir, rel), context: ctx })).id
    mediaIds.set(rel, id)
    return id
  }
  const findOne = async (collection: 'car-makes' | 'job-categories' | 'event-categories' | 'businesses', field: string, value: string) =>
    (await payload.find({ collection, where: { [field]: { equals: value } }, limit: 1, depth: 0 })).docs[0]

  // ---- Car makes (structure) ------------------------------------------------
  const makeIds = new Map<string, number>()
  for (const [name, models] of Object.entries(MAKES)) {
    const found = await findOne('car-makes', 'name', name)
    makeIds.set(name, found?.id ?? (await payload.create({ collection: 'car-makes', data: { name, models }, context: ctx })).id)
  }
  log(`${makeIds.size} car makes`)

  // ---- Car listings -----------------------------------------------------------
  const { CAR_LISTINGS } = await load<{ CAR_LISTINGS: MockCar[] }>('js/mock-data/cars.js')
  let cars = 0
  for (const [i, c] of CAR_LISTINGS.entries()) {
    const title = `${c.year} ${c.make} ${c.model}`
    const exists = await payload.find({ collection: 'car-listings', where: { title: { equals: title } }, limit: 1 })
    if (exists.totalDocs) continue
    // One at a time: parallel uploads race on Payload's unique-filename check
    // (fails against a remote database / R2, where each upload is slower).
    const photos: number[] = []
    for (const [n, f] of c.photos.entries()) photos.push(await media(f, `${title} — photo ${n + 1}`))
    await payload.create({
      collection: 'car-listings',
      data: {
        title,
        make: makeIds.get(c.make)!,
        model: c.model,
        year: c.year,
        price: c.price,
        mileage: c.mileage,
        engine: c.engine,
        transmission: c.transmission as 'Automatic',
        fuelType: c.fuel as 'Gasoline',
        bodyType: c.bodyType as 'sedan',
        exteriorColor: c.color,
        description: c.description,
        photos,
        sellerName: c.seller.name,
        sellerPhone: c.seller.phone,
        isFeatured: i === 0,
        expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
        status: 'published',
        source: 'admin',
        isDemo: true,
      },
      context: ctx,
    })
    cars++
  }
  log(`${cars} demo car listings`)

  // ---- Jobs -------------------------------------------------------------------
  const { JOB_LISTINGS } = await load<{ JOB_LISTINGS: MockJob[] }>('js/mock-data/jobs.js')
  const jobCat = new Map<string, number>()
  for (const name of [...new Set(JOB_LISTINGS.map((j) => j.category))].sort()) {
    const found = await findOne('job-categories', 'name', name)
    jobCat.set(name, found?.id ?? (await payload.create({ collection: 'job-categories', data: { name, isDemo: true }, context: ctx })).id)
  }
  let jobs = 0
  for (const [i, j] of JOB_LISTINGS.entries()) {
    const exists = await payload.find({
      collection: 'jobs',
      where: { and: [{ title: { equals: j.title } }, { companyName: { equals: j.company } }] },
      limit: 1,
    })
    if (exists.totalDocs) continue
    const biz = await findOne('businesses', 'name', j.company)
    const contactLine = j.contact.includes('Email')
      ? `Email your resume to jobs@${slugify(j.company).replace(/-/g, '')}.example`
      : `Call (206) 555-01${String(40 + i).padStart(2, '0')} and ask for the manager.`
    await payload.create({
      collection: 'jobs',
      data: {
        title: j.title,
        business: biz?.id,
        companyName: j.company,
        category: jobCat.get(j.category)!,
        employmentType: j.type.toLowerCase() as 'full-time',
        workMode: j.workMode.toLowerCase() as 'on-site',
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryPeriod: j.salaryUnit === 'yr' ? 'year' : 'hour',
        location: j.neighborhood,
        summary: j.description,
        description: doc(p(j.description)),
        howToApply: contactLine,
        openTo: j.openTo as ('noExperience' | 'students' | 'accessible' | 'fiftyPlus')[],
        perks: j.perks,
        languages: j.languages,
        isUrgent: j.urgent,
        isFeatured: j.featured,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'published',
        source: 'admin',
        isDemo: true,
      },
      context: ctx,
    })
    jobs++
  }
  log(`${jobs} demo jobs`)

  // ---- Events (dates moved forward so they're upcoming) -----------------------
  const { EVENTS } = await load<{ EVENTS: MockEvent[] }>('js/mock-data/events.js')
  const eventCat = new Map<string, number>()
  for (const [i, name] of [...new Set(EVENTS.map((e) => e.category))].sort().entries()) {
    const found = await findOne('event-categories', 'name', name)
    eventCat.set(name, found?.id ?? (await payload.create({ collection: 'event-categories', data: { name, order: i, isDemo: true }, context: ctx })).id)
  }
  // The prototype's dates are in the past now; keep their spacing but start tomorrow.
  const earliest = Math.min(...EVENTS.map((e) => new Date(`${e.startsAt}-07:00`).getTime()))
  const tomorrow = new Date()
  tomorrow.setUTCHours(0, 0, 0, 0)
  const shiftMs = Math.max(0, Math.ceil((tomorrow.getTime() + 86400000 - earliest) / 86400000)) * 86400000
  let events = 0
  for (const [i, e] of EVENTS.entries()) {
    const exists = await payload.find({ collection: 'events', where: { title: { equals: e.title } }, limit: 1 })
    if (exists.totalDocs) continue
    const start = new Date(new Date(`${e.startsAt}-07:00`).getTime() + shiftMs)
    const [lat, lng] = HOODS[e.neighborhood] ?? HOODS.Downtown
    await payload.create({
      collection: 'events',
      data: {
        title: e.title,
        category: eventCat.get(e.category)!,
        venueName: e.venue,
        address: `${e.venue}, ${e.neighborhood}, Seattle`,
        lat: +(lat + ((i % 5) - 2) * 0.0012).toFixed(6),
        lng: +(lng + ((i % 3) - 1) * 0.0015).toFixed(6),
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + 3 * 3600000).toISOString(),
        isFree: /free/i.test(e.price),
        price: /free/i.test(e.price) ? undefined : e.price,
        image: await media(e.photo, e.title),
        summary: e.description,
        description: doc(p(e.description)),
        status: 'published',
        isDemo: true,
      },
      context: ctx,
    })
    events++
  }
  log(`${events} demo events`)

  // ---- Contest ------------------------------------------------------------------
  const { CONTEST_TITLE, CONTEST_ENTRIES } = await load<{ CONTEST_TITLE: string; CONTEST_ENTRIES: MockEntry[] }>('js/mock-data/contest.js')
  const slug = slugify(CONTEST_TITLE)
  const exists = await payload.find({ collection: 'contests', where: { slug: { equals: slug } }, limit: 1 })
  if (!exists.totalDocs) {
    const entries = []
    for (const e of CONTEST_ENTRIES) {
      const [, first, age] = e.author.match(/^(\w+),\s*age\s*(\d+)/i) ?? [null, e.author, '8']
      entries.push({
        image: await media(e.photo, `${e.title} — a child's drawing`),
        title: e.title,
        participantFirstName: first as string,
        participantAge: Number(age),
        parentConsent: true,
      })
    }
    await payload.create({
      collection: 'contests',
      data: {
        title: CONTEST_TITLE,
        slug,
        description:
          'Seattle-area kids share their drawings of police officers in their community — from patrol cars to K-9 units.',
        rules: doc(
          p('Open to children aged 4 to 14 living in the Seattle area.'),
          p('One drawing per child. A parent or guardian submits the entry and agrees to it being published with the child’s first name and age only.'),
        ),
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'active',
        entries,
        isDemo: true,
      },
      context: ctx,
    })
    log(`contest "${CONTEST_TITLE}" with ${entries.length} entries`)
  } else log('contest exists')
}
