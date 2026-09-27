import { allDealsWithBusiness, DEAL_CATEGORIES } from "../mock-data/shopping.js";
import { mountAdSlots } from "../banner-ads.js";

const DEALS = allDealsWithBusiness();

function dealCardTemplate(deal) {
  return `
  <article class="card deal-card">
    <div class="deal-photo">
      <img src="${deal.business.photo}" alt="${deal.business.name}" loading="lazy">
      <span class="deal-badge">${deal.discount}</span>
    </div>
    <div class="deal-body">
      <span class="deal-cat">${deal.category}</span>
      <h3 class="deal-title">${deal.title}</h3>
      <div class="deal-biz">${deal.business.name}</div>
      <p class="deal-terms">${deal.terms}</p>
      <div class="deal-foot">
        <span>Until <span class="deal-until">${deal.validUntil}</span></span>
        <span>${deal.business.phone}</span>
      </div>
    </div>
  </article>`;
}

function renderFilters(active) {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.innerHTML = ["All", ...DEAL_CATEGORIES]
    .map((c) => `<button data-cat="${c}" class="${c === active ? "active" : ""}">${c}</button>`)
    .join("");
}

function renderGrid(active) {
  const grid = document.getElementById("deal-grid");
  if (!grid) return;
  const list = active === "All" ? DEALS : DEALS.filter((d) => d.category === active);
  if (!list.length) {
    grid.innerHTML = `<p class="muted">No offers in this category right now.</p>`;
    return;
  }
  let html = "";
  list.forEach((deal) => {
    html += dealCardTemplate(deal);
  });
  grid.innerHTML = html;
}

function wireFilters() {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    renderFilters(btn.dataset.cat);
    renderGrid(btn.dataset.cat);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFilters("All");
  renderGrid("All");
  wireFilters();
  mountAdSlots(document);
});
