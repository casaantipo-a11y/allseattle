import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

// Body text of articles and pages. New in stage 2, so Tailwind: readable
// measure, the prototype's type scale. Links: `.rich-text a` in business.css (the
// prototype's unlayered `a` rule beats Tailwind utilities, so they live there).
export function RichText({ data, className = '' }: { data: unknown; className?: string }) {
  if (!data) return null
  return (
    <div
      className={`rich-text max-w-[72ch] text-[17px] leading-[1.7] text-brand-navy [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-red [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-8 [&_h3]:mb-2 [&_h3]:mt-6 [&_img]:h-auto [&_img]:max-w-full [&_li]:mb-1 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
    >
      <LexicalRichText data={data as SerializedEditorState} />
    </div>
  )
}
