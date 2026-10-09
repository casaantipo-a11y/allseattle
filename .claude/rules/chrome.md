---
paths:
  - "*.html"
  - "auto/*.html"
  - "js/partials.js"
  - "js/logo.js"
  - "css/header.css"
  - "css/footer.css"
  - "js/mock-data/weather.js"
  - "app/src/components/SiteHeader.tsx"
  - "app/src/components/NavLinks.tsx"
  - "app/src/components/HeroBanner.tsx"
  - "app/src/components/SiteFooter.tsx"
  - "app/src/app/*/styles/header.css"
  - "app/src/app/*/styles/footer.css"
---

<!-- Moved verbatim from CLAUDE.md (lines 190-319) on 02.10.2026; loads only when a matching file is read. -->
# Page shape and shared chrome (header, banner, footer)

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

- `data-page-type` no longer changes the photo banner: since 29.09.2026 every page gets Home's
  full frame (200 / 230 / 270 / 340px by breakpoint in `header.css`), at the user's request. The
  short inner frame (`.hero-banner--inner`, `--hero-inner-h`), its "Seattle / THE EMERALD CITY"
  script wordmark and News's +12px override are gone. The attribute is still set on every page
  and still read by `partials.js`, so it's there if a page ever needs to differ again.
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

**Every block below opens with a `Code:` line** — the markup, the page stylesheet, the page
module with the functions worth opening first, and the mock data it reads. It names files and
functions rather than line numbers, which go stale the first time anyone edits above them;
the function names are greppable. What the line deliberately leaves out is everything shared,
because it would repeat on all 17 rows: cards, ad slots, forms, badges, modals and the compact
newsfeed row are in `css/components.css`, the ad placements in `js/banner-ads.js`, the header,
banner and footer in `js/partials.js`, and the scales in `css/tokens.css`. **Keep the line
current when a page gains or loses a file** — a pointer to a module that no longer exists is
worse than no pointer.

**Shared chrome, on all 17 pages** (from `js/partials.js`):

**Code:** [js/partials.js](js/partials.js) (`siteHeaderMarkup()`, `heroMarkup()`, `renderFooter()`, `NAV_LINKS`) · [css/header.css](css/header.css) · [css/footer.css](css/footer.css) · marks and icons [js/logo.js](js/logo.js) · the weather stub [js/mock-data/weather.js](js/mock-data/weather.js)

1. **Sticky header** — logo at the left, two rows of nav (5 real links with icons on top, 8
   smaller sections underneath) **centred in the header**, and a short utility cluster at the
   right: the inert ENG switch, Register Business, account icon. Identical on all 17 pages.
   The centring is a `1fr auto 1fr` grid, so the nav block keeps its own intrinsic width and
   the equal side columns push it to the middle. It only fits because the weather and the
   social icons moved out — with them the cluster was 564px wide and there was nothing to
   centre.
   **The app (`app/`) centres differently since 03.10.2026**, at the user's request: from
   1024px its grid is `auto 1fr auto`, so the nav sits in the middle of the *gap between the
   logo and the utilities*, not of the screen. The utilities are wider than the logo, so the
   nav sits left of the banner's axis. Services / For sale are in flow at every width (from
   1360 they used to hang outside the row, which left the second row visibly ~75px left of
   the visible first row; removed the same day so both rows share one axis), and the last
   sub-link gets `--space-3` right padding from 1024 to mirror Home's left padding. Measured
   at 1024 / 1280 / 1440 / 1920: gap centre, first-row text centre and second-row text
   centre agree within 0.01px; gaps both sides 33.5 / 92.5 / 172.5 / 260. The prototype
   keeps `1fr auto 1fr`.
2. **Photo banner** — the skyline inside `.container`, rounded, with three things laid over it:
   the **weather plate bottom-left** (`.hero-weather`, a link to `weather.html`), the search box,
   and nothing else (the inner pages' "Seattle / THE EMERALD CITY" wordmark was removed on
   29.09.2026). The same tall frame on every page. This is page content, not chrome: its edges
   line up with every other block on the page.

   They share 200–340px of height, and the arrangement is the result of measuring collisions
   rather than taste:

   - **The weather plate is one line below 1024px and three lines from 1024px up**, on every
     page. Below 1024 the search bar runs along the bottom and the full 79px plate would sit on
     it.
   - **The plate is translucent white (0.7) over `backdrop-filter: blur(10px)`.** The blur is
     load-bearing, not decoration: dark patches of the photo otherwise show through in blotches
     right under the letters. Measured against the darkest 5% of the backdrop, the readable text
     is navy rather than slate for the same reason — slate lands at 3.9:1 there, under §4's 4.5.
     Navy holds 8.9:1 and up. The red "no precipitation" line is 2.2:1 and fails, as it already
     did at the old 0.94 (red on white is only 3.8:1 to begin with); it shows on Home desktop
     only. Going more transparent than 0.7 means either dropping the dark-on-light plate for a
     dark one with white text, or accepting that the temperature line fails AA too.
   - **Below 1024px the search is a full-width bar along the bottom**, so the plate cannot sit in
     the corner. It sits directly on top of the bar instead, at
     `calc(var(--space-4) + var(--search-h) + var(--space-2))`. `--search-h` is declared on
     `.hero-frame` and consumed by both, so changing the search height moves the plate with it.
     From 1024px the search moves to the top-right and the plate takes the actual corner.
   - **The wordmark is hidden below 1024px.** On a 140px frame there is no room for a third
     element beside the plate and the bar, and the logo in the header already carries the mark.
3. **Contest strip** — Home only, and rendered by `home.js`, not `partials.js`.
4. `<main>` — the page's own `<section>`(s), listed below.
5. **Footer** — four columns in one band: logo with the copyright under it, Contact,
   Follow us, Explore. Everything the old footer said is still there; it is roughly half as
   tall (383px → 192px at 1440, 989px → 585px at 375) because two things that cost height
   were fixed. The three social icons no longer sit under the logo as a separate row — they
   are the same three networks "Follow us" already listed, so each icon moved next to its
   handle and that freed a whole column. And Explore, which lists **every** section and is
   what actually sets the footer's height, now picks its own column count
   (`repeat(auto-fill, minmax(100px, 1fr))`): two on a phone, up to five on a wide screen,
   instead of a fixed two everywhere. The separate copyright strip is gone too; that line
   lives under the logo. Explore is still built from the same `NAV_LINKS` / `NAV_SECONDARY`
   arrays as the nav, so a new section appears in both at once, and it is still the only way
   to reach the secondary sections on a phone without scrolling the nav row sideways —
   **if you add one, re-check that its label is under 93px** ("Entertainment" is the current
   longest and the 100px column threshold is measured from it).

   **Below 640px the footer is its own compact layout** (27.09.2026 — stacked, it was 585px of
   navy on every phone page): a grid with areas `logo social / contact / explore / copy`,
   `.footer-brand` as `display: contents` so the logo and the copyright land in different
   areas, the three networks as 44px round icon buttons (the handle moves into the link's
   `aria-label`, the visible label shows from 640px), no Contact / Follow us / Explore
   headings, and Explore's 13 links folded under an **Explore all sections** button
   (`#footer-explore-toggle`, wired in `renderFooter()`; the list gets `.is-open`, links
   44px tall). ~304px closed, ~532px open. Below 360px the icons drop under the logo —
   side by side they inflated a 320px page to 334. From 640px every one of those rules is
   reset and the column layout below applies unchanged (306px at 768, 217 at 1024, 192 at
   1440 — measured identical before and after).

   **One gutter, 16px, everywhere in the footer.** The columns and Explore's sub-columns used
   to sit on 24px and 16px respectively, and the sub-columns read as visibly tighter than the
   rest. They are one value now, and it is the smaller one on purpose: at 24px the auto-fill
   loses a sub-column on a phone, at 1280 and at 1920, which puts the height back. The three
   text columns are `1fr` each for the same reason — the brand column used to be narrower than
   its neighbours, so the left edges stepped 258 / 294 / 293 instead of evenly. Vertical
   spacing stays 24px (`row-gap`): that is the gap between stacked blocks on a phone, not
   between columns.

**App footer Explore (`app/`, 04.10.2026):** the Footer global's Explore links are split in
`SiteFooter.tsx` — links whose URL is in the header menu are the **sections**, drawn as an even
3-column grid from 640px (`repeat(3, minmax(max-content, 1fr))`, 9 sections = 3 × 3); everything
else (Advertise, About, Contact, Privacy Policy, Terms of Use) is `.footer-meta`, a centred quiet
line under a hairline in the copyright colour (#8695a6, red on hover), always visible — on a
phone too, outside the "Explore all sections" fold, which makes the phone footer ~100px taller.
No CMS change: adding a section to the header menu moves its footer link into the grid. The hairline and the
centre of that line end at the **last character of the third column** ("City Map"), not at the
block's edge (client, same day): sections and meta share one 4-column grid in
`.footer-explore-body` — two thirds of the Explore width (`100cqw`, `.footer-explore` is an
inline-size container from 640), a `max-content` third column, the rest — with the sections `ul`
as `display: contents` and the meta line on columns 1–3. Column positions are unchanged
(838 / 1028 / 1219 at 1440). Only when Explore is ≥450px (640–1023 and 1280+); at 1024–1279 it is
380px and keeps the plain grid with a full-width line. Also: the
"coming soon" social items are `.footer-social-soon` spans styled like the links, icon wrapper
`display: flex`, so the icons sit centred on their labels (measured 0.01px).

**App performance and announcements (06.10.2026).** The logo `<img>` uses 372x120 copies
(`public/brand/logo-372.webp`, `logo-dark-372.webp`, from the PNGs at q 0.86) instead of the
560px files — the logo is drawn at most 186x60; the footer copy is `loading="lazy"`. Banner
creatives are all `loading="lazy"` (a slot renders a desktop and a phone creative and hides
one; an eager hidden image still downloaded), lower slots `fetchPriority="low"`. Both cut
what competes with the header photo, the pages' largest paint on Lighthouse mobile.
Announcement plates: "highlight" (admin) draws the red outline + tint again — removed
04.10.2026, restored 06.10.2026 (spec §3 wants the contest plate in the accent colour). A text
that opens with a question ("Saw something newsworthy? Share the
news") hides the question below 640px (`.announcement-lead` in components.css — Tailwind's
`hidden` loses to the prototype's `.hidden { display: none !important }`).

**App changes of 07.10.2026.** Header: from 1024 the first-row links (Home … Cars) have
`--space-1` padding like the second row, so every gap between neighbouring items is 12px in
both rows (was 28 on top); "Services / For sale" sits 12px after "Cars" (`.nav-sub` margin
`--space-1`); both rows stay centred on the logo–utilities gap (measured 0.0px). The photo
banner and the announcement plates are skipped on `/add-business` (`HiddenOn` in the layout,
list `CHROME_FREE_PAGES`; renders nothing, so the photo isn't downloaded there). On that page the
Turnstile widget is centred in the form card with rounded corners (components.css). Footer: the
About / Advertise / Contact / Privacy / Terms links left Explore for a `.footer-meta-bar` at the
bottom of the footer — a hairline across the whole viewport and the links as one centred group
with 32px gaps (`--space-8`; a same-day edge-to-edge `space-between` version was "too far
apart"); centred and wrapped below 640. The 4-column container-query grid that ended the line
under "City Map" is gone. Admin login logo: white-lettered copy in the dark admin theme
(`AdminGraphics.tsx` + `custom.scss`).
Footer, 08.10.2026 (app): from 640 the brand column is as wide as its content
(`justify-self: start`) and the logo is centred over the copyright line and the "Developed by"
pill (wrapped copyright text centred too); the footer's bottom padding is 16px instead of 32, so
the meta-bar hairline and its links sit 16px higher. Phones unchanged. Then "too much empty space above the
line": the brand column was 23px taller than Contact / Follow / Explore, so from 640 the footer
logo is `--logo-h: 34px` (as in the header), brand gaps 8px, copyright → credit 4px; at 1440 the
blocks now end 24px above the line (was 39). In the narrow 1024 column "Developed by" wraps
whole above the pill (nowrap label, wrapping row) instead of breaking into two words.

The header sits *above* the banner, which is the inversion of how this used to work: the photo
was the page header and the nav came after it. The landmark icon strip (Space Needle / Downtown
/ Mount Rainier / Waterfront / Pike Place) that used to sit under the hero is gone — it was
decoration with no destination (§7) and the contest strip took its slot.
`img/hero/skyline-panorama.png` is still used; the five landmark jpgs beside it are now loaded
by nothing.

---

**App footer, 09.10.2026:** the "Developed by · Alexander" row (`.footer-credit`) sits 4px lower
(`position: relative`, the label moves with the pill so they stay one line), then 2px more:
`top: calc(var(--space-1) + 2px)`, 10px under the copyright line; the footer's height is unchanged.
