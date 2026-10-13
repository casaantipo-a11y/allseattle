---
paths:
  - "auto/**"
  - "css/pages/auto.css"
  - "js/pages/auto-*.js"
  - "js/mock-data/cars.js"
  - "app/src/app/*/cars/**"
  - "app/src/components/cars/**"
  - "app/src/lib/cars.ts"
  - "app/src/app/*/styles/auto.css"
---

<!-- Moved verbatim from CLAUDE.md (lines 760-934) on 02.10.2026; loads only when a matching file is read. -->
# Auto section (cars)

**`auto/index.html` — Auto catalog**

**Code:** [auto/index.html](auto/index.html) · [css/pages/auto.css](css/pages/auto.css) · [js/pages/auto-catalog.js](js/pages/auto-catalog.js) (`carRowTemplate`, `renderCatalog`, `renderList`, `renderTopics`, `renderFirms`) · data [js/mock-data/cars.js](js/mock-data/cars.js) · [js/mock-data/businesses.js](js/mock-data/businesses.js)

1. 728×90 ad (`auto-top`) — **above** the subnav on this page, see the geometry note below.
2. Auto subnav — Catalog / Add a Car / My Listings (on all four Auto pages).
3. **Directory of Enterprises** (since 29.09.2026 the first block, right under the subnav, at
   the user's request) — auto topics plus a 300×250 on the left, the Auto Services companies as
   `.biz-row` in the middle, a 300×600 on the right. Its head sits where "Cars for Sale" used to,
   so the 10px subnav-to-eyebrow rule below now applies to "Auto Services".
   `.auto-firms-head` has `margin-bottom: 16px` (29.09.2026, "more space" under the heading and
   the button, then "a bit less" than 24) — measured 18px from the heading, 20px from the button
   to the rows.
4. 728×90 (`auto-mid`) between the two blocks — `margin: 32px 0 24px`.
5. Section head — "AllSeattle Auto" / **Cars for Sale** + "+ Post a Listing".
6. **A full-width search bar** on navy, not a filter column: Make, Model, Price from–to, Year
   from–to, Find, plus an "Advanced search" disclosure holding body, transmission, fuel, mileage
   and sort. Everything filters as you pick; submit is swallowed.
   **In the app (`app/`, `auto.css`), 03–04.10.2026:** every field label (Make, Model, Price,
   Year, and the advanced ones) is indented `var(--radius-sm)` (8px), so it starts above the
   straight top edge of the white box, where the rounded corner ends. Flush with the box edge it
   read as shifted left; lined up with the text inside the box (a same-day try) was too far —
   the client chose this one. The text inside the white boxes sits 8px further left than the
   site's `.field select` (left padding `--space-2` instead of `--space-4`, only in
   `.auto-search`; 05.10.2026, asked in two 4px steps). "Advanced search" is centred in the panel (`width: fit-content; margin-inline:
   auto`), after an earlier same-week version that lined it up under "All makes".
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
the banner, 30px below it** (`top: 3px` on `.ad-slot-top`, `margin-top: 33px` on `.auto-subnav`;
in the app, 08.10.2026, the 3px shift is gone so the plates → banner gap is the site-wide 16px, and
the subnav margin is a plain 30px — the app renders no subnav today, the rule waits for one) and
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

**App Cars, 09.10.2026:** from 1440 CARS_TOP stands in the heading row, between "AllSeattle
Auto / Cars for sale" and "Place a listing" (`.ad-slot-top--in-head`, components.css): the banner
leaves the flow (−90px), the head is a 90px band with `align-content: center`, z-index keeps the
banner clickable over the head's empty grid. Saves the 90px row; plates → banner 16px, banner →
search panel 8px. Below 1440 the three do not fit in a row and the banner stays above the head.
"Place a listing" is centred on the banner there (the head card's `top: 0`, same rule as Weather).
`/cars/services`: head 8px closer to its banner (`.section-head--snug`).

**App Cars, 12.10.2026 (client's Cars scheme):** 21 demo listings on **21 different photo sets**
("every car photo different and matching its make", same day): the 6 from cars.js (c1, c2, c4,
c5, c8, c12), 7 from the prototype's 48-listing cars.js (git 56ea1af) on the remaining prototype
sets c3, c6, c7, c9, c10, c11, c13, and 8 new models on new photos **c22–c29, three shots of one
car each** like the prototype's sets (client: "3 photos like the old ones"): Tesla Model 3, Subaru
WRX, Toyota Tacoma, BMW 3 Series (330i), Toyota 4Runner, Ford Bronco, Hyundai Tucson, Honda Civic.
A first same-day version had one photo each (c14–c21, removed); Forester, Prius and Grand
Cherokee had no three-shot series of one car on Unsplash and were swapped for WRX, 4Runner, Bronco.
The seed updates photos and specs of existing demo rows from this list. All in `scripts/demo-cars-extra.ts`. Colours follow the photos
(`PROTOTYPE_CAR_COLORS` recolours the six prototype cars in the app only; the seed syncs the colour
of existing demo rows). The eight listings that had reused a photo set are in
`RETIRED_DEMO_CARS`, and the seed deletes them (demo rows only). Three prototype photos show an
older generation than the listing's year (Accord, Outback, Explorer) — makes and models match. B2 = CARS_INFEED_1 after the 10th car (`CarsCatalog` `feedAd`), C1 =
CARS_SIDEBAR_1 (300x250), C2 = CARS_SIDEBAR_2 (300x600), B1 = CARS_TOP in the heading row.
/cars/services: B2 = CARS_SERVICES_INFEED_1 under the list.

**App Cars, 12.10.2026 (later):** the last car → footer gap is 16px like Home and Events
(`.cars-list-section { margin-bottom: -20px }`, was 36; on phones the right rail's last banner is
the last block). Model names that start with a digit carry the make in the left catalog and the
Model select — "Mazda 3", "BMW 3 Series", "Toyota 4Runner" (`modelLabel` in CarsCatalog; the filter
value stays the model). /cars/services falls back to the old `auto-services` category while a
database hasn't been seeded with the 13-section tree.

**App Cars, 13.10.2026:** "Reset filters" in the open Advanced search spans the panel's full row and
is centred like "Advanced search" (`.auto-search-reset`: `grid-column: 1 / -1; justify-self:
center`); measured centres equal at 375/1024/1440.
