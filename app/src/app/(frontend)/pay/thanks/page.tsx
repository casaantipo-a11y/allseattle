import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false, follow: false } }

export default function PayThanksPage() {
  return (
    <main id="content">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Payment</span>
              <h1>Thank you</h1>
            </div>
          </div>
          <p>Thank you, your package is on. A receipt is on its way to your email.</p>
          <p>
            <Link href="/" className="btn">
              Back to the home page
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
