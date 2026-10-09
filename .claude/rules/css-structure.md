---
paths:
  - "css/**"
  - "app/src/app/*/styles/**"
  - "*.html"
  - "auto/*.html"
---

<!-- Moved verbatim from CLAUDE.md (lines 1167-1400) on 02.10.2026; loads only when a matching file is read. -->
# CSS structure, section heads, sticky rules, agreed deviations from design.md

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

**App only: `.post-card` (components.css) is the one "call to action" card** — tinted icon
circle, small question line, red title, red arrow circle. Jobs ("Post a job", in the filter
column), Events ("Submit an event"), Cars ("Place a listing"), Weather ("Place an ad") and News
("Share the news" — on News from 1024 it lands exactly over the 300px right rail; on an
article page, 300px wide and centred under the photo column) all use
it (client, 03–04.10.2026). Hover changes only the shadow — the old Jobs lift and arrow slide
were removed at the client's request ("no jumping"). In a `.section-head` the shared rule puts
it at the right edge, 300px, spanning the eyebrow and heading rows, `top: 8px` so its centre
matches the visible text (measured equal at 640–1920); below 640 it is full width under the
heading. A new page that needs such a button uses this class, not a copy.

**App, 07.10.2026: empty ad slots are a "house ad" (`.ad-slot--house`, BannerSlot.tsx), not the
dashed box** — thin border, "Advertisement · 728×90" tag in the corner, "Your business here",
a line of copy and a "Place an ad →" pill; wide slots (728x90, 320x100) lay out in a row, boxes
and towers (300x250, 300x600) stack with the tinted icon circle of `.post-card`. Forms:
`.cf-turnstile` is centred with rounded corners on every form, and the photo field is a styled
`.photo-picker` over a visually hidden native input (English, unlike the browser's own button).
A "Developed by · Alexander" Telegram pill (`.footer-credit`) sits under the copyright line,
centred on it: both live in `.footer-copy-stack` (inline-flex column, as wide as the longer line).
Demo banners (07.10.2026): every slot has a demo creative (`DEMO_BANNERS` in seed-phase4.ts,
generated by `creative()` — wide, phone strip, box and a centred tower layout), all `isDemo`.
A demo banner is filler: `ActiveBanner.demo`, a slot shows it only while no paid banner runs
there (`liveIndexes` / BannerSlot), and `/advertise` counts only paid banners as Booked
(`isBooked`). purge-demo removes them with the rest of the demo content.

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
  sections is untouched at 96px. **App, 08.10.2026:** when that first section holds the 728x90
  top banner (`main > .section:first-child:has(.ad-slot-top)`) it is 16px, so the announcement
  plates sit 16px above the banner on every page (Home first, then the client asked for the rest).
- **Base text is 16px on mobile, 18px from 1024px** (§2) — but the site keeps a dense,
  portal-like feel, so most secondary text sits at `--text-xs` (14px), the floor of the scale.
- **Text below 14px survives in exactly one place**, marked in the CSS: the captions inside
  ad placeholders (`.ad-slot-label` / `-tier` / `-status`), which otherwise stop fitting a
  320×100 box. (The logo's tagline is now part of the logo image, and the inner hero's script
  wordmark is gone.)
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
  (The app's header uses `auto 1fr auto` instead — centred in the logo–utilities gap, see
  `chrome.md`.)
  Below 1024px the two nav rows merge into one scroller instead. The secondary links are 36px
  tall and the ENG switch 32px from 1024px up: §8's 44×44 rule is in the responsiveness section
  and is about touch, and at those widths the pointer is a mouse — on touch widths both are back
  to 44px. **If you add a nav item, lengthen a label, or put anything back into the cluster,
  re-measure** — the first thing that breaks is `.nav-links` quietly turning into a horizontal
  scroller at desktop width, and the second is the nav sliding off centre.
- **Two font families** (§2): Libre Franklin and Public Sans. Pacifico went with the inner hero's
  script wordmark on 29.09.2026.

**App, 09.10.2026, two shared head classes in `components.css`:** `.section-head--snug` — the
head 8px closer to the `.ad-slot-top` above it (`.ad-slot-top + .section-head--snug`, 14px banner
→ eyebrow letters at 1440; News, Cars Services, Shopping, Leisure, Events). `.ad-slot-top--in-head`
on the banner — from 1440 it shares the head's row (Cars, Weather), see page-auto.md.
