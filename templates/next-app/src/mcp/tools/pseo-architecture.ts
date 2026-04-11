import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const pseoArchitectureTools = [
  {
    name: 'build_internal_links',
    description:
      'For a service-page, generate recommended internal links based on linking architecture (sibling pages, cross-service pages, pillar page).',
    parameters: {
      id: z.string(),
      maxSiblingLinks: z.number().optional(),
      maxCrossServiceLinks: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const id = args.id as string
        const maxSiblingLinks = (args.maxSiblingLinks as number) || 5
        const maxCrossServiceLinks = (args.maxCrossServiceLinks as number) || 3

        const page = (await req.payload.findByID({
          collection: 'service-pages',
          id,
          depth: 1,
        })) as Record<string, unknown>

        const service = page.service as Record<string, unknown>
        const location = page.location as Record<string, unknown>
        const serviceId = service.id as string
        const locationId = location.id as string
        const serviceName = service.name as string
        const locationCity = location.city as string

        // Sibling pages: same service, different location
        const siblings = await req.payload.find({
          collection: 'service-pages',
          where: {
            service: { equals: serviceId },
            location: { not_equals: locationId },
          },
          limit: maxSiblingLinks,
          depth: 1,
        })

        const siblingLinks = siblings.docs.map((doc) => {
          const d = doc as Record<string, unknown>
          const siblingLocation = d.location as Record<string, unknown>
          return {
            slug: d.slug,
            title: d.title,
            anchorText: `${serviceName} in ${siblingLocation.city}`,
          }
        })

        // Cross-service pages: different service, same location
        const crossService = await req.payload.find({
          collection: 'service-pages',
          where: {
            location: { equals: locationId },
            service: { not_equals: serviceId },
          },
          limit: maxCrossServiceLinks,
          depth: 1,
        })

        const crossServiceLinks = crossService.docs.map((doc) => {
          const d = doc as Record<string, unknown>
          const crossSvc = d.service as Record<string, unknown>
          const crossServiceName = crossSvc.name as string
          return {
            slug: d.slug,
            title: d.title,
            anchorText: `${crossServiceName} in ${locationCity}`,
          }
        })

        // Pillar link: parent service
        const pillarLink = {
          slug: `/services/${service.slug}`,
          anchorText: `${serviceName} Services`,
        }

        return text(
          JSON.stringify(
            {
              pageId: id,
              pillarLink,
              siblingLinks,
              crossServiceLinks,
              totalRecommended: siblingLinks.length + crossServiceLinks.length + 1,
            },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'find_orphan_pages_advanced',
    description:
      'Find service-pages with fewer than a minimum number of inbound references (from relatedServicePages field). Note: relatedServicePages must be populated separately — use build_internal_links to generate recommendations, then update pages.',
    parameters: {
      minInboundLinks: z.number().optional(),
      collection: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const minInboundLinks = (args.minInboundLinks as number) || 3
        const collection = (args.collection as string) || 'service-pages'

        const result = await req.payload.find({
          collection,
          depth: 0,
          limit: 500,
        })

        const docs = result.docs as Record<string, unknown>[]
        const warnings: string[] = []
        if (result.totalDocs > docs.length) {
          warnings.push(
            `Truncated: showing ${docs.length} of ${result.totalDocs} total documents.`,
          )
        }

        // Build inbound link map
        const inboundMap = new Map<string, number>()
        for (const doc of docs) {
          const docId = doc.id as string
          if (!inboundMap.has(docId)) {
            inboundMap.set(docId, 0)
          }
          const related = doc.relatedServicePages as string[] | undefined
          if (Array.isArray(related)) {
            for (const refId of related) {
              inboundMap.set(refId, (inboundMap.get(refId) || 0) + 1)
            }
          }
        }

        // Find orphans
        const orphans = docs
          .map((doc) => {
            const docId = doc.id as string
            return {
              id: docId,
              slug: doc.slug as string,
              title: doc.title as string,
              inboundCount: inboundMap.get(docId) || 0,
            }
          })
          .filter((p) => p.inboundCount < minInboundLinks)
          .sort((a, b) => a.inboundCount - b.inboundCount)

        return text(
          JSON.stringify(
            {
              totalPages: docs.length,
              orphanCount: orphans.length,
              minInboundLinks,
              orphans,
              ...(warnings.length > 0 ? { warnings } : {}),
            },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'audit_slugs',
    description:
      'Validate all slugs in a collection against URL structure rules (lowercase, hyphens, length, depth).',
    parameters: {
      collection: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collection = (args.collection as string) || 'service-pages'

        const result = await req.payload.find({
          collection,
          depth: 0,
          limit: 500,
        })

        const docs = result.docs as Record<string, unknown>[]
        const warnings: string[] = []
        if (result.totalDocs > docs.length) {
          warnings.push(
            `Truncated: showing ${docs.length} of ${result.totalDocs} total documents.`,
          )
        }

        const issues: { id: string; slug: string; problems: string[] }[] = []

        for (const doc of docs) {
          const id = doc.id as string
          const slug = (doc.slug as string) || ''
          const problems: string[] = []

          if (slug !== slug.toLowerCase()) {
            problems.push('Contains uppercase characters')
          }

          if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
            problems.push('Contains invalid characters (only lowercase alphanumeric and hyphens allowed)')
          }

          if (slug.includes('--')) {
            problems.push('Contains double hyphens')
          }

          if (slug.startsWith('-') || slug.endsWith('-')) {
            problems.push('Has leading or trailing hyphens')
          }

          const segments = slug.split('/')
          for (const segment of segments) {
            if (segment.length > 60) {
              problems.push(`Segment exceeds 60 characters: "${segment}"`)
            }
          }

          if (segments.length > 3) {
            problems.push(`URL depth exceeds 3 (has ${segments.length} segments)`)
          }

          if (!/[a-z]/.test(slug)) {
            problems.push('Does not contain at least one letter')
          }

          if (collection === 'locations') {
            if (!/^[a-z]+-[a-z]{2}$/.test(slug) && !/^[a-z]+-[a-z]+-[a-z]{2}$/.test(slug)) {
              problems.push('Does not match {city}-{stateCode} pattern')
            }
          }

          if (problems.length > 0) {
            issues.push({ id, slug, problems })
          }
        }

        return text(
          JSON.stringify(
            {
              collection,
              totalDocs: docs.length,
              validCount: docs.length - issues.length,
              invalidCount: issues.length,
              issues,
              ...(warnings.length > 0 ? { warnings } : {}),
            },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'audit_canonical_consistency',
    description:
      'Check canonical URL construction rules across published pages.',
    parameters: {
      baseUrl: z.string(),
      trailingSlash: z.boolean().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const rawBaseUrl = args.baseUrl as string
        const trailingSlash = (args.trailingSlash as boolean) ?? false
        const baseUrl = rawBaseUrl.replace(/\/+$/, '')

        const collectionConfigs: { collection: string; prefix: string }[] = [
          { collection: 'services', prefix: 'services' },
          { collection: 'locations', prefix: 'locations' },
          { collection: 'service-pages', prefix: 'service-pages' },
        ]

        const allIssues: {
          id: string
          collection: string
          slug: string
          expectedCanonical: string
          problems: string[]
        }[] = []
        const allCanonicals = new Map<string, { id: string; collection: string }[]>()
        let totalChecked = 0

        for (const config of collectionConfigs) {
          const result = await req.payload.find({
            collection: config.collection,
            where: { _status: { equals: 'published' } },
            depth: 0,
            limit: 200,
          })

          const docs = result.docs as Record<string, unknown>[]

          for (const doc of docs) {
            totalChecked++
            const id = doc.id as string
            const slug = (doc.slug as string) || ''
            const expectedCanonical = trailingSlash
              ? `${baseUrl}/${config.prefix}/${slug}/`
              : `${baseUrl}/${config.prefix}/${slug}`
            const problems: string[] = []

            if (!expectedCanonical.startsWith('https://')) {
              problems.push('Canonical is not an absolute HTTPS URL')
            }

            if (expectedCanonical.startsWith('http://')) {
              problems.push('Canonical uses HTTP instead of HTTPS')
            }

            if (expectedCanonical !== expectedCanonical.toLowerCase()) {
              problems.push('Canonical contains uppercase characters')
            }

            if (!trailingSlash && expectedCanonical.endsWith('/') && expectedCanonical !== `${baseUrl}/`) {
              problems.push('Canonical has trailing slash')
            }

            if (expectedCanonical.includes('?')) {
              problems.push('Canonical contains query parameters')
            }

            if (!slug) {
              problems.push('Slug is empty')
            }

            // Track for duplicate detection
            const entries = allCanonicals.get(expectedCanonical) || []
            entries.push({ id, collection: config.collection })
            allCanonicals.set(expectedCanonical, entries)

            if (problems.length > 0) {
              allIssues.push({
                id,
                collection: config.collection,
                slug,
                expectedCanonical,
                problems,
              })
            }
          }
        }

        // Find duplicate canonicals
        const duplicateCanonicals: { canonical: string; pages: { id: string; collection: string }[] }[] = []
        for (const [canonical, entries] of allCanonicals.entries()) {
          if (entries.length > 1) {
            duplicateCanonicals.push({ canonical, pages: entries })
          }
        }

        return text(
          JSON.stringify(
            {
              baseUrl,
              totalChecked,
              validCount: totalChecked - allIssues.length,
              issueCount: allIssues.length,
              duplicateCanonicals,
              issues: allIssues,
            },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
]
