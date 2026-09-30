import { sectionMetadata, sectionPage } from '../directory/sectionPage'

export const revalidate = 3600

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

export const generateMetadata = ({ searchParams }: Props) => sectionMetadata('shopping', searchParams)

export default function Page({ searchParams }: Props) {
  return sectionPage('shopping', searchParams)
}
