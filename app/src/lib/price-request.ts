import { emailLayout, sendMail } from './email'

// The email a business gets from "Request a price" (counters block, 22.11.2026). Every visitor
// string goes through emailLayout, which escapes it; the subject is cut to one clean line.
// Reply-to is the visitor's address, so "Reply" in the mail client answers them.

const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)

export async function sendPriceRequestMail(r: {
  to: string
  businessName: string
  name: string
  email?: string | null
  phone?: string | null
  message: string
}) {
  const contacts = [r.email ? `Email: ${r.email}` : '', r.phone ? `Phone: ${r.phone}` : ''].filter(Boolean)
  const { html, text } = emailLayout({
    heading: 'A customer asked for a price',
    paragraphs: [`${oneLine(r.name)} found ${oneLine(r.businessName)} on AllSeattle and wrote:`, r.message, ...contacts],
    after: [r.email ? 'Just reply to this email to answer them.' : 'They left a phone number only — please call or text them.'],
  })
  await sendMail({ to: r.to, subject: `Price request from ${oneLine(r.name)} — AllSeattle`, html, text, replyTo: r.email || undefined })
}
