'use client'

import { useState, type FormEvent } from 'react'

// The News sidebar's Newsletter box, back from the prototype (news.js) at the
// client's request (12.10.2026): an email field, Subscribe and Unsubscribe.
// Unlike the prototype it is real — the address and the button pressed land in
// Inbox → Submissions (type Newsletter) through /api/forms/newsletter.
export function NewsletterWidget() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const fd = new FormData(form)
    fd.set('action', submitter?.value === 'unsubscribe' ? 'unsubscribe' : 'subscribe')
    const email = String(fd.get('email') ?? '').trim()
    if (!email) return setError('Enter your email address.')
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/forms/newsletter', { method: 'POST', body: fd })
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> }
      if (res.ok && data.ok) {
        setMessage(data.message ?? 'Done.')
        setState('done')
        return
      }
      setError(data.fieldErrors?.email ?? data.error ?? 'Something went wrong. Please try again.')
    } catch {
      setError('Could not reach the server. Please try again.')
    }
    setState('idle')
  }

  return (
    <div className="widget">
      <div className="widget-head">Newsletter</div>
      <div className="widget-body">
        {state === 'done' ? (
          <div className="success-panel" role="status">
            <div className="success-icon" aria-hidden="true">
              &#9989;
            </div>
            <p className="muted">{message}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setState('idle')}>
              Back
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="field" data-field="email">
              <label htmlFor="nl-email">Your e-mail address</label>
              <input
                type="email"
                id="nl-email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'nl-email-err' : undefined}
              />
              {error ? (
                <span id="nl-email-err" className="field-error">
                  {error}
                </span>
              ) : null}
            </div>
            {/* Honeypot, as in SubmissionForm: off-screen, skipped by keyboard and screen readers. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="nl-hp">Fax</label>
              <input id="nl-hp" type="text" name="company_fax" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="newsletter-actions">
              <button type="submit" className="btn btn-sm" value="subscribe" disabled={state === 'sending'}>
                Subscribe
              </button>
              <button type="submit" className="btn btn-outline btn-sm" value="unsubscribe" disabled={state === 'sending'}>
                Unsubscribe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
