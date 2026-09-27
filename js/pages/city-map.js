import * as L from "../vendor/leaflet/leaflet-src.esm.js";
import { NEIGHBORHOODS } from "../mock-data/neighborhoods.js";
import { EVENTS } from "../mock-data/events.js";
import { JOB_LISTINGS } from "../mock-data/jobs.js";
import { PROPERTIES } from "../mock-data/real-estate.js";
import { mountAdSlots } from "../banner-ads.js";

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

const pins = new Map();

// Настоящая карта: Leaflet (лежит в js/vendor, не с CDN) и тайлы
// OpenStreetMap — единственное, кроме Google Fonts, что страница тянет из
// сети; без интернета останется серое поле с метками районов.
// Все анимации Leaflet выключены (правило сайта — без анимаций), колесо мыши
// карту не масштабирует, чтобы не перехватывать прокрутку страницы.
function renderMap() {
  const el = document.getElementById("city-map");
  if (!el) return;
  const map = L.map(el, {
    scrollWheelZoom: false,
    // Дробный зум: при целом fitBounds оставлял город мелким пятном
    // посреди Пьюджет-Саунда.
    zoomSnap: 0.25,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    inertia: false,
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  NEIGHBORHOODS.forEach((n) => {
    const icon = L.divIcon({
      className: "map-pin",
      html: `<span class="map-pin-inner"><span class="map-dot" aria-hidden="true"></span><span class="map-label">${n.name}</span></span>`,
      iconSize: null,
    });
    const marker = L.marker([n.lat, n.lng], { icon, title: n.name, alt: n.name, keyboard: true }).addTo(map);
    marker.on("click", () => selectHood(n.id));
    pins.set(n.id, marker);
  });

  // Справа запас под подписи: они стоят правее точек, и без него
  // «Columbia City» обрезалась краем карты на телефоне.
  map.fitBounds(L.latLngBounds(NEIGHBORHOODS.map((n) => [n.lat, n.lng])), {
    paddingTopLeft: [24, 24],
    paddingBottomRight: [120, 24],
  });
}

function hoodCardTemplate(n) {
  const c = countsFor(n.name);
  return `
  <article class="card hood-card" id="${n.id}">
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
  NEIGHBORHOODS.forEach((n) => {
    html += hoodCardTemplate(n);
  });
  grid.innerHTML = html;
}

function selectHood(id) {
  document.querySelectorAll(".hood-card.is-active").forEach((c) => c.classList.remove("is-active"));
  pins.forEach((m, pinId) => m.getElement()?.classList.toggle("is-active", pinId === id));
  const card = document.getElementById(id);
  if (card) {
    card.classList.add("is-active");
    card.scrollIntoView({ block: "start" });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderMap();
  renderGrid();
  mountAdSlots(document);
});
