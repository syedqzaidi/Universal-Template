import { z } from 'zod'
import type { PayloadRequest } from 'payload'
import { google } from 'googleapis'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const seoIndexingTools = [
  {
    name: 'generate_sitemap',
    description: 'Generate an XML sitemap for all published pages.',
    parameters: {},
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const result = await req.payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        limit: 1000,
      })
      const urls = result.docs
        .map((page: Record<string, unknown>) => {
          const slug = typeof page.slug === 'string' ? page.slug : ''
          const loc = slug === 'home' || slug === '' ? baseUrl : `${baseUrl}/${slug}`
          return `  <url><loc>${loc}</loc></url>`
        })
        .join('\n')
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
      return text(xml)
    },
  },
  {
    name: 'submit_to_google_index',
    description: 'Submit a URL to the Google Indexing API for crawling.',
    parameters: { url: z.string() },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const url = args.url as string
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      if (!email || !rawKey) {
        return text('Error: GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY environment variables are not set.')
      }
      const key = rawKey.replace(/\\n/g, '\n')
      try {
        const auth = new google.auth.JWT({
          email,
          key,
          scopes: ['https://www.googleapis.com/auth/indexing'],
        })
        const indexing = google.indexing({ version: 'v3', auth })
        await indexing.urlNotifications.publish({
          requestBody: { url, type: 'URL_UPDATED' },
        })
        return text(`URL submitted to Google Index for crawling: ${url}`)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return text(`Error submitting URL to Google Index: ${message}`)
      }
    },
  },
  {
    name: 'remove_from_google_index',
    description: 'Remove a URL from the Google Index.',
    parameters: { url: z.string() },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const url = args.url as string
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      if (!email || !rawKey) {
        return text('Error: GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY environment variables are not set.')
      }
      const key = rawKey.replace(/\\n/g, '\n')
      try {
        const auth = new google.auth.JWT({
          email,
          key,
          scopes: ['https://www.googleapis.com/auth/indexing'],
        })
        const indexing = google.indexing({ version: 'v3', auth })
        await indexing.urlNotifications.publish({
          requestBody: { url, type: 'URL_DELETED' },
        })
        return text(`URL submitted for removal from Google Index: ${url}`)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return text(`Error removing URL from Google Index: ${message}`)
      }
    },
  },
  {
    name: 'audit_seo_fields',
    description: 'Audit all published pages for missing SEO fields (meta title, description, image).',
    parameters: {},
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const result = await req.payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        limit: 1000,
      })
      const report = result.docs.map((page: Record<string, unknown>) => {
        const meta = (page.meta ?? {}) as Record<string, unknown>
        const missing: string[] = []
        if (!meta.title) missing.push('meta.title')
        if (!meta.description) missing.push('meta.description')
        if (!meta.image) missing.push('meta.image')
        return {
          id: page.id,
          slug: page.slug,
          title: page.title,
          missing,
        }
      }).filter((entry) => entry.missing.length > 0)
      return text(JSON.stringify(report, null, 2))
    },
  },
  {
    name: 'generate_json_ld',
    description: 'Generate Article schema.org JSON-LD for a page.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const page = await req.payload.findByID({ collection: 'pages', id }) as Record<string, unknown>
      const meta = (page.meta ?? {}) as Record<string, unknown>
      const slug = typeof page.slug === 'string' ? page.slug : ''
      const pageUrl = slug === 'home' || slug === '' ? baseUrl : `${baseUrl}/${slug}`
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: meta.title ?? page.title ?? '',
        description: meta.description ?? '',
        url: pageUrl,
        datePublished: page.publishedAt ?? page.createdAt ?? '',
        dateModified: page.updatedAt ?? '',
      }
      return text(JSON.stringify(jsonLd, null, 2))
    },
  },
  {
    name: 'generate_breadcrumb_schema',
    description: 'Generate BreadcrumbList JSON-LD for a page using its breadcrumbs field.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const page = await req.payload.findByID({ collection: 'pages', id }) as Record<string, unknown>
      const breadcrumbs = Array.isArray(page.breadcrumbs) ? page.breadcrumbs : []
      const itemListElement = breadcrumbs.map(
        (crumb: Record<string, unknown>, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label ?? '',
          item: crumb.url
            ? `${baseUrl}${crumb.url}`
            : baseUrl,
        }),
      )
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      }
      return text(JSON.stringify(jsonLd, null, 2))
    },
  },
  {
    name: 'generate_hreflang_tags',
    description: 'Generate hreflang link tags for a page across supported locales.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const locales = ['en', 'es', 'fr']
      const page = await req.payload.findByID({ collection: 'pages', id }) as Record<string, unknown>
      const slug = typeof page.slug === 'string' ? page.slug : ''
      const tags = locales
        .map((locale) => {
          const href =
            slug === 'home' || slug === ''
              ? `${baseUrl}/${locale}`
              : `${baseUrl}/${locale}/${slug}`
          return `<link rel="alternate" hreflang="${locale}" href="${href}" />`
        })
        .join('\n')
      return text(tags)
    },
  },
  {
    name: 'generate_robots_txt',
    description: 'Generate a standard robots.txt file content.',
    parameters: {},
    handler: async (_args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`
      return text(robotsTxt)
    },
  },
]
