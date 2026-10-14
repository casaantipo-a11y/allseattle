'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

// Admin-only notes on site pages (client, 15.10.2026; collection site-notes). Pages are
// cached for everyone, so who is looking is found out here: only a user with the admin
// role (signed in to /admin) gets the "Notes" button and sees the notes of this page.
// Everyone else gets nothing — no button, no request for the notes.

type Note = { id: number; text: string; resolved?: boolean | null; createdAt: string; author?: { email?: string; name?: string | null } | number | null }

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })

export function AdminNotes() {
  const pathname = usePathname()
  const path = pathname.replace(/\/+$/, '') || '/'
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [showDone, setShowDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { user?: { roles?: string[] } } | null) => setIsAdmin(Boolean(b?.user?.roles?.includes('admin'))))
      .catch(() => {})
  }, [])

  // The notes of this page; `tick` reloads them after a change.
  useEffect(() => {
    if (!isAdmin) return
    const q = new URLSearchParams({ 'where[path][equals]': path, sort: '-createdAt', depth: '1', limit: '100' })
    fetch(`/api/site-notes?${q}`, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<{ docs: Note[] }>) : null))
      .then((b) => setNotes(b?.docs ?? []))
      .catch(() => {})
  }, [isAdmin, path, tick])

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true)
    setError(null)
    const r = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null)
    if (!r?.ok) setError('Could not save. Are you still signed in to /admin?')
    setTick((t) => t + 1)
    setBusy(false)
    return Boolean(r?.ok)
  }

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const text = String(new FormData(form).get('text') ?? '').trim()
    if (!text) return
    if (await call('/api/site-notes', 'POST', { path, text })) form.reset()
  }

  if (!isAdmin) return null
  const open_ = notes.filter((n) => !n.resolved)
  const done = notes.filter((n) => n.resolved)
  const shown = showDone ? notes : open_

  return (
    <div className="admin-notes fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 print:hidden">
      {open ? (
        <div className="w-[min(380px,calc(100vw-32px))] rounded-xl border border-brand-line bg-white p-4 text-sm shadow-[0_8px_32px_rgba(13,27,42,0.18)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-base font-bold text-brand-navy">Notes on this page</div>
              <div className="text-xs text-brand-slate">Only admins see these · {path}</div>
            </div>
            <button type="button" className="cursor-pointer border-0 bg-transparent p-1 text-xl leading-none text-brand-slate" aria-label="Close notes" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>
          <form onSubmit={add} className="mb-3">
            <label htmlFor="admin-note-text" className="sr-only">
              New note
            </label>
            <textarea
              id="admin-note-text"
              name="text"
              rows={3}
              maxLength={2000}
              placeholder="What to fix or check on this page…"
              className="w-full rounded-lg border border-brand-line p-2"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Link href="/admin/collections/site-notes" className="text-xs text-brand-navy underline">
                All notes
              </Link>
              <button type="submit" className="btn btn-sm" disabled={busy}>
                Add note
              </button>
            </div>
          </form>
          {error ? (
            <div role="alert" className="mb-2 text-xs text-[#c53030]">
              {error}
            </div>
          ) : null}
          <div className="max-h-[50vh] overflow-y-auto">
            {shown.length === 0 ? <div className="text-brand-slate">{open_.length ? '' : 'No open notes here.'}</div> : null}
            {shown.map((n) => (
              <div key={n.id} className={`border-t border-brand-line py-2 ${n.resolved ? 'opacity-60' : ''}`}>
                <div className="whitespace-pre-wrap text-brand-navy">{n.text}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-brand-slate">
                  <span>
                    {typeof n.author === 'object' && n.author ? n.author.name || n.author.email : 'admin'} · {when(n.createdAt)}
                  </span>
                  <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-brand-navy underline" disabled={busy} onClick={() => call(`/api/site-notes/${n.id}`, 'PATCH', { resolved: !n.resolved })}>
                    {n.resolved ? 'Reopen' : 'Done'}
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-brand-navy underline"
                    disabled={busy}
                    onClick={() => window.confirm('Delete this note?') && call(`/api/site-notes/${n.id}`, 'DELETE')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {done.length ? (
              <button type="button" className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-xs text-brand-navy underline" onClick={() => setShowDone((v) => !v)}>
                {showDone ? 'Hide done notes' : `Show done (${done.length})`}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <button type="button" className="btn btn-sm shadow-[0_4px_16px_rgba(13,27,42,0.25)]" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Notes{open_.length ? ` (${open_.length})` : ''}
      </button>
    </div>
  )
}
