import { getSiteSettings } from '@/lib/queries'

// The site's contact address as a mailto line (client, 12.10.2026: one address,
// AllSeattle.info@gmail.com, everywhere an email is shown — footer, Contact,
// Advertising, Add your business). It comes from Site settings, so it changes
// in one place; with no address set the line is left out.
export async function ContactEmail({ label = 'Email us:', className }: { label?: string; className?: string }) {
  const { email } = await getSiteSettings()
  if (!email) return null
  return (
    <p className={className}>
      {label}{' '}
      <a href={`mailto:${email}`} className="text-brand-navy underline">
        {email}
      </a>
    </p>
  )
}
