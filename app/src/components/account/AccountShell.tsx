import type { ReactNode } from 'react'

// The frame of the account pages: the site's section head and a narrow card,
// like /add-business.
// `middle`: on a short page the block stands midway between the header and the footer
// instead of under the header with the free space below it (.account-middle, business.css).
// `roomy`: 640px instead of 560, for a heading that needs one line ("Choose a new password",
// client, 17.10.2026 — at 48px it was 557px wide against 560 and wrapped).
export function AccountShell({ eyebrow = 'Your account', title, intro, children, wide = false, roomy = false, middle = false }: { eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode; wide?: boolean; roomy?: boolean; middle?: boolean }) {
  return (
    <main id="content" data-page="account" className={middle ? 'account-middle' : undefined}>
      {/* section--footer-tight: 16px to the footer, as on Services, Jobs and the rest (client). */}
      <section className="section section--footer-tight">
        {/* The width limit sits on an inner block: the prototype's unlayered .container
            max-width would beat a Tailwind utility on the container itself. */}
        <div className="container">
          <div className={`mx-auto ${wide ? 'max-w-[960px]' : roomy ? 'max-w-[640px]' : 'max-w-[560px]'}`}>
          <div className="section-head">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
          </div>
          {/* Midway between the heading's letters and the card (client): .account-intro in business.css. */}
          {intro ? <div className="account-intro text-brand-slate">{intro}</div> : null}
          {/* Top padding 24 (16 on phones), bottom 16 (12), sides 32 (20): the card started and
              ended on too much white (client, 16.10.2026). */}
          <div className="rounded-xl border border-brand-line bg-white px-5 pb-3 pt-4 sm:px-8 sm:pb-4 sm:pt-6">{children}</div>
          </div>
        </div>
      </section>
    </main>
  )
}
