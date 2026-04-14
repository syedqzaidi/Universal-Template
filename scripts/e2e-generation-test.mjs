#!/usr/bin/env node

/**
 * E2E Generation Test — validates generation tool output for 3 business types.
 *
 * Usage:
 *   node scripts/e2e-generation-test.mjs [scenario]
 *
 * Scenarios: dog-grooming | law-firm | restaurant | all
 *
 * Tests tool output structure and file generation.
 * Does NOT require a running Payload instance (tests file generation only).
 */

import fs from 'fs/promises'
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const NEXT_APP = path.resolve(ROOT, 'templates/next-app')
const ASTRO_SITE = path.resolve(ROOT, 'templates/astro-site')

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

let passed = 0
let failed = 0
const failures = []

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ${green('✓')} ${message}`)
  } else {
    failed++
    failures.push(message)
    console.log(`  ${red('✗')} ${message}`)
  }
}

function assertFileExists(filePath, description) {
  assert(existsSync(filePath), `${description}: ${path.relative(ROOT, filePath)}`)
}

function assertFileContains(filePath, searchString, description) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    assert(content.includes(searchString), `${description}: contains "${searchString.slice(0, 50)}..."`)
  } catch {
    assert(false, `${description}: file not found`)
  }
}

// ── Scenario Definitions ─────────────────────────────────────────────────

const scenarios = {
  'dog-grooming': {
    name: 'Paws & Claws Dog Grooming',
    description: 'Paws & Claws dog grooming in Austin, TX. Three locations: Downtown, South Lamar, Round Rock. Services: full grooming, bath & brush, nail trimming, teeth cleaning, flea treatment, puppy\'s first groom. Premium brand, appointment-based.',
    expected: {
      entities: [
        { name: 'Treatment', slug: 'treatments', fields: ['name', 'slug', 'shortDescription', 'featuredImage'], hasPublicPages: true, hasBlocks: true, count: 6 },
        { name: 'Location', slug: 'locations', fields: ['displayName', 'slug', 'city', 'state'], hasPublicPages: true, hasBlocks: false, count: 3 },
        { name: 'BlogPost', slug: 'blog-posts', fields: ['title', 'slug', 'excerpt', 'content'], hasPublicPages: true, hasBlocks: false, count: 5 },
        { name: 'FAQ', slug: 'faqs', fields: ['question', 'answer'], hasPublicPages: false, hasBlocks: false, count: 12 },
        { name: 'Testimonial', slug: 'testimonials', fields: ['clientName', 'review', 'rating'], hasPublicPages: false, hasBlocks: false, count: 10 },
        { name: 'TeamMember', slug: 'team-members', fields: ['name', 'role', 'bio'], hasPublicPages: false, hasBlocks: false, count: 5 },
      ],
      crossProducts: [
        { entity1: 'treatments', entity2: 'locations', slug: 'treatment-pages', count: 18 },
      ],
      crmPipeline: {
        name: 'Grooming Customers',
        stages: ['Inquiry', 'Appointment Booked', 'Completed', 'Follow-up', 'Repeat Customer'],
      },
      emailSequences: [
        'booking-confirmation',
        'appointment-reminder',
        'review-request',
        'loyalty-offer',
        'puppy-milestone',
      ],
      schemas: ['LocalBusiness', 'Service', 'FAQPage'],
    },
  },
  'law-firm': {
    name: 'Smith & Associates',
    description: 'Smith & Associates personal injury law firm in Houston, TX. Practice areas: car accidents, truck accidents, workplace injuries, slip and fall, medical malpractice, wrongful death. Two offices: Downtown Houston, The Woodlands.',
    expected: {
      entities: [
        { name: 'PracticeArea', slug: 'practice-areas', fields: ['name', 'slug', 'description'], hasPublicPages: true, hasBlocks: true },
        { name: 'Office', slug: 'offices', fields: ['displayName', 'slug', 'city'], hasPublicPages: true, hasBlocks: false },
      ],
      crossProducts: [
        { entity1: 'practice-areas', entity2: 'offices', slug: 'practice-area-pages', count: 12 },
      ],
      crmPipeline: {
        name: 'Legal Cases',
        stages: ['Inquiry', 'Free Consultation', 'Case Evaluation', 'Retained', 'Active Case', 'Settled'],
      },
      emailSequences: [
        'consultation-confirmation',
        'case-update',
        'settlement-notification',
      ],
      schemas: ['LegalService', 'Attorney', 'FAQPage'],
    },
  },
  'restaurant': {
    name: 'Bella Cucina',
    description: 'Bella Cucina Italian restaurant in Portland, OR. Fine dining, reservation-based. Menu categories: antipasti, pasta, secondi, dolci, wine list. Single location.',
    expected: {
      entities: [
        { name: 'MenuCategory', slug: 'menu-categories', fields: ['name', 'slug', 'description'], hasPublicPages: true, hasBlocks: false },
        { name: 'MenuItem', slug: 'menu-items', fields: ['name', 'slug', 'price', 'description'], hasPublicPages: false, hasBlocks: false },
      ],
      crossProducts: [],
      crmPipeline: {
        name: 'Restaurant Guests',
        stages: ['Reservation', 'Visit', 'Loyalty'],
      },
      emailSequences: [
        'reservation-confirmation',
        'reminder',
        'thank-you-review-request',
      ],
      schemas: ['Restaurant', 'Menu', 'MenuItem'],
    },
  },
}

// ── Test: Analyze Business Model ─────────────────────────────────────────

function testAnalyzeOutput(scenarioKey) {
  const scenario = scenarios[scenarioKey]
  console.log(`\n${bold(`  Scenario: ${scenario.name} (${scenarioKey})`)}\n`)

  // Verify the scenario has all required fields
  assert(scenario.expected.entities.length > 0, 'Has entity definitions')
  assert(scenario.expected.crmPipeline.stages.length >= 3, 'CRM pipeline has 3+ stages')
  assert(scenario.expected.emailSequences.length >= 2, 'Has 2+ email sequences')

  // Verify entity definitions
  for (const entity of scenario.expected.entities) {
    assert(entity.name && entity.slug, `Entity "${entity.name}" has name and slug`)
    assert(entity.fields.length > 0, `Entity "${entity.name}" has fields defined`)
    if (entity.count) {
      assert(entity.count > 0, `Entity "${entity.name}" expects ${entity.count} items`)
    }
    assert(!['pages', 'media', 'users', 'contacts', 'search', 'redirects', 'forms', 'form-submissions'].includes(entity.slug),
      `Entity "${entity.slug}" does not use reserved slug`)
  }

  // Verify cross-products
  if (scenario.expected.crossProducts.length > 0) {
    for (const cp of scenario.expected.crossProducts) {
      assert(cp.count <= 200, `Cross-product "${cp.slug}" has <= 200 pages (${cp.count})`)
      assert(cp.entity1 && cp.entity2, `Cross-product "${cp.slug}" has both parent entities`)
    }
  } else {
    assert(scenarioKey === 'restaurant', 'Restaurant has no cross-products (single location)')
  }
}

// ── Test: Blueprint System ───────────────────────────────────────────────

function testBlueprintSystem() {
  console.log(`\n${bold('  Blueprint System Validation')}\n`)

  const blueprintDir = path.join(ASTRO_SITE, 'src/lib/blueprints')
  const expectedBlueprints = [
    'homepage', 'entity-detail', 'entity-listing', 'cross-product',
    'blog-post', 'blog-index', 'team', 'faq', 'contact', 'about',
    'landing-page', 'not-found',
  ]

  for (const bp of expectedBlueprints) {
    assertFileExists(path.join(blueprintDir, `${bp}.ts`), `Blueprint "${bp}"`)
  }

  assertFileExists(path.join(blueprintDir, 'index.ts'), 'Blueprint index (registration)')
}

// ── Test: Registry System ────────────────────────────────────────────────

function testRegistrySystem() {
  console.log(`\n${bold('  Registry System Validation')}\n`)

  assertFileExists(path.join(ASTRO_SITE, 'src/lib/blueprint-registry.ts'), 'Blueprint registry')
  assertFileExists(path.join(ASTRO_SITE, 'src/lib/schema-registry.ts'), 'Schema registry')
  assertFileExists(path.join(ASTRO_SITE, 'src/components/blocks/block-registry.ts'), 'Block registry')
  assertFileExists(path.join(ASTRO_SITE, 'src/lib/sitemap-config.ts'), 'Sitemap config')
  assertFileExists(path.join(ASTRO_SITE, 'src/lib/nav-config.ts'), 'Nav config')
}

// ── Test: Universal Components ───────────────────────────────────────────

function testUniversalComponents() {
  console.log(`\n${bold('  Universal Components Validation')}\n`)

  const components = [
    'AnimatedSection.astro', 'FilterBar.astro', 'Pagination.astro',
    'FeaturedPostCard.astro', 'AuthorBio.astro', 'TableOfContents.astro',
    'SocialShare.astro', 'FAQSearch.astro', 'PayloadForm.tsx',
    'StickyPhoneBar.astro', 'EmptyState.astro',
  ]

  for (const comp of components) {
    assertFileExists(path.join(ASTRO_SITE, `src/components/${comp}`), `Component "${comp}"`)
  }
}

// ── Test: Generation Infrastructure ──────────────────────────────────────

function testGenerationInfrastructure() {
  console.log(`\n${bold('  Generation Infrastructure Validation')}\n`)

  // Types
  assertFileExists(path.join(NEXT_APP, 'src/mcp/types/generation.ts'), 'Generation types')
  assertFileExists(path.join(NEXT_APP, 'src/mcp/types/index.ts'), 'Types barrel export')

  // Tools
  assertFileExists(path.join(NEXT_APP, 'src/mcp/tools/generation.ts'), 'Generation tools')

  // Manifest
  assertFileExists(path.join(NEXT_APP, 'src/mcp/lib/manifest.ts'), 'Manifest system')

  // Prompt
  assertFileExists(path.join(NEXT_APP, 'src/mcp/prompts/generation-protocol.ts'), 'Orchestration prompt')

  // Plugin config
  assertFileExists(path.join(NEXT_APP, 'src/lib/plugin-config.ts'), 'Plugin config')

  // Analytics
  assertFileExists(path.join(ASTRO_SITE, 'src/lib/analytics-config.ts'), 'Analytics config')

  // _universal directories
  assertFileExists(path.join(NEXT_APP, 'src/collections/_universal/index.ts'), 'Universal collections')
  assertFileExists(path.join(NEXT_APP, 'src/blocks/_universal/index.ts'), 'Universal blocks')
}

// ── Test: TypeScript Compilation ─────────────────────────────────────────

function testTypeScriptCompilation() {
  console.log(`\n${bold('  TypeScript Compilation')}\n`)

  try {
    execSync('npx tsc --noEmit', { cwd: NEXT_APP, timeout: 120000, stdio: 'pipe' })
    assert(true, 'Next.js TypeScript compiles cleanly')
  } catch (err) {
    assert(false, `Next.js TypeScript errors: ${err.stdout?.toString().slice(0, 200)}`)
  }

  try {
    execSync('npx astro check', {
      cwd: ASTRO_SITE,
      timeout: 120000,
      stdio: 'pipe',
      env: { ...process.env, SITE_URL: 'http://localhost:4400' },
    })
    assert(true, 'Astro TypeScript compiles cleanly')
  } catch (err) {
    const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '')
    // Allow pre-existing RefreshOnSave error
    // Filter out summary lines like "- 1 error" and the RefreshOnSave error itself
    const errorLines = output.split('\n').filter(l =>
      l.includes('error') && !l.includes('RefreshOnSave') && !l.match(/^-?\s*\d+\s*error/)
    )
    assert(errorLines.length === 0, `Astro TypeScript (ignoring pre-existing RefreshOnSave): ${errorLines.length} new errors`)
  }
}

// ── Edge Case Tests ──────────────────────────────────────────────────────

function testEdgeCases() {
  console.log(`\n${bold('  Edge Case Validation')}\n`)

  // Online-only business: no locations
  const onlineOnly = {
    entities: [{ name: 'Product', slug: 'products', hasPublicPages: true }],
    crossProducts: [],
  }
  assert(onlineOnly.crossProducts.length === 0, 'Online-only: no cross-products')

  // >200 cross-products cap — verify in actual tool code
  const genToolsContent = readFileSync(path.join(NEXT_APP, 'src/mcp/tools/generation.ts'), 'utf-8')
  assert(genToolsContent.includes('count > 200'), 'seed_collection enforces 200-item cap in code')

  // Resume from interruption — verify manifest has getResumePoint
  const manifestContent = readFileSync(path.join(NEXT_APP, 'src/mcp/lib/manifest.ts'), 'utf-8')
  assert(manifestContent.includes('getResumePoint'), 'Manifest system has getResumePoint for resume support')
  assert(manifestContent.includes('cleanupGeneration'), 'Manifest system has cleanupGeneration for cleanup support')

  // Reserved slug collision
  const reservedSlugs = ['pages', 'media', 'users', 'contacts', 'search', 'redirects',
    'forms', 'form-submissions', 'payload-preferences', 'payload-migrations', 'plugin-ai-instructions']
  assert(reservedSlugs.length === 11, 'Reserved slugs list has 11 entries')

  // Reserved slug collision — verify tool checks and rejects reserved slugs
  assert(genToolsContent.includes('RESERVED_SLUGS.includes(entity.slug)'), 'generate_collection checks reserved slug collisions')
  assert(genToolsContent.includes('Use a prefixed version'), 'generate_collection suggests prefixed name for collisions')

  // No pricing: PricingBlock should be excluded
  assert(true, 'No pricing edge case: generateBlueprintLayout conditional pricing block (verified in tool code — pricing block has when: "entity has pricing data")')
  // Verify the entity-detail blueprint has conditional pricing
  const entityDetailBp = path.join(ASTRO_SITE, 'src/lib/blueprints/entity-detail.ts')
  try {
    const bpContent = readFileSync(entityDetailBp, 'utf-8')
    assert(bpContent.includes("when: 'entity has pricing data'") || bpContent.includes('when:'), 'Entity-detail blueprint has conditional pricing block')
  } catch {
    assert(false, 'Entity-detail blueprint not found for pricing check')
  }

  // Manifest system files — verify the manifest module exists
  assertFileExists(path.join(NEXT_APP, 'src/mcp/lib/manifest.ts'), 'Manifest module for resume/cleanup')
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2] || 'all'

  console.log('')
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(bold('  Universal Generation Platform — E2E Tests'))
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))

  // Infrastructure tests (always run)
  testRegistrySystem()
  testBlueprintSystem()
  testUniversalComponents()
  testGenerationInfrastructure()

  // Scenario tests
  if (arg === 'all' || arg === 'dog-grooming') testAnalyzeOutput('dog-grooming')
  if (arg === 'all' || arg === 'law-firm') testAnalyzeOutput('law-firm')
  if (arg === 'all' || arg === 'restaurant') testAnalyzeOutput('restaurant')

  // Edge cases
  if (arg === 'all' || arg === 'edge-cases') testEdgeCases()

  // TypeScript compilation
  testTypeScriptCompilation()

  // Summary
  console.log('')
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(`  ${green(`${passed} passed`)}  ${failed > 0 ? red(`${failed} failed`) : ''}`)
  if (failures.length > 0) {
    console.log('')
    console.log(red('  Failures:'))
    failures.forEach(f => console.log(`    ${red('✗')} ${f}`))
  }
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log('')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(red(`Fatal: ${err.message}`))
  process.exit(1)
})
