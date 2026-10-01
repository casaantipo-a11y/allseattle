// New-submission notifications (spec §8): Telegram (sendMessage, or sendPhoto
// when there's a picture) and an email through Resend. Both are optional —
// off while their keys are empty — and neither may break saving the
// submission: every failure is logged and swallowed.

export type NoticePhoto = { data: Buffer; name: string; mimetype: string }
type Notice = { title: string; lines: [string, string | null | undefined][]; adminUrl: string; photo?: NoticePhoto | null }

const text = (n: Notice) =>
  [n.title, '', ...n.lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), '', `Open in admin: ${n.adminUrl}`].join('\n')

export async function notifyTelegram(chatId: string | null | undefined, n: Notice) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !chatId) return
  try {
    // No parse_mode: visitor input is sent as plain text and can't inject markup.
    // The photo goes up as a file, not a URL — Telegram can't fetch from a
    // local or not-yet-public site.
    let res: Response
    if (n.photo) {
      const fd = new FormData()
      fd.set('chat_id', chatId)
      fd.set('caption', text(n).slice(0, 1024))
      fd.set('photo', new Blob([new Uint8Array(n.photo.data)], { type: n.photo.mimetype }), n.photo.name)
      res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: fd, signal: AbortSignal.timeout(15000) })
    } else {
      res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text(n).slice(0, 4096), disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      })
    }
    if (!res.ok) console.error('[notify] telegram', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('[notify] telegram failed', e)
  }
}

export async function notifyEmail(to: string | null | undefined, n: Notice) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Resend's shared test sender until the site's own domain is verified in Resend.
        from: process.env.RESEND_FROM || 'AllSeattle <onboarding@resend.dev>',
        to: [to],
        subject: n.title,
        text: text(n),
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.error('[notify] resend', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('[notify] email failed', e)
  }
}
