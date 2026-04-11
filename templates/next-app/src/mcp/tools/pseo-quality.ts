import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

function extractLexicalText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  if (n.type === 'text' && typeof n.text === 'string') return n.text
  if (Array.isArray(n.children)) {
    return (n.children as unknown[]).map(extractLexicalText).join(' ')
  }
  const rootKeys = ['root', 'editorState']
  for (const key of rootKeys) {
    if (key in n) return extractLexicalText(n[key])
  }
  return ''
}

function extractHeadings(node: unknown): Array<{ tag: string; text: string }> {
  if (!node || typeof node !== 'object') return []
  const n = node as Record<string, unknown>
  const results: Array<{ tag: string; text: string }> = []
  if (n.type === 'heading' && typeof n.tag === 'string') {
    results.push({ tag: n.tag, text: extractLexicalText(n) })
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children as unknown[]) {
      results.push(...extractHeadings(child))
    }
  }
  const rootKeys = ['root', 'editorState']
  for (const key of rootKeys) {
    if (key in n) results.push(...extractHeadings(n[key]))
  }
  return results
}

function getTrigrams(str: string): Set<string> {
  const s = str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  const trigrams = new Set<string>()
  for (let i = 0; i <= s.length - 3; i++) {
    trigrams.add(s.substring(i, i + 3))
  }
  return trigrams
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  for (const item of a) {
    if (b.has(item)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export const pseoQualityTools = [
  {
    name: 'validate_content_uniqueness',
    description:
      'Trigram Jaccard similarity check across service-pages to find near-duplicate content.',
    parameters: {
      serviceFilter: z.string().optional(),
      similarityThreshold: z.number().optional(),
      limit: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const serviceFilter = args.serviceFilter as string | undefined
        const similarityThreshold = (args.similarityThreshold as number) ?? 0.4
        const limit = (args.limit as number) ?? 100

        const where: Record<string, unknown> = {}

        if (serviceFilter) {
          const slugs = serviceFilter.split(',').map((s) => s.trim()).filter(Boolean)
          const servicesResult = await req.payload.find({
            collection: 'services',
            where: { slug: { in: slugs } },
            limit: 100,
            depth: 0,
          })
          const serviceIds = servicesResult.docs.map((d) => (d as Record<string, unknown>).id)
          where.service = { in: serviceIds }
        }

        const result = await req.payload.find({
          collection: 'service-pages',
          where: where as any,
          limit,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Showing ${result.docs.length} of ${result.totalDocs} total service-pages. Increase limit to analyze more.`,
          )
        }

        const pages = result.docs.map((doc) => {
          const d = doc as Record<string, unknown>
          let content = ''
          for (const field of ['introduction', 'localContent']) {
            const val = d[field]
            if (typeof val === 'string') {
              content += ' ' + val
            } else if (val && typeof val === 'object') {
              content += ' ' + extractLexicalText(val)
            }
          }
          return {
            id: d.id as string,
            slug: d.slug as string,
            trigrams: getTrigrams(content),
          }
        })

        const duplicatePairs: Array<{
          pageA: { id: string; slug: string }
          pageB: { id: string; slug: string }
          similarity: number
        }> = []

        for (let i = 0; i < pages.length; i++) {
          for (let j = i + 1; j < pages.length; j++) {
            const similarity = jaccardSimilarity(pages[i].trigrams, pages[j].trigrams)
            if (similarity >= similarityThreshold) {
              duplicatePairs.push({
                pageA: { id: pages[i].id, slug: pages[i].slug },
                pageB: { id: pages[j].id, slug: pages[j].slug },
                similarity: Math.round(similarity * 1000) / 1000,
              })
            }
          }
        }

        duplicatePairs.sort((a, b) => b.similarity - a.similarity)

        return text(
          JSON.stringify(
            {
              totalPagesAnalyzed: pages.length,
              duplicatePairs,
              threshold: similarityThreshold,
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
    name: 'content_quality_report',
    description:
      'Segment all service-pages by quality score band and return action recommendations per band.',
    parameters: {
      serviceFilter: z.string().optional(),
      minScore: z.number().optional(),
      maxScore: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const serviceFilter = args.serviceFilter as string | undefined
        const minScore = args.minScore as number | undefined
        const maxScore = args.maxScore as number | undefined

        const where: Record<string, unknown> = {}

        if (serviceFilter) {
          const slugs = serviceFilter.split(',').map((s) => s.trim()).filter(Boolean)
          const servicesResult = await req.payload.find({
            collection: 'services',
            where: { slug: { in: slugs } },
            limit: 100,
            depth: 0,
          })
          const serviceIds = servicesResult.docs.map((d) => (d as Record<string, unknown>).id)
          where.service = { in: serviceIds }
        }

        const result = await req.payload.find({
          collection: 'service-pages',
          where: where as any,
          limit: 500,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Showing ${result.docs.length} of ${result.totalDocs} total service-pages. Results may be incomplete.`,
          )
        }

        let pages = result.docs.map((doc) => {
          const d = doc as Record<string, unknown>
          return {
            id: d.id as string,
            slug: d.slug as string,
            title: (d.seoTitle as string) || (d.slug as string),
            score: (d.contentQualityScore as number) ?? 0,
          }
        })

        if (minScore !== undefined) {
          pages = pages.filter((p) => p.score >= minScore)
        }
        if (maxScore !== undefined) {
          pages = pages.filter((p) => p.score <= maxScore)
        }

        const bands: Record<string, { label: string; count: number; pages: typeof pages }> = {
          '0-30': { label: 'Deindex risk — content too thin or duplicate', count: 0, pages: [] },
          '31-50': { label: 'At risk — needs enrichment urgently', count: 0, pages: [] },
          '51-70': { label: 'Acceptable — schedule for enrichment', count: 0, pages: [] },
          '71-85': { label: 'Good — minor improvements possible', count: 0, pages: [] },
          '86-100': { label: 'Excellent — no action needed', count: 0, pages: [] },
        }

        for (const page of pages) {
          let band: string
          if (page.score <= 30) band = '0-30'
          else if (page.score <= 50) band = '31-50'
          else if (page.score <= 70) band = '51-70'
          else if (page.score <= 85) band = '71-85'
          else band = '86-100'

          bands[band].count++
          bands[band].pages.push(page)
        }

        const averageScore =
          pages.length > 0
            ? Math.round((pages.reduce((sum, p) => sum + p.score, 0) / pages.length) * 100) / 100
            : 0

        return text(
          JSON.stringify(
            {
              totalPages: pages.length,
              averageScore,
              bands,
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
    name: 'audit_seo_completeness',
    description:
      'Check published pages across collections for missing required SEO fields.',
    parameters: {
      collections: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collectionsRaw = (args.collections as string) || 'services,locations,service-pages'
        const collectionNames = collectionsRaw.split(',').map((s) => s.trim()).filter(Boolean)

        // Pre-fetch all FAQs for service-page FAQ check
        let faqServicePageIds = new Set<string>()
        if (collectionNames.includes('service-pages')) {
          const faqResult = await req.payload.find({
            collection: 'faqs',
            limit: 500,
            depth: 0,
          })
          for (const doc of faqResult.docs) {
            const d = doc as Record<string, unknown>
            // FAQs may reference service-pages via a servicePage or similar field
            const spId = d.servicePage as string | undefined
            if (spId) faqServicePageIds.add(String(spId))
            // Also check if linked via service + location combo
            const serviceId = d.service as string | undefined
            const locationId = d.location as string | undefined
            if (serviceId && locationId) {
              faqServicePageIds.add(`${serviceId}_${locationId}`)
            }
          }
        }

        const collectionsReport: Record<
          string,
          {
            total: number
            complete: number
            incomplete: number
            issues: Array<{ id: string; slug: string; missingFields: string[] }>
            warnings?: string[]
          }
        > = {}

        for (const collectionName of collectionNames) {
          const result = await req.payload.find({
            collection: collectionName,
            where: { _status: { equals: 'published' } },
            limit: 500,
            depth: 0,
          })

          const warnings: string[] = []
          if (result.totalDocs > result.docs.length) {
            warnings.push(
              `Showing ${result.docs.length} of ${result.totalDocs} total docs in ${collectionName}. Results may be incomplete.`,
            )
          }

          const issues: Array<{ id: string; slug: string; missingFields: string[] }> = []

          for (const doc of result.docs) {
            const d = doc as Record<string, unknown>
            const missingFields: string[] = []
            const slug = (d.slug as string) || (d.name as string) || String(d.id)

            const seoTitle = d.seoTitle as string | undefined
            if (!seoTitle || seoTitle.trim() === '') {
              missingFields.push('seoTitle')
            }

            const seoDescription = d.seoDescription as string | undefined
            if (!seoDescription || seoDescription.trim() === '') {
              missingFields.push('seoDescription')
            } else if (seoDescription.length > 160) {
              missingFields.push('seoDescription (exceeds 160 chars)')
            }

            if (collectionName === 'service-pages') {
              const pageId = String(d.id)
              const serviceId = d.service as string | undefined
              const locationId = d.location as string | undefined
              const hasFaq =
                faqServicePageIds.has(pageId) ||
                (serviceId && locationId && faqServicePageIds.has(`${serviceId}_${locationId}`))
              if (!hasFaq) {
                missingFields.push('faqs (no FAQs found for this page)')
              }
            }

            if (missingFields.length > 0) {
              issues.push({ id: String(d.id), slug, missingFields })
            }
          }

          collectionsReport[collectionName] = {
            total: result.docs.length,
            complete: result.docs.length - issues.length,
            incomplete: issues.length,
            issues,
            ...(warnings.length > 0 ? { warnings } : {}),
          }
        }

        return text(JSON.stringify({ collections: collectionsReport }, null, 2))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'audit_heading_structure',
    description:
      'Validate heading hierarchy rules across service-pages (exactly 1 H1, sequential hierarchy, keyword in H1, H1 length).',
    parameters: {
      limit: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const limit = (args.limit as number) ?? 50

        const result = await req.payload.find({
          collection: 'service-pages',
          limit,
          depth: 1,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Showing ${result.docs.length} of ${result.totalDocs} total service-pages. Increase limit to audit more.`,
          )
        }

        const issuesList: Array<{ pageId: string; slug: string; problems: string[] }> = []

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>
          const problems: string[] = []

          // Extract headings from all Lexical content fields
          const allHeadings: Array<{ tag: string; text: string }> = []
          for (const field of ['introduction', 'localContent']) {
            const val = d[field]
            if (val && typeof val === 'object') {
              allHeadings.push(...extractHeadings(val))
            }
          }

          // Check: exactly 1 H1
          const h1s = allHeadings.filter((h) => h.tag === 'h1')
          if (h1s.length === 0) {
            problems.push('Missing H1 tag')
          } else if (h1s.length > 1) {
            problems.push(`Multiple H1 tags found (${h1s.length})`)
          }

          // Check: sequential hierarchy (no skipping levels)
          const tagOrder = allHeadings.map((h) => parseInt(h.tag.replace('h', ''), 10))
          for (let i = 1; i < tagOrder.length; i++) {
            if (tagOrder[i] > tagOrder[i - 1] + 1) {
              problems.push(
                `Heading hierarchy skip: h${tagOrder[i - 1]} → h${tagOrder[i]} (missing h${tagOrder[i - 1] + 1})`,
              )
              break
            }
          }

          // Check: H1 contains primary keyword (service name + location city)
          if (h1s.length === 1) {
            const h1Text = h1s[0].text
            const service = d.service as Record<string, unknown> | undefined
            const location = d.location as Record<string, unknown> | undefined
            const serviceName = service?.name as string | undefined
            const city = location?.city as string | undefined

            if (serviceName && city) {
              const keyword = `${serviceName} in ${city}`.toLowerCase()
              if (!h1Text.toLowerCase().includes(keyword)) {
                problems.push(
                  `H1 does not contain primary keyword "${serviceName} in ${city}"`,
                )
              }
            }

            // Check: H1 length 20-60 chars
            if (h1Text.length < 20) {
              problems.push(`H1 too short (${h1Text.length} chars, minimum 20)`)
            } else if (h1Text.length > 60) {
              problems.push(`H1 too long (${h1Text.length} chars, maximum 60)`)
            }
          }

          if (problems.length > 0) {
            issuesList.push({
              pageId: String(d.id),
              slug: d.slug as string,
              problems,
            })
          }
        }

        return text(
          JSON.stringify(
            {
              totalPagesAudited: result.docs.length,
              pagesWithIssues: issuesList.length,
              issues: issuesList,
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
]
