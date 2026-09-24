const AD_DIMS = {
  "970x250": { w: 970, h: 250 },
  "728x90": { w: 728, h: 90 },
  "300x250": { w: 300, h: 250 },
  "300x600": { w: 300, h: 600 },
  "320x100": { w: 320, h: 100 },
};

// Real rate card. Keyed by each placement's primary (desktop) size — the
// mobile-swap/inline echo of a placement keeps its parent's tier and price
// even though it renders smaller, since you're still buying the same spot.
const AD_TIERS = {
  "320x100": { name: "Start", price: 99 },
  "300x250": { name: "Business", price: 149 },
  "300x600": { name: "Premium", price: 199 },
  "728x90": { name: "Large", price: 299 },
  "970x250": { name: "Large", price: 299 },
};

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function mockStatus(seed) {
  // Hashes on seed alone so the same placement keeps the same Occupied/
  // Available status everywhere it appears (desktop, its own mobile-size
  // swap, and the mobile inline echo).
  const h = hashSeed(seed);
  return h % 5 < 3 ? "Occupied" : "Available"; // ~60% occupied, feels like a site that's selling
}

// variant: "desktop" | "mobile-only" toggles visibility via the site-wide
// @media(max-width:760px) swap; "standalone" has no such toggle class, so
// it's always visible whenever its own container is (used for the inline
// mobile-feed ads, whose visibility is controlled by their wrapper instead).
// `tierSize` decides the price/tier shown; `displaySize` decides the box's
// drawn dimensions — they differ for the mobile-swap variant of a placement.
function adSlotHtml(seed, displaySize, tierSize, variant) {
  const dims = AD_DIMS[displaySize] || { w: 300, h: 250 };
  const tier = AD_TIERS[tierSize] || AD_TIERS["300x250"];
  const status = mockStatus(seed);
  const statusClass = status === "Occupied" ? "is-occupied" : "is-available";
  const variantClass = variant === "mobile-only" ? "ad-slot--mobile-only" : variant === "desktop" ? "ad-slot--desktop" : "";
  return `
  <div class="ad-slot ${variantClass}" style="--ad-max-w:${dims.w}px;--ad-w:${dims.w};--ad-h:${dims.h}">
    <div class="ad-slot-inner">
      <span class="ad-slot-label">Your Ad Here</span>
      <span class="ad-slot-tier">${tier.name} &middot; ${displaySize}</span>
      <span class="ad-slot-status ${statusClass}">${status} &middot; $${tier.price}/month</span>
    </div>
  </div>`;
}

/**
 * Renders one ad placement. `size` is the primary (desktop) size, which
 * also decides its price tier. Pass `mobileSize` (usually "320x100") to
 * swap in a mobile-appropriate box size below 760px via CSS — the price
 * tier still reflects `size`, not `mobileSize`.
 */
export function renderAdSlot(seed, size, { mobileSize } = {}) {
  if (mobileSize) {
    return `<div class="ad-slot-wrap">${adSlotHtml(seed, size, size, "desktop")}${adSlotHtml(seed, mobileSize, size, "mobile-only")}</div>`;
  }
  return `<div class="ad-slot-wrap">${adSlotHtml(seed, size, size, "desktop")}</div>`;
}

/**
 * Fully-rendered markup for an ad placement interleaved inline in a content
 * feed on mobile (hidden on desktop via the .ad-mobile-inline-slot wrapper
 * class — see components.css). Always drawn at the compact 320x100 box, but
 * `tierSize` (the placement's real desktop size) decides which tier/price
 * it shows — pass the same seed AND tierSize as the desktop sidebar version
 * to keep them identical. Renders immediately rather than through
 * mountAdSlots()'s lazy [data-ad-slot] pass, since the inner box must never
 * carry the --desktop/--mobile-only toggle classes (those are hidden by the
 * very breakpoint this wrapper relies on to show itself).
 */
export function inlineAdMarkup(seed, tierSize = "300x250") {
  return `<div class="ad-mobile-inline-slot"><div class="ad-slot-wrap">${adSlotHtml(seed, "320x100", tierSize, "standalone")}</div></div>`;
}

export function mountAdSlots(root) {
  root.querySelectorAll("[data-ad-slot]").forEach((el) => {
    const size = el.dataset.adSlot;
    const mobileSize = el.dataset.adSlotMobile;
    const seed = el.dataset.adSeed || size;
    el.innerHTML = renderAdSlot(seed, size, { mobileSize });
  });
}

document.addEventListener("DOMContentLoaded", () => mountAdSlots(document));
