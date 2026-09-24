import { CAR_LISTINGS } from "../mock-data/cars.js";

const fmtPrice = (n) => `$${n.toLocaleString("en-US")}`;

const MY_LISTING_IDS = ["c5", "c8", "c12"];
const MY_STATUSES = { c5: "Live", c8: "Pending Moderation", c12: "Live" };

function statusBadge(status) {
  const color = status === "Live" ? "var(--color-success)" : "#B7791F";
  return `<span style="color:${color};font-weight:700;font-size:12.5px;">${status}</span>`;
}

function cardTemplate(car) {
  return `
  <div class="card my-listing-card" style="margin-bottom:14px;">
    <img src="${car.photos[0]}" alt="${car.year} ${car.make} ${car.model}">
    <div class="my-listing-body">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <strong>${car.year} ${car.make} ${car.model}</strong>
        ${statusBadge(MY_STATUSES[car.id])}
      </div>
      <p class="muted" style="margin:4px 0 10px;">${fmtPrice(car.price)} &middot; ${car.mileage.toLocaleString("en-US")} mi</p>
      <div class="my-listing-actions">
        <button class="btn btn-sm btn-outline" data-demo-only>Edit</button>
        <button class="btn btn-sm btn-outline" data-demo-only>Delete</button>
        <a href="listing.html?id=${car.id}" class="btn btn-sm">View</a>
      </div>
    </div>
  </div>`;
}

function render() {
  const list = CAR_LISTINGS.filter((c) => MY_LISTING_IDS.includes(c.id));
  document.getElementById("my-listings-list").innerHTML = list.map(cardTemplate).join("");

  document.querySelectorAll("[data-demo-only]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const original = btn.textContent;
      btn.textContent = "Demo only";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1500);
    });
  });
}

document.addEventListener("DOMContentLoaded", render);
