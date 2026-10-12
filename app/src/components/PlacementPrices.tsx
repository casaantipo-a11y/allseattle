import { PLACEMENT_GROUPS, placementsOf, priceLabel, type Placement } from '@/lib/ad-placements'

import { Tabs } from './Tabs'

// /advertise → "Banner placement & prices" (client, 12.10.2026): a tab per page
// type — Home, News, Cars, Business Directory, Other sections — each with the
// client's page scheme (opens full size on click) and the price table, set in
// HTML from lib/ad-placements.ts so the text stays sharp and a price changes in
// one place. Status: Booked when a paid banner runs in that position right now
// (demo fillers don't count), otherwise Available.
export function PlacementPrices({ booked }: { booked: (codes: string[]) => boolean }) {
  return (
    <Tabs
      tabs={PLACEMENT_GROUPS.map((g) => ({
        id: g.key,
        label: g.label,
        content: (
          <div className={`placement-panel${g.scheme ? '' : ' placement-panel--no-scheme'}`}>
            {g.scheme ? (
              <a href={g.scheme.full} target="_blank" rel="noopener" className="placement-scheme" aria-label={`${g.label} page: banner positions, full size`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the client's scheme, a fixed WebP */}
                <img src={g.scheme.src} alt={`${g.label} page with the banner positions marked`} width={800} height={1311} loading="lazy" />
                <span className="placement-scheme-hint">Click to open full size</span>
              </a>
            ) : null}
            <div>
              {g.sections ? (
                <p className="muted">
                  Applies to: {g.sections.join(' · ')}. Each of these pages has its own two positions.
                </p>
              ) : null}
              <div className="table-scroll">
                <table className="feature-table placement-table">
                  <thead>
                    <tr>
                      <th>Banner location</th>
                      <th>Size</th>
                      <th>Frequency of displays</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placementsOf(g.key).map((p: Placement) => {
                      const isBooked = booked(p.codes)
                      return (
                        <tr key={p.position}>
                          <td className="feature-label">
                            <span className={`placement-block placement-block--${p.position[0].toLowerCase()}`}>
                              Block {p.position}
                            </span>
                          </td>
                          <td className="num">{p.size.replace('x', '×')}</td>
                          <td className="num">100%</td>
                          <td className="num">
                            <strong>{priceLabel(p.price)}</strong>
                          </td>
                          <td>
                            {isBooked ? (
                              <span className="ad-slot-status is-occupied">Booked</span>
                            ) : (
                              <a href={`/advertise?slot=${encodeURIComponent(p.codes[0])}#inquiry`} className="ad-slot-status is-available">
                                Available
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ),
      }))}
    />
  )
}
