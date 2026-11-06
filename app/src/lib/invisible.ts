// Characters that come along when text is copied from an AI chat or a web page and show
// nothing: the word joiner (U+2060) and the object replacement character (U+FFFC) that
// ChatGPT puts after a link, the zero-width space (U+200B) and the byte-order mark
// (U+FEFF). In a web address they break the link: …/utilities followed by U+2060 is a 404.
// The zero-width joiners (U+200C, U+200D) stay: emoji and some scripts need them.
const INVISIBLE = /[​⁠﻿￼]/g

export const stripInvisible = (s: string) => s.replace(INVISIBLE, '')

/** The same for every string inside a value — a rich-text tree is nested objects and arrays. */
export function stripInvisibleDeep<T>(value: T): T {
  if (typeof value === 'string') return stripInvisible(value) as T
  if (Array.isArray(value)) return value.map(stripInvisibleDeep) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripInvisibleDeep(v)])) as T
  }
  return value
}
