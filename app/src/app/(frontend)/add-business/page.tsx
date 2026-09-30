import type { Metadata } from 'next'
import Link from 'next/link'

import { SECTIONS } from '@/collections/BusinessCategories'
import { SubmissionForm } from '@/components/SubmissionForm'
import { getBusinessCategories, getPackages } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Add your business',
  description: 'Get your Seattle business listed on AllSeattle: the directory, the city map and a page of your own.',
  alternates: { canonical: '/add-business' },
}

// Business registration (spec §8): lands in Submissions as
// business_registration; a salesperson creates the listing from it.
export default async function AddBusinessPage() {
  const [categories, packages] = await Promise.all([getBusinessCategories(), getPackages()])
  const sectionLabel = Object.fromEntries(SECTIONS.map((s) => [s.value, s.label]))
  const options = [...categories]
    .sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
    .map((c) => ({ value: String(c.id), label: `${c.name} (${sectionLabel[c.section]})` }))

  return (
    <main id="content">
      <section className="section">
        <div className="container">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
            <div>
              <div className="section-head">
                <div>
                  <span className="eyebrow">Business directory</span>
                  <h1>Add your business</h1>
                </div>
              </div>
              <p className="max-w-[60ch] text-lg">
                If you&rsquo;re not on this website, you don&rsquo;t exist. Tell us about your business — we&rsquo;ll set up your
                listing and get in touch about the package.
              </p>
              <ul className="mt-6 grid max-w-[60ch] list-none gap-3 p-0">
                {[
                  'A page for your business: contacts, hours, photos, map',
                  'A place in the directory and on the city map',
                  'Promotions and products with Luxury and Premium',
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="font-bold text-brand-red" aria-hidden="true">
                      &#10003;
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6">
                <Link href="/advertise" className="text-brand-navy underline">
                  Compare packages
                </Link>
              </p>
            </div>

            <div className="rounded-xl border border-brand-line bg-white p-5 sm:p-8">
              <SubmissionForm
                form="business-registration"
                submitLabel="Send"
                turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
                fields={[
                  { name: 'businessName', label: 'Business name', required: true, autoComplete: 'organization' },
                  { name: 'category', label: 'Category', type: 'select', options },
                  { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
                  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: 'Email or phone — one is enough.' },
                  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
                  {
                    name: 'desiredPackage',
                    label: 'Package you’re interested in',
                    type: 'select',
                    options: packages.map((p) => ({ value: String(p.id), label: p.name })),
                  },
                  { name: 'message', label: 'Anything else?', type: 'textarea' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
