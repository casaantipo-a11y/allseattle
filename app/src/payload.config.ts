import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig, type Plugin } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { BusinessCategories } from './collections/BusinessCategories'
import { Businesses } from './collections/Businesses'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { NewsCategories } from './collections/NewsCategories'
import { Packages } from './collections/Packages'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { Promotions } from './collections/Promotions'
import { Submissions } from './collections/Submissions'
import { Users } from './collections/Users'
import { env, s3Enabled } from './env'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const plugins: Plugin[] = [
  seoPlugin({
    collections: ['news', 'pages', 'businesses'],
    uploadsCollection: 'media',
    tabbedUI: true,
    generateTitle: ({ doc }) =>
      `${(doc as { title?: string; name?: string }).title ?? (doc as { name?: string }).name ?? ''} | AllSeattle`,
    generateDescription: ({ doc }) =>
      (doc as { excerpt?: string }).excerpt ??
      (doc as { intro?: string }).intro ??
      (doc as { summary?: string }).summary ??
      '',
  }),
]

// Cloudflare R2 through the S3 adapter, only when configured. Without it
// uploads land in ./media, which is what local development uses.
if (s3Enabled) {
  plugins.push(
    s3Storage({
      collections: {
        media: env.S3_PUBLIC_URL
          ? {
              generateFileURL: ({ filename, prefix }) =>
                [env.S3_PUBLIC_URL, prefix, filename].filter(Boolean).join('/'),
            }
          : true,
      },
      bucket: env.S3_BUCKET!,
      config: {
        endpoint: env.S3_ENDPOINT,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID!,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
        },
      },
    }),
  )
}

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      graphics: {
        Logo: '/components/admin/AdminGraphics#AdminLogo',
        Icon: '/components/admin/AdminGraphics#AdminIcon',
      },
    },
    meta: {
      titleSuffix: ' — AllSeattle admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/favicon.svg' }],
    },
  },
  // The owner reads Russian, the sales team English: English by default, each
  // user can switch to Russian in their account settings.
  i18n: {
    supportedLanguages: { en, ru },
    fallbackLanguage: 'en',
  },
  collections: [
    News,
    NewsCategories,
    Businesses,
    BusinessCategories,
    Packages,
    Promotions,
    Products,
    Submissions,
    Pages,
    Media,
    Documents,
    Users,
  ],
  globals: [SiteSettings, Header, Footer],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({ pool: { connectionString: env.DATABASE_URL } }),
  sharp,
  plugins,
})
