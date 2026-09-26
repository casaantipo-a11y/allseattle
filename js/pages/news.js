import { NEWS_ARTICLES, TOP_NEWS_IDS } from "../mock-data/news.js";
import { validate, isEmail, digits } from "../validation.js";
import { wireModal, closeModal } from "../modal.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { relativeTime } from "../format-time.js";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

// Год и месяц режутся прямо из строки ISO, а не через Date: дата в данных
// записана без часового пояса, и разбор через Date сдвигал бы сентябрьскую
// полночь в август на западном берегу.
const yearOf = (article) => article.publishedAt.slice(0, 4);
const monthOf = (article) => article.publishedAt.slice(5, 7);

// Плотная строка ленты — тот же компонент, что в ленте главной
// (.news-list-row в components.css). Шаблон здесь свой, а не импортирован из
// home.js: импорт потянул бы её DOMContentLoaded — ровно то, из-за чего
// auto/listing.html до сих пор пишет ошибку в консоль. Страничные модули в
// этом проекте самодостаточны по устройству.
// Заголовок никуда не ведёт: отдельных страниц статей на сайте нет.
function newsListRowTemplate(article) {
  return `
  <a class="news-list-row" href="#" onclick="return false">
    <img class="news-list-thumb" src="${article.photo}" alt="" loading="lazy">
    <span class="news-list-body">
      <span class="news-list-meta">
        <span class="cat">${article.category}</span>
        <span>&middot;</span>
        <span>${relativeTime(article.publishedAt)}</span>
      </span>
      <span class="news-list-title">${article.title}</span>
      <span class="news-list-excerpt">${article.excerpt}</span>
    </span>
  </a>`;
}

// Реклама идёт по всей длине ленты, а не только в её начале: иначе человек
// прокручивает одни новости, а последний баннер лежит под всем списком.
// Строками лента примерно втрое короче прежней сетки карточек, поэтому мест
// внутри неё три, а не пять — шаг по высоте остался прежним.
// after — номер строки, после которой встаёт место.
const FEED_ADS = [
  // Эхо боковых колонок: нужно только там, где самих колонок нет (<1024px).
  { after: 4, echo: "news-side-1", tier: "300x250" },
  { after: 12, echo: "news-side-2", tier: "300x600" },
  // Свои места в ленте, на всех ширинах экрана. Последнее — до конца списка.
  { after: 8, seed: "news-feed-1" },
  { after: 16, seed: "news-feed-2" },
  { after: 24, seed: "news-feed-3" },
];

// Место рисуется через mountAdSlots (ниже), а не сразу: так оно получает обе
// версии бокса — 728x90 на десктопе и 320x100 на телефоне.
function feedAdMarkup(seed) {
  return `<div class="news-feed-ad" data-ad-slot="728x90" data-ad-slot-mobile="320x100" data-ad-seed="${seed}"></div>`;
}

// filter: { month, year } — пустая строка значит «все».
function renderFeed(filter) {
  const list = document.getElementById("news-list-all");
  if (!list) return;
  const articles = NEWS_ARTICLES.filter((article) =>
    (!filter.month || monthOf(article) === filter.month) &&
    (!filter.year || yearOf(article) === filter.year));

  if (!articles.length) {
    list.innerHTML = `<p class="muted">No stories filed in that month yet.</p>`;
    return;
  }

  let html = "";
  articles.forEach((article, i) => {
    html += newsListRowTemplate(article);
    FEED_ADS.filter((ad) => ad.after === i + 1).forEach((ad) => {
      html += ad.echo ? inlineAdMarkup(ad.echo, ad.tier) : feedAdMarkup(ad.seed);
    });
  });
  list.innerHTML = html;
  // Свой проход banner-ads.js к этому моменту уже отработал, так что без
  // этого вызова места в ленте остались бы пустыми коробками.
  mountAdSlots(list);
}

// Подборка редакции: ручной список id из mock-data, без счётчиков —
// «самое главное», а не самое читаемое. Рубрика и описание в колонке
// шириной 300px не помещаются, поэтому строка идёт в варианте --mini.
function renderTopNews() {
  const el = document.getElementById("widget-top-news");
  if (!el) return;
  const picks = TOP_NEWS_IDS
    .map((id) => NEWS_ARTICLES.find((article) => article.id === id))
    .filter(Boolean);
  el.innerHTML = `
    <div class="widget-head">Top News</div>
    <div class="widget-body">
      ${picks.map((article) => `
        <a class="news-list-row news-list-row--mini" href="#" onclick="return false">
          <img class="news-list-thumb" src="${article.photo}" alt="" loading="lazy">
          <span class="news-list-body">
            <span class="news-list-title">${article.title}</span>
          </span>
        </a>`).join("")}
    </div>`;
}

// Архив собирается из самих статей, а не из выдуманного списка месяцев: в
// демо-данных один месяц, и селект честно показывает ровно его. Появятся
// статьи постарше — месяцы появятся сами.
function renderArchive() {
  const el = document.getElementById("widget-archive");
  if (!el) return;
  const months = [...new Set(NEWS_ARTICLES.map(monthOf))].sort();
  const years = [...new Set(NEWS_ARTICLES.map(yearOf))].sort().reverse();
  el.innerHTML = `
    <div class="widget-head">News Archive</div>
    <div class="widget-body">
      <div class="news-archive-row">
        <div class="field">
          <label for="ar-month">Month</label>
          <select id="ar-month">
            <option value="">All</option>
            ${months.map((m) => `<option value="${m}">${MONTH_NAMES[Number(m) - 1]}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="ar-year">Year</label>
          <select id="ar-year">
            <option value="">All</option>
            ${years.map((y) => `<option value="${y}">${y}</option>`).join("")}
          </select>
        </div>
      </div>
    </div>`;
}

function wireArchive() {
  const el = document.getElementById("widget-archive");
  if (!el) return;
  el.addEventListener("change", () => {
    renderFeed({
      month: document.getElementById("ar-month").value,
      year: document.getElementById("ar-year").value,
    });
  });
}

function newsletterFormMarkup() {
  return `
    <form id="newsletter-form" novalidate>
      <div class="field" data-field="email">
        <label for="nl-email">Your e-mail address</label>
        <input type="email" id="nl-email" name="email" placeholder="you@example.com">
        <span class="field-error"></span>
      </div>
      <div class="newsletter-actions">
        <button type="submit" class="btn btn-sm" data-action="subscribe">Subscribe</button>
        <button type="submit" class="btn btn-outline btn-sm" data-action="unsubscribe">Unsubscribe</button>
      </div>
      <p class="form-note">A demo sign-up — nothing is sent and no address is stored.</p>
    </form>`;
}

function renderNewsletter() {
  const el = document.getElementById("widget-newsletter");
  if (!el) return;
  el.innerHTML = `
    <div class="widget-head">Newsletter</div>
    <div class="widget-body" id="newsletter-body">${newsletterFormMarkup()}</div>`;
}

// Ещё одна форма под демо-контракт: проверяет адрес и показывает готовую
// панель, где прямо сказано, что ничего не отправлено. Кнопка «Back»
// возвращает форму, чтобы показ можно было повторить, не перезагружая
// страницу, — как кнопка сброса голосов в конкурсе.
function wireNewsletterForm() {
  const body = document.getElementById("newsletter-body");
  if (!body) return;
  const form = document.getElementById("newsletter-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const action = (e.submitter && e.submitter.dataset.action) || "subscribe";
    const data = { email: form.email.value.trim() };

    const ok = validate(form, data, {
      email: (v) => {
        if (!v) return "Enter your email address.";
        if (!isEmail(v)) return "That doesn't look like an email address.";
        return null;
      },
    });

    if (!ok) return;

    const subscribing = action === "subscribe";
    body.innerHTML = `
      <div class="success-panel">
        <div class="success-icon">&#9989;</div>
        <h3>${subscribing ? "You're on the list" : "You're unsubscribed"}</h3>
        <p class="muted">${subscribing
          ? "The Seattle morning briefing would land in your inbox on weekdays."
          : "That address would stop receiving the briefing."} This is a demo, so nothing was sent and no address was stored.</p>
        <button class="btn btn-outline btn-sm" id="newsletter-again" type="button">Back</button>
      </div>`;
    document.getElementById("newsletter-again").addEventListener("click", () => {
      body.innerHTML = newsletterFormMarkup();
      wireNewsletterForm();
    });
  });
}

function wireShareNewsForm() {
  wireModal("share-news-overlay", "share-news-btn", "share-news-close");

  const photoInput = document.getElementById("sn-photo");
  const preview = document.getElementById("sn-photo-preview");
  if (photoInput) {
    photoInput.addEventListener("change", () => {
      preview.innerHTML = "";
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    });
  }

  const form = document.getElementById("share-news-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      title: form.title.value.trim(),
      text: form.text.value.trim(),
      contact: form.contact.value.trim(),
    };

    const ok = validate(form, data, {
      title: (v) => (!v ? "Please add a short headline." : v.length > 120 ? "Keep it under 120 characters." : null),
      text: (v) => (!v ? "Please describe what happened." : v.length < 10 ? "A few more details would help." : null),
      contact: (v) => {
        if (!v) return "We need a way to reach you.";
        if (!isEmail(v) && digits(v).length < 7) return "Enter a valid email or phone number.";
        return null;
      },
    });

    if (!ok) return;

    document.getElementById("share-news-content").innerHTML = `
      <div class="success-panel">
        <div class="success-icon">&#9989;</div>
        <h3>Thanks — your story was submitted for review</h3>
        <p class="muted">Our editors take a look at every submission before it goes live. This is a demo, so nothing was actually sent.</p>
        <button class="btn" id="share-news-done" type="button">Close</button>
      </div>`;
    document.getElementById("share-news-done").addEventListener("click", () => {
      closeModal("share-news-overlay");
      setTimeout(() => window.location.reload(), 200);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFeed({ month: "", year: "" });
  renderTopNews();
  renderNewsletter();
  renderArchive();
  wireArchive();
  wireNewsletterForm();
  wireShareNewsForm();
  mountAdSlots(document);
});
