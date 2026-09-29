// The AllSeattle mark, rebuilt as vector so it works on any background.
//
// The site used to render the lockup from img/icons/logo-lockup.png, a flat
// 24-bit PNG with an opaque near-white background baked in — which is why
// both the hero and the footer had to hide it inside a white box. Everything
// here is transparent and recolorable, so the lockup sits straight on the
// photo hero and on the navy footer with no plate behind it. That PNG still
// exists, but nothing on the site loads it, and it predates the 29.09.2026
// redraw of the pin — regenerate it from this vector before using it for
// decks/email.
//
// The pin is SVG; the wordmark is real HTML text in Libre Franklin (already
// loaded by every page), so it stays crisp at any size and the tagline is
// legible instead of a smudge of downscaled pixels.

let pinInstance = 0;

/**
 * The map-pin mark: red teardrop, white disc, navy Space Needle.
 * Redrawn 29.09.2026 from the client's reference lockup: a taller pin
 * (100×127), a wider disc with a thinner red ring, and a bigger needle whose
 * legs run into the bottom of the disc and are cut off by it (clipPath).
 * Ids are per-instance because the pin is rendered more than once per page
 * (header + footer) and duplicate ids would collide.
 * Always aria-hidden — the surrounding link carries the accessible name.
 */
export function pinSvg({ className = "" } = {}) {
  const n = ++pinInstance;
  const gradId = `as-pin-grad-${n}`;
  const clipId = `as-pin-clip-${n}`;
  return `<svg class="${className}" viewBox="0 0 100 127" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF1A1A"/><stop offset="0.55" stop-color="#E4141B"/><stop offset="1" stop-color="#B8101C"/>
    </linearGradient>
    <clipPath id="${clipId}"><circle cx="50" cy="47" r="33"/></clipPath>
  </defs>
  <path fill="url(#${gradId})" d="${PIN_PATH}"/>
  <circle cx="50" cy="47" r="33" fill="#FFFFFF"/>
  <g fill="#0D1B2A" clip-path="url(#${clipId})">${NEEDLE_PATHS}</g>
</svg>`;
}

// Outer teardrop: a half-circle top (centre 50,49, r 49) whose sides bulge
// slightly on the way down to the tip at 50,126, as in the reference.
// Shared with img/icons/favicon.svg — edit both together.
const PIN_PATH = "M50 126 C42 114 3 84 1 49 A49 49 0 0 1 99 49 C97 84 58 114 50 126 Z";

// Space Needle, top to bottom: spike, cap, upper tier, the wide saucer, the
// ring under it, the underside, then three legs converging down to the
// bottom of the disc, where the clipPath cuts them.
const NEEDLE_PATHS = `<g transform="translate(0 2.4)">
    <path d="M50 17.6 L51.2 28.4 H48.8 Z"/>
    <path d="M44.4 31.2 Q45 27.4 50 27.2 Q55 27.4 55.6 31.2 Z"/>
    <path d="M40.5 33 Q41 30.8 45 30.8 H55 Q59 30.8 59.5 33 Q59 35.2 55 35.2 H45 Q41 35.2 40.5 33 Z"/>
    <path d="M25.6 39.2 C26.8 35.4 35 34.4 42 34.4 H58 C65 34.4 73.2 35.4 74.4 39.2 C73.2 42.8 65 43.8 58 43.8 H42 C35 43.8 26.8 42.8 25.6 39.2 Z"/>
    <path d="M31.5 46.2 C32.5 44.4 36 44 40 44 H60 C64 44 67.5 44.4 68.5 46.2 C67.5 48 64 48.4 60 48.4 H40 C36 48.4 32.5 48 31.5 46.2 Z"/>
    <path d="M37 48.2 H63 L60.4 51.6 H39.6 Z"/>
    <path d="M38 51.4 H42.6 L47.2 82 H42.6 Z"/>
    <path d="M47.7 51.4 H52.3 V82 H47.7 Z"/>
    <path d="M57.4 51.4 H62 L57.4 82 H52.8 Z"/>
    </g>`;

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

// Погодные иконки для шапки и раздела Weather. Ключи совпадают с полем
// `icon` в mock-data/weather.js. Тот же strokeIcon(), значит та же толщина
// линии, что и у навигации (design.md §6 — один набор).
export const WEATHER_ICONS = {
  sun: (size) => strokeIcon(`<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.4M12 19v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.6 12H5M19 12h2.4M4.3 19.7 6 18M18 6l1.7-1.7"/>`, size),
  cloud: (size) => strokeIcon(`<path d="M7.6 18.4h8.9a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.4 1.3 3.4 3.4 0 0 0 1.2 6.7z"/>`, size),
  "cloud-sun": (size) => strokeIcon(`<path d="M8.6 16.9h7.9a3.6 3.6 0 0 0 .3-7.2 5 5 0 0 0-9.4 1.2 3.1 3.1 0 0 0 1.2 6z"/><path d="M5.4 8.2a4 4 0 0 1 5-4.6"/><path d="M17.8 5.6 19 4.4M20.4 9h1.4M15.9 3.4V2.2"/>`, size),
  rain: (size) => strokeIcon(`<path d="M7.8 14.6h8.7a3.8 3.8 0 0 0 .3-7.6 5.3 5.3 0 0 0-10 1.3 3.3 3.3 0 0 0 1 6.3z"/><path d="M9 17.6 8 20.4M13 17.6 12 20.4M17 17.6 16 20.4"/>`, size),
  snow: (size) => strokeIcon(`<path d="M7.8 14.6h8.7a3.8 3.8 0 0 0 .3-7.6 5.3 5.3 0 0 0-10 1.3 3.3 3.3 0 0 0 1 6.3z"/><path d="M9 18.4h.01M12.5 20.4h.01M16 18.4h.01M10.7 21.2h.01M14.3 17.2h.01"/>`, size),
  // Карточки «Today's Highlights» в разделе Weather.
  sunrise: (size) => strokeIcon(`<path d="M3.5 19h17"/><path d="M7.2 19a4.8 4.8 0 0 1 9.6 0"/><path d="M12 3.5v7M9.3 6.2 12 3.5l2.7 2.7"/>`, size),
  sunset: (size) => strokeIcon(`<path d="M3.5 19h17"/><path d="M7.2 19a4.8 4.8 0 0 1 9.6 0"/><path d="M12 3.5v7M9.3 7.8 12 10.5l2.7-2.7"/>`, size),
  wind: (size) => strokeIcon(`<path d="M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16.5h7"/>`, size),
  compass: (size) => strokeIcon(`<circle cx="12" cy="12" r="8.5"/><path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z"/>`, size),
};

// Всегда возвращает разметку: неизвестный ключ падает на облако, а не на
// пустое место в вёрстке.
export function weatherIcon(name, size = 20) {
  const make = WEATHER_ICONS[name] || WEATHER_ICONS.cloud;
  return make(size);
}
