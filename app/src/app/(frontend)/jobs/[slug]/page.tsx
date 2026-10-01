import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { feedDate } from '@/lib/format'
import { EMPLOYMENT_LABEL, companyOf, lexicalText, salaryText } from '@/lib/jobs'
import { findJobByOldSlug, getJob, getJobs } from '@/lib/queries-phase3'
import { absoluteUrl } from '@/lib/site'
import type { JobCategory } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getJobs()).filter((j) => j.slug).map((j) => ({ slug: j.slug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob((await params).slug)
  if (!job) return { title: 'Not found', robots: { index: false } }
  const c = companyOf(job)
  const title = `${job.title} at ${c.name}`
  const description = [salaryText(job), EMPLOYMENT_LABEL[job.employmentType], job.location, job.summary].filter(Boolean).join(' · ').slice(0, 300)
  return { title, description, alternates: { canonical: `/jobs/${job.slug}` }, openGraph: { title, description, url: `/jobs/${job.slug}` } }
}

// Turns "how to apply" into links where it's an email, a phone or a URL.
function HowToApply({ text }: { text: string }) {
  const parts = text.split(/(\S+@\S+\.\w+|https?:\/\/\S+|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g)
  return (
    <p className="whitespace-pre-line">
      {parts.map((p, i) => {
        if (/^\S+@\S+\.\w+$/.test(p)) return <a key={i} href={`mailto:${p}`} className="text-brand-navy underline">{p}</a>
        if (/^https?:\/\//.test(p)) return <a key={i} href={p} rel="noopener nofollow" target="_blank" className="text-brand-navy underline">{p}</a>
        if (/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(p)) return <a key={i} href={`tel:+1${p.replace(/\D/g, '')}`} className="text-brand-navy underline">{p}</a>
        return p
      })}
    </p>
  )
}

const SCHEMA_TYPE: Record<string, string> = { 'full-time': 'FULL_TIME', 'part-time': 'PART_TIME', contract: 'CONTRACTOR', temporary: 'TEMPORARY' }

export default async function JobPage({ params }: Props) {
  const { slug } = await params
  const job = await getJob(slug)
  if (!job) {
    const moved = await findJobByOldSlug(slug)
    if (moved?.slug) permanentRedirect(`/jobs/${moved.slug}`)
    notFound()
  }
  const c = companyOf(job)
  const salary = salaryText(job)
  const category = typeof job.category === 'object' ? (job.category as JobCategory).name : ''
  const description = lexicalText(job.description) || job.summary || job.title

  return (
    <main id="content" data-page="jobs">
      <section className="section">
        <div className="container">
          <AdSlot code="JOBS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <p>
            <Link href="/jobs" className="muted text-sm underline">
              &larr; All jobs
            </Link>
          </p>
          <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                {job.isUrgent ? <span className="job-badge job-badge--urgent">Urgent</span> : null}
                {job.isFeatured ? <span className="job-badge job-badge--featured">Featured</span> : null}
              </div>
              <h1 className="mb-2">{job.title}</h1>
              {salary ? <p className="mb-2 font-display text-xl font-extrabold text-brand-red">{salary}</p> : null}
              <p className="mb-6 text-brand-slate">
                {c.href ? (
                  <Link href={c.href} className="font-bold text-brand-navy underline">
                    {c.name}
                  </Link>
                ) : (
                  <b className="text-brand-navy">{c.name}</b>
                )}
                {' · '}
                {EMPLOYMENT_LABEL[job.employmentType]}
                {category ? ` · ${category}` : ''}
                {job.location ? ` · ${job.location}` : ''}
                {' · Posted '}
                {feedDate(job.createdAt)}
              </p>
              {job.description ? <RichText data={job.description} /> : job.summary ? <p>{job.summary}</p> : null}
              <h2 className="mb-2 mt-8 text-xl">How to apply</h2>
              <HowToApply text={job.howToApply} />
            </article>
            <aside className="grid gap-[var(--grid-gap)]">
              <div className="widget">
                <div className="widget-head">About the job</div>
                <div className="widget-body">
                  <dl className="m-0 grid gap-2 text-sm">
                    {[
                      ['Employment', EMPLOYMENT_LABEL[job.employmentType]],
                      ['Work mode', job.workMode ? job.workMode.replace(/^\w/, (x) => x.toUpperCase()) : null],
                      ['Salary', salary],
                      ['Location', job.location],
                      ['Apply by', job.expiresAt ? new Date(job.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null],
                    ]
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k as string} className="flex justify-between gap-3">
                          <dt className="font-semibold text-brand-slate">{k}</dt>
                          <dd className="m-0 text-right">{v}</dd>
                        </div>
                      ))}
                  </dl>
                  {c.href ? (
                    <Link href={c.href} className="btn btn-outline btn-sm btn-block mt-4">
                      About {c.name}
                    </Link>
                  ) : null}
                </div>
              </div>
              <AdSlot code="JOBS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
            </aside>
          </div>
        </div>
      </section>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description,
          datePosted: job.createdAt,
          ...(job.expiresAt ? { validThrough: job.expiresAt } : {}),
          employmentType: SCHEMA_TYPE[job.employmentType] ?? 'OTHER',
          hiringOrganization: {
            '@type': 'Organization',
            name: c.name,
            ...(c.href ? { sameAs: absoluteUrl(c.href) } : {}),
          },
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              ...(job.location ? { streetAddress: job.location } : {}),
              addressLocality: 'Seattle',
              addressRegion: 'WA',
              addressCountry: 'US',
            },
          },
          ...(job.workMode === 'remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'USA' } } : {}),
          ...(job.salaryMin != null || job.salaryMax != null
            ? {
                baseSalary: {
                  '@type': 'MonetaryAmount',
                  currency: 'USD',
                  value: {
                    '@type': 'QuantitativeValue',
                    ...(job.salaryMin != null ? { minValue: job.salaryMin } : {}),
                    ...(job.salaryMax != null ? { maxValue: job.salaryMax } : {}),
                    unitText: job.salaryPeriod === 'year' ? 'YEAR' : 'HOUR',
                  },
                },
              }
            : {}),
          url: absoluteUrl(`/jobs/${job.slug}`),
        }}
      />
    </main>
  )
}
