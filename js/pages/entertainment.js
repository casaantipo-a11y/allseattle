import { VENUES, VENUE_KINDS } from "../mock-data/entertainment.js";
import { upcomingEvents, eventDateParts } from "../mock-data/events.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

function venueCardTemplate(v) {
  return `
  <article class="card venue-card reveal-on-scroll">
    <div class="venue-photo"><img src="${v.photo}" alt="${v.name}" loading="lazy"></div>
    <div class="venue-body">
      <div class="venue-meta">
        <span class="kind">${v.kind}</span>
        <span>&middot;</span>
        <span>${v.neighborhood}</span>
      </div>
      <h3 class="venue-name">${v.name}</h3>
      <p class="venue-desc">${v.description}</p>
      <div class="venue-foot">
        <span>${v.hours}</span>
        <span class="venue-price">${v.price}</span>
      </div>
    </div>
  </article>`;
}

function renderFilters(active) {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.innerHTML = ["All", ...VENUE_KINDS]
    .map((c) => `<button data-cat="${c}" class="${c === active ? "active" : ""}">${c}</button>`)
    .join("");
}

function renderGrid(active) {
  const grid = document.getElementById("venue-grid");
  if (!grid) return;
  const list = active === "All" ? VENUES : VENUES.filter((v) => v.kind === active);
  if (!list.length) {
    grid.innerHTML = `<p class="muted">Nothing listed under this heading yet.</p>`;
    return;
  }
  let html = "";
  list.forEach((v, i) => {
    html += venueCardTemplate(v);
    if (i + 1 === 4) html += inlineAdMarkup("entertainment-side-1", "300x250");
  });
  grid.innerHTML = html;
  mountAdSlots(grid);
  initScrollReveal(".reveal-on-scroll", grid);
}

// Тянет три ближайших события из раздела Events — разделы портала должны
// выглядеть как один сайт, а не как соседние.
function renderTonightWidget() {
  const el = document.getElementById("widget-tonight");
  if (!el) return;
  el.innerHTML = `
    <div class="widget-head">Tonight in Seattle</div>
    <div class="widget-body">
      ${upcomingEvents(3).map((ev) => {
        const d = eventDateParts(ev.startsAt);
        return `
        <a class="mini-row" href="events.html">
          <span class="mini-row-title">${ev.title}</span>
          <span class="mini-row-note">${d.month} ${d.day}</span>
        </a>`;
      }).join("")}
    </div>`;
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
  renderTonightWidget();
  wireFilters();
  const footer = document.getElementById("mobile-footer-ads");
  if (footer) footer.innerHTML = inlineAdMarkup("entertainment-side-2", "300x600");
  mountAdSlots(document);
  initScrollReveal();
});
