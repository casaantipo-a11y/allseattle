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

- **Phase 4** — banners. `AdSlots` (every `<AdSlot code>` on the pages, seeded with
  placeholder weekly prices), `Banners` (images checked against the slot sizes ±2px, also at 2x/3x for sharp screens, shown
  between `startAt` and `endAt`, random rotation when several run in one slot, the "Your ad
  here" placeholder otherwise) and `BannerStats` (daily rows, unique `(banner, date)`, atomic
  upsert). Impressions are counted in the browser (≥50% visible for 1s, batched every 10s and
  with `sendBeacon` on leave → `POST /api/banners/impressions`), clicks through
  `GET /api/banners/click/[id]` (302 to the advertiser); bots are not counted. Each banner has
  a "Report" tab in the admin with totals, per-day figures and `Export CSV`
  (`/api/banners/report/[id]`). `/advertise` lists the placements with price and
  Available/Booked. GA4 has been in since phase 1 (after cookie consent, Consent Mode v2).
  The owner's guide is [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md) (Russian).

- **Stage 3, step 1 (14.10.2026)** — site accounts. `customers` is a second auth collection,
  separate from the team's `users`: sign-up at `/account/register` (`/api/account/register`:
  honeypot, Turnstile, 5 sign-ups per IP per hour), email confirmation (`verify`), log in,
  forgot / reset password, profile at `/account`; the header's account icon leads there.
  Customers never reach `/admin` (it lets only `users` in) and are not "logged in" for the
  admin's access rules: `isStaff` in `access/roles.ts` backs `isLoggedIn` and
  `publishedOrLoggedIn`, so a signed-in customer sees no drafts. Email goes through
  `lib/email.ts` — a Payload email adapter on Resend's REST API; without `RESEND_API_KEY` the
  message is printed to the server console (local testing). Payload accepts the auth cookie
  only from browsers (`Sec-Fetch-Site`), so test the cookie session with a browser or that
  header, not plain curl.

- **Stage 3, step 2 (14.10.2026)** — cars and jobs from site accounts, with moderation.
  "Place a listing" (`/cars`) and "Post a job" (Jobs) lead to `/account/listings/new`; the
  account has "My listings" (`/account/listings`: status, views, Edit / Hide / Show again /
  Renew 30 days / Delete) and an edit page per listing. Everything goes through
  `/api/account/listings*` and `lib/listings.ts` (local API, ownership checked in code) — the
  collections' REST write access stays team-only. A new or edited listing is saved as
  `source: user`, `status: pending` (new status, as is `rejected`), `owner`, `expiresAt` +30
  days, and the team gets a Telegram / email notice with the admin link (production: email
  only, to `NOTIFY_EMAIL` — Telegram is not wanted, the user's decision of 17.10.2026). Publishing or
  rejecting it in the admin (with `moderationNote` as the reason) emails the author
  (`hooks/moderation.ts`). Limits: 15 live-or-waiting listings per account (3 until 18.10.2026), 10 sends a day,
  10 photos per car. Photos are scaled to 1600px JPEG in the browser before upload, because
  Vercel caps a request at 4.5 MB (the older `/add-business` and Share-the-news forms send the
  originals and can hit that cap with large phone photos). `viewsCount` on cars and jobs is
  counted by `/api/views` (one per browser session, a plain SQL increment so a view never
  revalidates the page). An expired package (`packageExpiresAt`) now counts as no package in
  `packageOfBusiness`. Migration `stage3_listings_moderation`.

- **Stage 3, step 3 (14.10.2026)** — business accounts. Businesses have `owner` (a site
  account), `moderationNote` and the pending / rejected statuses. `/account/business` lists the
  account's businesses (status, package and its end date); `/account/business/new` registers
  one (up to 3 per account) as Pending review; `/account/business/[id]` edits name, categories,
  summary, description, contacts, socials, opening hours, logo, cover and gallery;
  `/account/business/[id]/offers` adds / edits / deletes promotions and products. Rules: a new
  or not-yet-live business waits for review; once live, the owner's edits go live at once and
  the team gets a notice (a paying business shouldn't vanish from the directory for a day over
  new hours); promotions and products are live at once. Package limits come from the existing
  collection hooks (categories, photos, promotions, product count) and come back as field
  errors; a new business gets the cheapest package's limits. An existing business is handed to
  its owner by the team (Owner field in the admin); an unchanged description keeps its rich-text
  formatting when the owner saves. `/add-business` stays a guest application form; a signed-in
  customer sees "Register a business" instead (checked in the browser, the page stays cached).
  Shared server code for the account's write routes is `lib/cabinet.ts` (auth, daily cap of 10
  saves across cars, jobs and businesses, team notices, photo upload/cleanup); photos uploaded
  from an account are marked `media.uploadedBy`, and only those are deleted when the owner
  removes them — team uploads can be used elsewhere. Migration `stage3_business_accounts`.

- **Stage 3, step 6 (14.10.2026)** — contest voting (done ahead of the Stripe steps, which wait
  for the client's keys). "Vote" on an entry opens a modal: email + Turnstile →
  `POST /api/contests/vote` (honeypot, 10 per IP per hour, one link per 2 minutes) → an email
  with `/contests/vote?token=…`. That page shows the entry and counts the vote only on the
  "Confirm my vote" button (`POST /api/contests/confirm`) — mail scanners open links, they
  don't press buttons. `contest-votes` (team-only read, unique contest + email, the token
  stored as a SHA-256 hash). Voting is open while the contest is Active and today (Seattle) is
  within startAt–endAt; `votingState` in `lib/contest-votes.ts` also gives the card label.
  Counts are one GROUP BY, cached under the `contest-votes` tag, expired on each confirmation.
  Deleting a contest deletes its votes. Migration `stage3_contest_votes`.

- **Stage 3, step 4 (14.10.2026)** — package subscriptions through Stripe, over its REST API
  (`lib/stripe.ts`, fetch, API version pinned; no SDK). `/account/business/[id]/package`: the
  current package, then either "Manage billing" (Stripe's billing portal: cancel, card,
  receipts) or a package choice + an explicit monthly-charge consent → Stripe Checkout
  (`mode: subscription`, the price sent inline from `Packages.priceMonthly`, so there is no
  price sync to run). Packages priced 0 stay "contact us". `/api/stripe/webhook` (signature
  checked on the raw body) handles `checkout.session.completed`, `invoice.paid`,
  `invoice.payment_failed`, `customer.subscription.updated|deleted` → `syncSubscription`
  sets the business's `package`, `packageExpiresAt` = paid period end + 1 day of grace,
  `subscriptionStatus` (active / canceling / past_due / canceled) and `stripeSubscriptionId`;
  cancelling just stops renewal and the package runs out on its date. Owner, moderation note
  and billing fields are hidden from the public REST (`staffOnlyField`). With
  `STRIPE_SECRET_KEY` empty everything says "contact us"; on `/advertise` "Choose …" leads to
  the account only for a priced package with Stripe on. Migration
  `stage3_package_subscriptions`. **To switch it on:** set `STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET` on Vercel; in Stripe add the webhook endpoint
  `https://<site>/api/stripe/webhook` with the five events above; save the billing portal's
  settings once (Settings → Billing → Customer portal: allow cancel, at period end; no plan
  switching); put real monthly prices on the packages in the admin.
  **Tested against a real Stripe sandbox (15.10.2026)**, events relayed to the local webhook:
  Checkout paid with 4242 → package on; billing portal opens; cancel at period end → canceling;
  a test clock renews (+1 month), a failing card → past_due with the date kept, a new card →
  paid and extended; deleting the subscription → canceled, the package runs to its date; a
  banner place paid → draft banner, the place refused to a second buyer. Found and fixed: the
  package was extended on `customer.subscription.updated` before the period was paid (now only
  a paid latest invoice extends it; the subscription is always re-read from Stripe), and new
  Stripe accounts have **Managed Payments** on by default, which refuses our Checkout (no
  custom text, needs a product tax code): `STRIPE_MANAGED_PAYMENTS=off` turns it off, or leave
  it on and set `STRIPE_TAX_CODE` — the client's choice (Stripe as merchant of record handling
  US sales tax for a fee, or not). Stripe's Adaptive Pricing shows prices in the buyer's
  currency (e.g. UAH from Ukraine); US buyers see USD.
  **Sales tax (17.10.2026):** the client chose Stripe Tax "Basic" (0.5% a transaction) and set it
  up in his account (head office and a Washington sales-tax registration). `STRIPE_AUTOMATIC_TAX=on`
  turns on `automatic_tax` in both Checkouts with a required billing address, prices are
  `tax_behavior: exclusive` (tax on top, as the note under the prices says) and the subscription
  keeps the tax on renewals. Tested in the sandbox (tax set up the same way there): $69 + $7.28
  (10.55%, Seattle) = $76.28. `STRIPE_PORTAL_CONFIGURATION` can name a portal configuration made
  through the API instead of the Dashboard default. The client's live key is a restricted
  `rk_live_` key; its permissions were checked to cover everything the site calls.

- **Stage 3, step 5 (14.10.2026)** — banner places bought online (`lib/ad-billing.ts`). A place
  is one AdSlot code with a price in `lib/ad-placements.ts`. On `/advertise` "Available" leads
  to `/account/ads/new?slot=…` when Stripe is on (else the inquiry form, as before); a row
  that covers several pages ("Other sections") is Available while any page is free and the
  buyer picks the page. Checkout (subscription, metadata `kind=banner`) is refused when the
  place is taken: a paid banner running there, or one bought online and still paid for. The
  shared webhook creates the banner as a draft on the first event (owner, slot, start now,
  `endAt` = paid period end + 1 day; welcome email + team notice), moves `endAt` on with every
  payment and records cancellation. `/account/ads`: the account's places with status ("Waiting
  for your picture", In review, Live until…, Not approved), lifetime views / clicks / CTR from
  `banner_stats`, "Manage billing"; `/account/ads/[id]`: picture(s) at the slot's exact size
  (sent as picked, not scaled — the collection's `checkSizes` reports a wrong size per field),
  name and link → Pending review; the team publishes. Banners: pending / rejected statuses,
  owner, moderation note, subscription fields; `imageDesktop` is required only to publish; the
  public REST shows published banners only. Migration `stage3_banner_places`.

- **Stage 3, launch prep (14.10.2026).** Security pass: customers can't change the account
  email themselves; "forgot password" at most every 5 minutes per account; one document saved
  at most every 30 s (each save notifies the team); `media.uploadedBy` hidden from the public
  REST; the team is told about a double package subscription or a banner place bought twice.
  The older public forms (Share the news, Add your business) now scale photos to 1600px before
  sending too. **Daily reminders** (`lib/reminders.ts`, `/api/cron/daily`, Vercel Cron at 16:00
  UTC in `vercel.json`): an owner is emailed 2–3 days before a car or job comes off the site,
  and before a package set by hand ends; needs `CRON_SECRET` on Vercel (off while empty).
  **Delete my account** (bottom of `/account`, `lib/account-delete.ts`): confirmed with the
  password; refused while a subscription still renews (cancel in "Manage billing" first).
  Deletes the cars and jobs (with photos) and businesses that never went live (with their
  promotions and products); published businesses and banners stay with the owner cleared,
  for the team to decide. Signs out, emails a confirmation, notifies the team.

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

The local cluster is UTF-8 (`initdbFlags` in `scripts/db.mjs`), like Neon. Until 16.10.2026 it
took the Windows codepage (WIN1251 here) and refused text such as "café" with error 22P05; that
database was copied into a UTF-8 one built by `pnpm migrate`, and the old one is kept in the same
cluster as `allseattle_win1251`. A migrated database carries `media._objectkey` (R2 only); locally,
without R2, `pnpm dev` then asks to drop it ("Accept warnings and push schema?") — the column is
empty there, so it was dropped by hand. If `pnpm dev` routes `/api/...[id]` calls to Payload's
"Route not found", or `pnpm build` stops on `.next/dev/types/validator.ts`, the dev cache is
corrupt: move `.next/dev/types` aside and restart.

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
4. Deploy, then seed once from your machine against Neon with `pnpm seed:prod`
   (`pnpm purge-demo:prod` removes the demo content again) — it reads
   `DATABASE_URL` from `.env.neon.local`, the `S3_*` from `.env.r2.local`, and
   `PAYLOAD_SECRET`/`SEED_ADMIN_*` from `.env.vercel.local` (all gitignored), and refuses to run
   unless the database is Neon. Don't `source` those files in a shell: the Neon URL contains
   `&`, which the shell treats as "run in background", so `DATABASE_URL` silently falls back to
   the local one.

**Current setup (01.10.2026).** The repository belongs to a friend's account, so Vercel can't
import it from GitHub. Deploys go from this machine instead: `npx vercel deploy --prod` in `app/`
(the project is `allseattle` under the `mijckela-4959` Vercel account, live at
https://allseattle.vercel.app, region `pdx1` from `vercel.json`, next to the Neon database in
AWS us-west-2). `.vercelignore` keeps local env files, the local database and local uploads out
of the upload. Schema push (dev mode) only runs against a local database (`push` in
`payload.config.ts`), so Neon changes through migrations alone.
5. Open `/admin`, log in with the seeded admin, change the password, fill in **Site settings**
   (GA4 ID, Search Console verification, email, socials).
6. In Google Search Console add the site and submit `/sitemap.xml` and `/news-sitemap.xml`.

When the domain is chosen: add it in Vercel, change `NEXT_PUBLIC_SITE_URL`, redeploy.

## How it fits together

- `src/collections`, `src/globals` — the Payload schema. Access by role (`src/access/roles.ts`):
  **admin** everything, **editor** news/pages/header and news tips, **sales** businesses,
  categories, promotions, products, banners and business/ad inquiries. Only admins
  change package prices and limits.
  The admin UI is English with Russian available per user (account settings → Language); in Russian the two form warnings (valid email, required field) stay English (client, 19.10.2026).
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
