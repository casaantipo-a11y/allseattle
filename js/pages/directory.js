import { BUSINESSES, BUSINESS_CATEGORIES } from "../mock-data/businesses.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

const PACKAGE_CLASS = {
  Standard: "badge-standard",
  Lux: "badge-lux",
  Premium: "badge-premium",
};

function bizCardTemplate(biz) {
  return `
  <article class="card biz-card reveal-on-scroll">
    <div class="biz-card-photo">
      <img src="${biz.photo}" alt="${biz.name}" loading="lazy">
      <span class="badge ${PACKAGE_CLASS[biz.package]}">${biz.package}</span>
    </div>
    <div class="biz-card-body">
      <div class="biz-card-cat">${biz.category}</div>
      <h3 style="margin-bottom:6px;">${biz.name}</h3>
      <p class="biz-card-desc">${biz.description}</p>
      <div class="biz-card-phone">${biz.phone}</div>
    </div>
  </article>`;
}

function renderFilters(activeCategory) {
  const el = document.getElementById("category-filter");
  if (!el) return;
  const categories = ["All", ...BUSINESS_CATEGORIES];
  el.innerHTML = categories
    .map((cat) => `<button data-cat="${cat}" class="${cat === activeCategory ? "active" : ""}">${cat}</button>`)
    .join("");
}

function renderGrid(activeCategory) {
  const grid = document.getElementById("biz-grid");
  if (!grid) return;
  const list = activeCategory === "All" ? BUSINESSES : BUSINESSES.filter((b) => b.category === activeCategory);
  if (!list.length) {
    grid.innerHTML = `<p class="muted">No businesses found in this category yet.</p>`;
    return;
  }
  let html = "";
  list.forEach((biz, i) => {
    html += bizCardTemplate(biz);
    if (i + 1 === 4) html += inlineAdMarkup("directory-side-1", "300x250");
  });
  grid.innerHTML = html;
  mountAdSlots(grid);
  initScrollReveal(".reveal-on-scroll", grid);
}

function wireFilters() {
  const el = document.getElementById("category-filter");
  if (!el) return;
  let active = "All";
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    active = btn.dataset.cat;
    renderFilters(active);
    renderGrid(active);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFilters("All");
  renderGrid("All");
  wireFilters();
  const footerAds = document.getElementById("mobile-footer-ads");
  if (footerAds) footerAds.innerHTML = inlineAdMarkup("directory-side-2", "300x600");
  mountAdSlots(document);
});
