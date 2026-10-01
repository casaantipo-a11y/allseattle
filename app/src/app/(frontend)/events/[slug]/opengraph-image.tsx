import { OG_SIZE, ogCard } from '@/lib/og'
import { getEvent } from '@/lib/queries-phase3'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A Seattle event on AllSeattle'
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await getEvent((await params).slug)
  const when = ev
    ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(ev.startAt))
    : 'Seattle events'
  return ogCard({ title: ev?.title ?? 'Seattle events', kicker: ev ? `${when} · ${ev.venueName}` : when })
}
