'use client'

import { useEffect, useRef, useState } from 'react'

import { SubmissionForm } from './SubmissionForm'
import { useModalFocus } from './useModalFocus'

// "Request a price" on a paid business page (counters block, 22.11.2026): the button opens the
// site's modal with a short form — name, email or phone, message — posted to
// /api/forms/price-request, which emails the business and notifies the team. The form is
// mounted only while the modal is open, so Turnstile loads on demand.
export function PriceRequest({ businessId, businessName, turnstileSiteKey }: { businessId: number; businessName: string; turnstileSiteKey?: string | null }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useModalFocus(open, box)

  useEffect(() => {
    if (!open) return
    document.body.classList.add('modal-open')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Request a price
      </button>
      {open ? (
        <div className="modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setOpen(false)}>
          <div ref={box} className="modal" role="dialog" aria-modal="true" aria-labelledby="price-request-title" tabIndex={-1}>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>
              &times;
            </button>
            <h2 id="price-request-title">Request a price from {businessName}</h2>
            <div className="muted mb-6">Tell them what you need. They will answer by email or phone.</div>
            <SubmissionForm
              form="price-request"
              submitLabel="Send request"
              turnstileSiteKey={turnstileSiteKey}
              fields={[
                { name: 'businessId', label: 'Business', type: 'hidden', defaultValue: String(businessId) },
                { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
                { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
                { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', hint: 'An email or a phone number — at least one.' },
                { name: 'message', label: 'What do you need a price for?', type: 'textarea', required: true },
              ]}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
