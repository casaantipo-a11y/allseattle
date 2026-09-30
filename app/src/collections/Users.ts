import type { CollectionConfig } from 'payload'

import { hasRole, isAdmin, isAdminField, ROLES } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles'],
    group: 'Settings',
  },
  auth: true,
  access: {
    // Everyone signed in sees the team list; only admins manage it. A user can
    // always update their own profile (name, password), but not their roles.
    read: ({ req }) => Boolean(req.user),
    create: isAdmin,
    delete: isAdmin,
    update: ({ req, id }) => hasRole(req, 'admin') || (req.user?.id != null && req.user.id === id),
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      options: ROLES.map((r) => ({ label: r[0].toUpperCase() + r.slice(1), value: r })),
      access: { create: isAdminField, update: isAdminField },
      admin: {
        description:
          'Admin: everything. Editor: news, events, contest, news tips. Sales: businesses, packages, banners, placement requests.',
      },
    },
  ],
}
