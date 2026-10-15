'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Field, FormMessage, formInputs } from './fields'
import { BODY_LIMIT, PhotoPicker, usePhotos, type Photo } from './photos'

// The business form of the account (stage 3, step 3): register a business or
// edit one the account manages. Posts multipart to /api/account/business(/:id);
// lib/business-cabinet.ts checks it all again, and the package hooks enforce
// the limits shown here.

export type CategoryOption = { id: number; label: string; group: string }
type Hours = { days: string; time: string }

export function BusinessForm({
  id,
  live = false,
  values = {},
  categories,
  chosen: initialChosen = [],
  hours: initialHours = [],
  logo = [],
  cover = [],
  gallery = [],
  limits,
}: {
  id?: number
  live?: boolean
  values?: Record<string, string>
  categories: CategoryOption[]
  chosen?: number[]
  hours?: Hours[]
  logo?: Photo[]
  cover?: Photo[]
  gallery?: Photo[]
  limits: { packageName: string; maxCategories: number; maxPhotos: number }
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [chosen, setChosen] = useState<number[]>(initialChosen)
  const [hours, setHours] = useState<Hours[]>(initialHours.length ? initialHours : [{ days: '', time: '' }])
  const logoPhotos = usePhotos('logo', logo, 1)
  const coverPhotos = usePhotos('cover', cover, 1)
  const galleryPhotos = usePhotos('gallery', gallery, limits.maxPhotos)
  const { input } = formInputs('bf', values, errors)
  const err = (name: string) => errors[name]

  const groups = [...new Set(categories.map((c) => c.group))]
  const labelOf = (cid: number) => categories.find((c) => c.id === cid)?.label ?? ''

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    chosen.forEach((c) => fd.append('categories', String(c)))
    for (const p of [logoPhotos, coverPhotos, galleryPhotos]) p.appendTo(fd)
    const missing: Record<string, string> = {}
    if (!String(fd.get('name') ?? '').trim()) missing.name = 'Required'
    if (!chosen.length) missing.categories = 'Choose at least one category'
    const bytes = logoPhotos.bytes + coverPhotos.bytes + galleryPhotos.bytes
    if (bytes > BODY_LIMIT) missing.gallery = 'Too many new photos for one save — save these first, then add the rest'
    setErrors(missing)
    if (Object.keys(missing).length) {
      setMessage('Please check the highlighted fields.')
      return
    }
    setState('sending')
    setMessage(null)
    try {
      const res = await fetch(id ? `/api/account/business/${id}` : '/api/account/business', { method: 'POST', body: fd, credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string; fieldErrors?: Record<string, string> }
      if (!res.ok) {
        setErrors(body.fieldErrors ?? {})
        setMessage(res.status === 413 ? 'Too many new photos for one save — remove some and add them after saving.' : (body.error ?? 'Something went wrong. Please try again.'))
        setState('idle')
        return
      }
      setMessage(body.message ?? 'Saved.')
      setState('done')
      router.refresh()
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
        <p>{message}</p>
        <div className="mt-4">
          <Link href="/account/business" className="btn">
            My business
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormMessage message={message} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="bf-hp">Fax</label>
        <input id="bf-hp" type="text" name="company_fax" tabIndex={-1} autoComplete="off" />
      </div>

      <h2>About the business</h2>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field id="bf-name" label="Business name" required error={err('name')} wide>
          <input {...input('name', { autoComplete: 'organization', maxLength: 120 })} />
        </Field>
        <Field
          id="bf-categories"
          label={`Categories (up to ${limits.maxCategories} with ${limits.packageName})`}
          required
          error={err('categories')}
          wide
        >
          {chosen.length ? (
            <div className="mb-3">
              <ul className="flex list-none flex-wrap gap-2 p-0">
                {chosen.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      aria-label={`Remove ${labelOf(c)}`}
                      onClick={() => setChosen((list) => list.filter((x) => x !== c))}
                    >
                      {labelOf(c)} &times;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {chosen.length < limits.maxCategories ? (
            <select
              id="bf-categories"
              value=""
              aria-invalid={err('categories') ? true : undefined}
              aria-describedby={err('categories') ? 'bf-categories-err' : undefined}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (v) setChosen((list) => (list.includes(v) ? list : [...list, v]))
              }}
            >
              <option value="">{chosen.length ? 'Add another category' : 'Choose a category'}</option>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {categories
                    .filter((c) => c.group === g && !chosen.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          ) : null}
        </Field>
        <Field id="bf-summary" label="Short description" error={err('summary')} wide hint="One or two sentences for the directory list and search engines">
          <textarea {...input('summary', { rows: 2, maxLength: 240 })} />
        </Field>
        <Field id="bf-description" label="About" error={err('description')} wide hint="What you do, what makes you different">
          <textarea {...input('description', { rows: 8, maxLength: 6000 })} />
        </Field>
      </div>

      <h2>Contacts</h2>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field id="bf-address" label="Address" error={err('address')} wide hint="Street address in Seattle — it puts you on the city map">
          <input {...input('address', { autoComplete: 'street-address', maxLength: 200 })} />
        </Field>
        <Field id="bf-phone" label="Phone" error={err('phone')}>
          <input {...input('phone', { type: 'tel', autoComplete: 'tel', maxLength: 40 })} />
        </Field>
        <Field id="bf-email" label="Email" error={err('email')}>
          <input {...input('email', { type: 'email', autoComplete: 'email', maxLength: 200 })} />
        </Field>
        <Field id="bf-website" label="Website" error={err('website')} wide>
          <input {...input('website', { type: 'url', inputMode: 'url', maxLength: 300, placeholder: 'https://' })} />
        </Field>
        <Field id="bf-facebook" label="Facebook" error={err('facebook')}>
          <input {...input('facebook', { type: 'url', inputMode: 'url', maxLength: 300 })} />
        </Field>
        <Field id="bf-instagram" label="Instagram" error={err('instagram')}>
          <input {...input('instagram', { type: 'url', inputMode: 'url', maxLength: 300 })} />
        </Field>
        <Field id="bf-x" label="X (Twitter)" error={err('x')}>
          <input {...input('x', { type: 'url', inputMode: 'url', maxLength: 300 })} />
        </Field>
        <Field id="bf-yelp" label="Yelp" error={err('yelp')}>
          <input {...input('yelp', { type: 'url', inputMode: 'url', maxLength: 300 })} />
        </Field>
      </div>

      <h2>Opening hours</h2>
      <div className={`field${err('hours') ? ' invalid' : ''}`}>
        {hours.map((h, i) => (
          // stacked on phones (the time didn't fit beside the days), one line from 640px
          <div
            key={i}
            className="mb-4 grid items-end gap-2 border-b border-brand-line pb-4 sm:mb-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:border-0 sm:pb-0"
          >
            <div>
              <label htmlFor={`bf-days-${i}`}>Days</label>
              <input
                id={`bf-days-${i}`}
                name="hoursDays"
                value={h.days}
                maxLength={40}
                placeholder="Mon–Fri"
                onChange={(e) => setHours((list) => list.map((x, j) => (j === i ? { ...x, days: e.target.value } : x)))}
              />
            </div>
            <div>
              <label htmlFor={`bf-time-${i}`}>Time</label>
              <input
                id={`bf-time-${i}`}
                name="hoursTime"
                value={h.time}
                maxLength={60}
                placeholder="9:00 AM – 6:00 PM"
                onChange={(e) => setHours((list) => list.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
              />
            </div>
            <button
              type="button"
              className="btn btn-outline justify-self-start"
              aria-label={`Remove row ${i + 1}`}
              onClick={() => setHours((list) => (list.length > 1 ? list.filter((_, j) => j !== i) : [{ days: '', time: '' }]))}
            >
              &times;
            </button>
          </div>
        ))}
        {hours.length < 14 ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setHours((list) => [...list, { days: '', time: '' }])}>
            Add a row
          </button>
        ) : null}
        <span className="field-error">{err('hours')}</span>
      </div>

      <h2>Pictures</h2>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field id="bf-logo" label="Logo" error={err('logo') ?? logoPhotos.problem ?? undefined}>
          <PhotoPicker id="bf-logo" photos={logoPhotos} label="Add a logo" hint="A square picture works best" />
        </Field>
        <Field id="bf-cover" label="Cover" error={err('cover') ?? coverPhotos.problem ?? undefined}>
          <PhotoPicker id="bf-cover" photos={coverPhotos} label="Add a cover" hint="The picture in the directory list" />
        </Field>
        <Field id="bf-gallery" label="Gallery" error={err('gallery') ?? galleryPhotos.problem ?? undefined} wide hint="Many photos? Save a few at a time.">
          <PhotoPicker id="bf-gallery" photos={galleryPhotos} hint={`Up to ${limits.maxPhotos} with ${limits.packageName} · JPEG, PNG or WebP`} />
        </Field>
      </div>

      {/* The note and Save set apart from the last field by a rule (client, 15.10.2026). */}
      <div className="account-submit">
        <div className="form-note mb-4">
          {live
            ? 'Your business is live: changes show on the site as soon as you save. The team may review them.'
            : 'The team checks every new business before it goes live, usually within a day.'}
        </div>
        <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
          {state === 'sending' ? 'Saving…' : live ? 'Save' : id ? 'Save and send for review' : 'Send for review'}
        </button>
      </div>
    </form>
  )
}
