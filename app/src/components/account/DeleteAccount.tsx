'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'

// "Delete my account" at the bottom of /account (stage 3). The button opens a confirmation
// window (client, 15.10.2026) — the site's .modal, as in the contest's Vote — with a short
// explanation and a password field (lib/account-delete.ts does the work).
export function DeleteAccount() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const password = useRef<HTMLInputElement>(null)

  function close() {
    if (busy || done) return
    setOpen(false)
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    document.body.classList.add('modal-open')
    password.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close reads the latest state on each render
  }, [open, busy, done])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = String(new FormData(e.currentTarget).get('password') ?? '')
    if (!value) {
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
        body: JSON.stringify({ password: value }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> }
      if (res.ok) {
        setDone(true)
        setBusy(false)
        return
      }
      setError(body.fieldErrors?.password ?? body.error ?? 'Something went wrong. Please try again.')
    } catch {
      setError('Could not reach the server. Please try again.')
    }
    setBusy(false)
  }

  return (
    <>
      <div className="flex justify-center">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
          Delete my account
        </button>
      </div>

      {open ? (
        <div className="modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && close()}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="del-title">
            {done ? (
              <div className="success-panel" role="status">
                <div>Your account is deleted. We sent a confirmation to your email.</div>
                <div className="mt-4">
                  {/* like LogoutButton: refresh drops the signed-in pages the router cached */}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      document.body.classList.remove('modal-open')
                      router.replace('/')
                      router.refresh()
                    }}
                  >
                    Go to the home page
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" className="modal-close" aria-label="Close" onClick={close} disabled={busy}>
                  &times;
                </button>
                <h2 id="del-title">Delete your account?</h2>
                <form onSubmit={onSubmit} noValidate>
                  <div className="mb-4">
                    <strong>This can’t be undone.</strong> Your account, your car and job listings and any business that isn’t live yet are deleted.
                    Published businesses and paid banners stay on the site without an owner until our team sorts them out. A subscription that still
                    renews has to be cancelled in “Manage billing” first.
                  </div>
                  <div className={`field${error ? ' invalid' : ''}`}>
                    <label htmlFor="del-password">Your password</label>
                    <input
                      ref={password}
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
                    <button type="button" className="btn btn-outline" disabled={busy} onClick={close}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
