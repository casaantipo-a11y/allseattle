'use client'

import Script from 'next/script'
import { useEffect, useRef, useState, type FormEvent } from 'react'

// The entry grid of a contest page with voting (stage 3, step 6), on the
// prototype's card (.contest-card, .contest-vote-count) and modal (.modal-overlay).
// "Vote" opens the modal: email + Turnstile → /api/contests/vote, which emails a
// confirmation link; the vote counts once confirmed (lib/contest-votes.ts).

export type VoteEntry = { id: string; title: string; byline: string; img: string; alt: string; votes: number }

type Turnstile = { render: (el: HTMLElement, opts: { sitekey: string }) => string; remove: (id: string) => void; reset: () => void }
// (SubmissionForm declares window.turnstile with reset only; the explicit API is read through this)
const turnstile = () => (window as unknown as { turnstile?: Turnstile }).turnstile

const plural = (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`

export function ContestVoting({
  contestId,
  entries,
  open,
  label,
  turnstileSiteKey,
}: {
  contestId: number
  entries: VoteEntry[]
  open: boolean
  label: string
  turnstileSiteKey?: string | null
}) {
  const [chosen, setChosen] = useState<VoteEntry | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const widget = useRef<HTMLDivElement>(null)
  const emailInput = useRef<HTMLInputElement>(null)

  // Turnstile is rendered when the modal opens (the box doesn't exist before) and removed on close.
  useEffect(() => {
    if (!chosen || state === 'done' || !turnstileSiteKey) return
    let id: string | null = null
    let tries = 0
    const timer = window.setInterval(() => {
      const ts = turnstile()
      if (ts && widget.current) {
        id = ts.render(widget.current, { sitekey: turnstileSiteKey })
        window.clearInterval(timer)
      } else if (++tries > 50) window.clearInterval(timer)
    }, 100)
    return () => {
      window.clearInterval(timer)
      if (id) turnstile()?.remove(id)
    }
  }, [chosen, state, turnstileSiteKey])

  useEffect(() => {
    if (!chosen) return
    document.body.classList.add('modal-open')
    emailInput.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [chosen])

  function close() {
    setChosen(null)
    setState('idle')
    setMessage(null)
    setEmailError(null)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!chosen) return
    const fd = new FormData(e.currentTarget)
    fd.set('contest', String(contestId))
    fd.set('entry', chosen.id)
    if (!String(fd.get('email') ?? '').trim()) {
      setEmailError('Required')
      return
    }
    setState('sending')
    setMessage(null)
    setEmailError(null)
    try {
      const res = await fetch('/api/contests/vote', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string; field?: string }
      if (!res.ok) {
        if (body.field === 'email') setEmailError(body.error ?? 'Please check the email')
        else setMessage(body.error ?? 'Something went wrong. Please try again.')
        setState('idle')
        turnstile()?.reset()
        return
      }
      setMessage(body.message ?? 'Check your inbox to confirm the vote.')
      setState('done')
    } catch {
      setMessage('Could not reach the server. Please try again.')
      setState('idle')
    }
  }

  return (
    <>
      {open && turnstileSiteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer /> : null}
      <div className="grid contest-grid">
        {entries.map((e) => (
          <article key={e.id} className="card contest-card">
            <span className="contest-badge">Entry</span>
            <div className="contest-card-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- Payload rendition */}
              <img src={e.img} alt={e.alt} loading="lazy" />
            </div>
            <div className="contest-card-body">
              <h3 style={{ marginBottom: 2 }}>{e.title}</h3>
              <div className="muted text-sm">{e.byline}</div>
              <div className="contest-vote-count">{plural(e.votes)}</div>
              {open ? (
                <button type="button" className="btn btn-block" onClick={() => setChosen(e)}>
                  Vote
                </button>
              ) : (
                <div className="rounded-full bg-[#f7f8fa] px-3 py-2 text-center text-sm font-semibold text-brand-slate">{label}</div>
              )}
            </div>
          </article>
        ))}
      </div>

      {chosen ? (
        <div className="modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && close()}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="vote-title">
            <button type="button" className="modal-close" aria-label="Close" onClick={close}>
              &times;
            </button>
            <h2 id="vote-title">Vote for “{chosen.title}”</h2>
            <div className="muted mb-6">{chosen.byline}</div>
            {state === 'done' ? (
              <div className="success-panel" role="status">
                <div className="success-icon" aria-hidden="true">
                  &#9993;
                </div>
                <div>{message}</div>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                {message ? (
                  <div role="alert" className="mb-4 rounded-lg border border-[#c53030] bg-[#fdecec] px-4 py-3 text-sm text-[#c53030]">
                    {message}
                  </div>
                ) : null}
                <div className={`field${emailError ? ' invalid' : ''}`}>
                  <label htmlFor="vote-email">Your email</label>
                  <input
                    ref={emailInput}
                    id="vote-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={200}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? 'vote-email-err' : 'vote-email-hint'}
                  />
                  {emailError ? null : (
                    <span id="vote-email-hint" className="form-note">
                      We’ll send a link to confirm the vote. One vote per email per contest; we don’t use the address for anything else.
                    </span>
                  )}
                  <span id="vote-email-err" className="field-error">
                    {emailError}
                  </span>
                </div>
                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label htmlFor="vote-hp">Fax</label>
                  <input id="vote-hp" type="text" name="company_fax" tabIndex={-1} autoComplete="off" />
                </div>
                {turnstileSiteKey ? <div ref={widget} className="cf-turnstile mb-4" /> : null}
                <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
                  {state === 'sending' ? 'Please wait…' : 'Send confirmation link'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
