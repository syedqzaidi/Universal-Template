import type { APIRoute } from 'astro'
import { createPayloadClient } from '@template/shared/payload'

export const GET: APIRoute = async () => {
  const payload = createPayloadClient({
    apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  })

  const [
    { docs: services },
    { docs: locations },
    { docs: servicePages },
    { docs: blogPosts },
    { docs: pages },
  ] = await Promise.all([
    payload.getAllServices(),
    payload.getAllLocations(),
    payload.getAllServicePages(),
    payload.getAllBlogPosts(),
    payload.getAllPages(),
  ])

  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  const urls = [
    { loc: baseUrl, changefreq: 'weekly', priority: 1.0 },
    ...services.map((s) => ({
      loc: `${baseUrl}/services/${s.slug}`,
      lastmod: s.updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.8,
    })),
    ...locations.map((l) => ({
      loc: `${baseUrl}/locations/${l.slug}`,
      lastmod: l.updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.7,
    })),
    ...servicePages.map((sp) => {
      const svc = typeof sp.service === 'object' ? sp.service.slug : ''
      const loc = typeof sp.location === 'object' ? sp.location.slug : ''
      return {
        loc: `${baseUrl}/services/${svc}/${loc}`,
        lastmod: sp.updatedAt,
        changefreq: 'monthly' as const,
        priority: 0.6,
      }
    }),
    ...blogPosts.map((bp) => ({
      loc: `${baseUrl}/blog/${bp.slug}`,
      lastmod: bp.updatedAt,
      changefreq: 'weekly' as const,
      priority: 0.5,
    })),
    ...pages.map((p) => ({
      loc: `${baseUrl}/${p.slug}`,
      lastmod: p.updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.4,
    })),
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
