// pnpm seed:prod — runs `pnpm seed` against production (Neon + R2), with the
// settings from the local, gitignored files .env.neon.local, .env.r2.local and
// .env.vercel.local. Read in Node, not sourced by the shell: the Neon URL holds
// `&`, which a shell treats as "run in background" and silently drops.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const read = (f) => Object.fromEntries(fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const env = { ...process.env, ...read('.env.neon.local'), ...read('.env.r2.local'), ...read('.env.vercel.local') }
if (!/neon\.tech/.test(env.DATABASE_URL)) throw new Error('DATABASE_URL is not Neon — refusing to run')
for (const k of ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'PAYLOAD_SECRET', 'S3_BUCKET']) if (!env[k]) throw new Error(`${k} missing`)
console.log('target db host:', new URL(env.DATABASE_URL).hostname.replace(/^ep-[^.]+/, 'ep-…'))
const r = spawnSync('pnpm seed', { shell: true, env, encoding: 'utf8', maxBuffer: 64 << 20 })
const out = (r.stdout + r.stderr).split('\n').filter((l) => /\[seed\]|error|Error|Done|created/i.test(l) && !/SECURITY WARNING/.test(l))
console.log(out.slice(-40).join('\n').replace(/postgres(ql)?:\/\/\S+/g, '<url>'))
console.log('exit', r.status)
