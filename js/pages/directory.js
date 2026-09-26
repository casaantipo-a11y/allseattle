import { BUSINESSES, BUSINESS_CATEGORIES } from "../mock-data/businesses.js";
import { siteStats } from "../mock-data/stats.js";
import { mountAdSlots } from "../banner-ads.js";
import { formatViews } from "../format-time.js";
import { UI_ICONS } from "../logo.js";

const PACKAGE_CLASS = {
  Standard: "badge-standard",
  Lux: "badge-lux",
  Premium: "badge-premium",
};

// Платные размещения стоят выше бесплатных — на показе это и объясняет,
// за что клиент платит. Внутри тарифа порядок как в данных.
const PACKAGE_ORDER = { Premium: 0, Lux: 1, Standard: 2 };

// Строка справочника: миниатюра слева, всё остальное текстом — по макету
// клиента. Название никуда не ведёт: отдельных страниц компаний на сайте нет.
function bizRowTemplate(biz) {
  const upsell = biz.package === "Standard"
    ? `<a class="biz-row-upsell" href="pricing.html">Upgrade to Lux &rarr;</a>`
    : "";
  return `
  <article class="biz-row biz-row--${biz.package.toLowerCase()}">
    <img class="biz-row-thumb" src="${biz.photo}" alt="" loading="lazy">
    <div class="biz-row-body">
      <div class="biz-row-meta">
        <span class="badge ${PACKAGE_CLASS[biz.package]}">${biz.package}</span>
        <span class="biz-row-views">${formatViews(biz.views)} views this month</span>
        ${upsell}
      </div>
      <h3 class="biz-row-name">${biz.name}</h3>
      <div class="biz-row-cat">${biz.category}</div>
      <p class="biz-row-desc">${biz.description}</p>
      <div class="biz-row-contact">
        <span>${biz.address}</span>
        <a href="tel:${biz.phone.replace(/[^\d+]/g, "")}">${biz.phone}</a>
      </div>
    </div>
  </article>`;
}

function countIn(category) {
  return BUSINESSES.filter((b) => b.category === category).length;
}

// Рубрики слева — список, а не чипы: их десять, и в узкой колонке они
// читаются столбиком. Числа считаются из данных, как счётчики районов
// на карте города, и не разъезжаются при добавлении компании.
function renderCategories(active) {
  const el = document.getElementById("widget-categories");
  if (!el) return;
  const rows = [["All", BUSINESSES.length], ...BUSINESS_CATEGORIES.map((c) => [c, countIn(c)])];
  el.innerHTML = `
    <div class="widget-head">Headings</div>
    <div class="widget-body">
      <ul class="dir-cats">
        ${rows.map(([cat, n]) => `
          <li>
            <button type="button" data-cat="${cat}" class="${cat === active ? "active" : ""}">
              <span>${cat}</span><span class="dir-cats-num">${n}</span>
            </button>
          </li>`).join("")}
      </ul>
    </div>`;
}

function matches(biz, state) {
  if (state.category !== "All" && biz.category !== state.category) return false;
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return [biz.name, biz.description, biz.category, biz.address]
    .some((field) => field.toLowerCase().includes(q));
}

function renderList(state) {
  const list = document.getElementById("biz-list");
  const count = document.getElementById("dir-count");
  if (!list) return;

  const found = BUSINESSES
    .filter((biz) => matches(biz, state))
    .sort((a, b) => PACKAGE_ORDER[a.package] - PACKAGE_ORDER[b.package]);

  if (count) {
    count.textContent = found.length === BUSINESSES.length
      ? `${BUSINESSES.length} businesses listed`
      : `Showing ${found.length} of ${BUSINESSES.length} businesses`;
  }

  if (!found.length) {
    list.innerHTML = `<p class="muted">No businesses match that search yet.</p>`;
    return;
  }
  list.innerHTML = found.map(bizRowTemplate).join("");
}

// Те же четыре числа, что в виджете главной, — общий источник в
// mock-data/stats.js, чтобы на показе страницы не спорили друг с другом.
function renderStats() {
  const el = document.getElementById("widget-stats");
  if (!el) return;
  el.innerHTML = `
    <div class="widget-head">Statistics</div>
    <div class="widget-body">
      <div class="stat-grid">
        ${siteStats().map(([label, value]) => `
          <div class="stat-tile">
            <span class="num">${value}</span>
            <span class="label">${label}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function wire(state) {
  const cats = document.getElementById("widget-categories");
  if (cats) {
    cats.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      state.category = btn.dataset.cat;
      renderCategories(state.category);
      renderList(state);
    });
  }

  const form = document.getElementById("dir-search");
  const input = document.getElementById("dir-q");
  if (form && input) {
    // Поиск фильтрует по мере ввода; submit гасим, чтобы страница не
    // перезагружалась и демо не теряло выбранную рубрику.
    form.addEventListener("submit", (e) => e.preventDefault());
    input.addEventListener("input", () => {
      state.query = input.value.trim();
      renderList(state);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const state = { category: "All", query: "" };
  const form = document.getElementById("dir-search");
  if (form) form.insertAdjacentHTML("afterbegin", `<span class="dir-search-icon">${UI_ICONS.search}</span>`);
  renderCategories(state.category);
  renderList(state);
  renderStats();
  wire(state);
  mountAdSlots(document);
});
