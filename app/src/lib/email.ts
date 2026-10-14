import type { EmailAdapter, SendEmailOptions } from 'payload'

import { absoluteUrl } from './site'

// Payload's email adapter (stage 3: account verification, password reset, and the
// site's own transactional mail) on Resend's REST API through fetch — the same
// call notify.ts makes, so no SDK dependency. Without RESEND_API_KEY (local
// development) the message is printed to the server console instead, so every
// flow can be tested before the domain and Resend are set up.

const FROM = () => process.env.RESEND_FROM || 'AllSeattle <onboarding@resend.dev>'

const addr = (a: SendEmailOptions['to']): string[] => {
  if (!a) return []
  const list = Array.isArray(a) ? a : [a]
  return list.map((x) => (typeof x === 'string' ? x : `${x.name ? `${x.name} ` : ''}<${x.address}>`))
}

export async function sendMail(msg: { to: string | string[]; subject: string; html: string; text?: string }) {
  const key = process.env.RESEND_API_KEY
  const to = Array.isArray(msg.to) ? msg.to : [msg.to]
  if (!key) {
    console.info(`[email] (no RESEND_API_KEY — not sent)\n  to: ${to.join(', ')}\n  subject: ${msg.subject}\n  ${msg.text ?? msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`)
    return { id: 'console' }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM(), to, subject: msg.subject, html: msg.html, text: msg.text }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return (await res.json()) as { id: string }
}

export const resendAdapter: EmailAdapter = () => ({
  name: 'resend-fetch',
  defaultFromAddress: FROM().match(/<([^>]+)>/)?.[1] ?? 'onboarding@resend.dev',
  defaultFromName: 'AllSeattle',
  sendEmail: async (message) =>
    sendMail({
      to: addr(message.to),
      subject: String(message.subject ?? ''),
      html: String(message.html ?? ''),
      text: message.text ? String(message.text) : undefined,
    }),
})

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** A plain branded email: heading, paragraphs, one button. */
export function emailLayout({ heading, paragraphs, button }: { heading: string; paragraphs: string[]; button?: { label: string; href: string } }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#0d1b2a">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="font-size:20px;font-weight:700;margin:0 0 24px"><span style="color:#e53935">All</span>Seattle</p>
<div style="background:#fff;border-radius:12px;padding:28px">
<h1 style="font-size:20px;margin:0 0 16px">${esc(heading)}</h1>
${paragraphs.map((p) => `<p style="font-size:15px;line-height:1.5;margin:0 0 12px">${esc(p)}</p>`).join('')}
${button ? `<p style="margin:24px 0 8px"><a href="${esc(button.href)}" style="display:inline-block;background:#e53935;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${esc(button.label)}</a></p><p style="font-size:12px;color:#5b6b7b;word-break:break-all">${esc(button.href)}</p>` : ''}
</div>
<p style="font-size:12px;color:#5b6b7b;margin:16px 0 0">AllSeattle — Seattle City Website · ${esc(absoluteUrl('/'))}</p>
</div></body></html>`
  const text = [heading, ...paragraphs, button ? `${button.label}: ${button.href}` : ''].filter(Boolean).join('\n\n')
  return { html, text }
}
