'use client'

import Link from 'next/link'
import { useState } from 'react'

// The "Confirm my vote" button of /contests/vote (stage 3, step 6).
export function ConfirmVote({ token, contestSlug }: { token: string; contestSlug?: string | null }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function confirm() {
    setState('sending')
    setMessage(null)
    try {
      const res = await fetch('/api/contests/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
      setMessage(res.ok ? (body.message ?? 'Your vote is counted. Thank you!') : (body.error ?? 'Something went wrong. Please try again.'))
      setState(res.ok ? 'done' : 'idle')
    } catch {
      setMessage('Could not reach the server. Please try again.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="success-panel" role="status">
        <div className="success-icon" aria-hidden="true">
          &#9989;
        </div>
        <h3>Thank you!</h3>
        <div>{message}</div>
        {contestSlug ? (
          <div className="mt-4">
            <Link href={`/contests/${contestSlug}`} className="btn">
              Back to the contest
            </Link>
          </div>
        ) : null}
      </div>
    )
  }
  return (
    <>
      {message ? (
        <div role="alert" className="mb-4 rounded-lg border border-[#c53030] bg-[#fdecec] px-4 py-3 text-sm text-[#c53030]">
          {message}
        </div>
      ) : null}
      <button type="button" className="btn btn-lg btn-block" onClick={confirm} disabled={state === 'sending'}>
        {state === 'sending' ? 'Please wait…' : 'Confirm my vote'}
      </button>
    </>
  )
}
