/**
 * pnpm admin-password — lists the admin users. With RESET_EMAIL=<address> set, gives that
 * admin a new random password and prints it once (the old one stops working).
 *
 * Production: RESET_EMAIL=… pnpm admin-password:prod (scripts/prod.mjs).
 */
import { randomInt } from 'node:crypto'

import { getPayload } from 'payload'

import config from '../payload.config'

const payload = await getPayload({ config })

const admins = (
  await payload.find({ collection: 'users', where: { roles: { contains: 'admin' } }, pagination: false, depth: 0, sort: 'id' })
).docs
for (const u of admins) console.log(`[admin-password] #${u.id} ${u.email} | ${u.name ?? '-'} | roles: ${u.roles.join(', ')}`)
if (!admins.length) console.log('[admin-password] no admin users')

const email = process.env.RESET_EMAIL?.trim().toLowerCase()
if (email) {
  const user = admins.find((u) => u.email.toLowerCase() === email)
  if (!user) {
    console.log(`[admin-password] ${email} is not one of the admins above — nothing changed`)
    process.exit(1)
  }
  // No look-alike characters (0/O, 1/l/I), so it can be read off a screen.
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const password = Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join('')
  await payload.update({ collection: 'users', id: user.id, data: { password }, depth: 0 })
  console.log(`[admin-password] new password for ${user.email}: ${password}`)
}
process.exit(0)
