import { JOB_LISTINGS, JOB_CATEGORIES } from "../mock-data/jobs.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";
import { relativeTime } from "../format-time.js";

function jobRowTemplate(job) {
  return `
  <article class="job-row reveal-on-scroll">
    <div class="job-row-head">
      <h3 class="job-title">${job.title}</h3>
      <span class="job-salary">${job.salary}</span>
    </div>
    <div class="job-company">${job.company} &middot; ${job.neighborhood}</div>
    <p class="job-desc">${job.description}</p>
    <div class="job-tags">
      <span class="job-tag job-tag--type">${job.type}</span>
      <span class="job-tag">${job.category}</span>
      <span class="job-posted">${relativeTime(job.postedAt)}</span>
    </div>
  </article>`;
}

function renderFilters(active) {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.innerHTML = ["All", ...JOB_CATEGORIES]
    .map((c) => `<button data-cat="${c}" class="${c === active ? "active" : ""}">${c}</button>`)
    .join("");
}

function renderList(active) {
  const list = document.getElementById("job-list");
  const count = document.getElementById("jobs-count");
  if (!list) return;
  const jobs = active === "All" ? JOB_LISTINGS : JOB_LISTINGS.filter((j) => j.category === active);
  if (count) count.textContent = `${jobs.length} ${jobs.length === 1 ? "opening" : "openings"}`;
  if (!jobs.length) {
    list.innerHTML = `<p class="muted">No openings in this category right now.</p>`;
    return;
  }
  let html = "";
  jobs.forEach((job, i) => {
    html += jobRowTemplate(job);
    // Тот же сид и размер, что у десктопного слота, иначе статус и цена
    // разойдутся между двумя показами одного размещения.
    if (i + 1 === 4) html += inlineAdMarkup("jobs-side-1", "300x250");
  });
  list.innerHTML = html;
  mountAdSlots(list);
  initScrollReveal(".reveal-on-scroll", list);
}

function wireFilters() {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    renderFilters(btn.dataset.cat);
    renderList(btn.dataset.cat);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFilters("All");
  renderList("All");
  wireFilters();
  const footer = document.getElementById("mobile-footer-ads");
  if (footer) footer.innerHTML = inlineAdMarkup("jobs-side-2", "300x600");
  mountAdSlots(document);
  initScrollReveal();
});
