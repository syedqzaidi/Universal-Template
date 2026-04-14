import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const msg = (role: 'assistant' | 'user', t: string) => ({
  messages: [{ content: { text: t, type: 'text' as const }, role }],
})

export const generationPromptDefinitions = [
  {
    name: 'generation_protocol',
    title: 'Universal Website Generation Protocol',
    description: 'Complete step-by-step protocol for generating a client website from a business description. Use this prompt to guide the generation of collections, pages, blocks, CRM, emails, and content.',
    argsSchema: {
      businessDescription: z.string().describe('Natural language description of the business'),
      resumeFrom: z.string().optional().describe('Step to resume from if continuing a previous generation'),
    },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const description = args['businessDescription'] as string
      const resumeFrom = args['resumeFrom'] as string | undefined

      const resumeSection = resumeFrom
        ? `\n## RESUME POINT\nResume from step: "${resumeFrom}". Read .generation-manifest.json for previous progress.\n`
        : ''

      const text = `# Universal Website Generation Protocol

You are generating a complete website stack from the following business description:

> ${description}
${resumeSection}
Follow these steps exactly. After each step, update .generation-manifest.json with status.

## Phase 1: Analysis (no file writes)
1. Call \`analyze_business\` with the description above
2. Review the returned BusinessModel
3. If questions are returned instead, ask the user and re-analyze
4. Confirm the plan with the user before proceeding

## Phase 2: Layer 1 Verification
1. Verify Layer 1 primitives are in place (SEOLayout, BlockRenderer, registries)
2. Identify which universal blocks will be reused
3. Identify which new business-specific blocks are needed
4. Plan the complete file manifest

## Phase 3: Collection Generation
For each entity in the business model:
1. Call \`generate_collection\` with the entity definition
2. Verify TypeScript compiles after each collection
3. After all collections: payload.config.ts, shared types, and shared client are updated

## Phase 4: Cross-Product Generation
For each cross-product in the business model:
1. Call \`generate_cross_product_collection\` with parent entities
2. Quality gate: contentQualityScore threshold = 65

## Phase 5: Block Generation
1. List universal blocks being reused (no generation needed)
2. For each new block: call \`generate_block\`
3. Verify block-registry.ts is updated

## Phase 6: Route Generation
For each URL pattern:
1. Call \`generate_page\` with the appropriate blueprint
2. For listing pages: card component is generated automatically
3. Update sitemap-config.ts

## Phase 7: SEO Generation
1. Call \`generate_schema\` for each page type
2. Verify schema-registry.ts is updated

## Phase 8: Integration Generation
1. Call \`configure_crm_pipeline\` (non-blocking if Twenty unreachable)
2. Call \`generate_email_sequence\` for each sequence (non-blocking if Resend unreachable)
3. Register business-specific analytics events via registerBusinessEvent() in analytics-config.ts (the file is pre-built with universal events)

## Phase 9: Content Seeding
For each collection (in dependency order — entities before cross-products):
1. Call \`seed_collection\` with pageType for blueprint-aware layout population
2. Track via .seed-manifest.json
3. Use --resume if interrupted

## Phase 10: Navigation + Validation
1. Call \`generate_nav\` with the navigation structure
2. Call \`validate_generation\` to run builds
3. Report completion status

## Rules
- NEVER proceed with ambiguous input — ask follow-up questions
- CRM and email are NON-BLOCKING — write deferred configs if services unreachable
- Max 200 cross-product pages
- Reserved slugs: pages, media, users, contacts, search, redirects, forms, form-submissions, payload-preferences, payload-migrations, plugin-ai-instructions
- All generated code must pass TypeScript
- Update .generation-manifest.json after each step
`

      return msg('assistant', text)
    },
  },
]
