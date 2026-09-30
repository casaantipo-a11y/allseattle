import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="content">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">404</span>
              <h1>Page not found</h1>
            </div>
          </div>
          <p className="muted">That page doesn&rsquo;t exist, or this section of AllSeattle isn&rsquo;t open yet.</p>
          <p>
            <Link href="/" className="btn">
              Back to the home page
            </Link>{' '}
            <Link href="/news" className="btn btn-outline">
              Latest news
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
