import { castVote, voteSchema } from '@/lib/contest-votes'
import { HONEYPOT, clientIp, turnstileOk } from '@/lib/forms'

// POST /api/contests/vote — a vote for a contest entry (form: contest, entry,
// email). Honeypot → validation → Turnstile → per-IP limit → email with the
// confirmation link (lib/contest-votes.ts). Nothing counts until it's confirmed.

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request) {
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form.' }, 400)
  }
  const ok = { ok: true, message: 'Almost done — we sent you an email. Open the link in it to confirm your vote.' }
  if (typeof fd.get(HONEYPOT) === 'string' && (fd.get(HONEYPOT) as string).trim() !== '') return json(ok)
  const parsed = voteSchema.safeParse({ contest: fd.get('contest'), entry: fd.get('entry'), email: fd.get('email') })
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === 'email')
    return json({ error: emailIssue?.message ?? 'Please try again.', field: emailIssue ? 'email' : undefined }, 400)
  }
  const ip = clientIp(req)
  if (!(await turnstileOk(fd.get('cf-turnstile-response'), ip))) return json({ error: 'The anti-spam check failed. Please try again.' }, 400)
  const r = await castVote(parsed.data, ip)
  return r.ok ? json(r) : json({ error: r.error, field: r.field }, r.status)
}
