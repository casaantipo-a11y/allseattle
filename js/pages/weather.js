import { WEATHER_NOW, WEATHER_HOURLY, WEATHER_WEEK, WEATHER_REGION } from "../mock-data/weather.js";
import { weatherIcon } from "../logo.js";
import { mountAdSlots } from "../banner-ads.js";

// Вкладка и единицы живут только в памяти страницы: localStorage на сайте
// разрешён одному конкурсу (CLAUDE.md, «The demo contract»).
// Открывается на Today (по часам) — просьба клиента 28.09.2026.
const state = { view: "today", unit: "f" };

const toUnit = (f) => (state.unit === "c" ? Math.round(((f - 32) * 5) / 9) : f);
const deg = (f) => `${toUnit(f)}&deg;`;

// ---------- Левая панель: сейчас ----------

function renderNow() {
  const el = document.getElementById("wx-now");
  if (!el) return;
  const w = WEATHER_NOW;
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  el.innerHTML = `
    <span class="wx-now-icon">${weatherIcon(w.icon, 112)}</span>
    <div class="wx-now-temp">${toUnit(w.temp)}<span>&deg;${state.unit.toUpperCase()}</span></div>
    <div class="wx-now-time">${day}, <span>${time}</span></div>
    <ul class="wx-now-facts">
      <li><span class="wx-fact-icon">${weatherIcon(w.icon, 20)}</span>${w.condition}</li>
      <li><span class="wx-fact-icon">${weatherIcon("rain", 20)}</span>Rain &ndash; ${WEATHER_WEEK[0].pop}%</li>
    </ul>
    <div class="wx-place">
      <img src="img/hero/downtown.webp" alt="" loading="lazy">
      <span>${w.place}</span>
    </div>`;
}

// ---------- Лента: Today (по часам) / Week (по дням) ----------

function dayLabel(offset) {
  if (offset === 0) return "Today";
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function renderStrip() {
  const el = document.getElementById("wx-strip");
  if (!el) return;
  const items = state.view === "week"
    ? WEATHER_WEEK.map((d, i) => ({
        label: dayLabel(i),
        icon: d.icon,
        title: `${d.condition}, ${d.pop}% chance of rain`,
        temps: `${deg(d.hi)} <span class="lo">${deg(d.lo)}</span>`,
      }))
    : WEATHER_HOURLY.map((h) => ({
        label: h.hour,
        icon: h.icon,
        title: `${h.pop}% chance of rain`,
        temps: deg(h.temp),
      }));
  el.className = `wx-strip wx-strip--${state.view === "week" ? "days" : "hours"}`;
  el.innerHTML = items.map((it) => `
    <div class="wx-slot" title="${it.title}">
      <span class="wx-slot-label">${it.label}</span>
      <span class="wx-slot-icon">${weatherIcon(it.icon, 24)}</span>
      <span class="wx-slot-temp">${it.temps}</span>
    </div>`).join("");
}

// ---------- Today's Highlights ----------

// Полукруглая шкала UV 0–12. Дуга рисуется одной линией с pathLength=100,
// заполнение — её же штрих на долю значения.
function uvGauge(uv) {
  const max = 12;
  const pct = Math.min(uv / max, 1) * 100;
  const ticks = [0, 3, 6, 9, 12].map((v) => {
    const a = Math.PI - (v / max) * Math.PI;
    const x = 100 + Math.cos(a) * 98;
    const y = 104 - Math.sin(a) * 98;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="wx-gauge-tick">${v}</text>`;
  }).join("");
  return `
    <svg class="wx-gauge" viewBox="-12 -8 224 124" role="img" aria-label="UV index ${uv} of ${max}">
      <path d="M22 104 A78 78 0 0 1 178 104" pathLength="100" class="wx-gauge-track"/>
      <path d="M22 104 A78 78 0 0 1 178 104" pathLength="100" class="wx-gauge-fill"
            stroke-dasharray="${pct.toFixed(1)} 100"/>
      ${ticks}
      <text x="100" y="100" class="wx-gauge-value">${uv}</text>
    </svg>`;
}

// Вертикальная шкала с точкой: чем выше значение, тем выше точка.
function meter(value, max, label) {
  const p = Math.max(0, Math.min(value / max, 1));
  return `<span class="wx-meter" role="img" aria-label="${label}"><span class="wx-meter-dot" style="--p:${p.toFixed(2)}"></span></span>`;
}

const uvWord = (v) => (v <= 2 ? "Low" : v <= 5 ? "Moderate" : v <= 7 ? "High" : "Very high");
const humidityWord = (v) => (v < 30 ? "Dry" : v <= 60 ? "Normal" : "High");
const visibilityWord = (mi) => (mi >= 6 ? "Good" : mi >= 2 ? "Average" : "Poor");
const aqiWord = (v) => (v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 150 ? "Unhealthy for some" : "Unhealthy");

function renderHighlights() {
  const el = document.getElementById("wx-highlights");
  if (!el) return;
  const w = WEATHER_NOW;
  const card = (title, body) => `<div class="wx-card"><span class="wx-card-title">${title}</span>${body}</div>`;
  el.innerHTML = [
    card("UV Index", `${uvGauge(w.uvIndex)}<span class="wx-card-note">${uvWord(w.uvIndex)}</span>`),
    card("Wind Status", `
      <span class="wx-big">${w.windMph}<small>mph</small></span>
      <span class="wx-card-note wx-with-icon"><span class="wx-round-icon">${weatherIcon("compass", 20)}</span>${w.windDir}</span>`),
    card("Sunrise &amp; Sunset", `
      <div class="wx-sun-row"><span class="wx-round-icon">${weatherIcon("sunrise", 20)}</span>
        <span><b>${w.sunrise}</b><span class="wx-shift">${w.sunriseShift}</span></span></div>
      <div class="wx-sun-row"><span class="wx-round-icon">${weatherIcon("sunset", 20)}</span>
        <span><b>${w.sunset}</b><span class="wx-shift">${w.sunsetShift}</span></span></div>`),
    card("Humidity", `
      <div class="wx-with-meter"><span class="wx-big">${w.humidity}<small>%</small></span>${meter(w.humidity, 100, `Humidity ${w.humidity}%`)}</div>
      <span class="wx-card-note">${humidityWord(w.humidity)}</span>`),
    card("Visibility", `
      <span class="wx-big">${w.visibilityMi}<small>mi</small></span>
      <span class="wx-card-note">${visibilityWord(w.visibilityMi)}</span>`),
    card("Air Quality", `
      <div class="wx-with-meter"><span class="wx-big">${w.aqi}</span>${meter(w.aqi, 200, `Air quality index ${w.aqi}`)}</div>
      <span class="wx-card-note">${aqiWord(w.aqi)}</span>`),
  ].join("");
}

// ---------- Соседние города ----------

function renderRegion() {
  const el = document.getElementById("weather-region");
  if (!el) return;
  el.innerHTML = WEATHER_REGION.map((r) => `
    <div class="weather-region-row">
      <span class="weather-region-city">${r.city}</span>
      <span class="weather-region-cond">
        <span class="weather-icon-sm">${weatherIcon(r.icon, 20)}</span>
        <span>${r.condition}</span>
      </span>
      <span class="weather-region-temp">${deg(r.temp)}</span>
    </div>`).join("");
}

// ---------- Переключатели ----------

function syncControls() {
  document.querySelectorAll(".wx-tab").forEach((b) => {
    const on = b.dataset.view === state.view;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".wx-unit").forEach((b) => {
    const on = b.dataset.unit === state.unit;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

function renderAll() {
  renderNow();
  renderStrip();
  renderHighlights();
  renderRegion();
  syncControls();
}

function wireControls() {
  document.querySelector(".wx-tabs")?.addEventListener("click", (e) => {
    const b = e.target.closest(".wx-tab");
    if (!b || b.dataset.view === state.view) return;
    state.view = b.dataset.view;
    renderStrip();
    syncControls();
  });
  document.querySelector(".wx-units")?.addEventListener("click", (e) => {
    const b = e.target.closest(".wx-unit");
    if (!b || b.dataset.unit === state.unit) return;
    state.unit = b.dataset.unit;
    renderAll();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  wireControls();
  mountAdSlots(document);
});
