// Runs a package script against production (Neon + R2) from this machine:
//
//   pnpm seed:prod         → pnpm seed
//   pnpm purge-demo:prod   → pnpm purge-demo (asks to type DELETE)
//   pnpm update-content:prod → pnpm update-content (client-agreed prices, limits, names)
//   pnpm import-setup:prod → pnpm import-setup (news category + import sources, nothing imported)
//   pnpm import-run:prod   → pnpm import-run (the daily import once, no customer reminders)
//
// Settings come from the local, gitignored files .env.neon.local, .env.r2.local
// and .env.vercel.local. They are read here in Node, not sourced by the shell:
// the Neon URL holds `&`, which a shell treats as "run in background", and
// DATABASE_URL then silently falls back to the local database.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const script = process.argv[2]
if (!['seed', 'purge-demo', 'update-content', 'import-setup', 'import-run', 'import-status'].includes(script)) throw new Error('usage: node scripts/prod.mjs seed|purge-demo|update-content|import-setup|import-run|import-status')

const read = (f) =>
  Object.fromEntries(
    fs
      .readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  )
const env = { ...process.env, ...read('.env.neon.local'), ...read('.env.r2.local'), ...read('.env.vercel.local') }
if (!/neon\.tech/.test(env.DATABASE_URL)) throw new Error('DATABASE_URL is not Neon — refusing to run')
for (const k of ['PAYLOAD_SECRET', 'S3_BUCKET', 'NEXT_PUBLIC_SITE_URL']) if (!env[k]) throw new Error(`${k} missing`)

console.log(`pnpm ${script} → production (${new URL(env.DATABASE_URL).hostname.replace(/^ep-[^.]+/, 'ep-…')})`)
const r = spawnSync(`pnpm ${script}`, { shell: true, env, stdio: 'inherit' })
process.exit(r.status ?? 1)
