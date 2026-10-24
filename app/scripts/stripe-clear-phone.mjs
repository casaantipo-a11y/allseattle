// Clears the phone on the live Stripe customer(s) of one account email (item 19, 24.10.2026).
// Customers created before 2ac580a carry the phone typed at sign-up, and Stripe texts its
// verification code to it — for a test account that was someone else's phone.
//
//   node scripts/stripe-clear-phone.mjs someone@example.com           → shows what it would change
//   node scripts/stripe-clear-phone.mjs someone@example.com --apply   → clears the phone
//
// The key comes from STRIPE_LIVE_SECRET_KEY in the gitignored .env.local (read here in Node,
// never printed), or from STRIPE_SECRET_KEY in the environment.
import fs from 'node:fs'

const [email, flag] = process.argv.slice(2)
if (!email || !email.includes('@')) throw new Error('usage: node scripts/stripe-clear-phone.mjs <email> [--apply]')
const apply = flag === '--apply'

const fromFile = fs.existsSync('.env.local')
  ? fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('STRIPE_LIVE_SECRET_KEY='))
      ?.slice('STRIPE_LIVE_SECRET_KEY='.length)
      .trim()
  : undefined
const key = fromFile || process.env.STRIPE_SECRET_KEY
if (!key) throw new Error('No Stripe key: set STRIPE_LIVE_SECRET_KEY in .env.local or STRIPE_SECRET_KEY')

const stripe = async (method, path, body) => {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${json.error?.message ?? 'error'}`)
  return json
}

const { data } = await stripe('GET', `/customers?email=${encodeURIComponent(email)}&limit=10`)
if (!data.length) {
  console.log(`No Stripe customer with ${email}.`)
  process.exit(0)
}
for (const c of data) {
  const masked = c.phone ? `…${c.phone.slice(-2)}` : '(none)'
  if (!c.phone) {
    console.log(`${c.id}: no phone, nothing to do`)
  } else if (!apply) {
    console.log(`${c.id}: phone ${masked} — would clear (run again with --apply)`)
  } else {
    await stripe('POST', `/customers/${c.id}`, { phone: '' })
    console.log(`${c.id}: phone ${masked} cleared`)
  }
}
