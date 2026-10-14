'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

// The account forms (stage 3) in the site's form style (.field / .field-error,
// like SubmissionForm): sign up, log in, forgot / reset password, profile. Log in,
// password and profile go straight to Payload's REST endpoints for the
// `customers` collection, which set the auth cookie; sign-up goes through
// /api/account/register (Turnstile, rate limit).

type Mode = 'register' | 'login' | 'forgot' | 'reset' | 'profile'
type Field = { name: string; label: string; type?: string; autoComplete?: string; required?: boolean; hint?: string; defaultValue?: string }

const FIELDS: Record<Mode, Field[]> = {
  register: [
    { name: 'name', label: 'Your name', autoComplete: 'name', required: true },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', hint: 'Optional — buyers can call you.' },
    { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', required: true, hint: 'At least 8 characters.' },
  ],
  login: [
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password', required: true },
  ],
  forgot: [{ name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true }],
  reset: [{ name: 'password', label: 'New password', type: 'password', autoComplete: 'new-password', required: true, hint: 'At least 8 characters.' }],
  profile: [
    { name: 'name', label: 'Your name', autoComplete: 'name', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  ],
}

const SUBMIT: Record<Mode, string> = {
  register: 'Create account',
  login: 'Log in',
  forgot: 'Send reset link',
  reset: 'Save new password',
  profile: 'Save',
}

export function AccountForm({
  mode,
  turnstileSiteKey,
  token,
  next = '/account',
  customerId,
  values,
}: {
  mode: Mode
  turnstileSiteKey?: string | null
  token?: string
  next?: string
  customerId?: number
  values?: Record<string, string>
}) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>
    const missing: Record<string, string> = {}
    for (const f of FIELDS[mode]) if (f.required && !data[f.name]?.trim()) missing[f.name] = 'Required'
    if ((mode === 'register' || mode === 'reset') && data.password && data.password.length < 8) missing.password = 'Use at least 8 characters'
    setErrors(missing)
    if (Object.keys(missing).length) return
    setState('sending')
    setMessage(null)
    try {
      const jsonPost = (url: string, body: unknown, method = 'POST') =>
        fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const res =
        mode === 'register'
          ? await fetch('/api/account/register', { method: 'POST', body: fd })
          : mode === 'login'
            ? await jsonPost('/api/customers/login', { email: data.email, password: data.password })
            : mode === 'forgot'
              ? await jsonPost('/api/customers/forgot-password', { email: data.email })
              : mode === 'reset'
                ? await jsonPost('/api/customers/reset-password', { token, password: data.password })
                : await jsonPost(`/api/customers/${customerId}`, { name: data.name, phone: data.phone }, 'PATCH')
      const body = (await res.json().catch(() => ({}))) as {
        message?: string
        error?: string
        fieldErrors?: Record<string, string>
        errors?: { message?: string }[]
      }
      if (!res.ok) {
        if (body.fieldErrors) setErrors(body.fieldErrors)
        const raw = body.error ?? body.errors?.[0]?.message ?? ''
        setMessage(
          mode === 'login' && /verify/i.test(raw)
            ? 'Please confirm your email first — open the link we sent you.'
            : mode === 'login' && /locked/i.test(raw)
              ? 'Too many attempts. The account is locked for 15 minutes.'
              : mode === 'login'
                ? 'Wrong email or password.'
                : mode === 'reset'
                  ? 'This link has expired or was already used. Ask for a new one.'
                  : raw || 'Something went wrong. Please try again.',
        )
        setState('idle')
        return
      }
      if (mode === 'login' || mode === 'reset') {
        router.replace(next)
        router.refresh()
        return
      }
      if (mode === 'profile') {
        setMessage('Saved.')
        setState('idle')
        router.refresh()
        return
      }
      setMessage(
        mode === 'forgot'
          ? 'If an account with this email exists, we sent a link to reset the password. Check your inbox.'
          : (body.message ?? 'Done.'),
      )
      setState('done')
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
        <p>{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {mode === 'register' && turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      ) : null}
      {message ? (
        <div
          role={mode === 'profile' && message === 'Saved.' ? 'status' : 'alert'}
          className={
            mode === 'profile' && message === 'Saved.'
              ? 'mb-4 rounded-lg border border-[#2f855a] bg-[#eefaf3] px-4 py-3 text-sm text-[#276749]'
              : 'mb-4 rounded-lg border border-[#c53030] bg-[#fdecec] px-4 py-3 text-sm text-[#c53030]'
          }
        >
          {message}
        </div>
      ) : null}
      {FIELDS[mode].map((f) => {
        const id = `acc-${mode}-${f.name}`
        const err = errors[f.name]
        return (
          <div key={f.name} className={`field${err ? ' invalid' : ''}`}>
            <label htmlFor={id}>
              {f.label}
              {f.required ? <span aria-hidden="true"> *</span> : null}
            </label>
            <input
              id={id}
              name={f.name}
              type={f.type ?? 'text'}
              autoComplete={f.autoComplete}
              required={f.required}
              defaultValue={values?.[f.name] ?? f.defaultValue}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${id}-err` : f.hint ? `${id}-hint` : undefined}
            />
            {f.hint && !err ? (
              <span id={`${id}-hint`} className="form-note">
                {f.hint}
              </span>
            ) : null}
            <span id={`${id}-err`} className="field-error">
              {err}
            </span>
          </div>
        )
      })}
      {mode === 'register' ? (
        <>
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="acc-hp">Fax</label>
            <input id="acc-hp" type="text" name="company_fax" tabIndex={-1} autoComplete="off" />
          </div>
          {turnstileSiteKey ? <div className="cf-turnstile mb-4" data-sitekey={turnstileSiteKey} /> : null}
        </>
      ) : null}
      {mode === 'login' ? (
        <div className="mb-4 text-sm">
          <Link href="/account/forgot" className="text-brand-navy underline">
            Forgot your password?
          </Link>
        </div>
      ) : null}
      <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Please wait…' : SUBMIT[mode]}
      </button>
    </form>
  )
}

export function LogoutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={async () => {
        await fetch('/api/customers/logout', { method: 'POST', credentials: 'include' }).catch(() => null)
        router.replace('/account/login')
        router.refresh()
      }}
    >
      Log out
    </button>
  )
}
