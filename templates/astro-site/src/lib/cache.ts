type AstroContext = { response: { headers: Headers } }

// CDN cache: serve stale content instantly while revalidating in the background.
// s-maxage=3600  → CDN caches for 1 hour
// stale-while-revalidate=86400 → serve stale for up to 24h while fetching fresh copy
// No caching in dev so you always see fresh CMS content.
export function setCacheHeaders(astro: AstroContext): void {
  if (import.meta.env.DEV) return
  astro.response.headers.set(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  )
}
