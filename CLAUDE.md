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
  script wordmark (anything else, 170px) in `partials.js`. **The short frame's height is one
  token, `--hero-inner-h`** on `.hero-banner--inner` — 140 / 150 / 160 / 170px by breakpoint in
  `header.css`. A page adds to it instead of restating the ladder: News does
  `height: calc(var(--hero-inner-h) + var(--space-3))` from `news.css`, so its banner is 12px
  (3mm, the user's ruler again) taller than the other fifteen inner pages at every width. If you
  change the ladder, that page follows on its own.
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
   and — on inner pages — the "Seattle / THE EMERALD CITY" wordmark top-left. Tall on Home, short
   everywhere else. This is page content, not chrome: its edges line up with every other block
   on the page.

   Those three have to share 140–340px of height, and the arrangement is the result of measuring
   collisions rather than taste:

   - **The weather plate is one line everywhere except Home at 1024px and up.** Its full
     three-line form is 79px tall and hit the search bar on a 140px inner frame and the wordmark
     on a 170px one.
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

**Code:** [directory.html](directory.html) · [css/pages/directory.css](css/pages/directory.css) · [js/pages/directory.js](js/pages/directory.js) (`bizCardTemplate`, `renderFilters`, `wireFilters`) · data [js/mock-data/businesses.js](js/mock-data/businesses.js)

1. 728×90 ad.
2. Section head — "Business Directory" / **Find a Seattle Business** + "List Your Business".
3. Category filter chips *(JS)*.
4. `.directory-layout` — business grid *(JS)*, inline ad after card 4 | sidebar: 300×250, 300×600.
5. Mobile ad stack *(JS)*.

**`pricing.html` — Pricing**

**Code:** [pricing.html](pricing.html) · [css/pages/pricing.css](css/pages/pricing.css) · [js/pages/pricing.js](js/pages/pricing.js) (`tierCardTemplate`, `renderFeatureTable`, `wireChoosePackage`) · data [js/mock-data/pricing.js](js/mock-data/pricing.js)

1. Section intro — "Advertise on AllSeattle" / **Placement Packages** + lead.
2. Pricing grid *(JS)* — Standard / Lux / Premium, Lux flagged "Most Popular".
3. Section head — "Compare Plans" / **What's Included**.
4. Feature table *(JS)* — scrolls inside its own wrapper on narrow screens.
5. Modal: **Choose a package** — name, business, contact, message.

---

**The eight secondary sections** all share one skeleton, generated from `directory.html`:
728×90 ad → section head with a `pricing.html` button → content → `#mobile-footer-ads`. Six of
them wrap the content in `.side-layout` / `.side-rail` (the shared "content + sidebar"
pair from `components.css`), and every one carries the same three placements: `<key>-top`
728×90, `<key>-side-1` 300×250, `<key>-side-2` 300×600, plus the inline echo after card 4.

**`jobs.html` — Jobs** — category chips, a count line, then `.job-list`: rows with title,
salary, company · neighborhood, description, a type badge and posting age. No photos, by
design. Home's Job Board widget reads the same data and links here.

**Code:** [jobs.html](jobs.html) · [css/pages/jobs.css](css/pages/jobs.css) · [js/pages/jobs.js](js/pages/jobs.js) (`jobRowTemplate`, `renderList`) · data [js/mock-data/jobs.js](js/mock-data/jobs.js)

**`events.html` — Events** — category chips + `.event-grid`: cards with a date plaque over the
photo, venue, neighborhood and price. `eventDateParts()` in the data file formats the plaque.

**Code:** [events.html](events.html) · [css/pages/events.css](css/pages/events.css) · [js/pages/events.js](js/pages/events.js) (`eventCardTemplate`, `eventDateParts`) · data [js/mock-data/events.js](js/mock-data/events.js)

**`shopping.html` — Shopping** — category chips + `.deal-grid`. Every deal carries a
`businessId` and `dealWithBusiness()` joins it to `businesses.js`, so the photo, name and phone
come from the directory rather than being duplicated.

**Code:** [shopping.html](shopping.html) · [css/pages/shopping.css](css/pages/shopping.css) · [js/pages/shopping.js](js/pages/shopping.js) (`dealCardTemplate`, `dealWithBusiness`) · data [js/mock-data/shopping.js](js/mock-data/shopping.js) · [js/mock-data/businesses.js](js/mock-data/businesses.js)

**`entertainment.html` — Entertainment** — venue-kind chips + `.venue-grid`, and a
**Tonight in Seattle** widget in the sidebar fed by `upcomingEvents(3)` from `events.js`.
Events answers "when", this section answers "where".

**Code:** [entertainment.html](entertainment.html) · [css/pages/entertainment.css](css/pages/entertainment.css) · [js/pages/entertainment.js](js/pages/entertainment.js) (`venueCardTemplate`, `renderTonightWidget`) · data [js/mock-data/entertainment.js](js/mock-data/entertainment.js) · [js/mock-data/events.js](js/mock-data/events.js)

**`weather.html` — Weather** — the one section with no card grid: a navy current-conditions
card, a 12-hour scroller, a seven-day list and a regional table. Icons come from
`WEATHER_ICONS` in `logo.js`.

**Code:** [weather.html](weather.html) · [css/pages/weather.css](css/pages/weather.css) · [js/pages/weather.js](js/pages/weather.js) (`renderNow`, `renderHourly`, `renderWeek`, `renderRegion`) · data [js/mock-data/weather.js](js/mock-data/weather.js)

**`real-estate.html` — Real Estate** — the only new section with a filter column, built like
Auto's (accordion below 768px, a plain column from 768px). Sale prices and monthly rents share one
numeric field, so `PRICE_STEPS` rebuilds the max-price options whenever the deal type changes.

**Code:** [real-estate.html](real-estate.html) · [css/pages/real-estate.css](css/pages/real-estate.css) · [js/pages/real-estate.js](js/pages/real-estate.js) (`PRICE_STEPS`, `fillSelects`, `currentList`) · data [js/mock-data/real-estate.js](js/mock-data/real-estate.js)

**`city-map.html` — City Map** — a hand-drawn schematic (`MAP_SHAPES` in
`neighborhoods.js`), then `.hood-grid`. **The pins are HTML buttons positioned over the SVG,
not `<text>` inside it** — inside the SVG the labels scale with the drawing and reach 27px on
a desktop; as HTML they take `--text-xs` and a real 44px target. The page says out loud that
it is a schematic. Neighborhood counters are computed from `events.js`, `jobs.js` and
`real-estate.js` rather than stored, so they stay true as data is added.

**Code:** [city-map.html](city-map.html) · [css/pages/city-map.css](css/pages/city-map.css) · [js/pages/city-map.js](js/pages/city-map.js) (`renderMap`, `countsFor`, `selectHood`) · data [js/mock-data/neighborhoods.js](js/mock-data/neighborhoods.js) · [js/mock-data/events.js](js/mock-data/events.js) · [js/mock-data/jobs.js](js/mock-data/jobs.js) · [js/mock-data/real-estate.js](js/mock-data/real-estate.js)

**`qa.html` — Q&A** — topic chips + a list of native `<details>`. No JS for the accordion:
keyboard and screen readers work on their own.

**Code:** [qa.html](qa.html) · [css/pages/qa.css](css/pages/qa.css) · [js/pages/qa.js](js/pages/qa.js) (`qaItemTemplate`, `renderFilters`) · data [js/mock-data/qa.js](js/mock-data/qa.js)

---

**`auto/index.html` — Auto catalog**

**Code:** [auto/index.html](auto/index.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-catalog.js](js/pages/auto-catalog.js) (`populateMakes`, `applyFilters`, `carCardTemplate`) · data [js/mock-data/cars.js](js/mock-data/cars.js)

1. Auto subnav — Catalog / Add a Car / My Listings (on all four Auto pages).
2. 728×90 ad.
3. Section head — "AllSeattle Auto" / **Cars for Sale** + "+ Post a Listing".
4. `.auto-layout` — filter aside (Make, Max price, Min year, Max mileage, Sort by, Reset, plus a
   300×600 ad; collapses into an accordion below 768px) | results: count line + car grid *(JS)*,
   inline ad after card 4.

**`auto/listing.html` — Car detail** (reads `?id=` — an unknown id silently falls back to the
first car)

**Code:** [auto/listing.html](auto/listing.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-listing.js](js/pages/auto-listing.js) (`render`, `galleryMarkup`, `wireContactSeller`, `renderSimilar`) · data [js/mock-data/cars.js](js/mock-data/cars.js)

1. Auto subnav.
2. "← Back to catalog".
3. `#listing-root` *(JS)*: header (title + price) → `.listing-layout` — gallery, Description,
   Specifications table | seller card with the inline contact form, plus a 300×250 ad.
4. **Similar Cars** — up to 3 cards, same make or body type.

**`auto/add-listing.html` — Add a Car** (container capped at 720px)

**Code:** [auto/add-listing.html](auto/add-listing.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-add-listing.js](js/pages/auto-add-listing.js) (`STEP_RULES`, `showStep`, `renderReview`)

1. Auto subnav.
2. Section head — "AllSeattle Auto" / **Post Your Car**.
3. Step indicator *(JS)* — Vehicle / Condition / Contact / Review.
4. Four form steps, one visible at a time: **Photos & Vehicle**, **Condition & Price**,
   **Description & Contact**, **Review Your Listing** (a read-back of everything entered).
5. Back / Next / Submit.

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
- **Newsletter** (`news.js`, the left-rail widget on News) → `.success-panel` for both Subscribe
  and Unsubscribe, saying nothing was sent and no address stored; "Back" brings the form back.
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
frame**, used by News-style pages and by six of the eight newer sections. Reach for them instead
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
the second one's top, so the gap is the single `--section-y`. Home is currently the only page
with two sections; the rule is there so the next one doesn't have to rediscover this.

**Home overrides that gap to 36px** (`main > .section:first-child { padding-bottom: var(--space-2) }`
in `home.css`, so it lands on that page only). The user measured the space between the `home-mid`
banner and the City Newsfeed heading with a ruler and asked for one centimetre; 1cm is 37.8px and
36px is the nearest sum of scale steps. The 8px of padding is only part of it — the heading also
carries a 20px visual shift and its eyebrow another 8px, and the three add up to the 36. Change
any one of them and re-measure the other two; the arithmetic is written out in `home.css`.

**Home also pins its gap to the footer at the same 36px**, by zeroing `.home-feed`'s bottom
padding and overriding `.site-footer { margin-top }` from `home.css` — 96 + 48 was the old sum.
**News does the same from `news.css`**, where the old gap was 176: the contest teaser's own 32px
bottom margin on top of the section's 96 and the footer's 48. Both pages zero everything above
the footer and put the whole number on `.site-footer { margin-top }`, so there is one knob rather
than three. The override reaches only those two pages because a page stylesheet loads nowhere
else; the other 15 keep 144px. So Home's and News's vertical rhythm is deliberately tighter than
the rest of the site at their last seam, and that is the user's call, measured with a ruler,
not drift.

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
- **Three font families**, not two (§2) — Pacifico is the brand script in the inner hero.

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
