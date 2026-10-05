---
name: measure
description: Measure a page's layout over CDP (headless Edge, device emulation, cache off) at several widths and get compact JSON — horizontal overflow, header pinning, nav overflow, sub-44px touch targets, broken images, console errors, and rects of chosen selectors. Use after any layout/CSS change in the AllSeattle prototype or app instead of hand-writing a CDP script or taking screenshots.
argument-hint: <url-or-path> [selectors...] [--widths 375,1024,1440] [--shot]
---

# measure

Runs `scripts/measure.mjs` (in this skill's folder). It encodes the procedure from
`.claude/rules/layout-check.md`, so don't re-derive it by hand.

1. Make sure a server is up:
   - prototype: `python -m http.server 8000` in the repo root (run it in the background);
   - app: `pnpm db` + `pnpm dev` in `app/` → `http://localhost:3000`.
   A bare path (`/cars`, `auto/index.html`) means: app if it looks like an app route and port
   3000 answers, otherwise the prototype on 8000.
2. Run:
   ```
   node .claude/skills/measure/scripts/measure.mjs <url> --widths 375,768,1024,1440,1920 --sel ".a,.b"
   ```
   `--sel` gives the rects (x, y, w, h, bottom in page coordinates, 0.01px) of the first 3 matches
   per selector — use it to check the exact numbers a request names ("10px between X and Y").
   Add `--shot` only when a picture is really needed; it writes PNGs to a temp dir and prints the
   paths — read one, not all.
3. Report `issues` first (empty = clean), then only the numbers the task is about. Pass several
   pages as separate runs — one browser per run keeps a renderer hang from taking down the batch.
   A full-site pass is 17 pages in the prototype (see the page list in CLAUDE.md).

Known, agreed exceptions that will still show up: `.btn-sm` is 40px tall, the secondary nav and
ENG switch are under 44px from 1024px (mouse widths, so not counted there).
