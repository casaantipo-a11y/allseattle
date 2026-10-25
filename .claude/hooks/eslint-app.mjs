// Project hook for Claude Code (wired in .claude/settings.json: PostToolUse on Edit|Write|MultiEdit).
// Runs ESLint on an edited TypeScript file under app/src and feeds the errors back to Claude.
// Errors only (--quiet). Not Prettier: 22 app files don't match .prettierrc yet, and --write
// would reformat them whole (app/CLAUDE.md).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const app = join(root, 'app')
const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const file = input.tool_input?.file_path
if (!file) process.exit(0)
const rel = relative(app, file).replaceAll('\\', '/')
if (rel.startsWith('..') || !rel.startsWith('src/') || !/\.tsx?$/.test(rel)) process.exit(0)

const eslint = join(app, 'node_modules', 'eslint', 'bin', 'eslint.js')
if (!existsSync(eslint)) process.exit(0) // dependencies not installed yet

try {
  execFileSync(process.execPath, [eslint, '--quiet', rel], { cwd: app, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
} catch (err) {
  const out = `${err.stdout || ''}${err.stderr || ''}`.trim()
  console.error(`ESLint errors in app/${rel}:\n${out}\nFix them before moving on.`)
  process.exit(2)
}
process.exit(0)
