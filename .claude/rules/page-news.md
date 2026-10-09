---
paths:
  - "news.html"
  - "css/pages/news.css"
  - "js/pages/news.js"
  - "js/mock-data/news.js"
  - "app/src/app/*/news/**"
  - "app/src/components/news.tsx"
  - "app/src/app/*/styles/news.css"
---

<!-- Moved verbatim from CLAUDE.md (lines 376-435) on 02.10.2026; loads only when a matching file is read. -->
# News page

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

**App article page (`app/`, `news/[category]/[slug]`), 05.10.2026:** the "News / Category"
breadcrumb is centred over the article column (= the photo), 18px (tried 16 and 20), and
centred vertically between the bottom of the ad above and the top of the title's letters:
`.article-crumb` in news.css has `margin-top: calc(0.174 * clamp(30px, 4vw, 48px) + 1.65px)` —
the gap under the crumb grows with the h1 size, so the top margin follows it (measured by pixel
rows: equal within 1px at 375–1920); "Share the
news" at the end of the article is the shared `.post-card` ("Got a news tip?"), 300px, centred
under the photo column (measured 0.00px off at 375–1920).

**App News list, 09.10.2026 (client):** the head is 8px closer to NEWS_TOP
(`.section-head--snug`, 14px banner → eyebrow letters, was 22); pagination → footer 16px
(`.news-list-section { margin-bottom: -20px }`, was 36 — a margin on `.news-layout` does nothing:
base.css zeroes the last block's margin and the 36 is the footer's `margin-top`). Top News was
briefly aligned with the left 300x600 through a subgrid; the client asked for it back the same
day — it sits right under the 300x250 again.

**App News below 1024 (09.10.2026, the client: "what is this mess"):** the side rails used to
be flex rows with 260px items, so on a tablet each rail became two cells side by side — a 320x100
ad next to the tall Top News or Categories with empty space under the ad. Now below 1024 both
rails are one full-width stack under the feed (`flex-direction: column`, items `width: 100%`,
the ad wrapper centres its banner), the right rail first (`order: -1`: 300x250, Top News, then
Categories, the second ad), so two banners never stand together. List and article pages alike;
from 1024 nothing changed.

**App News list, 09.10.2026 (second list, "less space between the banner and Seattle news"):**
from 1440 the head is 12px closer to NEWS_TOP (`.news-list-section .ad-slot-top +
.section-head--snug`, −12 instead of −8): banner → eyebrow line box 6px (letters ≈9). At 640–1439
it stays 18 — "Share the news" stands beside the banner there and a lift would put it on it.
