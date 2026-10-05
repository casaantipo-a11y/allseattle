// Project hook for Claude Code (wired in .claude/settings.json).
// PreToolUse  (Edit|Write|MultiEdit): refuses edits to secrets and hand-off docs.
// PostToolUse (Edit|Write|MultiEdit) on *.css:
//   - flags rules design.md/CLAUDE.md forbid, counting only what is NEW compared with HEAD,
//     so the five transitions already in app/ don't fire on every edit;
//   - for the prototype's css/, bumps ?v= in all 17 pages once per change set.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { basename, join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const file = input.tool_input?.file_path || input.tool_input?.notebook_path
if (!file) process.exit(0)
const rel = relative(root, file).replaceAll('\\', '/')
if (rel.startsWith('..')) process.exit(0) // outside this repo

if (input.hook_event_name === 'PreToolUse') {
  const name = basename(rel)
  const blocked =
    /^\.env(\..*)?$/.test(name) && name !== '.env.example'
      ? 'it holds secrets (DB / R2 / Vercel keys)'
      : name === 'start.ps1'
        ? 'it holds a live bot token'
        : name === 'pnpm-lock.yaml'
          ? 'the lockfile changes through pnpm, not by hand'
          : name === 'DNS-SETUP-INSTRUCTIONS.md'
            ? 'it is the client-facing DNS doc that stays untracked and untouched'
            : null
  if (blocked) {
    console.error(`Blocked by .claude/hooks/guard.mjs: ${rel} — ${blocked}. Ask the user to change it themselves.`)
    process.exit(2)
  }
  process.exit(0)
}

if (input.hook_event_name !== 'PostToolUse' || !rel.endsWith('.css')) process.exit(0)

const git = (...args) => {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return ''
  }
}
const now = readFileSync(file, 'utf8')
const before = git('show', `HEAD:${rel}`)
const CHECKS = [
  ['transition', /(^|[;{\s])transition(-[a-z]+)?\s*:/gm, 'the site has no animation (CLAUDE.md)'],
  ['@keyframes', /@keyframes\b/g, 'the site has no animation (CLAUDE.md)'],
  ['smooth scroll', /scroll-behavior\s*:\s*smooth/g, 'the site has no animation (CLAUDE.md)'],
  ['max-width media query', /@media[^{]*max-width/g, 'breakpoints are mobile-first min-width only'],
]
const count = (s, re) => (s.match(re) || []).length
const found = CHECKS.filter(([, re]) => count(now, re) > count(before, re)).map(
  ([what, , why]) => `- new ${what} in ${rel}: ${why}`,
)
if (found.length) {
  console.error(`design rules check:\n${found.join('\n')}\nRemove it, or keep it only if the user explicitly asked for it.`)
  process.exit(2)
}

// Prototype CSS (root css/): make sure the cache-buster moves with it.
if (rel.startsWith('css/')) {
  const v = (s) => (s.match(/\?v=(\d{8}[a-z])/) || [])[1]
  const headV = v(git('show', 'HEAD:index.html'))
  const workV = v(readFileSync(join(root, 'index.html'), 'utf8'))
  if (headV && headV === workV) {
    const out = execFileSync('node', [join(root, '.claude/scripts/bump-css-version.mjs')], { encoding: 'utf8' }).trim()
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `CSS changed, so the stylesheet cache-buster was bumped automatically: ${out}. Commit the 17 pages with the CSS.`,
        },
      }),
    )
  }
}
process.exit(0)
