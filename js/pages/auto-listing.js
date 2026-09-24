import { CAR_LISTINGS } from "../mock-data/cars.js";
import { carCardTemplate } from "./auto-catalog.js";
import { validate, isEmail, digits } from "../validation.js";
import { initScrollReveal } from "../reveal.js";

const fmtPrice = (n) => `$${n.toLocaleString("en-US")}`;
const fmtMileage = (n) => `${n.toLocaleString("en-US")} mi`;

function getIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function renderNotFound() {
  document.getElementById("listing-root").innerHTML = `
    <div class="text-center" style="padding:60px 0;">
      <h2>Listing not found</h2>
      <p class="muted">This listing may have been removed or the link is incorrect.</p>
      <a href="index.html" class="btn">Back to Catalog</a>
    </div>`;
  document.getElementById("similar-cars-wrap").classList.add("hidden");
}

function galleryMarkup(car) {
  return `
  <div class="gallery-main" id="gallery-main">
    <img src="${car.photos[0]}" alt="${car.year} ${car.make} ${car.model}" id="gallery-main-img">
    ${car.photos.length > 1 ? `
      <button class="gallery-nav prev" id="gallery-prev" aria-label="Previous photo">&#8249;</button>
      <button class="gallery-nav next" id="gallery-next" aria-label="Next photo">&#8250;</button>
    ` : ""}
  </div>
  <div class="gallery-thumbs" id="gallery-thumbs">
    ${car.photos.map((p, i) => `<img src="${p}" data-idx="${i}" class="${i === 0 ? "active" : ""}" alt="Photo ${i + 1}">`).join("")}
  </div>`;
}

function specTableMarkup(car) {
  const rows = [
    ["Make", car.make],
    ["Model", car.model],
    ["Year", car.year],
    ["Mileage", fmtMileage(car.mileage)],
    ["Engine", car.engine],
    ["Transmission", car.transmission],
    ["Price", fmtPrice(car.price)],
  ];
  return `<table class="spec-table">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>`;
}

function sellerCardMarkup(car) {
  return `
  <div class="seller-card" id="seller-card">
    <h3 style="margin-bottom:6px;">Seller</h3>
    <p class="muted" style="margin-bottom:14px;">${car.seller.name} &middot; ${car.seller.phone}</p>
    <button class="btn btn-block" id="contact-seller-btn" type="button">Contact Seller</button>
    <form id="contact-seller-form" class="hidden" style="margin-top:16px;" novalidate>
      <div class="field" data-field="name">
        <label for="cs-name">Your name</label>
        <input type="text" id="cs-name" name="name">
        <span class="field-error"></span>
      </div>
      <div class="field" data-field="contact">
        <label for="cs-contact">Email or phone</label>
        <input type="text" id="cs-contact" name="contact">
        <span class="field-error"></span>
      </div>
      <div class="field" data-field="message">
        <label for="cs-message">Message</label>
        <textarea id="cs-message" name="message">Hi, is this still available?</textarea>
        <span class="field-error"></span>
      </div>
      <button type="submit" class="btn btn-block">Send Message</button>
    </form>
  </div>`;
}

function wireGallery(car) {
  let idx = 0;
  const img = document.getElementById("gallery-main-img");
  const thumbs = [...document.querySelectorAll("#gallery-thumbs img")];
  function show(newIdx) {
    idx = (newIdx + car.photos.length) % car.photos.length;
    img.src = car.photos[idx];
    thumbs.forEach((t) => t.classList.toggle("active", Number(t.dataset.idx) === idx));
  }
  thumbs.forEach((t) => t.addEventListener("click", () => show(Number(t.dataset.idx))));
  const prev = document.getElementById("gallery-prev");
  const next = document.getElementById("gallery-next");
  if (prev) prev.addEventListener("click", () => show(idx - 1));
  if (next) next.addEventListener("click", () => show(idx + 1));
}

function wireContactSeller() {
  const btn = document.getElementById("contact-seller-btn");
  const form = document.getElementById("contact-seller-form");
  if (!btn || !form) return;
  btn.addEventListener("click", () => {
    form.classList.toggle("hidden");
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value.trim(),
    };
    const ok = validate(form, data, {
      name: (v) => (!v ? "Please enter your name." : null),
      contact: (v) => {
        if (!v) return "We need a way to reach you.";
        if (!isEmail(v) && digits(v).length < 7) return "Enter a valid email or phone number.";
        return null;
      },
      message: (v) => (!v ? "Please add a short message." : null),
    });
    if (!ok) return;
    document.getElementById("seller-card").innerHTML = `
      <h3 style="margin-bottom:6px;">Message Sent</h3>
      <p class="muted">This is a demo — no message was actually delivered to the seller.</p>`;
  });
}

function renderSimilar(car) {
  const similar = CAR_LISTINGS
    .filter((c) => c.id !== car.id && (c.make === car.make || c.bodyType === car.bodyType))
    .slice(0, 3);
  document.getElementById("similar-cars-grid").innerHTML = similar.map(carCardTemplate).join("");
  initScrollReveal();
}

function render() {
  const id = getIdFromUrl();
  const car = CAR_LISTINGS.find((c) => c.id === id) || CAR_LISTINGS[0];
  if (!car) { renderNotFound(); return; }

  document.title = `${car.year} ${car.make} ${car.model} — AllSeattle Auto`;

  document.getElementById("listing-root").innerHTML = `
    <div class="listing-header">
      <div>
        <h1 style="margin-bottom:4px;">${car.year} ${car.make} ${car.model}</h1>
        <p class="muted" style="margin-bottom:0;">${fmtMileage(car.mileage)} &middot; ${car.transmission} &middot; ${car.engine}</p>
      </div>
      <div class="listing-price">${fmtPrice(car.price)}</div>
    </div>
    <div class="listing-layout">
      <div>
        ${galleryMarkup(car)}
        <h3 style="margin-top:28px;">Description</h3>
        <p class="muted">${car.description}</p>
        <h3 style="margin-top:20px;">Specifications</h3>
        ${specTableMarkup(car)}
      </div>
      <div>
        ${sellerCardMarkup(car)}
        <div data-ad-slot="300x250" data-ad-slot-mobile="320x100" data-ad-seed="listing-${car.id}"></div>
      </div>
    </div>`;

  wireGallery(car);
  wireContactSeller();
  renderSimilar(car);

  import("../banner-ads.js").then((m) => m.mountAdSlots(document));
}

document.addEventListener("DOMContentLoaded", render);
