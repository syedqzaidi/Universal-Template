import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

function makeLandingPageContent(sections: Array<{ heading: string; placeholder: string }>) {
  const children: unknown[] = []
  for (const section of sections) {
    children.push({
      type: 'heading',
      tag: 'h2',
      children: [{ type: 'text', text: section.heading, version: 1 }],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })
    children.push({
      type: 'paragraph',
      children: [{ type: 'text', text: section.placeholder, version: 1 }],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })
  }
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const LANDING_PAGE_SECTIONS = [
  { heading: 'Hero — Value Proposition', placeholder: '[Add compelling headline and subheadline]' },
  { heading: 'Problem', placeholder: '[Describe the pain point your audience faces]' },
  { heading: 'Solution', placeholder: '[Explain how your product or service solves the problem]' },
  { heading: 'Features', placeholder: '[List key features and benefits]' },
  { heading: 'Social Proof', placeholder: '[Add testimonials, case studies, or logos]' },
  { heading: 'CTA — Call to Action', placeholder: '[Add a clear, compelling call to action]' },
]

export const croTools = [
  {
    name: 'create_landing_page',
    description: 'Create a new draft landing page with CRO-focused placeholder sections: Hero, Problem, Solution, Features, Social Proof, CTA.',
    parameters: { title: z.string(), slug: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const title = args.title as string
      const slug = args.slug as string
      const content = makeLandingPageContent(LANDING_PAGE_SECTIONS)

      const created = await req.payload.create({
        collection: 'pages',
        data: {
          title,
          slug,
          _status: 'draft',
          content,
        } as Record<string, unknown>,
      })

      return text(JSON.stringify({ newPageId: created.id, title, slug, status: 'draft' }, null, 2))
    },
  },
  {
    name: 'duplicate_for_ab_test',
    description: 'Duplicate a page for A/B testing, with the slug suffixed -variant (or a custom variantSlug).',
    parameters: { id: z.string(), variantSlug: z.string().optional() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const customVariantSlug = args.variantSlug as string | undefined

      // Fix #5: depth:0 prevents relationship fields from being populated (avoids nested objects
      // being re-submitted as IDs and causing Payload validation errors on create).
      const original = await req.payload.findByID({ collection: 'pages', id, depth: 0 }) as Record<string, unknown>
      // Explicitly strip fields that must not be copied: id, timestamps, and version/publish metadata.
      const { id: _id, createdAt, updatedAt, _status, publishedAt, ...rest } = original

      const baseSlug = typeof rest.slug === 'string' ? rest.slug : 'page'
      const variantSlug = customVariantSlug ?? `${baseSlug}-variant`

      const created = await req.payload.create({
        collection: 'pages',
        data: { ...rest, slug: variantSlug, _status: 'draft' } as Record<string, unknown>,
      })

      return text(JSON.stringify({ newPageId: created.id, slug: variantSlug, originalId: id }, null, 2))
    },
  },
  {
    name: 'conversion_funnel_audit',
    description: 'Audit published pages for internal links. Pages with zero internal links are flagged as dead ends.',
    parameters: {},
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const result = await req.payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        limit: 500,
        depth: 0,
      })
      const pages = result.docs as Record<string, unknown>[]

      // Collect all slugs for internal link matching
      const allSlugs = pages
        .map((p) => typeof p.slug === 'string' ? p.slug : null)
        .filter((s): s is string => s !== null && s.length > 0)

      const report = pages.map((page) => {
        const contentStr = JSON.stringify(page.content ?? '')
        const titleStr = typeof page.title === 'string' ? page.title : ''
        const slug = typeof page.slug === 'string' ? page.slug : ''

        // Count how many other page slugs appear in this page's content
        // Skip slugs shorter than 3 chars to avoid false positives (e.g., "en", "fr", "a")
        const referencedSlugs = allSlugs.filter((s) => {
          if (s === slug) return false // skip self-reference
          if (s.length < 3) return false // skip short slugs prone to false matches
          return contentStr.includes(`/${s}`)
        })

        return {
          id: page.id,
          title: titleStr,
          slug,
          internalLinkCount: referencedSlugs.length,
          referencedSlugs,
          isDeadEnd: referencedSlugs.length === 0,
        }
      })

      const deadEnds = report.filter((p) => p.isDeadEnd)

      return text(
        JSON.stringify(
          {
            totalPages: pages.length,
            deadEndCount: deadEnds.length,
            deadEndPages: deadEnds.map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
            allPages: report,
          },
          null,
          2,
        ),
      )
    },
  },
]
