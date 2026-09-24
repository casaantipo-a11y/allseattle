import { CAR_LISTINGS } from "../mock-data/cars.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

const fmtPrice = (n) => `$${n.toLocaleString("en-US")}`;
const fmtMileage = (n) => `${n.toLocaleString("en-US")} mi`;

export function carCardTemplate(car) {
  return `
  <a href="listing.html?id=${car.id}" class="card car-card reveal-on-scroll">
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

function populateMakes() {
  const select = document.getElementById("f-make");
  const makes = [...new Set(CAR_LISTINGS.map((c) => c.make))].sort();
  makes.forEach((make) => {
    const opt = document.createElement("option");
    opt.value = make;
    opt.textContent = make;
    select.appendChild(opt);
  });
}

function getFilters() {
  return {
    make: document.getElementById("f-make").value,
    maxPrice: Number(document.getElementById("f-price").value) || null,
    minYear: Number(document.getElementById("f-year").value) || null,
    maxMileage: Number(document.getElementById("f-mileage").value) || null,
    sort: document.getElementById("f-sort").value,
  };
}

function applyFilters() {
  const { make, maxPrice, minYear, maxMileage, sort } = getFilters();
  let list = CAR_LISTINGS.filter((c) => {
    if (make && c.make !== make) return false;
    if (maxPrice && c.price > maxPrice) return false;
    if (minYear && c.year < minYear) return false;
    if (maxMileage && c.mileage > maxMileage) return false;
    return true;
  });

  switch (sort) {
    case "price-asc": list = list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list = list.sort((a, b) => b.price - a.price); break;
    case "year-desc": list = list.sort((a, b) => b.year - a.year); break;
    case "mileage-asc": list = list.sort((a, b) => a.mileage - b.mileage); break;
    default: break;
  }

  renderResults(list);
}

function renderResults(list) {
  const grid = document.getElementById("car-grid");
  const count = document.getElementById("auto-results-count");
  count.textContent = `${list.length} car${list.length === 1 ? "" : "s"} found`;
  if (!list.length) {
    grid.innerHTML = `<p class="muted">No cars match those filters. Try widening your search.</p>`;
    return;
  }
  let html = "";
  list.forEach((car, i) => {
    html += carCardTemplate(car);
    if (i + 1 === 4) html += inlineAdMarkup("auto-filter-ad", "300x600");
  });
  grid.innerHTML = html;
  mountAdSlots(grid);
  initScrollReveal(".reveal-on-scroll", grid);
}

function wireControls() {
  ["f-make", "f-price", "f-year", "f-mileage", "f-sort"].forEach((id) => {
    document.getElementById(id).addEventListener("change", applyFilters);
  });
  document.getElementById("f-reset").addEventListener("click", () => {
    ["f-make", "f-price", "f-year", "f-mileage"].forEach((id) => { document.getElementById(id).value = ""; });
    document.getElementById("f-sort").value = "default";
    applyFilters();
  });
  const toggle = document.getElementById("auto-filters-toggle");
  const body = document.getElementById("auto-filters-body");
  if (toggle) {
    toggle.addEventListener("click", () => {
      body.classList.toggle("open");
      toggle.classList.toggle("is-open");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  populateMakes();
  wireControls();
  applyFilters();
});
