import { validate, isEmail, digits } from "../validation.js";

const TOTAL_STEPS = 4;
let currentStep = 1;

const STEP_LABELS = ["Vehicle", "Condition", "Contact", "Review"];

const STEP_RULES = {
  1: {
    make: (v) => (!v ? "Please select a make." : null),
    model: (v) => (!v ? "Please enter a model." : null),
    year: (v) => (!v ? "Please select a year." : null),
  },
  2: {
    mileage: (v) => (!v || Number(v) < 0 ? "Please enter a valid mileage." : null),
    engine: (v) => (!v ? "Please describe the engine." : null),
    transmission: (v) => (!v ? "Please select a transmission." : null),
    price: (v) => (!v || Number(v) <= 0 ? "Please enter a valid asking price." : null),
  },
  3: {
    description: (v) => (!v || v.length < 10 ? "Please add a short description (10+ characters)." : null),
    sellerName: (v) => (!v ? "Please enter your name." : null),
    sellerContact: (v) => {
      if (!v) return "We need a way for buyers to reach you.";
      if (!isEmail(v) && digits(v).length < 7) return "Enter a valid email or phone number.";
      return null;
    },
  },
  4: {},
};

function populateYears() {
  const select = document.getElementById("al-year");
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select year";
  select.appendChild(placeholder);
  const current = new Date().getFullYear();
  for (let y = current + 1; y >= 2005; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

function renderStepper() {
  const el = document.getElementById("form-stepper");
  el.innerHTML = STEP_LABELS.map((label, i) => {
    const num = i + 1;
    const cls = num < currentStep ? "done" : num === currentStep ? "active" : "";
    return `<div class="step-dot ${cls}"><span class="num">${num < currentStep ? "&#10003;" : num}</span><span>${label}</span></div>`;
  }).join("");
}

function showStep(step) {
  document.querySelectorAll(".form-step").forEach((s) => {
    s.classList.toggle("active", Number(s.dataset.step) === step);
  });
  document.getElementById("al-back").disabled = step === 1;
  document.getElementById("al-next").classList.toggle("hidden", step === TOTAL_STEPS);
  document.getElementById("al-submit").classList.toggle("hidden", step !== TOTAL_STEPS);
  renderStepper();
  if (step === TOTAL_STEPS) renderReview();
}

function collectFormData(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (key === "photos") return;
    data[key] = typeof value === "string" ? value.trim() : value;
  });
  return data;
}

function validateStep(form, step) {
  const rules = STEP_RULES[step];
  if (!rules || Object.keys(rules).length === 0) return true;
  const data = collectFormData(form);
  return validate(form, data, rules);
}

function renderReview() {
  const form = document.getElementById("add-listing-form");
  const data = collectFormData(form);
  const rows = [
    ["Vehicle", `${data.year || ""} ${data.make || ""} ${data.model || ""}`.trim()],
    ["Mileage", data.mileage ? `${Number(data.mileage).toLocaleString("en-US")} mi` : ""],
    ["Engine", data.engine || ""],
    ["Transmission", data.transmission || ""],
    ["Price", data.price ? `$${Number(data.price).toLocaleString("en-US")}` : ""],
    ["Description", data.description || ""],
    ["Seller", data.sellerName || ""],
    ["Contact", data.sellerContact || ""],
  ];
  document.getElementById("review-list").innerHTML = rows
    .map(([k, v]) => `<div class="row"><span>${k}</span><span>${v || "&mdash;"}</span></div>`)
    .join("");
}

function wirePhotoPreview() {
  const input = document.getElementById("al-photos");
  const preview = document.getElementById("al-photo-preview");
  input.addEventListener("change", () => {
    preview.innerHTML = "";
    [...input.files].slice(0, 6).forEach((file) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    });
  });
}

function wireNav() {
  const form = document.getElementById("add-listing-form");
  document.getElementById("al-next").addEventListener("click", () => {
    if (!validateStep(form, currentStep)) return;
    currentStep = Math.min(currentStep + 1, TOTAL_STEPS);
    showStep(currentStep);
    window.scrollTo(0, form.offsetTop - 100);
  });
  document.getElementById("al-back").addEventListener("click", () => {
    currentStep = Math.max(currentStep - 1, 1);
    showStep(currentStep);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("add-listing-content").innerHTML = `
      <div class="success-panel">
        <div class="success-icon">&#9989;</div>
        <h3>Listing sent for moderation</h3>
        <p class="muted">Thanks! A team member will review your listing shortly. This is a demo — nothing was actually saved or published.</p>
        <a href="add-listing.html" class="btn">Submit Another</a>
        <a href="index.html" class="btn btn-outline" style="margin-left:8px;">Back to Catalog</a>
      </div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateYears();
  wirePhotoPreview();
  wireNav();
  showStep(currentStep);
});
