import type { JobItem } from '@/components/jobs/JobsBoard'
import type { Business, Job, JobCategory } from '@/payload-types'

export const EMPLOYMENT_LABEL: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
}

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

/** "$22–25/hr", "$115k–140k", "From $60k" … or '' when no salary is given. */
export function salaryText(j: Pick<Job, 'salaryMin' | 'salaryMax' | 'salaryPeriod'>): string {
  const { salaryMin: lo, salaryMax: hi } = j
  if (lo == null && hi == null) return ''
  const hourly = j.salaryPeriod !== 'year'
  const f = (n: number) => (hourly ? String(n) : k(n))
  const tail = hourly ? '/hr' : ''
  if (lo != null && hi != null) return lo === hi ? `$${f(lo)}${tail}` : `$${f(lo)}–${f(hi)}${tail}`
  if (lo != null) return `From $${f(lo)}${tail}`
  return `Up to $${f(hi as number)}${tail}`
}

/** Yearly figure used to compare hourly and yearly pay (40 h × 52 weeks). */
export function annualSalary(j: Pick<Job, 'salaryMin' | 'salaryMax' | 'salaryPeriod'>): number | null {
  const vals = [j.salaryMin, j.salaryMax].filter((x): x is number => x != null)
  if (!vals.length) return null
  const mid = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(j.salaryPeriod === 'year' ? mid : mid * 2080)
}

export const companyOf = (j: Job) => {
  const biz = typeof j.business === 'object' && j.business ? (j.business as Business) : null
  return { name: biz?.name ?? j.companyName ?? 'Company', href: biz?.slug ? `/biz/${biz.slug}` : null, biz }
}

export function toJobItem(j: Job): JobItem {
  const c = companyOf(j)
  return {
    id: j.id,
    slug: j.slug ?? String(j.id),
    title: j.title,
    company: c.name,
    companyHref: c.href,
    category: typeof j.category === 'object' ? (j.category as JobCategory).name : '',
    type: EMPLOYMENT_LABEL[j.employmentType] ?? j.employmentType,
    salary: salaryText(j),
    annual: annualSalary(j),
    location: j.location,
    workMode: j.workMode ?? 'on-site',
    openTo: j.openTo ?? [],
    perks: j.perks ?? [],
    languages: j.languages ?? [],
    urgent: Boolean(j.isUrgent),
    featured: Boolean(j.isFeatured),
    postedAt: j.createdAt,
    summary: j.summary,
  }
}

/** Plain text of a Lexical document (for descriptions in structured data). */
export function lexicalText(state: unknown): string {
  const out: string[] = []
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return
    const node = n as { text?: string; children?: unknown[]; type?: string }
    if (typeof node.text === 'string') out.push(node.text)
    node.children?.forEach(walk)
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listitem') out.push('\n')
  }
  walk((state as { root?: unknown })?.root)
  return out.join('').replace(/\n{2,}/g, '\n').trim()
}
