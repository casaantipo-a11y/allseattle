import { OG_SIZE, ogCard } from '@/lib/og'
import { getSiteSettings } from '@/lib/queries'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'AllSeattle — the Seattle city portal'
export const revalidate = 86400

export default async function Image() {
  const settings = await getSiteSettings()
  return ogCard({ title: settings.tagline || 'The Seattle city portal', kicker: 'Seattle news, businesses, events' })
}
