'use client'

import type { AnchorHTMLAttributes } from 'react'

import { trackClick } from './ViewBeacon'

/** A link whose click is counted for the business (owner's stats, never shown on a public page):
 *  "website" or "call". The link works as a plain link; counting is a beacon on the side. */
export function TrackedLink({ action, bizId, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { action: 'website' | 'call'; bizId: number }) {
  return <a {...rest} onClick={() => trackClick(action, bizId)} onAuxClick={(e) => e.button === 1 && trackClick(action, bizId)} />

}
