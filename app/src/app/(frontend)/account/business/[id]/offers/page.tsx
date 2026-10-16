import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ItemsEditor, type Item } from '@/components/account/ItemsEditor'
import { getCustomer } from '@/lib/account'
import { priceText } from '@/lib/business'
import { myBusiness } from '@/lib/business-cabinet'
import { mediaUrl } from '@/lib/media'
import { SITE_TZ } from '@/lib/site'
import type { Media } from '@/payload-types'

export const metadata: Metadata = { title: 'Promotions & products' }

type Props = { params: Promise<{ id: string }> }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: SITE_TZ })
const ymd = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')
const image = (m: unknown) => (typeof m === 'object' && m ? [{ id: (m as Media).id, url: mediaUrl(m as Media, 'thumb') ?? '' }] : [])

// Promotions and products of a business the account manages (stage 3, step 3).
// Both go live at once; what's allowed comes from the package.
export default async function OffersPage({ params }: Props) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/business/${id}/offers`)}`)
  const mine = await myBusiness(me, Number(id))
  if (!mine) notFound()
  const { biz, promotions, products, pkg } = mine
  const now = new Date()

  const promoItems: Item[] = promotions.map((p) => ({
    id: p.id,
    title: p.title,
    meta: `${day(p.validFrom)} – ${day(p.validUntil)}${new Date(p.validUntil) < now ? ' · ended' : ''}`,
    values: { title: p.title, description: p.description ?? '', validFrom: ymd(p.validFrom), validUntil: ymd(p.validUntil) },
    image: image(p.image),
  }))
  const productItems: Item[] = products.map((p) => ({
    id: p.id,
    title: p.name,
    meta: p.price != null ? priceText(p.price) : 'Ask for price',
    values: { name: p.name, price: p.price != null ? String(p.price) : '', description: p.description ?? '' },
    image: image(p.image),
  }))
  const maxProducts = pkg?.maxProducts ?? 0
  const pkgName = pkg?.name ?? 'basic'

  return (
    <AccountShell
      eyebrow={biz.name}
      title="Promotions & products"
      wide
      intro={
        <>
          They show on your business page as soon as you save{biz.status === 'published' ? '' : ' — once the business itself is live'}.{' '}
          <Link href="/account/business" className="text-brand-navy underline">
            Back to my business
          </Link>
        </>
      }
    >
      <h2>Promotions</h2>
      <ItemsEditor
        bizId={biz.id}
        kind="promotion"
        items={promoItems}
        canAdd={Boolean(pkg?.promotions)}
        note={pkg?.promotions ? 'An offer with its dates. It leaves the page by itself when it ends.' : `The ${pkgName} package doesn’t include promotions.`}
      />
      <div className="mt-6 border-t border-brand-line pt-6">
        <h2>Products</h2>
      </div>
      <ItemsEditor
        bizId={biz.id}
        kind="product"
        items={productItems}
        canAdd={products.length < maxProducts}
        note={
          maxProducts === 0
            ? `The ${pkgName} package doesn’t include products.`
            : `Up to ${maxProducts} with the ${pkgName} package (${products.length} now).`
        }
      />
      {maxProducts === 0 || !pkg?.promotions ? (
        <div className="mt-6">
          <Link href="/advertise" className="text-brand-navy underline">
            Compare packages
          </Link>
        </div>
      ) : null}
    </AccountShell>
  )
}
