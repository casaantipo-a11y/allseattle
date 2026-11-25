import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ListingForm } from '@/components/account/ListingForm'
import { getCustomer } from '@/lib/account'
import { mediaUrl } from '@/lib/media'
import { lexicalText } from '@/lib/jobs'
import { payloadClient } from '@/lib/cabinet'
import { COLLECTION, dealerChoices } from '@/lib/listings'
import { getCarMakes, getJobCategories } from '@/lib/queries-phase3'
import type { CarListing, Job } from '@/payload-types'
import { rowId } from '@/lib/row-id'

export const metadata: Metadata = { title: 'Edit listing' }

type Props = { params: Promise<{ kind: string; id: string }> }

const str = (v: unknown) => (v == null ? '' : String(v))
const relId = (v: unknown) => str(typeof v === 'object' && v ? (v as { id: number }).id : v)

// Editing a car or a job of the account; saving sends it back to review.
export default async function EditListingPage({ params }: Props) {
  const { kind, id } = await params
  if ((kind !== 'car' && kind !== 'job') || !/^\d+$/.test(id)) notFound()
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/listings/${kind}/${id}`)}`)
  const payload = await payloadClient()
  const doc = (await payload.findByID({ collection: COLLECTION[kind], id: rowId(id), depth: 1, overrideAccess: true, disableErrors: true })) as
    | CarListing
    | Job
    | null
  if (!doc || relId(doc.owner) !== String(me.id)) notFound()

  const intro = (
    <>
      Changes go to the team for review again before they show on the site.{' '}
      <Link href="/account/listings" className="text-brand-navy underline">
        Back to my listings
      </Link>
    </>
  )
  if (kind === 'car') {
    const car = doc as CarListing
    const makes = await getCarMakes()
    const values: Record<string, string> = {}
    for (const k of ['model', 'year', 'price', 'mileage', 'engine', 'transmission', 'fuelType', 'drivetrain', 'bodyType', 'exteriorColor', 'vin', 'description', 'sellerName', 'sellerPhone'] as const) {
      values[k] = str(car[k])
    }
    values.make = relId(car.make)
    // Seller: the saved choice. A dealer the team set that is not the account's own stays selectable,
    // so saving does not quietly turn the car private.
    const dealers = (await dealerChoices(payload, me.id)).map((d) => ({ value: String(d.id), label: d.name }))
    const saved = car.dealer && typeof car.dealer === 'object' ? car.dealer : null
    if (saved && !dealers.some((d) => d.value === String(saved.id))) dealers.push({ value: String(saved.id), label: saved.name })
    values.dealer = saved ? String(saved.id) : typeof car.dealer === 'number' ? String(car.dealer) : 'private'
    const photos = (car.photos ?? []).flatMap((m) => (typeof m === 'object' && m ? [{ id: m.id, url: mediaUrl(m, 'thumb') ?? '' }] : []))
    return (
      <AccountShell eyebrow="My listings" title={`Edit: ${car.title}`} wide intro={intro}>
        <ListingForm kind="car" id={car.id} values={values} photos={photos} makes={makes.map((m) => ({ id: m.id, name: m.name, models: m.models ?? [] }))} dealers={dealers} ownName={me.name ?? ''} />
      </AccountShell>
    )
  }
  const job = doc as Job
  const categories = await getJobCategories()
  const values: Record<string, string> = {}
  for (const k of ['title', 'companyName', 'employmentType', 'workMode', 'salaryMin', 'salaryMax', 'salaryPeriod', 'location', 'summary', 'howToApply'] as const) {
    values[k] = str(job[k])
  }
  values.category = relId(job.category)
  values.description = lexicalText(job.description)
  return (
    <AccountShell eyebrow="My listings" title={`Edit: ${job.title}`} wide intro={intro}>
      <ListingForm kind="job" id={job.id} values={values} categories={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
    </AccountShell>
  )
}
