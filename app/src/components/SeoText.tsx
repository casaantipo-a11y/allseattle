import type { SeoSection } from '@/globals/SeoTexts'
import { seoBlock } from '@/lib/seo-texts'

// The client's SEO text at the bottom of a section, above the footer (client, 20.10.2026:
// "at the bottom, so the phone picture isn't broken"). Quiet small type under a hairline;
// nothing while the admin's text is empty. Styles: components.css (.seo-text).
export async function SeoText({ section }: { section: SeoSection }) {
  const block = await seoBlock(section)
  if (!block) return null
  return (
    <div className="container seo-text-wrap">
      <section className="seo-text" aria-label={block.heading || undefined}>
        {block.heading ? <h2>{block.heading}</h2> : null}
        {block.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>
    </div>
  )
}
