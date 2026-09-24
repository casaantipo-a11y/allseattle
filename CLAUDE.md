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

No build step, no package.json, no test suite — verification is always manual, by running the
static site locally and clicking through it (or via a headless-browser screenshot pass).

```powershell
# from inside this folder — relative asset paths and ES modules need real HTTP, not file://
python -m http.server 8000          # Python 3.13 is on PATH on this machine
# then open http://localhost:8000/
# for a phone on the same LAN: add --bind 0.0.0.0, browse to the machine's LAN IP instead of localhost
```

## Architecture

### Page shape

9 standalone HTML files (`index.html`, `news.html`, `contest.html`, `directory.html`,
`pricing.html`, `auto/index.html`, `auto/listing.html`, `auto/add-listing.html`,
`auto/my-listings.html`), each a `<head>` of the same CSS links + a `<body data-page-type="home|
inner" data-page="...">` with two empty mount points (`<div id="site-header">`,
`<div id="site-footer">`) and a `<main>`. All real content is injected by JS at
`DOMContentLoaded` — there's very little to see in the HTML source itself.

- `data-page-type` picks the full hero-photo treatment (`"home"`) vs. the compact inner hero
  (anything else) in `partials.js`.
- `data-page` drives active-nav-link highlighting (`nav-active.js` matches it against each nav
  link's own `data-page`).
- Pages under `auto/` load CSS/JS via `../` relative paths; root pages use plain relative paths.
  `partials.js` itself resolves the site root at runtime via
  `new URL("../", import.meta.url).href` (`SITE_ROOT`), so the same module works from any page
  depth regardless of how it was reached.

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

**The sticky nav (`<header class="site-header" id="site-header-functional">`) is rendered as a
sibling of the `#site-header` mount div, not nested inside it.** `renderHeader()` sets
`mount.innerHTML` to the hero markup only, then does
`mount.insertAdjacentHTML("afterend", functionalHeaderMarkup(pageType))` to place the nav after
it, both as direct children of `<body>`. This is load-bearing: `position: sticky` computes its
"room to stick" from the element's own parent (containing block). Nesting hero + nav in the same
mount div means that parent's box ends right at the nav's own bottom edge — zero room to stay
pinned, so it silently degrades to acting like `position: static` despite the CSS being correct.
Keep the nav a sibling of `<main>` if you touch this again.

- `heroMarkup()` (home only): the tall photo (`hero-collage`) with weather/logo/search overlaid
  directly on it via `.hero-overlay-header` (see header.css below), plus the 5-icon strip
  (`HERO_ITEMS`) below.
- `heroInnerMarkup()` (every other page): a short navy strip with a dimmed version of the same
  photo as its CSS `background-image`, the small "Seattle / THE EMERALD CITY" wordmark, and a
  compact version of the same icon strip.
- `headerTopMarkup()` (weather + logo + search) is shared markup reused in two different visual
  contexts: overlaid on the photo for Home (`.hero-overlay-header .weather-stub` etc. in
  header.css override the base colors for legibility against a dark photo), and in its own plain
  white bar below the compact hero for every other page (base `.weather-stub` / `.site-logo` /
  `.search-stub` styles, unscoped). `functionalHeaderMarkup(pageType)` only renders it for
  non-home pages — home gets it via `heroMarkup()` instead, never both.
- The weather widget is a hardcoded stub (`weatherNow()`: always 61°F / Cloudy) with a live date
  string. The search box swaps its own placeholder to "Search is a demo placeholder" for 2.2s on
  submit — it never searches anything.
- `NAV_LINKS` (5 real pages) vs. `NAV_DISABLED` (Jobs/Events/Shopping/Entertainment/Weather,
  inert `onclick="return false"` placeholders) are separate arrays rendered into the same
  `<ul class="nav-links">`; a CSS adjacent-sibling selector in header.css pushes the whole
  disabled group to the right edge of the nav row regardless of how many real links precede it.
- `headerTopMarkup(variant)` takes `"dark"` only from `heroMarkup()`, where the bar is overlaid on
  the photo; that flips the logo's wordmark to white. `renderFooter()` passes `"dark"` too.

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
`ad-slot--desktop` / `ad-slot--mobile-only` CSS classes at the 760px breakpoint), and its separate
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
`cars.js`, `contest.js`, `pricing.js`. The **only** thing in this entire site that touches
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
- `logo.js` — the brand mark, as vector. `pinSvg()` draws the red teardrop + white disc + navy
  Space Needle; `logoLockupMarkup({href, variant})` wraps it with the wordmark. See "The logo"
  below. Also exports `SOCIAL_ICONS` as inline SVG strings.

### The logo

The lockup is **half SVG, half live text**, and that split is deliberate: `pinSvg()` draws the
pin, but "AllSeattle" and the "Seattle City Website" tagline are real HTML in Libre Franklin
(`.site-logo-word` / `.site-logo-tag`). It used to be a single flat PNG, which meant the tagline
was an illegible smudge once downscaled to header size, and the opaque near-white background
forced a white plate behind the logo on both the photo hero and the navy footer. Live text stays
crisp and recolors with CSS, which is what makes the plates unnecessary.

- **One knob for size**: every part scales off `--logo-h` on `.site-logo` (46px in the header,
  40px in the footer, 36px under 460px). Don't set pixel sizes on the pieces.
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

Two traps this layout has already hit once each:

- **`.ad-slot--desktop` / `.ad-slot--mobile-only` sit on the same element as `.ad-slot`**, which
  is `display: flex`. Restore their visibility with `display: flex`, never `block` — `block`
  silently wins and the slot's caption stops centring vertically.
- **The ad desktop/mobile swap must stay on the same breakpoint as the sidebar collapse** (both
  1024px now). If they diverge, tablet widths get a collapsed sidebar still showing desktop-sized
  ad boxes.

`position: sticky` is used for the functional nav (see partials.js note above) and for
Directory / News / Auto's filter sidebars (`top: calc(var(--header-height) + var(--space-2))`,
from 1024px up); Home's two sidebars are deliberately `position: static` so they scroll away with
the page instead (an explicit, non-default choice — don't "fix" it back to sticky without checking
history first).

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
- **From 1024px the nav trims its horizontal padding and icon width.** The 44×44 rule lives in
  §8 (Адаптивность) and is about touch; at desktop widths the ten nav items plus the social icons
  do not fit the container otherwise, and the nav would fall into a horizontal scroll. Vertical
  size stays 44px.
- **Three font families**, not two (§2) — Pacifico is the brand script in the inner hero.

### Images (`img/`)

Real stock photography (Unsplash/Pexels), downloaded once and stored locally so the demo works
offline in front of a client — never hotlink external image URLs here. Organized by section
(`hero/`, `news/`, `business/`, `cars/`, `contest/`, `icons/`); `cars/` photos are per-listing
(`c1-1.jpg`, `c1-2.jpg`, ... matching a car's `id` in `cars.js`), the rest are curated pools reused
across entries where the mock data needs more variety than there are unique photos.
