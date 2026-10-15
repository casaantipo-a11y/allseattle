'use client'

import { useEffect, useRef, useState } from 'react'

// Photo fields of the account forms (stage 3): the photos already saved, the
// new ones picked here, and the "Add photos" button. New photos are scaled down
// in the browser first — Vercel takes at most 4.5 MB per request, and the server
// makes its own WebP sizes anyway. The form sends `<field>Keep` (ids kept, in
// order) and `<field>` (new files); lib/cabinet.ts takePhotos reads them.

export type Photo = { id: number; url: string }
type Added = { file: File; url: string }

const PHOTO_EDGE = 1600
const PHOTO_QUALITY = 0.82
/** What one request may carry in photos, under Vercel's 4.5 MB with room for the text fields. */
export const BODY_LIMIT = 4.2 * 1024 * 1024

/** A photo scaled to fit PHOTO_EDGE, as JPEG; the original when the browser can't decode it. */
export async function shrink(file: File): Promise<File> {
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

/** `raw`: send the files as picked — banner pictures must keep their exact pixel size. */
export function usePhotos(field: string, initial: Photo[], max: number, { raw = false }: { raw?: boolean } = {}) {
  const [kept, setKept] = useState<Photo[]>(initial)
  const [added, setAdded] = useState<Added[]>([])
  const [problem, setProblem] = useState<string | null>(null)

  // Object URLs of the new photos' previews are freed when the form goes away.
  const addedRef = useRef(added)
  useEffect(() => {
    addedRef.current = added
  }, [added])
  useEffect(() => () => addedRef.current.forEach((a) => URL.revokeObjectURL(a.url)), [])

  async function add(list: FileList | null) {
    if (!list?.length) return
    const room = Math.max(0, max - kept.length - added.length)
    const picked = [...list].filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type)).slice(0, room)
    setProblem(picked.length < list.length ? (max === 1 ? 'One JPEG, PNG or WebP picture' : `JPEG, PNG or WebP only, up to ${max} in all`) : null)
    const shrunk = raw ? picked : await Promise.all(picked.map(shrink))
    setAdded((a) => [...a, ...shrunk.map((file) => ({ file, url: URL.createObjectURL(file) }))])
  }

  return {
    field,
    max,
    kept,
    added,
    problem,
    count: kept.length + added.length,
    bytes: added.reduce((n, a) => n + a.file.size, 0),
    add,
    removeKept: (id: number) => setKept((k) => k.filter((p) => p.id !== id)),
    removeAdded: (url: string) => {
      URL.revokeObjectURL(url)
      setAdded((list) => list.filter((a) => a.url !== url))
    },
    appendTo(fd: FormData) {
      fd.delete(field)
      fd.delete(`${field}Keep`)
      kept.forEach((p) => fd.append(`${field}Keep`, String(p.id)))
      added.forEach((a) => fd.append(field, a.file, a.file.name))
    },
  }
}

export type PhotoState = ReturnType<typeof usePhotos>

/** The previews with "Remove" and the "Add photos" picker. `id` is what the field's label points at. */
export function PhotoPicker({
  id,
  photos,
  label = 'Add photos',
  hint = 'JPEG, PNG or WebP',
  errorId,
  whole = false,
}: {
  id: string
  photos: PhotoState
  label?: string
  /** The small line under the picker's title. */
  hint?: string
  errorId?: string
  /** Show the picture whole, at its own proportions (a banner), not cropped to 4:3. */
  whole?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const items = [...photos.kept.map((p) => ({ key: `k${p.id}`, url: p.url, remove: () => photos.removeKept(p.id) })), ...photos.added.map((a) => ({ key: a.url, url: a.url, remove: () => photos.removeAdded(a.url) }))]
  const many = photos.max > 1
  return (
    <>
      {items.length ? (
        // the margin sits on a wrapper: base.css resets ul margins outside any layer
        <div className="mb-3">
          <ul className={`list-none p-0 ${whole ? 'max-w-[480px]' : many ? 'grid grid-cols-3 gap-2 sm:grid-cols-5' : 'max-w-[200px]'}`}>
            {items.map((it) => (
              <li key={it.key}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="" className={whole ? 'w-full rounded-lg' : 'aspect-[4/3] w-full rounded-lg object-cover'} />
                <button type="button" className="btn btn-outline btn-sm mt-1 w-full" onClick={it.remove}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {photos.count < photos.max ? (
        <>
          {/* The site's photo picker (.photo-picker-box, as on Share the news), not the native
              "Choose files", which speaks the visitor's OS language. Pictures can be dropped on it too. */}
          <button
            type="button"
            id={id}
            className="photo-picker-box"
            aria-describedby={errorId}
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              void photos.add(e.dataTransfer.files)
            }}
          >
            <span className="photo-picker-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
            <span className="photo-picker-text">
              <span className="photo-picker-title">{label}</span>
              <span className="photo-picker-hint">{many && photos.count ? `${hint} · ${photos.count} of ${photos.max}` : hint}</span>
            </span>
            <span className="photo-picker-btn" aria-hidden="true">
              {many ? 'Choose files' : 'Choose file'}
            </span>
          </button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={many}
            tabIndex={-1}
            style={{ display: 'none' }}
            onChange={async (e) => {
              await photos.add(e.target.files)
              e.target.value = ''
            }}
          />
        </>
      ) : null}
    </>
  )
}
