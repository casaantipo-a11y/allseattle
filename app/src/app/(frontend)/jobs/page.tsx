import type { Metadata } from 'next'

import { AdSlot } from '@/components/AdSlot'
import { JobsBoard } from '@/components/jobs/JobsBoard'
import { toJobItem } from '@/lib/jobs'
import { getJobs } from '@/lib/queries-phase3'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Jobs in Seattle',
  description: 'Job openings from Seattle businesses: hospitality, tech, healthcare, retail, trades and more.',
  alternates: { canonical: '/jobs' },
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function JobsPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').slice(0, 100)
  const jobs = (await getJobs()).map(toJobItem)
  return (
    <main id="content" data-page="jobs">
      <section className="section">
        <div className="container">
          <AdSlot code="JOBS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <JobsBoard key={q} jobs={jobs} initialQuery={q} />
          {/* B2 under the main content ("other sections" scheme, 12.10.2026). */}
          <AdSlot code="JOBS_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-under" />
        </div>
      </section>
    </main>
  )
}
