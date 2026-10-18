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
`--space-1`); both rows stay centred on the logo–utilities gap (measured 0.0px).
18.10.2026 (client): Cars has one sub-link, **Services**. "For sale" (= /cars) was removed from the
Header global as a duplicate of Cars, and `.nav-sub` links are drawn exactly like the main items
(navy 700, red underline when active; they were smaller and grey, with "/"), 12px after Cars like any
neighbour. On /cars/services only Services is active, not Cars (`NavLinks`). Services carries a
wrench icon (`tools` in `icons.tsx`, chosen by URL in `NavLinks` `SUB_ICONS` — sub-links have no
icon field and adding one would be a schema change). Same day, "centre the whole row": **from 1280
the header grid is `1fr auto 1fr`**, so both menu rows sit on the banner's axis (measured equal at
1280/1440/1920; were 26–35px left of it, centred in the logo–utilities gap since 03.10.2026). At
1024–1279 there is no room (row ≈600px, logo 186), so the old `auto 1fr auto` stays there. The photo
banner and the announcement plates are skipped on `/add-business` (`HiddenOn` in the layout,
list `CHROME_FREE_PAGES`; renders nothing, so the photo isn't downloaded there). Since 14.10.2026 `PLATE_FREE_PAGES` / `PLATE_FREE_SECTIONS` drop only the announcement plates and keep the photo (client): `/share-news` (until 16.10.2026, when it moved to `CHROME_FREE_PAGES` — no photo either, header → eyebrow box 48px like /add-business; `PLATE_FREE_PAGES` is empty now) — the photo banner's bottom to the page eyebrow is then 48px at 375 and 1440. Since 15.10.2026 every page under `/account` goes without the photo too (`CHROME_FREE_SECTIONS`; `HiddenOn`'s `sections` matches a path and everything below it) — client. On that page the
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

**App footer on phones and tablets, 09.10.2026 ("do something with the footer"):** the column
layout now starts at **1024**, not 640 — tablets got three narrow columns with the copyright
broken into "All rights / reserved." and empty space on the right. **640–1023** is a stretched
phone: logo left + the 44px round social icons right; Contact (1fr) and Explore (2fr, 3
sub-columns, links 44px tall) side by side; under a hairline the copyright left and the
"Developed by · Alexander" pill right on one line (centres equal). **Phones:** copyright and
credit centred across the footer (`.footer-copy-stack` is a full-width flex column); the meta
links are inline text with `text-wrap: balance` — two even lines (3 + 2) instead of four and a
lone "Terms of Use". The credit pill is 44px tall below 1024 (32 with a mouse), and its 6px
nudge applies from 1024 only. The 1024 block resets everything the tablet sets (tablet rules
that touch the copy stack carry `.footer-copy` in front — the base stack rule sits later in the
file). Desktop measured identical before/after: 266px at 1024, 219 at 1440.

**App footer columns, 09.10.2026 ("even spacing between Contact, Follow us and Explore"):** from
1024 the four columns are sized by their content (`minmax(0, max-content) repeat(3,
max-content)`) with `justify-content: space-between`, so the visible gaps are equal — 66 / 119 /
172px at 1280 / 1440 / 1920 (were 25 / 109 / 91 at 1440 with `1fr 1fr 1fr 2.2fr`). Explore's
sub-columns are 32px apart from 1280, 16 below. At 1024–1279 everything barely fits (four
max-content columns are 971px against 945), so the brand column may shrink (the copyright wraps):
Contact / Follow / Explore stay 16px apart there, brand → Contact is a little wider. Footer height
unchanged (266 at 1024, 219 at 1440).
Then the same day "shift everything left so Contact is where it was, keep the new gaps": the grid
is seven tracks — the old brand share `calc((100% − 48px) / 5.2)`, 16px, Contact, `--footer-gap`,
Follow, `--footer-gap`, Explore (items in tracks 1/3/5/7, `column-gap: 0`). `--footer-gap` is
what space-between gave: `(100% − 1019px) / 3` from 1280 (the four columns' box widths), `max(16px,
(100% − 987px) / 3)` below (Explore's sub-columns are 16px there). One value for both gaps, so
they are always equal; only their size and the free space on the right depend on the column text.
Measured: Contact at 220.5 / 272.6 / 303.4 / 494.1 (= the old grid) at 1024 / 1280 / 1440 / 1920,
gaps 66 / 119 / 172 from 1280. At 1100–1279 the brand column is narrow again and the copyright
wraps, as with the old grid. Then "too much empty space on the right, everything a bit right":
from 1280 the track after the brand is 16 + 48px, so Contact / Follow / Explore sit 48px further
right with the same gaps (Contact 351 at 1440, Explore ending 1297 of 1393). Below 1280 no shift —
about 50px are left on the right at 1024.

**App, 12.10.2026 (client):** the photo banner's corners are rounded again — `.hero-photo` /
`.hero-shade` take `border-radius: var(--radius-lg)` directly (business.css): `inherit` read the
radius from the `<picture>` wrapper, which has none, so the photo drew square corners over the
rounded frame (the frame itself is `overflow: visible` for the search suggestions). The logo is
the full 560×180 `logo.webp` again, as in the prototype — the 372px q0.86 copy blurred the
"Seattle City Website" line (the 372 files are now unused, not deleted). The header's top row is
Home · News · Business Directory · **Advertising** · Cars (seed menu, megaphone icon); the footer
still lists Advertise once, in the bottom bar (`SiteFooter` drops `/advertise` from the section
grid; the seed no longer adds it twice). The contact address is AllSeattle.info@gmail.com (Site
settings, seeded) — footer, and a `ContactEmail` line on Contact, Advertising and Add your
business.

**App footer, 12.10.2026:** with the real address in Contact (AllSeattle.info@gmail.com instead
of "Coming soon") the four content-width columns no longer fit at 1024–1279 (every page scrolled
sideways by 21px at 1024), so the column layout now starts at **1280** and 1024–1279 uses the
tablet layout (logo + icons, Contact | Explore, copyright | credit). The credit's 6px nudge moved
to 1280 with it. The address may wrap inside the narrow tablet Contact column
(`.footer-contact a { overflow-wrap: anywhere }`). Measured: no overflow 320–1920; 1440 unchanged
(219px tall, Contact at 351).

**App footer, 15.10.2026 (client):** the "Developed by · Alexander" pill links to WhatsApp
(`https://wa.me/380958191272`, green `#25d366` icon circle) instead of Telegram; size and position
unchanged (32px pill at 1440, 44px on phones).

**App footer, 16.10.2026 (client: "not a famous company — smaller, quieter"):** the credit is a
plain text link "Developed by Alexander" (no pill, no icon; still WhatsApp), 14px, `#5f6f82`
(hover `#c9d3de`), in its old place under the copyright (`.footer-copy-stack`): centred under it
on phones and from 1280, on its right in the same row on tablets. It spent an hour at the right
end of the meta bar; the user asked for it back under the logo. Same day: 8px less above and
below the meta bar's line (`.footer-meta-bar` margin-top −8px into the columns' bottom padding,
`.footer-meta` without its 8px top/bottom padding; links stay 44px tall) — at 1440 the lowest
column text → line 10px, line → link box 1px, link box → footer bottom 0.
