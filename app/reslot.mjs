import fs from 'node:fs'
const [site, envFile] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const { token } = await (await fetch(site + '/api/users/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD }) })).json()
const h = { Authorization: `JWT ${token}`, 'content-type': 'application/json' }
const r = await (await fetch(`${site}/api/ad-slots?where[code][equals]=CARS_INFEED_1&depth=0`, { headers: h })).json()
const doc = r.docs?.[0]
if (!doc) console.log(site, 'no CARS_INFEED_1 (already renamed?)')
else { const u = await fetch(`${site}/api/ad-slots/${doc.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ code: 'CARS_SERVICES_TOP', name: 'Cars — auto services, top banner', position: 'leaderboard' }) }); console.log(site, u.status, (await u.json()).doc?.code) }
