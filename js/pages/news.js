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

function renderGrid() {
  const grid = document.getElementById("news-grid-all");
  if (!grid) return;
  let html = "";
  NEWS_ARTICLES.forEach((article, i) => {
    html += newsCardTemplate(article);
    if (i + 1 === 4) html += inlineAdMarkup("news-side-1", "300x250");
  });
  grid.innerHTML = html;

  const footerAds = document.getElementById("mobile-footer-ads");
  if (footerAds) footerAds.innerHTML = inlineAdMarkup("news-side-2", "300x600");
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
