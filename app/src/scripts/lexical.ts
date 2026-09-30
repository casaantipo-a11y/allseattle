// Minimal Lexical document builders for seeded content: paragraphs and
// headings of plain text, which is all the demo needs.

type TextNode = { type: 'text'; text: string; version: 1; format: 0; style: ''; mode: 'normal'; detail: 0 }
type BlockNode = {
  type: 'paragraph' | 'heading'
  tag?: 'h2' | 'h3'
  version: 1
  direction: 'ltr'
  format: ''
  indent: 0
  textFormat?: 0
  children: TextNode[]
}

const text = (t: string): TextNode => ({ type: 'text', text: t, version: 1, format: 0, style: '', mode: 'normal', detail: 0 })

export const p = (t: string): BlockNode => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  children: [text(t)],
})

export const h2 = (t: string): BlockNode => ({
  type: 'heading',
  tag: 'h2',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children: [text(t)],
})

export const doc = (...children: BlockNode[]) => ({
  root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children },
})

/** Splits a plain body into paragraphs of about three sentences each. */
export function paragraphsFrom(body: string) {
  const sentences = body.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [body]
  const out: string[] = []
  for (let i = 0; i < sentences.length; i += 3) out.push(sentences.slice(i, i + 3).join('').trim())
  return doc(...out.map(p))
}
