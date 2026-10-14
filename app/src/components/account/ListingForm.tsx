'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Field as BaseField, FormMessage, formInputs, type Option } from './fields'
import { BODY_LIMIT, PhotoPicker, usePhotos, type Photo } from './photos'

// The "new / edit listing" form of the account (stage 3, step 2), in the site's
// form style (.field / .field-error). It posts multipart to /api/account/listings
// (new) or /api/account/listings/:kind/:id (edit); the server validates it all
// again (lib/listings.ts).

type Make = { id: number; name: string; models: string[] }

const MAX_PHOTOS = 10

const o = (values: string[]): Option[] => values.map((v) => ({ value: v, label: v }))
const TRANSMISSIONS = o(['Automatic', 'CVT Automatic', 'Manual'])
const FUELS = o(['Gasoline', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'])
const DRIVETRAINS = o(['FWD', 'RWD', 'AWD', '4WD'])
const BODIES: Option[] = ['sedan', 'suv', 'truck', 'hatchback', 'coupe', 'convertible', 'wagon', 'van'].map((v) => ({
  value: v,
  label: v === 'suv' ? 'SUV' : v[0].toUpperCase() + v.slice(1),
}))
const EMPLOYMENT: Option[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
]
const WORK_MODES: Option[] = [
  { value: 'on-site', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]
const PERIODS: Option[] = [
  { value: 'hour', label: 'per hour' },
  { value: 'year', label: 'per year' },
]

const Field = (props: Omit<Parameters<typeof BaseField>[0], 'id'> & { name: string }) => <BaseField id={`lf-${props.name}`} {...props} />

export function ListingForm({
  kind,
  id,
  values = {},
  photos: initialPhotos = [],
  makes = [],
  categories = [],
}: {
  kind: 'car' | 'job'
  id?: number
  values?: Record<string, string>
  photos?: Photo[]
  makes?: Make[]
  categories?: Option[]
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [makeId, setMakeId] = useState(values.make ?? '')
  const photos = usePhotos('photos', initialPhotos, MAX_PHOTOS)
  const models = makes.find((m) => String(m.id) === makeId)?.models ?? []

  const { input: inputProps, select } = formInputs('lf', values, errors)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('kind', kind)
    if (kind === 'car') photos.appendTo(fd)
    const need = kind === 'car' ? ['make', 'model', 'year', 'price', 'mileage', 'transmission', 'fuelType', 'bodyType', 'sellerName', 'sellerPhone'] : ['title', 'companyName', 'category', 'employmentType', 'howToApply']
    const missing: Record<string, string> = {}
    for (const n of need) if (!String(fd.get(n) ?? '').trim()) missing[n] = 'Required'
    if (kind === 'car' && photos.count === 0) missing.photos = 'Add at least one photo'
    if (photos.bytes > BODY_LIMIT) missing.photos = 'The photos are too large together — remove one or two'
    setErrors(missing)
    if (Object.keys(missing).length) {
      setMessage('Please check the highlighted fields.')
      return
    }
    setState('sending')
    setMessage(null)
    try {
      const res = await fetch(id ? `/api/account/listings/${kind}/${id}` : '/api/account/listings', { method: 'POST', body: fd, credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string; fieldErrors?: Record<string, string> }
      if (!res.ok) {
        setErrors(body.fieldErrors ?? {})
        setMessage(res.status === 413 ? 'The photos are too large together — remove one or two.' : (body.error ?? 'Something went wrong. Please try again.'))
        setState('idle')
        return
      }
      setMessage(body.message ?? 'Sent for review.')
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
          <Link href="/account/listings" className="btn">
            My listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormMessage message={message} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="lf-hp">Fax</label>
        <input id="lf-hp" type="text" name="company_fax" tabIndex={-1} autoComplete="off" />
      </div>

      {kind === 'car' ? (
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field name="make" label="Make" required error={errors.make}>
            {select(
              'make',
              makes.map((m) => ({ value: String(m.id), label: m.name })),
              'Choose a make',
              { value: makeId, defaultValue: undefined, onChange: (e: { target: { value: string } }) => setMakeId(e.target.value) },
            )}
          </Field>
          <Field name="model" label="Model" required error={errors.model}>
            {models.length ? (
              // keyed by make, so switching the make resets the choice
              <select key={makeId} {...inputProps('model', { defaultValue: makeId === values.make ? values.model : '' })}>
                <option value="">Choose a model</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input key={makeId} {...inputProps('model', { maxLength: 60, disabled: !makeId, placeholder: makeId ? '' : 'Choose a make first' })} />
            )}
          </Field>
          <Field name="year" label="Year" required error={errors.year}>
            <input {...inputProps('year', { inputMode: 'numeric', maxLength: 4 })} />
          </Field>
          <Field name="price" label="Price, $" required error={errors.price}>
            <input {...inputProps('price', { inputMode: 'numeric', maxLength: 9 })} />
          </Field>
          <Field name="mileage" label="Mileage, miles" required error={errors.mileage}>
            <input {...inputProps('mileage', { inputMode: 'numeric', maxLength: 9 })} />
          </Field>
          <Field name="bodyType" label="Body type" required error={errors.bodyType}>
            {select('bodyType', BODIES, 'Choose')}
          </Field>
          <Field name="transmission" label="Transmission" required error={errors.transmission}>
            {select('transmission', TRANSMISSIONS, 'Choose')}
          </Field>
          <Field name="fuelType" label="Fuel" required error={errors.fuelType}>
            {select('fuelType', FUELS, 'Choose')}
          </Field>
          <Field name="drivetrain" label="Drivetrain" error={errors.drivetrain}>
            {select('drivetrain', DRIVETRAINS, 'Not specified')}
          </Field>
          <Field name="engine" label="Engine" error={errors.engine} hint="For example 2.5L 4-cyl">
            <input {...inputProps('engine', { maxLength: 60 })} />
          </Field>
          <Field name="exteriorColor" label="Exterior color" error={errors.exteriorColor}>
            <input {...inputProps('exteriorColor', { maxLength: 40 })} />
          </Field>
          <Field name="vin" label="VIN" error={errors.vin}>
            <input {...inputProps('vin', { maxLength: 17, autoCapitalize: 'characters' })} />
          </Field>
          <Field name="description" label="Description" error={errors.description} wide>
            <textarea {...inputProps('description', { rows: 6, maxLength: 3000 })} />
          </Field>
          <Field name="photos" label={`Photos (up to ${MAX_PHOTOS})`} required error={errors.photos ?? photos.problem ?? undefined} wide hint="The first photo is the cover. JPEG, PNG or WebP.">
            <PhotoPicker id="lf-photos" photos={photos} errorId={errors.photos ? 'lf-photos-err' : undefined} />
          </Field>
          <Field name="sellerName" label="Your name" required error={errors.sellerName}>
            <input {...inputProps('sellerName', { autoComplete: 'name', maxLength: 80 })} />
          </Field>
          <Field name="sellerPhone" label="Phone for buyers" required error={errors.sellerPhone}>
            <input {...inputProps('sellerPhone', { type: 'tel', autoComplete: 'tel', maxLength: 40 })} />
          </Field>
        </div>
      ) : (
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field name="title" label="Job title" required error={errors.title} wide>
            <input {...inputProps('title', { maxLength: 120 })} />
          </Field>
          <Field name="companyName" label="Company" required error={errors.companyName}>
            <input {...inputProps('companyName', { autoComplete: 'organization', maxLength: 120 })} />
          </Field>
          <Field name="category" label="Category" required error={errors.category}>
            {select('category', categories, 'Choose a category')}
          </Field>
          <Field name="employmentType" label="Type" required error={errors.employmentType}>
            {select('employmentType', EMPLOYMENT, 'Choose')}
          </Field>
          <Field name="workMode" label="Work mode" error={errors.workMode}>
            {select('workMode', WORK_MODES)}
          </Field>
          <Field name="salaryMin" label="Pay from, $" error={errors.salaryMin}>
            <input {...inputProps('salaryMin', { inputMode: 'numeric', maxLength: 9 })} />
          </Field>
          <Field name="salaryMax" label="Pay to, $" error={errors.salaryMax}>
            <input {...inputProps('salaryMax', { inputMode: 'numeric', maxLength: 9 })} />
          </Field>
          <Field name="salaryPeriod" label="Pay period" error={errors.salaryPeriod}>
            {select('salaryPeriod', PERIODS)}
          </Field>
          <Field name="location" label="Location" error={errors.location} hint="Neighborhood or address">
            <input {...inputProps('location', { maxLength: 120 })} />
          </Field>
          <Field name="summary" label="Short summary" error={errors.summary} wide hint="One or two lines for the job list">
            <textarea {...inputProps('summary', { rows: 2, maxLength: 300 })} />
          </Field>
          <Field name="description" label="Description" error={errors.description} wide hint="Duties, requirements, what you offer">
            <textarea {...inputProps('description', { rows: 8, maxLength: 6000 })} />
          </Field>
          <Field name="howToApply" label="How to apply" required error={errors.howToApply} wide hint="An email, a phone or a link">
            <textarea {...inputProps('howToApply', { rows: 2, maxLength: 500 })} />
          </Field>
        </div>
      )}

      <div className="form-note mb-4">The team checks every listing before it goes live, usually within a day. It stays up for 30 days and can be renewed.</div>
      <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : id ? 'Save and send for review' : 'Send for review'}
      </button>
    </form>
  )
}
