import { EVENTS, EVENT_CATEGORIES, eventDateParts } from "../mock-data/events.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

function eventCardTemplate(ev) {
  const d = eventDateParts(ev.startsAt);
  return `
  <article class="card event-card reveal-on-scroll">
    <div class="event-photo">
      <img src="${ev.photo}" alt="${ev.title}" loading="lazy">
      <div class="event-date"><span class="m">${d.month}</span><span class="d">${d.day}</span></div>
    </div>
    <div class="event-body">
      <div class="event-meta">
        <span class="cat">${ev.category}</span>
        <span>&middot;</span>
        <span>${d.weekday}, ${d.time}</span>
      </div>
      <h3 class="event-title">${ev.title}</h3>
      <div class="event-venue">${ev.venue} &middot; ${ev.neighborhood}</div>
      <p class="event-desc">${ev.description}</p>
      <div class="event-price">${ev.price}</div>
    </div>
  </article>`;
}

function renderFilters(active) {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.innerHTML = ["All", ...EVENT_CATEGORIES]
    .map((c) => `<button data-cat="${c}" class="${c === active ? "active" : ""}">${c}</button>`)
    .join("");
}

function renderGrid(active) {
  const grid = document.getElementById("event-grid");
  if (!grid) return;
  const list = active === "All" ? EVENTS : EVENTS.filter((e) => e.category === active);
  if (!list.length) {
    grid.innerHTML = `<p class="muted">Nothing listed in this category yet.</p>`;
    return;
  }
  let html = "";
  list.forEach((ev, i) => {
    html += eventCardTemplate(ev);
    if (i + 1 === 4) html += inlineAdMarkup("events-side-1", "300x250");
  });
  grid.innerHTML = html;
  mountAdSlots(grid);
  initScrollReveal(".reveal-on-scroll", grid);
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
  const footer = document.getElementById("mobile-footer-ads");
  if (footer) footer.innerHTML = inlineAdMarkup("events-side-2", "300x600");
  mountAdSlots(document);
  initScrollReveal();
});
