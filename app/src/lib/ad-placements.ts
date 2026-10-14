// The banner positions the client sells and their monthly prices — one source
// for the pages, the empty-slot placeholder ("Your Ad Here · size · Available ·
// $X/month") and the "Banner placement & prices" section of /advertise
// (client's price sheets, 12.10.2026: Home / News / Cars / Business Directory /
// Others, every position at 100% of impressions).
//
// Naming is the client's: B1 — the strip right under the photo banner (or the
// announcement plates), B2 — a strip inside or under the main list, A1–A4 —
// the left column top to bottom, C1/C2 — the right column (C2 the tall one).
// A position maps to the AdSlots codes that render it: banners are attached to
// a code in the admin, so the codes stay; this file only says which position a
// code is and what it costs. Slots that are not on the client's sheets (e.g.
// HOME_INFEED_2, the business pages) have no entry and show no price.
// To change a price, change it here and deploy. Home prices follow Commercial.pdf
// (15.10.2026); the PDF has no prices for the other sections, so those stay from 12.10.

import type { Size } from '@/components/BannerSlot'

export type Position = 'A1' | 'A2' | 'A3' | 'A4' | 'B1' | 'B2' | 'C1' | 'C2'
export type PlacementGroup = 'home' | 'news' | 'cars' | 'directory' | 'others'

export type Placement = {
  group: PlacementGroup
  position: Position
  size: Size
  /** USD per month, 100% of impressions. */
  price: number
  codes: string[]
}

export const PLACEMENT_GROUPS: {
  key: PlacementGroup
  label: string
  /** Page scheme with the positions marked (public/images/advertising): a WebP
   *  to show on the page and the client's full-size PNG to open on click. */
  scheme?: { src: string; full: string }
  /** The sections a group covers, for the "Other sections" tab. */
  sections?: string[]
}[] = [
  { key: 'home', label: 'Home', scheme: { src: '/images/advertising/home.webp', full: '/images/advertising/home.png' } },
  { key: 'news', label: 'News', scheme: { src: '/images/advertising/news.webp', full: '/images/advertising/news.png' } },
  { key: 'cars', label: 'Cars', scheme: { src: '/images/advertising/cars.webp', full: '/images/advertising/cars.png' } },
  {
    key: 'directory',
    label: 'Business Directory',
    scheme: { src: '/images/advertising/business.webp', full: '/images/advertising/business.png' },
  },
  // No scheme for these: the client's sheet for them is only the price table.
  {
    key: 'others',
    label: 'Other sections',
    sections: ['Services', 'Shopping', 'Leisure', 'Events', 'Jobs', 'Weather', 'City Map'],
  },
]

// The "other sections" pages: B1 is each page's *_TOP, B2 its *_INFEED_1.
const OTHER_PAGES = ['CARS_SERVICES', 'SHOPPING', 'LEISURE', 'EVENTS', 'JOBS', 'WEATHER', 'MAP'] as const

export const PLACEMENTS: Placement[] = [
  // Home: the "Main page" column of Commercial.pdf (client, 15.10.2026).
  { group: 'home', position: 'A1', size: '300x250', price: 149, codes: ['HOME_SIDEBAR_1'] },
  { group: 'home', position: 'A2', size: '300x250', price: 149, codes: ['HOME_SIDEBAR_2'] },
  { group: 'home', position: 'A3', size: '300x600', price: 199, codes: ['HOME_SIDEBAR_3'] },
  { group: 'home', position: 'A4', size: '300x250', price: 149, codes: ['HOME_SIDEBAR_4'] },
  { group: 'home', position: 'B1', size: '728x90', price: 299, codes: ['HOME_TOP'] },
  { group: 'home', position: 'B2', size: '728x90', price: 299, codes: ['HOME_INFEED_1'] },
  { group: 'home', position: 'C1', size: '300x250', price: 149, codes: ['HOME_RIGHT_1'] },

  { group: 'news', position: 'A1', size: '300x600', price: 169, codes: ['NEWS_SIDEBAR_2'] },
  { group: 'news', position: 'B1', size: '728x90', price: 149, codes: ['NEWS_TOP'] },
  { group: 'news', position: 'B2', size: '728x90', price: 129, codes: ['NEWS_INFEED_1'] },
  { group: 'news', position: 'C1', size: '300x250', price: 149, codes: ['NEWS_SIDEBAR_1'] },

  { group: 'cars', position: 'B1', size: '728x90', price: 149, codes: ['CARS_TOP'] },
  { group: 'cars', position: 'B2', size: '728x90', price: 129, codes: ['CARS_INFEED_1'] },
  { group: 'cars', position: 'C1', size: '300x250', price: 149, codes: ['CARS_SIDEBAR_1'] },
  { group: 'cars', position: 'C2', size: '300x600', price: 169, codes: ['CARS_SIDEBAR_2'] },

  { group: 'directory', position: 'B1', size: '728x90', price: 149, codes: ['DIRECTORY_TOP'] },
  { group: 'directory', position: 'B2', size: '728x90', price: 149, codes: ['DIRECTORY_INFEED_1'] },
  { group: 'directory', position: 'C1', size: '300x250', price: 129, codes: ['DIRECTORY_SIDEBAR_1'] },
  { group: 'directory', position: 'C2', size: '300x600', price: 169, codes: ['DIRECTORY_SIDEBAR_2'] },

  {
    group: 'others',
    position: 'B1',
    size: '728x90',
    price: 149,
    codes: OTHER_PAGES.map((p) => `${p}_TOP`),
  },
  {
    group: 'others',
    position: 'B2',
    size: '728x90',
    price: 129,
    codes: OTHER_PAGES.map((p) => `${p}_INFEED_1`),
  },
]

const BY_CODE = new Map(PLACEMENTS.flatMap((p) => p.codes.map((c) => [c, p] as const)))

/** The client's position and price for a slot code, if it is one they sell. */
export const placementFor = (code: string): Placement | undefined => BY_CODE.get(code)

export const placementsOf = (group: PlacementGroup) =>
  PLACEMENTS.filter((p) => p.group === group).sort((a, b) => a.position.localeCompare(b.position))

export const priceLabel = (price: number) => `$${price}/month`

/** "Prices shown are before applicable sales tax…" — under every price list (Commercial.pdf). */
export const TAX_NOTE =
  'Prices shown are before applicable sales tax. Sales tax is calculated based on your location and added to the total. Annual plans offer savings compared to monthly billing.'

/** Banner production and sizes (Commercial.pdf). */
export const ANIMATED_BANNER_PRICE = 100
export const BANNER_SIZES = ['300x250 pxl', '728x90 pxl', '300x600 pxl']

/** Advertising articles (Commercial.pdf, 15.10.2026): placement for the series, writing per article. USD. */
export const ARTICLE_PRICES = [
  { label: '1 article', placement: 198, writing: 99 },
  { label: 'A series of 5 articles', placement: 850, writing: 69 },
  { label: 'A series of 20 articles', placement: 2990, writing: 50 },
]
