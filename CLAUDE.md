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

Two exceptions to "no network". Every HTML `<head>` pulls Libre Franklin / Public Sans from the
Google Fonts CDN — the local fallbacks in `--font-heading`/`--font-body` cover the text offline,
just not in the brand faces. And City Map
draws a real map from **OpenStreetMap tiles** (`tile.openstreetmap.org`); offline it degrades to
a grey panel with the neighborhood pins still on it. Everything else (images, CSS, JS — including
the Leaflet library itself, vendored in `js/vendor/leaflet/`) is local.

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

One deliberate deviation already ruled on by the user: inline `style="..."` in JS templates stays
acceptable per the CSS section below, despite `design.md` §9. (There used to be a third font,
Pacifico, for the inner hero's script wordmark; that wordmark was removed on 29.09.2026 and the
font with it — two families now, as §2 asks.)

## Section tags (`structure-ru.md`)

`structure-ru.md` (Russian) walks every page section by section, and each section carries a short
tag — `#home-news`, `#banner-weather`, `#footer-icons`, `#wx-hourly` and 120 more, with the full
index at the end of that file.

**A tag in the request is a scope, not a hint.** When the user names one — "#header иконки
соцсетей перенести в footer", "#home сделай карточки меньше" — read that section in
`structure-ru.md`, change only what it covers, and verify only the pages that actually render it.
Do not sweep the other 16 pages, do not re-audit the neighbouring components, do not rebuild the
page around it. Anything outside the tagged section stays untouched unless the change genuinely
cannot work without it — and then say so in the reply rather than quietly widening the job.

Two things a tag does not switch off, because the section's own correctness depends on them:

- **Shared chrome is shared.** `#header`, `#banner` and `#footer` are rendered by `partials.js`
  on all 17 pages, so a change inside one of those tags lands everywhere by definition. That is
  the section, not scope creep — but it also means the check has to cover more than one page.
- **Measurement still applies.** A tagged change is verified across the widths that matter to it,
  the way "Checking a layout change" describes. A narrow scope means fewer pages in the pass, not
  fewer measurements.

Keeping `structure-ru.md` current is part of the job: if a tagged section changes shape, update
its description and the index entry in the same commit, or the next tagged request points at
something that no longer exists.

When a request carries no tag, work the scope out from the request itself, as before.

## Environment & deploy

The working copy lives at `D:\allseattle`. The repo is
**`github.com/casaantipo-a11y/allseattle`** (public), served by GitHub Pages from `main` at
<https://casaantipo-a11y.github.io/allseattle/>.

Deploying is just pushing to `main` — Pages rebuilds on its own. Poll
`gh api repos/casaantipo-a11y/allseattle/pages/builds/latest` for `"status":"built"` on the new
commit SHA rather than assuming a push is live immediately; a build takes roughly a minute.

**Every stylesheet link carries `?v=<date><letter>`, and you bump it whenever you touch CSS.**
Pages serves assets with `Cache-Control: max-age=600`, so for ten minutes after a deploy a
returning browser keeps drawing the old stylesheet — twice the user reported a change as "not
applied" when the file on the server was already correct. The query string is what forces the
refetch. Bump it in all 17 `<head>`s at once (a one-line `re.sub` over `*.html` and `auto/*.html`
does it) in the same commit as the CSS change, or the fix ships invisible. **JS is not versioned**
— module imports would each need the query too — so a page-module change can still take up to ten
minutes or a Ctrl+F5 to show up.

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

### Fixed: the console error on `auto/listing.html`

For a long time that page threw `Cannot read properties of null` on every load, because
`auto-listing.js` imports `carCardTemplate` from `auto-catalog.js` and the import ran the catalog
module's `DOMContentLoaded` too, which then went looking for filter controls that only exist on
the catalog page. The handler now returns early unless `#car-list` is present. **Every page's
console should be clean** — an error anywhere is a real finding now, not the known noise.

The import itself is still the one cross-page-module import in the codebase, and the trap it
represents has not gone away: a new page module must never import from another page module
without that guard, which is why `bizRowTemplate()` is copied into `auto-catalog.js` instead.

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

The header sits *above* the banner, which is the inversion of how this used to work: the photo
was the page header and the nav came after it. The landmark icon strip (Space Needle / Downtown
/ Mount Rainier / Waterfront / Pike Place) that used to sit under the hero is gone — it was
decoration with no destination (§7) and the contest strip took its slot.
`img/hero/skyline-panorama.png` is still used; the five landmark jpgs beside it are now loaded
by nothing.

---

**`index.html` — Home** (`data-page-type="home"`, and the only page with two `<section>`s)

**Code:** [index.html](index.html) · [css/pages/home.css](css/pages/home.css) · [js/pages/home.js](js/pages/home.js) (`CARD_COUNT`, `newsTileTemplate`, `renderNewsList`, the four `render*Widget`) · data [js/mock-data/news.js](js/mock-data/news.js) · [js/mock-data/jobs.js](js/mock-data/jobs.js) · [js/mock-data/businesses.js](js/mock-data/businesses.js) · [js/mock-data/cars.js](js/mock-data/cars.js) · [js/mock-data/contest.js](js/mock-data/contest.js)
A three-column `.home-layout`. Below 1024px it becomes one column, but the asides do not simply
stack: the left aside's four slots are `.ad-desktop-slot` and disappear entirely, reappearing as
inline ads inside the news feed, while the right aside's widgets do stack below the feed.

0. Contest strip — outside `<main>`, between the banner and the first section.
1. Left aside — four ad slots: 300×250, 300×250, 300×600, 300×250.
2. Middle `.home-main`:
   1. Section head — "Today in Seattle" / **Top News** + "All News" button. It starts the
      column: the 728×90 `home-top` that used to sit above it was removed at the user's
      request, so Home carries six placements now, not seven, and `home-mid` is the page's
      only 728×90.
   2. News grid *(JS)* — 20 tiles, four across from 1440px (five rows), with inline mobile
      ads after cards 4 and 12.
   3. 728×90 ad (`home-mid`).
3. Right aside — a 300×250 ad **first**, then four widgets *(JS)*: **AllSeattle at a Glance**
   (4 stat tiles), **Job Board** (3 newest jobs from `jobs.js`), **Exchange Rates**,
   **City Transit**; then the mobile ad stack.
4. Second section — "More from Seattle" / **City Newsfeed**: the remaining articles as compact
   rows *(JS)*, thumbnail + category + relative time + headline + one clipped line.

**The 28 articles are split 20 + 8 and never repeated**, and no photo is used twice either —
the pools ran to exactly 28 between `img/news/`, `img/hero/` and `img/business/`. `CARD_COUNT`
in `home.js` is the one place that decides where the photo tiles stop and the newsfeed starts;
move it and both halves follow. `news.html` renders the whole array, so an article added here
adds a card to that page too — and the home stats widget counts `NEWS_ARTICLES.length * 6`.

**Five rows of four make the middle column roughly 900px taller than either aside.** Measured at
1440: middle 2001px, left rail 1242px, right 1448px. The rails simply end, so the last row and a
half sit between two empty margins. Filling that space means new ad placements, which is new
inventory to sell — a decision for the user, not a side effect of the next layout change.

**The middle column carries four tiles, not two cards** — the client asked for it, and the card
had to shrink to survive it. `.news-card--tile` in `home.css` is that compact variant: 16px of
body padding instead of 32, the headline at 16px clamped to three lines, the lead clamped to two,
the byline and "Read more" gone, and from 768px the relative time sits under the category rather
than beside it. The full `.news-card` from `components.css` is untouched and still runs on
`news.html`.

Three things about it were settled by measuring, not by eye, and all three will bite again if the
column widths change:

- **Four columns start at 1440px, not 1280.** At 1280 the middle is 613px and a tile comes to
  135px — 103px of text, which cuts the headline after three words. 1280 gets three columns
  (188px), 1024 gets two (207px), 768 gets three of 219px, and 1600 and up gets four of 219px.
- **The meta line cannot hold the category and the time side by side.** "Community 2 days ago"
  needs 192px against the 187px a 219px tile offers, so at 1920 exactly one card in eight wrapped
  and its headline sat a line lower than its neighbours'. Stacking them from 768px costs 19px and
  keeps every row level. 14px is the floor of the type scale, so shrinking the text was not an
  option.
- **`-webkit-line-clamp` needs the element's height to equal the clamp.** `.news-card-excerpt`
  carries `flex: 1`, which stretched the box past two lines: the ellipsis appeared on line two
  and the rest of the paragraph kept rendering under it. The tile sets `flex: none`.

**`news.html` — News**

**Code:** [news.html](news.html) · [css/pages/news.css](css/pages/news.css) · [js/pages/news.js](js/pages/news.js) (`renderFeed`, `renderTopNews`, `renderArchive`, `wireNewsletterForm`) · data [js/mock-data/news.js](js/mock-data/news.js)

1. 728×90 ad.
2. Section head — "Seattle News" / **Latest Stories** + "+ Share the News" button.
3. `.news-layout` — three columns, built to a mockup the client sent:
   **left rail** (300×600, Newsletter, News Archive) | **feed** *(JS)* | **right rail**
   (300×250, Top News).
4. Contest teaser — a link block promoting `contest.html`.
5. Modal: **Share the News** — headline, details, photo, contact.

**The feed is the compact `.news-list` row, not a grid of photo cards.** The client asked for
a dense portal feed — thumbnail, category, relative time, headline, one clipped line — and that
component already existed in `components.css` (it is what Home's City Newsfeed uses). So the page
shows 28 headlines where it used to show 6 cards, and the article `body` is no longer rendered
anywhere: there are no article pages, and the row's headline deliberately goes nowhere
(`href="#"`). The full `.news-card` now runs only on Home, as the base of `.news-card--tile`.
`newsListRowTemplate()` is **copied** from `home.js` rather than imported — importing across page
modules also runs the other module's `DOMContentLoaded`, which is exactly the bug that makes
`auto/listing.html` log an error on every load.

**The column ladder is 1 / 2 / 3.** One column below 1024 with the feed pulled first
(`order: -1` — the left rail precedes it in the markup so it can sit on the left when there is
room, but on a phone the news comes first). At 1024–1279 two columns, `1fr 300px`, with **both**
rails stacked in the right one (right rail first) — three columns there would leave the middle
under 400px. Three columns from 1280, `300px 1fr 300px`, which is the mockup. Measured middles:
553 at 1280, 713 at 1440, 888 at 1920. The rails are 300px because that is the native width of
the 300×600 and 300×250 boxes.

**Nothing is interleaved into the feed — no ads between the news rows.** The page briefly carried
five, then three, in-feed 728×90 placements; the user then asked for the feed to run clean, so
`FEED_ADS` and `feedAdMarkup()` are gone and `renderFeed()` is a plain map over the articles.
Don't re-add an in-feed slot without asking, and note the consequence before proposing one: the
page is back to three placements (`news-top`, `news-side-1`, `news-side-2`), and on a desktop the
rails end around 1,100px while the feed runs to ~3,500px, so the bottom two thirds of the list
have no ad beside them. More inventory has to go **into the rails**, down their length, not
between the rows.

Because of that the rail slots no longer carry `.ad-desktop-slot`: they are visible at every
width, and below 1024 the `data-ad-slot-mobile` swap draws them at 320×100 inside the stacked
rails. The usual pattern on this site — hide the rail slot on a phone and echo it inline in the
feed — cannot apply here, since the echo is exactly the thing the feed must not contain. The
phone therefore shows those two banners *after* the list; the alternative is an ad between the
news, which is ruled out.

**The two left-rail widgets are real, not decoration.** *Newsletter* validates the address
through `validation.js` and swaps in a `.success-panel` that says outright that nothing was sent
and no address stored; its "Back" button restores the form so a demo can be re-run, like the
contest's reset. *News Archive* builds its Month and Year options **from `publishedAt` itself**
and actually filters the feed — the mock data spans August and September 2026, so both months are
there, and an empty month shows the same `<p class="muted">` empty state the directory uses. The
month select gets the wider grid column: "September" needs 93px of inner width against "2026"'s
44, and an even split left it two pixels from clipping.

**Top News is an editorial pick, not a metric.** `TOP_NEWS_IDS` in `mock-data/news.js` is a hand
written list of six ids drawn from across the array, rendered as `.news-list-row--mini` (56px
thumb, no category line, no excerpt — a 300px column has no room for them). No view or comment
counts: the site has neither, and the user asked for "the big stories", not the most-read.

**`contest.html` — Contest**

**Code:** [contest.html](contest.html) · [css/pages/contest.css](css/pages/contest.css) · [js/pages/contest.js](js/pages/contest.js) (`entryTemplate`, `wireVoting`, `wireReset`) · data [js/mock-data/contest.js](js/mock-data/contest.js)

1. Contest hero — eyebrow, **Police in the Eyes of a Child**, lead paragraph, "← Back to News".
2. Entry grid *(JS)* — 6 entries, each with a vote button.
3. "Reset my votes (demo)" button — the escape hatch that clears the stored votes.

**`directory.html` — Business Directory**

**Code:** [directory.html](directory.html) · [css/pages/directory.css](css/pages/directory.css) · [js/pages/directory.js](js/pages/directory.js) (`bizRowTemplate`, `renderCategories`, `renderList`, `renderStats`) · data [js/mock-data/businesses.js](js/mock-data/businesses.js) · [js/mock-data/stats.js](js/mock-data/stats.js)

1. Section head — "Business Directory" / **Find a Seattle Business**, and the count line.
   **There is no 728×90 above it any more** — the user removed `directory-top` and asked for the
   space to close up, so the head is the first thing under the photo banner, at 31px, which is
   the first section's own top padding. Getting there meant collapsing the 24px of dead space
   that used to sit inside the head box: both labels moved up 24px (keeping the 16px between
   them), the head's `margin-bottom` went to 0 and the count's relative offset went with them.
   Don't try to tighten it further with the head's negative `margin-top` — the box would reach
   over the photo banner and swallow clicks on the weather plate.
   **This is the one page whose section head has no button.** "List Your Business" now sits in
   the left rail as an `Add Your Business` widget, because in the head it hung over the ad column
   touching nothing — 394px from the heading's last letter, 10px above the rail's top edge. The
   card went *under* the categories rather than above them or above the 300×250, for two measured
   reasons: the left rail ends at y=1109 while the list runs to 3432, so that column was empty for
   2323px, and anything placed at the top of either rail pushes the first (most expensive)
   placement down ~130px and pushes the rails' tops out of the relationship with the search bar
   that the user set by hand. The card's `.widget-body` takes 16px of padding instead of `--card-pad` — at 32px
   the 240px column leaves 172px and the button's label wraps.
   **This page's `h1` is smaller than the rest of the site** — the clamp's ceiling is 40px
   instead of 48, at the user's request; the floor stays 30 so the phone is unchanged. 40 is
   deliberately off the type scale and says so in the CSS: it went down to 36 first, and the
   scale's only step back up is 48, which is where it started. Both
   labels also carry a large horizontal offset that only applies from 1280px up, for the reasons
   written out in `directory.css`.
2. `.dir-layout` — three columns, built to a mockup the client sent: **left rail** (Headings —
   the category list, then the Add Your Business card) | **main** (search, the business list) |
   **right rail** (300×250, Statistics, 300×600).

**From 1440px both rails sit 60px above the middle column**, at the user's request in five steps
(38 up, "50 more", 20 and 8 back down, then 3 up) — they start 25.69px under the photo banner and
the heading and search run between them. **85px is the ceiling**, and it is measured: the photo ends at 282.00,
at −85 the rails start at 282.69, and at −86 the white Headings card sits 0.31px on the
photograph. Round numbers lie here — 330 − 282 reads as 48px of room and the true figure is 47.69,
which is how one attempt ended up over. **That rise is scoped to 1440
and it is a measurement, not caution:** at 1280–1439 the heading is only shifted 136px, so its
letters start at x=176 while the left rail occupies 32–272, and a raised rail covers them by 96px
horizontally and 40 vertically — the Headings widget lands on top of "Find a S…". Below 1280 the
rails stack instead of sitting side by side, and raising the left one would run it into the ad
above it.

**The listing is rows, not photo cards** — `.biz-row`: a 72px thumbnail (96 from 768), the tier
badge, the month's views, name, category, description, address and phone. The client's mockup had
no photos at all; the small thumbnail is the user's call on top of it. Nothing links anywhere:
there are no per-business pages.

**Paid placement is what the row's tint means.** Premium rows take `--color-gold-tint` and a
`--color-gold` border, Lux takes `--color-navy-tint`, Standard stays white and instead carries an
**"Upgrade to Lux →"** link to `pricing.html`. The list is sorted Premium → Lux → Standard for the
same reason: on a demo it shows what the money buys. All three tints are declared in `tokens.css`
— don't put a raw `rgba()` in the page file.

**The gold is a second colour beside the accent, and it was the user's call** (26.09.2026). The
first pick was `#B8860B`, chosen because it clears 3:1 against white; the user called it "dark
lemon" — at hsl 43 that gold reads olive, and at 0.08 the fill was a dirty cream. It is
`#DF9C16` now, hsl 40, with the tint at 0.14. **Brightness and contrast-against-white are the
same axis in opposite directions**, so the border dropped to 2.36:1 and there is no brighter gold
that keeps 3:1 — that was the trade, made knowingly. It is defensible because the border states
nothing: the tier is the word on the badge, and a Standard row's own border
(`--color-slate-soft`) is 1.24:1, half as contrasty as this one. Text on the fill is unaffected —
navy 15.3:1, slate 6.6:1.

**Lux is bright gold in the Auto page's enterprise block, and only there.** The user asked for it
once that block started with Lux, and asked in the same breath that the badge stay as it is — dark
with white letters (`--color-lux` #0D1B2A, 17.39:1). So `#auto-firms .biz-row--lux` takes
`--color-gold-bright-tint` and a `--color-gold-bright` border, and the Directory's Lux rows keep
their `--color-navy-tint`: the request carried the `#auto-firms` tag. The new gold is deliberately
brighter *and* more opaque than Premium's — the fill lands on #FFEEBF against Premium's #FBF1DE —
because the two tiers sit in one list and a paler gold would read as the same row. Text is
unaffected (navy 15.10:1, slate 6.53:1); the border drops to 1.60:1 against white, below the 2.36
of `--color-gold`, which is the same trade made knowingly there: the border states nothing, the
tier is the word on the badge, and a Standard row's own border is 1.24:1.

**The row's "Premium" badge is gold too, but only in the directory.** `badge-premium` is shared
with `pricing.html`, so the override is scoped to `.biz-row--premium .badge-premium` and the
pricing page keeps the red pill until the user says otherwise. **The badge's text is navy, and
that is a contrast requirement, not a style choice**: the `.badge` base sets white, which on
`#DF9C16` is 2.36:1 against the 4.5 that AA wants of 14px bold. Navy is 7.38:1 — which, worth
knowing, is also better than the 4.23:1 the red badge has always had, the one place on the site
where a badge misses AA.

**Below 640px the count keeps its own row under the heading, and that row needs a real
`margin-top`.** The heading is shifted 26px down by a relative offset, so its letters reach into
the row beneath it; the button used to hold that row open at 48px and no longer does. Without the
margin the count sits on the heading's descenders. Measured at 375–639: 16px between the two sets
of letters, 13.7px from the count to the search box.

**The search and the category list both really filter.** `renderList({category, query})` matches
the query against name, description, category and address, writes `#dir-count` ("Showing 3 of 15
businesses") and falls back to the same `<p class="muted">` empty state the rest of the site uses.
The category list counts its own rows from the data, so adding a business updates the numbers on
its own. The search input is a page control, not the header's placeholder — this one works.

**Statistics shows the same four numbers as Home's "at a Glance" widget**, from
`mock-data/stats.js`. That file exists precisely so the two cannot disagree on a demo; before it
the numbers lived inside `home.js`.

**The page carries three placements**: the rail's 300×250 and 300×600, and `dir-list-bottom`,
the full-bleed strip against the footer. Two others were removed by the user, a day apart:
`dir-list-top` (728×90) sat between the search and the list, and `directory-top` (728×90, Large,
$299/mo) sat above the head — so **nothing stands between the search and the first row**, nothing
stands between the rows, and nothing stands between the photo banner and the heading. This page
and Home are the two that have given inventory back; both times it was asked for explicitly, and
both times it is worth saying out loud, because a placement is a thing being sold.
The rail slots therefore carry no `.ad-desktop-slot`: they stay visible at every width and swap to
320×100 below 1024, and the old inline echo plus `#mobile-footer-ads` are gone from this page.

**`pricing.html` — Pricing**

**Code:** [pricing.html](pricing.html) · [css/pages/pricing.css](css/pages/pricing.css) · [js/pages/pricing.js](js/pages/pricing.js) (`tierCardTemplate`, `renderFeatureTable`, `wireChoosePackage`) · data [js/mock-data/pricing.js](js/mock-data/pricing.js)

1. Section intro — "Advertise on AllSeattle" / **Placement Packages** + lead.
2. Pricing grid *(JS)* — Standard / Lux / Premium, Lux flagged "Most Popular".
3. Section head — "Compare Plans" / **What's Included**.
4. Feature table *(JS)* — scrolls inside its own wrapper on narrow screens.
5. Modal: **Choose a package** — name, business, contact, message.

---

**The eight secondary sections** all share one skeleton, generated from `directory.html`:
728×90 ad → section head with a `pricing.html` button → content. **Each carries exactly one
placement now, its `<key>-top` 728×90** — the user had the side ads removed on 27.09.2026 across
all eight, and the mobile echoes went with them (an inline 300×250 after card 4 and a 300×600 in
`#mobile-footer-ads`): a banner that no longer exists on the desktop has no reason to appear in a
phone's feed. That is 16 placements given back, the largest single cut on the site; say so when
the subject comes up, because inventory is the thing being sold.

With the rails gone the content is full-width on six of them, so their wrappers keep only the page
class (`.jobs-layout`, `.events-layout`, …) and `.side-layout` came off. Two keep a column for
their own reasons: **Entertainment** still has the `.side-rail` holding "Tonight in Seattle", and
**Real Estate** keeps its filter column (`.realty-filters`, never a `.side-rail`). Measured at
1920: the six now run 1536px wide instead of 1212, which takes a card in the three-column grids
from 404 to 496px — still well inside §2's 75 characters, but worth knowing before anyone reaches
for a fourth column.

**`jobs.html` — Jobs** — **rebuilt to a work.ua screenshot the user sent** (27.09.2026): a filter
column on the left and dense `.job-card` listings on the right. The card carries Urgent/Featured
badges, the title, the salary in accent, the company as a link into `directory.html?q=…`, the
employment pill, the neighbourhood with its distance from downtown, a list of green check lines
(who it suits, work mode, languages, contact), a two-line description, and on the right a company
monogram, the posting age and a Save button. No photos, by design. Home's Job Board widget reads
the same data and links here.

**Code:** [jobs.html](jobs.html) · [css/pages/jobs.css](css/pages/jobs.css) · [js/pages/jobs.js](js/pages/jobs.js) (`jobCardTemplate`, `renderFilters`, `checkGroup`, `countFor`, `renderList`) · data [js/mock-data/jobs.js](js/mock-data/jobs.js)

**The column is on the left, not on the right as in the screenshot** — the user's call, so the page
matches the Directory's headings and Auto's model catalogue. It is the **second filter column on
the site** (the first is `.realty-filters` on Real Estate) and is built the same way — an accordion
below 768px, a plain column from 768px. A third one moves the pattern into `components.css`, §9.
**No ads live in it**: the side placements were removed from all eight secondary sections an hour
earlier, and only `jobs-top` remains on the page.

**Desktop geometry the user set (27–28.09.2026, from 1024px, in `jobs.css`):** the sort toolbar
lives **inside `.jobs-head`** in `jobs.html` (after the button), so the head is eyebrow / heading /
sort row, all above the two-column layout. Note `.jobs-head > .jobs-toolbar` sets
`display: flex` explicitly — the shared `.section-head > div { display: contents }` would
otherwise dissolve it. From 1024 the head is one column: "Work in Seattle", "Job Board" and the
sort are centred on the **page width** (the eyebrow has `padding-left: 0.14em` to cancel its
trailing letter-spacing). **"Post a Job" exists twice in `jobs.html`:** the head's button (shown
below 1024, where the filters column drops under the list) and `.jobs-post-side`, the first child
of `.jobs-filters`, shown only from 1024 — full column width (300px), 16px above the Filters
panel, its top level with the first job card; the head's copy is `display: none` there. The
user's reason: aligned to the left column, it no longer competes with the heading. Both text lines are 16px below the site default
(eyebrow `top: 24px`, heading `top: 8px`). Because nothing sits above the layout's columns any
more, the Filters panel's top and the first job card's top coincide by construction (the user
tried Filters level with the sort row and asked for it back down, 28.09.2026). Every `.job-card` is 104px shorter than the results column
(was 208; "a little wider"), and from 1024 its text is one scale step larger (title xl, salary
base, the rest sm, monogram 56px, description max 90ch) — the wide cards looked empty.
**There is no result count on this page** — the user had "14 openings in Seattle" removed, so
the sort control is the toolbar's only item; `jobs.js` no longer writes a
count either. (A first try put the whole head in the page
centre shifted 200px left; the user replaced that with this.)

**Four things from the screenshot were deliberately not copied**, and each is commented where it
lives: the job title is **not a link** (there are no per-job pages, and a link to nowhere is what
§7 bans — the Directory's rows are silent for the same reason); **Save saves nothing** and flashes
"Demo only" like My Listings' Edit/Delete, because `contest.js` is the only thing allowed to touch
`localStorage`; the company logo is a **monogram** (no logo images exist and nothing is hotlinked),
one navy tile for every company because §4 allows one accent; and the **counts are small** (1–8,
not thousands) because there are fourteen openings — the user chose not to grow the data. An option
no opening matches is not rendered at all.

`jobs.js` gained the fields those counts are computed from — `salaryMin/Max/Unit`, `workMode`,
`openTo`, `perks`, `languages`, `contact`, `urgent`, `featured` — plus `MILES_FROM_DOWNTOWN` (per
neighbourhood, so two openings in one place cannot disagree) and `annualSalary()`, which multiplies
an hourly rate by 2080 so the "from–to" filter compares like with like. The display string `salary`
stays as it was: Home's widget renders it.

**Two traps worth knowing.** Each option's count is computed with its own group excluded
(`countFor(group, …)`), otherwise ticking the first checkbox would zero every sibling and there
would be nothing left to tick. And the keyword search re-renders the whole column, so the handler
restores focus and the caret afterwards — without it the field lost focus on every keystroke.

**The posting dates were moved three days forward** so the board reads as live, and the period
filter measures against the real clock, the same one `relativeTime()` uses in the card. Don't set
it against a hardcoded "today": the filter and the line under the job would disagree on screen.
Those dates age like `news.js`'s — bump them before a demo.

**`events.html` — Events** — category chips + `.event-grid`: cards with a date plaque over the
photo, venue, neighborhood and price. `eventDateParts()` in the data file formats the plaque.

**Code:** [events.html](events.html) · [css/pages/events.css](css/pages/events.css) · [js/pages/events.js](js/pages/events.js) (`eventCardTemplate`, `eventDateParts`) · data [js/mock-data/events.js](js/mock-data/events.js)

**`shopping.html` — Shopping** — category chips + `.deal-grid`. Every deal carries a
`businessId` and `dealWithBusiness()` joins it to `businesses.js`, so the photo, name and phone
come from the directory rather than being duplicated.

**Code:** [shopping.html](shopping.html) · [css/pages/shopping.css](css/pages/shopping.css) · [js/pages/shopping.js](js/pages/shopping.js) (`dealCardTemplate`, `dealWithBusiness`) · data [js/mock-data/shopping.js](js/mock-data/shopping.js) · [js/mock-data/businesses.js](js/mock-data/businesses.js)

**`entertainment.html` — Entertainment** — venue-kind chips + `.venue-grid`, and a
**Tonight in Seattle** widget in the sidebar fed by `upcomingEvents(3)` from `events.js`.
Events answers "when", this section answers "where". Below the widget, **two side placements
are back** (27.09.2026, the user's request): `entertainment-side-1` 300×250 and
`entertainment-side-2` 300×600, plain `data-ad-slot` divs visible at every width (the rail
drops under the grid on a phone and they swap to 320×100 there) — no `.ad-desktop-slot`, no
mobile echo.

**Code:** [entertainment.html](entertainment.html) · [css/pages/entertainment.css](css/pages/entertainment.css) · [js/pages/entertainment.js](js/pages/entertainment.js) (`venueCardTemplate`, `renderTonightWidget`) · data [js/mock-data/entertainment.js](js/mock-data/entertainment.js) · [js/mock-data/events.js](js/mock-data/events.js)

**`weather.html` — Weather** — **rebuilt 27.09.2026 to a weather-dashboard mockup the user
sent**: one `.wx-board` card, a white "now" panel (`#wx-now`: big icon, temperature, live
weekday + time, condition, rain chance, a Seattle photo card) and a grey main panel with
**Today / Week tabs** and a **°C / °F toggle**, a strip of 7 days or 12 hours (`#wx-strip`) and
six **Today's Highlights** cards (UV gauge, wind, sunrise/sunset, humidity, visibility, air
quality). The regional table stays below the board. Adapted, not copied: the mockup's yellow
sun and blue rain would be a second and third accent (§4), so icons are navy/slate from
`WEATHER_ICONS` (four added: `sunrise`, `sunset`, `wind`, `compass`) and red is only the UV fill
and the active tab; the emoji became words; the avatar and "Search for places" were left out
(the user asked for the search to go; the site has no photos of people).

Things worth knowing before touching it:

- **The page opens on Today** (the hourly strip), not Week as in the mockup — the user asked
  for that on 28.09.2026; the default is `state.view` in `weather.js` plus the matching
  `aria-selected` in the HTML.
- **Tab and unit state is in memory only** (`state` in `weather.js`) — `localStorage` belongs
  to the contest alone. Every temperature in `weather.js` is °F; `toUnit()` converts on render,
  there are no stored Celsius numbers.
- **Day names are computed from today's date**, not stored — `WEATHER_WEEK` has no `day`/`date`
  fields any more, so the strip can't go stale. `WEATHER_WEEK[0].pop` is also the left panel's
  "Rain – N%" (one number, one source).
- **The city photo fills the "now" panel's free height on desktop** (`flex: 1`, no aspect
  ratio, `object-fit: cover`), centred between the facts and the panel's bottom edge — 64px
  each side (16px column gap + 48px `margin-top` above, 32px `margin-bottom` + 32px panel
  padding below). 288px wide, 304px tall at 1440, 537 at 1024 where the main panel is taller.
  The user asked for it to run "from the Rain line down to the bottom", then to be centred
  there.
- **The strip is a grid, not a scroller** — the user asked for the scrollbar under the hourly
  forecast to go. `renderStrip()` sets `.wx-strip--days` / `--hours`: 12 hours in one row from
  1280 (74px cells at 1440, 24px icons), 6 per row at 640–1279, 4 on phones; 7 days in one row
  from 640, 4 + 3 on phones. The photo is wider than the panel's text — `margin-inline: -16px`
  into the padding (256 → 288px on desktop) — except at 640–1023, where it sits in its own
  grid column.
- `WEATHER_NOW` lost `feelsLike`, `pressure` and the display strings (`"8 mph W"`, `"2 of 11 ·
  Low"`) — nothing rendered them after the rebuild. It holds numbers (`uvIndex`, `windMph`,
  `humidity`, `visibilityMi`, `aqi`) and the page derives the words (`uvWord()` etc.). The
  header plate still reads only `weatherHeaderLine()` (city, temp, note), unchanged.
- **Responsive**: two columns (320px + rest) from 1024; below that the panels stack, and at
  640–1023 the "now" panel is a two-column grid with the photo on the right (full width it was
  250px tall). Highlight cards: 3 per row at 768–1023 and from 1280, 2 at 1024–1279 (the main
  panel is only 576px there) and on phones, 1 below 360. On phones the cards drop to 16px
  padding, 36px numbers and 32px round icons — at 48px / 40px "78 %" beside its meter and
  "6:52 AM" beside its icon didn't fit a 155px card. `.wx-main` keeps `min-width: 0` so no
  wide child can inflate the page (the third CSS trap).

**Code:** [weather.html](weather.html) · [css/pages/weather.css](css/pages/weather.css) · [js/pages/weather.js](js/pages/weather.js) (`renderNow`, `renderStrip`, `renderHighlights`, `uvGauge`, `meter`, `renderRegion`, `wireControls`) · data [js/mock-data/weather.js](js/mock-data/weather.js)

**`real-estate.html` — Real Estate** — the only new section with a filter column, built like
Auto's (accordion below 768px, a plain column from 768px). Sale prices and monthly rents share one
numeric field, so `PRICE_STEPS` rebuilds the max-price options whenever the deal type changes.
**18 properties, 9 for sale and 9 for rent** — the user asked for two more cards so the last row
at 1440 (three columns) is full; both tabs got two so neither ends on a lone card. **Two side
placements sit under the filters** (`real-estate-side-1` 300×250, `real-estate-side-2` 300×600,
inside `.realty-ads`, 27.09.2026): shown from 768px only, where the filters become a side
column — below that the aside sits above the listings and two banners would push them a
screen down; the page's 728×90 covers the phone.

**Code:** [real-estate.html](real-estate.html) · [css/pages/real-estate.css](css/pages/real-estate.css) · [js/pages/real-estate.js](js/pages/real-estate.js) (`PRICE_STEPS`, `fillSelects`, `currentList`) · data [js/mock-data/real-estate.js](js/mock-data/real-estate.js)

**`city-map.html` — City Map** — a **real map** since 27.09.2026 (the user asked for "a real,
normal map of Seattle" in place of the old hand-drawn SVG schematic): Leaflet 1.9.4, vendored as
its ESM build in `js/vendor/leaflet/` (with its LICENSE) and imported by `city-map.js`, over
OpenStreetMap tiles; `leaflet.css` is linked from this one page's `<head>`, **before**
`city-map.css`, and carries the same `?v=`. Each neighborhood in `neighborhoods.js` has real
`lat`/`lng` (the old `x`/`y` percentages and `MAP_SHAPES` are gone); pins are `L.divIcon`s built
from the same `.map-dot` + `.map-label` markup as before, and a click still runs `selectHood()`
(highlight + scroll to the card). Then `.hood-grid`. Neighborhood counters are computed from
`events.js`, `jobs.js` and `real-estate.js` rather than stored, so they stay true as data is
added. Four things that each fixed a real problem:

- **All Leaflet animation is off** (`zoomAnimation`, `fadeAnimation`, `markerZoomAnimation`,
  `inertia` false) — the site's no-animation rule. `leaflet.css`'s transitions only apply
  under the `leaflet-zoom-anim` / `leaflet-fade-anim` classes those options add, so they never
  fire. `scrollWheelZoom` is off too, so the map doesn't hijack page scrolling.
- **`.city-map` has `position: relative; z-index: 0`** — without its own stacking context
  Leaflet's panes (z-index 400–1000) rise above the sticky header (50) while scrolling.
- **The pin's offset lives on `.map-pin-inner`, not `.map-pin`** — Leaflet positions the marker
  element with an inline `transform`, which would silently override one set in CSS.
- **Labels sit right of the dot, and `fitBounds` pads 120px on the right** — Downtown, Pioneer
  Square and Capitol Hill are ~25px apart vertically, so labels under the dots collided; and
  without the right padding "Columbia City" was cut off at 375px. `zoomSnap: 0.25` lets the
  city fill the frame instead of sitting small in the middle of Puget Sound.

**Code:** [city-map.html](city-map.html) · [css/pages/city-map.css](css/pages/city-map.css) · [js/pages/city-map.js](js/pages/city-map.js) (`renderMap`, `countsFor`, `selectHood`) · data [js/mock-data/neighborhoods.js](js/mock-data/neighborhoods.js) · [js/mock-data/events.js](js/mock-data/events.js) · [js/mock-data/jobs.js](js/mock-data/jobs.js) · [js/mock-data/real-estate.js](js/mock-data/real-estate.js) · library [js/vendor/leaflet/](js/vendor/leaflet/)

**`qa.html` — Q&A** — topic chips + a list of native `<details>`. No JS for the accordion:
keyboard and screen readers work on their own.

**Code:** [qa.html](qa.html) · [css/pages/qa.css](css/pages/qa.css) · [js/pages/qa.js](js/pages/qa.js) (`qaItemTemplate`, `renderFilters`) · data [js/mock-data/qa.js](js/mock-data/qa.js)

---

**`auto/index.html` — Auto catalog**

**Code:** [auto/index.html](auto/index.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-catalog.js](js/pages/auto-catalog.js) (`carRowTemplate`, `renderCatalog`, `renderList`, `renderTopics`, `renderFirms`) · data [js/mock-data/cars.js](js/mock-data/cars.js) · [js/mock-data/businesses.js](js/mock-data/businesses.js)

1. 728×90 ad (`auto-top`) — **above** the subnav on this page, see the geometry note below.
2. Auto subnav — Catalog / Add a Car / My Listings (on all four Auto pages).
3. **Directory of Enterprises** (since 29.09.2026 the first block, right under the subnav, at
   the user's request) — auto topics plus a 300×250 on the left, the Auto Services companies as
   `.biz-row` in the middle, a 300×600 on the right. Its head sits where "Cars for Sale" used to,
   so the 10px subnav-to-eyebrow rule below now applies to "Auto Services".
4. 728×90 (`auto-mid`) between the two blocks — `margin: 32px 0 24px`.
5. Section head — "AllSeattle Auto" / **Cars for Sale** + "+ Post a Listing".
6. **A full-width search bar** on navy, not a filter column: Make, Model, Price from–to, Year
   from–to, Find, plus an "Advanced search" disclosure holding body, transmission, fuel, mileage
   and sort. Everything filters as you pick; submit is swallowed.
7. `.auto-layout` — the same column ladder as the Directory: **left rail** (Car catalog — the 6
   models in two columns with counts) | **main** (count line + 6 `.car-row` listings) |
   **right rail** (300×250, 300×600).

Everything is one `<section class="section auto-catalog">` now — the Directory block moved out of
its own second section into the first one, above the cars.

**The top of this page is hand-set, and the order in the markup is load-bearing.** The user first
asked for the top banner 90px higher and the subnav 120px lower, which relative offsets cannot do —
a subnav dropped 120px lands on the section head's eyebrow (measured: subnav 314…358, head starts
at 472, the shifted subnav would have occupied 434…478). So the two swapped places in the flow and
`.auto-catalog` (a class on the first `<section>`, because `auto.css` is shared by all four Auto
pages) carries the offsets. He then asked, twice in a row, for the subnav 50px lower *and* exactly
40px between the two, and I moved the banner down after the subnav to hold the 40 (292 → 354 → 404).
**That was the wrong half to move** — "надо было опустить подменю, а не банер рекламы" — and asked
where the subnav should sit instead, he said just above "AllSeattle Auto / Cars for Sale". So the
settled state is the compact one: the banner alone under the photo banner, the subnav under it, the
head right after. He then named the numbers for all three gaps, in three more passes: **35px above
the banner, 30px below it** (`top: 3px` on `.ad-slot-top`, `margin-top: 33px` on `.auto-subnav`) and
**10px between the subnav's rule and the "ALLSEATTLE AUTO" letters**, which was 42 — 24px of the subnav's own `margin-bottom`, the eyebrow's shared
`top: 16px`, and 2px of leading above the caps. The eyebrow's offset is not available to spend: it
is what holds the eyebrow against the heading. So the 32px comes off the subnav —
`margin-bottom: -8px` — and the head's box then reaches 8px over the subnav's. Nothing shows,
because the eyebrow is painted 16px below its own box, **but the head is later in the DOM and was
stealing clicks from the bottom edge of the subnav links**, so the subnav carries `position:
relative; z-index: 1` (well under the sticky header's 50). Verified with `elementFromPoint` at the
top, middle and bottom of all three links, at every width. Measured at 1024–1920: photo ends 282,
**35px**, ad 317…407, **30px**, subnav 437…481, **10.00px**, the head's eyebrow letters at 491.
The 35 above is a consequence, not a request: he asked for 25 above and 40 below, then for 30 below
**without raising the subnav**, which leaves only the banner to move — so it dropped 10px and took
the top gap with it. Say so before quoting that number back at anyone.
Below 1024 the first two do not apply — the slot is a 320×100 and the stack keeps its own 32 and 24
— while the 10px does, at every width.

Two things to keep in mind before touching any of it. **Both margins are measured off the banner's
invisible flow box, not off what you see** — the box stays 314…404 while the banner is drawn at
317…407, so the subnav's 33px margin and the 30px you see differ by 3; re-measure the whole cluster
rather than one rule. And **don't reach for `margin-top` on the banner**: as the first child of
`.container` it collapses into the container and carries the whole section with it, up or down. **The rules start at 1024px** — below
that the slot is a 320×100, the stack is already tight at a 24px gap, and 120px of air on a phone
contradicts what the user asked for on the Directory.

**The horizontal nudges in both section heads all start at 640px, and that is a measured floor, not
caution.** Below 640 the head is one column: the heading fills the width and the button drops to a
third row at the container's left edge. A heading shifted right there pushes the page sideways
(measured at 375: `scrollWidth` 383 against a 375 viewport) and a button shifted left lands at
x = −4, outside the gutter. Both shipped that way for one commit before the 375 pass caught it. The
nudges themselves: `.auto-head .eyebrow` +12px (`left: var(--space-4)`, and it is scoped to the
catalog because `add-listing.html` shows the same eyebrow), `.auto-head .btn` −16px,
`.auto-firms-head .btn` −20px, and `.auto-firms-head .eyebrow` / `h2` +20px. **The enterprise head
moves as a pair** — eyebrow and heading together — because shifting only the heading leaves the two
labels on different left edges, which is the look the user rejected on the Directory. A side effect
worth knowing: the heading's box then overlaps the button's grid cell by 24px. Nothing shows,
because the text is left-aligned and short, and the button still takes its own clicks (both are
`position: relative` and the button is later in the DOM) — verified with `elementFromPoint`, not by
eye.

**In the enterprise block the packages are ordered Lux → Premium → Standard** (`FIRMS_ORDER` in
`auto-catalog.js`), which is *not* the Directory's order (Premium → Lux → Standard in
`directory.js`). That is the user's decision, not an oversight: the request carried the
`#auto-firms` tag and he chose to leave the Directory alone. Before the sort the rows came out in
data-file order, i.e. mixed.

**The enterprise rows are a third shorter than the block's width, and the freed sides are
inventory.** The user asked for both in one sentence. `.auto-layout--firms` is `300px 1fr 300px`
from 1280 (the left column grew from 240 so a 300×250 renders at its own rate), and the row
measures 888px at 1920 (from 1272, −30.2%), 809 at 1536 (−32.2%), 713 at 1440 (−35.0%) and 553 at
1280 (−41.0%). Exactly one third at every width is not available: 848px at 1920 needs a 44px
gutter or a 348px rail, and neither exists in the system — 300px is the boxes' native width and
24px is `--grid-gap`. The same row already renders at 788px in the Directory. At 1024–1279 both new
boxes sit in the left column and `.auto-results` spans two grid rows, so the second one follows the
topics widget instead of dropping to the foot of the block. **Two new placements**: `auto-firms-side-1`
300×250 (Business, $149/mo) and `auto-firms-side-2` 300×600 (Premium, $199/mo) — the page carries
six now, not four.

**The page was rebuilt to a mockup the client sent** (27.09.2026), and one conflict inside it had
to be settled out loud: the mockup lists 40+ makes *and* shows no photos, while the user asked for
full-size photos in the rows. There are exactly 13 photo sets, one per model, every one
identifiable by badge (`c1-1.webp` is unmistakably a Toyota Camry), and no way to get more — the
demo has to work offline. **The user chose photos**, so `cars.js` lives *within those 13 models*
and the left catalog lists **models, not makes** — there are only eight makes and they do not fill
two columns. Every listing references its own model's photo set, so the picture always matches the
title; a script checks that rather than an eye.

**There are 6 listings** (29.09.2026: the user cut 12 → 6): Camry `c16`, Accord `c2`, Outback
`c4`, RAV4 `c5`, F-150 `c36`, Mustang `c12` — two sedans, two SUVs, a truck and a coupe, and the
three `MY_LISTING_IDS` all kept. `renderSimilar()` in `auto-listing.js` now takes the same make or
body type first and then tops up with any other car to three, since six cars can't guarantee
neighbours. The history below explains the earlier cuts.

**Earlier there were 12 listings, one per model.** It went 13 → 48 → 24 → 12: the user built it up for the
mockup and then cut it twice as too much. One model had to go, and it is **Chevrolet Camaro** —
with any other choice some car ends up with an empty "Similar Cars" block, which matches on make
or body type (drop the Fit and the Golf has no neighbour at all). The hybrid, the diesel and three
manuals are kept on purpose: the fuel and transmission selects are built from the data, so those
options disappear with the cars. `img/cars/c13-*.webp` is now loaded by nothing.
`MY_LISTING_IDS` in `auto-my-listings.js` had to follow — `c8` became `c36`, the same F-150 in its
diesel version, because one listing per model means the old id is gone.

`cars.js` gained `color`, `fuel`, `postedAt` and `ref` on every entry — the mockup's spec line and
the date/number in the meta column. The mockup's "add to notebook" and "print" links were dropped:
they would be controls that do nothing.

**`carCardTemplate()` is still exported and still used** — `auto-listing.js` builds "Similar Cars"
from it — but the catalog itself no longer calls it, and `.car-grid` survives only for that block.
The module's `DOMContentLoaded` now returns early when `#car-list` is missing, **which fixes the
console error `auto/listing.html` used to throw on every load** (the one this file documented
under "Known issue"); a clean console there is now the correct state.

**`.biz-row*` moved from `directory.css` to `components.css`** — the same row now renders on two
pages, and a second copy of the style is what §9 bans. `bizRowTemplate()` is **copied** into
`auto-catalog.js` rather than imported, for the reason above: importing a page module runs its
`DOMContentLoaded` too.

**`directory.js` reads `?q=`** so the enterprise topics can link into a pre-filled search.

**`auto/listing.html` — Car detail** (reads `?id=` — an unknown id silently falls back to the
first car)

**Code:** [auto/listing.html](auto/listing.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-listing.js](js/pages/auto-listing.js) (`render`, `galleryMarkup`, `wireContactSeller`, `renderSimilar`) · data [js/mock-data/cars.js](js/mock-data/cars.js)

1. Auto subnav.
2. "← Back to catalog".
3. `#listing-root` *(JS)*: header (title + price) → `.listing-layout` — gallery, Description,
   Specifications table | seller card with the inline contact form, plus a 300×250 ad.
4. **Similar Cars** — up to 3 cards, same make or body type.

**`auto/add-listing.html` — Add a Car** (container capped at 720px) — **a "Will appear soon"
placeholder since 27.09.2026, at the user's request**

**Code:** [auto/add-listing.html](auto/add-listing.html) · [css/pages/auto.css](css/pages/auto.css)

1. Auto subnav.
2. Section head — "AllSeattle Auto" / **Post Your Car**.
3. A `.my-listings-note` panel reading **Will appear soon**, one line saying listing submission is
   not part of the demo yet, and links to the catalog and to Pricing.

The four-step wizard is gone from the markup and **the page no longer loads
`js/pages/auto-add-listing.js`** — with the form absent that module would go looking for
`#add-listing-form` and log to the console, the same trap `auto-catalog.js` guards against. The
module is still on disk, intact, with a comment at the top saying no page includes it: restoring
the form means restoring the step markup and one `<script>` line. The "+ Post a Listing" buttons on
the catalog and My Listings still point here, and so does the subnav — they lead to a page that
says outright the section is coming.

**One form left the demo contract this way**, which is why the list below has five entries and not
six.

**`auto/my-listings.html` — My Listings** (container capped at 760px)

**Code:** [auto/my-listings.html](auto/my-listings.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-my-listings.js](js/pages/auto-my-listings.js) (`MY_LISTING_IDS`, `cardTemplate`) · data [js/mock-data/cars.js](js/mock-data/cars.js)

1. Auto subnav.
2. Section head — "Your Account" / **My Listings** + "+ Post a Listing".
3. Note that the account system does not exist and the data is fixed.
4. Listing rows *(JS)* — 3 fixed cars, Edit / Delete flash "Demo only".

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

- **Redrawn 29.09.2026 from the client's reference lockup**: the pin is 100×127 with bulging
  sides, a wider white disc (r 33) and a bigger Space Needle — lens-shaped tiers, legs converging
  into the bottom of the disc and cut off there by a `clipPath`. The pin is **1.3× `--logo-h`**
  (about 1.5× the text block), the text sits close to it (`gap` 0.1) and 0.1 lower than its
  centre, the tagline is weight 500 with 0.235em tracking so it runs almost the full width of
  the wordmark, and "All" is the pin's own red `#E4141B` rather than `--color-accent` — the
  reference is more saturated than the UI red. Compared side by side with the reference image at
  4× before shipping.
- **One knob for size**: every part scales off `--logo-h` on `.site-logo`. Mobile-first, so 34px
  is the base (34 × 1.3 = 44, the header row's height — at 36 the pin grew the row to 47) and
  46px arrives at 640px, where the taller pin makes the 640–1023 header 128px instead of 114;
  the footer pins its own 40px. Don't set pixel sizes on the pieces.
- **`variant: "dark"`** (`.site-logo--dark`) flips the wordmark and tagline to white for the photo
  hero and the navy footer. The red "All" and the pin are left alone — they read on either.
- **Path data lives in two constants** in `logo.js`, `PIN_PATH` and `NEEDLE_PATHS`; the needle
  group carries one `translate` so its height in the disc can be tuned without rewriting paths.
- **Two copies of the path data exist**: `js/logo.js` and `img/icons/favicon.svg`. The favicon has
  to be standalone (no font, no gradient, and a square viewBox so browsers don't distort it into a
  square tab slot), so it can't import from the module — **edit both if the mark changes.** All 9
  pages point at that one file; don't go back to inlining a `data:` URI per page.
- `img/icons/logo-lockup.png` is an unused raster export (transparent, 1165×302) of the **old**
  pin, from before the 29.09.2026 redraw, kept only for decks/email. Nothing on the site loads it — if the mark changes, either
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
queries anywhere; don't reintroduce one.

**The site has no animation, deliberately.** Not a `transition`, not an `@keyframes`, not a
`scroll-behavior: smooth`, not a hover `transform` — the user asked for all of it gone, on the
grounds that a dense city portal has no use for it. Scroll-reveal is gone with it: `reveal.js`
was deleted and `.reveal-on-scroll` no longer exists in any template. So a new component gets
its states instantly: hover changes colour or shadow, an accordion snaps open, a modal appears.
Rotations that mark a state (the accordion chevron, the Q&A plus turning into a cross) stayed,
because they say *what is open* rather than moving for its own sake — they just flip with no
easing. If you add a `transition`, you are re-opening a settled decision.

One consequence worth knowing when measuring: **a CDP pass can no longer reach the bottom of a
page in one `scrollTo` and expect `loading="lazy"` to have fired.** Smooth scrolling used to walk
the viewport past every image on the way down; the jump is now instant and the middle of the page
never enters the viewport, so a screenshot comes back full of blank photo boxes and a broken-image
count that has nothing to do with the site. Step down a viewport at a time instead.

**`.side-layout` / `.side-rail` in `components.css` are the shared "content + sidebar"
frame**. Since the side ads left the eight secondary sections, **Entertainment is its only
user** — not dead code yet, but if that page ever loses its widget rail, the component goes with
it (§9). Reach for them instead
of copying the block into another page file — that copy is exactly the "different style for the
same component" §9 bans. A page file should only hold what is genuinely its own: its card grid's
columns and its own components. `.ad-slot-top` and `.result-count` live there for the same
reason.

**`.section-head` is a grid, not a flex row, and its inner `<div>` is `display: contents`.**
Every page writes the same markup — a wrapper div holding the eyebrow and the heading, then an
optional `.btn` — and the CSS lifts the eyebrow and the heading out of that wrapper into grid
cells so the button can sit in the heading's own row and centre on it. As a flex row the button
aligned against the whole left block instead, which put its centre 17–21px below the heading's;
it read as visibly sagging on all 16 pages that have one. The heading's `margin-bottom` is zeroed
there for the same reason — the head's own `margin-bottom` holds the gap to the content. Below
640px the button drops to a third row, which is what `flex-wrap` used to do. If you add anything
to a section head, give it an explicit `grid-row`, or auto-placement will drop it somewhere
surprising.

**Where the section head sits is a rule now, not a per-page fix.** The user asked for the same
thing on Home, then on News, then on the Directory — a dozen separate "move the eyebrow down"
requests — so the geometry he approved on News is the default in `components.css` and a new page
gets it for free:

- `.ad-slot-top { margin-bottom: 0 }` and `.section-head { margin-bottom: 0 }` — the 728×90
  banner sits against the head, and the head against the content.
- `.section-head .eyebrow { position: relative; top: 16px; left: 4px }` — the eyebrow drops to
  the heading it belongs to. **The eight secondary sections take 10px instead of 4**, through
  `.section-head--sub` on the head's own div — see below.
- `.section-head .btn { position: relative; top: -4px }` — the button rides 4px above the
  heading's centre. That is not the sag the grid was built to fix; it is deliberate.

Measured at 1440: **21.4px** from the banner's edge to the eyebrow's letters, **6.1px** between
the two labels, **10.8px** from the heading's letters to the content. At 1024 those become 4.9
and 8.6, at 375 2.3 and a button row. The shifts are relative on purpose — a margin would drag
the heading, the button and the whole page down with it, and only the labels should move.

**Three sets of pages sit outside the shared numbers, and each says so where it lives:** the
Directory replaces the whole block (`directory.css`) — it has no top banner, so its head carries
its own negative `margin-top`, its own label offsets and no `margin-bottom`; Home takes its 24px
back below the head plus zeroes the eyebrow shift (`home.css`), since both its heads were set by
hand; and the Auto catalog adds 12px to the eyebrow and −16px to the button (`auto.css`, and only
from 640px — below that the head is one column and a shifted label pushes the page sideways).
If another page needs to opt out, copy that pattern — an explicit reset with a comment — rather
than weakening the shared rule.

**The eight secondary sections carry `.section-head--sub`, which puts the eyebrow at 10px**
(`calc(var(--space-1) + 6px)`, one rule in `components.css` next to the base). The user asked for
"6px further right" on Jobs through Q&A on 27.09.2026 and, asked whether News and Pricing should
follow since they draw the same head, **chose to leave them at 4px** — so the 6px jump between
News and Jobs is a decision, not drift. It is a class rather than a `body[data-page=…]` list
because a ninth secondary page gets copied from one of these eight and the class travels with the
markup; eight copies of the rule in eight page files is what §9 bans. Measured at 1440: the
eyebrow's letters moved 36 → 42 while the heading stayed at 32, the vertical relationship is
untouched, and at 375 the shifted box ends at 369 against a 375 viewport — 6px more would start
pushing the page sideways.

**Two more per-page head adjustments, both from 27.09.2026:** `.section-head--btn-low` (in
`components.css`, from 640px only) puts the button 10px lower than the shared −4px — on Events,
Shopping, Entertainment, Real Estate and Q&A, measured +6px from the heading's centre at 1440 —
and `.qa-head` (in `qa.css`) lifts Q&A's eyebrow and heading 8px, and `.map-head` (in
`city-map.css`) does the same 8px for City Map's eyebrow and heading. The user explicitly declined moving that
eyebrow sideways to sit flush over the heading — it keeps the shared 10px `--sub` offset. Jobs has its own centred head,
described in its section above. Below 640px the button is its own row above the chips, which is
why the 10px stops there.

**28.09.2026, two more head classes in `components.css`, both via the `translate` property** (it
composes with the `top`/`left` offsets the heads already carry, so one rule serves pages with and
without `--btn-low`). From 640px `.section-head .btn` gets `translate: var(--head-btn-dx, 0)
var(--head-btn-dy, 0)` and the classes only set the variables: `.section-head--btn-down` (Events,
Shopping, Entertainment, Real Estate, Q&A) sets dy 8px — the button further down;
`.section-head--nudge` (Weather, Real Estate, City Map, Q&A) sets dx −12px and moves eyebrow and
heading 4px right at every width. Weather and City Map had `--btn-down` too; the user asked for
their buttons back at the old height, so they carry only `--nudge`. Weather's text goes 4px
further right (8px total) in `weather.css`, from 640px only — at 320 it pushed the page to 322.
Jobs carries neither class. Measured: no horizontal overflow at 320/375/640/1440.

**Two places are tight by design and worth knowing before you add anything to a head:** Pricing's
"What's Included" (`--spaced`, a smaller `h2`) leaves 2.3px between the labels at 1440 and 1.2px
at 375, and the chip rows on Shopping, City Map and Q&A sit 1.6–3.6px under the heading at 1024.
All positive, all measured — but there is no room left there.

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

**`position: sticky` is now used for exactly one thing: the site header** (see the partials.js
note above). **Every sidebar on every page scrolls away with the page** — the user asked for the
ads to move when the content moves, not to sit pinned while the cards go past them. Home's two
rails were already static; News, Directory, the six `.side-rail` sections, Auto's filter column
and Real Estate's all used to stick at `top: calc(var(--header-height) + var(--space-2))` and no
longer do. Their base rules already declare `position: static`, so the desktop overrides are gone
rather than restated, with a comment left at each site saying why. Don't "fix" any of them back
to sticky without asking.

**On Auto and Real Estate that also unpinned the filters**, because the 300×250 and 300×600
placements sit *inside* the filter aside. Keeping the filter card pinned while the ads below it
scroll is not an option: sticky keeps its space in flow, so the ad would slide up underneath the
pinned block and the two would overlap. Filters scrolling away is the cost of the ads moving, and
it was the user's call.

**`--header-height` is a measurement, not a guess** — 116px while the header is two rows,
96px from 1024px where it collapses to one. It had five consumers while the sidebars were sticky;
the one left is City Map's `scroll-margin-top`, which keeps a pin's neighbourhood card from
landing under the header when it scrolls into view. Re-measure it and update the token in
`tokens.css` if you change the header's rows, padding or logo size — and expect the next thing
that needs an offset from the header to read it from there too.

Two adjacent `<section class="section">` elements would otherwise stack their own vertical
padding and put 192px between them, twice what §1 allows. `main > .section + .section` zeroes
the second one's top, so the gap is the single `--section-y`. Home and the Auto catalog are the
pages that had two sections (Auto's Directory block has since moved into its first one), and
neither had to rediscover this.

**One centimetre is the vertical seam everywhere now** — 36px, the nearest sum of scale steps to
1cm's 37.8. The user measured it with a ruler twice (Home's two sections, then News's gap to the
footer), so on the third page it stopped being a per-page fix: `base.css` zeroes the last
section's bottom padding and gives an earlier section 36px, `footer.css` carries the whole gap on
`.site-footer { margin-top }`, and one more rule zeroes the trailing margin of the last block in
the last section. That last one matters: before it the pages disagreed — 192px on the Directory,
158 on My Listings, 156 on Contest against 144 everywhere else, because each had its own trailing
margin stacked on top.

**Home's seam is the one place where the 36 is assembled rather than declared.** Its first section
keeps `padding-bottom: var(--space-2)` from `home.css` — 8px — and the City Newsfeed heading adds
a 20px shift with another 8px on its eyebrow. Those three are the 36. Change any one and
re-measure the other two; the arithmetic is written out in `home.css`, and the page rule wins over
the shared one only because `home.css` loads later at equal specificity.

This is a deliberate deviation from `design.md` §1, which asks for 96–128px between sections on a
desktop. It was the user's call, made with a ruler, and §1 now carries the exception next to its
own numbers so the two cannot be read apart.

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
  Scope these rules to their page wrapper — a bare `.news-grid` would also hit Home, which has a
  ladder of its own (1 / 2 / 3 / 2 / 3 / 4 columns) because its grid sits between two sidebars
  and holds the compact tile rather than the full card.
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
- **Two font families** (§2): Libre Franklin and Public Sans. Pacifico went with the inner hero's
  script wordmark on 29.09.2026.

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
