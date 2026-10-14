'use client'

import { useState } from 'react'

// The photo block of a business page (client's layout, Commercial.pdf p. 3): a large
// photo with arrows and a counter, and a strip of thumbnails under it. Switching is
// instant — the site has no animation.

/* eslint-disable @next/next/no-img-element -- Payload serves sized WebP renditions */

export type GalleryPhoto = { id: number; large: string; thumb: string; alt: string }

export function BizGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [i, setI] = useState(0)
  if (!photos.length) return null
  const cur = photos[i]
  const go = (d: number) => setI((n) => (n + d + photos.length) % photos.length)
  return (
    <div className="biz-gallery rounded-xl border border-brand-line bg-[#f7f8fa] p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-lg bg-white">
        <img src={cur.large} alt={cur.alt} className="block aspect-[16/9] w-full object-cover" />
        {photos.length > 1 ? (
          <>
            <button type="button" className="biz-gallery-arrow left-3" aria-label="Previous photo" onClick={() => go(-1)}>
              &#8249;
            </button>
            <button type="button" className="biz-gallery-arrow right-3" aria-label="Next photo" onClick={() => go(1)}>
              &#8250;
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-[rgba(13,27,42,0.7)] px-3 py-1 text-xs font-semibold text-white">
              {i + 1} / {photos.length}
            </div>
          </>
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list" aria-label="All photos">
          {photos.map((p, n) => (
            <button
              key={p.id}
              type="button"
              role="listitem"
              aria-label={`Photo ${n + 1}`}
              aria-current={n === i ? 'true' : undefined}
              onClick={() => setI(n)}
              className={`shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-transparent p-0 ${n === i ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
            >
              <img src={p.thumb} alt="" loading="lazy" className="block h-14 w-20 object-cover sm:h-16 sm:w-24" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
