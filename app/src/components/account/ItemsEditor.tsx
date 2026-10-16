'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Field, FormMessage, formInputs } from './fields'
import { PhotoPicker, usePhotos, type Photo } from './photos'

// Promotions or products of a business in the account (stage 3, step 3): the
// list with Edit / Delete and a form that opens in place. They go live at once;
// the package decides whether they're allowed and how many (the collection hooks).

type Kind = 'promotion' | 'product'
export type Item = { id: number; title: string; meta: string; values: Record<string, string>; image: Photo[] }

const NOUN: Record<Kind, string> = { promotion: 'promotion', product: 'product' }

function ItemForm({ bizId, kind, item, onDone }: { bizId: number; kind: Kind; item?: Item; onDone: () => void }) {
  const router = useRouter()
  const prefix = `${kind}-${item?.id ?? 'new'}`
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const image = usePhotos('image', item?.image ?? [], 1)
  const { input } = formInputs(prefix, item?.values ?? {}, errors)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('kind', kind)
    image.appendTo(fd)
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(item ? `/api/account/business/${bizId}/items/${kind}/${item.id}` : `/api/account/business/${bizId}/items`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> }
      if (!res.ok) {
        setErrors(body.fieldErrors ?? {})
        setMessage(body.error ?? 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      router.refresh()
      onDone()
    } catch {
      setMessage('Could not reach the server. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border border-brand-line p-4 sm:p-6">
      <FormMessage message={message} />
      <div className="grid gap-x-4 sm:grid-cols-2">
        {kind === 'promotion' ? (
          <>
            <Field id={`${prefix}-title`} label="Title" required error={errors.title} wide>
              <input {...input('title', { maxLength: 120 })} />
            </Field>
            <Field id={`${prefix}-validFrom`} label="Starts" required error={errors.validFrom}>
              <input {...input('validFrom', { type: 'date' })} />
            </Field>
            <Field id={`${prefix}-validUntil`} label="Ends" required error={errors.validUntil}>
              <input {...input('validUntil', { type: 'date' })} />
            </Field>
          </>
        ) : (
          <>
            <Field id={`${prefix}-name`} label="Name" required error={errors.name}>
              <input {...input('name', { maxLength: 120 })} />
            </Field>
            <Field id={`${prefix}-price`} label="Price, $" error={errors.price} hint="Empty = “Ask for price”">
              <input {...input('price', { inputMode: 'decimal', maxLength: 12 })} />
            </Field>
          </>
        )}
        <Field id={`${prefix}-description`} label="Description" error={errors.description} wide>
          <textarea {...input('description', { rows: 3, maxLength: 1000 })} />
        </Field>
        <Field id={`${prefix}-image`} label="Picture" error={errors.image ?? image.problem ?? undefined} wide>
          <PhotoPicker id={`${prefix}-image`} photos={image} label="Add a picture" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onDone} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function ItemsEditor({ bizId, kind, items, canAdd, note }: { bizId: number; kind: Kind; items: Item[]; canAdd: boolean; note?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState<number | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(item: Item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    setError(null)
    const res = await fetch(`/api/account/business/${bizId}/items/${kind}/${item.id}`, { method: 'DELETE', credentials: 'include' }).catch(() => null)
    if (!res?.ok) setError('Could not delete it. Please try again.')
    else router.refresh()
  }

  return (
    <div>
      {note ? <div className="mb-4 text-brand-slate">{note}</div> : null}
      {error ? (
        <div role="alert" className="mb-4 text-sm text-[#c53030]">
          {error}
        </div>
      ) : null}
      {open === 'new' ? (
        <div className="mb-3">
          <ItemForm bizId={bizId} kind={kind} onDone={() => setOpen(null)} />
        </div>
      ) : canAdd ? (
        <div className="items-add mb-3">
          <button type="button" className="btn" onClick={() => setOpen('new')}>
            Add a {NOUN[kind]}
          </button>
        </div>
      ) : null}
      {items.length === 0 ? (
        <div className="m-0 text-brand-slate">No {NOUN[kind]}s yet.</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((it) => (
            <li key={it.id} className="border-t border-brand-line py-3 first:border-t-0 first:pt-0">
              {open === it.id ? (
                <ItemForm bizId={bizId} kind={kind} item={it} onDone={() => setOpen(null)} />
              ) : (
                <div className="flex gap-4">
                  {it.image[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image[0].url} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h3>{it.title}</h3>
                    {it.meta ? <div className="m-0 mt-1 text-sm text-brand-slate">{it.meta}</div> : null}
                    <div className="account-actions mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(it.id)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(it)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
