import { SOCIAL_ICONS, NAV_ICONS, UI_ICONS, logoLockupMarkup } from "./logo.js";
import { markActiveNav } from "./nav-active.js";
import { weatherHeaderLine } from "./mock-data/weather.js";

// partials.js always lives at "<site root>/js/partials.js", so this resolves
// to the site root regardless of deployment subpath (localhost, GitHub
// Pages project subpath, custom domain, ...) or which page depth loaded it.
const SITE_ROOT = new URL("../", import.meta.url).href;

const NAV_LINKS = [
  { key: "home", label: "Home", href: `${SITE_ROOT}index.html`, icon: NAV_ICONS.home },
  { key: "news", label: "News", href: `${SITE_ROOT}news.html`, icon: NAV_ICONS.news },
  { key: "directory", label: "Directory", href: `${SITE_ROOT}directory.html`, icon: NAV_ICONS.directory },
  { key: "pricing", label: "Advertising", href: `${SITE_ROOT}pricing.html`, icon: NAV_ICONS.pricing },
  { key: "auto", label: "Auto", href: `${SITE_ROOT}auto/index.html`, icon: NAV_ICONS.auto },
];

// The eight smaller sections. They sit in their own second row under the
// primary links rather than sharing a row with them, which is what buys the
// first row enough space to keep full-size touch targets at desktop widths.
// Below 1024px CSS merges both rows into one horizontal scroller.
const NAV_SECONDARY = [
  { key: "jobs", label: "Jobs", href: `${SITE_ROOT}jobs.html` },
  { key: "events", label: "Events", href: `${SITE_ROOT}events.html` },
  { key: "shopping", label: "Shopping", href: `${SITE_ROOT}shopping.html` },
  { key: "entertainment", label: "Entertainment", href: `${SITE_ROOT}entertainment.html` },
  { key: "weather", label: "Weather", href: `${SITE_ROOT}weather.html` },
  { key: "real-estate", label: "Real Estate", href: `${SITE_ROOT}real-estate.html` },
  { key: "city-map", label: "City Map", href: `${SITE_ROOT}city-map.html` },
  { key: "qa", label: "Q&A", href: `${SITE_ROOT}qa.html` },
];

// The photo is page content, not chrome: it sits inside .container so its
// edges line up with every other block on the page, and the only thing laid
// over it is the search box. Home gets the tall frame; every other page gets
// the same component at a fraction of the height, with the script wordmark.
function heroMarkup(pageType) {
  const inner = pageType !== "home";
  const w = weatherHeaderLine();
  return `
  <div class="hero-banner${inner ? " hero-banner--inner" : ""}" id="hero-banner">
    <div class="container">
      <div class="hero-frame">
        <img src="${SITE_ROOT}img/hero/skyline-panorama.png" alt="Seattle skyline with the Space Needle, Mount Rainier and Pike Place Market" class="hero-photo">
        <div class="hero-shade"></div>
        <a class="hero-weather" href="${SITE_ROOT}weather.html" aria-label="Seattle weather">
          <span class="weather-icon" aria-hidden="true">${UI_ICONS.weather}</span>
          <span class="weather-text">
            <strong>${w.city}</strong>
            <span>${w.date} &middot; ${w.temp}</span>
            <span class="weather-note">${w.note}</span>
          </span>
        </a>
        ${inner ? `
        <div class="hero-caption">
          <span class="hero-script">Seattle</span>
          <span class="hero-sub">THE EMERALD CITY</span>
        </div>` : ""}
        <form class="search-stub" id="search-stub" role="search">
          <input type="search" placeholder="Search AllSeattle..." aria-label="Search">
          <button type="submit" aria-label="Search">${UI_ICONS.search}</button>
        </form>
      </div>
    </div>
  </div>`;
}

// One header for all pages. Two rows of links sit in the middle column and
// are centred in the header: the real sections on top with their icons, the
// smaller sections underneath in a quieter style. The weather moved onto the
// banner and the social icons into the footer, which is what frees enough
// width to centre the block without shrinking it.
function siteHeaderMarkup() {
  return `
  <header class="site-header" id="site-header-functional">
    <div class="container header-top">
      ${logoLockupMarkup({ href: `${SITE_ROOT}index.html` })}

      <div class="nav-stack">
        <ul class="nav-links">
          ${NAV_LINKS.map((n) => `
            <li><a href="${n.href}" data-page="${n.key}">
              <span class="nav-icon">${n.icon}</span>${n.label}
            </a></li>`).join("")}
        </ul>
        <ul class="nav-secondary">
          ${NAV_SECONDARY.map((n) => `
            <li><a href="${n.href}" data-page="${n.key}">${n.label}</a></li>`).join("")}
        </ul>
      </div>

      <div class="header-utils">
        <button type="button" class="lang-switch" title="Coming soon" aria-label="Language: English">ENG</button>
        <a href="#" class="nav-stub nav-stub--accent">Register Business</a>
        <a href="#" class="account-btn" title="Log In (demo)" aria-label="Log In">${UI_ICONS.account}</a>
      </div>
    </div>
  </header>`;
}

export function renderHeader(pageType) {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  // The header goes in as mount's own sibling (not nested inside it) so its
  // containing block for `position: sticky` is <body> — tall enough to give
  // it room to stay pinned for the whole page. Nested inside the mount div,
  // that parent's box would end at the header's own bottom edge, leaving
  // zero room to stick, and it would silently behave like `position: static`
  // despite the CSS being correct. Body order ends up:
  // header -> mount (hero banner) -> main -> footer.
  mount.innerHTML = heroMarkup(pageType);
  mount.insertAdjacentHTML("beforebegin", siteHeaderMarkup());
  markActiveNav();
  wireSearchStub();
}

function wireSearchStub() {
  const form = document.getElementById("search-stub");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (input) {
      const original = input.placeholder;
      input.value = "";
      input.placeholder = "Search is a demo placeholder";
      setTimeout(() => { input.placeholder = original; }, 2200);
    }
  });
}

export function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const year = new Date().getFullYear();
  mount.innerHTML = `
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-col footer-brand">
        ${logoLockupMarkup({ href: `${SITE_ROOT}index.html`, variant: "dark" })}
        <div class="social-links">
          <a href="#" title="Facebook (demo)" aria-label="Facebook">${SOCIAL_ICONS.facebook}</a>
          <a href="#" title="Instagram (demo)" aria-label="Instagram">${SOCIAL_ICONS.instagram}</a>
          <a href="#" title="Telegram (demo)" aria-label="Telegram">${SOCIAL_ICONS.telegram}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <ul>
          <li>Phone: <a href="tel:+12063318216">(206) 331-8216</a></li>
          <li>Email: <a href="mailto:info@allseattle.org">info@allseattle.org</a></li>
          <li>Seattle, WA</li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Follow us</h4>
        <ul>
          <li>Facebook: <a href="#">/AllSeattle</a></li>
          <li>Instagram: <a href="#">@allseattle</a></li>
          <li>Telegram: <a href="#">@allseattle</a></li>
        </ul>
      </div>
      <div class="footer-col footer-col--wide">
        <h4>Explore</h4>
        <ul>
          ${[...NAV_LINKS.slice(1), ...NAV_SECONDARY]
            .map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}
          <li><a href="${SITE_ROOT}contest.html">Contest</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; ${year} AllSeattle. All rights reserved.</p>
    </div>
  </footer>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const pageType = document.body.dataset.pageType || "inner";
  renderHeader(pageType);
  renderFooter();
});
