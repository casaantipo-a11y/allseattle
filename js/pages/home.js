import { NEWS_ARTICLES } from "../mock-data/news.js";
import { BUSINESSES } from "../mock-data/businesses.js";
import { CAR_LISTINGS } from "../mock-data/cars.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";
import { relativeTime } from "../format-time.js";

// Same 5 placements the desktop sidebars show (home-left-1..4, home-right-1),
// just redistributed through the feed on mobile instead of stacked at the top.
const INLINE_AFTER_CARD = [
  { afterIndex: 4, seed: "home-left-1", size: "300x250" },
  { afterIndex: 8, seed: "home-left-2", size: "300x250" },
];
const FOOTER_AD_SEEDS = [
  { seed: "home-left-3", size: "300x600" },
  { seed: "home-left-4", size: "300x250" },
  { seed: "home-right-1", size: "300x250" },
];

function newsCardTemplate(article) {
  return `
  <article class="card news-card reveal-on-scroll">
    <a href="news.html" class="news-card-photo"><img src="${article.photo}" alt="${article.title}" loading="lazy"></a>
    <div class="news-card-body">
      <div class="news-card-meta">
        <span class="cat">${article.category}</span>
        <span>&middot;</span>
        <span>${relativeTime(article.publishedAt)}</span>
      </div>
      <h3><a href="news.html">${article.title}</a></h3>
      <p class="news-card-excerpt">${article.excerpt}</p>
      <div class="news-card-footer">
        <span class="news-card-author">By ${article.author}</span>
        <a href="news.html" class="news-card-more">Read more &rarr;</a>
      </div>
    </div>
  </article>`;
}

function renderNewsGrid() {
  const grid = document.getElementById("home-news-grid");
  if (!grid) return;
  const articles = NEWS_ARTICLES.slice(0, 8);
  let html = "";
  articles.forEach((article, i) => {
    html += newsCardTemplate(article);
    const adHere = INLINE_AFTER_CARD.find((a) => a.afterIndex === i + 1);
    if (adHere) html += inlineAdMarkup(adHere.seed, adHere.size);
  });
  grid.innerHTML = html;
}

function renderMobileFooterAds() {
  const el = document.getElementById("mobile-footer-ads");
  if (!el) return;
  el.innerHTML = FOOTER_AD_SEEDS.map((ad) => inlineAdMarkup(ad.seed, ad.size)).join("");
}

function renderStatsWidget() {
  const el = document.getElementById("widget-stats");
  if (!el) return;
  const stats = [
    ["Listed businesses", `${BUSINESSES.length * 41}+`],
    ["Active car listings", `${CAR_LISTINGS.length * 27}+`],
    ["Articles this month", `${NEWS_ARTICLES.length * 6}+`],
    ["Monthly visitors", "48.2k"],
  ];
  el.innerHTML = `
    <div class="widget-head">AllSeattle at a Glance</div>
    <div class="widget-body">
      <div class="stat-grid">
        ${stats.map(([label, value]) => `
          <div class="stat-tile">
            <span class="num">${value}</span>
            <span class="label">${label}</span>
          </div>`).join("")}
      </div>
    </div>
  `;
}

function renderCurrencyWidget() {
  const el = document.getElementById("widget-currency");
  if (!el) return;
  const rates = [
    ["EUR", "USD", "1.07", "up"],
    ["GBP", "USD", "1.26", "down"],
    ["CAD", "USD", "0.73", "up"],
    ["UAH", "USD", "0.024", "down"],
  ];
  el.innerHTML = `
    <div class="widget-head">Exchange Rates <span class="widget-head-tag">demo</span></div>
    <div class="widget-body ticker">
      ${rates.map(([a, b, val, dir]) => `
        <div class="ticker-row">
          <span class="ticker-pair">${a}<span class="muted">/${b}</span></span>
          <span class="ticker-value">${val}</span>
          <span class="ticker-change ${dir}">${dir === "up" ? "&#9650;" : "&#9660;"}</span>
        </div>`).join("")}
    </div>
  `;
}

function renderJobsWidget() {
  const el = document.getElementById("widget-jobs");
  if (!el) return;
  el.innerHTML = `
    <div class="widget-head">Job Board</div>
    <div class="widget-body job-teaser">
      <p>Local listings from AllSeattle businesses are being lined up now &mdash; the job board launches in a future update.</p>
      <span class="badge-soon">Coming Soon</span>
    </div>
  `;
}

function renderTransitWidget() {
  const el = document.getElementById("widget-transit");
  if (!el) return;
  const lines = [
    ["Link Light Rail", "On time", "good"],
    ["RapidRide lines", "On time", "good"],
    ["WA State Ferries", "Minor delays", "warn"],
  ];
  el.innerHTML = `
    <div class="widget-head">City Transit</div>
    <div class="widget-body">
      ${lines.map(([name, status, tone]) => `
        <div class="transit-row">
          <span>${name}</span>
          <span class="status-pill status-${tone}">${status}</span>
        </div>`).join("")}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderNewsGrid();
  renderMobileFooterAds();
  renderStatsWidget();
  renderCurrencyWidget();
  renderJobsWidget();
  renderTransitWidget();
  mountAdSlots(document);
  initScrollReveal();
});
