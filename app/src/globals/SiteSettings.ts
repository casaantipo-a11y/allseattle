import type { GlobalConfig } from 'payload'

import { canWrite } from '../access/roles'
import { revalidateGlobal } from '../hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: () => true, update: canWrite() },
  hooks: { afterChange: [revalidateGlobal(['site-settings'])] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'AllSeattle' },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: "If you're not on this website, you don't exist.",
            },
            {
              name: 'description',
              type: 'textarea',
              defaultValue:
                'AllSeattle — the Seattle city portal for news, businesses, events, jobs and cars.',
              admin: { description: 'Default description for search engines and link previews.' },
            },
          ],
        },
        {
          label: 'Contacts',
          fields: [
            { name: 'phone', type: 'text', defaultValue: '+1 (206) 331-8216' },
            { name: 'email', type: 'email' },
            { name: 'address', type: 'text', defaultValue: 'Seattle, WA' },
            {
              name: 'socials',
              type: 'group',
              admin: { description: 'Leave empty to show "Coming soon" on the site.' },
              fields: [
                { name: 'instagram', type: 'text' },
                { name: 'facebook', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Analytics & notifications',
          fields: [
            {
              name: 'ga4MeasurementId',
              type: 'text',
              admin: {
                description: 'G-XXXXXXX. Loaded only after a visitor accepts cookies.',
              },
            },
            {
              name: 'searchConsoleVerification',
              type: 'text',
              admin: { description: 'The content value of the google-site-verification meta tag.' },
            },
            {
              name: 'telegramChatId',
              type: 'text',
              admin: { description: 'Where new submissions are announced (needs TELEGRAM_BOT_TOKEN).' },
            },
            {
              name: 'notifyEmail',
              type: 'email',
              admin: { description: 'Email copy of new submissions (needs RESEND_API_KEY).' },
            },
          ],
        },
      ],
    },
  ],
}
