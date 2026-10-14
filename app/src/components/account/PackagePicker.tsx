'use client'

import { useState } from 'react'

// Choosing a package for a business in the account (stage 3, step 4): pick one,
// agree to the monthly charge, go to Stripe Checkout. Packages without a price
// are arranged with the team. "Manage billing" opens Stripe's portal.

export type PackageOption = { id: number; name: string; price: string; priceMonthly: number; features: string[]; current: boolean }

async function go(url: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string; fieldErrors?: Record<string, string> }
  if (res.ok && json.url) {
    window.location.href = json.url
    return null
  }
  return json.fieldErrors?.consent ?? json.error ?? 'Something went wrong. Please try again.'
}

export function PackagePicker({ businessId, packages }: { businessId: number; packages: PackageOption[] }) {
  const buyable = packages.filter((p) => p.priceMonthly > 0)
  const [chosen, setChosen] = useState<number | null>(buyable.find((p) => !p.current)?.id ?? null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pkg = packages.find((p) => p.id === chosen)

  async function pay() {
    if (!pkg) return
    if (!consent) {
      setError('Please confirm the monthly payment')
      return
    }
    setBusy(true)
    setError(null)
    const err = await go('/api/account/billing/checkout', { businessId, packageId: pkg.id, consent })
    if (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Package">
        {packages.map((p) => {
          const selectable = p.priceMonthly > 0
          const on = chosen === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!selectable}
              onClick={() => setChosen(p.id)}
              className={`rounded-xl border-2 bg-white p-5 text-left ${on ? 'border-brand-red' : 'border-brand-line'} ${selectable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="block font-display text-xl font-bold text-brand-navy">{p.name}</span>
              <span className="mt-1 block text-lg font-semibold text-brand-red">{p.price}</span>
              {p.current ? <span className="mt-1 block text-sm font-semibold text-[#2f855a]">Your package now</span> : null}
              {!selectable ? <span className="mt-1 block text-sm text-brand-slate">Arranged with our team</span> : null}
              {p.features.length ? (
                <span className="mt-3 block text-sm text-brand-slate">
                  {p.features.map((f) => (
                    <span key={f} className="block">
                      ✓ {f}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {pkg ? (
        <div className="mt-6">
          <label className={`flex items-start gap-3 ${error ? 'text-[#c53030]' : ''}`}>
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree that <strong>{pkg.price}</strong> is charged to my card <strong>every month</strong> for the {pkg.name} package until I cancel. I can
              cancel any time in “Manage billing”; the package then stays until the end of the month already paid. No refunds for a part of a month.
            </span>
          </label>
          {error ? (
            <div role="alert" className="mt-3 text-sm font-semibold text-[#c53030]">
              {error}
            </div>
          ) : null}
          <div className="mt-4">
            <button type="button" className="btn btn-lg" onClick={pay} disabled={busy}>
              {busy ? 'Opening payment…' : `Continue to payment — ${pkg.price}`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ManageBilling({ returnPath }: { returnPath: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div>
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError(null)
          const err = await go('/api/account/billing/portal', { returnPath })
          if (err) {
            setError(err)
            setBusy(false)
          }
        }}
      >
        {busy ? 'Opening…' : 'Manage billing'}
      </button>
      {error ? (
        <div role="alert" className="mt-3 text-sm font-semibold text-[#c53030]">
          {error}
        </div>
      ) : null}
    </div>
  )
}
