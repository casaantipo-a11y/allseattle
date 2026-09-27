import {
  JOB_LISTINGS, JOB_CATEGORIES, JOB_TYPES, JOB_WORK_MODES, JOB_OPEN_TO,
  JOB_PERKS, JOB_LANGUAGES, MILES_FROM_DOWNTOWN, annualSalary,
} from "../mock-data/jobs.js";
import { mountAdSlots } from "../banner-ads.js";
import { relativeTime } from "../format-time.js";

/* Раздел собран по образцу work.ua, который прислал клиент. Четыре вещи из
   макета переносить было нельзя, и все четыре — сознательные:
   — название вакансии не ссылка: отдельных страниц вакансий на сайте нет, а
     ссылка в никуда запрещена (design.md §7). В справочнике строки молчат по
     той же причине;
   — «Save» ничего не сохраняет: localStorage на сайте трогает только конкурс,
     поэтому кнопка мигает «Demo only», как Edit/Delete в «My Listings»;
   — логотип компании — монограмма: логотипов нет, внешние картинки не тянем;
   — счётчики маленькие (1–5), потому что вакансий четырнадцать. Вариант с
     нулём не рисуем вообще — ссылка в пустую выдачу хуже короткого списка. */

const OPEN_TO_LABEL = Object.fromEntries(JOB_OPEN_TO);

const POSTED_WINDOWS = [
  ["1", "Last 24 hours"],
  ["3", "Last 3 days"],
  ["7", "Last week"],
];

/* Окна «за 3 дня» / «за неделю» считаются от настоящих часов — тех же, по
   которым relativeTime() пишет «2 days ago» в карточке. Считать от выдуманной
   даты нельзя: фильтр и подпись под вакансией разошлись бы на глазах у
   клиента. Даты в jobs.js держатся свежими, их сдвигают перед показом — как
   у новостей (CLAUDE.md, «Mock data»). */
function daysAgo(job) {
  return (Date.now() - new Date(job.postedAt)) / 86400000;
}

function monogram(company) {
  return company
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const checkIcon = `<svg class="job-check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
  stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
  aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

const pinIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>`;

function checkLines(job) {
  const lines = job.openTo.map((k) => OPEN_TO_LABEL[k]);
  if (job.workMode !== "On-site") lines.push(`${job.workMode} work`);
  if (job.languages.length) lines.push(`${job.languages.join(", ")} a plus`);
  lines.push(`Contact: ${job.contact.join(", ").toLowerCase()}`);
  return lines.map((l) => `<li>${checkIcon}<span>${l}</span></li>`).join("");
}

function jobCardTemplate(job) {
  const miles = MILES_FROM_DOWNTOWN[job.neighborhood];
  const badges = [
    job.urgent ? `<span class="job-badge job-badge--urgent">Urgent</span>` : "",
    job.featured ? `<span class="job-badge job-badge--featured">Featured</span>` : "",
  ].join("");
  return `
  <article class="job-card">
    ${badges ? `<div class="job-card-badges">${badges}</div>` : ""}
    <div class="job-card-body">
      <span class="job-card-title">${job.title}</span>
      <div class="job-card-salary">${job.salary}</div>
      <div class="job-card-company">
        <a href="directory.html?q=${encodeURIComponent(job.company)}">${job.company}</a>
        <span class="job-card-type">${job.type}</span>
      </div>
      <div class="job-card-place">${pinIcon}<span>${job.neighborhood} &middot; ${miles} mi from downtown</span></div>
      <ul class="job-card-checks">${checkLines(job)}</ul>
      <p class="job-card-desc">${job.description}</p>
    </div>
    <div class="job-card-side">
      <div class="job-card-logo" aria-hidden="true">${monogram(job.company)}</div>
      <span class="job-card-posted">${relativeTime(job.postedAt)}</span>
      <button class="job-card-save" type="button" data-demo-only>&#9825; Save</button>
    </div>
  </article>`;
}

// ---------- Состояние ----------

const state = {
  query: "",
  category: "All",
  types: [], workModes: [], openTo: [], perks: [], languages: [],
  salaryMin: null, salaryMax: null,
  postedWithin: "",
  sort: "newest",
};

/* Внутри группы варианты складываются («или»), между группами — пересекаются
   («и»), как на work.ua: две занятости расширяют выдачу, занятость плюс
   район её сужают. */
function matches(job, skip = "") {
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = [job.title, job.company, job.category, job.neighborhood, job.description].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (skip !== "category" && state.category !== "All" && job.category !== state.category) return false;
  if (skip !== "types" && state.types.length && !state.types.includes(job.type)) return false;
  if (skip !== "workModes" && state.workModes.length && !state.workModes.includes(job.workMode)) return false;
  if (skip !== "openTo" && state.openTo.length && !state.openTo.some((k) => job.openTo.includes(k))) return false;
  if (skip !== "perks" && state.perks.length && !state.perks.some((p) => job.perks.includes(p))) return false;
  if (skip !== "languages" && state.languages.length && !state.languages.some((l) => job.languages.includes(l))) return false;
  if (state.salaryMin && annualSalary(job) < state.salaryMin) return false;
  if (state.salaryMax && annualSalary(job) > state.salaryMax) return false;
  if (skip !== "posted" && state.postedWithin && daysAgo(job) > Number(state.postedWithin)) return false;
  return true;
}

function sorted(list) {
  switch (state.sort) {
    case "salary-desc": return [...list].sort((a, b) => annualSalary(b) - annualSalary(a));
    case "salary-asc": return [...list].sort((a, b) => annualSalary(a) - annualSalary(b));
    case "company": return [...list].sort((a, b) => a.company.localeCompare(b.company));
    default: return [...list].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }
}

// ---------- Колонка фильтров ----------

/* Счётчик варианта считается так, будто выбран только он: свою же группу при
   подсчёте пропускаем, иначе первый поставленный чекбокс обнулил бы соседние
   строки и выбрать вторую занятость стало бы нечем. */
function countFor(group, test) {
  return JOB_LISTINGS.filter((j) => matches(j, group) && test(j)).length;
}

function checkGroup(title, group, options) {
  const rows = options
    .map(([value, label]) => ({ value, label, n: countFor(group, (j) => {
      if (group === "types") return j.type === value;
      if (group === "workModes") return j.workMode === value;
      if (group === "openTo") return j.openTo.includes(value);
      if (group === "perks") return j.perks.includes(value);
      if (group === "languages") return j.languages.includes(value);
      if (group === "posted") return daysAgo(j) <= Number(value);
      return false;
    }) }))
    .filter((r) => r.n > 0 || state[group] && state[group].includes(r.value));
  if (!rows.length) return "";
  const single = group === "posted";
  return `
    <div class="filter-group">
      <h3 class="filter-title">${title}</h3>
      <ul class="filter-list">
        ${rows.map((r) => `
          <li><label>
            <input type="${single ? "radio" : "checkbox"}" name="${group}" value="${r.value}"
                   data-group="${group}" ${isChecked(group, r.value) ? "checked" : ""}>
            <span>${r.label}</span><span class="filter-num">${r.n}</span>
          </label></li>`).join("")}
      </ul>
    </div>`;
}

function isChecked(group, value) {
  if (group === "posted") return state.postedWithin === value;
  return state[group].includes(value);
}

function renderFilters() {
  const el = document.getElementById("jobs-filter-groups");
  if (!el) return;

  const cats = ["All", ...JOB_CATEGORIES].map((c) => ({
    value: c,
    n: c === "All" ? JOB_LISTINGS.filter((j) => matches(j, "category")).length
                   : countFor("category", (j) => j.category === c),
  })).filter((c) => c.n > 0 || c.value === state.category);

  el.innerHTML = `
    <div class="filter-group">
      <label class="filter-search">
        <span class="sr-only">Search openings</span>
        <input type="search" id="jobs-q" placeholder="Job title, company or skill" value="${state.query}">
      </label>
    </div>

    <div class="filter-group">
      <h3 class="filter-title">Category</h3>
      <ul class="filter-list filter-list--cats">
        ${cats.map((c) => `
          <li><button type="button" data-cat="${c.value}" class="${c.value === state.category ? "active" : ""}">
            <span>${c.value === "All" ? "All categories" : c.value}</span><span class="filter-num">${c.n}</span>
          </button></li>`).join("")}
      </ul>
    </div>

    ${checkGroup("Suits you", "openTo", JOB_OPEN_TO)}

    <div class="filter-group">
      <h3 class="filter-title">Salary, $ per year</h3>
      <div class="filter-pair">
        <label><span class="sr-only">Minimum salary</span>
          <select id="jobs-salary-min"></select></label>
        <span aria-hidden="true">&ndash;</span>
        <label><span class="sr-only">Maximum salary</span>
          <select id="jobs-salary-max"></select></label>
      </div>
    </div>

    ${checkGroup("Employment", "types", JOB_TYPES.map((t) => [t, t]))}
    ${checkGroup("Work mode", "workModes", JOB_WORK_MODES.map((m) => [m, m]))}
    ${checkGroup("Perks", "perks", JOB_PERKS.map((p) => [p, p]))}
    ${checkGroup("Language a plus", "languages", JOB_LANGUAGES.map((l) => [l, l]))}
    ${checkGroup("Posted", "posted", POSTED_WINDOWS)}

    <button type="button" class="btn btn-outline btn-sm btn-block" id="jobs-reset">Reset filters</button>`;

  fillSalary();
}

/* Пороги зарплат берём из самих вакансий, округляя до 10 тысяч, чтобы список
   не обещал того, чего в выдаче нет. */
function fillSalary() {
  const all = JOB_LISTINGS.map(annualSalary);
  const lo = Math.floor(Math.min(...all) / 10000) * 10000;
  const hi = Math.ceil(Math.max(...all) / 10000) * 10000;
  const steps = [];
  for (let v = lo; v <= hi; v += 10000) steps.push(v);
  const opts = (id, label, current) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${label}</option>`
      + steps.map((v) => `<option value="${v}"${String(v) === String(current) ? " selected" : ""}>${v.toLocaleString("en-US")}</option>`).join("");
  };
  opts("jobs-salary-min", "from", state.salaryMin);
  opts("jobs-salary-max", "to", state.salaryMax);
}

// ---------- Список ----------

function renderList() {
  const list = document.getElementById("job-list");
  const count = document.getElementById("jobs-count");
  if (!list) return;

  const found = sorted(JOB_LISTINGS.filter((j) => matches(j)));
  if (count) {
    count.textContent = found.length === JOB_LISTINGS.length
      ? `${JOB_LISTINGS.length} openings in Seattle`
      : `Showing ${found.length} of ${JOB_LISTINGS.length} openings`;
  }
  list.innerHTML = found.length
    ? found.map(jobCardTemplate).join("")
    : `<p class="muted">No openings match those filters. Try widening your search.</p>`;
}

function refresh() {
  renderFilters();
  renderList();
}

// ---------- Обвязка ----------

function toggleValue(group, value, on) {
  const arr = state[group];
  const i = arr.indexOf(value);
  if (on && i === -1) arr.push(value);
  if (!on && i !== -1) arr.splice(i, 1);
}

function wire() {
  const col = document.getElementById("jobs-filter-groups");

  col.addEventListener("change", (e) => {
    const input = e.target.closest("input[data-group]");
    if (input) {
      if (input.dataset.group === "posted") state.postedWithin = input.checked ? input.value : "";
      else toggleValue(input.dataset.group, input.value, input.checked);
      refresh();
      return;
    }
    if (e.target.id === "jobs-salary-min" || e.target.id === "jobs-salary-max") {
      state.salaryMin = Number(document.getElementById("jobs-salary-min").value) || null;
      state.salaryMax = Number(document.getElementById("jobs-salary-max").value) || null;
      refresh();
    }
  });

  col.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (btn) {
      state.category = btn.dataset.cat;
      refresh();
      return;
    }
    if (e.target.id === "jobs-reset") {
      state.query = "";
      state.category = "All";
      state.types = []; state.workModes = []; state.openTo = []; state.perks = []; state.languages = [];
      state.salaryMin = null; state.salaryMax = null; state.postedWithin = "";
      refresh();
    }
  });

  /* Поиск перерисовывает всю колонку, поэтому после неё возвращаем курсор в
     поле — иначе фокус терялся бы на каждой букве. */
  col.addEventListener("input", (e) => {
    if (e.target.id !== "jobs-q") return;
    state.query = e.target.value.trim();
    const pos = e.target.selectionStart;
    refresh();
    const again = document.getElementById("jobs-q");
    if (again) { again.focus(); again.setSelectionRange(pos, pos); }
  });

  const sort = document.getElementById("jobs-sort");
  sort.addEventListener("change", () => {
    state.sort = sort.value;
    renderList();
  });

  const toggle = document.getElementById("jobs-filters-toggle");
  const body = document.getElementById("jobs-filters-body");
  toggle.addEventListener("click", () => {
    const open = body.classList.toggle("open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  // «Save» ничего не сохраняет — тот же приём, что у Edit/Delete в My Listings.
  document.getElementById("job-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-demo-only]");
    if (!btn || btn.disabled) return;
    const original = btn.innerHTML;
    btn.innerHTML = "Demo only";
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 1500);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("job-list")) return;
  renderFilters();
  renderList();
  wire();
  mountAdSlots(document);
});
