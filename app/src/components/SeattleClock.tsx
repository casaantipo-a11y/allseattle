'use client'

import { useEffect, useState } from 'react'

import { clockText } from '@/lib/format'

// Date and time in Seattle, ticking. The server renders the page (ISR) with
// the time it was built at; this takes over in the browser so the header never
// shows a stale clock. `initial` avoids a hydration mismatch.
export function SeattleClock({ initial }: { initial: string }) {
  const [text, setText] = useState(initial)
  useEffect(() => {
    const tick = () => setText(clockText(new Date()))
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])
  return <span suppressHydrationWarning>{text}</span>
}
