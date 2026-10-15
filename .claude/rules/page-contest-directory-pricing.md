---
paths:
  - "contest.html"
  - "directory.html"
  - "pricing.html"
  - "css/pages/contest.css"
  - "css/pages/directory.css"
  - "css/pages/pricing.css"
  - "js/pages/contest.js"
  - "js/pages/directory.js"
  - "js/pages/pricing.js"
  - "js/mock-data/businesses.js"
  - "js/mock-data/pricing.js"
  - "js/mock-data/stats.js"
  - "app/src/app/*/directory/**"
  - "app/src/app/*/advertise/**"
  - "app/src/app/*/contests/**"
  - "app/src/components/business.tsx"
  - "app/src/app/*/styles/directory.css"
  - "app/src/app/*/styles/pricing.css"
  - "app/src/app/*/styles/contest.css"
---

<!-- Moved verbatim from CLAUDE.md (lines 436-580) on 02.10.2026; loads only when a matching file is read. -->
# Contest, Business Directory and Pricing pages

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

**App contest page (`app/`, `contests/[slug]`), 05.10.2026:** the Rules block is a 72ch column
centred on the page with "Rules" and the rule lines centred (`.contest-rules` in contest.css).
Before, the shared `RichText` capped itself at 72ch of its own 17px font inside a 72ch-of-18px
wrapper, so the text hugged the wrapper's left edge and the block read as shifted left.

**App contest page, stage 3 (14.10.2026): voting.** The entry grid is the client component
`ContestVoting` (the prototype's `.contest-card` with `.contest-vote-count` and a `btn-block`
"Vote", as in contest.js) and the vote form is the prototype's `.modal-overlay` / `.modal`.
Closed or not-yet-open voting shows the old grey pill with `votingState().label` instead of the
button; the hero's status line ends with the same label.

**App business page (`/biz/[slug]`, `biz/BusinessView.tsx`), 15.10.2026:** rebuilt after the
client's "Lux" example (Commercial.pdf p. 3): name + categories with the month's views as digit
boxes; a data table with icons (`.biz-info`, business.css); "On the map" (wide, `#biz-map`,
"Show on map" links to it); "Promotions & deals" as rows; "Photos" (`BizGallery`: large 16:9 photo,
arrows, counter, thumbnail strip); "About"; products; downloads; "Related categories". Right
column: logo card with Visit website / Call, BUSINESS_SIDEBAR_1 (not on Premium), "Similar
places" (same category, paid first, 3), "We're hiring", contacts and socials, and on Standard
"Is this your business?". The tabs are gone — every section is on the page. Section headings are
`.biz-section-title` in business.css because the prototype's h2 rule beats Tailwind.

**App Directory, 09.10.2026:** 10 businesses a page (was 20 — "too many"); `PER_PAGE` in
`BusinessSection.tsx` is per section, Shopping and Leisure keep 20. The head carries
`dir-head--<section>`; Shopping/Leisure also get `.section-head--snug` (in directory.css as
`calc(-2px - 8px)`, since the directory's own −2px would otherwise win) and Shopping's eyebrow is
16px right of the heading (`.dir-head--shopping .eyebrow`, like Cars).

**App Directory, 09.10.2026 (second list):** the head is 12px closer to DIRECTORY_TOP at every
width (`.section-head.dir-head--directory`, `margin-top: calc(-2px - 12px)`): banner → eyebrow
line box 6px, as News from 1440. No card in this head, so nothing can land on the banner.

**App Directory, 12.10.2026 (client):** 13 sections with sub-categories (`lib/directory-tree.ts`),
seeded idempotently: rows with the same slug are reused and re-parented, the 23 demo businesses
move by name (`BUSINESS_SUBCATEGORY`), any other business by its old category's slug
(`OLD_DIRECTORY_SLUGS`), and old directory categories are deleted only when nothing uses them. Old
category URLs answer 308 to the new ones (directory `[category]` route). Slugs are unique
site-wide, so "Clothing" is `clothing-stores` (Shopping has `clothing`) and Kids & Family's
"Entertainment Centers" is `kids-family-entertainment-centers`. Shopping and Leisure keep their own
categories. The Headings widget is an accordion (`CategoryTree`, native `<details>`): only the
sections show, a click opens a section ("All <section>" + its sub-categories), another closes it,
the section holding the active category starts open and highlighted. Right column: C1
(DIRECTORY_SIDEBAR_1) → "AllSeattle at a glance" (Home's `StatsWidget`, live counts) → C2
(DIRECTORY_SIDEBAR_2). B2 = DIRECTORY_INFEED_1 after the 8th business; Shopping / Leisure get their
`*_INFEED_1` under the list. /cars/services now reads the Automotive section.

Build note (12.10.2026): `sectionStaticParams` pre-renders only categories that have businesses
(with their descendants). Building all ~117 directory categories exhausted the local Postgres's
connections ("too many clients") and gains nothing for an empty page; the rest render on first
visit and are cached like the others.

**App /advertise, 15.10.2026:** the head is `.section-intro`, not `.section-head`, so the shared
16px eyebrow drop never reached it — "Advertise on AllSeattle" stood 19–23px above "Placement
packages" against 3–7 elsewhere. `[data-page="advertise"] .section-intro .eyebrow` (pricing.css)
now drops it 16px (relative): letters 3.3px apart at 375, 7.1 at 1440, same as News.
The intro → package cards gap is 16px there (`[data-page="advertise"] .section-intro`, instead
of the shared 32), plus the grid's own 12px for the "Most popular" badge: text → cards 28px
(was 44), text → badge 18 from 1024.
