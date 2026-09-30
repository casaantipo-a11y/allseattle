import { z } from 'zod'

// Environment is validated once, at import. A missing required variable stops
// the app with a message naming it, instead of failing later with an opaque
// database or crypto error. Optional integrations (R2, Telegram, Resend,
// Turnstile) are simply off while their variables are empty.

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined))

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Postgres connection string)'),
  PAYLOAD_SECRET: z.string().min(16, 'PAYLOAD_SECRET is required (at least 16 characters)'),
  NEXT_PUBLIC_SITE_URL: z.url('NEXT_PUBLIC_SITE_URL must be a full URL, e.g. https://example.com'),
  ROOT_DOMAIN: optional,
  ENABLE_SUBDOMAINS: optional.transform((v) => v === 'true'),
  S3_ENDPOINT: optional,
  S3_BUCKET: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  S3_PUBLIC_URL: optional,
  TELEGRAM_BOT_TOKEN: optional,
  RESEND_API_KEY: optional,
  RESEND_FROM: optional,
  NOTIFY_EMAIL: optional,
  TURNSTILE_SITE_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,
  SEED_ADMIN_EMAIL: optional,
  SEED_ADMIN_PASSWORD: optional,
})

function load() {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid environment. Fix these in .env:\n${lines.join('\n')}`)
  }
  return parsed.data
}

export const env = load()

/** R2 is on only when every S3 variable is set; otherwise uploads stay on local disk. */
export const s3Enabled = Boolean(
  env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY,
)
