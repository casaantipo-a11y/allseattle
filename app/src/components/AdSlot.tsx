import { firstRunning, getBannerPool } from '@/lib/banners'

import { BannerSlot, type Size } from './BannerSlot'

// An ad placement on a page (spec §7). `code` ties it to the AdSlots
// collection; the published banners for that code come from a cached pool and
// BannerSlot shows one of them (rotating at random) or the "Your ad here"
// placeholder when nothing is running. `size`/`mobileSize` here describe the
// box the page has room for and match the slot's sizes in the admin.

export async function AdSlot({
  code,
  size,
  mobileSize,
  className,
}: {
  code: string
  size: Size
  mobileSize?: Size
  className?: string
}) {
  const banners = (await getBannerPool())[code] ?? []
  return (
    <BannerSlot
      code={code}
      size={size}
      mobileSize={mobileSize}
      className={className}
      banners={banners}
      initial={firstRunning(banners)}
    />
  )
}

/** Phone-only echo of a sidebar slot, placed inside a feed. */
export async function InlineMobileAd({ code }: { code: string }) {
  const banners = (await getBannerPool())[code] ?? []
  return (
    <BannerSlot code={code} size="300x250" banners={banners} initial={firstRunning(banners)} echo />
  )
}
