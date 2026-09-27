import { QA_ITEMS, QA_TOPICS } from "../mock-data/qa.js";
import { mountAdSlots } from "../banner-ads.js";

// Нативный <details>: раскрытие, фокус и чтение скринридером работают сами,
// без единого обработчика.
function qaItemTemplate(item) {
  return `
  <details class="qa-item">
    <summary>
      <span>
        <span class="qa-topic">${item.topic}</span>
        ${item.question}
      </span>
      <span class="qa-mark" aria-hidden="true">+</span>
    </summary>
    <div class="qa-answer">
      <p>${item.answer}</p>
      <p class="qa-asked">Asked by ${item.askedBy}</p>
    </div>
  </details>`;
}

function renderFilters(active) {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.innerHTML = ["All", ...QA_TOPICS]
    .map((c) => `<button data-cat="${c}" class="${c === active ? "active" : ""}">${c}</button>`)
    .join("");
}

function renderList(active) {
  const list = document.getElementById("qa-list");
  if (!list) return;
  const items = active === "All" ? QA_ITEMS : QA_ITEMS.filter((q) => q.topic === active);
  if (!items.length) {
    list.innerHTML = `<p class="muted">No questions on this topic yet.</p>`;
    return;
  }
  let html = "";
  items.forEach((item) => {
    html += qaItemTemplate(item);
  });
  list.innerHTML = html;
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
  mountAdSlots(document);
});
