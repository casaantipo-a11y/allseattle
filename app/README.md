# AllSeattle — stage 2 (Next.js + Payload CMS)

The live city portal: Next.js 16 (App Router) with Payload CMS 3 embedded in the same app
(`/admin`, `/api`), PostgreSQL, media on Cloudflare R2. The stage 1 prototype (plain HTML,
mock data) lives one folder up and stays deployed on GitHub Pages as the sales demo; its CSS was
ported here unchanged (`src/app/(frontend)/styles/`).

**Status: phase 1** — users and roles, media, news (categories, articles, Top news), static pages,
site settings / header / footer globals, the header with live Seattle weather and time, the home
page and news section on real data, SEO (metadata, OG images, sitemaps, Google News sitemap,
robots, JSON-LD, 301s for renamed slugs, on-save revalidation), cookie banner with GA4 Consent
Mode v2, `seed` / `purge-demo`. Directory, cars, jobs, events, contest, search, forms and banners
come in phases 2–4; their menu links 404 until then.

## Local development

Requirements: Node.js 20.9+ and pnpm (`npm i -g pnpm`). No Postgres install needed.

```bash
cp .env.example .env          # set PAYLOAD_SECRET (any long random string)
                              # and SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
pnpm install
pnpm db                       # terminal 1: local PostgreSQL on 127.0.0.1:5433 (data in ./.pgdata)
pnpm seed                     # terminal 2: admin user + demo content from the prototype
pnpm dev                      # http://localhost:3000, admin at /admin
```

In development Payload updates the database schema automatically. When you change a collection,
also create a migration for production: `pnpm migrate:create <name>` (commit `src/migrations/`).

Checks before every commit: `pnpm typecheck`, `pnpm lint`, `pnpm build` (the build needs the
database running).

Useful scripts:

| Script | What it does |
|---|---|
| `pnpm db` | local PostgreSQL (embedded, no install) |
| `pnpm seed` | admin user, demo news with photos (`isDemo`), settings, header, footer, placeholder pages. Safe to re-run |
| `pnpm purge-demo` | deletes everything marked `isDemo` after typing `DELETE` (`PURGE_DEMO_YES=1` skips the question) |
| `pnpm generate:types` | regenerates `src/payload-types.ts` after changing collections |
| `pnpm migrate` / `pnpm migrate:create` | run / create database migrations |

## Environment

All variables are listed in `.env.example` and validated at startup (`src/env.ts`) — a missing
required one stops the app with its name. Required: `DATABASE_URL`, `PAYLOAD_SECRET`,
`NEXT_PUBLIC_SITE_URL`. Everything else turns a feature on when set (R2, Telegram, Resend,
Turnstile). **No domain is hard-coded anywhere**: every absolute URL (canonical, sitemap, OG,
JSON-LD) is built from `NEXT_PUBLIC_SITE_URL`.

## Deploying: Vercel + Neon + Cloudflare R2

1. **Neon** — create a project (Postgres 17), copy the pooled connection string → `DATABASE_URL`.
2. **Cloudflare R2** — create a bucket, enable its public access (r2.dev or a custom domain), and
   an API token with read/write to that bucket. Set `S3_ENDPOINT`
   (`https://<account-id>.r2.cloudflarestorage.com`), `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (the bucket's public base URL). Without these, uploads
   would go to the serverless filesystem and disappear — R2 is required on Vercel.
3. **Vercel** — import the GitHub repository and set:
   - Root Directory: `app`
   - Build Command: leave the default — Vercel runs the `vercel-build` script, which applies
     pending migrations and then runs `next build`
   - Environment variables: everything from `.env.example`; `NEXT_PUBLIC_SITE_URL` = the
     production URL (the `*.vercel.app` one until the domain is chosen), a new long
     `PAYLOAD_SECRET`.
4. Deploy, then seed once from your machine against Neon:
   `DATABASE_URL=<neon url> pnpm seed` (add the S3 variables too so demo photos go to R2).
5. Open `/admin`, log in with the seeded admin, change the password, fill in **Site settings**
   (GA4 ID, Search Console verification, email, socials).
6. In Google Search Console add the site and submit `/sitemap.xml` and `/news-sitemap.xml`.

When the domain is chosen: add it in Vercel, change `NEXT_PUBLIC_SITE_URL`, redeploy.

## How it fits together

- `src/collections`, `src/globals` — the Payload schema. Access by role (`src/access/roles.ts`):
  **admin** everything, **editor** news/pages/header, **sales** (businesses, banners — phases 2 and 4).
  The admin UI is English with Russian available per user (account settings → Language).
- Public content has `slug`, `status` (draft/published), `isDemo`, an SEO tab, and a hidden
  `slugHistory`: renaming a slug keeps the old URL working as a permanent redirect.
- `src/lib/queries.ts` — every public read, wrapped in `unstable_cache` with a tag. Payload
  `afterChange` / `afterDelete` hooks (`src/hooks/revalidate.ts`) expire those tags, so a saved
  article appears on the site at once; pages are ISR otherwise.
- `src/app/(frontend)` — the site. Prototype markup and CSS for everything that existed in stage 1;
  Tailwind (theme + utilities only, no reset, in cascade layers) for the new parts.
- `src/scripts` — `seed.ts` reads the prototype's `js/mock-data/news.js` and `img/` directly.
