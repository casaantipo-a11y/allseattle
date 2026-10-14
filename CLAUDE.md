# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two projects in this repository

- **The repository root is the stage 1 prototype** — everything below this section is about it.
  It stays deployed on GitHub Pages as the sales demo.
- **`app/` is stage 2**, the real portal: Next.js 16 + Payload CMS 3 + PostgreSQL, built in phases
  from the client's spec (`prompt_allseattle_stage2.md`, not in the repo). **Read `app/README.md`
  before touching it.** It has its own toolchain (pnpm, `pnpm db` for a local embedded Postgres,
  `pnpm seed`, `pnpm typecheck / lint / build`) and none of the prototype's rules about "no
  backend" or `?v=` cache-busting apply there. What carries over: the prototype's CSS, copied
  unchanged into `app/src/app/(frontend)/styles/` (home.css and news.css wrapped in
  `[data-page="…"]`, set on each page's `<main>`), the fonts (Libre Franklin + Public Sans — the
  user kept them over the spec's Montserrat + Inter) and the uppercase red eyebrows. Tailwind is
  only for parts that are new in stage 2, without its reset. `pnpm seed` reads this prototype's
  `js/mock-data/news.js` and `img/` directly, so moving those breaks the seed.
- Phase status and deviations from the spec are in `app/README.md`. Decisions so far: code in
  `app/` of this repo (so Pages keeps serving the demo), local DB now and Neon later, prototype
  CSS kept as is, redirects for renamed slugs answer 308 (Next's permanent redirect; Google treats
  it like 301). Phases 2 (directory, packages, business pages, map, forms) and 3 (cars, jobs, events, weather,
  contest, Share the news, search, home blocks) are done; the user asked
  to build all phases locally first and choose hosting afterwards. The portal is live on Vercel
  (Neon + R2). **Stage 3** (site accounts, listings and businesses from accounts with
  moderation, contest voting by email, Stripe for packages and banner places, daily reminders)
  is built on branch `stage3`, not merged or deployed yet: it waits for the client's domain,
  Resend and Stripe keys. Each step is a section of `app/README.md`; the owner's side is in
  `app/ADMIN_GUIDE.md`. The account UI lives in `app/src/app/(frontend)/account/` and
  `src/components/account/`; write routes go through `src/lib/cabinet.ts` and friends.

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

**This file (with its `.claude/rules/`) wins on conflict**, because what's recorded here is load-bearing architecture (the
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
python -m http.server 8000          # any Python 3 works (3.12 is on PATH; a bare `python` may be reputation_bot's venv — harmless here)
# then open http://localhost:8000/
# for a phone on the same LAN: add --bind 0.0.0.0, browse to the machine's LAN IP instead of localhost
```

## Detailed notes live in `.claude/rules/` (load on demand)

Everything this file used to say page by page — section maps, the user's pixel-by-pixel decisions,
measurements, history — was moved **verbatim** into path-scoped rule files on 02.10.2026, so it no
longer costs ~27k tokens on every message. Each file loads automatically when a matching file is
read; when a task touches an area, read the file's rule explicitly if it hasn't shown up.

| Rule file | Covers | Loads for |
|---|---|---|
| `layout-check.md` | CDP measuring procedure, the `--window-size` trap | any HTML/CSS/JS, app styles/components |
| `chrome.md` | page shape, header, photo banner, footer | `*.html`, `partials.js`, header/footer CSS, app `SiteHeader`/`NavLinks`/`HeroBanner`/`SiteFooter` |
| `page-home.md`, `page-news.md` | Home, News | their HTML/CSS/JS and app counterparts |
| `page-contest-directory-pricing.md` | Contest, Directory, Pricing | same |
| `page-secondary.md` | Jobs, Events, Shopping, Entertainment, Weather, Real Estate, City Map, Q&A | same |
| `page-auto.md` | Auto catalog, listing, add, my listings | `auto/**`, `auto.css`, app `cars/**` |
| `js-architecture.md` | path depth, `partials.js`, price systems, ad slots, mock data, demo contract, helpers, logo | `js/**`, `*.html` |
| `css-structure.md` | load order, tokens, section-head rules, sticky, agreed deviations from `design.md` | `css/**`, app styles |
| `images.md` | WebP pipeline, photo pools | `img/**`, mock data |

**When a page or component changes shape, update its rule file in the same commit** (and
`structure-ru.md` for tagged sections) — a stale note is worse than none.

## Invariants that apply everywhere (short form — details in the rule files)

- **No animation**: no `transition`, `@keyframes`, `scroll-behavior: smooth`, hover `transform`.
  State rotations (accordion chevron) flip instantly. Settled by the user.
- **Mobile-first `min-width` only** at 640 / 768 / 1024 / 1280 (+1440). No `max-width` queries.
- **Every value from `tokens.css`** (spacing 4–128, type 14–60, radii 8/12/16/full); a raw `18px`
  is a defect unless an agreed deviation says otherwise.
- **Relative asset paths only** (`css/...`, `../css/...` under `auto/`) — a leading `/` 404s on Pages.
  `partials.js` resolves `SITE_ROOT` from `import.meta.url`.
- **The sticky header is a sibling of the `#site-header` mount, not inside it**, or sticky silently
  stops working. It is the only sticky element; every sidebar scrolls with the page.
- **Demo contract**: no fetch/XHR, every form shows a canned success panel that says nothing was sent;
  the contest vote counter is the only `localStorage` user.
- **A page module never imports another page module** without a `DOMContentLoaded` guard (that
  import also runs the other module's init).
- **Ad placements are inventory being sold** — never add or remove one without the user asking, and
  say so out loud when a change affects one.
- **Images are local WebP** (q 0.86, sized to their largest render), never hotlinked. No PIL /
  ImageMagick here; `convert` on PATH is Windows' tool — convert through headless Chrome.
- **Never screenshot narrow widths with `--window-size`** (headless clamps to ~504px); use CDP
  device emulation — `/measure` (`.claude/skills/measure/`) or the `layout-verifier` subagent does it.
