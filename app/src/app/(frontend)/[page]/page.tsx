import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { RichText } from '@/components/RichText'
import { findPageByOldSlug, getPage, getPagesForSitemap } from '@/lib/queries'
import type { Page } from '@/payload-types'

export const revalidate = 3600

// Static pages from the Pages collection: /about, /advertise, /contact,
// /privacy, /terms — any published page answers at /{slug}. Explicit routes
// (/news, …) always win over this one.

type Props = { params: Promise<{ page: string }> }

export async function generateStaticParams() {
  return (await getPagesForSitemap()).filter((p) => p.slug).map((p) => ({ page: p.slug as string }))
}

type Meta = { title?: string | null; description?: string | null }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: 'Not found', robots: { index: false } }
  const meta = (page as unknown as { meta?: Meta }).meta ?? {}
  return {
    title: meta.title?.replace(/\s*\|\s*AllSeattle$/, '') || page.title,
    description: meta.description || page.intro || undefined,
    alternates: { canonical: `/${page.slug}` },
  }
}

function Blocks({ blocks }: { blocks: Page['blocks'] }) {
  return (
    <>
      {(blocks ?? []).map((b) => {
        if (b.blockType === 'content') return <RichText key={b.id} data={b.body} />
        if (b.blockType === 'cta')
          return (
            <div key={b.id} className="my-8 flex flex-col items-start gap-3 rounded-lg border-2 border-brand-red p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 text-lg font-semibold text-brand-navy">{b.text}</p>
              <Link href={b.buttonUrl} className="btn">
                {b.buttonLabel}
              </Link>
            </div>
          )
        return null
      })}
    </>
  )
}

export default async function StaticPage({ params }: Props) {
  const { page: slug } = await params
  const page = await getPage(slug)
  if (!page) {
    const moved = await findPageByOldSlug(slug)
    if (moved?.slug) permanentRedirect(`/${moved.slug}`)
    notFound()
  }

  return (
    <main id="content">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h1>{page.title}</h1>
            </div>
          </div>
          {page.intro ? <p className="mb-6 max-w-[72ch] text-lg text-brand-slate">{page.intro}</p> : null}
          <RichText data={page.content} />
          <Blocks blocks={page.blocks} />
        </div>
      </section>
    </main>
  )
}
