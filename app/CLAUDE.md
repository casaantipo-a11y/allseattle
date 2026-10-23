# CLAUDE.md — app/ (stage 2: Next.js 16 + Payload CMS 3 + Postgres)

Loads when Claude reads files under `app/`. `README.md` here is the full doc (phases, env vars,
deploy, how it fits together) — read the relevant section of it instead of guessing.
The prototype's per-page notes in `../.claude/rules/` cover the same pages here too (`cars/**`
pulls in `page-auto.md`, the styles folder pulls in `css-structure.md`, etc.).

## Commands (pnpm, from `app/`)

```
pnpm db              # local embedded Postgres on 127.0.0.1:5433 (keep running in its own terminal)
pnpm seed            # admin + demo content (reads ../js/mock-data/news.js and ../img/ — don't move them)
pnpm dev             # http://localhost:3000, admin at /admin
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint
pnpm build           # needs the DB running
pnpm migrate:create <name>   # after any collection/global change; commit src/migrations/
pnpm generate:types          # after schema changes (src/payload-types.ts)
```

Before a commit: `pnpm typecheck` and `pnpm lint`; `pnpm build` for anything touching routing or
config. Verify UI by running it (no test suite) — see `../.claude/rules/layout-check.md`.

## Where things are

- `src/app/(frontend)/` — public routes; `styles/` holds the prototype's CSS, copied unchanged
  (home.css/news.css wrapped in `[data-page="…"]` on each page's `<main>`). Tailwind only for parts
  new in stage 2, without its reset. **The prototype CSS is unlayered, Tailwind is in cascade
  layers, so any prototype rule wins over a utility on the same property**: `base.css` sets
  margins on `p`, `h1–h4`, `ul` and font sizes on `h1–h4`, so `mt-4` on a `<p>`, `text-xl` on an
  `<h2>` or `mb-3` on a `<ul>` silently do nothing. Put spacing on a `div` (or wrapper), keep the
  site's heading sizes, and reset a heading margin inline when it must be 0 (the account pages
  do this).
- `src/components/` — shared UI (`SiteHeader` + client `NavLinks`, `HeroBanner`, `AdSlot`,
  `business.tsx` `BizRow`, per-section folders `cars/`, `jobs/`, `map/`, `weather/`).
- `src/collections`, `src/globals` (e.g. `Header.ts` — the editable menu with `subLinks`),
  `src/access/roles.ts`, `src/hooks/revalidate.ts`, `src/lib/queries*.ts`.
- Ad placements are `<AdSlot code="…" size mobileSize>`; codes are rows in the `AdSlots`
  collection, seeded in `src/scripts/seed-phase4.ts` — renaming a code means updating the seed
  and the existing DB rows (local and Neon), not just the JSX.

## Rules specific to app

- Fonts stay Libre Franklin + Public Sans; eyebrows uppercase red; mobile-first `min-width` only
  — same as the prototype. The prototype has no animation at all; app's styles currently carry
  five short `transition`s (business.css, components.css, jobs.css ×3) — whether the no-animation
  rule applies here is not decided yet, so don't add new ones without asking.
- Prettier config exists but 22 files don't match it yet — don't reformat whole files as a side
  effect of an unrelated edit.
- No `?v=` cache-busting here (Next fingerprints assets).
- Secrets live in `.env`, `.env.local`, `.env.neon.local`, `.env.r2.local`, `.env.vercel.local` —
  never print or copy them; never `source` them in a shell (the Neon URL contains `&`).
- Deploy is `npx vercel deploy --prod` from this machine (the friend's repo can't be imported into
  Vercel). It's outward-facing: only on the user's explicit request. In PowerShell the user runs
  `npx.cmd` (script execution is disabled there, `npx.ps1` won't load).
- **Before every deploy, `git status` must not show `src/app/(payload)/admin/importMap.js` or
  `src/payload-types.ts`.** A running `pnpm dev` regenerates both without R2 configured locally
  and drops the S3 upload handler; `vercel deploy` uploads the working tree, not the commit, so
  that would break media uploads in the production admin. Stop the dev server (its child
  `start-server.js` keeps port 3000 after the parent stops), `git checkout --` both files, deploy,
  then restart dev. Never commit those local regenerations.
- Neon schema changes go through migrations only (`push` runs against a local DB only).
- After `vercel deploy` the CLI may print `Error: spawn EPERM` — that is its telemetry, not the
  deploy. Confirm with `npx vercel inspect <deployment url>` → `Ready`.

## Traps met in practice

- **Page CSS beats components.css even where you don't expect it.** Page files wrap their rules
  in `[data-page="…"] { … }` (one extra attribute of specificity) and load after
  `components.css`, so a shared rule there loses to the page's own rule of the same shape (e.g.
  `[data-page] .auto-rail { display: flex }`). Give the shared rule more weight (`main aside:is(…)`)
  or change the page file. Inside one file a later base rule overrides an earlier `@media` block
  of equal specificity — a phone-only base rule goes *before* the breakpoint blocks.
- **Phones and tablets (below 1024) have their own arrangement of the side columns**:
  navigation becomes a "Category: … ▾" button above the list (`DropPanel.tsx`), widgets and the
  columns' banners are rendered a second time inside the feed. The column copy sits in
  `.from-1024`, the feed copy in `.below-1024` (components.css); ad placements stay the same,
  only their position differs. Details: `../.claude/rules/css-structure.md` (19.10.2026).
- **The footer below 1280 is separate markup** — `.footer-compact` in `SiteFooter.tsx`; the
  desktop `.footer-inner` / `.footer-meta-bar` are hidden there. Change both when footer content
  changes.
- **`pnpm dev` sometimes misses an edit to a plain constant** (e.g. `EVENTS_COMING_SOON` in
  `lib/events.ts`) and keeps serving the old value — restart the dev server before concluding a
  change "doesn't work".
- **Content that is CMS data, not code**: the header menu (Header global, incl. `subLinks`),
  site settings (contacts, socials), the About / Contact / Terms / Privacy pages, event and other
  categories. Change them in the admin or through the REST API as an admin user, locally and on
  production separately — the seed only fills a fresh database.
- **Site accounts (`customers`) can't be created through REST, even as admin (403).** Sign up
  through `/account/register` (Turnstile test keys locally); an admin may then set `_verified`.
- Admin language: English by default, Russian per user; in Russian the `validation` and `error`
  translation groups are taken from English (client's request, `payload.config.ts`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
