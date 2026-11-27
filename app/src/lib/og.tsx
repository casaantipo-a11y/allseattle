import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { ImageResponse } from 'next/og'

// Branded Open Graph card, 1200x630: navy field, the white-lettered logo, a
// red rule and the title. Used by every route's opengraph-image.
export const OG_SIZE = { width: 1200, height: 630 }

let logoCache: string | null = null
async function logoDataUrl() {
  if (!logoCache) {
    const buf = await readFile(path.join(process.cwd(), 'public/brand/logo-dark.png'))
    logoCache = `data:image/png;base64,${buf.toString('base64')}`
  }
  return logoCache
}

/**
 * The card for a title. Satori reads the font while the response streams, so a title it cannot lay
 * out (Arabic: "lookupType: 5 - substFormat: 3 is not yet supported", QA 27.11.2026) did not fail
 * here but cut the connection half way, with a stack trace in the log. The image is therefore
 * drawn to the end first; a title that fails is retried without the Arabic letters, then as the
 * site name, so the page still has a preview picture.
 */
export async function ogCard({ title, kicker }: { title: string; kicker?: string }) {
  const stripped = title.replace(/\p{Script=Arabic}/gu, '').replace(/\s+/g, ' ').trim()
  for (const t of [title, stripped, 'AllSeattle']) {
    if (!t) continue
    try {
      const res = await drawCard({ title: t, kicker })
      return new Response(await res.arrayBuffer(), { headers: res.headers })
    } catch (e) {
      console.error('[og] card could not be drawn for this title, trying a plainer one:', e instanceof Error ? e.message : e)
    }
  }
  return new Response(null, { status: 404 })
}

async function drawCard({ title, kicker }: { title: string; kicker?: string }) {
  const logo = await logoDataUrl()
  const size = title.length > 90 ? 52 : title.length > 60 ? 60 : 68
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0D1B2A',
          padding: '64px 72px',
          color: '#FFFFFF',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
        <img src={logo} width={373} height={120} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {kicker ? (
            <div style={{ color: '#E53935', fontSize: 30, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>
              {kicker}
            </div>
          ) : null}
          <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.12 }}>{title}</div>
        </div>
        <div style={{ height: 10, width: 180, background: '#E53935', borderRadius: 5 }} />
      </div>
    ),
    OG_SIZE,
  )
}
