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

export function usePhotos(field: string, initial: Photo[], max: number) {
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
    const shrunk = await Promise.all(picked.map(shrink))
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

/** The previews with "Remove" and the "Add photos" button. `id` is what the field's label points at. */
export function PhotoPicker({ id, photos, label = 'Add photos', errorId }: { id: string; photos: PhotoState; label?: string; errorId?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const items = [...photos.kept.map((p) => ({ key: `k${p.id}`, url: p.url, remove: () => photos.removeKept(p.id) })), ...photos.added.map((a) => ({ key: a.url, url: a.url, remove: () => photos.removeAdded(a.url) }))]
  return (
    <>
      {items.length ? (
        // the margin sits on a wrapper: base.css resets ul margins outside any layer
        <div className="mb-3">
          <ul className={`list-none p-0 ${photos.max === 1 ? 'max-w-[200px]' : 'grid grid-cols-3 gap-2 sm:grid-cols-5'}`}>
            {items.map((it) => (
              <li key={it.key}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                <button type="button" className="btn btn-outline btn-sm mt-1 w-full" onClick={it.remove}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {photos.count < photos.max ? (
        <div className="mb-2">
          {/* The native picker reads "Choose files" in the visitor's OS language;
              an own button keeps the page in English. */}
          <button type="button" id={id} className="btn btn-outline" aria-describedby={errorId} onClick={() => input.current?.click()}>
            {label}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={photos.max > 1}
            tabIndex={-1}
            style={{ display: 'none' }}
            onChange={async (e) => {
              await photos.add(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      ) : null}
    </>
  )
}
