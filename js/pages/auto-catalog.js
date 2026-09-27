import { CAR_LISTINGS } from "../mock-data/cars.js";
import { BUSINESSES } from "../mock-data/businesses.js";
import { mountAdSlots } from "../banner-ads.js";
import { relativeTime, formatViews } from "../format-time.js";

const fmtPrice = (n) => `$${n.toLocaleString("en-US")}`;
const fmtMileage = (n) => `${n.toLocaleString("en-US")} mi`;

/* Карточка с фото осталась ради «Similar Cars» на странице машины — её
   импортирует auto-listing.js. Сам каталог с неё ушёл на строки: клиент
   прислал макет плотного авто-портала. Не удалять вместе с гридом. */
export function carCardTemplate(car) {
  return `
  <a href="listing.html?id=${car.id}" class="card car-card">
    <div class="car-card-photo"><img src="${car.photos[0]}" alt="${car.year} ${car.make} ${car.model}" loading="lazy"></div>
    <div class="car-card-body">
      <div class="car-card-price">${fmtPrice(car.price)}</div>
      <div class="car-card-title">${car.year} ${car.make} ${car.model}</div>
      <div class="car-card-specs">
        <span>${fmtMileage(car.mileage)}</span>
        <span>&middot;</span>
        <span>${car.transmission}</span>
        <span>&middot;</span>
        <span>${car.engine}</span>
      </div>
    </div>
  </a>`;
}

/* Строка объявления по макету: фото слева, характеристики в середине, цена и
   мета справа. Название — ссылка, в отличие от справочника: у машины есть
   своя страница. «В блокнот» и «печать» из макета не переносим — это были бы
   кнопки, которые ничего не делают. */
function carRowTemplate(car) {
  const title = `${car.year} ${car.make} ${car.model}`;
  return `
  <article class="car-row">
    <a class="car-row-photo" href="listing.html?id=${car.id}" tabindex="-1" aria-hidden="true">
      <img src="${car.photos[0]}" alt="" loading="lazy">
    </a>
    <div class="car-row-body">
      <a class="car-row-title" href="listing.html?id=${car.id}">${title}</a>
      <div class="car-row-specs">
        ${[car.engine, fmtMileage(car.mileage), car.transmission, car.color, car.fuel]
          .map((s) => `<span>${s}</span>`).join("")}
      </div>
      <p class="car-row-desc">${car.description}</p>
    </div>
    <div class="car-row-meta">
      <div class="car-row-price">${fmtPrice(car.price)}</div>
      <div class="car-row-posted">${relativeTime(car.postedAt)}</div>
      <div class="car-row-ref">${car.ref}</div>
    </div>
  </article>`;
}

/* Скопировано из js/pages/directory.js, а не импортировано: импорт чужого
   модуля страницы запускает и его DOMContentLoaded — ровно та ошибка, из-за
   которой auto/listing.html пишет в консоль. Стили общие, в components.css. */
const PACKAGE_CLASS = { Standard: "badge-standard", Lux: "badge-lux", Premium: "badge-premium" };

/* Порядок пакетов здесь свой: сверху Lux, дальше Premium, дальше Standard —
   просьба клиента по этому блоку. В справочнике (js/pages/directory.js)
   порядок остался Premium -> Lux -> Standard: правка была на #auto-firms, и
   клиент решил её туда и оставить. Без сортировки компании шли в порядке
   файла данных, то есть вперемешку. */
const FIRMS_ORDER = { Lux: 0, Premium: 1, Standard: 2 };

function bizRowTemplate(biz) {
  const upsell = biz.package === "Standard"
    ? `<a class="biz-row-upsell" href="../pricing.html">Upgrade to Lux &rarr;</a>`
    : "";
  return `
  <article class="biz-row biz-row--${biz.package.toLowerCase()}">
    <img class="biz-row-thumb" src="../${biz.photo}" alt="" loading="lazy">
    <div class="biz-row-body">
      <div class="biz-row-meta">
        <span class="badge ${PACKAGE_CLASS[biz.package]}">${biz.package}</span>
        <span class="biz-row-views">${formatViews(biz.views)} views this month</span>
        ${upsell}
      </div>
      <span class="biz-row-name">${biz.name}</span>
      <div class="biz-row-cat">${biz.category}</div>
      <p class="biz-row-desc">${biz.description}</p>
      <div class="biz-row-contact">
        <span>${biz.address}</span>
        <a href="tel:${biz.phone.replace(/[^\d+]/g, "")}">${biz.phone}</a>
      </div>
    </div>
  </article>`;
}

/* Темы нижнего блока. У каждой — слово, по которому ищет поиск справочника:
   он сверяет название, описание, рубрику и адрес. Темы без единой компании
   в список не попадают — ссылка, ведущая в пустой результат, хуже короткого
   списка. Добавится компания — появится и тема. */
const AUTO_TOPICS = [
  ["Car repair", "repair"],
  ["Car washes", "wash"],
  ["Auto parts", "parts"],
  ["Tires & wheels", "tire"],
  ["Driving schools", "driving school"],
  ["Car rental", "rental"],
  ["Service station & tuning", "tuning"],
  ["Car dealerships", "dealership"],
  ["Towing & roadside", "towing"],
];

const AUTO_BUSINESSES = BUSINESSES.filter((b) => b.category === "Auto Services");

function topicMatches(query) {
  const q = query.toLowerCase();
  return AUTO_BUSINESSES.filter((b) =>
    [b.name, b.description, b.category].some((f) => f.toLowerCase().includes(q)));
}

// ---------- Состояние и фильтр ----------

const state = {
  make: "", model: "", priceMin: null, priceMax: null, yearMin: null, yearMax: null,
  body: "", transmission: "", fuel: "", maxMileage: null, sort: "default",
};

function matches(car) {
  if (state.make && car.make !== state.make) return false;
  if (state.model && car.model !== state.model) return false;
  if (state.priceMin && car.price < state.priceMin) return false;
  if (state.priceMax && car.price > state.priceMax) return false;
  if (state.yearMin && car.year < state.yearMin) return false;
  if (state.yearMax && car.year > state.yearMax) return false;
  if (state.body && car.bodyType !== state.body) return false;
  if (state.transmission && car.transmission !== state.transmission) return false;
  if (state.fuel && car.fuel !== state.fuel) return false;
  if (state.maxMileage && car.mileage > state.maxMileage) return false;
  return true;
}

function sorted(list) {
  switch (state.sort) {
    case "price-asc": return [...list].sort((a, b) => a.price - b.price);
    case "price-desc": return [...list].sort((a, b) => b.price - a.price);
    case "year-desc": return [...list].sort((a, b) => b.year - a.year);
    case "mileage-asc": return [...list].sort((a, b) => a.mileage - b.mileage);
    // По умолчанию — свежие объявления сверху, как на любой доске.
    default: return [...list].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }
}

// ---------- Отрисовка ----------

/* Каталог слева перечисляет модели, а не марки: моделей тринадцать, и в две
   колонки они читаются как в макете, а марок всего восемь. Числа считаются из
   данных, как рубрики в справочнике, и не разъезжаются при добавлении машины. */
function renderCatalog() {
  const el = document.getElementById("widget-car-catalog");
  if (!el) return;
  const rows = [];
  CAR_LISTINGS.forEach((car) => {
    const found = rows.find((r) => r.model === car.model && r.make === car.make);
    if (found) found.n += 1;
    else rows.push({ make: car.make, model: car.model, n: 1 });
  });
  rows.sort((a, b) => a.model.localeCompare(b.model));

  el.innerHTML = `
    <div class="widget-head">Car catalog</div>
    <div class="widget-body">
      <ul class="auto-cats">
        ${rows.map((r) => `
          <li>
            <button type="button" data-make="${r.make}" data-model="${r.model}"
                    class="${state.model === r.model ? "active" : ""}">
              <span>${r.model}</span><span class="auto-cats-num">${r.n}</span>
            </button>
          </li>`).join("")}
      </ul>
      <button type="button" class="auto-cats-all" data-make="" data-model="">All models &rarr;</button>
    </div>`;
}

function renderList() {
  const list = document.getElementById("car-list");
  const count = document.getElementById("auto-results-count");
  if (!list) return;

  const found = sorted(CAR_LISTINGS.filter(matches));
  if (count) {
    count.textContent = found.length === CAR_LISTINGS.length
      ? `${CAR_LISTINGS.length} cars listed`
      : `Showing ${found.length} of ${CAR_LISTINGS.length} cars`;
  }
  if (!found.length) {
    list.innerHTML = `<p class="muted">No cars match those filters. Try widening your search.</p>`;
    return;
  }
  list.innerHTML = found.map(carRowTemplate).join("");
}

function renderTopics() {
  const el = document.getElementById("widget-auto-topics");
  if (!el) return;
  const rows = AUTO_TOPICS
    .map(([label, query]) => ({ label, query, n: topicMatches(query).length }))
    .filter((r) => r.n > 0);

  el.innerHTML = `
    <div class="widget-head">Headings</div>
    <div class="widget-body">
      <ul class="auto-cats auto-cats--one">
        ${rows.map((r) => `
          <li>
            <a href="../directory.html?q=${encodeURIComponent(r.query)}">
              <span>${r.label}</span><span class="auto-cats-num">${r.n}</span>
            </a>
          </li>`).join("")}
      </ul>
    </div>`;
}

function renderFirms() {
  const el = document.getElementById("auto-firms");
  if (!el) return;
  const rows = [...AUTO_BUSINESSES]
    .sort((a, b) => FIRMS_ORDER[a.package] - FIRMS_ORDER[b.package]);
  el.innerHTML = rows.map(bizRowTemplate).join("");
}

// ---------- Селекты ----------

function fill(id, values, label) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = `<option value="">${label}</option>`
    + values.map((v) => `<option value="${v}">${v}</option>`).join("");
}

function uniq(key) {
  return [...new Set(CAR_LISTINGS.map((c) => c[key]))].sort();
}

function fillModels() {
  const pool = state.make ? CAR_LISTINGS.filter((c) => c.make === state.make) : CAR_LISTINGS;
  const models = [...new Set(pool.map((c) => c.model))].sort();
  const select = document.getElementById("f-model");
  const keep = models.includes(state.model) ? state.model : "";
  state.model = keep;
  select.innerHTML = `<option value="">All models</option>`
    + models.map((m) => `<option value="${m}"${m === keep ? " selected" : ""}>${m}</option>`).join("");
}

function fillSelects() {
  fill("f-make", uniq("make"), "All makes");
  fillModels();
  fill("f-body", uniq("bodyType"), "Any body");
  fill("f-transmission", uniq("transmission"), "Any transmission");
  fill("f-fuel", uniq("fuel"), "Any fuel");

  // Шаги цены и года берём из самих данных, чтобы варианты не обещали того,
  // чего в каталоге нет.
  const prices = CAR_LISTINGS.map((c) => c.price);
  const lo = Math.floor(Math.min(...prices) / 5000) * 5000;
  const hi = Math.ceil(Math.max(...prices) / 5000) * 5000;
  const steps = [];
  for (let p = lo; p <= hi; p += 5000) steps.push(p);
  const priceOpts = (sel, label) => {
    document.getElementById(sel).innerHTML = `<option value="">${label}</option>`
      + steps.map((p) => `<option value="${p}">${p.toLocaleString("en-US")}</option>`).join("");
  };
  priceOpts("f-price-min", "from");
  priceOpts("f-price-max", "to");

  const years = [...new Set(CAR_LISTINGS.map((c) => c.year))].sort((a, b) => a - b);
  ["f-year-min", "f-year-max"].forEach((id, i) => {
    document.getElementById(id).innerHTML = `<option value="">${i ? "to" : "from"}</option>`
      + years.map((y) => `<option value="${y}">${y}</option>`).join("");
  });
}

// ---------- Обвязка ----------

function readControls() {
  const val = (id) => document.getElementById(id).value;
  const num = (id) => Number(val(id)) || null;
  state.make = val("f-make");
  state.model = val("f-model");
  state.priceMin = num("f-price-min");
  state.priceMax = num("f-price-max");
  state.yearMin = num("f-year-min");
  state.yearMax = num("f-year-max");
  state.body = val("f-body");
  state.transmission = val("f-transmission");
  state.fuel = val("f-fuel");
  state.maxMileage = num("f-mileage");
  state.sort = val("f-sort");
}

function refresh() {
  renderCatalog();
  renderList();
}

function wire() {
  const form = document.getElementById("auto-search");
  // Фильтруем по мере выбора; submit гасим, чтобы страница не перезагружалась
  // и выбранные значения не терялись.
  form.addEventListener("submit", (e) => e.preventDefault());

  ["f-make", "f-model", "f-price-min", "f-price-max", "f-year-min", "f-year-max",
   "f-body", "f-transmission", "f-fuel", "f-mileage", "f-sort"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      readControls();
      if (id === "f-make") { fillModels(); readControls(); }
      refresh();
    });
  });

  document.getElementById("f-reset").addEventListener("click", () => {
    form.reset();
    /* Состояние гасим до пересборки селектов: fillModels() оставляет выбранную
       модель отмеченной атрибутом selected, и без этой строки form.reset()
       возвращал бы её же — список после сброса оставался отфильтрованным. */
    state.make = "";
    state.model = "";
    fillSelects();
    readControls();
    refresh();
  });

  const more = document.getElementById("auto-search-more");
  const adv = document.getElementById("auto-search-adv");
  more.addEventListener("click", () => {
    adv.classList.toggle("open");
    more.classList.toggle("is-open");
  });

  // Клик по модели в каталоге — тот же фильтр, что и в селектах.
  document.getElementById("widget-car-catalog").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-model]");
    if (!btn) return;
    document.getElementById("f-make").value = btn.dataset.make || "";
    state.make = btn.dataset.make || "";
    fillModels();
    document.getElementById("f-model").value = btn.dataset.model || "";
    readControls();
    refresh();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  /* Этот модуль импортирует auto-listing.js ради carCardTemplate, а импорт
     тянет за собой и этот обработчик. На странице машины полей каталога нет,
     поэтому выходим сразу. Раньше такой проверки не было, и listing.html на
     каждой загрузке писал в консоль «Cannot read properties of null». */
  if (!document.getElementById("car-list")) return;

  fillSelects();
  readControls();
  renderCatalog();
  renderList();
  renderTopics();
  renderFirms();
  wire();
  mountAdSlots(document);
});
