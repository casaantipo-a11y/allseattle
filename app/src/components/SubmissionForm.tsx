'use client'

import Script from 'next/script'
import { useRef, useState, type FormEvent } from 'react'

// A public form (spec §8): posts to /api/forms/{form}, shows the server's
// field errors next to the fields (the prototype's .field / .field-error
// styles), and a clear confirmation on success. Cloudflare Turnstile renders
// only when a site key is configured; the hidden honeypot field is always on.

export type FieldSpec = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  required?: boolean
  placeholder?: string
  autoComplete?: string
  options?: { value: string; label: string }[]
  defaultValue?: string
  hint?: string
}

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void }
  }
}

export function SubmissionForm({
  form,
  fields,
  submitLabel,
  turnstileSiteKey,
}: {
  form: string
  fields: FieldSpec[]
  submitLabel: string
  turnstileSiteKey?: string | null
}) {
  const ref = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setMessage(null)
    setErrors({})
    try {
      const res = await fetch(`/api/forms/${form}`, { method: 'POST', body: new FormData(e.currentTarget) })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> }
      if (res.ok && data.ok) {
        setState('done')
        setMessage(data.message ?? 'Thanks! We received your request.')
        return
      }
      setErrors(data.fieldErrors ?? {})
      setMessage(data.error ?? 'Something went wrong. Please try again.')
      setState('idle')
      window.turnstile?.reset()
    } catch {
      setMessage('Could not send the form — check your connection and try again.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="success-panel" role="status">
        <div className="success-icon" aria-hidden="true">
          &#9989;
        </div>
        <h3>{message}</h3>
      </div>
    )
  }

  return (
    <form ref={ref} onSubmit={onSubmit} noValidate>
      {turnstileSiteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> : null}

      {message ? (
        <p role="alert" className="mb-4 rounded-lg border border-[#c53030] bg-[#fdecec] px-4 py-3 text-sm text-[#c53030]">
          {message}
        </p>
      ) : null}

      {fields.map((f) => {
        const id = `f-${form}-${f.name}`
        const err = errors[f.name]
        const common = {
          id,
          name: f.name,
          required: f.required,
          placeholder: f.placeholder,
          autoComplete: f.autoComplete,
          defaultValue: f.defaultValue,
          'aria-invalid': err ? true : undefined,
          'aria-describedby': err ? `${id}-err` : f.hint ? `${id}-hint` : undefined,
        }
        return (
          <div key={f.name} className={`field${err ? ' invalid' : ''}`} data-field={f.name}>
            <label htmlFor={id}>
              {f.label}
              {f.required ? <span aria-hidden="true"> *</span> : null}
            </label>
            {f.type === 'textarea' ? (
              <textarea {...common} rows={5} />
            ) : f.type === 'select' ? (
              <select {...common}>
                <option value="">Choose…</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input {...common} type={f.type ?? 'text'} />
            )}
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

      {/* Honeypot: off-screen, skipped by keyboard and screen readers. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor={`f-${form}-hp`}>Fax</label>
        <input id={`f-${form}-hp`} type="text" name="company_fax" tabIndex={-1} autoComplete="off" />
      </div>

      {turnstileSiteKey ? <div className="cf-turnstile mb-4" data-sitekey={turnstileSiteKey} /> : null}

      <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}
