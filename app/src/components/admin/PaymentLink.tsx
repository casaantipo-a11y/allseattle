'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

// "Send payment link" on a business (Package tab): pick a package, type the client's email,
// and AllSeattle mails them a Stripe Checkout link — no site account needed. Posts to
// /api/admin/payment-link (admin and sales only; the admin session cookie authorises it).
// What happens after the client pays is the usual webhook: package, expiry and status.

type Pkg = { id: number; name: string; priceMonthly: number }

const LIVE = ['active', 'canceling', 'past_due']
const muted = { color: 'var(--theme-elevation-500)' }
// Same look as the admin's own inputs.
const input = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  font: 'inherit',
  color: 'var(--theme-elevation-800)',
  background: 'var(--theme-input-bg)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s)',
}
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Los_Angeles' })

const rel = (v: unknown): string => (v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : v ? String(v) : '')

export function PaymentLink() {
  const { id } = useDocumentInfo()
  const currentPackage = rel(useFormFields(([fields]) => fields.package?.value))
  const bizEmail = (useFormFields(([fields]) => fields.email?.value) as string | undefined) ?? ''
  const status = useFormFields(([fields]) => fields.subscriptionStatus?.value) as string | undefined
  const savedTo = useFormFields(([fields]) => fields.paymentLinkSentTo?.value) as string | undefined
  const savedAt = useFormFields(([fields]) => fields.paymentLinkSentAt?.value) as string | undefined

  const [packages, setPackages] = useState<Pkg[]>([])
  const [packageId, setPackageId] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [sent, setSent] = useState<{ to: string; at: string } | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/packages?limit=100&depth=0&sort=order', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { docs: Pkg[] }) => alive && setPackages(d.docs.filter((p) => p.priceMonthly > 0)))
      .catch(() => alive && setMessage({ ok: false, text: 'Could not load the packages.' }))
    return () => {
      alive = false
    }
  }, [])

  // Defaults: the business's current package and its own email, until the user changes them.
  const chosen = packageId || (packages.some((p) => String(p.id) === currentPackage) ? currentPackage : '')
  const to = emailTouched ? email : bizEmail

  if (!id) return <p style={{ ...muted, marginBottom: 24 }}>Save the business first — the payment link can be sent once it exists.</p>
  if (status && LIVE.includes(status)) return <p style={{ ...muted, marginBottom: 24 }}>This business already has a subscription.</p>

  const lastTo = sent?.to ?? savedTo
  const lastAt = sent?.at ?? savedAt

  async function send() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/payment-link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: Number(id), packageId: Number(chosen), email: to.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; sentTo?: string; sentAt?: string }
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      setSent({ to: data.sentTo ?? to, at: data.sentAt ?? new Date().toISOString() })
      setMessage({ ok: true, text: data.message ?? 'Payment link sent.' })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not send the link.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 520, marginBottom: 24 }}>
      <div style={{ fontWeight: 600 }}>Send payment link</div>
      <label style={{ display: 'grid', gap: 4 }}>
        Package
        <select style={input} value={chosen} onChange={(e) => setPackageId(e.target.value)} disabled={busy}>
          <option value="">Choose a package…</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ${p.priceMonthly}/month
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'grid', gap: 4 }}>
        Client&rsquo;s email
        <input
          type="email"
          style={input}
          value={to}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailTouched(true)
          }}
          disabled={busy}
        />
      </label>
      <div>
        <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0, minHeight: 44, paddingInline: 24 }} disabled={busy || !chosen || !to.trim()} onClick={send}>
          {busy ? 'Sending…' : 'Send payment link'}
        </button>
      </div>
      {lastTo && lastAt ? <p style={{ ...muted, margin: 0 }}>Last sent to {lastTo} on {when(lastAt)}</p> : null}
      {message ? <p style={{ margin: 0, color: message.ok ? 'var(--theme-success-500)' : 'var(--theme-error-500)' }}>{message.text}</p> : null}
    </div>
  )
}
