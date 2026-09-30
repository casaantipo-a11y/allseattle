import type { Access, FieldAccess, PayloadRequest } from 'payload'

// Three roles (spec §4, Users):
//   admin  — everything
//   editor — news, events, contest, "Share the news" submissions
//   sales  — businesses, packages on businesses, banners, placement/ad inquiries
// Collections declare which roles may write them with `canWrite(...)`.

export const ROLES = ['admin', 'editor', 'sales'] as const
export type Role = (typeof ROLES)[number]

type UserWithRoles = { roles?: Role[] | null }

export const hasRole = (req: PayloadRequest, ...roles: Role[]): boolean => {
  const user = req.user as UserWithRoles | null | undefined
  if (!user?.roles) return false
  return user.roles.includes('admin') || user.roles.some((r) => roles.includes(r))
}

export const isAdmin: Access = ({ req }) => hasRole(req, 'admin')
export const isAdminField: FieldAccess = ({ req }) => hasRole(req, 'admin')
export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

/** Write access for the given roles (admin is always included). */
export const canWrite =
  (...roles: Role[]): Access =>
  ({ req }) =>
    hasRole(req, ...roles)

/**
 * Public read of content collections: anonymous visitors (and the site's own
 * server-side queries, which run without a user) see only published documents;
 * anyone logged into the admin sees drafts too.
 */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true
  return { status: { equals: 'published' } }
}
