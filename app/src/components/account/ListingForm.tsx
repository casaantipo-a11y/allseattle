'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

// The "new / edit listing" form of the account (stage 3, step 2), in the site's
// form style (.field / .field-error). It posts multipart to /api/account/listings
// (new) or /api/account/listings/:kind/:id (edit); the server validates it all
// again (lib/listings.ts). Photos are scaled down in the browser first — Vercel
// takes at most 4.5 MB per request, and the server makes its own WebP sizes anyway.

type Option = { value: string; label: string }
type Make = { id: number; name: string; models: string[] }
type Photo = { id: number; url: string }

const MAX_PHOTOS = 10
const PHOTO_EDGE = 1600
const PHOTO_QUALITY = 0.82
const BODY_LIMIT = 4.2 * 1024 * 1024

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

/** A photo scaled to fit PHOTO_EDGE, as JPEG; the original when the browser can't decode it. */
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, PHOTO_EDGE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * k)
    canvas.height = Math.round(bmp.height * k)
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', PHOTO_QUALITY))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

function Field({
  name,
  label,
  required,
  error,
  hint,
  children,
  wide,
}: {
  name: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`field${error ? ' invalid' : ''}${wide ? ' sm:col-span-2' : ''}`}>
      <label htmlFor={`lf-${name}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <span className="form-note">{hint}</span> : null}
      <span id={`lf-${name}-err`} className="field-error">
        {error}
      </span>
    </div>
  )
}

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
  const [kept, setKept] = useState<Photo[]>(initialPhotos)
  const [added, setAdded] = useState<{ file: File; url: string }[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const models = makes.find((m) => String(m.id) === makeId)?.models ?? []

  // Object URLs of the new photos' previews are freed when they leave the form.
  const addedRef = useRef(added)
  addedRef.current = added
  useEffect(() => () => addedRef.current.forEach((a) => URL.revokeObjectURL(a.url)), [])

  const inputProps = (name: string, extra: Record<string, unknown> = {}) => ({
    id: `lf-${name}`,
    name,
    defaultValue: values[name] ?? '',
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `lf-${name}-err` : undefined,
    ...extra,
  })
  const select = (name: string, options: Option[], placeholder?: string, extra: Record<string, unknown> = {}) => (
    <select {...inputProps(name, extra)}>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  )

  async function addFiles(list: FileList | null) {
    if (!list?.length) return
    const room = MAX_PHOTOS - kept.length - added.length
    const picked = [...list].filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type)).slice(0, Math.max(0, room))
    if (picked.length < list.length) {
      setErrors((e) => ({ ...e, photos: `JPEG, PNG or WebP only, up to ${MAX_PHOTOS} photos in all` }))
    } else setErrors(({ photos: _drop, ...rest }) => rest)
    const shrunk = await Promise.all(picked.map(shrink))
    setAdded((a) => [...a, ...shrunk.map((file) => ({ file, url: URL.createObjectURL(file) }))])
    if (fileInput.current) fileInput.current.value = ''
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.delete('photos-picker')
    fd.set('kind', kind)
    if (kind === 'car') {
      fd.delete('keepPhotos')
      kept.forEach((p) => fd.append('keepPhotos', String(p.id)))
      added.forEach((a) => fd.append('photos', a.file, a.file.name))
    }
    const need = kind === 'car' ? ['make', 'model', 'year', 'price', 'mileage', 'transmission', 'fuelType', 'bodyType', 'sellerName', 'sellerPhone'] : ['title', 'companyName', 'category', 'employmentType', 'howToApply']
    const missing: Record<string, string> = {}
    for (const n of need) if (!String(fd.get(n) ?? '').trim()) missing[n] = 'Required'
    if (kind === 'car' && kept.length + added.length === 0) missing.photos = 'Add at least one photo'
    const size = added.reduce((s, a) => s + a.file.size, 0)
    if (size > BODY_LIMIT) missing.photos = 'The photos are too large together — remove one or two'
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
        <p className="mt-4">
          <Link href="/account/listings" className="btn">
            My listings
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {message ? (
        <p role="alert" className="mb-4 rounded-lg border border-[#c53030] bg-[#fdecec] px-4 py-3 text-sm text-[#c53030]">
          {message}
        </p>
      ) : null}
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
          <Field name="photos" label={`Photos (up to ${MAX_PHOTOS})`} required error={errors.photos} wide hint="The first photo is the cover. JPEG, PNG or WebP.">
            {kept.length + added.length ? (
              <ul className="mb-3 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-5">
                {kept.map((p) => (
                  <li key={`k${p.id}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                    <button type="button" className="btn btn-outline btn-sm mt-1 w-full" onClick={() => setKept((k) => k.filter((x) => x.id !== p.id))}>
                      Remove
                    </button>
                  </li>
                ))}
                {added.map((a) => (
                  <li key={a.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm mt-1 w-full"
                      onClick={() => {
                        URL.revokeObjectURL(a.url)
                        setAdded((list) => list.filter((x) => x.url !== a.url))
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {kept.length + added.length < MAX_PHOTOS ? (
              <div className="mb-2">
                {/* The native picker reads "Choose files" in the visitor's OS language;
                    an own button keeps the page in English. */}
                <button
                  type="button"
                  id="lf-photos"
                  className="btn btn-outline"
                  aria-describedby={errors.photos ? 'lf-photos-err' : undefined}
                  onClick={() => fileInput.current?.click()}
                >
                  Add photos
                </button>
                <input
                  ref={fileInput}
                  name="photos-picker"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  tabIndex={-1}
                  style={{ display: 'none' }}
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>
            ) : null}
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

      <p className="form-note mb-4">The team checks every listing before it goes live, usually within a day. It stays up for 30 days and can be renewed.</p>
      <button type="submit" className="btn btn-lg btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : id ? 'Save and send for review' : 'Send for review'}
      </button>
    </form>
  )
}
