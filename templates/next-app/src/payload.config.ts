import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import {
  Contacts, Pages, Media, Users,
  Services, Locations, ServicePages,
  BlogPosts, FAQs, Testimonials, TeamMembers,
} from './collections'
import { SiteSettings } from './globals/SiteSettings'
import { getPlugins } from './plugins'
import { twentyWebhookHandler } from './webhooks/twenty-handler'
import { resendWebhookHandler } from './webhooks/resend-handler'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
    components: {
      afterDashboard: ['/src/components/DeployButton'],
    },
    livePreview: {
      url: ({ data, collectionConfig, locale }) => {
        const astroUrl = process.env.PUBLIC_ASTRO_URL || 'http://localhost:4400'
        const slug = (data as any)?.slug || ''
        const collection = collectionConfig?.slug || ''
        const localeParam = locale?.code && locale.code !== 'en' ? `&locale=${locale.code}` : ''
        const token = process.env.PREVIEW_SECRET || ''
        return `${astroUrl}/preview?collection=${collection}&slug=${slug}&token=${token}${localeParam}`
      },
      collections: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Spanish', code: 'es' },
      { label: 'French', code: 'fr' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  collections: [
    Pages, Media, Users, Services, Locations, ServicePages,
    BlogPosts, FAQs, Testimonials, TeamMembers,
    ...(process.env.TWENTY_API_URL ? [Contacts] : []),
  ],
  globals: [SiteSettings],
  plugins: getPlugins(),
  endpoints: [
    ...(process.env.TWENTY_API_URL && process.env.TWENTY_WEBHOOK_SECRET ? [{
      path: '/webhooks/twenty',
      method: 'post' as const,
      handler: twentyWebhookHandler,
    }] : []),
    ...(process.env.RESEND_WEBHOOK_SECRET ? [{
      path: '/webhooks/resend',
      method: 'post' as const,
      handler: resendWebhookHandler,
    }] : []),
  ],
  editor: lexicalEditor(),
  // Email via Resend — required for form builder emails and auth (password reset, etc.)
  ...(process.env.RESEND_API_KEY && {
    email: resendAdapter({
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
      defaultFromName: process.env.NEXT_PUBLIC_SITE_NAME || 'Site Name',
      apiKey: process.env.RESEND_API_KEY,
    }),
  }),
  secret: process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('PAYLOAD_SECRET is required in production') })()
    : 'dev-secret-do-not-use-in-production'),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // DATABASE_URL is set by init-project.sh with the correct port.
      // No fallback — if missing, Payload should fail immediately rather than
      // silently connecting to the wrong port.
      connectionString: process.env.DATABASE_URL || (() => {
        throw new Error(
          'DATABASE_URL is not set. Run ./scripts/init-project.sh or check your .env.local file.',
        )
      })(),
    },
  }),
})
