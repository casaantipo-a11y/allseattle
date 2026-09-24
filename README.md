# AllSeattle — Stage 1 demo prototype

A closed, in-person sales-demo prototype of a Seattle city portal (news, business directory,
car classifieds, banner ads). **There is no backend, database, or real data submission of any
kind** — every page is static HTML/CSS/JS with mock data, and every form is intercepted client-side
(validation + a fake success message) rather than actually sent anywhere.

## Running it locally

Root-relative asset paths (`/css/...`, `/js/...`) and ES modules need to be served over HTTP —
opening `index.html` directly (`file://`) will not work. From inside this folder, run:

```powershell
%LOCALAPPDATA%\Programs\Python\Python312\python.exe -m http.server 8000
```

Then open `http://localhost:8000/` in a browser. To preview on a phone on the same network, use
`--bind 0.0.0.0` and browse to your machine's LAN IP instead of `localhost`.

## What's real vs. mocked

- **Real**: all page navigation, responsive layout, client-side filtering/sorting (Directory,
  Auto catalog), multi-step form validation (Add a Car), the contest vote counter (persisted to
  `localStorage` in your browser only), phone number `(206) 331-8216`.
- **Mocked, not persisted anywhere**: all news articles, businesses, car listings and contest
  entries (`js/mock-data/`); every form submission (Share the News, Choose a Package, Contact
  Seller, Add a Car) — nothing is sent over the network or saved to a database; the email/social
  links in the footer are placeholder handles, not monitored inboxes/accounts yet.
- **allseattle.org is a purchased domain**, hosted via GitHub Pages custom domain (see `CNAME`).
  Live at https://allseattle.org/.

## Page map

| Page | File |
|---|---|
| Home | `index.html` |
| News | `news.html` |
| Contest ("Police in the Eyes of a Child") | `contest.html` |
| Business Directory | `directory.html` |
| Pricing | `pricing.html` |
| Auto catalog | `auto/index.html` |
| Auto listing detail | `auto/listing.html?id=c1` |
| Add a car | `auto/add-listing.html` |
| My Listings (static mockup) | `auto/my-listings.html` |

## Structure

- `css/tokens.css` — brand colors, fonts, spacing/shadow tokens
- `css/base.css`, `header.css`, `footer.css`, `components.css` — shared design system
- `css/pages/*.css` — page-specific layout
- `js/partials.js` — injects the shared two-tier header + footer into every page
- `js/mock-data/*.js` — all mock content (news, businesses, cars, contest, pricing)
- `js/pages/*.js` — per-page rendering logic
- `js/validation.js`, `js/modal.js`, `js/banner-ads.js` — shared helpers
- `img/` — real stock photography (Unsplash/Pexels, downloaded locally so the demo works fully
  offline), reused by category/body-type where the catalog needs more listings than unique photos
