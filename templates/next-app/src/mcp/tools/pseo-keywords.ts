import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const pseoKeywordTools = [
  {
    name: 'generate_keywords',
    description:
      'Generate the full keyword set for a service+location combination using the pSEO keyword formula. Pure computation, no database access.',
    parameters: {
      serviceName: z.string(),
      city: z.string(),
      state: z.string(),
      stateCode: z.string(),
      features: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const serviceName = args.serviceName as string
        const city = args.city as string
        const state = args.state as string
        const stateCode = args.stateCode as string
        const featuresRaw = args.features as string | undefined

        const primary = `${serviceName} in ${city} ${stateCode}`

        const secondary = [
          `${city} ${serviceName}`,
          `${serviceName} company ${city}`,
          `best ${serviceName} ${city}`,
          `affordable ${serviceName} ${city}`,
          `${serviceName} services ${city} ${stateCode}`,
          `professional ${serviceName} ${city}`,
        ]

        const longTail = [
          `how much does ${serviceName} cost in ${city}`,
          `emergency ${serviceName} ${city} ${stateCode}`,
          `${serviceName} near me`,
          `best ${serviceName} company in ${city} ${stateCode}`,
        ]

        const geoModifiers = [city, `${city} ${state}`, `${city} ${stateCode}`, stateCode]

        const featureBased: string[] = []
        if (featuresRaw) {
          const featureList = featuresRaw.split(',').map((f) => f.trim()).filter(Boolean)
          for (const feature of featureList) {
            featureBased.push(`${feature} ${city}`)
          }
        }

        return text(
          JSON.stringify({ primary, secondary, longTail, geoModifiers, featureBased }, null, 2),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'validate_keyword_placement',
    description:
      "Check a service-page's SEO fields for correct keyword usage (placement, density, lengths).",
    parameters: {
      id: z.string(),
      primaryKeyword: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const id = args.id as string
        const page = (await req.payload.findByID({
          collection: 'service-pages',
          id,
          depth: 1,
        })) as Record<string, unknown>

        const service = page.service as Record<string, unknown> | null
        const location = page.location as Record<string, unknown> | null

        const keyword =
          (args.primaryKeyword as string) ||
          `${service?.name ?? ''} in ${(location as any)?.city ?? ''}`

        const keywordLower = keyword.toLowerCase()

        const seoTitle = ((page.seoTitle as string) || '').trim()
        const headline = ((page.headline as string) || '').trim()
        const seoDescription = ((page.seoDescription as string) || '').trim()
        const introduction = ((page.introduction as string) || '').trim()
        const localContent = ((page.localContent as string) || '').trim()

        const issues: string[] = []
        const passes: string[] = []

        // seoTitle contains keyword
        if (seoTitle.toLowerCase().includes(keywordLower)) {
          passes.push('SEO title contains primary keyword')
        } else {
          issues.push('SEO title does not contain primary keyword')
        }

        // seoTitle length
        if (seoTitle.length <= 60) {
          passes.push(`SEO title length OK (${seoTitle.length}/60)`)
        } else {
          issues.push(`SEO title too long (${seoTitle.length}/60)`)
        }

        // headline contains keyword
        if (headline.toLowerCase().includes(keywordLower)) {
          passes.push('Headline (H1) contains primary keyword')
        } else {
          issues.push('Headline (H1) does not contain primary keyword')
        }

        // seoDescription contains keyword
        if (seoDescription.toLowerCase().includes(keywordLower)) {
          passes.push('Meta description contains primary keyword')
        } else {
          issues.push('Meta description does not contain primary keyword')
        }

        // seoDescription length
        if (seoDescription.length <= 160) {
          passes.push(`Meta description length OK (${seoDescription.length}/160)`)
        } else {
          issues.push(`Meta description too long (${seoDescription.length}/160)`)
        }

        // introduction contains keyword in first 100 words
        const first100Words = introduction.split(/\s+/).slice(0, 100).join(' ')
        if (first100Words.toLowerCase().includes(keywordLower)) {
          passes.push('Introduction contains keyword in first 100 words')
        } else {
          issues.push('Introduction does not contain keyword in first 100 words')
        }

        // Keyword stuffing check
        const allText = `${seoTitle} ${headline} ${seoDescription} ${introduction} ${localContent}`
        const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        const keywordCount = (allText.match(regex) || []).length
        if (keywordCount > 8) {
          issues.push(`Possible keyword stuffing: keyword appears ${keywordCount} times (>8)`)
        } else {
          passes.push(`Keyword density OK (${keywordCount} occurrences)`)
        }

        const totalChecks = passes.length + issues.length
        const score = totalChecks > 0 ? Math.round((passes.length / totalChecks) * 100) : 0

        return text(
          JSON.stringify(
            {
              pageId: id,
              primaryKeyword: keyword,
              score,
              passes,
              issues,
              keywordCount,
              metaTitleLength: seoTitle.length,
              metaDescriptionLength: seoDescription.length,
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
