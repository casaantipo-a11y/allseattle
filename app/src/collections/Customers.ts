import type { Access, CollectionBeforeChangeHook, CollectionBeforeOperationHook, CollectionConfig, FieldAccess } from 'payload'
import { APIError, ValidationError } from 'payload'

import { hasRole, isStaff } from '../access/roles'
import { emailLayout } from '../lib/email'
import { absoluteUrl } from '../lib/site'

// Site accounts (stage 3): private sellers and businesses who post listings, run
// their business card and pay for packages and ad placements. A separate auth
// collection from `users` (the team): customers never reach /admin — that only
// lets `users` in (admin.user) — and every "logged in" check in the access rules
// means staff, not a customer (access/roles.ts isStaff).
// Accounts are created through /api/account/register (Turnstile, rate limit), not
// the REST create, and log in only after confirming their email.

const self: Access = ({ req, id }) => {
  if (hasRole(req, 'admin', 'sales')) return true
  const u = req.user
  if (u?.collection !== 'customers') return false
  return id != null ? u.id === id : { id: { equals: u.id } }
}

const staffField: FieldAccess = ({ req }) => isStaff(req)

// A customer can't switch the account to an email nobody confirmed; the team can.
const keepEmail: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !req.user || isStaff(req)) return data
  if (typeof data.email === 'string' && data.email.trim().toLowerCase() !== originalDoc?.email) {
    throw new ValidationError({ errors: [{ path: 'email', message: 'To change the email of the account, write to us.' }] })
  }
  return data
}

/** A reset link is valid for an hour (Payload's default); a new one goes out at most every 5 minutes. */
const RESET_LINK_MS = 60 * 60 * 1000
const RESET_GAP_MS = 5 * 60 * 1000

// "Forgot password" sends an email to any registered address on request: without
// a gap, anyone could flood a customer's inbox with reset emails.
const throttleForgotPassword: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'forgotPassword') return args
  const email = String((args as { data?: { email?: unknown } })?.data?.email ?? '').trim().toLowerCase()
  if (!email) return args
  const { docs } = await req.payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    req,
  })
  const exp = (docs[0] as { resetPasswordExpiration?: string | null } | undefined)?.resetPasswordExpiration
  if (exp && new Date(exp).getTime() - Date.now() > RESET_LINK_MS - RESET_GAP_MS) {
    throw new APIError('We just sent a reset link. Please check your inbox, or try again in a few minutes.', 429, null, true)
  }
  return args
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Customer account', plural: 'Customer accounts' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'phone', '_verified', 'createdAt'],
    group: 'Accounts',
    description: 'People and businesses who signed up on the site. They log in at /account, never in this admin.',
  },
  auth: {
    verify: {
      generateEmailSubject: () => 'Confirm your AllSeattle account',
      generateEmailHTML: ({ token, user }) =>
        emailLayout({
          heading: `Welcome${user?.name ? `, ${user.name}` : ''}!`,
          paragraphs: [
            'Thanks for signing up on AllSeattle. Confirm your email to finish creating your account.',
            'If you did not sign up, just ignore this message.',
          ],
          button: { label: 'Confirm email', href: absoluteUrl(`/account/verify?token=${encodeURIComponent(token)}`) },
        }).html,
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your AllSeattle password',
      generateEmailHTML: (args) =>
        emailLayout({
          heading: 'Reset your password',
          paragraphs: [
            'Someone asked to reset the password of your AllSeattle account. The link works for one hour.',
            'If it was not you, ignore this message — your password stays the same.',
          ],
          button: { label: 'Choose a new password', href: absoluteUrl(`/account/reset?token=${encodeURIComponent(args?.token ?? '')}`) },
        }).html,
    },
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 30 * 24 * 60 * 60,
  },
  hooks: {
    beforeOperation: [throttleForgotPassword],
    beforeChange: [keepEmail],
  },
  access: {
    // Sign-up goes through /api/account/register; nobody creates accounts through REST.
    create: () => false,
    read: self,
    update: self,
    delete: ({ req }) => hasRole(req, 'admin'),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 80 },
    { name: 'phone', type: 'text', maxLength: 40 },
    {
      // Sign-ups per IP per hour are limited by counting this (api/account/register).
      name: 'signupIp',
      type: 'text',
      index: true,
      access: { read: staffField, create: staffField, update: staffField },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      index: true,
      access: { create: staffField, update: staffField },
      admin: { readOnly: true, position: 'sidebar', description: 'Set by the payment step.' },
    },
  ],
}
