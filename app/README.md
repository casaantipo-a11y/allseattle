# AllSeattle — stage 2 (Next.js + Payload CMS)

The live city portal: Next.js 16 (App Router) with Payload CMS 3 embedded in the same app
(`/admin`, `/api`), PostgreSQL, media on Cloudflare R2. The stage 1 prototype (plain HTML,
mock data) lives one folder up and stays deployed on GitHub Pages as the sales demo; its CSS was
ported here unchanged (`src/app/(frontend)/styles/`).

**Status: phases 1–3 done.**

- **Phase 1** — users and roles, media, news (categories, articles, Top news), static pages, site
  settings / header / footer, the header with live Seattle weather and time, the home page and news
  on real data, SEO (metadata, OG images, sitemaps, Google News sitemap, robots, JSON-LD, redirects
  for renamed slugs, on-save revalidation), cookie banner with GA4 Consent Mode v2,
  `seed` / `purge-demo`.
- **Phase 2** — packages with limits (enforced on save with messages like "Standard package allows
  up to 2 categories"), a category tree for three storefronts (`/directory`, `/shopping`,
  `/leisure`, each with `/[category]` pages and search), businesses with automatic geocoding
  (Nominatim, 1 request/second; a failed lookup never blocks saving), promotions, products,
  documents (price lists, certificates), the business page `/biz/[slug]` in three designs
  (Standard / Luxury with tabs and a big gallery / Premium branded: header image, the business's
  colour, no other ads — an expired package falls back to Standard), `/map` (clustered, filtered
  by category), `/advertise` (packages from the database, price 0 = "Contact us", comparison
  table, inquiry form), `/add-business`, subdomains behind `ENABLE_SUBDOMAINS`, and the public
  forms pipeline (zod, honeypot, Turnstile, 5 per IP per hour, Submissions, Telegram + email).

- **Phase 3** — car makes (popular US makes, seeded) and car listings (`/cars` is the prototype's
  page on real data, per spec §13: Directory of enterprises — auto businesses, Luxury, Premium,
  then Standard — a banner, then Cars for sale with the search bar and the model catalog.
  `/cars/[slug]` with Vehicle JSON-LD), jobs with categories
  (`/jobs`: the prototype's work.ua-style board; `/jobs/[slug]` with Google Jobs JSON-LD),
  events with categories (`/events` filtered by today / weekend / month and category,
  `/events/[slug]` with Event JSON-LD, events on `/map`), contests (`/contests/[slug]`: entries
  by first name and age only, parental consent required, "Voting opens soon"), `/weather`
  (the prototype's dashboard on live Open-Meteo data, US AQI, nearby towns), `/share-news`
  (up to 5 photos into Media, the first one to Telegram), global search through
  `@payloadcms/plugin-search` (`/search`, grouped by type, plus suggestions in the banner after
  2 characters), the home page blocks (statistics, jobs, upcoming events, fresh cars, contest),
  the Jobs tab on Luxury/Premium business pages, and the shared listing limit (cars + jobs of a
  business ≤ its package's `maxListings`).

Banners, ad slots, statistics of impressions/clicks and `ADMIN_GUIDE.md` come in phase 4.

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

On Windows, `start-local.cmd` (double-click) opens the database and the production build
(`pnpm start`, needs a prior `pnpm build`) in two windows and then the browser; close both
windows to stop.

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

`seed` and `purge-demo` run outside Next.js, so at the end they call `POST /api/revalidate` on
`NEXT_PUBLIC_SITE_URL` (guarded by `PAYLOAD_SECRET`) to drop the site's cached data; if the site
isn't running there is nothing to refresh.
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
  **admin** everything, **editor** news/pages/header and news tips, **sales** businesses,
  categories, promotions, products and business/ad inquiries (banners in phase 4). Only admins
  change package prices and limits.
  The admin UI is English with Russian available per user (account settings → Language).
- Public content has `slug`, `status` (draft/published), `isDemo`, an SEO tab, and a hidden
  `slugHistory`: renaming a slug keeps the old URL working as a permanent redirect.
- `src/lib/queries.ts` — every public read, wrapped in `unstable_cache` with a tag. Payload
  `afterChange` / `afterDelete` hooks (`src/hooks/revalidate.ts`) expire those tags, so a saved
  article appears on the site at once; pages are ISR otherwise.
- `src/app/(frontend)` — the site. Prototype markup and CSS for everything that existed in stage 1;
  Tailwind (theme + utilities only, no reset, in cascade layers) for the new parts.
- `src/scripts` — `seed.ts` / `seed-businesses.ts` read the prototype's `js/mock-data/*.js` and
  `img/` directly. Demo businesses get coordinates from neighbourhood centres, not geocoding.
- Directory order (`src/lib/business.ts`): packages with priority placement first, higher package
  `order` ahead (Premium, then Luxury), then the manual `priority` (higher first), then name. The
  package in force is decided at render time, so an expired one drops without anyone touching it.
- Forms: `src/lib/forms.ts` + `POST /api/forms/{business-registration|ad-inquiry}`; the REST API
  itself refuses to create submissions. Notifications (`src/lib/notify.ts`) never block saving.
- Search: every document of news, businesses, cars, jobs and events gets a row in the `search`
  collection (`src/search.ts`) with its URL, a type and a short text; drafts stay indexed with
  `isPublished: false` and are filtered out, so un-publishing hides them at once.
- `MEDIA_DIR` (optional) moves local uploads to another folder — handy for a throwaway test
  database that must not touch the real `./media`.
- Leaflet only runs in the browser: `components/map/MapClient.tsx` loads it with `ssr: false`; pins
  are CSS divIcons (`styles/business.css`).
