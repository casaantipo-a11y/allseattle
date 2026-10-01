import { toCarItem } from '@/lib/cars'
import { OG_SIZE, ogCard } from '@/lib/og'
import { getCar } from '@/lib/queries-phase3'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A car for sale on AllSeattle'
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const car = await getCar((await params).slug)
  if (!car) return ogCard({ title: 'Cars for sale in Seattle', kicker: 'AllSeattle Auto' })
  const c = toCarItem(car)
  return ogCard({ title: c.title, kicker: `$${c.price.toLocaleString('en-US')} · ${c.mileage.toLocaleString('en-US')} mi` })
}
