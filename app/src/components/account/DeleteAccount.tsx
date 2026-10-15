'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

// "Delete my account" at the bottom of /account (stage 3): closed by default; opens
// a short explanation and a password field (lib/account-delete.ts does the work).
export function DeleteAccount() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password') ?? '')
    if (!password) {
      setError('Enter your password')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> }
      if (res.ok) {
        setDone(true)
        return
      }
      setError(body.fieldErrors?.password ?? body.error ?? 'Something went wrong. Please try again.')
    } catch {
      setError('Could not reach the server. Please try again.')
    }
    setBusy(false)
  }

  if (done) {
    return (
      <div className="success-panel" role="status">
        <div>Your account is deleted. We sent a confirmation to your email.</div>
        <div className="mt-4">
          {/* like LogoutButton: refresh drops the signed-in pages the router cached */}
          <button
            type="button"
            className="btn"
            onClick={() => {
              router.replace('/')
              router.refresh()
            }}
          >
            Go to the home page
          </button>
        </div>
      </div>
    )
  }
  if (!open) {
    return (
      <div className="flex justify-center">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
          Delete my account
        </button>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border border-[#c53030] p-4 sm:p-6">
      <div className="mb-4">
        <strong>This can’t be undone.</strong> Your account, your car and job listings and any business that isn’t live yet are deleted. Published
        businesses and paid banners stay on the site without an owner until our team sorts them out. A subscription that still renews has to be
        cancelled in “Manage billing” first.
      </div>
      <div className={`field${error ? ' invalid' : ''}`}>
        <label htmlFor="del-password">Your password</label>
        <input
          id="del-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'del-password-err' : undefined}
        />
        <span id="del-password-err" className="field-error" role="alert">
          {error}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Deleting…' : 'Delete my account for good'}
        </button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
