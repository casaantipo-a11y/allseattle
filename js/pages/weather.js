import { WEATHER_NOW, WEATHER_HOURLY, WEATHER_WEEK, WEATHER_REGION } from "../mock-data/weather.js";
import { weatherIcon } from "../logo.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { initScrollReveal } from "../reveal.js";

function renderNow() {
  const el = document.getElementById("weather-now");
  if (!el) return;
  const w = WEATHER_NOW;
  const facts = [
    ["Feels like", `${w.feelsLike}&deg;F`],
    ["Humidity", w.humidity],
    ["Wind", w.wind],
    ["Pressure", w.pressure],
    ["Visibility", w.visibility],
    ["UV index", w.uv],
    ["Sunrise", w.sunrise],
    ["Sunset", w.sunset],
  ];
  el.innerHTML = `
    <div class="weather-now-main">
      <span class="weather-now-icon">${weatherIcon(w.icon, 64)}</span>
      <div>
        <div class="weather-temp">${w.temp}&deg;</div>
        <div class="weather-cond">${w.condition}</div>
        <div class="weather-feels">${w.city} &middot; updated a few minutes ago</div>
      </div>
    </div>
    <div class="weather-facts">
      ${facts.map(([k, v]) => `<div class="weather-fact"><span>${k}</span><b>${v}</b></div>`).join("")}
    </div>`;
}

function renderHourly() {
  const el = document.getElementById("weather-hourly");
  if (!el) return;
  el.innerHTML = WEATHER_HOURLY.map((h) => `
    <div class="weather-hour">
      <span class="h">${h.hour}</span>
      <span class="weather-icon-sm">${weatherIcon(h.icon, 24)}</span>
      <span class="t">${h.temp}&deg;</span>
      <span class="p">${h.pop}%</span>
    </div>`).join("");
}

function renderWeek() {
  const el = document.getElementById("weather-week");
  if (!el) return;
  el.innerHTML = WEATHER_WEEK.map((d) => `
    <div class="weather-day">
      <div>
        <div class="weather-day-name">${d.day}</div>
        <div class="weather-day-date">${d.date}</div>
      </div>
      <div class="weather-day-cond">
        <span class="weather-icon-sm">${weatherIcon(d.icon, 20)}</span>
        <span>${d.condition} &middot; ${d.pop}%</span>
      </div>
      <div class="weather-day-temps">${d.hi}&deg; <span class="lo">${d.lo}&deg;</span></div>
    </div>`).join("");
}

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
      <span class="weather-region-temp">${r.temp}&deg;</span>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderNow();
  renderHourly();
  renderWeek();
  renderRegion();
  const footer = document.getElementById("mobile-footer-ads");
  if (footer) {
    footer.innerHTML = inlineAdMarkup("weather-side-1", "300x250") + inlineAdMarkup("weather-side-2", "300x600");
  }
  mountAdSlots(document);
  initScrollReveal();
});
