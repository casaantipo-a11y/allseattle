import { sectionMetadata, sectionPage } from './sectionPage'

export const revalidate = 3600

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

export const generateMetadata = ({ searchParams }: Props) => sectionMetadata('directory', searchParams)

export default function Page({ searchParams }: Props) {
  return sectionPage('directory', searchParams)
}
