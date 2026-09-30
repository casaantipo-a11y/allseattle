import { sectionMetadata, sectionPage, sectionStaticParams } from '../sectionPage'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; page?: string }> }

export const generateStaticParams = () => sectionStaticParams('directory')

export const generateMetadata = ({ params, searchParams }: Props) => sectionMetadata('directory', searchParams, params)

export default function Page({ params, searchParams }: Props) {
  return sectionPage('directory', searchParams, params)
}
