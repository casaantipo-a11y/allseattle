import { PROPERTIES, PROPERTY_DEALS, PROPERTY_NEIGHBORHOODS } from "../mock-data/real-estate.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

// Цена продажи и месячная аренда живут в одном поле, поэтому набор порогов
// в фильтре пересобирается под выбранный тип сделки — иначе «до $900 000»
// в аренде и «до $3 000» в продаже стояли бы в одном списке.
const PRICE_STEPS = {
  "For Sale": [700000, 900000, 1100000, 1300000, 1500000],
  "For Rent": [1800, 2200, 2600, 3000, 3500],
};

const SORTS = [
  ["newest", "Newest first"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["sqft-desc", "Largest first"],
];

function money(n) {
  return n >= 10000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString("en-US")}`;
}

function cardTemplate(p) {
  const beds = p.beds === 0 ? "Studio" : `<b>${p.beds}</b> bed`;
  return `
  <article class="card realty-card reveal-on-scroll">
    <div class="realty-photo">
      <img src="${p.photo}" alt="${p.title}" loading="lazy">
      <span class="realty-deal">${p.deal}</span>
    </div>
    <div class="realty-body">
      <span class="realty-hood">${p.neighborhood}</span>
      <div class="realty-price">${p.priceLabel}</div>
      <h3 class="realty-title">${p.title}</h3>
      <div class="realty-specs">
        <span>${beds}</span>
        <span><b>${p.baths}</b> bath</span>
        <span><b>${p.sqft.toLocaleString("en-US")}</b> sq ft</span>
      </div>
      <p class="realty-desc">${p.description}</p>
    </div>
  </article>`;
}

function option(value, label, selected) {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`;
}

const state = { deal: "For Sale", maxPrice: "", beds: "", hood: "", sort: "newest" };

function fillSelects() {
  const deal = document.getElementById("f-deal");
  const price = document.getElementById("f-price");
  const beds = document.getElementById("f-beds");
  const hood = document.getElementById("f-hood");
  const sort = document.getElementById("f-sort");
  if (!deal) return;

  deal.innerHTML = PROPERTY_DEALS.map((d) => option(d, d, state.deal)).join("");
  price.innerHTML = option("", "Any price", state.maxPrice) +
    (PRICE_STEPS[state.deal] || []).map((v) => option(String(v), `Up to ${money(v)}`, state.maxPrice)).join("");
  beds.innerHTML = option("", "Any", state.beds) +
    [1, 2, 3, 4].map((n) => option(String(n), `${n}+`, state.beds)).join("");
  hood.innerHTML = option("", "All neighborhoods", state.hood) +
    PROPERTY_NEIGHBORHOODS.map((n) => option(n, n, state.hood)).join("");
  sort.innerHTML = SORTS.map(([v, l]) => option(v, l, state.sort)).join("");
}

function currentList() {
  let list = PROPERTIES.filter((p) => p.deal === state.deal);
  if (state.maxPrice) list = list.filter((p) => p.price <= Number(state.maxPrice));
  if (state.beds) list = list.filter((p) => p.beds >= Number(state.beds));
  if (state.hood) list = list.filter((p) => p.neighborhood === state.hood);

  const by = {
    "newest": (a, b) => new Date(b.listedAt) - new Date(a.listedAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "sqft-desc": (a, b) => b.sqft - a.sqft,
  };
  return [...list].sort(by[state.sort] || by.newest);
}

function render() {
  const grid = document.getElementById("realty-grid");
  const count = document.getElementById("realty-count");
  if (!grid) return;
  const list = currentList();
  if (count) count.textContent = `${list.length} ${list.length === 1 ? "property" : "properties"}`;
  if (!list.length) {
    grid.innerHTML = `<p class="muted">Nothing matches those filters. Try widening the price or the area.</p>`;
    return;
  }
  let html = "";
  list.forEach((p, i) => {
    html += cardTemplate(p);
    if (i + 1 === 4) html += inlineAdMarkup("real-estate-side-1", "300x250");
  });
  grid.innerHTML = html;
  // Без обоих вызовов новые карточки останутся невидимыми, а рекламные
  // коробки пустыми.
  mountAdSlots(grid);
  initScrollReveal(".reveal-on-scroll", grid);
}

function wire() {
  const body = document.getElementById("realty-filters-body");
  if (body) {
    body.addEventListener("change", (e) => {
      const id = e.target.id;
      if (id === "f-deal") {
        state.deal = e.target.value;
        state.maxPrice = "";          // пороги у продажи и аренды разные
        fillSelects();
      } else if (id === "f-price") state.maxPrice = e.target.value;
      else if (id === "f-beds") state.beds = e.target.value;
      else if (id === "f-hood") state.hood = e.target.value;
      else if (id === "f-sort") state.sort = e.target.value;
      render();
    });
  }

  const reset = document.getElementById("f-reset");
  if (reset) {
    reset.addEventListener("click", () => {
      Object.assign(state, { deal: "For Sale", maxPrice: "", beds: "", hood: "", sort: "newest" });
      fillSelects();
      render();
    });
  }

  const toggle = document.getElementById("realty-filters-toggle");
  if (toggle && body) {
    toggle.addEventListener("click", () => {
      const open = body.classList.toggle("open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fillSelects();
  render();
  wire();
  const footer = document.getElementById("mobile-footer-ads");
  if (footer) footer.innerHTML = inlineAdMarkup("real-estate-side-2", "300x600");
  mountAdSlots(document);
  initScrollReveal();
});
