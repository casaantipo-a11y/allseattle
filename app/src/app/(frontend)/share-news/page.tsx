import type { Metadata } from 'next'

import { SubmissionForm } from '@/components/SubmissionForm'

export const metadata: Metadata = {
  title: 'Share the news',
  description: 'Seen something happening in Seattle? Send AllSeattle a news tip with photos.',
  alternates: { canonical: '/share-news' },
}

// Share the news (spec §8): lands in Submissions as news_tip; the photos go
// to Media, the first one to Telegram.
export default function ShareNewsPage() {
  return (
    <main id="content">
      <section className="section">
        <div className="container">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
            <div>
              <div className="section-head">
                <div>
                  <span className="eyebrow">Seattle news</span>
                  <h1>Share the news</h1>
                </div>
              </div>
              <p className="max-w-[60ch] text-lg">
                Seen something happening around Seattle — a new opening, a road closure, a neighborhood story? Tell us. Our
                editors read every tip before anything is published.
              </p>
              <ul className="mt-6 grid max-w-[60ch] list-none gap-3 p-0">
                {['Up to 5 photos, 10 MB each', 'We never publish your contact details', 'We may get in touch to check the facts'].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="font-bold text-brand-red" aria-hidden="true">
                      &#10003;
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-brand-line bg-white p-5 sm:p-8">
              <SubmissionForm
                form="news-tip"
                submitLabel="Send the tip"
                turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
                fields={[
                  { name: 'message', label: 'What happened?', type: 'textarea', required: true, placeholder: 'Where, when, what you saw…' },
                  { name: 'location', label: 'Where', placeholder: 'Neighborhood or address' },
                  { name: 'photos', label: 'Photos', type: 'photos', hint: 'Optional. JPEG, PNG or WebP.' },
                  { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
                  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: 'Email or phone — one is enough.' },
                  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
