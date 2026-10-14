'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Hide / Show / Renew / Delete on a row of /account/listings.
type Action = 'hide' | 'show' | 'renew' | 'delete'
const LABEL: Record<Action, string> = { hide: 'Hide', show: 'Show again', renew: 'Renew 30 days', delete: 'Delete' }

export function ListingActions({ kind, id, actions }: { kind: 'car' | 'job'; id: number; actions: Action[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: Action) {
    if (action === 'delete' && !window.confirm('Delete this listing for good? This cannot be undone.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/account/listings/${kind}/${id}/action`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) setError(body.error ?? 'Something went wrong. Please try again.')
      else router.refresh()
    } catch {
      setError('Could not reach the server. Please try again.')
    }
    setBusy(false)
  }

  return (
    <>
      {actions.map((a) => (
        <button key={a} type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(a)}>
          {LABEL[a]}
        </button>
      ))}
      {error ? (
        <p role="alert" className="m-0 w-full text-sm text-[#c53030]">
          {error}
        </p>
      ) : null}
    </>
  )
}
