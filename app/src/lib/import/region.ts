// The Seattle-area filter for news feeds that carry the whole country (a TV station's
// "news" feed: elections in Georgia, a shooting in Colorado). The city's own blogs need no
// filter — everything they publish is about the city — so only the hosts listed here have
// it. A story passes when its title, text or address names the region.

/** Feeds whose host is here are cut down to stories about the Seattle area. */
const REGIONAL_ONLY_HOSTS = ['fox13seattle.com']

export function isRegionalOnlyFeed(feedUrl: string | null | undefined): boolean {
  try {
    const host = new URL(feedUrl ?? '').hostname.toLowerCase()
    return REGIONAL_ONLY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

// Bare names that are also people or other places (Kent, Auburn, Everett, Lakewood, Marysville)
// are left out: their stories carry "…, WA" or the county anyway.
const PLACES = [
  'Seattle', 'King County', 'Puget Sound', 'Snohomish', 'Pierce County', 'Kitsap', 'Thurston County', 'Whatcom', 'Skagit',
  'Tacoma', 'Bellevue', 'Redmond', 'Kirkland', 'Renton', 'Lynnwood', 'Bothell', 'Issaquah', 'Burien', 'Federal Way',
  'Olympia', 'Bremerton', 'Spokane', 'Yakima', 'Sammamish', 'Mercer Island', 'Mukilteo',
  'Mount Rainier', 'SeaTac', 'Sea-Tac', 'Sound Transit', 'Seahawks', 'Mariners', 'Kraken', 'Sounders', 'Starbucks', 'Boeing',
  'Washington State', 'Washington state',
]
// "Washington" alone is the state in a local story and the capital in a national one.
const NOT_THE_STATE = String.raw`(?!,?\s*D\.?C\b|\s+(?:Post|Times|Examiner|Commanders|Nationals|Capitals|Wizards|Mystics|Monument)\b)`
const REGION = new RegExp(
  [
    `\\b(?:${PLACES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    String.raw`(?<!George |Booker T\. )\bWashington\b${NOT_THE_STATE}`,
    String.raw`\bWA\b`,
  ].join('|'),
  'i',
)

/** The words of an address path ("…/news/renton-wa-police-respond" → "news renton wa police respond"). */
const pathWords = (link: string) => {
  try {
    return new URL(link).pathname.replace(/[-_/]+/g, ' ')
  } catch {
    return ''
  }
}

/** True when the story names the Seattle area — in its title, its text or the words of its address. */
export function isAboutRegion(item: { title: string; text: string; link: string }): boolean {
  return REGION.test(`${item.title}\n${item.text}\n${pathWords(item.link)}`)
}
