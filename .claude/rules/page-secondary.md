---
paths:
  - "jobs.html"
  - "events.html"
  - "shopping.html"
  - "entertainment.html"
  - "weather.html"
  - "real-estate.html"
  - "city-map.html"
  - "qa.html"
  - "css/pages/{jobs,events,shopping,entertainment,weather,real-estate,city-map,qa}.css"
  - "js/pages/{jobs,events,shopping,entertainment,weather,real-estate,city-map,qa}.js"
  - "js/mock-data/{jobs,events,shopping,entertainment,weather,real-estate,neighborhoods,qa}.js"
  - "app/src/app/*/{jobs,events,shopping,leisure,weather,map}/**"
  - "app/src/components/{jobs,weather,map}/**"
  - "app/src/app/*/styles/{jobs,events,weather}.css"
---

<!-- Moved verbatim from CLAUDE.md (lines 581-759) on 02.10.2026; loads only when a matching file is read. -->
# The eight secondary sections (Jobs, Events, Shopping, Entertainment, Weather, Real Estate, City Map, Q&A)

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

**The app's Events (`app/`) head and filters, 03.10.2026 (after several same-day tries).** The
prototype's two rows of identical red chips became two labelled filters: **WHEN** — a segmented
switch (`.events-when`, 2 × 2 grid on a phone) — and **CATEGORY** — light outline chips
(`.events-types`), the selected one navy in both. Each row (label + control) is **centred on the
page** from 640px (measured: row centres = container centre at 640–1920). The heading stays on
the left; **"Submit an event" is a `.post-card`** — the same card as Jobs' "Post a job" (tinted
calendar icon, "Hosting an event?", red title, red arrow circle), defined once in
`components.css` without Jobs' hover transition/transform (no-animation rule; Jobs still has its
own `.jobs-post-side` copy — moving it onto `.post-card` is a separate change). From 640 the card
is 300px at the container's right edge, spanning the eyebrow and heading rows, `top: 8px` so its
centre matches the visible text block's (the eyebrow is drawn 16px below its cell) — measured
equal at 640/1024/1440. Below 640 it is full width under the heading. Rejected the same day: an
all-left variant and a News-style rail of widgets. Filters stay links with `?when=` /
`?category=`. No ad placements moved.

**App Events categories, 18.10.2026 (client):** 20 event categories in the client's order (Movies &
Cinema … Pet-Friendly Events; the six demo ones were renamed into them and un-demoed, so purge-demo
keeps them — CMS data, not the seed). As chips they were a 3–10-row cloud ("ugly, nobody searches
like that"), so the category is **one "Category: All ▾" button** (`EventCategoryMenu.tsx`, a native
`<details>`; JS only closes it on an outside click / Esc / a choice) centred under the WHEN tabs. It
opens a panel over the cards: "All categories" above a rule, then the 20 as links in 2 / 3 / 4 columns
(phone / 640 / 1024), the chosen one navy; panel up to 880px wide, never wider than the screen minus
the gutters. Options stay `?category=` links. From 1440 only the WHEN tabs sit in the head band; the
button is under it, 8px below the heading / "Submit an event" (`.events-types` margin-top 44, was 52; then tabs + button 2px lower as a visual shift — tabs translate 42, button `translate: 0 2px`, cards unmoved; the
filter block is `pointer-events: none` there, so `.events-cat` turns them back on). Still behind `EVENTS_COMING_SOON`. Same day, "level with What is
on / Seattle events": from 1440 the WHEN tabs are `translate: 0 32px` — their letters centred on the
eyebrow+heading block and on "Submit an event" (chips and cards don't move; tab underline → chips
32px). Then "a bit lower, and less white under the banner": tabs `translate` 40px, and the whole head
16px higher from 1440 (`.events-head` margin-top −12, was 4) — banner → "Submit an event" 16px,
everything under the head moves up with it; then "a touch more": margin-top −20, banner → card 8px.
The empty state (no events, or none for the chosen filter) is the same "Coming soon" card as the
closed section (`EventsSoon` in the page; was "Nothing listed for that choice yet."), 24px under the
filters, 16 above the bottom banner. The demo events were deleted locally (prod waits for the user's go-ahead).

**The app's event page (`events/[slug]`)**: from 1024 the right column (When & where, map, ad)
starts level with the **photo** (client, 03.10.2026; a same-day version centred it on the title
first). Category, `<h1>` and the date line sit **above** the two-column grid, so the grid
starts with the image and the alignment holds by construction — no offset in CSS. The title can
now run the full container width. Measured 0.00px at 1024/1280/1440/1920; below 1024 the page is
unchanged.

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
- **The city photo has a fixed height on desktop and must not move** (29.09.2026). It used to
  fill the "now" panel's free height (`flex: 1`), but the panel's height follows the strip on the
  right — Today (12 hours) and Week (7 days) differ — so switching tabs resized the photo and the
  `object-fit: cover` crop visibly zoomed. Now `flex: none` with `height: 280px` from 1280
  (exactly its old Today height) and `520px` at 1024–1279, where hours wrap to two rows and the
  panel is 1032–1115px tall; `margin-top: 48px` pins it 64px under the "Rain" line in both views
  and the height difference goes below it. 288px wide. Measured identical in both tabs at
  1024/1280/1920. Don't give it back a flexible height.
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

**The app's `/map` (05.10.2026, the client: "doesn't work as the spec says").** Spec: every
business and event on the map, a category filter, clusters. Found and fixed:
**(1) the map never fitted its points** — `LeafletMap` passed `center` + `zoom` together with
`bounds`, and react-leaflet's `MapContainer` uses center+zoom and ignores bounds when both are
present, so every map sat on the fixed Seattle view: edge clusters were cut off and, after a
filter, the remaining places could be outside the frame. Now center/zoom go in only without
bounds (0–1 point) and bounds fit with `boundsOptions` padding 40px (verified: no marker or
cluster outside the frame at 375/1440, with and without filters; a single result zooms to 15).
**(2)** the filter lists sections in site order (Directory, Shopping, Leisure, then Events),
categories by admin `order` then A–Z, subcategories right under their parent indented with
` ` (before, "Car Repair" sat among unrelated top-level categories); first option "All
categories", label screen-reader-only. **(3)** a legend explains the pin colours (Premium /
Luxury / Business / Event — only kinds present); the count of places was dropped at the client's
request. Layout (`.map-head` in business.css): from 1280 one row, `auto 1fr auto` — heading left,
legend centred in the gap between the heading and the filter (+2px for the eyebrow's 4px shift
past its column; measured equal gaps, 0.01px off), the 300px filter flush with the map's right
edge; legend and filter `top: 8px` so they sit level with the visible heading text. At 640–1279
the row is heading + filter on the right, the legend a centred row under it (it is ~496px and
does not fit between them at 1024); on a phone everything stacks. The map is 10px under the
heading (under the legend row at 640–1279), as the blocks on Shopping.

**App `/map` ad (07.10.2026):** the prototype's City Map had a top 728×90; stage 2 had dropped it.
`MAP_TOP` is back above the heading (`<AdSlot className="ad-slot-top">`), with a `map` value in
the AdSlots `page` select (migration `20261007_105644_map_ad_slot_page`) and the slot in
`seed-phase4.ts`. Existing databases need the row added once (it was inserted by hand locally).
AdSlots now show their human `name` as the title, so the banner form's "Where it shows" picker
lists "Home — sidebar 2 (300x250)" rather than codes.

**`qa.html` — Q&A** — topic chips + a list of native `<details>`. No JS for the accordion:
keyboard and screen readers work on their own.

**Code:** [qa.html](qa.html) · [css/pages/qa.css](css/pages/qa.css) · [js/pages/qa.js](js/pages/qa.js) (`qaItemTemplate`, `renderFilters`) · data [js/mock-data/qa.js](js/mock-data/qa.js)

---

**App, 09.10.2026 (client's list):**
- **Jobs** shows 6 openings (5 at first, the client asked for 6), then "Show more jobs (N)" adds 6
  (`PAGE` in `JobsBoard.tsx`; the count
  is tied to a JSON key of the filter state, so any filter/sort change starts again at 5 without an
  effect).
- **Events**: head 8px closer to the banner (`--snug`). The filters were redesigned the same day
  after two rejected tries (an aligned panel with labels, then a SORT row — "remove sort, I meant
  when and category"): **WHEN is underline tabs** like Weather's Today / Week (heading font, 18px
  from 640, 14px on phones; red 3px underline on the active one, laid over a 1px rule that runs
  only from the first tab's text to the last's — `width: fit-content`, centred), **CATEGORY soft
  grey chips** without a border (navy when selected) under them, both rows centred (measured to
  0.1px at 1024/1440). **From 1440 the tabs and chips sit in the heading row**, between "Seattle events" and
  "Submit an event" (after a day of 4–6px nudges the client settled it): the filter block starts
  right under the banner (4px; tab letters 16px below it) and the heading and the card are centred
  on the filter block — `.events-head` is a 92px band (44 tabs + 12 + 36 chips) with
  `align-content: center`, `.events-filters` sits on it with `margin-top: −92px`, `z-index: 1`,
  `pointer-events: none` except on its links (checked: the card and every tab/chip get their
  clicks). Measured: filter block centre 678, card 680, heading text ≈677. Then "lower the sort
  8px": `margin-top: calc(−92px + 8px)` — tabs, chips and the cards below 8px lower, the heading
  and card stay (tab letters 24px under the banner, filter centre 8px below the heading's).
  Then the heading and the card 10px lower: `.events-head { translate: 0 10px }` (from 1440,
  out of flow — filters and cards stay; removed and restored the same day). Card bottom level with
  the chips'. Below 1440 the events head has no extra lift of its own (the −16px rule went): it
  uses `--snug`, which the shared rule switches off at 640–1439 for heads with a `.post-card`. At 1280 the tabs would
  come 13px from the heading, so below 1440 they stay under it. Phones: rule → chips 8px. The WHEN/CATEGORY labels are
  screen-reader-only (`aria-labelledby` keeps them). At 375 the four tabs fit exactly (343/343px);
  at 320 the last wraps (`flex-wrap`) instead of pushing the page sideways. No sorting.
- **Events bottom banner → footer 16px** like Home (`.events-section { margin-bottom: -20px }`,
  was the shared 36), the list page only.
- **Shopping / Leisure**: see the directory note (snug head, Shopping eyebrow +12px).
- **Weather**: WEATHER_TOP in the heading row from 1440, as on Cars (`.ad-slot-top--in-head`).
  "Place an ad" is centred on the banner there — the shared `.ad-slot-top--in-head` rule in
  components.css sets the head card's `top: 0` instead of 8px (centres 577 / 577 at 1440 and
  1920); Cars' "Place a listing" the same.
- **Map**: from 640 the eyebrow + heading are 8px right and the category filter 8px left
  (`translate` / `left`, business.css); the legend stays centred between them.

**App Jobs, 09.10.2026 (second list):** "Work in Seattle" 16px right of the heading
(`.jobs-head .eyebrow { left: 16px }`, as Shopping / Cars; no overflow at 320/375); the Sort row
was moved to the cards' right edge and put back centred over the cards the same day; "Show more jobs" is centred on the cards (`.jobs-more` card-wide too — it was
centred on the 104px wider column, 52px right).

**App, 12.10.2026 (client's "other sections" sheet):** B1 = each page's *_TOP, B2 = *_INFEED_1 under
the main content (`.ad-slot-under`): Jobs, Weather, Map, Services, Shopping, Leisure; Events
already had EVENTS_INFEED_1. The app has no Real Estate page, so nothing there. Existing side slots
(Jobs, Events) are not on the sheet and stay.

**App, 17.10.2026:** Jobs — "Job board" 4px right (`.jobs-head h1`, relative; the eyebrow stays at
16). Shopping / Leisure — head → columns 8px (`.section-head--snug` margin-bottom in
directory.css; the Business Directory keeps 12); their B2 under the list 16px from the last card,
the same as banner → footer (`.biz-infeed-ad--last` margin-top, components.css; was 8).
City Map (17.10.2026): the head carries `.section-head--snug` too — banner → "Neighborhood guide"
letters 13.4px (was 21.4); the legend / category select stay ≥14px under the banner.
Weather (17.10.2026): "Around the region" (`.weather-h`) 32px under the board, was 48.

**App, 19.10.2026 (client's phone list):** heading → first block 8px on phones on every page with a
head card (shared `.section-head .post-card` margin-top 8, was 16: News, Cars, Weather, Events) and
on City Map (filter 8 under the heading, legend 8 under the filter). **Map legend on phones**: one
centred row in a soft rounded strip, "Premium · Luxury · Business" (the word "business" is
`.map-legend-more`, shown from 640), 12px between items so it fits 320. **Weather**: the sunrise
tile's "+2 min tomorrow" wraps on phones (it ran out of the 155px card), one line from 640.
**Jobs**: the head's "Post a job" is the same `.post-card` as the desktop one in the filter column
(`.jobs-post-head`; was a red `.btn`): below 375 full width under the heading; 375–639 compact
(no icon / kicker, 18px title) on the heading's row, opposite "Job board" — with the kicker it ran
into "WORK IN SEATTLE"; 640–1023 the full 300px card centred on the head (+16px under the head so
the sort row stays 8px below it); from 1024 hidden as before (the side card shows). Sort chips on
phones: short labels "Newest · Top pay · Low pay · A–Z" (full ones in `aria-label`, shown from
640), 10px padding and 6px gaps — one row down to 320.
Later the same day (client's tablet list): **Jobs phone** — the full card under the heading like
Cars' "Place a listing" at every phone width (the compact 375 variant is gone); head → sort 8px,
sort → first job 12. **Jobs tablet (640–1023)** — a two-column head: eyebrow, "Job board" and the
sort chips (short labels until 1024, left-aligned, `max-width: 100% − 316px`) on the left, the full
card on the right centred on that whole block (`top: 34px`, constant — measured centred at
640/768/1000). **News / Cars / Weather tablet** — head margin-bottom 16 at 640–1023 (8 again from
1024) so the card, which hangs 8px below the head, clears the block under it by 8.
**Cars Services** — "All auto businesses" centred in its row on phones; from 640 centred on the
head like "All news" (`--head-btn-dy: calc(var(--space-1) - 9px)`, was ~17px low).
