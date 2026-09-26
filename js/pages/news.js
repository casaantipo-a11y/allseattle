import { NEWS_ARTICLES } from "../mock-data/news.js";
import { validate, isEmail, digits } from "../validation.js";
import { wireModal, closeModal } from "../modal.js";
import { inlineAdMarkup, mountAdSlots } from "../banner-ads.js";
import { relativeTime } from "../format-time.js";

function newsCardTemplate(article) {
  return `
  <article class="card news-card">
    <a href="#" class="news-card-photo" onclick="return false"><img src="${article.photo}" alt="${article.title}" loading="lazy"></a>
    <div class="news-card-body">
      <div class="news-card-meta">
        <span class="cat">${article.category}</span>
        <span>&middot;</span>
        <span>${relativeTime(article.publishedAt)}</span>
      </div>
      <h3><a href="#" onclick="return false">${article.title}</a></h3>
      <p class="news-card-excerpt">${article.body}</p>
      <div class="news-card-footer">
        <span class="news-card-author">By ${article.author}</span>
      </div>
    </div>
  </article>`;
}

// Реклама идёт по всей длине ленты, а не только в её начале. Замерено:
// 28 статей тянутся на 6 900px в три колонки и на 16 800px в одну, а весь
// инвентарь страницы раньше умещался в первые 1 400px — дальше человек
// прокручивал только новости, а последний баннер лежал вообще под лентой.
// after — номер карточки, после которой встаёт место.
const FEED_ADS = [
  // Эхо боковой колонки: нужно только там, где самой колонки нет (<1024px),
  // поэтому стоит в начале ленты — как и сама колонка на десктопе.
  { after: 2, echo: "news-side-1", tier: "300x250" },
  { after: 7, echo: "news-side-2", tier: "300x600" },
  // Свои места в ленте, во всю ширину ряда и на всех ширинах экрана:
  // каждые пять карточек, последнее — до конца списка, а не после него.
  { after: 5, seed: "news-feed-1" },
  { after: 10, seed: "news-feed-2" },
  { after: 15, seed: "news-feed-3" },
  { after: 20, seed: "news-feed-4" },
  { after: 25, seed: "news-feed-5" },
];

// Место рисуется через mountAdSlots (ниже), а не сразу: так оно получает
// обе версии бокса — 728x90 на десктопе и 320x100 на телефоне.
function feedAdMarkup(seed) {
  return `<div class="news-feed-ad" data-ad-slot="728x90" data-ad-slot-mobile="320x100" data-ad-seed="${seed}"></div>`;
}

function renderGrid() {
  const grid = document.getElementById("news-grid-all");
  if (!grid) return;
  let html = "";
  NEWS_ARTICLES.forEach((article, i) => {
    html += newsCardTemplate(article);
    FEED_ADS.filter((ad) => ad.after === i + 1).forEach((ad) => {
      html += ad.echo ? inlineAdMarkup(ad.echo, ad.tier) : feedAdMarkup(ad.seed);
    });
  });
  grid.innerHTML = html;
  mountAdSlots(grid);
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
  renderGrid();
  wireShareNewsForm();
  mountAdSlots(document);
});
