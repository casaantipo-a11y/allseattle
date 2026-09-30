import type { GlobalConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateGlobal } from '../hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: { group: 'Settings' },
  access: { read: () => true, update: canWrite() },
  hooks: { afterChange: [revalidateGlobal(['footer'])] },
  fields: [
    {
      name: 'columns',
      type: 'array',
      admin: { description: 'Link columns. Contacts and socials come from Site settings.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: 'AllSeattle. All rights reserved.',
      admin: { description: 'The © and the current year are added automatically.' },
    },
  ],
}
