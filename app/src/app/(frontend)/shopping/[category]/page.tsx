import { sectionMetadata, sectionPage, sectionStaticParams } from '../../directory/sectionPage'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; page?: string }> }

export const generateStaticParams = () => sectionStaticParams('shopping')

export const generateMetadata = ({ params, searchParams }: Props) => sectionMetadata('shopping', searchParams, params)

export default function Page({ params, searchParams }: Props) {
  return sectionPage('shopping', searchParams, params)
}
