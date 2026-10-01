// The prototype's icon set, unchanged: one line set (24-unit box, 1.8 stroke,
// currentColor) plus filled social marks. Kept as SVG strings because that is
// how the prototype stores them; the markup is static and ours, so rendering
// it with dangerouslySetInnerHTML is safe.

const stroke = (paths: string, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`

export const NAV_ICONS: Record<string, string> = {
  home: stroke(`<path d="M3.5 10.6 12 3.6l8.5 7"/><path d="M5.8 9.6V20h12.4V9.6"/><path d="M9.9 20v-5.3h4.2V20"/>`),
  news: stroke(`<path d="M17.5 20H6a2 2 0 0 1-2-2V4.5h12.5V18a2 2 0 0 0 4 0V8.5h-4"/><path d="M7.5 8h6M7.5 11.5h6M7.5 15h4"/>`),
  directory: stroke(`<path d="M4.5 20V4.8h9.7V20"/><path d="M14.2 10.4h5.3V20"/><path d="M3 20h18"/><path d="M7.5 8h3.2M7.5 11.6h3.2M7.5 15.2h3.2"/>`),
  advertising: stroke(`<path d="M4 10.2v3.6a1 1 0 0 0 1 1h3l6 3.8V5.4l-6 3.8H5a1 1 0 0 0-1 1z"/><path d="M17.6 8.6a5 5 0 0 1 0 6.8"/>`),
  cars: stroke(`<path d="M5.2 13.4 7 9a1.6 1.6 0 0 1 1.5-1h7a1.6 1.6 0 0 1 1.5 1l1.8 4.4"/><path d="M4 13.4h16V17H4z"/><circle cx="7.6" cy="17" r="1.5"/><circle cx="16.4" cy="17" r="1.5"/>`),
}

export const UI_ICONS = {
  account: stroke(`<circle cx="12" cy="8.6" r="3.6"/><path d="M5 19.6a7 7 0 0 1 14 0"/>`),
  search: stroke(`<circle cx="11" cy="11" r="6"/><path d="m15.4 15.4 4.1 4.1"/>`),
}

export const WEATHER_ICONS: Record<string, (size?: number) => string> = {
  sun: (s) => stroke(`<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.4M12 19v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.6 12H5M19 12h2.4M4.3 19.7 6 18M18 6l1.7-1.7"/>`, s),
  cloud: (s) => stroke(`<path d="M7.6 18.4h8.9a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.4 1.3 3.4 3.4 0 0 0 1.2 6.7z"/>`, s),
  'cloud-sun': (s) => stroke(`<path d="M8.6 16.9h7.9a3.6 3.6 0 0 0 .3-7.2 5 5 0 0 0-9.4 1.2 3.1 3.1 0 0 0 1.2 6z"/><path d="M5.4 8.2a4 4 0 0 1 5-4.6"/><path d="M17.8 5.6 19 4.4M20.4 9h1.4M15.9 3.4V2.2"/>`, s),
  rain: (s) => stroke(`<path d="M7.8 14.6h8.7a3.8 3.8 0 0 0 .3-7.6 5.3 5.3 0 0 0-10 1.3 3.3 3.3 0 0 0 1 6.3z"/><path d="M9 17.6 8 20.4M13 17.6 12 20.4M17 17.6 16 20.4"/>`, s),
  snow: (s) => stroke(`<path d="M7.8 14.6h8.7a3.8 3.8 0 0 0 .3-7.6 5.3 5.3 0 0 0-10 1.3 3.3 3.3 0 0 0 1 6.3z"/><path d="M9 18.4h.01M12.5 20.4h.01M16 18.4h.01M10.7 21.2h.01M14.3 17.2h.01"/>`, s),
  sunrise: (s) => stroke(`<path d="M3.5 19h17"/><path d="M7.2 19a4.8 4.8 0 0 1 9.6 0"/><path d="M12 3.5v7M9.3 6.2 12 3.5l2.7 2.7"/>`, s),
  sunset: (s) => stroke(`<path d="M3.5 19h17"/><path d="M7.2 19a4.8 4.8 0 0 1 9.6 0"/><path d="M12 3.5v7M9.3 7.8 12 10.5l2.7-2.7"/>`, s),
  wind: (s) => stroke(`<path d="M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16.5h7"/>`, s),
  compass: (s) => stroke(`<circle cx="12" cy="12" r="8.5"/><path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z"/>`, s),
}

export const SOCIAL_ICONS: Record<'facebook' | 'instagram', string> = {
  facebook: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8.1h2.72l.41-3.16h-3.13V7.71c0-.92.25-1.54 1.57-1.54h1.68V3.35C15.98 3.24 15 3.15 13.87 3.15c-2.55 0-4.3 1.56-4.3 4.42v2.17H6.83v3.16h2.74V21h3.93z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2.2c2.72 0 3.05.01 4.12.06 1.07.05 1.8.22 2.44.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.44.05 1.07.06 1.4.06 4.12s-.01 3.05-.06 4.12c-.05 1.07-.22 1.8-.47 2.44a4.9 4.9 0 0 1-1.15 1.77c-.55.55-1.11.9-1.77 1.15-.64.25-1.37.42-2.44.47-1.07.05-1.4.06-4.12.06s-3.05-.01-4.12-.06c-1.07-.05-1.8-.22-2.44-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.44C2.01 15.05 2 14.72 2 12s.01-3.05.06-4.12c.05-1.07.22-1.8.47-2.44.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45 2.53c.64-.25 1.37-.42 2.44-.47C8.95 2.01 9.28 2 12 2zm0 1.8c-2.67 0-2.99.01-4.04.06-.87.04-1.34.18-1.66.3-.42.16-.72.36-1.03.67-.31.31-.51.61-.67 1.03-.12.32-.26.79-.3 1.66C4.24 8.5 4.23 8.83 4.23 11.5v1c0 2.67.01 2.99.06 4.04.04.87.18 1.34.3 1.66.16.42.36.72.67 1.03.31.31.61.51 1.03.67.32.12.79.26 1.66.3 1.05.05 1.37.06 4.04.06h1c2.67 0 2.99-.01 4.04-.06.87-.04 1.34-.18 1.66-.3.42-.16.72-.36 1.03-.67.31-.31.51-.61.67-1.03.12-.32.26-.79.3-1.66.05-1.05.06-1.37.06-4.04v-1c0-2.67-.01-2.99-.06-4.04-.04-.87-.18-1.34-.3-1.66a2.8 2.8 0 0 0-.67-1.03 2.8 2.8 0 0 0-1.03-.67c-.32-.12-.79-.26-1.66-.3C15 3.81 14.67 3.8 12 3.8zm0 3.05a5.15 5.15 0 1 1 0 10.3 5.15 5.15 0 0 1 0-10.3zm0 1.8a3.35 3.35 0 1 0 0 6.7 3.35 3.35 0 0 0 0-6.7zm5.36-1.99a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>`,
}

export function Svg({ html, className }: { html: string; className?: string }) {
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
}
