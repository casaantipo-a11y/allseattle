import { SOCIAL_ICONS, logoLockupMarkup } from "./logo.js";
import { markActiveNav } from "./nav-active.js";

// partials.js always lives at "<site root>/js/partials.js", so this resolves
// to the site root regardless of deployment subpath (localhost, GitHub
// Pages project subpath, custom domain, ...) or which page depth loaded it.
const SITE_ROOT = new URL("../", import.meta.url).href;

const HERO_ITEMS = [
  { key: "space-needle", label: "Space Needle", img: `${SITE_ROOT}img/hero/space-needle.jpg` },
  { key: "downtown", label: "Downtown Seattle", img: `${SITE_ROOT}img/hero/downtown.jpg` },
  { key: "mount-rainier", label: "Mount Rainier", img: `${SITE_ROOT}img/hero/mount-rainier.jpg` },
  { key: "waterfront", label: "Seattle Waterfront", img: `${SITE_ROOT}img/hero/waterfront.jpg` },
  { key: "pike-place", label: "Pike Place Market", img: `${SITE_ROOT}img/hero/pike-place.jpg` },
];

const NAV_LINKS = [
  { key: "home", label: "Home", href: `${SITE_ROOT}index.html` },
  { key: "news", label: "News", href: `${SITE_ROOT}news.html` },
  { key: "directory", label: "Directory", href: `${SITE_ROOT}directory.html` },
  { key: "pricing", label: "Pricing", href: `${SITE_ROOT}pricing.html` },
  { key: "auto", label: "Auto", href: `${SITE_ROOT}auto/index.html` },
];

const NAV_DISABLED = ["Jobs", "Events", "Shopping", "Entertainment", "Weather"];

function weatherNow() {
  const d = new Date();
  const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { city: "Seattle, WA", date: dateStr, temp: "61°F", note: "Cloudy, no precipitation" };
}

function heroMarkup() {
  return `
  <div class="hero-banner" id="hero-banner">
    <div class="hero-collage">
      <img src="${SITE_ROOT}img/hero/skyline-panorama.png" alt="Seattle skyline with the Space Needle, Mount Rainier and Pike Place Market" class="hero-photo">
      <div class="hero-collage-overlay"></div>
      <div class="hero-overlay-header">${headerTopMarkup("dark")}</div>
    </div>
    <div class="hero-icons">
      <div class="container hero-icons-row">
        ${HERO_ITEMS.map((h) => `
          <div class="hero-icon">
            <img src="${h.img}" alt="" class="hero-icon-img">
            <span>${h.label}</span>
          </div>`).join("")}
      </div>
    </div>
  </div>`;
}

function heroInnerMarkup() {
  return `
  <div class="hero-banner hero-banner--inner" id="hero-banner">
    <div class="container hero-inner-row">
      <div class="hero-inner-text">
        <span class="hero-script hero-script--sm">Seattle</span>
        <span class="hero-sub">THE EMERALD CITY</span>
      </div>
      <div class="hero-icons-row hero-icons-row--inner">
        ${HERO_ITEMS.map((h) => `<div class="hero-icon hero-icon--sm"><img src="${h.img}" alt="" class="hero-icon-img"><span>${h.label}</span></div>`).join("")}
      </div>
    </div>
  </div>`;
}

// `variant` is "dark" only where this bar is overlaid on the hero photo
// (home), so the wordmark flips to white; every other page renders it in a
// white bar and keeps the navy.
function headerTopMarkup(variant = "light") {
  const w = weatherNow();
  return `
    <div class="container header-top">
      <div class="weather-stub" aria-label="Weather (demo widget)">
        <span class="weather-icon" aria-hidden="true">&#9925;</span>
        <div class="weather-text">
          <strong>${w.city}</strong>
          <span>${w.date} &middot; ${w.temp}</span>
          <span class="weather-note">${w.note}</span>
        </div>
      </div>
      ${logoLockupMarkup({ href: `${SITE_ROOT}index.html`, variant })}
      <form class="search-stub" id="search-stub" role="search">
        <input type="search" placeholder="Search AllSeattle..." aria-label="Search">
        <button type="submit" aria-label="Search">&#128269;</button>
      </form>
    </div>`;
}

function functionalHeaderMarkup(pageType) {
  return `
  <header class="site-header" id="site-header-functional">
    ${pageType === "home" ? "" : headerTopMarkup()}
    <nav class="site-nav">
      <div class="container nav-inner">
        <ul class="nav-links">
          ${NAV_LINKS.map((n) => `<li><a href="${n.href}" data-page="${n.key}">${n.label}</a></li>`).join("")}
          ${NAV_DISABLED.map((label) => `<li class="nav-disabled"><a href="#" onclick="return false" title="Coming soon">${label}</a></li>`).join("")}
        </ul>
        <div class="nav-extra">
          <div class="social-links">
            <a href="#" title="Facebook (demo)" aria-label="Facebook">${SOCIAL_ICONS.facebook}</a>
            <a href="#" title="Twitter (demo)" aria-label="Twitter">${SOCIAL_ICONS.twitter}</a>
            <a href="#" title="Instagram (demo)" aria-label="Instagram">${SOCIAL_ICONS.instagram}</a>
          </div>
          <a href="#" class="nav-stub">Register Business</a>
          <a href="#" class="nav-stub nav-stub--accent">Log In</a>
        </div>
      </div>
    </nav>
  </header>`;
}

export function renderHeader(pageType) {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  // The nav bar is rendered as mount's own sibling (not nested inside it)
  // so its containing block for `position: sticky` is <body> — tall enough
  // to give it room to stay pinned for the whole page, not just the ~50px
  // of space left over inside the hero-photo mount once the nav sits
  // flush against that mount's bottom edge.
  mount.innerHTML = pageType === "home" ? heroMarkup() : heroInnerMarkup();
  mount.insertAdjacentHTML("afterend", functionalHeaderMarkup(pageType));
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
          <li>Twitter: <a href="#">@AllSeattleWA</a></li>
          <li>Instagram: <a href="#">@allseattle</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <ul>
          <li><a href="${SITE_ROOT}news.html">News</a></li>
          <li><a href="${SITE_ROOT}directory.html">Business Directory</a></li>
          <li><a href="${SITE_ROOT}auto/index.html">Auto</a></li>
          <li><a href="${SITE_ROOT}pricing.html">Advertise with us</a></li>
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
