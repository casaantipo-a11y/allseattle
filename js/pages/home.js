import { NEWS_ARTICLES } from "../mock-data/news.js";
import { BUSINESSES } from "../mock-data/businesses.js";
import { CAR_LISTINGS } from "../mock-data/cars.js";
import { CONTEST_TITLE, CONTEST_ENTRIES } from "../mock-data/contest.js";
import { JOB_LISTINGS } from "../mock-data/jobs.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";
import { relativeTime } from "../format-time.js";

// The 12 articles are split, not repeated: the first 6 run as photo cards in
// the middle column, the rest as the compact newsfeed at the bottom of the
// page. Nothing appears twice.
const CARD_COUNT = 6;

// Same 5 placements the desktop sidebars show (home-left-1..4, home-right-1),
// just redistributed through the feed on mobile instead of stacked at the top.
const INLINE_AFTER_CARD = [
  { afterIndex: 3, seed: "home-left-1", size: "300x250" },
  { afterIndex: 6, seed: "home-left-2", size: "300x250" },
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

function newsListRowTemplate(article) {
  return `
  <a class="news-list-row" href="news.html">
    <img class="news-list-thumb" src="${article.photo}" alt="" loading="lazy">
    <span class="news-list-body">
      <span class="news-list-meta">
        <span class="cat">${article.category}</span>
        <span>&middot;</span>
        <span>${relativeTime(article.publishedAt)}</span>
      </span>
      <span class="news-list-title">${article.title}</span>
      <span class="news-list-excerpt">${article.excerpt}</span>
    </span>
  </a>`;
}

function renderNewsGrid() {
  const grid = document.getElementById("home-news-grid");
  if (!grid) return;
  const articles = NEWS_ARTICLES.slice(0, CARD_COUNT);
  let html = "";
  articles.forEach((article, i) => {
    html += newsCardTemplate(article);
    const adHere = INLINE_AFTER_CARD.find((a) => a.afterIndex === i + 1);
    if (adHere) html += inlineAdMarkup(adHere.seed, adHere.size);
  });
  grid.innerHTML = html;
}

// The tail of the feed, as headlines rather than cards — this is where the
// page gets its density, since the middle column is too narrow to carry more
// than two readable photo cards across.
function renderNewsList() {
  const el = document.getElementById("home-news-list");
  if (!el) return;
  el.innerHTML = NEWS_ARTICLES.slice(CARD_COUNT).map(newsListRowTemplate).join("");
}

// Sits between the photo banner and <main>, in the slot the landmark icon
// strip used to occupy — same position, but it now leads somewhere.
function renderContestStrip() {
  const el = document.getElementById("contest-strip");
  if (!el) return;
  const entry = CONTEST_ENTRIES[0];
  el.innerHTML = `
  <div class="container">
    <a class="contest-strip" href="contest.html">
      <img class="contest-strip-thumb" src="${entry.photo}" alt="" loading="lazy">
      <span class="contest-strip-text">
        <span class="contest-strip-label">Contests &amp; voting</span>
        <span class="contest-strip-title">${CONTEST_TITLE}</span>
      </span>
      <span class="contest-strip-more">Vote now &rarr;</span>
    </a>
  </div>`;
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

// Виджет вёл в никуда и носил бейдж Coming Soon, пока раздела не было.
// Теперь показывает три свежие вакансии и ведёт на jobs.html.
function renderJobsWidget() {
  const el = document.getElementById("widget-jobs");
  if (!el) return;
  const latest = [...JOB_LISTINGS]
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, 3);
  el.innerHTML = `
    <div class="widget-head">Job Board</div>
    <div class="widget-body">
      ${latest.map((job) => `
        <a class="mini-row" href="jobs.html">
          <span class="mini-row-title">${job.title}</span>
          <span class="mini-row-note">${job.type}</span>
        </a>`).join("")}
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
  renderContestStrip();
  renderNewsGrid();
  renderNewsList();
  renderMobileFooterAds();
  renderStatsWidget();
  renderCurrencyWidget();
  renderJobsWidget();
  renderTransitWidget();
  mountAdSlots(document);
  initScrollReveal();
});
