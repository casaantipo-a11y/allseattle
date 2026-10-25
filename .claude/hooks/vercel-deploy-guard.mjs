// Project hook for Claude Code (wired in .claude/settings.json: PreToolUse on Bash|PowerShell).
// Blocks `vercel deploy` while the generated files that `pnpm dev` rewrites are modified:
// the CLI uploads the working tree, not the commit, so those edits would reach production.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const command = input.tool_input?.command || ''
if (!/\bvercel\b[^\n;&|]*\bdeploy\b/.test(command)) process.exit(0)

const GENERATED = ['app/src/app/(payload)/admin/importMap.js', 'app/src/payload-types.ts']
let dirty
try {
  dirty = execFileSync('git', ['-C', root, 'status', '--porcelain', '--', ...GENERATED], { encoding: 'utf8' }).trim()
} catch {
  console.error('Blocked by .claude/hooks/vercel-deploy-guard.mjs: could not check git status for the generated files, so the deploy is not allowed.')
  process.exit(2)
}
if (!dirty) process.exit(0)

console.error(
  `Blocked by .claude/hooks/vercel-deploy-guard.mjs: these generated files are modified, and vercel deploy would upload them:\n${dirty}\n` +
    'Look at `git diff` for them first. pnpm dev rewrites them when R2 is not configured locally, so if the diff is only regeneration: stop pnpm dev, run `git checkout -- <files>`, then deploy. If the diff contains anything else, ask the user before restoring.',
)
process.exit(2)
