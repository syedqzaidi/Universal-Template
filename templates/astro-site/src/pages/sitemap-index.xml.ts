import type { APIRoute } from 'astro'
import { payload } from '../lib/payload'

// NOTE: When a site exceeds 50k URLs, this generates a sitemap index referencing
// per-collection sub-sitemaps (e.g., /sitemap-services.xml). These sub-sitemap
// routes must be created as additional API endpoints when scaling to that level.
// For sites under 50k URLs, this redirects to the single /sitemap.xml endpoint.
const MAX_URLS_PER_SITEMAP = 50_000

export const GET: APIRoute = async () => {

  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  const [services, locations, servicePages, blogPosts, pages] = await Promise.all([
    payload.fetchPublished<any>('services', { limit: '1' }),
    payload.fetchPublished<any>('locations', { limit: '1' }),
    payload.fetchPublished<any>('service-pages', { limit: '1' }),
    payload.fetchPublished<any>('blog-posts', { limit: '1' }),
    payload.fetchPublished<any>('pages', { limit: '1' }),
  ])

  const totalUrls =
    services.totalDocs + locations.totalDocs + servicePages.totalDocs +
    blogPosts.totalDocs + pages.totalDocs + 1

  if (totalUrls <= MAX_URLS_PER_SITEMAP) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/sitemap.xml` },
    })
  }

  const now = new Date().toISOString()
  const sitemaps: Array<{ loc: string; lastmod: string }> = [
    { loc: `${baseUrl}/sitemap.xml`, lastmod: now },
  ]

  const collections = [
    { slug: 'services', total: services.totalDocs },
    { slug: 'locations', total: locations.totalDocs },
    { slug: 'service-pages', total: servicePages.totalDocs },
    { slug: 'blog-posts', total: blogPosts.totalDocs },
    { slug: 'pages', total: pages.totalDocs },
  ]

  for (const col of collections) {
    if (col.total === 0) continue
    const chunks = Math.ceil(col.total / MAX_URLS_PER_SITEMAP)
    for (let i = 0; i < chunks; i++) {
      sitemaps.push({
        loc: `${baseUrl}/sitemap-${col.slug}${chunks > 1 ? `-${i + 1}` : ''}.xml`,
        lastmod: now,
      })
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
