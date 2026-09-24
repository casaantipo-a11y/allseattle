import { NEIGHBORHOODS, MAP_SHAPES } from "../mock-data/neighborhoods.js";
import { EVENTS } from "../mock-data/events.js";
import { JOB_LISTINGS } from "../mock-data/jobs.js";
import { PROPERTIES } from "../mock-data/real-estate.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

// Счётчики не хранятся в данных района, а считаются по трём разделам, у
// которых поле neighborhood уже есть. Добавится объявление — цифра сойдётся
// сама, без правки neighborhoods.js.
function countsFor(name) {
  return {
    events: EVENTS.filter((e) => e.neighborhood === name).length,
    jobs: JOB_LISTINGS.filter((j) => j.neighborhood === name).length,
    homes: PROPERTIES.filter((p) => p.neighborhood === name).length,
  };
}

// Схема в системе координат 0-100 — той же, в которой заданы точки районов.
// Точки рисуются не в SVG, а обычным HTML поверх него: внутри SVG подпись
// масштабировалась бы вместе с картинкой и на десктопе вырастала до 27px,
// а так это обычный текст по шкале кеглей и настоящая тап-зона 44px.
function renderMap() {
  const el = document.getElementById("city-map");
  if (!el) return;
  el.innerHTML = `
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <rect x="0" y="0" width="100" height="100" class="map-water"></rect>
    <path d="${MAP_SHAPES.land}" class="map-land"></path>
    <path d="${MAP_SHAPES.canal}" class="map-canal"></path>
    ${MAP_SHAPES.labels.map((l) => `<text x="${l.x}" y="${l.y}" class="map-water-label">${l.text}</text>`).join("")}
  </svg>
  <div class="map-pins">
    ${NEIGHBORHOODS.map((n) => `
      <button type="button" class="map-pin" data-hood="${n.id}" style="left:${n.x}%;top:${n.y}%">
        <span class="map-dot" aria-hidden="true"></span>
        <span class="map-label">${n.name}</span>
      </button>`).join("")}
  </div>`;
}

function hoodCardTemplate(n) {
  const c = countsFor(n.name);
  return `
  <article class="card hood-card reveal-on-scroll" id="${n.id}">
    <div class="hood-photo"><img src="${n.photo}" alt="${n.name}" loading="lazy"></div>
    <div class="hood-body">
      <span class="hood-known">${n.known}</span>
      <h3 class="hood-name">${n.name}</h3>
      <p class="hood-blurb">${n.blurb}</p>
      <div class="hood-counts">
        <span><b>${c.events}</b> events</span>
        <span><b>${c.jobs}</b> jobs</span>
        <span><b>${c.homes}</b> listings</span>
      </div>
    </div>
  </article>`;
}

function renderGrid() {
  const grid = document.getElementById("hood-grid");
  if (!grid) return;
  let html = "";
  NEIGHBORHOODS.forEach((n, i) => {
    html += hoodCardTemplate(n);
    if (i + 1 === 4) html += inlineAdMarkup("city-map-side-1", "300x250");
  });
  grid.innerHTML = html;
  mountAdSlots(grid);
  initScrollReveal(".reveal-on-scroll", grid);
}

function selectHood(id) {
  document.querySelectorAll(".hood-card.is-active").forEach((c) => c.classList.remove("is-active"));
  document.querySelectorAll(".map-pin.is-active").forEach((p) => p.classList.remove("is-active"));
  const card = document.getElementById(id);
  const pin = document.querySelector(`.map-pin[data-hood="${id}"]`);
  if (pin) pin.classList.add("is-active");
  if (card) {
    card.classList.add("is-active");
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function wireMap() {
  const el = document.getElementById("city-map");
  if (!el) return;
  el.addEventListener("click", (e) => {
    const pin = e.target.closest(".map-pin");
    if (pin) selectHood(pin.dataset.hood);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderMap();
  renderGrid();
  wireMap();
  const footer = document.getElementById("mobile-footer-ads");
  if (footer) footer.innerHTML = inlineAdMarkup("city-map-side-2", "300x600");
  mountAdSlots(document);
  initScrollReveal();
});
