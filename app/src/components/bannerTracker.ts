// Impression counting in the browser (spec §7): a banner counts once per page
// view when at least half of it has been on screen for a full second. Counts
// are batched and sent every 10 seconds, and with sendBeacon when the page is
// hidden or left, so the last ones aren't lost. A banner hidden by CSS (the
// desktop box on a phone and vice versa) never intersects, so only the one
// actually shown is counted.

const ENDPOINT = '/api/banners/impressions'
const VISIBLE_MS = 1000
const FLUSH_MS = 10_000

const queue = new Map<number, number>()
const timers = new Map<Element, number>()
let observer: IntersectionObserver | null = null

function send(beacon: boolean) {
  if (!queue.size) return
  const body = JSON.stringify({ impressions: Object.fromEntries(queue) })
  queue.clear()
  if (beacon && navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' })))
    return
  fetch(ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'content-type': 'application/json' },
  }).catch(() => {})
}

function setup() {
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          if (timers.has(el)) continue
          timers.set(
            el,
            window.setTimeout(() => {
              timers.delete(el)
              observer?.unobserve(el)
              const id = Number(el.dataset.bannerId)
              if (id) queue.set(id, (queue.get(id) ?? 0) + 1)
            }, VISIBLE_MS),
          )
        } else {
          window.clearTimeout(timers.get(el))
          timers.delete(el)
        }
      }
    },
    { threshold: [0, 0.5] },
  )
  window.setInterval(() => send(false), FLUSH_MS)
  document.addEventListener(
    'visibilitychange',
    () => document.visibilityState === 'hidden' && send(true),
  )
  window.addEventListener('pagehide', () => send(true))
}

/** Starts watching a rendered banner; returns the cleanup for the effect. */
export function trackImpressions(el: HTMLElement): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  if (!observer) setup()
  observer!.observe(el)
  return () => {
    observer?.unobserve(el)
    window.clearTimeout(timers.get(el))
    timers.delete(el)
  }
}
