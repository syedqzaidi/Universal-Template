import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const pseoLifecycleTools = [
  {
    name: 'audit_stale_pages',
    description:
      'Find pages past their freshness deadline by content type (pillar=30 days, cluster=60 days).',
    parameters: {
      collection: z.string().optional(),
      pillarDays: z.number().optional(),
      clusterDays: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collection = (args.collection as string) || 'service-pages'
        const pillarDays = (args.pillarDays as number) || 30
        const clusterDays = (args.clusterDays as number) || 60

        const result = await req.payload.find({
          collection,
          where: { _status: { equals: 'published' } },
          limit: 500,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Truncated: showing ${result.docs.length} of ${result.totalDocs} total documents.`,
          )
        }

        const stalePages: Array<{
          id: unknown
          slug: unknown
          title: unknown
          daysSinceUpdate: number
          type: string
          threshold: number
        }> = []

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>
          const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(d.updatedAt as string).getTime()) / (1000 * 60 * 60 * 24),
          )

          // services collection → pillar; service-pages → cluster
          const type = collection === 'services' ? 'pillar' : 'cluster'
          const threshold = type === 'pillar' ? pillarDays : clusterDays

          if (daysSinceUpdate > threshold) {
            stalePages.push({
              id: d.id,
              slug: d.slug,
              title: d.title ?? d.name,
              daysSinceUpdate,
              type,
              threshold,
            })
          }
        }

        stalePages.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

        return text(
          JSON.stringify(
            {
              ...(warnings.length > 0 ? { warnings } : {}),
              collection,
              totalPages: result.totalDocs,
              staleCount: stalePages.length,
              pillarThreshold: pillarDays,
              clusterThreshold: clusterDays,
              stalePages,
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
    name: 'get_pruning_candidates',
    description:
      'Identify pages that should be refreshed, consolidated, noindex\'d, or removed based on CMS data.',
    parameters: {
      collection: z.string().optional(),
      gracePeriodDays: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collection = (args.collection as string) || 'service-pages'
        const gracePeriodDays = (args.gracePeriodDays as number) || 180

        const result = await req.payload.find({
          collection,
          limit: 500,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Truncated: showing ${result.docs.length} of ${result.totalDocs} total documents.`,
          )
        }

        const flagForReview: Array<Record<string, unknown>> = []
        const refresh: Array<Record<string, unknown>> = []
        let keepCount = 0

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>
          const now = Date.now()
          const pageAgeDays = Math.floor(
            (now - new Date(d.createdAt as string).getTime()) / (1000 * 60 * 60 * 24),
          )
          const daysSinceUpdate = Math.floor(
            (now - new Date(d.updatedAt as string).getTime()) / (1000 * 60 * 60 * 24),
          )

          // Estimate word count from available text fields
          let textContent = ''
          if (typeof d.introduction === 'string') textContent += d.introduction
          if (typeof d.localContent === 'string') textContent += d.localContent
          if (typeof d.content === 'string') textContent += d.content
          const wordCount = Math.max(1, Math.floor(textContent.length / 5))

          const qualityScore =
            typeof d.contentQualityScore === 'number' ? d.contentQualityScore : 50

          const entry = {
            id: d.id,
            slug: d.slug,
            title: d.title ?? d.name,
            pageAgeDays,
            daysSinceUpdate,
            wordCount,
            qualityScore,
          }

          if (pageAgeDays < gracePeriodDays) {
            // Too new to prune
            keepCount++
          } else if (qualityScore < 30) {
            flagForReview.push({ ...entry, action: 'FLAG_FOR_REVIEW', reason: 'Low quality score' })
          } else if (wordCount < 300) {
            refresh.push({ ...entry, action: 'REFRESH', reason: 'Thin content' })
          } else if (daysSinceUpdate > 180) {
            refresh.push({ ...entry, action: 'REFRESH', reason: 'Stale content' })
          } else {
            keepCount++
          }
        }

        return text(
          JSON.stringify(
            {
              ...(warnings.length > 0 ? { warnings } : {}),
              collection,
              totalPages: result.totalDocs,
              gracePeriodDays,
              candidates: {
                FLAG_FOR_REVIEW: flagForReview,
                REFRESH: refresh,
                KEEP_COUNT: keepCount,
              },
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
    name: 'detect_keyword_cannibalization',
    description: 'Find service-pages competing for the same primary keyword.',
    parameters: {
      collection: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collection = (args.collection as string) || 'service-pages'

        const result = await req.payload.find({
          collection,
          limit: 500,
          depth: 1,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Truncated: showing ${result.docs.length} of ${result.totalDocs} total documents.`,
          )
        }

        const keywordMap = new Map<string, Array<{ id: unknown; slug: unknown; seoTitle: unknown }>>()

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>

          let keyword = ''
          const service = d.service as Record<string, unknown> | null | undefined
          const location = d.location as Record<string, unknown> | null | undefined

          if (service && typeof service === 'object' && service.name && location && typeof location === 'object' && location.city) {
            keyword = `${service.name} in ${location.city}`.toLowerCase()
          } else if (typeof d.seoTitle === 'string' && d.seoTitle) {
            keyword = d.seoTitle.toLowerCase()
          } else {
            continue
          }

          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, [])
          }
          keywordMap.get(keyword)!.push({
            id: d.id,
            slug: d.slug,
            seoTitle: d.seoTitle,
          })
        }

        const groups: Array<{ keyword: string; count: number; pages: Array<{ id: unknown; slug: unknown; seoTitle: unknown }> }> = []

        for (const [keyword, pages] of keywordMap.entries()) {
          if (pages.length > 1) {
            groups.push({ keyword, count: pages.length, pages })
          }
        }

        groups.sort((a, b) => b.count - a.count)

        return text(
          JSON.stringify(
            {
              ...(warnings.length > 0 ? { warnings } : {}),
              totalPages: result.totalDocs,
              cannibalizedKeywords: groups.length,
              groups,
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
    name: 'generate_redirect_manifest',
    description:
      'Generate 301 redirect entries for archived/non-published services or locations and their related service-pages.',
    parameters: {
      collection: z.string(),
      status: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collection = args.collection as string
        const status = (args.status as string) || 'archived'

        if (collection !== 'services' && collection !== 'locations') {
          return text('Error: collection must be "services" or "locations".')
        }

        const archivedWhere: Record<string, unknown> =
          status === 'archived'
            ? { _status: { not_equals: 'published' } }
            : { _status: { equals: status } }
        const archivedResult = await req.payload.find({
          collection,
          where: archivedWhere as any,
          limit: 200,
          depth: 0,
        })

        const warnings: string[] = []
        if (archivedResult.totalDocs > archivedResult.docs.length) {
          warnings.push(
            `Truncated: showing ${archivedResult.docs.length} of ${archivedResult.totalDocs} archived documents.`,
          )
        }

        const redirects: Array<{ from: string; to: string; type: string }> = []
        let redirectsCreated = 0
        let redirectsFailed = 0
        let affectedPages = 0

        const fallbackUrl = collection === 'services' ? '/services' : '/'

        for (const doc of archivedResult.docs) {
          const d = doc as Record<string, unknown>
          const docId = d.id as string

          const referenceField = collection === 'services' ? 'service' : 'location'

          const relatedPages = await req.payload.find({
            collection: 'service-pages',
            where: { [referenceField]: { equals: docId } },
            limit: 500,
            depth: 0,
          })

          if (relatedPages.totalDocs > relatedPages.docs.length) {
            warnings.push(
              `Truncated service-pages for ${referenceField} ${docId}: showing ${relatedPages.docs.length} of ${relatedPages.totalDocs}.`,
            )
          }

          affectedPages += relatedPages.docs.length

          for (const page of relatedPages.docs) {
            const p = page as Record<string, unknown>
            const slug = p.slug as string
            const fromPath = `/${slug}`

            try {
              await req.payload.create({
                collection: 'redirects',
                data: {
                  from: fromPath,
                  to: fallbackUrl,
                  type: '301',
                } as Record<string, unknown>,
              })
              redirects.push({ from: fromPath, to: fallbackUrl, type: '301' })
              redirectsCreated++
            } catch (err) {
              redirectsFailed++
              redirects.push({
                from: fromPath,
                to: `FAILED: ${err instanceof Error ? err.message : String(err)}`,
                type: '301',
              })
            }
          }
        }

        return text(
          JSON.stringify(
            {
              ...(warnings.length > 0 ? { warnings } : {}),
              archivedDocs: archivedResult.docs.length,
              affectedPages,
              redirectsCreated,
              redirectsFailed,
              redirects,
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
