import type { GlobalConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateGlobal } from '../hooks/revalidate'

export const NAV_ICONS = ['none', 'home', 'news', 'directory', 'advertising', 'cars'] as const

export const Header: GlobalConfig = {
  slug: 'header',
  admin: { group: 'Settings' },
  access: { read: () => true, update: canWrite('editor') },
  hooks: { afterChange: [revalidateGlobal(['header'])] },
  fields: [
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Panorama at the top of every page. Empty = the built-in Seattle skyline.' },
    },
    {
      name: 'menu',
      type: 'array',
      admin: {
        description:
          'Main menu. "Primary" items form the top row with icons; "Secondary" items the smaller row under it (on phones both rows scroll as one).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'row',
              type: 'select',
              required: true,
              defaultValue: 'primary',
              options: [
                { label: 'Primary', value: 'primary' },
                { label: 'Secondary', value: 'secondary' },
              ],
            },
            {
              name: 'icon',
              type: 'select',
              defaultValue: 'none',
              options: NAV_ICONS.map((i) => ({ label: i, value: i })),
            },
          ],
        },
        {
          name: 'subLinks',
          type: 'array',
          admin: {
            description:
              'Optional sub-sections shown right after this item, separated by "/" (e.g. Cars: Services / For sale). Top row only.',
          },
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
      name: 'announcements',
      type: 'array',
      admin: { description: 'Short labelled links in a strip under the menu.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Contest' } },
            { name: 'text', type: 'text', required: true },
          ],
        },
        { name: 'url', type: 'text', required: true },
        {
          name: 'highlight',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Accent colour — use for the one thing that matters most.' },
        },
      ],
    },
  ],
}
