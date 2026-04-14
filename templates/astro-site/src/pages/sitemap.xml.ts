import type { APIRoute } from 'astro'
import { payload } from '../lib/payload'
import { sitemapCollections } from '../lib/sitemap-config'

// Maps collection slugs to their payload client fetch methods.
// Each method returns { docs: T[] } with the correct depth and filters.
const collectionFetchers: Record<string, () => Promise<{ docs: any[] }>> = {
  'services': () => payload.getAllServices(),
  'locations': () => payload.getAllLocations(),
  'service-pages': () => payload.getAllServicePages(),
  'blog-posts': () => payload.getAllBlogPosts(),
  'pages': () => payload.getAllPages(),
}

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  // Fetch all collections in parallel
  const results = await Promise.all(
    sitemapCollections.map((config) => {
      const fetcher = collectionFetchers[config.slug]
      if (!fetcher) {
        console.warn(`[sitemap] No fetcher for collection "${config.slug}"`)
        return Promise.resolve({ docs: [] })
      }
      return fetcher()
    }),
  )

  const urls: Array<{ loc: string; lastmod?: string; changefreq: string; priority: number }> = [
    { loc: baseUrl, changefreq: 'weekly', priority: 1.0 },
    ...sitemapCollections.flatMap((config, i) =>
      results[i].docs.map((doc) => ({
        loc: `${baseUrl}${config.pathPrefix}${config.getPath(doc)}`,
        lastmod: doc.updatedAt,
        changefreq: config.changefreq,
        priority: config.priority,
      })),
    ),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
