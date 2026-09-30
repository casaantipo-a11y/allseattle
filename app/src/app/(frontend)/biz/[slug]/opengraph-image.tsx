import { OG_SIZE, ogCard } from '@/lib/og'
import { getBusiness } from '@/lib/queries'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A Seattle business on AllSeattle'
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const biz = await getBusiness(slug)
  const cat = biz?.categories?.find((c) => typeof c === 'object')
  return ogCard({ title: biz?.name ?? 'Seattle business', kicker: cat && typeof cat === 'object' ? cat.name : 'Business directory' })
}
