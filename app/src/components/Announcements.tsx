import { getHeader } from '@/lib/queries'

import { AnnouncementList } from './AnnouncementList'

// Strip of short labelled links under the banner (spec §3), from the Header
// global. New component, so Tailwind rather than prototype CSS; sizes and
// colours come from the brand tokens in tailwind.css.
export async function Announcements() {
  const header = await getHeader()
  const items = header.announcements ?? []
  if (!items.length) return null

  return (
    <div className="container">
      {/* Gap via padding on a wrapper: the prototype's base.css zeroes list
          margins unlayered, which beats a Tailwind margin utility on the <ul>. */}
      <div className="pt-5">
        <AnnouncementList items={items} />
      </div>
    </div>
  )
}
