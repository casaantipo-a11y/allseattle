import type { ReactNode } from 'react'

// The frame of the account pages: the site's section head and a narrow card,
// like /add-business.
export function AccountShell({ eyebrow = 'Your account', title, intro, children, wide = false }: { eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <main id="content" data-page="account">
      <section className="section">
        {/* The width limit sits on an inner block: the prototype's unlayered .container
            max-width would beat a Tailwind utility on the container itself. */}
        <div className="container">
          <div className={`mx-auto ${wide ? 'max-w-[960px]' : 'max-w-[560px]'}`}>
          <div className="section-head">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
          </div>
          {intro ? <div className="mb-6 text-brand-slate">{intro}</div> : null}
          <div className="rounded-xl border border-brand-line bg-white p-5 sm:p-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  )
}
