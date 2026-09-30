import { sectionMetadata, sectionPage, sectionStaticParams } from '../../directory/sectionPage'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; page?: string }> }

export const generateStaticParams = () => sectionStaticParams('leisure')

export const generateMetadata = ({ params, searchParams }: Props) => sectionMetadata('leisure', searchParams, params)

export default function Page({ params, searchParams }: Props) {
  return sectionPage('leisure', searchParams, params)
}
