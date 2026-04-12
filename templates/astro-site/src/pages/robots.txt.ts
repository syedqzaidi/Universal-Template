import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin, API, and preview routes
Disallow: /admin
Disallow: /api/
Disallow: /preview
`

  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
