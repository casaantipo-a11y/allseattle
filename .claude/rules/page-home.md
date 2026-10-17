---
paths:
  - "index.html"
  - "css/pages/home.css"
  - "js/pages/home.js"
  - "app/src/app/*/page.tsx"
  - "app/src/components/home.tsx"
  - "app/src/app/*/styles/home.css"
---

<!-- Moved verbatim from CLAUDE.md (lines 320-375) on 02.10.2026; loads only when a matching file is read. -->
# Home page

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

**App home, 07.10.2026:** "What is on / Coming up in Seattle" eyebrow + heading 12px lower
(`.home-events-head`, translate — the button and cards stay); "More from Seattle" eyebrow 16px
below its cell (was 8); the gap from the HOME_INFEED_2 slot under the feed to the footer is 16px
instead of 36 (`.home-feed { margin-bottom: -20px }`).
"Today in Seattle" was briefly lifted to 25px under the HOME_TOP banner, then the client asked
for it back the same day — it sits where it always did (46px from the banner to the letters on
desktop, 62 on a phone, where the empty left sidebar still takes its grid row).
08.10.2026 the client asked for less empty space again, this time for the whole block: plates →
HOME_TOP 16px (`& > .section:first-child`, was the shared 32), HOME_TOP → the row below 8px
(`.home-top`, was an inline 24), and the empty left sidebar is `display: none` below 1024
(`.home-sidebar.home-sidebar-left`). Banner → eyebrow letters 30px at every width (was 46 /
62 / 71); the whole row moves, so sidebars and "All news" keep their alignment.
Then, same day, from 1024: `.home-main { margin-top: -22px }` — the eyebrow's letter tops sit on
the same line as the tops of both sidebars (ad on the left, "At a glance" on the right), heading,
"All news" and cards lifted with it; measured 0px off at 1024/1440/1920. Below 1024 no sidebars
sit beside it, so nothing moves there. The plates → HOME_TOP 16px is now the site-wide rule in
base.css (`main > .section:first-child:has(.ad-slot-top)`). Later the same day the client asked for the head to sit
midway between HOME_TOP and the cards instead: from 1024 `.home-main > .section-head` is
`translate: 0 14px` (cards and sidebars stay put) — 22px banner → letters, 20–23 letters → cards
at 1024–1920. Phones/tablets were already within 2px of centred and are untouched. Then "raise the cards a little": the head's `margin-bottom` is 16px from 1024 (was 24), cards
12–15px under the letters (button → cards 6.5px at 1024, 11 at 1440). Then "higher still": the
head's `margin-bottom` is 8px and its translate 10px instead of 14 (so the "All news" button,
whose bottom hangs below the letters, doesn't land on the cards) — banner → letters 18px,
letters → cards 8 (1024) / 10.6 (1440), button → cards 2.6 / 6.8. Then "a touch lower":
`margin-bottom` 12px — letters → cards 12 / 14.6, button → cards 6.6 / 10.8; and "a touch more":
16px — letters → cards 16 / 18.6, button → cards 10.6 / 14.8; then "2px up": 14px
(`calc(var(--space-4) - 2px)`).
"All news" (08.10.2026) sits opposite "Latest news": `.home-latest-head` sets `--head-btn-dy` to
4px instead of `--btn-lower`'s 12, which put the button's centre 8–9px under the heading's ink
centre; now within ±1px at 640–1920. Phones keep the button on its own row.

**App home, 09.10.2026 (client's list):** HOME_TOP 2px higher — plates → banner 14px
(`& > .section:first-child:has(.ad-slot-top)` in home.css, beats the shared 16), everything below
moves with it. "All news" centred on the whole head — from the top of the "Today in Seattle"
letters to the bottom of "Latest news" — `--head-btn-dy: calc(var(--space-1) - 9px)`, measured
0–1px off at 640/1024/1440. Last newsfeed rule → HOME_INFEED_2 16px (`.ad-slot-bottom`
margin-top, was 24), the same as banner → footer.

**App home, 09.10.2026 (second list):** the "What is on / Coming up in Seattle" block (head and
cards, `section.home-events`) is 20px closer to HOME_INFEED_1 from 1024 — visible banner bottom →
eyebrow line box 18px at 1024/1440/1920, the same as HOME_TOP → "Today in Seattle". Only from
1024: there the banner is the last thing in the first section (both rails end far above it);
below 1024 the right rail's widgets follow the banner and a negative margin would land on them.

**App home, 12.10.2026 (client's Home scheme):** left column A1–A4 top to bottom (HOME_SIDEBAR_1–3
+ new HOME_SIDEBAR_4, 300x250), C1 = new HOME_RIGHT_1 (300x250) at the top of the right column
above "AllSeattle at a glance", B1 = HOME_TOP, B2 = HOME_INFEED_1. Side slots are desktop-only like
the rest of Home's rails. HOME_INFEED_2 is not on the scheme and stays (no price).

**App home, 17.10.2026 (two rounds of "less white"):** both columns — one gap between every block
(24px desktop, 16 phones): `.home-sidebar .widget { margin-bottom: 0 }` (the widgets' own 16 made
40 between them). "AllSeattle Auto / Fresh cars" (`section.home-cars`): head → cards 0 from 640 (12
on phones, where "All cars" is its own row) and the button centred on the head like "All news"
(`--head-btn-dy: calc(var(--space-1) - 9px)`, button → cards 9px); the block 12px closer to
HOME_INFEED_1 from 1024 (`margin-top: -12px`, banner → eyebrow box 12); cards → "More from Seattle"
eyebrow 44px — the section's bottom padding 8 (`& > .section.home-cars`, stronger than base.css
`main > .section:not(:last-of-type)`). Car photo frames are slate-soft (#E2E8F0) site-wide now
(`.car-card-photo`, components.css; was the near-white bg-soft, which melted into the page around
upright photos).
