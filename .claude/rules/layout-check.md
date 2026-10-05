---
paths:
  - "*.html"
  - "auto/*.html"
  - "css/**"
  - "js/**"
  - "app/src/app/*/styles/**"
  - "app/src/components/**"
---

<!-- Moved verbatim from CLAUDE.md (lines 140-189) on 02.10.2026; loads only when a matching file is read. -->
# Checking a layout change (prototype and app)

**Use the `measure` skill** (`node .claude/skills/measure/scripts/measure.mjs <url> ...`, or the
`layout-verifier` subagent) — it implements everything below. The text stays as the reference for
why each step exists.

### Checking a layout change

**Do not screenshot narrow widths with `--window-size`.** Headless Chrome on this machine clamps
its window to roughly **504 CSS px**, so `--window-size=375` quietly returns a 375px-wide *crop of
a desktop render*: content looks truncated and a horizontal scrollbar appears that no real browser
shows. Two false bugs have already been chased this way.

A trustworthy pass drives Chrome over CDP instead:

1. Launch Chrome or Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` is installed and works the same) with `--headless=new --disable-gpu --no-sandbox --user-data-dir=<tmp> --remote-debugging-port=9222 about:blank`.
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
