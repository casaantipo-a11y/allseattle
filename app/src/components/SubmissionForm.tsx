'use client'

import Script from 'next/script'
import { useRef, useState, type FormEvent } from 'react'

import { shrink } from './account/photos'

// A public form (spec §8): posts to /api/forms/{form}, shows the server's
// field errors next to the fields (the prototype's .field / .field-error
// styles), and a clear confirmation on success. Cloudflare Turnstile renders
// only when a site key is configured; the hidden honeypot field is always on.

export type FieldSpec = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'photos'
  required?: boolean
  placeholder?: string
  autoComplete?: string
  options?: { value: string; label: string }[]
  defaultValue?: string
  hint?: string
}

/** Up to 5 photos with previews; the server checks type and size again.
 * The native file input is visually hidden (still focusable and announced) behind a
 * picker drawn in the site's style: the browser's own "Choose files / No file chosen"
 * button looked out of place and spoke the browser's language, not the site's
 * (client, 07.10.2026). Styles: .photo-picker in components.css. */
function PhotoInput(props: { id: string; name: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) {
  const [previews, setPreviews] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  return (
    <>
      <div className="photo-picker">
        <input
          id={props.id}
          name={props.name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="photo-picker-input"
          aria-describedby={props['aria-describedby']}
          aria-invalid={props['aria-invalid']}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            previews.forEach((u) => URL.revokeObjectURL(u))
            setCount(files.length)
            setNote(
              files.length > 5
                ? 'Up to 5 photos — only the first 5 will be accepted.'
                : files.some((f) => f.size > 10 * 1024 * 1024)
                  ? 'Each photo must be under 10 MB.'
                  : null,
            )
            setPreviews(files.slice(0, 5).map((f) => URL.createObjectURL(f)))
          }}
        />
        <label htmlFor={props.id} className="photo-picker-box" aria-hidden="true">
          <span className="photo-picker-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
          <span className="photo-picker-text">
            <span className="photo-picker-title">
              {count ? `${Math.min(count, 5)} ${Math.min(count, 5) === 1 ? 'photo' : 'photos'} selected` : 'Add photos'}
            </span>
            <span className="photo-picker-hint">JPEG, PNG or WebP · up to 5, 10 MB each</span>
          </span>
          <span className="photo-picker-btn">{count ? 'Change' : 'Choose files'}</span>
        </label>
      </div>
      {note ? <span className="form-note text-[#c53030]">{note}</span> : null}
      {previews.length ? (
        <div className="photo-preview-row mt-2 flex flex-wrap gap-2">
          {previews.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element -- local preview
            <img key={u} src={u} alt="" className="h-20 w-20 rounded object-cover" />
          ))}
        </div>
      ) : null}
    </>
  )
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
      const fd = new FormData(e.currentTarget)
      // Photos go out scaled to 1600px (stage 3): Vercel takes at most 4.5 MB per
      // request, and five phone photos are well over that. The server makes its own sizes.
      for (const name of new Set([...fd.entries()].filter(([, v]) => v instanceof File && v.size).map(([k]) => k))) {
        const files = fd.getAll(name).filter((v): v is File => v instanceof File && v.size > 0)
        fd.delete(name)
        for (const f of await Promise.all(files.map(shrink))) fd.append(name, f, f.name)
      }
      const res = await fetch(`/api/forms/${form}`, { method: 'POST', body: fd })
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
            {f.type === 'photos' ? (
              <PhotoInput {...common} />
            ) : f.type === 'textarea' ? (
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
