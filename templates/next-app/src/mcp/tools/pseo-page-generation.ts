import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

import { SITE_NAME } from './pseo-constants'

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export const pseoPageGenerationTools = [
  {
    name: 'generate_service_pages',
    description:
      'Cross-product all published services × locations to create service-page records. The core pSEO engine.',
    parameters: {
      serviceFilter: z.string().optional(),
      locationFilter: z.string().optional(),
      dryRun: z.boolean().optional(),
      batchSize: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const serviceFilter = args.serviceFilter as string | undefined
        const locationFilter = args.locationFilter as string | undefined
        const dryRun = args.dryRun as boolean | undefined
        const limit = Math.min((args.batchSize as number | undefined) ?? 50, 100)

        // Fetch services
        const serviceWhere: Record<string, unknown> = { _status: { equals: 'published' } }
        if (serviceFilter) {
          serviceWhere.slug = {
            in: serviceFilter.split(',').map((s) => s.trim()),
          }
        }
        const services = await req.payload.find({
          collection: 'services',
          where: serviceWhere as any,
          limit: 500,
          depth: 0,
        })

        // Fetch locations
        const locationWhere: Record<string, unknown> = {}
        if (locationFilter) {
          locationWhere.slug = {
            in: locationFilter.split(',').map((s) => s.trim()),
          }
        }
        const locations = await req.payload.find({
          collection: 'locations',
          where: locationWhere as any,
          limit: 500,
          depth: 0,
        })

        const warnings: string[] = []
        if (services.totalDocs > services.docs.length) {
          warnings.push(
            `Warning: ${services.totalDocs} total services, only first ${services.docs.length} fetched.`,
          )
        }
        if (locations.totalDocs > locations.docs.length) {
          warnings.push(
            `Warning: ${locations.totalDocs} total locations, only first ${locations.docs.length} fetched.`,
          )
        }

        const headlines = [
          'Professional {service} for {location} Residents',
          'Trusted {service} Services in {location}',
          'Expert {service} — Serving {location}',
          'Your Local {service} Provider in {location}',
          '{service} Solutions Tailored for {location}',
        ]

        let created = 0
        let skipped = 0
        let failed = 0
        const preview: Record<string, unknown>[] = []
        const totalPairs = services.docs.length * locations.docs.length
        let pairsProcessed = 0

        for (const svc of services.docs) {
          const svcRecord = svc as Record<string, unknown>
          const svcId = svcRecord.id as string
          const svcSlug = svcRecord.slug as string
          const svcName = (svcRecord.name as string) || svcSlug

          for (const loc of locations.docs) {
            if (created + skipped + failed >= limit) break

            const locRecord = loc as Record<string, unknown>
            const locId = locRecord.id as string
            const locSlug = locRecord.slug as string
            const locDisplayName = (locRecord.displayName as string) || locSlug
            const locCity = (locRecord.city as string) || locDisplayName
            const locStateCode = (locRecord.stateCode as string) || ''

            pairsProcessed++

            // Check if page already exists
            const existing = await req.payload.find({
              collection: 'service-pages',
              where: {
                service: { equals: svcId },
                location: { equals: locId },
              },
              limit: 1,
              depth: 0,
            })

            if (existing.docs.length > 0) {
              skipped++
              continue
            }

            const slug = `${svcSlug}-in-${locSlug}`
            const title = `${svcName} in ${locDisplayName}`

            const hashCode = simpleHash(slug)
            const headlineTemplate = headlines[hashCode % headlines.length]
            const headline = headlineTemplate
              .replace('{service}', svcName)
              .replace('{location}', locDisplayName)

            const seoTitleFull = `${svcName} in ${locCity}, ${locStateCode} | ${SITE_NAME}`
            const seoTitle = seoTitleFull.length > 60 ? seoTitleFull.substring(0, 57) + '...' : seoTitleFull

            const seoDescFull = `Looking for ${svcName.toLowerCase()} in ${locCity}, ${locStateCode}? ${SITE_NAME} provides professional ${svcName.toLowerCase()} services tailored for the ${locDisplayName} area.`
            const seoDescription =
              seoDescFull.length > 160 ? seoDescFull.substring(0, 157) + '...' : seoDescFull

            if (dryRun) {
              preview.push({ slug, title, headline, seoTitle, seoDescription })
            } else {
              try {
                await req.payload.create({
                  collection: 'service-pages',
                  data: {
                    title,
                    slug,
                    service: svcId,
                    location: locId,
                    headline,
                    seoTitle,
                    seoDescription,
                    contentSource: 'template',
                    contentQualityScore: 50,
                  } as Record<string, unknown>,
                })
                created++
              } catch {
                failed++
              }
            }
          }
          if (created + skipped + failed >= limit) break
        }

        const remaining = totalPairs - pairsProcessed
        const result: Record<string, unknown> = {
          created: dryRun ? 0 : created,
          skipped,
          failed,
          totalPairs,
          ...(dryRun ? { preview } : {}),
          ...(warnings.length > 0 ? { warnings } : {}),
        }

        if (remaining > 0) {
          result.continuation = {
            remaining,
            message: 'Call again to create more',
          }
        }

        return text(JSON.stringify(result, null, 2))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return text(`Error: ${message}`)
      }
    },
  },
  {
    name: 'enrich_service_pages',
    description:
      'Find template-only service-pages below a quality threshold and return enrichment prompts for the calling agent to process.',
    parameters: {
      limit: z.number().optional(),
      serviceFilter: z.string().optional(),
      locationFilter: z.string().optional(),
      qualityThreshold: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const resultLimit = (args.limit as number | undefined) ?? 20
        const serviceFilter = args.serviceFilter as string | undefined
        const locationFilter = args.locationFilter as string | undefined
        const threshold = (args.qualityThreshold as number | undefined) ?? 70

        // Fetch more than requested when filters are applied, since post-fetch
        // filtering on populated relationships may reduce the result set.
        const hasPostFilter = !!(serviceFilter || locationFilter)
        const fetchLimit = hasPostFilter ? Math.min(resultLimit * 5, 500) : resultLimit

        const where: Record<string, unknown> = {
          contentSource: { equals: 'template' },
          contentQualityScore: { less_than: threshold },
        }

        const pages = await req.payload.find({
          collection: 'service-pages',
          where: where as any,
          limit: fetchLimit,
          depth: 2,
        })

        const results: Record<string, unknown>[] = []

        for (const page of pages.docs) {
          const p = page as Record<string, unknown>
          const pageId = p.id as string
          const slug = p.slug as string
          const currentScore = (p.contentQualityScore as number) ?? 0

          // Extract service info from populated relationship
          const service = p.service as Record<string, unknown> | null
          const serviceName = service
            ? (service.name as string) || (service.slug as string) || 'Unknown Service'
            : 'Unknown Service'
          const serviceFeatures = service
            ? (service.features as string) || ''
            : ''

          // Extract location info from populated relationship
          const location = p.location as Record<string, unknown> | null
          const locCity = location ? (location.city as string) || '' : ''
          const locState = location ? (location.stateCode as string) || '' : ''
          const locDisplayName = location
            ? (location.displayName as string) || locCity
            : ''

          // Filter by service slug if provided
          if (serviceFilter && service) {
            const svcSlug = service.slug as string
            const filterSlugs = serviceFilter.split(',').map((s) => s.trim())
            if (!filterSlugs.includes(svcSlug)) continue
          }

          // Filter by location slug if provided
          if (locationFilter && location) {
            const locSlug = location.slug as string
            const filterSlugs = locationFilter.split(',').map((s) => s.trim())
            if (!filterSlugs.includes(locSlug)) continue
          }

          const enrichmentPrompt = `Write a unique 150-200 word introduction for ${serviceName} in ${locCity}, ${locState}. Mention local relevance. Include the keyword '${serviceName} in ${locCity}' naturally. Do not use generic filler.${serviceFeatures ? ` Key features to highlight: ${serviceFeatures}` : ''}`

          // Generate 3 template-varied intro variants
          const templateVariants = [
            `${locDisplayName} residents trust our ${serviceName.toLowerCase()} services for reliable, professional results. Whether you're a homeowner or business in ${locCity}, we deliver quality solutions tailored to the local community.`,
            `Looking for expert ${serviceName.toLowerCase()} in ${locCity}, ${locState}? Our team brings years of experience serving the ${locDisplayName} area with dedicated, personalized service that makes a difference.`,
            `As a leading ${serviceName.toLowerCase()} provider in ${locDisplayName}, we understand the unique needs of ${locCity} residents. Our commitment to excellence ensures every client receives outstanding results.`,
          ]

          results.push({
            pageId,
            slug,
            currentScore,
            enrichmentPrompt,
            templateVariants,
          })
        }

        const capped = results.slice(0, resultLimit)
        const truncated = results.length > resultLimit
          ? { note: `Showing ${resultLimit} of ${results.length} matching pages. Increase limit to see more.` }
          : {}
        return text(JSON.stringify({ ...truncated, pages: capped }, null, 2))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return text(`Error: ${message}`)
      }
    },
  },
  {
    name: 'update_service_page_content',
    description:
      'Update a service-page\'s content fields after enrichment (introduction, localContent, contentSource, contentQualityScore).',
    parameters: {
      id: z.string(),
      introduction: z.string().optional(),
      localContent: z.string().optional(),
      contentSource: z.string().optional(),
      contentQualityScore: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const id = args.id as string
        const updateData: Record<string, unknown> = {}
        const updatedFields: string[] = []

        if (args.introduction !== undefined) {
          updateData.introduction = args.introduction
          updatedFields.push('introduction')
        }
        if (args.localContent !== undefined) {
          updateData.localContent = args.localContent
          updatedFields.push('localContent')
        }
        if (args.contentSource !== undefined) {
          updateData.contentSource = args.contentSource
          updatedFields.push('contentSource')
        }
        if (args.contentQualityScore !== undefined) {
          updateData.contentQualityScore = args.contentQualityScore
          updatedFields.push('contentQualityScore')
        }

        if (updatedFields.length === 0) {
          return text('Error: No fields provided to update.')
        }

        await req.payload.update({
          collection: 'service-pages',
          id,
          data: updateData,
        })

        return text(
          JSON.stringify({ id, updatedFields }, null, 2),
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return text(`Error: ${message}`)
      }
    },
  },
]
