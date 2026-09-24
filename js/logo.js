// The AllSeattle mark, rebuilt as vector so it works on any background.
//
// The site used to render the lockup from img/icons/logo-lockup.png, a flat
// 24-bit PNG with an opaque near-white background baked in — which is why
// both the hero and the footer had to hide it inside a white box. Everything
// here is transparent and recolorable, so the lockup sits straight on the
// photo hero and on the navy footer with no plate behind it. That PNG still
// exists, regenerated from this vector with an alpha channel, but nothing on
// the site loads it — it's only there as a raster for decks/email.
//
// The pin is SVG; the wordmark is real HTML text in Libre Franklin (already
// loaded by every page), so it stays crisp at any size and the tagline is
// legible instead of a smudge of downscaled pixels.

let pinInstance = 0;

/**
 * The map-pin mark: red teardrop, white disc, navy Space Needle.
 * The gradient id is per-instance because the pin is rendered more than once
 * per page (header + footer) and duplicate ids would collide.
 * Always aria-hidden — the surrounding link carries the accessible name.
 */
export function pinSvg({ className = "" } = {}) {
  const gradId = `as-pin-grad-${++pinInstance}`;
  return `<svg class="${className}" viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#FF2A22"/><stop offset="1" stop-color="#C1121F"/>
    </linearGradient></defs>
  <path fill="url(#${gradId})" d="M32 2C17.1 2 5 14.1 5 29c0 18.6 21.1 42.1 25.4 49.7a1.9 1.9 0 0 0 3.2 0C38 71.1 59 47.6 59 29 59 14.1 46.9 2 32 2z"/>
  <circle cx="32" cy="29" r="18" fill="#FFFFFF"/>
  <!-- The needle is drawn at a comfortable size then scaled about the disc's
       centre, so the disc radius and the needle size can be tuned
       independently without redoing every path. -->
  <g fill="#0D1B2A" transform="translate(32 28.6) scale(1.12) translate(-32 -28.6)">
    <path d="M32 13.1l.63 2.3v4.3h-1.26v-4.3z"/>
    <path d="M30.85 19.8h2.3l.55 2.4h-3.4z"/>
    <path d="M26.4 22.2h11.2l3.2 1.8h3.4l-2 1.6-5 2.2H26.8l-5-2.2-2-1.6h3.4l3.2-1.8z"/>
    <path d="M30.6 27.8h2.8l.4 15.4h-3.6z"/>
    <path d="M28.4 27.8h2.2c-.5 5.6-2.1 10.9-4.3 15.4h-2.6c2.5-4.7 4.2-10 4.7-15.4z"/>
    <path d="M35.6 27.8h-2.2c.5 5.6 2.1 10.9 4.3 15.4h2.6c-2.5-4.7-4.2-10-4.7-15.4z"/>
  </g>
</svg>`;
}

/**
 * Full lockup: pin + "AllSeattle" + tagline, as a link back to Home.
 * `variant: "dark"` is for placement on a dark background (the photo hero,
 * the navy footer) — it flips the wordmark and tagline to white and leaves
 * the red "All" and the pin alone, which read fine either way.
 */
export function logoLockupMarkup({ href = "#", variant = "light", size = "" } = {}) {
  const classes = ["site-logo", variant === "dark" ? "site-logo--dark" : "", size ? `site-logo--${size}` : ""]
    .filter(Boolean)
    .join(" ");
  return `<a href="${href}" class="${classes}" aria-label="AllSeattle — Seattle City Website">
  ${pinSvg({ className: "site-logo-pin" })}
  <span class="site-logo-text">
    <span class="site-logo-word"><span class="lw-all">All</span><span class="lw-seattle">Seattle</span></span>
    <span class="site-logo-tag">Seattle City Website</span>
  </span>
</a>`;
}

// The favicon is the same pin, kept as its own file at
// img/icons/favicon.svg so the nine <head>s can point at one asset instead
// of each carrying a copy of the path data. Edit both if the mark changes.

export const SOCIAL_ICONS = {
  facebook: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13.5 21v-8.1h2.72l.41-3.16h-3.13V7.71c0-.92.25-1.54 1.57-1.54h1.68V3.35C15.98 3.24 15 3.15 13.87 3.15c-2.55 0-4.3 1.56-4.3 4.42v2.17H6.83v3.16h2.74V21h3.93z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 5.9c-.66.3-1.36.5-2.1.6a3.7 3.7 0 0 0 1.6-2 7.3 7.3 0 0 1-2.33.9 3.66 3.66 0 0 0-6.24 3.34A10.38 10.38 0 0 1 4.6 4.7a3.66 3.66 0 0 0 1.14 4.9c-.6-.02-1.16-.18-1.65-.46v.05a3.66 3.66 0 0 0 2.94 3.59c-.55.15-1.13.17-1.7.06a3.67 3.67 0 0 0 3.42 2.55A7.35 7.35 0 0 1 3 16.9a10.35 10.35 0 0 0 5.6 1.64c6.72 0 10.4-5.57 10.4-10.4l-.01-.47c.72-.51 1.33-1.15 1.82-1.87-.66.29-1.36.48-2.1.58"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.2c2.72 0 3.05.01 4.12.06 1.07.05 1.8.22 2.44.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.44.05 1.07.06 1.4.06 4.12s-.01 3.05-.06 4.12c-.05 1.07-.22 1.8-.47 2.44a4.9 4.9 0 0 1-1.15 1.77c-.55.55-1.11.9-1.77 1.15-.64.25-1.37.42-2.44.47-1.07.05-1.4.06-4.12.06s-3.05-.01-4.12-.06c-1.07-.05-1.8-.22-2.44-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.44C2.01 15.05 2 14.72 2 12s.01-3.05.06-4.12c.05-1.07.22-1.8.47-2.44.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45 2.53c.64-.25 1.37-.42 2.44-.47C8.95 2.01 9.28 2 12 2zm0 1.8c-2.67 0-2.99.01-4.04.06-.87.04-1.34.18-1.66.3-.42.16-.72.36-1.03.67-.31.31-.51.61-.67 1.03-.12.32-.26.79-.3 1.66C4.24 8.5 4.23 8.83 4.23 11.5v1c0 2.67.01 2.99.06 4.04.04.87.18 1.34.3 1.66.16.42.36.72.67 1.03.31.31.61.51 1.03.67.32.12.79.26 1.66.3 1.05.05 1.37.06 4.04.06h1c2.67 0 2.99-.01 4.04-.06.87-.04 1.34-.18 1.66-.3.42-.16.72-.36 1.03-.67.31-.31.51-.61.67-1.03.12-.32.26-.79.3-1.66.05-1.05.06-1.37.06-4.04v-1c0-2.67-.01-2.99-.06-4.04-.04-.87-.18-1.34-.3-1.66a2.8 2.8 0 0 0-.67-1.03 2.8 2.8 0 0 0-1.03-.67c-.32-.12-.79-.26-1.66-.3C15 3.81 14.67 3.8 12 3.8zm0 3.05a5.15 5.15 0 1 1 0 10.3 5.15 5.15 0 0 1 0-10.3zm0 1.8a3.35 3.35 0 1 0 0 6.7 3.35 3.35 0 0 0 0-6.7zm5.36-1.99a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21.9 4.35 18.87 19c-.2 1-.82 1.26-1.66.79l-4.6-3.4-2.22 2.14c-.25.25-.45.45-.92.45l.33-4.66 8.47-7.65c.37-.33-.08-.51-.57-.18L7.24 13.1l-4.5-1.41c-.98-.3-1-.98.2-1.45l17.6-6.78c.82-.3 1.53.2 1.36 1.05z"/></svg>`,
};

// Line icons for the nav and the header utilities. One set, one weight:
// 24-unit box, 1.8 stroke, currentColor, no fills (design.md §6 asks for a
// single icon set at 16/20/24 — everything here renders at 20 unless a
// placement passes otherwise). These replaced the two loose emoji that used
// to stand in for search and weather.
const strokeIcon = (paths, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

export const NAV_ICONS = {
  home: strokeIcon(`<path d="M3.5 10.6 12 3.6l8.5 7"/><path d="M5.8 9.6V20h12.4V9.6"/><path d="M9.9 20v-5.3h4.2V20"/>`),
  news: strokeIcon(`<path d="M17.5 20H6a2 2 0 0 1-2-2V4.5h12.5V18a2 2 0 0 0 4 0V8.5h-4"/><path d="M7.5 8h6M7.5 11.5h6M7.5 15h4"/>`),
  directory: strokeIcon(`<path d="M4.5 20V4.8h9.7V20"/><path d="M14.2 10.4h5.3V20"/><path d="M3 20h18"/><path d="M7.5 8h3.2M7.5 11.6h3.2M7.5 15.2h3.2"/>`),
  pricing: strokeIcon(`<path d="M4 10.2v3.6a1 1 0 0 0 1 1h3l6 3.8V5.4l-6 3.8H5a1 1 0 0 0-1 1z"/><path d="M17.6 8.6a5 5 0 0 1 0 6.8"/>`),
  auto: strokeIcon(`<path d="M5.2 13.4 7 9a1.6 1.6 0 0 1 1.5-1h7a1.6 1.6 0 0 1 1.5 1l1.8 4.4"/><path d="M4 13.4h16V17H4z"/><circle cx="7.6" cy="17" r="1.5"/><circle cx="16.4" cy="17" r="1.5"/>`),
};

export const UI_ICONS = {
  account: strokeIcon(`<circle cx="12" cy="8.6" r="3.6"/><path d="M5 19.6a7 7 0 0 1 14 0"/>`),
  globe: strokeIcon(`<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6a13 13 0 0 1 0 16.8 13 13 0 0 1 0-16.8z"/>`),
  search: strokeIcon(`<circle cx="11" cy="11" r="6"/><path d="m15.4 15.4 4.1 4.1"/>`),
  weather: strokeIcon(`<path d="M7.6 18.4h8.9a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.4 1.3 3.4 3.4 0 0 0 1.2 6.7z"/>`, 24),
};
