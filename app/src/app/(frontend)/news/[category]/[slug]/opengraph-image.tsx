import { OG_SIZE, ogCard } from '@/lib/og'
import { getArticle } from '@/lib/queries'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'AllSeattle news'
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params
  const article = await getArticle(slug)
  return ogCard({
    title: article?.title ?? 'Seattle news',
    kicker: article?.category?.name ?? 'Seattle news',
  })
}
