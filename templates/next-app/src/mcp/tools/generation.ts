import { z } from 'zod'
import type { PayloadRequest } from 'payload'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { execSync } from 'node:child_process'
import {
  createManifest,
  updateStep,
  readManifest,
  getResumePoint,
  cleanupGeneration,
  readSeedManifest,
  writeSeedManifest,
  updateSeedProgress,
} from '../lib/manifest'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

// Resolve paths relative to the monorepo root
const NEXT_APP = resolve(process.cwd())
const ASTRO_SITE = resolve(NEXT_APP, '../../templates/astro-site')
const ROOT = resolve(NEXT_APP, '../..')

function ensureDir(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function safeWrite(filePath: string, content: string): void {
  ensureDir(filePath)
  writeFileSync(filePath, content, 'utf-8')
}

// Reserved slugs that cannot be used for generated collections
const RESERVED_SLUGS = [
  'pages', 'media', 'users', 'contacts', 'search', 'redirects',
  'forms', 'form-submissions', 'payload-preferences', 'payload-migrations',
  'plugin-ai-instructions',
]

/**
 * Generate a layout block array based on a PageBlueprint's section definitions.
 * Maps blueprint sections to Payload block data structures.
 */
function generateBlueprintLayout(
  pageType: string,
  context: { entityName?: string; locationName?: string; businessName?: string; phone?: string },
): Record<string, any>[] {
  // Blueprint section → block type mappings for seeding
  // Only include sections that have CMS blocks (skip code-rendered sections with empty blocks[])
  const blueprintLayouts: Record<string, Array<{ blockType: string; data: Record<string, any> }>> = {
    'homepage': [
      { blockType: 'hero', data: { heading: `Welcome to ${context.businessName || 'Our Business'}`, subheading: 'Your trusted local provider', style: 'centered' } },
      { blockType: 'stats', data: { items: [{ label: 'Years Experience', value: '10+' }, { label: 'Happy Customers', value: '1,000+' }, { label: 'Service Areas', value: '5+' }] } },
      { blockType: 'relatedLinks', data: { heading: 'Our Services' } },
      { blockType: 'cta', data: { heading: 'Ready to Get Started?', description: `Contact ${context.businessName || 'us'} today`, buttonText: 'Contact Us', buttonLink: '/contact' } },
      { blockType: 'content', data: { content: { root: { children: [{ type: 'paragraph', children: [{ text: `${context.businessName || 'We'} provide exceptional service to our community.` }] }] } } } },
      { blockType: 'testimonials', data: { heading: 'What Our Customers Say' } },
      { blockType: 'serviceDetail', data: { heading: 'Why Choose Us' } },
      { blockType: 'faq', data: { heading: 'Frequently Asked Questions' } },
      { blockType: 'locationMap', data: { heading: 'Visit Us' } },
      { blockType: 'cta', data: { heading: `Call ${context.businessName || 'Us'} Today`, buttonText: context.phone ? `Call ${context.phone}` : 'Contact Us', buttonLink: '/contact' } },
    ],
    'entity-detail': [
      { blockType: 'hero', data: { heading: context.entityName || 'Service Details', style: 'split' } },
      { blockType: 'content', data: { content: { root: { children: [{ type: 'paragraph', children: [{ text: `Learn more about ${context.entityName || 'our service'}.` }] }] } } } },
      { blockType: 'serviceDetail', data: { heading: 'Features & Benefits' } },
      { blockType: 'pricing', data: { heading: 'Pricing' } },
      { blockType: 'cta', data: { heading: `Book ${context.entityName || 'This Service'}`, buttonText: 'Book Now', buttonLink: '/contact' } },
      { blockType: 'gallery', data: { heading: 'Gallery' } },
      { blockType: 'testimonials', data: { heading: `${context.entityName || 'Service'} Reviews` } },
      { blockType: 'faq', data: { heading: `${context.entityName || 'Service'} FAQ` } },
      { blockType: 'relatedLinks', data: { heading: 'Related Services' } },
      { blockType: 'cta', data: { heading: 'Ready to Get Started?', buttonText: 'Contact Us', buttonLink: '/contact' } },
    ],
    'cross-product': [
      { blockType: 'hero', data: { heading: `${context.entityName || 'Service'} in ${context.locationName || 'Your Area'}`, style: 'split' } },
      { blockType: 'content', data: { content: { root: { children: [{ type: 'paragraph', children: [{ text: `Discover ${context.entityName || 'our service'} in ${context.locationName || 'your area'}. We provide expert, locally-focused service.` }] }] } } } },
      { blockType: 'serviceDetail', data: { heading: `About ${context.entityName || 'Our Service'} in ${context.locationName || 'This Area'}` } },
      { blockType: 'pricing', data: { heading: 'Local Pricing' } },
      { blockType: 'cta', data: { heading: `Book ${context.entityName || 'Service'} in ${context.locationName || 'Your Area'}`, buttonText: 'Book Now', buttonLink: '/contact' } },
      { blockType: 'testimonials', data: { heading: `What ${context.locationName || 'Local'} Customers Say` } },
      { blockType: 'locationMap', data: { heading: `Our ${context.locationName || 'Local'} Office` } },
      { blockType: 'faq', data: { heading: `${context.entityName || 'Service'} FAQ for ${context.locationName || 'This Area'}` } },
      { blockType: 'relatedLinks', data: { heading: 'More Services in This Area' } },
      { blockType: 'cta', data: { heading: `Contact Us in ${context.locationName || 'Your Area'}`, buttonText: context.phone ? `Call ${context.phone}` : 'Contact Us', buttonLink: '/contact' } },
    ],
  }

  const layout = blueprintLayouts[pageType]
  if (!layout) {
    console.warn(`[generateBlueprintLayout] No layout template for pageType "${pageType}". Supported types: homepage, entity-detail, cross-product. Returning empty layout.`)
    return []
  }

  return layout.map(block => ({
    blockType: block.blockType,
    ...block.data,
  }))
}

export const generationTools = [
  // ═══════════════════════════════════════════════
  // Tool 1: analyze_business
  // ═══════════════════════════════════════════════
  {
    name: 'analyze_business',
    description: 'Analyze a natural language business description and produce a structured BusinessModel JSON. Returns follow-up questions if the description is ambiguous.',
    parameters: {
      prompt: z.string().describe('Natural language business description'),
      followUpQuestions: z.boolean().optional().describe('If true, return clarifying questions for ambiguous input'),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const prompt = args.prompt as string
        const followUp = args.followUpQuestions as boolean | undefined

        if (!prompt || prompt.trim().length < 20) {
          return text(JSON.stringify({
            error: 'Business description is too short. Please provide at least a few sentences describing the business type, services/products, locations, and target audience.',
          }))
        }

        // Create generation manifest
        createManifest(prompt.slice(0, 100))
        updateStep('analyze', 'in-progress')

        // The actual analysis is done by the LLM using this tool's output as context.
        // This tool validates the input and returns a structured template for the LLM to fill.
        const template = {
          instruction: 'Based on the business description, generate a complete BusinessModel JSON. Fill in ALL fields below.',
          businessDescription: prompt,
          businessModelTemplate: {
            businessName: '(extract from description)',
            businessType: '(e.g., dog-grooming, law-firm, restaurant)',
            industry: '(e.g., pet-services, legal, food-beverage)',
            description: '(2-3 sentence summary)',
            entities: [
              {
                name: '(entity name, e.g., Treatment)',
                slug: '(kebab-case collection slug, e.g., treatments)',
                purpose: '(why this entity exists)',
                fields: '(array of FieldDefinition objects)',
                hasPublicPages: true,
                hasVersioning: true,
                hasBlocks: true,
                sortField: 'name',
                adminGroup: 'Content',
              },
            ],
            relationships: '(how entities relate)',
            crossProducts: '(entity × entity combinations for pSEO)',
            primaryConversion: { action: '(e.g., Book Appointment)', type: 'form', ctaText: '(button text)', ctaStyle: 'primary' },
            secondaryConversions: [],
            userJourneys: [],
            contentPillars: [],
            seoStrategy: { keywordPatterns: [], targetIntents: [], contentPillars: [], internalLinkingRules: [], localSEO: true },
            crmPipeline: { name: '(pipeline name)', stages: [], contactProperties: [], automations: [] },
            emailSequences: [],
            schemaOrgTypes: [],
            urlPatterns: [],
            navStructure: { primary: [], secondary: [], footer: [] },
          },
          reservedSlugs: RESERVED_SLUGS,
          rules: [
            'Entity slugs must NOT collide with reserved slugs',
            'If a name collides (e.g., "media"), prefix with business type (e.g., "portfolio-media")',
            'Cross-product max 200 pages',
            'Localized fields only for text, textarea, richText',
          ],
        }

        if (followUp) {
          template.instruction += ' If any information is missing or ambiguous, return a "questions" array instead of the full model.'
        }

        updateStep('analyze', 'completed')
        return text(JSON.stringify(template, null, 2))
      } catch (err) {
        updateStep('analyze', 'pending', undefined, String(err))
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 2: generate_collection
  // ═══════════════════════════════════════════════
  {
    name: 'generate_collection',
    description: 'Generate a Payload CMS collection config file from an EntityDefinition. Creates the .ts file, updates payload.config.ts, shared types, and plugin config.',
    parameters: {
      entity: z.string().describe('JSON string of EntityDefinition'),
      blocks: z.string().optional().describe('Comma-separated block slugs to include in layout field'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const entity = JSON.parse(args.entity as string)
        const blockSlugs = (args.blocks as string)?.split(',').map(s => s.trim()) || []

        // Check reserved slugs
        if (RESERVED_SLUGS.includes(entity.slug)) {
          return text(JSON.stringify({
            error: `Slug "${entity.slug}" is reserved. Use a prefixed version like "${entity.slug}-${entity.adminGroup?.toLowerCase() || 'custom'}".`,
            reservedSlugs: RESERVED_SLUGS,
          }))
        }

        updateStep('collections', 'in-progress')

        // Generate field definitions
        const fields = entity.fields.map((f: any) => {
          const field: any = { name: f.name, type: f.type }
          if (f.required) field.required = true
          if (f.unique) field.unique = true
          if (f.localized && ['text', 'textarea', 'richText'].includes(f.type)) field.localized = true
          if (f.options) field.options = f.options.map((o: string) => ({ label: o, value: o.toLowerCase().replace(/\s+/g, '-') }))
          if (f.relationTo) field.relationTo = f.relationTo
          if (f.hasMany) field.hasMany = true
          if (f.min !== undefined) field.min = f.min
          if (f.max !== undefined) field.max = f.max
          if (f.defaultValue !== undefined) field.defaultValue = f.defaultValue
          if (f.description) field.admin = { ...field.admin, description: f.description }
          if (f.adminPosition === 'sidebar') field.admin = { ...field.admin, position: 'sidebar' }
          if (f.fields) field.fields = f.fields // nested fields for array/group
          return field
        })

        // Add SEO fields if entity has public pages
        const seoFields = entity.hasPublicPages ? `
    {
      name: 'seoTitle',
      type: 'text',
      admin: { position: 'sidebar', description: 'Override the auto-generated SEO title' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Override the auto-generated SEO description' },
    },
    {
      name: 'keywords',
      type: 'text',
      admin: { position: 'sidebar', description: 'Comma-separated focus keywords' },
    },` : ''

        // Add layout field if entity has blocks
        const layoutField = entity.hasBlocks ? `
    {
      name: 'layout',
      type: 'blocks',
      blocks: [${blockSlugs.length > 0 ? blockSlugs.map(s => {
        const pascalCase = s.replace(/(^|-)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase()) + 'Block'
        return pascalCase
      }).join(', ') : '/* imported blocks */'}],
    },` : ''

        // Build imports for blocks
        const blockImports = entity.hasBlocks && blockSlugs.length > 0
          ? blockSlugs.map(s => {
              const pascalCase = s.replace(/(^|-)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase()) + 'Block'
              return `import { ${pascalCase} } from '../blocks'`
            }).join('\n')
          : ''

        // Generate the collection file
        const pascalName = entity.name.replace(/\s+/g, '')
        const collectionContent = `import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'
import { triggerRebuild } from '../hooks/trigger-rebuild'
${blockImports}

export const ${pascalName}: CollectionConfig = {
  slug: '${entity.slug}',
  admin: {
    useAsTitle: '${entity.fields[0]?.name || 'name'}',
    defaultColumns: [${entity.fields.slice(0, 4).map((f: any) => `'${f.name}'`).join(', ')}],
    group: '${entity.adminGroup || 'Content'}',
  },
  access: {
    read: ${entity.hasPublicPages ? 'publishedOrLoggedIn' : 'isAdminOrEditor'},
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  ${entity.hasVersioning ? `versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 10,
  },` : ''}
  hooks: {
    beforeChange: [autoGenerateSlug],
    ${entity.hasPublicPages ? 'afterChange: [triggerRebuild],' : ''}
  },
  fields: [
    ${JSON.stringify(fields, null, 4).slice(1, -1)}${seoFields}${layoutField}
  ],
}
`

        const filePath = resolve(NEXT_APP, `src/collections/${pascalName}.ts`)
        safeWrite(filePath, collectionContent)

        const relativePath = `templates/next-app/src/collections/${pascalName}.ts`
        updateStep('collections', 'in-progress', [relativePath])

        // Auto-wire plugin config for new collections
        const pluginConfigPath = resolve(NEXT_APP, 'src/lib/plugin-config.ts')
        if (existsSync(pluginConfigPath)) {
          let pluginConfig = readFileSync(pluginConfigPath, 'utf-8')
          const slug = entity.slug

          if (entity.hasPublicPages) {
            // Add to arrays that should include public collections
            const arraysToUpdate = ['seo', 'search', 'redirects', 'livePreview']
            for (const arrayName of arraysToUpdate) {
              const regex = new RegExp(`(${arrayName}:\\s*\\[)([^\\]]*)\\]`)
              const match = pluginConfig.match(regex)
              if (match && !match[2].includes(`'${slug}'`)) {
                const existing = match[2].trim()
                pluginConfig = pluginConfig.replace(regex, `$1${existing ? existing + ', ' : ''}'${slug}']`)
              }
            }
          }

          // Add to importExport and ai arrays for all collections
          const allArrays = ['importExport', 'ai']
          for (const arrayName of allArrays) {
            const regex = new RegExp(`(${arrayName}:\\s*\\[)([^\\]]*)\\]`)
            const match = pluginConfig.match(regex)
            if (match && !match[2].includes(`'${slug}'`)) {
              const existing = match[2].trim()
              pluginConfig = pluginConfig.replace(regex, `$1${existing ? existing + ', ' : ''}'${slug}']`)
            }
          }

          writeFileSync(pluginConfigPath, pluginConfig, 'utf-8')
        }

        // Register analytics event for new entity
        if (entity.hasPublicPages) {
          const analyticsPath = resolve(ASTRO_SITE, 'src/lib/analytics-config.ts')
          if (existsSync(analyticsPath)) {
            let analyticsContent = readFileSync(analyticsPath, 'utf-8')
            const eventName = `${entity.slug.replace(/-/g, '_')}_viewed`
            if (!analyticsContent.includes(`'${eventName}'`)) {
              const newEvent = `
registerBusinessEvent({
  name: '${eventName}',
  description: 'Fired when a ${entity.name} detail page is viewed',
  properties: { slug: '${entity.slug} document slug', title: 'Document title' },
})
`
              analyticsContent += newEvent
              writeFileSync(analyticsPath, analyticsContent, 'utf-8')
            }
          }
        }

        return text(JSON.stringify({
          filePath: relativePath,
          collectionSlug: entity.slug,
          collectionName: pascalName,
          payloadConfigUpdate: {
            import: `import { ${pascalName} } from './collections/${pascalName}'`,
            registration: `${pascalName}`,
            instruction: `Add the import to payload.config.ts and add ${pascalName} to the collections array.`,
          },
          collectionsIndexUpdate: {
            export: `export { ${pascalName} } from './${pascalName}'`,
            instruction: `Add this line to collections/index.ts`,
          },
          message: `Collection "${entity.slug}" generated at ${relativePath}. Apply these updates: ${entity.hasPublicPages ? 'plugin-config.ts auto-updated. ' : ''}1) Add export to collections/index.ts: export { ${pascalName} } from './${pascalName}', 2) Add import and registration to payload.config.ts`,
        }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 3: generate_cross_product_collection
  // ═══════════════════════════════════════════════
  {
    name: 'generate_cross_product_collection',
    description: 'Generate a cross-product collection (entity × entity) for programmatic SEO. Creates collection with parent relationships, auto-slug hook, and quality gate.',
    parameters: {
      crossProduct: z.string().describe('JSON string of CrossProduct definition'),
      parentEntities: z.string().describe('JSON string of parent EntityDefinition array'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const cp = JSON.parse(args.crossProduct as string)
        const parents = JSON.parse(args.parentEntities as string)

        updateStep('crossProducts', 'in-progress')

        const parent1 = parents[0]
        const parent2 = parents[1]
        const pascalName = cp.slug.replace(/(^|-)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())

        // Generate auto-slug hook for cross-product
        const hookContent = `import type { FieldHook } from 'payload'

export const autoGenerate${pascalName}Slug: FieldHook = async ({ data, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    const ${parent1.slug.replace(/-/g, '')} = typeof data?.${parent1.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())} === 'object'
      ? data.${parent1.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())}
      : data?.${parent1.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())} ? await req.payload.findByID({ collection: '${parent1.slug}', id: data.${parent1.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())} }) : null
    const ${parent2.slug.replace(/-/g, '')} = typeof data?.${parent2.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())} === 'object'
      ? data.${parent2.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())}
      : data?.${parent2.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())} ? await req.payload.findByID({ collection: '${parent2.slug}', id: data.${parent2.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())} }) : null

    if (${parent1.slug.replace(/-/g, '')} && ${parent2.slug.replace(/-/g, '')}) {
      const slug1 = ${parent1.slug.replace(/-/g, '')}.slug || ''
      const slug2 = ${parent2.slug.replace(/-/g, '')}.slug || ''
      return \`\${slug1}-\${slug2}\`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
    }
  }
  return data?.slug
}
`

        const hookPath = resolve(NEXT_APP, `src/hooks/auto-generate-${cp.slug}-slug.ts`)
        safeWrite(hookPath, hookContent)

        // Generate the collection
        const parent1Field = parent1.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())
        const parent2Field = parent2.slug.replace(/-(.)/g, (_: string, c: string) => c.toUpperCase())

        const collectionContent = `import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { triggerRebuild } from '../hooks/trigger-rebuild'
import { autoGenerate${pascalName}Slug } from '../hooks/auto-generate-${cp.slug}-slug'
import { HeroBlock, ContentBlock, CTABlock, FAQBlock, TestimonialsBlock, ServiceDetailBlock, LocationMapBlock, RelatedLinksBlock, PricingBlock } from '../blocks'

export const ${pascalName}: CollectionConfig = {
  slug: '${cp.slug}',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '${parent1Field}', '${parent2Field}', 'contentQualityScore', '_status'],
    group: 'Content',
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 10,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Quality gate: block publishing if score is below threshold
        if ((operation === 'create' || operation === 'update') && data?._status === 'published' && data?.contentQualityScore != null && data.contentQualityScore < 65) {
          throw new Error('Content quality score must be at least 65 to publish. Current score: ' + data.contentQualityScore)
        }
        return data
      },
    ],
    afterChange: [triggerRebuild],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      hooks: { beforeValidate: [autoGenerate${pascalName}Slug] },
      admin: { position: 'sidebar' },
    },
    {
      name: '${parent1Field}',
      type: 'relationship',
      relationTo: '${parent1.slug}',
      required: true,
    },
    {
      name: '${parent2Field}',
      type: 'relationship',
      relationTo: '${parent2.slug}',
      required: true,
    },
    { name: 'headline', type: 'text' },
    { name: 'introduction', type: 'richText' },
    { name: 'localContent', type: 'richText' },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [HeroBlock, ContentBlock, CTABlock, FAQBlock, TestimonialsBlock, ServiceDetailBlock, LocationMapBlock, RelatedLinksBlock, PricingBlock],
    },
    {
      name: 'contentQualityScore',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        position: 'sidebar',
        description: 'Content quality score (0-100). Must be >= 65 to publish.',
        readOnly: true,
      },
    },
    { name: 'seoTitle', type: 'text', admin: { position: 'sidebar' } },
    { name: 'seoDescription', type: 'textarea', admin: { position: 'sidebar' } },
  ],
}
`

        const collectionPath = resolve(NEXT_APP, `src/collections/${pascalName}.ts`)
        safeWrite(collectionPath, collectionContent)

        const files = [
          `templates/next-app/src/collections/${pascalName}.ts`,
          `templates/next-app/src/hooks/auto-generate-${cp.slug}-slug.ts`,
        ]
        updateStep('crossProducts', 'in-progress', files)

        return text(JSON.stringify({
          filePath: files[0],
          collectionSlug: cp.slug,
          hookFilePath: files[1],
          message: `Cross-product collection "${cp.slug}" generated with quality gate (threshold: 65). Add to collections/index.ts and payload.config.ts.`,
        }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 4: generate_page
  // ═══════════════════════════════════════════════
  {
    name: 'generate_page',
    description: 'Generate an Astro SSR page file with data fetching, SEO, breadcrumbs, and BlockRenderer with blueprint sections.',
    parameters: {
      urlPattern: z.string().describe('URL pattern e.g., "/treatments/[slug]"'),
      collection: z.string().describe('Payload collection slug to fetch from'),
      fetchMethod: z.string().describe('Payload client method name e.g., "find"'),
      pageType: z.string().describe('PageBlueprint type e.g., "entity-detail"'),
      blueprint: z.string().describe('JSON string of PageBlueprint sections array'),
      renderBlocks: z.boolean().optional().describe('Whether to render layout blocks'),
      context: z.string().optional().describe('Additional context JSON'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const urlPattern = args.urlPattern as string
        const collection = args.collection as string
        const pageType = args.pageType as string
        const renderBlocks = args.renderBlocks !== false
        const blueprintJson = args.blueprint as string

        updateStep('routes', 'in-progress')

        // Convert URL pattern to Astro file path
        // e.g., "/treatments/[slug]" → "src/pages/treatments/[slug].astro"
        const astroPath = urlPattern
          .replace(/^\//, '')
          .replace(/\[([^\]]+)\]/g, '[$1]')

        const isListing = !urlPattern.includes('[')

        let pageContent: string

        if (isListing) {
          // Listing page
          pageContent = `---
import SEOLayout from '../../layouts/SEOLayout.astro'
import Breadcrumbs from '../../components/Breadcrumbs.astro'
import BlockRenderer from '../../components/blocks/BlockRenderer.astro'
import { payload } from '../../lib/payload'
import { generateSchemasForPage } from '../../lib/schema-registry'
import { setCacheHeaders } from '../../lib/cache'
import type { SectionDefinition } from '../../types/blueprint'

export const prerender = false

const { docs } = await payload.find({ collection: '${collection}', limit: 100, sort: 'name', depth: 1 })
const siteSettings = await payload.getSiteSettings()
const baseUrl = import.meta.env.SITE_URL || ''

const schemas = generateSchemasForPage('${pageType}', { items: docs }, baseUrl, siteSettings)

${renderBlocks ? `const blueprintSections: SectionDefinition[] = ${blueprintJson}` : ''}

setCacheHeaders(Astro)
---

<SEOLayout
  title="${collection.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} | {siteSettings.siteName}"
  description=""
  schemas={schemas}
>
  <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: '${collection.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}' }]} />

  <div class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold mb-8">${collection.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {docs.map((doc: any) => (
        <a href={\`${urlPattern.replace(/\/\[.*$/, '')}/\${doc.slug}\`} class="group block rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
          {doc.featuredImage && typeof doc.featuredImage === 'object' && (
            <div class="aspect-[4/3] overflow-hidden">
              <img src={doc.featuredImage.url} alt={doc.featuredImage.alt || doc.name || doc.title} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          )}
          <div class="p-5">
            <h2 class="text-xl font-semibold mb-2">{doc.name || doc.title}</h2>
            {doc.shortDescription && <p class="text-muted-foreground line-clamp-2">{doc.shortDescription}</p>}
            {doc.excerpt && <p class="text-muted-foreground line-clamp-2">{doc.excerpt}</p>}
          </div>
        </a>
      ))}
    </div>
  </div>
</SEOLayout>
`
        } else {
          // Detail page
          const paramName = urlPattern.match(/\[([^\]]+)\]/)?.[1] || 'slug'

          pageContent = `---
import SEOLayout from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/layouts/SEOLayout.astro'
import Breadcrumbs from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/components/Breadcrumbs.astro'
import BlockRenderer from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/components/blocks/BlockRenderer.astro'
import { payload } from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/lib/payload'
import { generateSchemasForPage } from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/lib/schema-registry'
import { setCacheHeaders } from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/lib/cache'
import type { SectionDefinition } from '${urlPattern.split('/').slice(1).map(() => '..').join('/')}/types/blueprint'

export const prerender = false

const { ${paramName} } = Astro.params

const { docs } = await payload.find({
  collection: '${collection}',
  where: { slug: { equals: ${paramName} } },
  limit: 1,
  depth: 2,
})

if (!docs.length) return Astro.redirect('/404')

const doc = docs[0]
const siteSettings = await payload.getSiteSettings()
const baseUrl = import.meta.env.SITE_URL || ''

const schemas = generateSchemasForPage('${pageType}', doc, baseUrl, siteSettings)

${renderBlocks ? `const blueprintSections: SectionDefinition[] = ${blueprintJson}` : ''}

setCacheHeaders(Astro)
---

<SEOLayout
  title={(doc.seoTitle || doc.name || doc.title) + ' | ' + siteSettings.siteName}
  description={doc.seoDescription || doc.shortDescription || doc.excerpt || ''}
  schemas={schemas}
>
  <Breadcrumbs items={[
    { label: 'Home', href: '/' },
    { label: '${collection.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}', href: '${urlPattern.replace(/\/\[.*$/, '')}' },
    { label: doc.name || doc.title },
  ]} />

  ${renderBlocks ? `{doc.layout && (
    <BlockRenderer
      blocks={doc.layout}
      blueprintSections={blueprintSections}
      context={{ entity: doc, siteSettings }}
    />
  )}` : `
  <div class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold mb-8">{doc.name || doc.title}</h1>
  </div>`}
</SEOLayout>
`
        }

        const filePath = resolve(ASTRO_SITE, `src/pages/${astroPath}.astro`)
        safeWrite(filePath, pageContent)

        const relativePath = `templates/astro-site/src/pages/${astroPath}.astro`
        updateStep('routes', 'in-progress', [relativePath])

        return text(JSON.stringify({
          filePath: relativePath,
          message: `Page generated at ${relativePath}. Update sitemap-config.ts if needed.`,
        }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 5: generate_block
  // ═══════════════════════════════════════════════
  {
    name: 'generate_block',
    description: 'Generate a new Payload block config and its Astro component. Updates block-registry.ts.',
    parameters: {
      name: z.string().describe('Block display name e.g., "Process Steps"'),
      slug: z.string().describe('Block slug e.g., "processSteps"'),
      fields: z.string().describe('JSON string of field definitions array'),
      componentTemplate: z.string().optional().describe('Optional Astro component template override'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const name = args.name as string
        const slug = args.slug as string
        const fields = JSON.parse(args.fields as string)
        const template = args.componentTemplate as string | undefined

        updateStep('blocks', 'in-progress')

        const pascalName = slug.charAt(0).toUpperCase() + slug.slice(1)

        // Generate Payload block config
        const blockConfig = `import type { Block } from 'payload'

export const ${pascalName}Block: Block = {
  slug: '${slug}',
  interfaceName: '${pascalName}Block',
  labels: { singular: '${name}', plural: '${name}s' },
  fields: ${JSON.stringify(fields, null, 4)},
}
`

        const blockPath = resolve(NEXT_APP, `src/blocks/${pascalName}.ts`)
        safeWrite(blockPath, blockConfig)

        // Generate Astro component
        const componentContent = template || `---
interface Props {
  data: any
  context?: Record<string, any>
  headingLevel?: 2 | 3 | 4
}

const { data, context = {}, headingLevel = 2 } = Astro.props
const HeadingTag = \`h\${headingLevel}\` as any
---

<div class="${slug}-block">
  {data.heading && <HeadingTag class="text-2xl font-bold mb-4">{data.heading}</HeadingTag>}
  {data.content && <div class="prose max-w-none">{data.content}</div>}
  <slot />
</div>
`

        const componentPath = resolve(ASTRO_SITE, `src/components/blocks/${pascalName}Block.astro`)
        safeWrite(componentPath, componentContent)

        // Update block registry
        const registryPath = resolve(ASTRO_SITE, 'src/components/blocks/block-registry.ts')
        if (existsSync(registryPath)) {
          let registry = readFileSync(registryPath, 'utf-8')
          // Add entry before the closing brace of blockRegistry
          registry = registry.replace(
            /}(\s*\nexport function registerBlock)/,
            `  ${slug}: '${pascalName}Block',\n}$1`,
          )
          writeFileSync(registryPath, registry, 'utf-8')
        }

        const files = [
          `templates/next-app/src/blocks/${pascalName}.ts`,
          `templates/astro-site/src/components/blocks/${pascalName}Block.astro`,
        ]
        updateStep('blocks', 'in-progress', files)

        return text(JSON.stringify({
          blockFilePath: files[0],
          componentFilePath: files[1],
          message: `Block "${slug}" generated. Add to blocks/index.ts and update BlockRenderer.astro to handle this block type.`,
        }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 6: generate_schema
  // ═══════════════════════════════════════════════
  {
    name: 'generate_schema',
    description: 'Generate a JSON-LD schema.org generator function and register it in the schema registry.',
    parameters: {
      pageType: z.string().describe('Page type identifier for the registry'),
      schemaOrgType: z.string().describe('Schema.org type e.g., "Service", "Restaurant"'),
      fieldMappings: z.string().describe('JSON string mapping schema.org properties to Payload fields'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const pageType = args.pageType as string
        const schemaType = args.schemaOrgType as string
        const mappings = JSON.parse(args.fieldMappings as string)

        updateStep('schemas', 'in-progress')

        // Generate the schema generator function
        const fieldLines = Object.entries(mappings)
          .map(([schemaProp, payloadField]) => `    ${schemaProp}: data.${payloadField},`)
          .join('\n')

        const generatorCode = `
// Generated schema generator for ${pageType} (${schemaType})
export function generate${schemaType.replace(/[^a-zA-Z]/g, '')}SchemaFor${pageType.replace(/(^|-)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())}(data: any, baseUrl: string, siteSettings: any) {
  return {
    '@context': 'https://schema.org',
    '@type': '${schemaType}',
${fieldLines}
    provider: {
      '@type': 'Organization',
      name: siteSettings?.siteName || '',
      url: baseUrl,
    },
  }
}
`

        // Append to seo.ts
        const seoPath = resolve(ASTRO_SITE, 'src/lib/seo.ts')
        if (existsSync(seoPath)) {
          let seoContent = readFileSync(seoPath, 'utf-8')
          seoContent += generatorCode
          writeFileSync(seoPath, seoContent, 'utf-8')
        }

        // Register in schema registry
        const registryPath = resolve(ASTRO_SITE, 'src/lib/schema-registry.ts')
        if (existsSync(registryPath)) {
          let registry = readFileSync(registryPath, 'utf-8')
          const funcName = `generate${schemaType.replace(/[^a-zA-Z]/g, '')}SchemaFor${pageType.replace(/(^|-)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())}`

          // Only append if not already registered
          if (!registry.includes(funcName)) {
            registry += `\n// Auto-registered: ${pageType}\nimport { ${funcName} } from './seo'\nregisterSchemaGenerator('${pageType}', (data, baseUrl, siteSettings) => [${funcName}(data, baseUrl, siteSettings)])\n`
            writeFileSync(registryPath, registry, 'utf-8')
          }
        }

        updateStep('schemas', 'in-progress', [`templates/astro-site/src/lib/seo.ts`])

        return text(JSON.stringify({ updated: true, pageType, schemaType }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 7: configure_crm_pipeline
  // ═══════════════════════════════════════════════
  {
    name: 'configure_crm_pipeline',
    description: 'Configure a Twenty CRM pipeline with stages, contact properties, and automations. NON-BLOCKING: writes deferred config if Twenty is unreachable.',
    parameters: {
      pipeline: z.string().describe('JSON string of PipelineDefinition'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const pipeline = JSON.parse(args.pipeline as string)

        updateStep('crm', 'in-progress')

        const twentyApiUrl = process.env.TWENTY_API_URL
        const twentyApiKey = process.env.TWENTY_API_KEY

        if (!twentyApiUrl || !twentyApiKey) {
          // Deferred mode: write config for later application
          const deferredConfig = {
            deferred: true,
            pipeline,
            syncMappings: pipeline.contactProperties?.map((prop: any) => ({
              sourceField: prop.name,
              targetField: prop.name,
              type: prop.type,
            })) || [],
            createdAt: new Date().toISOString(),
            instructions: 'Apply this CRM config when TWENTY_API_URL and TWENTY_API_KEY are set. Run: apply_crm_config tool.',
          }

          const configPath = resolve(ROOT, 'crm-deferred-config.json')
          safeWrite(configPath, JSON.stringify(deferredConfig, null, 2))

          // Also write sync config for orchestrator reference regardless of CRM availability
          const syncConfigPath = resolve(ROOT, 'crm-sync-config.json')
          safeWrite(syncConfigPath, JSON.stringify({
            deferred: true,
            pipeline,
            syncMappings: pipeline.contactProperties?.map((prop: any) => ({
              sourceField: prop.name,
              targetField: prop.name,
              type: prop.type,
            })) || [],
          }, null, 2))

          updateStep('crm', 'deferred', ['crm-deferred-config.json', 'crm-sync-config.json'])

          return text(JSON.stringify({
            deferred: true,
            configPath: 'crm-deferred-config.json',
            message: 'Twenty CRM not configured. Pipeline saved to crm-deferred-config.json for later application.',
          }))
        }

        // Try to create pipeline via Twenty GraphQL API
        try {
          const createPipelineQuery = `
            mutation CreatePipeline($input: PipelineCreateInput!) {
              createPipeline(data: $input) { id }
            }
          `

          const response = await fetch(`${twentyApiUrl}/api`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${twentyApiKey}`,
            },
            body: JSON.stringify({
              query: createPipelineQuery,
              variables: { input: { name: pipeline.name } },
            }),
          })

          if (!response.ok) throw new Error(`Twenty API returned ${response.status}`)

          const result = await response.json()
          const pipelineId = result?.data?.createPipeline?.id

          // Create stages
          const stageIds: string[] = []
          for (const [i, stageName] of pipeline.stages.entries()) {
            const stageResponse = await fetch(`${twentyApiUrl}/api`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${twentyApiKey}`,
              },
              body: JSON.stringify({
                query: `mutation CreateStage($input: PipelineStepCreateInput!) { createPipelineStep(data: $input) { id } }`,
                variables: { input: { name: stageName, pipelineId, position: i } },
              }),
            })
            const stageResult = await stageResponse.json()
            stageIds.push(stageResult?.data?.createPipelineStep?.id || '')
          }

          // Write sync config for orchestrator reference
          const syncConfig = {
            pipelineId,
            stageIds,
            pipeline,
            syncMappings: pipeline.contactProperties?.map((prop: any) => ({
              sourceField: prop.name,
              targetField: prop.name,
              type: prop.type,
            })) || [],
            instructions: 'Add these sync mappings to the twentyCrmPlugin config in plugins/index.ts',
          }
          const syncPath = resolve(ROOT, 'crm-sync-config.json')
          safeWrite(syncPath, JSON.stringify(syncConfig, null, 2))

          updateStep('crm', 'completed', ['crm-pipeline-config.json', 'crm-sync-config.json'])

          return text(JSON.stringify({ pipelineId, stageIds, syncConfig }))
        } catch (apiErr) {
          // API failed — defer
          const deferredConfig = {
            deferred: true,
            pipeline,
            syncMappings: pipeline.contactProperties?.map((prop: any) => ({
              sourceField: prop.name,
              targetField: prop.name,
              type: prop.type,
            })) || [],
            error: String(apiErr),
            createdAt: new Date().toISOString(),
          }
          const configPath = resolve(ROOT, 'crm-deferred-config.json')
          safeWrite(configPath, JSON.stringify(deferredConfig, null, 2))

          // Also write sync config for orchestrator reference regardless of CRM availability
          const syncConfigPath = resolve(ROOT, 'crm-sync-config.json')
          safeWrite(syncConfigPath, JSON.stringify({
            deferred: true,
            pipeline,
            syncMappings: pipeline.contactProperties?.map((prop: any) => ({
              sourceField: prop.name,
              targetField: prop.name,
              type: prop.type,
            })) || [],
          }, null, 2))

          updateStep('crm', 'deferred', ['crm-deferred-config.json', 'crm-sync-config.json'])

          return text(JSON.stringify({
            deferred: true,
            configPath: 'crm-deferred-config.json',
            message: `Twenty API call failed: ${apiErr}. Config saved for later.`,
          }))
        }
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 8: apply_crm_config
  // ═══════════════════════════════════════════════
  {
    name: 'apply_crm_config',
    description: 'Apply a previously deferred CRM pipeline configuration. Reads crm-deferred-config.json and creates the pipeline in Twenty CRM.',
    parameters: {
      configPath: z.string().optional().describe('Path to deferred config file (defaults to crm-deferred-config.json)'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const configFile = (args.configPath as string) || resolve(ROOT, 'crm-deferred-config.json')

        if (!existsSync(configFile)) {
          return text(JSON.stringify({ error: 'No deferred CRM config found. Run configure_crm_pipeline first.' }))
        }

        let config: any
        try {
          config = JSON.parse(readFileSync(configFile, 'utf-8'))
        } catch (parseErr) {
          return text(JSON.stringify({ error: `Deferred CRM config file contains invalid JSON. Delete ${configFile} and re-run configure_crm_pipeline.` }))
        }
        if (!config.deferred || !config.pipeline) {
          return text(JSON.stringify({ error: 'Invalid deferred config format.' }))
        }

        const twentyApiUrl = process.env.TWENTY_API_URL
        const twentyApiKey = process.env.TWENTY_API_KEY

        if (!twentyApiUrl || !twentyApiKey) {
          return text(JSON.stringify({
            error: 'TWENTY_API_URL and TWENTY_API_KEY must be set to apply CRM config.',
          }))
        }

        const pipeline = config.pipeline

        // Create pipeline
        const pipelineRes = await fetch(`${twentyApiUrl}/api`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${twentyApiKey}` },
          body: JSON.stringify({
            query: `mutation CreatePipeline($input: PipelineCreateInput!) { createPipeline(data: $input) { id } }`,
            variables: { input: { name: pipeline.name } },
          }),
        })

        if (!pipelineRes.ok) {
          return text(JSON.stringify({ error: `Twenty API returned ${pipelineRes.status}: ${await pipelineRes.text()}` }))
        }

        const pipelineResult = await pipelineRes.json()
        const pipelineId = pipelineResult?.data?.createPipeline?.id

        if (!pipelineId) {
          const errors = pipelineResult?.errors?.map((e: any) => e.message).join(', ') || 'Unknown error'
          return text(JSON.stringify({ error: `Failed to create pipeline: ${errors}` }))
        }

        // Create stages
        const stageIds: string[] = []
        for (const [i, stageName] of pipeline.stages.entries()) {
          try {
            const stageRes = await fetch(`${twentyApiUrl}/api`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${twentyApiKey}` },
              body: JSON.stringify({
                query: `mutation CreateStage($input: PipelineStepCreateInput!) { createPipelineStep(data: $input) { id } }`,
                variables: { input: { name: stageName, pipelineId, position: i } },
              }),
            })
            const stageResult = await stageRes.json()
            stageIds.push(stageResult?.data?.createPipelineStep?.id || '')
          } catch {
            stageIds.push('')
          }
        }

        // Write sync config on successful application
        const syncPath = resolve(ROOT, 'crm-sync-config.json')
        safeWrite(syncPath, JSON.stringify({
          pipelineId,
          stageIds,
          pipeline: config.pipeline,
          syncMappings: config.pipeline.contactProperties?.map((prop: any) => ({
            sourceField: prop.name,
            targetField: prop.name,
            type: prop.type,
          })) || [],
        }, null, 2))

        // Clean up deferred config
        let cleanupWarning = ''
        try { unlinkSync(configFile) } catch {
          cleanupWarning = ' Warning: Could not delete deferred config file — it may be re-applied on next run.'
        }

        updateStep('crm', 'completed', ['crm-pipeline-applied', 'crm-sync-config.json'])

        return text(JSON.stringify({ pipelineId, stageIds, message: `Deferred CRM config applied successfully.${cleanupWarning}` }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 9: generate_email_sequence
  // ═══════════════════════════════════════════════
  {
    name: 'generate_email_sequence',
    description: 'Generate a React Email template (.tsx) for an email sequence. Always creates the template file. Email sending requires RESEND_API_KEY to be configured.',
    parameters: {
      sequence: z.string().describe('JSON string of EmailSequence definition'),
      businessContext: z.string().describe('JSON string with business name, type, and conversion info'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const sequence = JSON.parse(args.sequence as string)
        const context = JSON.parse(args.businessContext as string)

        updateStep('email', 'in-progress')

        const templateName = sequence.name.replace(/[_\s]+/g, '-').toLowerCase()
        const componentName = sequence.name
          .split(/[_\s-]+/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('')

        // Generate React Email template
        const templateContent = `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ${componentName}Props {
${sequence.dataFields.map((f: string) => `  ${f}?: string`).join('\n')}
}

export default function ${componentName}({
${sequence.dataFields.map((f: string) => `  ${f} = '',`).join('\n')}
}: ${componentName}Props) {
  return (
    <Html>
      <Head />
      <Preview>${sequence.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>${context.businessName || 'Company'}</Heading>
          <Section>
            <Text style={text}>
              ${sequence.purpose}
            </Text>
${sequence.dataFields.map((f: string) => `            {${f} && <Text style={text}>{${f}}</Text>}`).join('\n')}
          </Section>
          <Text style={footer}>
            &copy; {new Date().getFullYear()} ${context.businessName || 'Company'}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 48px', maxWidth: '600px' }
const heading = { fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }
const text = { fontSize: '16px', lineHeight: '24px', color: '#374151' }
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }
`

        const templatePath = resolve(NEXT_APP, `src/emails/${templateName}.tsx`)
        safeWrite(templatePath, templateContent)

        const filePath = `templates/next-app/src/emails/${templateName}.tsx`

        // Update email trigger mappings
        const triggersPath = resolve(NEXT_APP, 'src/webhooks/email-triggers.ts')
        let triggersContent: string
        let triggerWarning = ''

        if (existsSync(triggersPath)) {
          triggersContent = readFileSync(triggersPath, 'utf-8')

          // Add import if not already present
          const importLine = `import ${componentName} from '../emails/${templateName}'`
          if (!triggersContent.includes(importLine)) {
            // Insert after the last import line using line-by-line search
            const lines = triggersContent.split('\n')
            let lastImportLineIdx = -1
            for (let j = 0; j < lines.length; j++) {
              if (lines[j].startsWith('import ')) lastImportLineIdx = j
            }
            if (lastImportLineIdx >= 0) {
              lines.splice(lastImportLineIdx + 1, 0, importLine)
            } else {
              lines.unshift(importLine)
            }
            triggersContent = lines.join('\n')
          }

          // Add trigger mapping if not present
          const triggerEntry = `  '${sequence.trigger}': { template: ${componentName}, subject: '${sequence.subject.replace(/'/g, "\\'")}', delay: '${sequence.delay || '0'}' },`
          if (!triggersContent.includes(`'${sequence.trigger}'`)) {
            triggersContent = triggersContent.replace(
              /export const emailTriggers[^{]*\{/,
              (match) => match + '\n' + triggerEntry,
            )
          } else {
            triggerWarning = ` Warning: Trigger '${sequence.trigger}' already exists — skipped. Delete the existing entry in email-triggers.ts to overwrite.`
          }
        } else {
          // Create new trigger file
          triggersContent = `/**
 * Email trigger mappings — auto-generated by generate_email_sequence tool.
 * Maps CRM/webhook triggers to React Email templates.
 */
import ${componentName} from '../emails/${templateName}'

export interface EmailTrigger {
  template: React.ComponentType<any>
  subject: string
  delay: string
}

export const emailTriggers: Record<string, EmailTrigger> = {
  '${sequence.trigger}': { template: ${componentName}, subject: '${sequence.subject.replace(/'/g, "\\'")}', delay: '${sequence.delay || '0'}' },
}

export function getEmailTrigger(triggerName: string): EmailTrigger | undefined {
  return emailTriggers[triggerName]
}
`
        }

        safeWrite(triggersPath, triggersContent)

        const triggersRelPath = 'templates/next-app/src/webhooks/email-triggers.ts'
        updateStep('email', 'in-progress', [filePath, triggersRelPath])

        const resendWarning = !process.env.RESEND_API_KEY
          ? ' Warning: RESEND_API_KEY is not configured — email sending will not work until it is set.'
          : ''

        return text(JSON.stringify({
          templateFilePath: filePath,
          triggerFilePath: triggersRelPath,
          triggerUpdated: true,
          resendConfigured: !!process.env.RESEND_API_KEY,
          message: `Email template "${templateName}" generated. Wire up webhook triggers as needed.${resendWarning}${triggerWarning}`,
        }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 10: seed_collection
  // ═══════════════════════════════════════════════
  {
    name: 'seed_collection',
    description: 'Seed a Payload collection with realistic content via the API. Blueprint-aware when pageType is provided. Idempotent via .seed-manifest.json. Content uniqueness for cross-products depends on the LLM orchestrator providing diverse content via businessContext.entries. The tool contextualizes layout CTA text per entity/location but does not validate word count or uniqueness scores.',
    parameters: {
      collection: z.string().describe('Payload collection slug'),
      count: z.number().describe('Number of entries to create'),
      businessContext: z.string().describe('JSON string with business info for content generation'),
      relationships: z.string().optional().describe('JSON string of relationship data to link'),
      pageType: z.string().optional().describe('PageBlueprint type for layout-aware seeding'),
      cleanup: z.boolean().optional().describe('If true, delete all seeded entries for this collection'),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const collection = args.collection as string
        const count = args.count as number
        const context = JSON.parse(args.businessContext as string)
        const relationships = args.relationships ? JSON.parse(args.relationships as string) : null
        const pageType = args.pageType as string | undefined

        if (count > 200) {
          return text(JSON.stringify({ error: `Maximum 200 items per call. Received ${count}.` }))
        }

        updateStep('seed', 'in-progress')

        // Detect image capability tier
        const hasOpenAI = !!process.env.OPENAI_API_KEY
        const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY
        const imageTier = hasOpenAI ? 'dall-e' : hasUnsplash ? 'unsplash' : 'none'

        // Handle cleanup
        const shouldCleanup = args.cleanup as boolean | undefined
        if (shouldCleanup) {
          const manifest = readSeedManifest()
          if (manifest) {
            const toDelete = manifest.entries.filter(e => e.collection === collection)
            let deleted = 0
            for (const entry of toDelete) {
              try {
                await req.payload.delete({ collection, id: entry.id })
                deleted++
              } catch {}
            }
            // Remove cleaned entries from seed manifest
            const updatedManifest = readSeedManifest()
            if (updatedManifest) {
              updatedManifest.entries = updatedManifest.entries.filter(e => e.collection !== collection)
              updatedManifest.progress.current = updatedManifest.entries.length
              writeSeedManifest(updatedManifest)
            }
            return text(JSON.stringify({ cleaned: deleted, collection }))
          }
          return text(JSON.stringify({ cleaned: 0, message: 'No seed manifest found.' }))
        }

        // Check for existing seed manifest for resume
        const existingManifest = readSeedManifest()
        const alreadySeeded = existingManifest?.entries
          .filter(e => e.collection === collection)
          .map(e => e.slug) || []

        const created: string[] = []
        const skipped: string[] = []
        const failures: string[] = []

        for (let i = 0; i < count; i++) {
          try {
            // Generate content data — the LLM orchestrator should provide actual content
            // This tool creates the structure and lets the orchestrator fill specifics
            const data: Record<string, unknown> = {
              ...context.entries?.[i],
              _status: 'published',
            }

            // Blueprint-aware layout generation
            if (pageType && !data.layout) {
              const layoutContext = {
                entityName: (data.name || data.title) as string,
                locationName: data.locationName as string,
                businessName: context.businessName,
                phone: context.phone,
              }
              data.layout = generateBlueprintLayout(pageType, layoutContext)
            }

            // Add relationships if provided
            if (relationships && context.entries?.[i]) {
              for (const [field, value] of Object.entries(relationships)) {
                data[field] = value
              }
            }

            const slug = data.slug as string
            if (slug && alreadySeeded.includes(slug)) {
              skipped.push(slug)
              continue
            }

            const result = await req.payload.create({
              collection,
              data: data as any,
            })

            const entrySlug = (result as any).slug || String(result.id)
            created.push(entrySlug)
            updateSeedProgress({ collection, id: String(result.id), slug: entrySlug })
          } catch (err) {
            failures.push(`Entry ${i}: ${err instanceof Error ? err.message : String(err)}`)
          }
        }

        return text(JSON.stringify({
          created: created.length,
          skipped: skipped.length,
          failed: failures.length,
          ids: created,
          imageTier,
          failures: failures.length > 0 ? failures : undefined,
        }, null, 2))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 11: generate_nav
  // ═══════════════════════════════════════════════
  {
    name: 'generate_nav',
    description: 'Generate navigation configuration (header + footer) from the business model navigation structure.',
    parameters: {
      navStructure: z.string().describe('JSON string of NavDefinition'),
      primaryEntity: z.string().describe('Primary entity collection slug for dropdown'),
      secondaryLinks: z.string().optional().describe('JSON string of additional nav links'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const nav = JSON.parse(args.navStructure as string)
        const primaryEntity = args.primaryEntity as string

        updateStep('nav', 'in-progress')

        const navConfigContent = `import type { NavItem, FooterSection } from './nav-config'

// Generated navigation configuration
export const primaryNav: NavItem[] = ${JSON.stringify(nav.primary.map((item: any) => ({
          ...item,
          ...(item.collection === primaryEntity && {
            dynamic: {
              collection: primaryEntity,
              pathPrefix: `/${primaryEntity}`,
              labelField: 'name',
            },
          }),
        })), null, 2)}

export const secondaryNav: NavItem[] = ${JSON.stringify(nav.secondary || [], null, 2)}

export const footerSections: FooterSection[] = ${JSON.stringify(nav.footer || [], null, 2)}
`

        const configPath = resolve(ASTRO_SITE, 'src/lib/nav-config.ts')
        safeWrite(configPath, navConfigContent)

        updateStep('nav', 'completed', ['templates/astro-site/src/lib/nav-config.ts'])

        return text(JSON.stringify({
          headerUpdated: true,
          footerUpdated: true,
          message: 'Navigation config updated at templates/astro-site/src/lib/nav-config.ts',
        }))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  // ═══════════════════════════════════════════════
  // Tool 12: validate_generation
  // ═══════════════════════════════════════════════
  {
    name: 'validate_generation',
    description: 'Validate the generated website by running TypeScript checks and builds. Reports build status and errors.',
    parameters: {
      manifest: z.string().describe('JSON string of GenerationOutput with all generated file paths'),
    },
    handler: async (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      try {
        const manifest = JSON.parse(args.manifest as string)

        updateStep('validate', 'in-progress')

        const errors: string[] = []

        // Run TypeScript check on next-app
        try {
          execSync('npx tsc --noEmit', { cwd: NEXT_APP, timeout: 120000 })
        } catch (err: any) {
          if (err.killed || err.signal === 'SIGTERM') {
            errors.push('Next.js TypeScript check timed out after 120 seconds')
          } else {
            errors.push(`Next.js TypeScript errors:\n${err.stdout?.toString() || err.message}`)
          }
        }

        // Run Astro check
        try {
          execSync('npx astro check', { cwd: ASTRO_SITE, timeout: 120000 })
        } catch (err: any) {
          if (err.killed || err.signal === 'SIGTERM') {
            errors.push('Astro check timed out after 120 seconds')
          } else {
            const output = err.stdout?.toString() || err.message
            // Filter to only actual errors, not warnings
            if (output.includes('error')) {
              errors.push(`Astro errors:\n${output}`)
            }
          }
        }

        // Check that all generated files exist
        const missingFiles: string[] = []
        for (const file of manifest.collections || []) {
          if (!existsSync(resolve(ROOT, file))) missingFiles.push(file)
        }
        for (const file of manifest.pages || []) {
          if (!existsSync(resolve(ROOT, file))) missingFiles.push(file)
        }
        if (missingFiles.length > 0) {
          errors.push(`Missing generated files: ${missingFiles.join(', ')}`)
        }

        const buildResult = errors.length === 0 ? 'pass' : 'fail'

        updateStep('validate', buildResult === 'pass' ? 'completed' : 'in-progress', undefined, errors.join('\n'))

        return text(JSON.stringify({
          buildResult,
          errors,
          message: buildResult === 'pass'
            ? 'All validations passed! Website is ready.'
            : `${errors.length} validation error(s) found. Fix and re-run.`,
        }, null, 2))
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
]
