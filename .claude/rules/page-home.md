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
