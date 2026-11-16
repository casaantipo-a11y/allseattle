import { checkoutForLink } from '@/lib/payment-link'
import { absoluteUrl } from '@/lib/site'

// GET /pay/<token> — the button in the "Pay securely" mail (lib/payment-link.ts). Each visit
// opens a new Stripe Checkout (303); a business that already pays goes to the thanks page.

export const dynamic = 'force-dynamic'

const page = (status: number, title: string, text: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — AllSeattle</title></head>` +
      `<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f7fa;color:#0d1b2a"><main style="max-width:520px;margin:12vh auto;padding:0 24px;text-align:center">` +
      `<p style="font-size:20px;font-weight:700;margin:0 0 24px"><span style="color:#e53935">All</span>Seattle</p><h1 style="font-size:22px">${title}</h1><p style="line-height:1.5">${text}</p>` +
      `<p><a href="${absoluteUrl('/')}" style="color:#e53935;font-weight:700">Go to AllSeattle</a></p></main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  )

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const result = await checkoutForLink((await params).token)
  if (result.kind === 'ok') return Response.redirect(result.url, 303)
  if (result.kind === 'paid') return Response.redirect(absoluteUrl('/pay/thanks'), 303)
  if (result.kind === 'error') return page(502, 'Payment could not start', 'Please try again in a minute, or reply to the email you got and we will help.')
  return page(404, 'This payment link is no longer valid', 'Please reply to the email you got and we will send a new one.')
}
