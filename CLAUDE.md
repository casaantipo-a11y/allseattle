# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AllSeattle is a closed, in-person sales-demo prototype of a Seattle city portal (news, business
directory, car classifieds, banner ad inventory) — built to sell ad packages to local businesses
before the real product exists. **There is no backend, database, or real data transmission of any
kind.** Every page is static HTML/CSS/JS with mock data; every form validates client-side and
shows a fake success state instead of sending anywhere (see README.md's "What's real vs. mocked"
table). Don't add a fetch/XHR call or a real backend integration unless explicitly asked — that
would break the demo's offline guarantee.

The single exception to "no network": every HTML `<head>` pulls Libre Franklin / Public Sans /
Pacifico from the Google Fonts CDN. Everything else (images, CSS, JS) is local. If a demo has to
survive dead conference wifi, that stylesheet is the one thing that degrades — the local fallbacks
in `--font-heading`/`--font-body` cover the body text, but the Pacifico script wordmark won't
render as designed.

## Design rules (`design.md`)

`design.md` (Russian) is the project's composition standard: spacing scale, type scale, grid,
colour proportion, hierarchy, component consistency, and a per-section checklist. **Read it before
writing markup or CSS.** Its core premise is that every value comes from a declared system and
anything picked by eye is a defect — so "it looks better this way" is not an argument against it.

**This file wins on conflict**, because what's recorded here is load-bearing architecture (the
sticky-nav sibling rule, `SITE_ROOT` path resolution, CSS load order, the demo contract). Breaking
those to satisfy a composition rule breaks the site. `design.md` governs everything else.

The site **has been retrofitted to it** (Sept 2026): spacing, type, radii, section and card
padding all come from tokens, and the breakpoints are its mobile-first 640/768/1024/1280. So new
work has no excuse to drift — match the tokens, don't invent values. The agreed exceptions are
listed under "CSS structure" below.

Two deliberate deviations already ruled on by the user: **more than two font families is fine**
here (Libre Franklin / Public Sans / Pacifico — Pacifico is the brand script in the inner hero,
not a stray), and inline `style="..."` in JS templates stays acceptable per the CSS section below,
despite `design.md` §9.

## Environment & deploy

The working copy lives at `D:\allseattle`. The repo is
**`github.com/casaantipo-a11y/allseattle`** (public), served by GitHub Pages from `main` at
<https://casaantipo-a11y.github.io/allseattle/>.

Deploying is just pushing to `main` — Pages rebuilds on its own. Poll
`gh api repos/casaantipo-a11y/allseattle/pages/builds/latest` for `"status":"built"` on the new
commit SHA rather than assuming a push is live immediately; a build takes roughly a minute.

The history starts at a single squashed initial commit (Sept 2026) — the project was re-homed
here from an earlier repo (`mijckela-alt/allseattle`) that is no longer the deploy target. Don't
expect to find pre-move history, and don't push to the old remote.

**Pages serves the site from a project subpath** (`/allseattle/`), not from a domain root. That's
survivable only because nothing here uses root-relative (`/css/...`) URLs and `partials.js`
resolves `SITE_ROOT` from `import.meta.url` at runtime. Introducing a leading-slash asset path
will work on `localhost:8000` and 404 on Pages — see "Path depth is the biggest trap here".

A custom domain (`allseattle.org`) was purchased and briefly pointed at Pages via a `CNAME` file
under the old repo, then explicitly reverted — there is **no `CNAME` file here**, and the site is
not live at allseattle.org despite what README.md's "Real" section still says. Don't re-add
`CNAME` or treat allseattle.org as live unless the user asks to redo that DNS work.

README.md is out of date in two other spots: it says asset paths are root-relative (`/css/...`) —
they are plain relative (`css/...`, or `../css/...` under `auto/`) — and it points at a `CNAME`
that no longer exists.

## Commands

No build step, no package.json, no test suite — verification is always manual.

```powershell
# from inside this folder — relative asset paths and ES modules need real HTTP, not file://
python -m http.server 8000          # Python 3.13 is on PATH on this machine
# then open http://localhost:8000/
# for a phone on the same LAN: add --bind 0.0.0.0, browse to the machine's LAN IP instead of localhost
```

### Checking a layout change

**Do not screenshot narrow widths with `--window-size`.** Headless Chrome on this machine clamps
its window to roughly **504 CSS px**, so `--window-size=375` quietly returns a 375px-wide *crop of
a desktop render*: content looks truncated and a horizontal scrollbar appears that no real browser
shows. Two false bugs have already been chased this way.

A trustworthy pass drives Chrome over CDP instead:

1. Launch with `--headless=new --disable-gpu --no-sandbox --user-data-dir=<tmp> --remote-debugging-port=9222 about:blank`.
2. `PUT http://localhost:9222/json/new?about:blank`, take `webSocketDebuggerUrl`.
3. On that socket (Node 24 has a global `WebSocket`; nothing to install) send
   `Emulation.setDeviceMetricsOverride {width:375,height:812,deviceScaleFactor:1,mobile:true}`,
   then `Page.navigate`, then `Page.captureScreenshot`.

Four things that each cost a wasted run when missed:

- **`Network.setCacheDisabled {cacheDisabled:true}` before navigating.** Otherwise Chrome serves
  the previous CSS and the run measures the layout you just changed away from — it will look like
  your edit did nothing.
- **Assert `matchMedia('(max-width:460px)').matches === true`** on every mobile page. If it is
  false the emulation silently did not apply and every number in that run is wrong.
- **A fresh tab per page.** The renderer intermittently hangs on the longest pages; without
  isolation one hang takes down the whole pass.
- **Scroll to the bottom and back before capturing**, or `loading="lazy"` never fires and the
  screenshot is full of blank photo boxes that look like broken images.

Worth asserting per page rather than eyeballing: `documentElement.scrollWidth === innerWidth`
(no horizontal scroll), `window.innerWidth` itself (a grid column can inflate the layout even
while `matchMedia` still reports the narrow width — see the third CSS trap),
`getComputedStyle(document.body).fontSize` (16px at 375, 18px at 1440), how many interactive
elements measure under 44px, and how many images have `naturalWidth === 0`. After touching the
header, also check `#site-header-functional` sits at `top: 0` once the page is scrolled, and
that neither `.nav-links` nor `.nav-secondary` has `scrollWidth > clientWidth` at 1024px and up.

A pass covers 17 pages, not 9 — a harness with a stale page list will happily report that
everything is fine.

### Known issue, not yours

`auto/listing.html` throws `Cannot read properties of null (reading 'appendChild')` at
`js/pages/auto-catalog.js:33` on every load, in both viewports. It predates the current work.
Cause: `auto-listing.js` imports `carCardTemplate` from `auto-catalog.js`, and that import also
runs the catalog module's top-level `DOMContentLoaded` handler, whose `populateMakes()` looks for
the `#f-make` filter select that only exists on the catalog page. The two handlers are
independent, so the listing page still renders fully — the error is noise, not breakage. Treat a
*clean* console on that page as the surprise.

## Architecture

### Page shape

17 standalone HTML files. Five at the root are the original sections (`index.html`,
`news.html`, `contest.html`, `directory.html`, `pricing.html`); eight more were added for the
sections that used to be coming-soon placeholders in the nav (`jobs.html`, `events.html`,
`shopping.html`, `entertainment.html`, `weather.html`, `real-estate.html`, `city-map.html`,
`qa.html`); four live under `auto/` (`index.html`, `listing.html`, `add-listing.html`,
`my-listings.html`).

Each is a `<head>` of the same CSS links + a `<body data-page-type="home|
inner" data-page="...">` with two empty mount points (`<div id="site-header">`,
`<div id="site-footer">`) and a `<main>`. Home carries a third, `<div id="contest-strip">`.
All real content is injected by JS at `DOMContentLoaded` — there's very little to see in the
HTML source itself.

- `data-page-type` picks the tall photo frame (`"home"`, 340px) vs. the short one carrying the
  script wordmark (anything else, 170px) in `partials.js`.
- `data-page` drives active-nav-link highlighting (`nav-active.js` matches it against each nav
  link's own `data-page`).
- Pages under `auto/` load CSS/JS via `../` relative paths; root pages use plain relative paths.
  `partials.js` itself resolves the site root at runtime via
  `new URL("../", import.meta.url).href` (`SITE_ROOT`), so the same module works from any page
  depth regardless of how it was reached.

### Section map — what every page contains, in order

Every page is the same three-part sandwich: **shared chrome → one `<main>` section → shared
footer**. Only the middle differs. Blocks marked *(JS)* are empty in the HTML and filled at
`DOMContentLoaded`; everything else is in the markup.

**Shared chrome, on all 17 pages** (from `js/partials.js`):

1. **Sticky header** — logo at the left, two rows of nav (5 real links with icons on top, 8
   smaller sections underneath) **centred in the header**, and a short utility cluster at the
   right: the inert ENG switch, Register Business, account icon. Identical on all 17 pages.
   The centring is a `1fr auto 1fr` grid, so the nav block keeps its own intrinsic width and
   the equal side columns push it to the middle. It only fits because the weather and the
   social icons moved out — with them the cluster was 564px wide and there was nothing to
   centre.
2. **Photo banner** — the skyline inside `.container`, rounded, with the search box laid over
   it and the **weather plate in the top-left corner** (`.hero-weather`, a link to
   `weather.html`). Tall on Home; short with the "Seattle / THE EMERALD CITY" wordmark
   everywhere else. This is page content, not chrome: its edges line up with every other block
   on the page.

   The three things laid over the frame have to share 140–340px of height, and two collisions
   were measured before the current arrangement settled: **the weather plate is one line
   everywhere except Home at 1024px and up**, where the frame is 340px and nothing else sits
   on the left. Its full three-line form is 79px tall and hit the search bar on a 140px inner
   frame and the wordmark on a 170px one. The wordmark itself moved to the bottom-left and is
   hidden below 1024px, where the search bar occupies that edge.
3. **Contest strip** — Home only, and rendered by `home.js`, not `partials.js`.
4. `<main>` — the page's own `<section>`(s), listed below.
5. **Footer** — logo with the three social icons under it, Contact, Follow us, Explore,
   copyright. The icons came out of the header; note that "Follow us" already lists the same
   three networks as text, so the footer now names them twice — that was the user's call, not
   an oversight. Explore lists **every** section,
   in two columns from 640px, and is built from the same `NAV_LINKS` / `NAV_SECONDARY` arrays
   as the nav, so a new section appears in both at once. It is also the only way to reach the
   secondary sections on a phone that does not involve scrolling the nav row sideways.

The header sits *above* the banner, which is the inversion of how this used to work: the photo
was the page header and the nav came after it. The landmark icon strip (Space Needle / Downtown
/ Mount Rainier / Waterfront / Pike Place) that used to sit under the hero is gone — it was
decoration with no destination (§7) and the contest strip took its slot.
`img/hero/skyline-panorama.png` is still used; the five landmark jpgs beside it are now loaded
by nothing.

---

**`index.html` — Home** (`data-page-type="home"`, and the only page with two `<section>`s)
A three-column `.home-layout`. Below 1024px it becomes one column, but the asides do not simply
stack: the left aside's four slots are `.ad-desktop-slot` and disappear entirely, reappearing as
inline ads inside the news feed, while the right aside's widgets do stack below the feed.

0. Contest strip — outside `<main>`, between the banner and the first section.
1. Left aside — four ad slots: 300×250, 300×250, 300×600, 300×250.
2. Middle `.home-main`:
   1. 728×90 ad (`home-top`).
   2. Section head — "Today in Seattle" / **Top News** + "All News" button.
   3. News grid *(JS)* — 6 cards, with inline mobile ads after cards 3 and 6.
   4. 728×90 ad (`home-mid`).
3. Right aside — a 300×250 ad **first**, then four widgets *(JS)*: **AllSeattle at a Glance**
   (4 stat tiles), **Job Board** (Coming Soon), **Exchange Rates**, **City Transit**; then the
   mobile ad stack.
4. Second section — "More from Seattle" / **City Newsfeed**: the remaining articles as compact
   rows *(JS)*, thumbnail + category + relative time + headline + one clipped line.

**The 12 articles are split 6 + 6 and never repeated.** `CARD_COUNT` in `home.js` is the one
place that decides where the photo cards stop and the newsfeed starts; move it and both halves
follow. The middle column is too narrow for more than two readable cards across, so the density
the design asks for comes from that bottom list rather than from a third or fourth column.

**`news.html` — News**

1. 728×90 ad.
2. Section head — "Seattle News" / **Latest Stories** + "+ Share the News" button.
3. `.news-layout` — article grid *(JS)*, inline ad after card 4 | sidebar: 300×250, 300×600.
4. Mobile ad stack *(JS)*.
5. Contest teaser — a link block promoting `contest.html`.
6. Modal: **Share the News** — headline, details, photo, contact.

**`contest.html` — Contest**

1. Contest hero — eyebrow, **Police in the Eyes of a Child**, lead paragraph, "← Back to News".
2. Entry grid *(JS)* — 6 entries, each with a vote button.
3. "Reset my votes (demo)" button — the escape hatch that clears the stored votes.

**`directory.html` — Business Directory**

1. 728×90 ad.
2. Section head — "Business Directory" / **Find a Seattle Business** + "List Your Business".
3. Category filter chips *(JS)*.
4. `.directory-layout` — business grid *(JS)*, inline ad after card 4 | sidebar: 300×250, 300×600.
5. Mobile ad stack *(JS)*.

**`pricing.html` — Pricing**

1. Section intro — "Advertise on AllSeattle" / **Placement Packages** + lead.
2. Pricing grid *(JS)* — Standard / Lux / Premium, Lux flagged "Most Popular".
3. Section head — "Compare Plans" / **What's Included**.
4. Feature table *(JS)* — scrolls inside its own wrapper on narrow screens.
5. Modal: **Choose a package** — name, business, contact, message.

---

**The eight secondary sections** all share one skeleton, generated from `directory.html`:
728×90 ad → section head with a `pricing.html` button → content → `#mobile-footer-ads`. Six of
them wrap the content in `.side-layout` / `.side-rail` (the shared "content + sticky sidebar"
pair from `components.css`), and every one carries the same three placements: `<key>-top`
728×90, `<key>-side-1` 300×250, `<key>-side-2` 300×600, plus the inline echo after card 4.

**`jobs.html` — Jobs** — category chips, a count line, then `.job-list`: rows with title,
salary, company · neighborhood, description, a type badge and posting age. No photos, by
design. Home's Job Board widget reads the same data and links here.

**`events.html` — Events** — category chips + `.event-grid`: cards with a date plaque over the
photo, venue, neighborhood and price. `eventDateParts()` in the data file formats the plaque.

**`shopping.html` — Shopping** — category chips + `.deal-grid`. Every deal carries a
`businessId` and `dealWithBusiness()` joins it to `businesses.js`, so the photo, name and phone
come from the directory rather than being duplicated.

**`entertainment.html` — Entertainment** — venue-kind chips + `.venue-grid`, and a
**Tonight in Seattle** widget in the sidebar fed by `upcomingEvents(3)` from `events.js`.
Events answers "when", this section answers "where".

**`weather.html` — Weather** — the one section with no card grid: a navy current-conditions
card, a 12-hour scroller, a seven-day list and a regional table. Icons come from
`WEATHER_ICONS` in `logo.js`.

**`real-estate.html` — Real Estate** — the only new section with a filter column, built like
Auto's (accordion below 768px, sticky from 768px). Sale prices and monthly rents share one
numeric field, so `PRICE_STEPS` rebuilds the max-price options whenever the deal type changes.

**`city-map.html` — City Map** — a hand-drawn schematic (`MAP_SHAPES` in
`neighborhoods.js`), then `.hood-grid`. **The pins are HTML buttons positioned over the SVG,
not `<text>` inside it** — inside the SVG the labels scale with the drawing and reach 27px on
a desktop; as HTML they take `--text-xs` and a real 44px target. The page says out loud that
it is a schematic. Neighborhood counters are computed from `events.js`, `jobs.js` and
`real-estate.js` rather than stored, so they stay true as data is added.

**`qa.html` — Q&A** — topic chips + a list of native `<details>`. No JS for the accordion:
keyboard and screen readers work on their own.

---

**`auto/index.html` — Auto catalog**

1. Auto subnav — Catalog / Add a Car / My Listings (on all four Auto pages).
2. 728×90 ad.
3. Section head — "AllSeattle Auto" / **Cars for Sale** + "+ Post a Listing".
4. `.auto-layout` — filter aside (Make, Max price, Min year, Max mileage, Sort by, Reset, plus a
   300×600 ad; collapses into an accordion below 768px) | results: count line + car grid *(JS)*,
   inline ad after card 4.

**`auto/listing.html` — Car detail** (reads `?id=` — an unknown id silently falls back to the
first car)

1. Auto subnav.
2. "← Back to catalog".
3. `#listing-root` *(JS)*: header (title + price) → `.listing-layout` — gallery, Description,
   Specifications table | seller card with the inline contact form, plus a 300×250 ad.
4. **Similar Cars** — up to 3 cards, same make or body type.

**`auto/add-listing.html` — Add a Car** (container capped at 720px)

1. Auto subnav.
2. Section head — "AllSeattle Auto" / **Post Your Car**.
3. Step indicator *(JS)* — Vehicle / Condition / Contact / Review.
4. Four form steps, one visible at a time: **Photos & Vehicle**, **Condition & Price**,
   **Description & Contact**, **Review Your Listing** (a read-back of everything entered).
5. Back / Next / Submit.

**`auto/my-listings.html` — My Listings** (container capped at 760px)

1. Auto subnav.
2. Section head — "Your Account" / **My Listings** + "+ Post a Listing".
3. Note that the account system does not exist and the data is fixed.
4. Listing rows *(JS)* — 3 fixed cars, Edit / Delete flash "Demo only".

### Path depth is the biggest trap here

Only `partials.js` is depth-independent (`SITE_ROOT`). **Mock-data image paths are written
relative to the page that consumes them, not to the site root**: `news.js` / `businesses.js` /
`contest.js` use `img/news/...` (root pages), while `cars.js` uses `../img/cars/...` because
`CAR_LISTINGS` is only rendered from pages inside `auto/`. Home imports `CAR_LISTINGS` but uses
only `.length`, which is why nothing breaks today. If you ever render car photos from a root-level
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

- `heroMarkup(pageType)`: one component, two heights. `.hero-frame` holds the photo, a shade
  gradient, the weather plate, the search form, and — on inner pages only — the script wordmark.
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
(seeds like `home-left-1`, `news-side-1`, `auto-filter-ad`); their mobile echoes are emitted from
the page module, either inline after the 4th card or into a `<div id="mobile-footer-ads">` at the
end of the sidebar.

`mountAdSlots(root)` does a lazy pass over `[data-ad-slot]` elements (reads `data-ad-slot` /
`data-ad-slot-mobile` / `data-ad-seed` attributes) and is safe to call again after any `innerHTML`
re-render (e.g. after filtering).

### Mock data (`js/mock-data/*.js`)

Plain exported arrays/constants, no fetch, no build-time generation — `news.js`, `businesses.js`,
`cars.js`, `contest.js`, `pricing.js`, plus one per new section: `jobs.js`, `events.js`,
`shopping.js`, `entertainment.js`, `weather.js`, `real-estate.js`, `neighborhoods.js`, `qa.js`.

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
- **Choose a Package** (`pricing.js`, modal) → `.success-panel`, then closes + reloads.
- **Add a Car** (`auto-add-listing.js`, 4-step wizard) → replaces `#add-listing-content` with a
  "sent for moderation" panel.
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

Same shape everywhere: import mock data + `banner-ads.js` / `reveal.js` / `format-time.js` /
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
  and fine at this data volume. After each re-render they call `mountAdSlots(grid)` **and**
  `initScrollReveal(".reveal-on-scroll", grid)`; forgetting either leaves new cards permanently
  invisible or leaves empty ad boxes.

### Shared helpers

- `validation.js` — `validate(form, data, rules)` runs a `{fieldName: (value, data) => message |
  null}` rule map, writes inline errors via `showError()` / `clearErrors()` (toggles an `.invalid`
  class + `aria-invalid` + a `.field-error` text node inside the element with `data-field="name"`).
  Every form on the site uses this pattern, plus the shared `isEmail()` / `digits()` predicates for
  the recurring "an email or a phone, either is fine" contact rule.
- `reveal.js` — `initScrollReveal(selector, root)` fades/slides in `.reveal-on-scroll` elements
  via `IntersectionObserver`, skipping anything already `.is-visible` (so it's safe to call again
  after a partial re-render) and short-circuiting to "everything visible immediately" under
  `prefers-reduced-motion` or if `IntersectionObserver` is unavailable.
- `format-time.js` — `relativeTime(iso)` ("2 hours ago" / "Yesterday" / falls back to a date
  after 7 days) and `formatViews(n)` (1200 → "1.2k").
- `modal.js` — generic overlay open/close/Escape/backdrop-click wiring by element id
  (`wireModal(overlayId, openBtnId, closeBtnId)`; pass `null` for the open button when the page
  opens it itself, as `pricing.js` does per tier card).
- `logo.js` — the brand mark, as vector, plus every icon on the site. `pinSvg()` draws the red
  teardrop + white disc + navy Space Needle; `logoLockupMarkup({href, variant})` wraps it with
  the wordmark (see "The logo" below). It also exports three icon maps as inline SVG strings:
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

The lockup is **half SVG, half live text**, and that split is deliberate: `pinSvg()` draws the
pin, but "AllSeattle" and the "Seattle City Website" tagline are real HTML in Libre Franklin
(`.site-logo-word` / `.site-logo-tag`). It used to be a single flat PNG, which meant the tagline
was an illegible smudge once downscaled to header size, and the opaque near-white background
forced a white plate behind the logo on both the photo hero and the navy footer. Live text stays
crisp and recolors with CSS, which is what makes the plates unnecessary.

- **One knob for size**: every part scales off `--logo-h` on `.site-logo`. Mobile-first, so 36px
  is the base and 46px arrives at 640px; the footer pins its own 40px. Don't set pixel sizes on
  the pieces.
- **`variant: "dark"`** (`.site-logo--dark`) flips the wordmark and tagline to white for the photo
  hero and the navy footer. The red "All" and the pin are left alone — they read on either.
- **Needle sizing**: the Space Needle paths are drawn at a convenient size and then scaled about
  the white disc's centre with a `transform` on the `<g>`, so the disc radius and the needle size
  can be tuned independently instead of rewriting every path.
- **Two copies of the path data exist**: `js/logo.js` and `img/icons/favicon.svg`. The favicon has
  to be standalone (no font, no gradient, and a square viewBox so browsers don't distort it into a
  square tab slot), so it can't import from the module — **edit both if the mark changes.** All 9
  pages point at that one file; don't go back to inlining a `data:` URI per page.
- `img/icons/logo-lockup.png` is now an unused raster export of the same vector (transparent,
  1165×302), kept only for decks/email. Nothing on the site loads it — if the mark changes, either
  re-export it from the vector or ignore it, but don't wire it back into a page.

### CSS structure

`tokens.css` (colours, fonts, **the spacing / type / radius scales**, `--container`,
`--header-height`) → `base.css` (reset + `.container` / `.btn` / `.field` primitives) →
`header.css` / `footer.css` → `components.css` (cards, ad-slot, forms, badges, modals — shared
across pages) → `css/pages/*.css` (one file per page, layout only). Same load order in every HTML
file's `<head>`; keep it that way since later files are relied on to override earlier ones at
equal specificity in a few places. (The one page that used this to widen `.container` — Auto's
`.auto-container` — is gone: every page now shares one width.)

**Everything is built from tokens** — see `design.md` above. Concretely: spacing comes from
`--space-1..--space-32` (4/8/12/16/24/32/48/64/96/128), type from `--text-xs..--text-5xl`
(14/16/18/20/24/30/36/48/60), radii from `--radius-sm|--radius|--radius-lg|--radius-full`
(8/12/16/full). A raw `18px` or `10px` in a rule is a defect, not a style choice.

Four tokens are **responsive and redefined by breakpoint inside `tokens.css` itself**, so the
whole responsive spacing scale lives in one file instead of being spread across thirteen:
`--gutter` (container side padding, 16/24/32), `--section-y` (vertical section padding, 64/80/96),
`--grid-gap` (grid gutters, 16/24) and `--card-pad` (card inner padding, 24/32). Change the scale
there, not at the call sites. (`--gut` from the old code is gone; `.grid` uses `--grid-gap`.)

**Breakpoints are mobile-first `min-width` at 640 / 768 / 1024 / 1280, plus 1440** — base rules are the
narrow-screen state and each query only adds what wider screens get. There are no `max-width`
queries left apart from `prefers-reduced-motion`; don't reintroduce one.

**`.side-layout` / `.side-rail` in `components.css` are the shared "content + sticky sidebar"
frame**, used by News-style pages and by six of the eight newer sections. Reach for them instead
of copying the block into another page file — that copy is exactly the "different style for the
same component" §9 bans. A page file should only hold what is genuinely its own: its card grid's
columns and its own components. `.ad-slot-top` and `.result-count` live there for the same
reason.

Three traps this layout has already hit once each:

- **`.ad-slot--desktop` / `.ad-slot--mobile-only` sit on the same element as `.ad-slot`**, which
  is `display: flex`. Restore their visibility with `display: flex`, never `block` — `block`
  silently wins and the slot's caption stops centring vertically.
- **The ad desktop/mobile swap must stay on the same breakpoint as the sidebar collapse** (both
  1024px now). If they diverge, tablet widths get a collapsed sidebar still showing desktop-sized
  ad boxes.
- **A grid column defaults to `min-width: auto` and inflates to fit its content.** An element
  with its own `overflow-x: auto` inside one does not clip — it widens the column and then the
  page. Weather's 12-hour scroller stretched a 375px viewport to 1017px this way, with the media
  queries still reporting 375px, so the page looked correct in CSS and wrong on screen.
  `.side-layout > * { min-width: 0 }` is what holds it.

`position: sticky` is used for the site header (see partials.js note above) and for the
sidebars on News, Directory and Auto (`top: calc(var(--header-height) + var(--space-2))`). They
do not all start at the same width: Auto's filter column sticks from **768px**, because that is
where it stops being an accordion, while News and Directory only get a sidebar at all from
**1024px**. Home's two sidebars are deliberately `position: static` so they scroll away with
the page instead (an explicit, non-default choice — don't "fix" it back to sticky without checking
history first).

**`--header-height` is a measurement, not a guess** — 116px while the header is two rows,
96px from 1024px where it collapses to one. Those sidebar offsets are computed from it, so if
you change the header's rows, padding or logo size, re-measure it and update the token in
`tokens.css`; leaving it stale wedges the sidebars under the header or floats them below it.

Two adjacent `<section class="section">` elements would otherwise stack their own vertical
padding and put 192px between them, twice what §1 allows. `main > .section + .section` zeroes
the second one's top, so the gap is the single `--section-y`. Home is currently the only page
with two sections; the rule is there so the next one doesn't have to rediscover this.

Page modules do use inline `style="..."` for small one-off spacing inside template literals. That's
the established local idiom, not an accident — matching it is fine; converting it all to classes is
churn.

#### Agreed deviations from `design.md`

Each of these was decided explicitly. Don't "fix" them back:

- **`--container: 1600px`**, not the 1200–1280 of §3. Deliberately wide: the previous split
  (1180 on most pages, 1400 on Home and Auto) made content jump 110px horizontally when moving
  between sections, which §3 bans in its own right. One width everywhere trades a bigger
  deviation on the number for compliance on the alignment, and the user asked for the narrower
  side margins.
- **A fifth breakpoint at 1440px** beyond §8's four, used only to give the card grids a third
  column (`.news-layout .news-grid`, `.directory-layout .biz-grid`, `.auto-results .car-grid`).
  Without it the 1600px container inflates a card from 384px to 594px and its text runs past the
  75-character limit of §2. Measured: three columns need 1440px to stay ~390px wide; at 1280px
  they collapse to 276px, which is why the threshold is not 1280.
  Scope these rules to their page wrapper — a bare `.news-grid` would also hit Home, where the
  same class sits between two sidebars and a third column would leave ~300px.
- **The first section of every page gets 32px of top padding instead of 96px**
  (`main > .section:first-child`). §1 allows an exception for the block adjoining the hero, and
  that is exactly what this is — it sits directly under the sticky nav. Spacing *between*
  sections is untouched at 96px.
- **Base text is 16px on mobile, 18px from 1024px** (§2) — but the site keeps a dense,
  portal-like feel, so most secondary text sits at `--text-xs` (14px), the floor of the scale.
- **Text below 14px survives in exactly two places**, both marked in the CSS: the captions inside
  ad placeholders (`.ad-slot-label` / `-tier` / `-status`), which otherwise stop fitting a
  320×100 box, and `.site-logo-tag` plus `.hero-script`, which are brand artwork rather than
  text to read.
- **`.btn-sm` is 40px tall**, which §6 explicitly allows for buttons even though §8 asks for
  44px touch targets generally.
- **Inline text links inside prose are not padded out to 44px** (footer contact lines,
  "Read more →"). Inflating them would wreck the line rhythm; the surrounding controls all meet
  44px.
- **The header stages its right-hand cluster by width, and two of its controls sit under 44px.**
  Measured on the live page: logo 178px, the row of 8 secondary links 553px (the wider of the
  two nav rows), the utility cluster 100px with ENG and the account icon, 236px once Register
  Business joins. Centring uses `1fr auto 1fr`, so the side columns end up as wide as the wider
  of logo and cluster — which is why Register Business waits until 1280px rather than 1024px.
  Below 1024px the two nav rows merge into one scroller instead. The secondary links are 36px
  tall and the ENG switch 32px from 1024px up: §8's 44×44 rule is in the responsiveness section
  and is about touch, and at those widths the pointer is a mouse — on touch widths both are back
  to 44px. **If you add a nav item, lengthen a label, or put anything back into the cluster,
  re-measure** — the first thing that breaks is `.nav-links` quietly turning into a horizontal
  scroller at desktop width, and the second is the nav sliding off centre.
- **Three font families**, not two (§2) — Pacifico is the brand script in the inner hero.

### Images (`img/`)

Real stock photography (Unsplash/Pexels), downloaded once and stored locally so the demo works
offline in front of a client — never hotlink external image URLs here. Organized by section
(`hero/`, `news/`, `business/`, `cars/`, `contest/`, `icons/`); `cars/` photos are per-listing
(`c1-1.jpg`, `c1-2.jpg`, ... matching a car's `id` in `cars.js`), the rest are curated pools reused
across entries where the mock data needs more variety than there are unique photos.

**The eight newer sections have no folder of their own** — there is nowhere to get new photos
from and downloading them would break the offline guarantee, so Events, Real Estate, City Map
and Entertainment draw from `news/`, `business/` and `hero/`. Jobs, Weather and Q&A carry no
photos at all, which is a design choice as much as a constraint: a list of job titles reads
faster without them. If real photography ever arrives for a section, give it its own folder
rather than growing the shared pools.
