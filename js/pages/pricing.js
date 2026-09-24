import { PRICING_TIERS, PRICING_FEATURES } from "../mock-data/pricing.js";
import { validate, isEmail, digits } from "../validation.js";
import { wireModal, closeModal, openModal } from "../modal.js";

const TIER_CLASS = { standard: "badge-standard", lux: "badge-lux", premium: "badge-premium" };

function tierCardTemplate(tier, featured) {
  return `
  <div class="card pricing-card ${featured ? "pricing-card--featured" : ""}">
    ${featured ? '<span class="pricing-featured-tag">Most Popular</span>' : ""}
    <div class="pricing-card-head">
      <span class="badge ${TIER_CLASS[tier.key]}">${tier.name}</span>
      <div class="pricing-price"><span class="amount">$${tier.monthly}</span><span class="period">/mo</span></div>
    </div>
    <ul class="pricing-cycles">
      <li><span>1 month</span><strong>$${tier.monthly}</strong></li>
      <li><span>3 months</span><strong>$${tier.q3}</strong></li>
      <li><span>6 months</span><strong>$${tier.q6}</strong></li>
      <li>
        <span>12 months</span>
        <strong>
          <span class="strike">$${tier.yearly}</span>
          $${tier.yearlyDiscounted}
        </strong>
      </li>
    </ul>
    <button class="btn ${featured ? "" : "btn-outline"} btn-block" data-choose-pkg="${tier.name}">Choose ${tier.name}</button>
  </div>`;
}

function renderPricingGrid() {
  const el = document.getElementById("pricing-grid");
  if (!el) return;
  el.innerHTML = PRICING_TIERS.map((t) => tierCardTemplate(t, t.key === "lux")).join("");
}

function cell(val) {
  if (val === true) return `<td class="check">&#10003;</td>`;
  if (val === false || val === 0) return `<td class="dash">&mdash;</td>`;
  return `<td class="num">${val}</td>`;
}

function renderFeatureTable() {
  const el = document.getElementById("feature-table");
  if (!el) return;
  el.innerHTML = `
    <thead>
      <tr>
        <th>Feature</th>
        <th>Standard</th>
        <th>Lux</th>
        <th>Premium</th>
      </tr>
    </thead>
    <tbody>
      ${PRICING_FEATURES.map(
        (f) => `<tr><td class="feature-label">${f.label}</td>${cell(f.standard)}${cell(f.lux)}${cell(f.premium)}</tr>`
      ).join("")}
    </tbody>`;
}

function wireChoosePackage() {
  wireModal("choose-pkg-overlay", null, "choose-pkg-close");

  document.getElementById("pricing-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-choose-pkg]");
    if (!btn) return;
    const tierName = btn.dataset.choosePkg;
    document.getElementById("choose-pkg-title").textContent = `Get the ${tierName} Package`;
    document.getElementById("choose-pkg-note").textContent = `Interested in the ${tierName} package? Tell us a bit about your business and we'll follow up. Nothing is charged now.`;
    openModal("choose-pkg-overlay");
  });

  const form = document.getElementById("choose-pkg-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      business: form.business.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value.trim(),
    };

    const ok = validate(form, data, {
      name: (v) => (!v ? "Please enter your name." : null),
      business: (v) => (!v ? "Please enter your business name." : null),
      contact: (v) => {
        if (!v) return "We need a way to reach you.";
        if (!isEmail(v) && digits(v).length < 7) return "Enter a valid email or phone number.";
        return null;
      },
      message: () => null,
    });

    if (!ok) return;

    document.getElementById("choose-pkg-content").innerHTML = `
      <div class="success-panel">
        <div class="success-icon">&#9989;</div>
        <h3>Thanks — we'll be in touch</h3>
        <p class="muted">This is a demo prototype, so no request was actually sent or charged.</p>
        <button class="btn" id="choose-pkg-done" type="button">Close</button>
      </div>`;
    document.getElementById("choose-pkg-done").addEventListener("click", () => {
      closeModal("choose-pkg-overlay");
      setTimeout(() => window.location.reload(), 200);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderPricingGrid();
  renderFeatureTable();
  wireChoosePackage();
});
