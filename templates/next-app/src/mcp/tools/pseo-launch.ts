import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const pseoLaunchTools = [
  {
    name: 'run_prelaunch_checklist',
    description:
      'Automated pre-launch validation covering CMS setup, content quality, SEO completeness, and internal linking for pSEO sites.',
    parameters: {
      baseUrl: z.string(),
      sampleSize: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const baseUrl = args.baseUrl as string
        const sampleSize = (args.sampleSize as number) ?? 50

        type CheckItem = { name: string; status: 'pass' | 'warn' | 'fail'; detail: string }
        type CategoryResult = {
          category: string
          status: 'pass' | 'warn' | 'fail'
          checks: CheckItem[]
        }

        // --- CMS Setup ---
        const cmsChecks: CheckItem[] = []
        const cmsCollections = [
          { collection: 'services', label: 'Services' },
          { collection: 'locations', label: 'Locations' },
          { collection: 'service-pages', label: 'Service Pages' },
          { collection: 'faqs', label: 'FAQs' },
        ]

        for (const { collection, label } of cmsCollections) {
          try {
            let totalDocs = 0
            try {
              const result = await req.payload.find({
                collection,
                where: { _status: { equals: 'published' } },
                limit: 1,
                depth: 0,
              })
              totalDocs = result.totalDocs
            } catch {
              // Collection may not have _status field, query without filter
              const result = await req.payload.find({
                collection,
                limit: 1,
                depth: 0,
              })
              totalDocs = result.totalDocs
            }

            cmsChecks.push({
              name: `${label} collection has published docs`,
              status: totalDocs > 0 ? 'pass' : 'fail',
              detail: totalDocs > 0 ? `${totalDocs} doc(s) found` : 'No documents found',
            })
          } catch (err) {
            cmsChecks.push({
              name: `${label} collection has published docs`,
              status: 'fail',
              detail: `Collection error: ${err instanceof Error ? err.message : String(err)}`,
            })
          }
        }

        const cmsStatus = cmsChecks.some((c) => c.status === 'fail')
          ? 'fail'
          : cmsChecks.some((c) => c.status === 'warn')
            ? 'warn'
            : 'pass'

        // --- Content Quality (sample-based) ---
        const contentChecks: CheckItem[] = []
        let sampleDocs: Record<string, unknown>[] = []

        try {
          const spResult = await req.payload.find({
            collection: 'service-pages',
            limit: sampleSize,
            depth: 0,
          })
          sampleDocs = spResult.docs.map((d) => d as Record<string, unknown>)
        } catch {
          // ignore — sampleDocs stays empty
        }

        if (sampleDocs.length === 0) {
          contentChecks.push({
            name: 'Service pages exist for quality check',
            status: 'fail',
            detail: 'No service-pages found to analyze',
          })
        } else {
          // Pages with low quality score
          const lowQualityPages = sampleDocs.filter(
            (d) => typeof d.contentQualityScore === 'number' && (d.contentQualityScore as number) < 50,
          )
          contentChecks.push({
            name: 'No pages with quality score < 50',
            status: lowQualityPages.length > 0 ? 'fail' : 'pass',
            detail:
              lowQualityPages.length > 0
                ? `${lowQualityPages.length} page(s) below score 50`
                : 'All sampled pages have quality score >= 50',
          })

          // Template-only content ratio
          const templatePages = sampleDocs.filter(
            (d) => d.contentSource === 'template',
          )
          const templateRatio = templatePages.length / sampleDocs.length
          contentChecks.push({
            name: 'Template-only content ratio ≤ 50%',
            status: templateRatio > 0.5 ? 'warn' : 'pass',
            detail: `${templatePages.length}/${sampleDocs.length} pages are template-only (${Math.round(templateRatio * 100)}%)`,
          })

          // Average quality score
          const scores = sampleDocs
            .map((d) => d.contentQualityScore as number | undefined)
            .filter((s): s is number => typeof s === 'number')
          const avgScore = scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : 0
          contentChecks.push({
            name: 'Average content quality score',
            status: avgScore >= 50 ? 'pass' : 'warn',
            detail: `Average score: ${avgScore} across ${scores.length} scored page(s)`,
          })

          // Empty introduction AND localContent
          const emptyContentPages = sampleDocs.filter((d) => {
            const intro = d.introduction
            const local = d.localContent
            const introEmpty =
              !intro || (typeof intro === 'string' && intro.trim() === '') || intro === null
            const localEmpty =
              !local || (typeof local === 'string' && local.trim() === '') || local === null
            return introEmpty && localEmpty
          })
          contentChecks.push({
            name: 'No pages with empty introduction AND localContent',
            status: emptyContentPages.length > 0 ? 'fail' : 'pass',
            detail:
              emptyContentPages.length > 0
                ? `${emptyContentPages.length} page(s) have both fields empty`
                : 'All sampled pages have at least one content field populated',
          })
        }

        const contentStatus = contentChecks.some((c) => c.status === 'fail')
          ? 'fail'
          : contentChecks.some((c) => c.status === 'warn')
            ? 'warn'
            : 'pass'

        // --- SEO Completeness (sample-based) ---
        const seoChecks: CheckItem[] = []

        if (sampleDocs.length === 0) {
          seoChecks.push({
            name: 'Service pages exist for SEO check',
            status: 'fail',
            detail: 'No service-pages found to analyze',
          })
        } else {
          let missingSeo = 0
          const seoTitles: string[] = []

          for (const d of sampleDocs) {
            const seoTitle = d.seoTitle as string | undefined
            const seoDescription = d.seoDescription as string | undefined
            const slug = d.slug as string | undefined
            let hasMissing = false

            if (!seoTitle || seoTitle.trim() === '') hasMissing = true
            if (seoTitle && seoTitle.length > 60) hasMissing = true
            if (!seoDescription || seoDescription.trim() === '') hasMissing = true
            if (seoDescription && seoDescription.length > 160) hasMissing = true
            if (slug) {
              const isValid = slug === slug.toLowerCase() && !slug.includes('--')
              if (!isValid) hasMissing = true
            }

            if (hasMissing) missingSeo++
            if (seoTitle) seoTitles.push(seoTitle)
          }

          seoChecks.push({
            name: 'Pages with complete SEO fields',
            status: missingSeo > 0 ? 'warn' : 'pass',
            detail: `${missingSeo} of ${sampleDocs.length} page(s) have SEO issues (missing/invalid fields)`,
          })

          // Duplicate title check
          const titleCounts = new Map<string, number>()
          for (const title of seoTitles) {
            titleCounts.set(title, (titleCounts.get(title) || 0) + 1)
          }
          const duplicateTitles = Array.from(titleCounts.entries()).filter(
            ([, count]) => count > 1,
          )
          seoChecks.push({
            name: 'No duplicate SEO titles',
            status: duplicateTitles.length > 0 ? 'fail' : 'pass',
            detail:
              duplicateTitles.length > 0
                ? `${duplicateTitles.length} duplicate title(s) found: ${duplicateTitles.map(([t, c]) => `"${t}" (${c}x)`).join(', ')}`
                : 'All SEO titles are unique',
          })

          // Slug validation
          const badSlugs = sampleDocs.filter((d) => {
            const slug = d.slug as string | undefined
            if (!slug) return true
            return slug !== slug.toLowerCase() || slug.includes('--')
          })
          seoChecks.push({
            name: 'All slugs are valid',
            status: badSlugs.length > 0 ? 'warn' : 'pass',
            detail:
              badSlugs.length > 0
                ? `${badSlugs.length} page(s) have invalid slugs`
                : 'All slugs are lowercase with no double hyphens',
          })

          // Canonical URL spot-check using baseUrl
          const normalizedBase = baseUrl.replace(/\/+$/, '')
          const canonicalIssues = sampleDocs.filter((d) => {
            const slug = d.slug as string | undefined
            if (!slug) return true
            const canonical = `${normalizedBase}/service-pages/${slug}`
            return !canonical.startsWith('https://') || canonical !== canonical.toLowerCase()
          })
          seoChecks.push({
            name: 'Canonical URLs are valid',
            status: canonicalIssues.length > 0 ? 'warn' : 'pass',
            detail:
              canonicalIssues.length > 0
                ? `${canonicalIssues.length} page(s) would have non-HTTPS or non-lowercase canonical URLs with baseUrl "${normalizedBase}"`
                : `All canonical URLs valid with baseUrl "${normalizedBase}"`,
          })
        }

        const seoStatus = seoChecks.some((c) => c.status === 'fail')
          ? 'fail'
          : seoChecks.some((c) => c.status === 'warn')
            ? 'warn'
            : 'pass'

        // --- Linking ---
        const linkingChecks: CheckItem[] = []

        try {
          const allPages = await req.payload.find({
            collection: 'service-pages',
            limit: 500,
            depth: 0,
          })
          const allDocs = allPages.docs.map((d) => d as Record<string, unknown>)

          const orphanPages = allDocs.filter((d) => {
            const related = d.relatedServicePages as unknown[] | undefined
            return !related || !Array.isArray(related) || related.length < 3
          })
          const orphanPct =
            allDocs.length > 0
              ? Math.round((orphanPages.length / allDocs.length) * 100)
              : 0

          linkingChecks.push({
            name: 'Pages with ≥ 3 related service pages',
            status: orphanPct > 50 ? 'fail' : orphanPct > 20 ? 'warn' : 'pass',
            detail: `${orphanPages.length}/${allDocs.length} pages have < 3 related pages (${orphanPct}% orphan rate)`,
          })
        } catch (err) {
          linkingChecks.push({
            name: 'Internal linking check',
            status: 'fail',
            detail: `Error checking links: ${err instanceof Error ? err.message : String(err)}`,
          })
        }

        const linkingStatus = linkingChecks.some((c) => c.status === 'fail')
          ? 'fail'
          : linkingChecks.some((c) => c.status === 'warn')
            ? 'warn'
            : 'pass'

        // --- Build final result ---
        const categories: CategoryResult[] = [
          { category: 'CMS Setup', status: cmsStatus, checks: cmsChecks },
          { category: 'Content Quality', status: contentStatus, checks: contentChecks },
          { category: 'SEO Completeness', status: seoStatus, checks: seoChecks },
          { category: 'Linking', status: linkingStatus, checks: linkingChecks },
        ]

        const allChecks = [...cmsChecks, ...contentChecks, ...seoChecks, ...linkingChecks]
        const passed = allChecks.filter((c) => c.status === 'pass').length
        const warned = allChecks.filter((c) => c.status === 'warn').length
        const failed = allChecks.filter((c) => c.status === 'fail').length

        const overallStatus = categories.some((c) => c.status === 'fail')
          ? 'fail'
          : categories.some((c) => c.status === 'warn')
            ? 'warn'
            : 'pass'

        return text(
          JSON.stringify(
            {
              overallStatus,
              baseUrl,
              categories,
              summary: { totalChecks: allChecks.length, passed, warned, failed },
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
    name: 'list_collection_stats',
    description:
      'Dashboard showing document counts by collection and status — pSEO onboarding progress tracker.',
    parameters: {},
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collectionNames = [
          'services',
          'locations',
          'service-pages',
          'blog-posts',
          'faqs',
          'testimonials',
          'team-members',
          'media',
        ]

        const collections: Array<{
          name: string
          total: number
          published: number | null
          draft: number | null
        }> = []

        for (const collection of collectionNames) {
          try {
            const totalResult = await req.payload.find({
              collection,
              limit: 1,
              depth: 0,
            })
            const total = totalResult.totalDocs

            let published: number | null = null
            let draft: number | null = null

            try {
              const pubResult = await req.payload.find({
                collection,
                where: { _status: { equals: 'published' } },
                limit: 1,
                depth: 0,
              })
              published = pubResult.totalDocs

              const draftResult = await req.payload.find({
                collection,
                where: { _status: { equals: 'draft' } },
                limit: 1,
                depth: 0,
              })
              draft = draftResult.totalDocs
            } catch {
              // Collection doesn't have _status field — report total only
            }

            collections.push({ name: collection, total, published, draft })
          } catch {
            // Collection doesn't exist — skip
          }
        }

        return text(
          JSON.stringify(
            {
              collections,
              generatedAt: new Date().toISOString(),
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
