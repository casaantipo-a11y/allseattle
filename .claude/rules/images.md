---
paths:
  - "img/**"
  - "js/mock-data/**"
  - "app/public/**"
  - "app/src/scripts/seed.ts"
---

<!-- Moved verbatim from CLAUDE.md (lines 1401-1447) on 02.10.2026; loads only when a matching file is read. -->
# Images (img/)

### Images (`img/`)

Real stock photography (Unsplash/Pexels), downloaded once and stored locally so the demo works
offline in front of a client — never hotlink external image URLs here. Organized by section
(`hero/`, `news/`, `business/`, `cars/`, `contest/`, `icons/`); `cars/` photos are per-listing
(`c1-1.webp`, `c1-2.webp`, ... matching a car's `id` in `cars.js`), the rest are curated pools
reused across entries where the mock data needs more variety than there are unique photos.

**The eight newer sections have no folder of their own** — there is nowhere to get new photos
from and downloading them would break the offline guarantee, so Events, Real Estate, City Map
and Entertainment draw from `news/`, `business/` and `hero/`. **All five landmark photos in
`hero/` are in use** by those sections, despite what this file used to claim; only
`img/icons/logo-lockup.png` is genuinely unreferenced. Jobs, Weather and Q&A carry no photos at
all, which is a design choice as much as a constraint: a list of job titles reads faster without
them.

#### Every photo is WebP, sized to what it actually renders

The site was loading 2.4–3.3 MB of images per page and taking 4.5–6.3s to paint its largest
element. Two things caused it, and both are fixed:

- **The photos were three times bigger than anything ever drawn from them.** Measured on the
  live pages: news / business / contest / hero-landscape photos never render larger than
  **492×369**, and car photos never larger than **732×564** (the detail gallery). Sources were
  1200×1800. Everything is now capped at twice the largest real render — 1000×750 for the card
  pools, 1200×1130 for cars — so even a 2× display gets every pixel it can show.
- **Tall photos were carrying a band nobody sees.** Card frames are `object-fit: cover` at 4:3
  and 16:10, so anything below 4:3 was cropped away at render time anyway. Those are now cropped
  at the source. **Cars are the exception and must not be cropped**: `.car-card-photo img` is
  `object-fit: contain`, so the whole frame is visible.

Format is WebP at quality 0.86, picked by measuring rather than by taste: on a 12-file sample it
came to 43% of the original bytes at a *higher* PSNR than any JPEG re-encode. Result: 14.9 MB →
7.4 MB on disk, LCP 4.5–6.3s → 1.2–1.9s, page weight down 60–70%.

There is no image tooling on this machine — no PIL, no ImageMagick, no sharp. The conversion ran
through **headless Chrome**: load the photo into a canvas, crop and scale, `toDataURL('image/webp', 0.86)`,
and compute PSNR against the canvas to confirm the encode held. If you add photos, put them
through the same path rather than committing a 400 KB JPEG. (The `convert` on PATH here is
Windows' filesystem tool, not ImageMagick — do not call it.)

**The hero photo is preloaded from every `<head>`.** It is the LCP element on all 17 pages, and
because `partials.js` injects the markup at `DOMContentLoaded` the browser's preload scanner
never sees it — measured, it used to start downloading at 500–670ms. The
`<link rel="preload" as="image">` moves that to ~100ms. It deliberately carries no
`fetchpriority="high"`: the six render-blocking stylesheets should win that race, and measuring
both ways showed no LCP difference. Any new page needs that line too, with `../` under `auto/`.

**12.10.2026, app demo cars:** `img/cars/c22-{1,2,3}.webp` … `c29-{1,2,3}.webp` are new (three
shots of one car each; the first one-photo version c14–c21 is gone) — free Unsplash
photos (Unsplash License), downloaded once at 1200px and converted to WebP q0.86 through headless
Edge like the rest, so that every demo car listing has its own photo of its own model (the 13
prototype sets ran out at 13 listings). Photographers in `PHOTO_CREDITS`
(app/src/scripts/demo-cars-extra.ts); the seed writes "Photo: <name> / Unsplash" into the Media
`credit`.
