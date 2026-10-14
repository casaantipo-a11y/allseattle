'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Field, FormMessage, formInputs, type Option } from './fields'
import { PhotoPicker, usePhotos, type Photo } from './photos'

// The account's banner forms (stage 3, step 5): buying a place (→ Stripe
// Checkout) and uploading the banner for it (→ the team's review).

type Body = { url?: string; message?: string; error?: string; fieldErrors?: Record<string, string> }

export function AdCheckoutForm({ slots, chosen, price, values = {} }: { slots: (Option & { taken: boolean })[]; chosen: string; price: string; values?: Record<string, string> }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { input } = formInputs('adc', { slot: chosen, ...values }, errors)
  const free = slots.filter((s) => !s.taken)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (fd.get('consent') !== 'yes') {
      setErrors({ consent: 'Please confirm the monthly payment' })
      return
    }
    setBusy(true)
    setMessage(null)
    const res = await fetch('/api/account/ads/checkout', { method: 'POST', body: fd, credentials: 'include' }).catch(() => null)
    const body = ((await res?.json().catch(() => ({}))) ?? {}) as Body
    if (res?.ok && body.url) {
      window.location.href = body.url
      return
    }
    setErrors(body.fieldErrors ?? {})
    setMessage(body.error ?? 'Could not reach the server. Please try again.')
    setBusy(false)
  }

  if (!free.length) return <div>This place is taken at the moment. Please choose another one on the Advertising page.</div>
  return (
    <form onSubmit={onSubmit} noValidate>
      <FormMessage message={message} />
      {slots.length > 1 ? (
        <Field id="adc-slot" label="Page" required error={errors.slot}>
          <select {...input('slot')}>
            {slots.map((s) => (
              <option key={s.value} value={s.value} disabled={s.taken}>
                {s.label}
                {s.taken ? ' — booked' : ''}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="slot" value={chosen} />
      )}
      <Field id="adc-advertiser" label="Advertiser" required error={errors.advertiser} hint="Your business or brand name">
        <input {...input('advertiser', { autoComplete: 'organization', maxLength: 120 })} />
      </Field>
      <Field id="adc-linkUrl" label="Where a click leads" required error={errors.linkUrl} hint="Your website or a page on it. You can change it later.">
        <input {...input('linkUrl', { type: 'url', inputMode: 'url', maxLength: 400, placeholder: 'https://' })} />
      </Field>
      <div className={`field${errors.consent ? ' invalid' : ''}`}>
        <label className="flex items-start gap-3" style={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
          <input type="checkbox" name="consent" value="yes" className="mt-1 h-5 w-5 shrink-0" style={{ width: 20, minHeight: 0, padding: 0 }} />
          <span>
            I agree that <strong>{price}</strong> is charged to my card <strong>every month</strong> for this place until I cancel. I can cancel any time in
            “Manage billing”; the banner then stays until the end of the month already paid. No refunds for a part of a month.
          </span>
        </label>
        <span className="field-error">{errors.consent}</span>
      </div>
      <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
        {busy ? 'Opening payment…' : `Continue to payment — ${price}`}
      </button>
      <div className="form-note mt-3">After paying you upload the banner picture; we check it and it goes live, usually within a day.</div>
    </form>
  )
}

export function AdForm({
  id,
  values,
  desktop,
  mobile,
  desktopSize,
  mobileSize,
  live,
}: {
  id: number
  values: Record<string, string>
  desktop: Photo[]
  mobile: Photo[]
  desktopSize: string
  mobileSize?: string | null
  live: boolean
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const desk = usePhotos('imageDesktop', desktop, 1, { raw: true })
  const mob = usePhotos('imageMobile', mobile, 1, { raw: true })
  const { input } = formInputs('ad', values, errors)
  const x2 = (size: string) => {
    const [w, h] = size.split('x').map(Number)
    return `${w * 2}×${h * 2}`
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    desk.appendTo(fd)
    if (mobileSize) mob.appendTo(fd)
    if (!desk.count) {
      setErrors({ imageDesktop: 'Add the banner picture' })
      return
    }
    setState('sending')
    setMessage(null)
    const res = await fetch(`/api/account/ads/${id}`, { method: 'POST', body: fd, credentials: 'include' }).catch(() => null)
    const body = ((await res?.json().catch(() => ({}))) ?? {}) as Body
    if (!res?.ok) {
      setErrors(body.fieldErrors ?? {})
      setMessage(body.error ?? 'Could not reach the server. Please try again.')
      setState('idle')
      return
    }
    setMessage(body.message ?? 'Sent for review.')
    setState('done')
    router.refresh()
  }

  if (state === 'done') {
    return (
      <div className="success-panel" role="status">
        <div className="success-icon" aria-hidden="true">
          &#9989;
        </div>
        <h3>Thank you!</h3>
        <div>{message}</div>
        <div className="mt-4">
          <Link href="/account/ads" className="btn">
            My ads
          </Link>
        </div>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} noValidate>
      <FormMessage message={message} />
      <Field id="ad-advertiser" label="Advertiser" required error={errors.advertiser}>
        <input {...input('advertiser', { maxLength: 120 })} />
      </Field>
      <Field id="ad-linkUrl" label="Where a click leads" required error={errors.linkUrl}>
        <input {...input('linkUrl', { type: 'url', inputMode: 'url', maxLength: 400 })} />
      </Field>
      <Field
        id="ad-imageDesktop"
        label={`Banner picture — ${desktopSize.replace('x', '×')}`}
        required
        error={errors.imageDesktop ?? desk.problem ?? undefined}
        hint={`Exactly ${desktopSize.replace('x', '×')} px, or ${x2(desktopSize)} for sharp screens (best). JPEG, PNG or WebP.`}
      >
        <PhotoPicker id="ad-imageDesktop" photos={desk} label="Add the picture" whole />
      </Field>
      {mobileSize ? (
        <Field
          id="ad-imageMobile"
          label={`Phone version — ${mobileSize.replace('x', '×')}`}
          required
          error={errors.imageMobile ?? mob.problem ?? undefined}
          hint={`On phones this place is ${mobileSize.replace('x', '×')}: exactly that, or ${x2(mobileSize)}.`}
        >
          <PhotoPicker id="ad-imageMobile" photos={mob} label="Add the phone picture" whole />
        </Field>
      ) : null}
      <div className="form-note mb-4">
        {live
          ? 'Your banner is live. Saving changes sends it for review again, and it is hidden until we approve it (usually within a day).'
          : 'We check every banner before it goes live, usually within a day.'}
      </div>
      <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Uploading…' : 'Send for review'}
      </button>
    </form>
  )
}
