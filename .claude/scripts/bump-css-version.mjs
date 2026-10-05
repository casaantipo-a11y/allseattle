// Bumps the stylesheet cache-buster `?v=<YYYYMMDD><letter>` in all 17 pages at once
// (*.html and auto/*.html), as CLAUDE.md requires on every CSS change.
// Same day -> next letter (20261002a -> 20261002b); new day -> <today>a.
// Usage (from the repo root): node .claude/scripts/bump-css-version.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pages = [
  ...readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => join(root, f)),
  ...readdirSync(join(root, 'auto')).filter((f) => f.endsWith('.html')).map((f) => join(root, 'auto', f)),
]

const RE = /\?v=(\d{8})([a-z])/g
const current = readFileSync(join(root, 'index.html'), 'utf8').match(/\?v=(\d{8})([a-z])/)
if (!current) {
  console.error('No ?v=<date><letter> found in index.html')
  process.exit(1)
}
const d = new Date()
const today = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
let next
if (current[1] === today) {
  if (current[2] === 'z') {
    console.error(`?v=${today}z is already the last letter for today`)
    process.exit(1)
  }
  next = today + String.fromCharCode(current[2].charCodeAt(0) + 1)
} else {
  next = today + 'a'
}

let changed = 0
for (const p of pages) {
  const src = readFileSync(p, 'utf8')
  const out = src.replace(RE, `?v=${next}`)
  if (out !== src) {
    writeFileSync(p, out)
    changed++
  }
}
console.log(`?v=${current[1]}${current[2]} -> ?v=${next} in ${changed} of ${pages.length} pages`)
