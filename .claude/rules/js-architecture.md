---
paths:
  - "js/**"
  - "*.html"
  - "auto/*.html"
---

<!-- Moved verbatim from CLAUDE.md (lines 935-1166) on 02.10.2026; loads only when a matching file is read. -->
# Prototype JS: path depth, partials.js, price systems, ad slots, mock data, demo contract, helpers, logo

### Path depth is the biggest trap here

Only `partials.js` is depth-independent (`SITE_ROOT`). **Mock-data image paths are written
relative to the page that consumes them, not to the site root**: `news.js` / `businesses.js` /
`contest.js` use `img/news/...` (root pages), while `cars.js` uses `../img/cars/...` because
`CAR_LISTINGS` is only rendered from pages inside `auto/`. `mock-data/stats.js` imports
`CAR_LISTINGS` (and so, through it, Home and the Directory do too) but touches only `.length`,
which is why nothing breaks today. If you ever render car photos from a root-level
page (or business/news photos from `auto/`), those images 404 — fix it by moving that data file to
a `SITE_ROOT`-style absolute URL, not by patching one call site.

### `js/partials.js` — header/footer injection

The one piece of shared chrome across every page. Key structural fact, non-obvious from reading
any single function in isolation:

**The sticky header (`<header class="site-header" id="site-header-functional">`) is rendered as a
sibling of the `#site-header` mount div, not nested inside it.** `renderHeader()` sets
`mount.innerHTML` to the banner markup only, then does
`mount.insertAdjacentHTML("beforebegin", siteHeaderMarkup())` to place the header *before* it,
both as direct children of `<body>`. This is load-bearing: `position: sticky` computes its
"room to stick" from the element's own parent (containing block). Nesting banner + header in the
same mount div means that parent's box ends right at the header's own bottom edge — zero room to
stay pinned, so it silently degrades to acting like `position: static` despite the CSS being
correct. Keep the header a sibling of `<main>` if you touch this again, and verify it the way
"Checking a layout change" describes rather than by eye.

- `heroMarkup()`: one component, one height ladder for every page. `.hero-frame` holds the
  photo, a shade gradient, the weather plate and the search form.
  There is no second hero function and no dark/light variant of the top bar any more: the header
  is always white, so `logoLockupMarkup`'s `variant: "dark"` has exactly one caller left, the
  footer.
- `siteHeaderMarkup()`: the whole header, identical on every page, taking no `pageType`.
- The weather plate reads `weatherHeaderLine()` from `mock-data/weather.js` — the same numbers
  the Weather section shows — with only the date computed live. It renders inside
  `heroMarkup()`, not the header. The search box swaps its own placeholder to "Search is a demo
  placeholder" for 2.2s on submit — it never searches anything.
- `NAV_LINKS` (5 primary pages, each carrying its own `NAV_ICONS` entry) and `NAV_SECONDARY`
  (8 smaller sections) render into **two separate lists** — `<ul class="nav-links">` and
  `<ul class="nav-secondary">` — stacked inside `.nav-stack`. Both are real links now; the
  secondary eight were `href="#" onclick="return false"` placeholders until their pages were
  built. They used to share one row, with a CSS adjacent-sibling selector pushing the
  placeholders to the right edge; splitting them into rows is what buys the first row enough
  width to keep full 44px targets at desktop sizes.
- **Below 1024px the two rows merge into one horizontal scroller.** `.nav-stack` itself takes
  `overflow-x: auto` and the two lists ride inside it as `flex: none` children, so all 13
  links live on one 44px row. A third row would push the sticky header from 112px to 148px,
  and hiding eight real sections on a phone is not an option. From 1024px `.nav-stack` goes
  back to `display: block` and they are two rows again.
- The ENG switch and the account icon are the only inert controls left in the header. Keep
  them that way — the demo contract covers them.

### Two independent price systems (easy to confuse)

They share the word "Premium" but are unrelated:

| | Where | Tiers |
|---|---|---|
| **Banner ad rate card** | `js/banner-ads.js` (`AD_TIERS`) | Start $99/mo @320×100, Business $149 @300×250, Premium $199 @300×600, Large $299 @728×90 **and** 970×250 |
| **Business directory packages** | `js/mock-data/pricing.js` (`PRICING_TIERS`) | Standard $49/mo, Lux $79, Premium $129 — each with 3/6/12-month cycles and a discounted yearly price |

`PRICING_FEATURES` is the comparison matrix (`true` = included, `false`/`0` = dash, a number = a
limit). `directory.js` badges each business by its `package` field using the same
Standard/Lux/Premium vocabulary and the same `badge-standard` / `badge-lux` / `badge-premium`
classes as `pricing.js`.

### Ad slots (`js/banner-ads.js`)

A rate-carded component, not a decoration. Size → tier → price is fixed (`AD_TIERS`, above).
Occupied/Available status is `hashSeed(seed) % 5 < 3` — deterministic per seed string, not random
per render, so the **same placement shows the same status everywhere it appears**: its desktop
box, its own mobile-size swap (`renderAdSlot(seed, size, {mobileSize})`, toggled by the
`ad-slot--desktop` / `ad-slot--mobile-only` CSS classes at 1024px), and its separate
inline echo interleaved into a mobile content feed (`inlineAdMarkup(seed, tierSize)`, used by
`home.js` / `news.js` / `directory.js` / `auto-catalog.js` to redistribute sidebar ads into the
card grid on narrow screens instead of stacking them at the top). Always pass the **same seed and
the same `tierSize`** for a placement's desktop and inline-mobile renders, or the status or price
will visibly disagree between them.

Per-page convention: desktop placements are declared as `data-ad-slot` attributes in the HTML
(seeds like `home-left-1`, `news-side-1`, `auto-filter-ad`). **Home is the only page still
emitting mobile echoes** from its module — inline after the 6th and 12th cards (multiples of
6, so an echo always closes a full row in the 1/2/3-column grids below 1024px; after card 4 it
used to strand card 4 alone on a 3-column tablet) and into
`<div id="mobile-footer-ads">`; everywhere else the rail slots are visible at every width and swap
to 320×100 themselves, or the placement is gone. `inlineAdMarkup()` therefore has one caller left,
`home.js`.

`mountAdSlots(root)` does a lazy pass over `[data-ad-slot]` elements (reads `data-ad-slot` /
`data-ad-slot-mobile` / `data-ad-seed` attributes) and is safe to call again after any `innerHTML`
re-render (e.g. after filtering).

### Mock data (`js/mock-data/*.js`)

Plain exported arrays/constants, no fetch, no build-time generation — `news.js`, `businesses.js`,
`cars.js`, `contest.js`, `pricing.js`, plus one per new section: `jobs.js`, `events.js`,
`shopping.js`, `entertainment.js`, `weather.js`, `real-estate.js`, `neighborhoods.js`, `qa.js`.
`stats.js` is the odd one out: it holds no data of its own, just the four showcase numbers
(`siteStats()`) that Home's "at a Glance" and the Directory's "Statistics" both render. It exists
because the second copy of that list would have drifted from the first — the same way the header's
weather and the Weather section once disagreed.

`businesses.js` carries `views` and `address` per business. Only the Directory renders them today;
other sections get the same treatment when the user asks for it, not automatically. It also holds
**nine Auto Services companies**, eight of them added for the Auto page's "Directory of
Enterprises" block — they live here because the directory is the site's only source of companies,
and `shopping.js` and `stats.js` both read from it. Their photos come from `img/cars/`, not the
`img/business/` pool: that pool is cafés, salons and bookshops, and a fitness-studio photo over
"Emerald Shine Car Wash" reads as a mistake on a demo.

**Both showcase numbers moved when that data grew**, and they move together because `stats.js` is
the single source: 15 businesses → 23 (`615+` → `943+` listed) and 13 cars → 12 (`351+` →
`324+` active listings), on Home and the Directory alike. That car number was `1296+` while the
catalog held 48 listings and came back down as the user cut it — nothing but the data moves it.

Three of them are deliberately joined to their neighbours rather than self-contained, which is
what stops the sections reading as separate sites: `shopping.js` holds a `businessId` and
resolves photo/name/phone out of `businesses.js`; `entertainment.js`'s page pulls
`upcomingEvents()` from `events.js`; `city-map` counts per neighbourhood by filtering
`events.js`, `jobs.js` and `real-estate.js` on their `neighborhood` field. Keep that field
spelled the same way across those three or the counters silently read zero.

`weather.js` is the single source for the forecast **and** for the stub in the header —
`weatherHeaderLine()` is what `partials.js` calls. Changing the temperature in one place used
to leave the other disagreeing on the same screen.

The **only** thing in this entire site that touches
`localStorage` is the contest vote counter (`contest.js`: `CONTEST_STORAGE_KEY` for vote counts,
`CONTEST_VOTED_KEY` for a one-vote-per-browser guard, both wrapped in try/catch since
`localStorage` can throw in some browser contexts). If you ever see `localStorage` used from a
different page's form, that's a regression against the "nothing persists" demo contract.

`news.js` `publishedAt` timestamps are hardcoded around late September 2026 so `relativeTime()`
renders them as "2 hours ago" / "Yesterday". They age: once they're more than 7 days old every
card falls back to a bare date and the feed stops feeling live. Bump the dates before a demo
rather than changing `relativeTime()`.

### The demo contract — what must stay fake

Every submit surface intercepts and shows a canned success state; keep it that way:

- **Share the News** (`news.js`, modal) → `.success-panel`, then closes + reloads the page.
- **Newsletter** (`news.js`, the left-rail widget on News) → `.success-panel` for both Subscribe
  and Unsubscribe, saying nothing was sent and no address stored; "Back" brings the form back.
- **Choose a Package** (`pricing.js`, modal) → `.success-panel`, then closes + reloads.
- **Contact Seller** (`auto-listing.js`, inline form) → replaces the seller card with "Message Sent".
- **My Listings** Edit/Delete buttons (`auto-my-listings.js`) carry `data-demo-only` and just
  flash "Demo only" for 1.5s.
- **Contest voting** is the one thing that persists (localStorage), and the page ships a visible
  `#reset-votes-btn` escape hatch so a demo can be re-run clean.

The eight newer sections add **no forms at all**: their section-head buttons ("Post a Job",
"Submit an Event", "List a Property", "Advertise Here") are plain links to `pricing.html`. That
was a deliberate call — it keeps the demo contract from growing and funnels every section into
the thing being sold. If you add a form to one of them, it has to join the list above.

Each success panel says out loud that nothing was actually sent — that wording is deliberate (a
prospective client is reading it), so don't strip it.

### Per-page modules (`js/pages/*.js`)

Same shape everywhere: import mock data + `banner-ads.js` / `format-time.js` /
`validation.js` / `modal.js` as needed, define small `xCardTemplate()` template-literal functions,
wire `DOMContentLoaded` to populate the page and attach listeners. No shared page-controller
abstraction — each file is self-contained and safe to read in isolation.

- `auto-catalog.js` exports `carCardTemplate()`, reused by `auto-listing.js` for its "similar
  cars" section — the one cross-page-module import in the codebase.
- `auto-listing.js` reads the car id from `?id=` via `URLSearchParams` (`getIdFromUrl()`). Note
  the actual behavior: `CAR_LISTINGS.find(...) || CAR_LISTINGS[0]` — an **unknown or missing
  `?id=` silently falls back to the first car**, so `renderNotFound()` is effectively dead code
  (it only fires if `CAR_LISTINGS` is empty). Fine for a demo (a bare `listing.html` still shows
  something), but don't rely on a "not found" state existing.
- Filter/sort pages (`auto-catalog.js`, `directory.js`) recompute the full result list from the
  original mock array on every control change rather than mutating state incrementally — simple,
  and fine at this data volume. After each re-render they call `mountAdSlots(grid)`; forgetting
  it leaves empty ad boxes where the new cards' inline placement should be.

### Shared helpers

- `validation.js` — `validate(form, data, rules)` runs a `{fieldName: (value, data) => message |
  null}` rule map, writes inline errors via `showError()` / `clearErrors()` (toggles an `.invalid`
  class + `aria-invalid` + a `.field-error` text node inside the element with `data-field="name"`).
  Every form on the site uses this pattern, plus the shared `isEmail()` / `digits()` predicates for
  the recurring "an email or a phone, either is fine" contact rule.
- `format-time.js` — `relativeTime(iso)` ("2 hours ago" / "Yesterday" / falls back to a date
  after 7 days) and `formatViews(n)` (1200 → "1.2k").
- `modal.js` — generic overlay open/close/Escape/backdrop-click wiring by element id
  (`wireModal(overlayId, openBtnId, closeBtnId)`; pass `null` for the open button when the page
  opens it itself, as `pricing.js` does per tier card).
- `logo.js` — the logo markup plus every icon on the site. `logoLockupMarkup({href, variant})`
  returns the logo image as a link (see "The logo" below). It also exports three icon maps as
  inline SVG strings:
  `SOCIAL_ICONS` (facebook / twitter / instagram / telegram — the header shows the last three,
  and the footer's "Follow us" list matches), `NAV_ICONS` (one per real nav link) and `UI_ICONS`
  (account / globe / search / weather). `NAV_ICONS` and `UI_ICONS` are built by one local
  `strokeIcon()` helper, so they share a 24-unit box, a 1.8 stroke and `currentColor` — §6 wants
  a single icon set at one weight. `WEATHER_ICONS` (sun / cloud / cloud-sun / rain / snow) comes
  from the same helper; reach it through `weatherIcon(name, size)`, which falls back to the
  cloud rather than returning an empty string for an unknown key. Add new icons through
  `strokeIcon()`, not by hand, and don't reach for an emoji: the two that used to stand in for
  search and weather are gone.

### The logo

**The logo is the client's own artwork, as an image** — not something to redraw. On 29.09.2026
the user sent a reference lockup and, after a close SVG + live-text redraw, asked for it
"exactly" ("точь в точь"). `logoLockupMarkup()` renders one `<img>` inside the link:

- `img/icons/logo.webp` — cut from the reference: white background turned to alpha, the white
  disc inside the pin kept opaque (the transparency flood-fills only from the image edges, and
  everything right of the pin is colour-to-alpha'd, so letter counters are clear too). 560×180,
  enough for 3× at the 60px header size.
- `img/icons/logo-dark.webp` (`variant: "dark"`, the navy footer) — the same with the navy
  lettering turned white; "All" and the pin are unchanged.
- The link carries the accessible name; the image is `alt=""` so it isn't read twice.

If the client sends a new logo, regenerate both files the same way rather than editing pixels
or going back to a vector imitation.

- **One knob for size**: `.site-logo-img` is `1.3 × --logo-h` tall, width by aspect. Mobile-first,
  so 34px is the base (34 × 1.3 = 44, the header row's height) and 46px arrives at 640px (60px
  image, which makes the 640–1023 header 128px instead of 114); the footer pins its own 40px.
- The image has **`max-width: none; flex: none`** — the global `img { max-width: 100% }` squeezed
  it to the 180px logo column at 1024 and distorted it; it now overhangs by 6px, 10px short of
  the nav.
- **`img/icons/favicon.svg` is a vector redraw** of the pin (close to the reference, not
  identical) — a 16px tab icon can't carry the raster lockup, and a standalone file is what every
  `<head>` points at. Don't go back to inlining a `data:` URI per page.
- `img/icons/logo-lockup.png` is an old, unused raster of the previous mark. Nothing loads it;
  don't wire it back into a page.

**App search ranking (13.10.2026, `searchSite` in lib/queries-phase3.ts):** the index query only
filters; results are ranked in code by match quality — whole word in the title (100, plural s/es
counts), the section the word names (60: car/cars/auto → car listings, job → jobs, event, news,
business; those kinds are also fetched, since a car title never says "car"), whole word in the
excerpt/keywords (40), a title word that only starts with the term (30, "car" → "Care"), text word
start (20), inside a word (10/5); collection priority and title only break ties. Before, results
were sorted by collection priority alone, so "car" put a dealership whose description says "car"
above "Rainier Car Rental" and showed "Urgent Care". Both the header suggestions (/api/search, 8)
and /search (60) use it.
