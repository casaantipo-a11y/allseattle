'use client'

import { useState } from 'react'

// The prototype's listing gallery (components.css .gallery-main/.gallery-thumbs).
export function CarGallery({ photos, alt }: { photos: { src: string; full: string }[]; alt: string }) {
  const [i, setI] = useState(0)
  if (!photos.length) return null
  const show = (n: number) => setI((n + photos.length) % photos.length)
  return (
    <>
      <div className="gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element -- Payload rendition */}
        <img src={photos[i].full} alt={`${alt} — photo ${i + 1} of ${photos.length}`} />
        {photos.length > 1 ? (
          <>
            <button type="button" className="gallery-nav prev" aria-label="Previous photo" onClick={() => show(i - 1)}>
              &#8249;
            </button>
            <button type="button" className="gallery-nav next" aria-label="Next photo" onClick={() => show(i + 1)}>
              &#8250;
            </button>
          </>
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="gallery-thumbs">
          {photos.map((p, n) => (
            <button key={p.src} type="button" className="contents" onClick={() => show(n)} aria-label={`Photo ${n + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
              <img src={p.src} alt="" className={n === i ? 'active' : undefined} />
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}
