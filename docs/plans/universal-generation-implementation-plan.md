# Universal Generation Platform — Complete Implementation Plan

> **Source of Truth** — This document contains every implementation detail extracted from both spec documents, the existing codebase analysis, and prior conversation history. All information needed to implement, test, and verify is here.

---

## Table of Contents

1. [Context & Goals](#1-context--goals)
2. [Current System Inventory](#2-current-system-inventory)
3. [Complete Type Definitions](#3-complete-type-definitions)
4. [Phase 1: Layer 1 Extraction](#4-phase-1-layer-1-extraction)
5. [Phase 2: Generation Engine Core](#5-phase-2-generation-engine-core)
6. [Phase 3: Integration Generation](#6-phase-3-integration-generation)
7. [Phase 4: Validation & Polish](#7-phase-4-validation--polish)
8. [All 12 PageBlueprint Definitions](#8-all-12-pageblueprint-definitions)
9. [All 11 MCP Tool Specifications](#9-all-11-mcp-tool-specifications)
10. [Master Orchestration Prompt](#10-master-orchestration-prompt)
11. [Content Seeding Strategy](#11-content-seeding-strategy)
12. [Design Tokens & CSS Mappings](#12-design-tokens--css-mappings)
13. [Error Handling & Recovery](#13-error-handling--recovery)
14. [Breaking Changes & Migration](#14-breaking-changes--migration)
15. [Risk Assessment & Mitigations](#15-risk-assessment--mitigations)
16. [Post-Phase Audit Protocol](#16-post-phase-audit-protocol)
17. [Reference: Existing Files to Reuse](#17-reference-existing-files-to-reuse)
18. [Environment Variables](#18-environment-variables)
19. [Reserved Slugs](#19-reserved-slugs)
20. [Example Generations](#20-example-generations)
21. [Pre-Implementation Fixes](#21-pre-implementation-fixes)

---

## 1. Context & Goals

### What This Is

The Agency Web Stack monorepo needs a system that generates complete client websites from natural language business descriptions. Two spec documents define this system:

1. **Universal Generation Platform** (`docs/specs/2026-04-13-universal-generation-platform-spec.md`) — 11 MCP tools, orchestration prompt, manifest system, two-layer architecture (universal primitives + generated business-specific code)
2. **Page Blueprint Design System** (`docs/specs/2026-04-13-page-blueprint-design-system.md`) — 12 PageBlueprint types controlling page structure, CRO rules, SEO rules, visual rhythm, and content seeding

### The Problem

Currently, each client website requires manual collection configuration, page creation, block setup, CRM pipeline configuration, email template writing, and content seeding. This takes hours per project and produces inconsistent results.

### The Solution

A user describes their business in natural language → Claude Code (guided by an orchestration prompt and 11 MCP tools) generates:
- Payload CMS collections (data models with fields, access control, versioning, hooks)
- Astro pages with SSR (data fetching, SEO, caching, breadcrumbs)
- Business-specific blocks (Payload config + Astro component)
- JSON-LD structured data (schema.org generators)
- Navigation configuration (header/footer from entity structure)
- Twenty CRM pipeline (stages, properties, automations)
- Email sequences (React Email templates + webhook triggers)
- Realistic seed content (blueprint-aware layout array population)
- Sitemap configuration (all public collections)

### Architecture

**Layer 1 (Universal)** — Pre-built primitives that never change:
- 3 universal collections (Pages, Media, Users) in `_universal/`
- 13 universal blocks in `_universal/`
- 11 new universal Astro components
- 5 registry files (blueprint, schema, block, sitemap, nav)
- SEO infrastructure (SEOLayout, Breadcrumbs, schema generators)
- BlockRenderer with section metadata support

**Layer 2 (Generation Engine)** — 11 MCP tools that produce business-specific code:
- `analyze_business` → BusinessModel JSON
- `generate_collection` → Payload collection .ts files
- `generate_cross_product_collection` → Entity combination collections
- `generate_page` → Astro .astro route files
- `generate_block` → Payload block config + Astro component
- `generate_schema` → JSON-LD generator functions
- `configure_crm_pipeline` → Twenty CRM pipeline
- `generate_email_sequence` → React Email templates
- `seed_collection` → CMS content via Payload API
- `generate_nav` → Header/footer config
- `validate_generation` → Build verification

**Key Innovation:** Section metadata (background, width, animation) lives in PageBlueprints, NOT in Payload data. BlockRenderer maps `layout[]` indices to `blueprintSections[]` at render time. Payload data stays clean — styling is centralized and can be changed globally without touching content.

**Key Innovation:** Registry pattern replaces all hardcoded switch statements. Generated code appends entries to registries without modifying existing source code. This enables unlimited business types.

### Prior Conversation Context

- Specs were written on 2026-04-13 in the `Website-Template` project directory (now `Universal-Template`)
- 33 pSEO MCP tools were built on 2026-04-10 — these are the existing content/SEO tools, distinct from the 11 new generation tools
- Live preview issues were fixed on 2026-04-12 (layout blocks not rendering in preview)
- An unresolved design question exists about whether to strip Services/Locations/ServicePages from the base template before generation — the specs assume these are generated fresh per-business

---

## 2. Current System Inventory

### Payload Collections (11)

| Collection | File | Key Fields | Features |
|-----------|------|------------|----------|
| Pages | `collections/Pages.ts` | title, slug, excerpt, featuredImage, content, layout | Versioning, drafts, live preview, auto-slug |
| Services | `collections/Services.ts` | name, slug, category, shortDescription, description, featuredImage, gallery, features[], pricing, seoTitle, seoDescription | relatedLocations relationship, schema.org support |
| Locations | `collections/Locations.ts` | displayName, slug, type, city, state, coordinates, zipCode, description, areaInfo, seoTitle, seoDescription | parentLocation (hierarchical), nested docs |
| ServicePages | `collections/ServicePages.ts` | title, slug, headline, introduction, localContent, layout, contentQualityScore | service + location relationships, quality gate (score < 50 blocks publish) |
| BlogPosts | `collections/BlogPosts.ts` | title, slug, excerpt, content, featuredImage, author, publishedAt, category, tags[], seoTitle, seoDescription | relatedServices, relatedLocations, scheduled publish |
| FAQs | `collections/FAQs.ts` | question, answer, service?, location?, sortOrder | Public read access |
| Testimonials | `collections/Testimonials.ts` | clientName, clientTitle, review, rating (1-5), date, avatar, service, location, featured, source | Multi-source tracking |
| TeamMembers | `collections/TeamMembers.ts` | name, role, bio, photo, email, phone, specialties, location, social[] | Location + service relationships |
| Media | `collections/Media.ts` | filename, url, alt, caption, mimeType, sizes | S3 or Vercel Blob storage |
| Users | `collections/Users.ts` | email, password, name, role (admin/editor/viewer) | API key support, Stripe sync, Twenty sync |
| Contacts | `collections/Contacts.ts` | (conditional: TWENTY_API_URL) | Form submission bridge to Twenty CRM |

### Payload Blocks (12)

| Block | Slug | Key Fields |
|-------|------|------------|
| HeroBlock | `hero` | heading, subheading, backgroundImage, CTA, phone, 4 style variants, overlay opacity |
| ServiceDetailBlock | `serviceDetail` | name, description, features[], pricing, comparison table |
| FAQBlock | `faq` | question-answer pairs, service/location filters, accordion |
| TestimonialsBlock | `testimonials` | testimonial, rating, avatar, carousel/grid layout |
| CTABlock | `cta` | heading, description, button text/link, background |
| LocationMapBlock | `locationMap` | map embed, address, contact info, directions |
| ContentBlock | `content` | richText, optional background image, width options |
| StatsBlock | `stats` | metric name, value, unit, grid layout |
| GalleryBlock | `gallery` | images[], captions, lightbox, column count |
| PricingBlock | `pricing` | tier cards, feature lists, CTA per tier |
| TeamBlock | `team` | member selection, grid layout, social links |
| RelatedLinksBlock | `relatedLinks` | link cards to related content |

### Payload Plugins (11 + 1 conditional)

1. Nested Docs (pages, services)
2. Redirects (pages, services, locations, service-pages, blog-posts)
3. SEO (auto meta titles/descriptions, OG images, JSON-LD)
4. Search (full-text indexing with priorities)
5. Form Builder (12 field types, Stripe, Twenty CRM sync)
6. Import/Export (CSV/JSON)
7. Storage Adapters (S3 or Vercel Blob)
8. Stripe (customer sync)
9. Twenty CRM (form + user sync)
10. MCP Plugin (33+ tools, 5 prompts)
11. Sentry (error tracking)
12. PayloadAI Plugin (conditional — text gen, image gen, translate)

### MCP Tools (61 existing)

Across 8 tool files: content-lifecycle, seo-indexing, content-quality, cro, i18n, search-redirects, media, forms, plus 8 pSEO tool files (pseo-seeding, pseo-page-generation, pseo-keywords, pseo-quality, pseo-architecture, pseo-lifecycle, pseo-local-seo, pseo-launch).

### Astro Pages (19 routes)

- Static: `/`, `/contact`, `/faq`, `/team`, `/privacy`, `/terms`, `/404`
- Dynamic SSR: `/services`, `/services/[slug]`, `/services/[service]/[city]`, `/blog`, `/blog/[slug]`, `/locations`, `/locations/[city]`, `/search`, `/preview`
- Meta: `sitemap-index.xml.ts`, `sitemap.xml.ts`, `robots.txt.ts`

### Astro Components (16 shadcn/ui)

button, card, dialog, tabs, badge, avatar, table, input, label, field, form, navigation-menu, dropdown-menu, sheet, separator, sonner

### Key Infrastructure Files

| File | Purpose |
|------|---------|
| `templates/next-app/src/payload.config.ts` | Central Payload configuration |
| `templates/next-app/src/plugins/index.ts` | Plugin registration with `getPlugins()` |
| `templates/next-app/src/hooks/auto-generate-slug.ts` | Universal slug generation |
| `templates/next-app/src/hooks/trigger-rebuild.ts` | Cache invalidation on publish |
| `templates/next-app/src/access/index.ts` | `isAdmin`, `isAdminOrEditor`, `publishedOrLoggedIn` |
| `templates/astro-site/src/components/blocks/BlockRenderer.astro` | Block rendering switch |
| `templates/astro-site/src/layouts/SEOLayout.astro` | Base layout with SEO metadata |
| `templates/astro-site/src/components/Breadcrumbs.astro` | Navigation breadcrumbs |
| `templates/astro-site/src/lib/seo.ts` | Schema.org generator functions |
| `templates/astro-site/src/lib/payload.ts` | Payload REST API client |
| `templates/astro-site/src/lib/cache.ts` | Cache header manager |
| `templates/astro-site/src/styles/global.css` | Tailwind v4 @theme tokens (OKLCh) |
| `packages/shared/src/payload/client.ts` | Typed Payload API helpers |
| `packages/shared/src/payload/types.ts` | Shared TypeScript interfaces |
| `templates/next-app/src/lib/twenty/client.ts` | Twenty CRM GraphQL client |
| `templates/next-app/src/mcp/tools/pseo-seeding.ts` | Reference pattern for MCP tools |
| `templates/next-app/src/mcp/prompts/prompts.ts` | Reference pattern for MCP prompts |

---

## 3. Complete Type Definitions

### Generation Types (`templates/next-app/src/mcp/types/generation.ts`)

```typescript
// ═══════════════════════════════════════════════
// BUSINESS MODEL (Top-level analysis output)
// ═══════════════════════════════════════════════

interface BusinessModel {
  businessName: string                  // e.g., "Paws & Claws"
  businessType: string                  // e.g., "dog-grooming"
  industry: string                      // e.g., "pet-services"
  description: string                   // 2-3 sentence summary

  entities: EntityDefinition[]          // What content types exist
  relationships: Relationship[]         // How entities relate
  crossProducts: CrossProduct[]         // Entity combinations for pSEO

  primaryConversion: ConversionGoal     // Main user action
  secondaryConversions: ConversionGoal[]
  userJourneys: UserJourney[]           // Paths through the site

  contentPillars: string[]              // Content strategy themes
  seoStrategy: SEOStrategy              // Keyword and linking strategy

  crmPipeline: PipelineDefinition       // Twenty CRM pipeline
  emailSequences: EmailSequence[]       // Automated email campaigns

  schemaOrgTypes: string[]              // e.g., ["LocalBusiness", "Service", "FAQPage"]
  urlPatterns: URLPattern[]             // Route structure
  navStructure: NavDefinition           // Header/footer organization
}

// ═══════════════════════════════════════════════
// ENTITY DEFINITIONS (Collection blueprints)
// ═══════════════════════════════════════════════

interface EntityDefinition {
  name: string                          // e.g., "Treatment"
  slug: string                          // e.g., "treatments" (collection slug)
  purpose: string                       // Why this entity exists
  fields: FieldDefinition[]             // Every field with type, validation, relations
  hasPublicPages: boolean               // Generates frontend routes?
  hasVersioning: boolean                // Drafts/publish workflow?
  hasBlocks: boolean                    // Layout field with content blocks?
  sortField?: string                    // Default sort (e.g., "name", "-publishedAt")
  adminGroup: string                    // Payload admin sidebar group
}

interface FieldDefinition {
  name: string
  type: 'text' | 'textarea' | 'richText' | 'number' | 'select' | 'checkbox' |
        'date' | 'email' | 'upload' | 'relationship' | 'array' | 'group' | 'point' | 'json'
  required?: boolean
  unique?: boolean
  localized?: boolean                   // ONLY for text, textarea, richText
  validation?: string                   // Regex or custom description
  options?: string[]                    // For select fields
  relationTo?: string                   // For relationship fields
  hasMany?: boolean                     // For relationship fields
  fields?: FieldDefinition[]            // For array/group fields
  min?: number                          // For number/array/text length
  max?: number
  defaultValue?: any
  adminPosition?: 'sidebar'
  description?: string                  // Admin UI help text
}

interface Relationship {
  from: string                          // Entity slug
  to: string                            // Entity slug
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  fieldName: string                     // Field on the 'from' entity
  required?: boolean
}

interface CrossProduct {
  entity1: string                       // e.g., "treatments"
  entity2: string                       // e.g., "locations"
  slug: string                          // e.g., "treatment-pages"
  urlPattern: string                    // e.g., "/treatments/{treatment}/{location}"
  titlePattern: string                  // e.g., "{Treatment} in {Location}"
  purpose: string
}

// ═══════════════════════════════════════════════
// CONVERSION & USER JOURNEYS
// ═══════════════════════════════════════════════

interface ConversionGoal {
  action: string                        // e.g., "Book Appointment"
  type: 'form' | 'phone' | 'link' | 'purchase'
  ctaText: string                       // Button text
  ctaStyle: 'primary' | 'secondary'
}

interface UserJourney {
  name: string                          // e.g., "New Customer Discovery"
  steps: string[]                       // Page sequence
  conversionPoint: string
  intent: 'informational' | 'transactional' | 'navigational'
}

// ═══════════════════════════════════════════════
// CRM & EMAIL
// ═══════════════════════════════════════════════

interface PipelineDefinition {
  name: string                          // e.g., "Grooming Customers"
  stages: string[]                      // e.g., ["Inquiry", "Booked", "Completed", "Repeat"]
  contactProperties: ContactProperty[]
  automations: CRMAutomation[]
}

interface ContactProperty {
  name: string                          // CRM field name
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  options?: string[]
  source: string                        // e.g., "form field", "computed"
}

interface CRMAutomation {
  trigger: string                       // e.g., "deal enters stage 'Completed'"
  action: string                        // e.g., "send review request email"
  delay?: string                        // e.g., "24h", "7d"
  condition?: string
}

interface EmailSequence {
  name: string                          // e.g., "booking-confirmation"
  trigger: string                       // When to send
  delay?: string                        // e.g., "24h", "7d"
  subject: string
  purpose: string
  dataFields: string[]                  // What data the template needs
}

// ═══════════════════════════════════════════════
// SEO & URL STRATEGY
// ═══════════════════════════════════════════════

interface SEOStrategy {
  keywordPatterns: string[]             // e.g., ["{entity} in {location}", "{entity} near me"]
  targetIntents: string[]               // "transactional", "informational"
  contentPillars: string[]
  internalLinkingRules: string[]
  localSEO: boolean
}

interface URLPattern {
  pattern: string                       // e.g., "/treatments/[slug]"
  collection: string                    // Payload collection slug
  pageType: string                      // For schema generation & blueprint lookup
  priority: number                      // Sitemap priority (0.0-1.0)
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════

interface NavDefinition {
  primary: NavItem[]                    // Main header navigation
  secondary: NavItem[]                  // Utility links (search, phone, etc.)
  footer: FooterSection[]
}

interface NavItem {
  label: string
  href: string
  children?: NavItem[]                  // Dropdown items
  collection?: string                   // If populated from Payload collection
  fetchMethod?: string                  // e.g., "getAll"
}

interface FooterSection {
  heading: string
  links: NavItem[]
}

// ═══════════════════════════════════════════════
// GENERATION OUTPUT & MANIFESTS
// ═══════════════════════════════════════════════

interface GenerationOutput {
  collections: string[]                 // File paths of generated collection configs
  blocks: string[]                      // File paths of generated block configs
  hooks: string[]                       // File paths of generated hooks
  globals: string[]                     // File paths of new/modified globals
  pages: string[]                       // File paths of generated .astro pages
  components: string[]                  // File paths of generated components
  blockComponents: string[]             // File paths of block Astro components
  payloadConfigUpdates: string[]        // Changes to payload.config.ts
  sharedClientUpdates: string[]         // Changes to shared client
  sharedTypeUpdates: string[]           // Changes to shared types
  seoUpdates: string[]                  // Changes to seo.ts
  sitemapConfig: string                 // sitemap-config.ts path
  navConfig: string                     // nav-config.ts path
  crmConfig: string                     // CRM config path (or deferred)
  emailTemplates: string[]              // Email template paths
  emailTriggers: string                 // Webhook handler path
  analyticsConfig: string               // analytics-config.ts path
  seedScript: string                    // Seed manifest path
  buildResult: 'pass' | 'fail'
  errors: string[]
}

interface GenerationManifest {
  businessModel: string                 // Business type identifier
  startedAt: string                     // ISO 8601
  steps: Record<string, {
    status: 'completed' | 'in-progress' | 'pending' | 'deferred'
    outputs?: string[]
    error?: string
    startedAt?: string
    completedAt?: string
  }>
  generatedFiles: string[]              // All created file paths
}

interface SeedManifest {
  seededAt: string                      // ISO 8601
  entries: Array<{
    collection: string
    id: string
    slug: string
  }>
  progress: {
    current: number
    total: number
  }
}
```

### Blueprint Types (`templates/astro-site/src/types/blueprint.ts`)

```typescript
// ═══════════════════════════════════════════════
// TOKEN TYPES
// ═══════════════════════════════════════════════

type BackgroundToken = 'default' | 'muted' | 'primary' | 'dark' | 'gradient' | 'auto'
type WidthToken = 'contained' | 'full-bleed' | 'narrow'
type SpacingToken = 'compact' | 'default' | 'spacious'
type AnimationToken = 'fade-up' | 'fade-in' | 'stagger' | 'none'

// ═══════════════════════════════════════════════
// CORE BLUEPRINT INTERFACES
// ═══════════════════════════════════════════════

interface PageBlueprint {
  pageType: string
  purpose: string
  sections: SectionDefinition[]
  cro: CROConfig
  seo: BlueprintSEOConfig
  rhythm: RhythmConfig
  // Page-type-specific extensions (only one per blueprint)
  listing?: ListingConfig
  crossProduct?: CrossProductConfig
  blog?: BlogConfig
  contact?: ContactConfig
  team?: TeamConfig
  faq?: FAQConfig
  landing?: LandingConfig
  notFound?: NotFoundConfig
  entityDetail?: EntityDetailConfig
}

interface SectionDefinition {
  name: string                          // Section identifier
  required: boolean                     // Must appear in every instance
  position: 'fixed' | 'flexible'       // Fixed = always same position
  blocks: BlockChoice[]                 // CMS blocks composing this section
  purpose: string                       // What this section accomplishes
  background: BackgroundToken           // Section background
  width: WidthToken                     // Section container width
  animation: AnimationToken             // Scroll-triggered animation
}

interface BlockChoice {
  blockType: string                     // Payload block slug
  priority: 'preferred' | 'alternative' // Fallback order
  when?: string                         // Conditional: "entity has pricing data"
}

// ═══════════════════════════════════════════════
// CRO, SEO, RHYTHM CONFIGS
// ═══════════════════════════════════════════════

interface CTAPlacement {
  text: string                          // 'dynamic', 'contextual to entity', etc.
  link: string                          // '/contact' or null
  phone: string                         // 'from SiteSettings' or 'tracking number'
}

interface CROConfig {
  primaryCTA: CTAPlacement
  ctaFrequency: number                  // Max blocks between CTAs (0 = page manages)
  trustSignalPositions: string[]        // Section names for social proof
  aboveFoldRequirements: string[]       // What must be visible before scrolling
}

interface BlueprintSEOConfig {
  schemaTypes: string[]                 // e.g., ['Organization', 'WebSite']
  metaTitlePattern: string              // e.g., '{BusinessName} — {Tagline}'
  metaDescPattern: string               // e.g., '{BusinessType} in {Location}...'
  headingHierarchy: Record<string, string> // h1, h2, h3 rules
  internalLinkingRules: string[]        // Linking strategies for this page type
  noindex?: boolean                     // For landing pages
  httpStatus?: number                   // For 404 pages
}

interface RhythmConfig {
  sectionSpacing: SpacingToken          // Global spacing for this page type
  backgroundAlternation: boolean        // Auto-alternate section backgrounds
  visualBreaks: number[]                // Section indices for gradient dividers
}

// ═══════════════════════════════════════════════
// PAGE-TYPE EXTENSIONS
// ═══════════════════════════════════════════════

interface ListingConfig {
  cardComponent: string                 // e.g., 'EntityCard'
  gridColumns: { sm: number; md: number; lg: number }
  cardFields: {
    image: string                       // e.g., 'featuredImage'
    title: string                       // e.g., 'name'
    subtitle?: string                   // e.g., 'category'
    description: string                 // e.g., 'shortDescription'
    badge?: string                      // e.g., 'category'
    link: string                        // e.g., 'slug'
    meta?: string[]                     // e.g., ['date', 'readTime']
    author?: string                     // e.g., 'author.name'
  }
  filterBar: {
    enabled: boolean
    filters: string[]                   // Field values to filter by
    position: 'above' | 'sidebar'
  }
  pagination: {
    perPage: number
    layout: 'numbered' | 'load-more'
  }
  featuredPost?: boolean                // For blog index
  emptyState?: {
    heading: string
    message: string
    ctaText: string
    ctaHref: string
  }
}

interface CrossProductConfig {
  contentUniqueness: {
    minimumUniquePercentage: number     // 55
    minimumUniqueWords: number          // 600
    minimumTotalWords: number           // 1000
    qualityScoreThreshold: number       // 65 (raised from 50!)
    uniqueSections: string[]            // ['local-introduction', 'offering-details', 'faq', 'location-info']
    sharedSections: string[]            // ['hero', 'pricing', 'final-cta']
    validation: {
      pairwiseSimilarityMax: number     // 0.45
      clusterSimilarityMax: number      // 0.40
      nearDuplicateThreshold: number    // 0.60
      checkFields: string[]             // ['introduction', 'localContent', 'layout']
    }
  }
  internalLinkingMesh: {
    siblingsSameLocation: number        // 3 — same location, different offering
    siblingsSameOffering: number        // 3 — same offering, different location
    parentEntityLink: boolean           // Link to parent entity page
    parentLocationLink: boolean         // Link to parent location page
  }
  localizationRules: Array<{
    type: string
    pattern: string
    condition: string
  }>
}

interface BlogConfig {
  readingExperience: {
    maxContentWidth: string             // 'max-w-3xl'
    typographyScale: {
      h1: string                        // 'text-4xl md:text-5xl font-bold leading-tight'
      h2: string                        // 'text-2xl md:text-3xl font-semibold mt-12 mb-4'
      h3: string                        // 'text-xl md:text-2xl font-semibold mt-8 mb-3'
      body: string                      // 'text-lg leading-relaxed text-muted-foreground'
      caption: string                   // 'text-sm text-muted-foreground'
    }
    displayReadTime: boolean
  }
  tableOfContents: {
    enabled: boolean
    position: 'sticky-sidebar'
    mobileCollapsible: boolean
    activeTracking: boolean
  }
  socialSharing: {
    position: 'sticky-sidebar'
    mobilePosition: 'bottom-bar'
    breakpoint: 'lg'
    platforms: string[]                 // ['twitter', 'facebook', 'linkedin', 'copy']
  }
  authorBio: {
    enabled: boolean
    showPhoto: boolean
    showSocial: boolean
    linkToTeamPage: boolean
  }
  relatedPosts: {
    count: number                       // 3
    strategy: 'same-category' | 'same-tags' | 'recent'
  }
}

interface ContactConfig {
  form: {
    source: 'payload-form-builder'
    layout: 'stacked' | 'two-column'
    fields: {
      required: string[]                // ['name', 'email', 'message']
      optional: string[]                // ['phone', 'service', 'preferredDate']
    }
    submitButton: { text: string; style: string }
    successState: { message: string; action: 'show-inline' | 'redirect' }
    rendering: {
      component: string                 // 'PayloadForm'
      island: boolean                   // true (React island)
    }
  }
  contactDetails: {
    showPhone: boolean
    showEmail: boolean
    showAddress: boolean
    showHours: boolean
  }
  followUp: {
    automationEnabled: boolean
    triggerEmail: string
  }
}

interface TeamConfig {
  cardVariants: {
    leadership: {
      layout: string                    // 'horizontal' — never 2 per row
      fields: string[]
      maxItems: number
      gridColumns: { sm: number; md: number }
    }
    standard: {
      layout: string                    // 'vertical card'
      fields: string[]
      gridColumns: { sm: number; md: number; lg: number; xl: number }
    }
  }
  interactions: {
    hoverEffect: 'reveal-contact'
    clickAction: 'expand-bio'
  }
  socialLinks: string[]
  filterByRole: boolean
}

interface FAQConfig {
  grouping: {
    strategy: 'by-entity' | 'flat'
    generalFirst: boolean
    entityOrder: string                 // 'alphabetical' or custom
  }
  accordion: {
    behavior: 'single-open' | 'multi-open'
    animation: string
    iconStyle: string
    defaultOpen: number                 // Number of items open by default
  }
  search: {
    enabled: boolean
    position: string
    placeholder: string
    behavior: string                    // 'client-side-filter'
    noResults: string
  }
  schema: {
    generateFAQPage: boolean
    maxSchemaItems: number
    prioritize: string                  // 'most-common' or 'highest-rated'
  }
}

interface LandingConfig {
  navigation: {
    showHeader: boolean                 // false — no nav on landing pages
    showFooter: boolean                 // false
    showBreadcrumbs: boolean            // false
  }
  form: {
    position: string                    // 'sidebar'
    sticky: boolean                     // true — stays in viewport
    fields: string[]
    submitText: string                  // First-person: "Get My Free Quote"
  }
  phoneNumber: {
    prominent: boolean                  // true
    sticky: boolean                     // true — StickyPhoneBar on mobile
    trackingNumber: boolean             // Use tracking number for attribution
  }
  urgency: {
    enabled: boolean
    style: 'banner' | 'countdown' | 'none'
  }
}

interface NotFoundConfig {
  errorDisplay: {
    heading: string                     // "Page Not Found"
    subheading: string
    illustration: string                // 'minimal' or 'custom'
    tone: string                        // 'friendly'
  }
  recovery: {
    searchEnabled: boolean
    suggestedLinks: string[]            // Popular page paths
    contactCTA: boolean
  }
  seo: {
    httpStatus: 404                     // MUST return real 404, not soft 404
  }
}

interface EntityDetailConfig {
  featureDisplay: 'list' | 'grid' | 'alternating'
  relatedEntitiesCount: number          // default: 5
  pricingDisplay: boolean
  galleryLayout: 'grid' | 'masonry' | 'carousel'
  testimonialFilter: 'entity-specific'  // Filter to entity being viewed
  testimonialFallback: 'entity-only' | 'featured' // If no entity-specific
}
```

---

## 4. Phase 1: Layer 1 Extraction

**Goal:** Separate universal primitives, build foundation infrastructure. All new code is dormant until Phase 2 wires it in.

**Sessions:** 2-3

### Sub-Phase 1A: TypeScript Types for Blueprint System

**File to create:** `templates/astro-site/src/types/blueprint.ts`

All types from Section 3 above (Blueprint Types). This is the foundation — everything else depends on it.

**Verification:**
```bash
cd templates/astro-site && npx tsc --noEmit
```

### Sub-Phase 1B: Directory Reorganization

**Collections — create `_universal/` directory:**

| Action | Source | Destination |
|--------|--------|-------------|
| Copy | `collections/Pages.ts` | `collections/_universal/Pages.ts` |
| Copy | `collections/Media.ts` | `collections/_universal/Media.ts` |
| Copy | `collections/Users.ts` | `collections/_universal/Users.ts` |
| Create | — | `collections/_universal/index.ts` (barrel export) |
| Modify | `collections/index.ts` | Re-export from `_universal/` |

**Blocks — create `_universal/` directory:**

| Action | Source | Destination |
|--------|--------|-------------|
| Copy | All 12 block files | `blocks/_universal/{name}.ts` |
| Create | — | `blocks/_universal/index.ts` (barrel export) |
| Modify | `blocks/index.ts` | Re-export from `_universal/` |

**Pattern:** Make originals thin re-exports so `import { Pages } from '../collections'` continues to work.

**Verification:**
```bash
cd templates/next-app && npx tsc --noEmit && pnpm build:next
# All 11 collections and 12 blocks export correctly
```

### Sub-Phase 1C: Registry System Creation

**5 files to create:**

**1. `templates/astro-site/src/lib/blueprint-registry.ts`**
```typescript
import type { PageBlueprint } from '../types/blueprint'
const blueprints = new Map<string, PageBlueprint>()
export function registerBlueprint(pageType: string, blueprint: PageBlueprint): void { blueprints.set(pageType, blueprint) }
export function getBlueprint(pageType: string): PageBlueprint | undefined { return blueprints.get(pageType) }
export function getAllBlueprints(): Map<string, PageBlueprint> { return blueprints }
```

**2. `templates/astro-site/src/lib/schema-registry.ts`**
```typescript
type SchemaGenerator = (data: any, baseUrl: string, siteSettings: any) => Record<string, any>[]
const generators = new Map<string, SchemaGenerator>()
export function registerSchemaGenerator(pageType: string, generator: SchemaGenerator): void { generators.set(pageType, generator) }
export function generateSchemasForPage(pageType: string, data: any, baseUrl: string, siteSettings: any): Record<string, any>[] {
  const gen = generators.get(pageType)
  return gen ? gen(data, baseUrl, siteSettings) : []
}
```

**3. `templates/astro-site/src/components/blocks/block-registry.ts`**
```typescript
export const blockRegistry: Record<string, string> = {
  hero: 'HeroBlock', serviceDetail: 'ServiceDetailBlock', faq: 'FAQBlock',
  testimonials: 'TestimonialsBlock', cta: 'CTABlock', locationMap: 'LocationMapBlock',
  content: 'ContentBlock', stats: 'StatsBlock', gallery: 'GalleryBlock',
  pricing: 'PricingBlock', team: 'TeamBlock', relatedLinks: 'RelatedLinksBlock',
}
export function registerBlock(slug: string, componentName: string): void { blockRegistry[slug] = componentName }
export function isKnownBlock(slug: string): boolean { return slug in blockRegistry }
```
Note: Astro can't dynamically import `.astro` components at runtime. Registry is metadata/validation layer. BlockRenderer uses static imports + conditional rendering.

**4. `templates/astro-site/src/lib/sitemap-config.ts`**
```typescript
export interface SitemapCollection {
  slug: string; pathPrefix: string; changefreq: string; priority: number
  getPath: (doc: any) => string
}
export const sitemapCollections: SitemapCollection[] = [
  { slug: 'services', pathPrefix: '/services', changefreq: 'monthly', priority: 0.8, getPath: (d) => `/${d.slug}` },
  { slug: 'locations', pathPrefix: '/locations', changefreq: 'monthly', priority: 0.7, getPath: (d) => `/${d.slug}` },
  { slug: 'service-pages', pathPrefix: '/services', changefreq: 'monthly', priority: 0.6, getPath: (d) => `/${d.service?.slug}/${d.location?.slug}` },
  { slug: 'blog-posts', pathPrefix: '/blog', changefreq: 'weekly', priority: 0.5, getPath: (d) => `/${d.slug}` },
  { slug: 'pages', pathPrefix: '', changefreq: 'monthly', priority: 0.4, getPath: (d) => `/${d.slug}` },
]
```

**5. `templates/astro-site/src/lib/nav-config.ts`**
```typescript
export interface NavItem { label: string; href: string; children?: NavItem[]; dynamic?: { collection: string; pathPrefix: string; labelField: string } }
export interface FooterSection { heading: string; links?: NavItem[]; dynamic?: { collection: string; pathPrefix: string; labelField: string; limit?: number } }
export const primaryNav: NavItem[] = [
  { label: 'Services', href: '/services', dynamic: { collection: 'services', pathPrefix: '/services', labelField: 'name' } },
  { label: 'Locations', href: '/locations' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]
export const footerSections: FooterSection[] = [
  { heading: 'Locations', dynamic: { collection: 'locations', pathPrefix: '/locations', labelField: 'displayName', limit: 20 } },
  { heading: 'Company', links: [
    { label: 'Our Team', href: '/team' }, { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' }, { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' },
  ] },
]
```

**Verification:**
```bash
cd templates/astro-site && npx astro check && pnpm build:astro
```

### Sub-Phase 1D: BlockRenderer Refactoring

**File to modify:** `templates/astro-site/src/components/blocks/BlockRenderer.astro`

**New props (backward compatible):**
```typescript
interface Props {
  blocks: Block[]
  blueprintSections?: SectionDefinition[]  // NEW
  context?: Record<string, any>
  baseHeadingLevel?: 2 | 3 | 4
  visualBreaks?: number[]                  // NEW
  rhythmSpacing?: SpacingToken             // NEW
}
```

**Helper function `getSectionClasses(section, rhythmSpacing)`:**

| Background Token | Tailwind Class |
|-----------------|----------------|
| `default` | `bg-background` |
| `muted` | `bg-muted/50` |
| `primary` | `bg-primary text-primary-foreground` |
| `dark` | `bg-foreground text-background` |
| `gradient` | `bg-gradient-to-b from-muted/50 to-background` |

| Width Token | Tailwind Classes |
|-------------|-----------------|
| `contained` | `container mx-auto px-4 max-w-7xl` |
| `full-bleed` | `w-full` |
| `narrow` | `container mx-auto px-4 max-w-3xl` |

| Spacing Token | Tailwind Classes |
|--------------|-----------------|
| `compact` | `py-12 md:py-16` |
| `default` | `py-16 md:py-20` |
| `spacious` | `py-20 md:py-28` |

**Rendering logic:**
- If `blueprintSections` provided: wrap each `blocks[i]` in `<AnimatedSection animation={sections[i].animation}>` with `getSectionClasses(sections[i])`. Insert visual break divider at `visualBreaks` indices.
- If `blueprintSections` absent: render exactly as current (backward compat).
- Unknown blocks: dev → yellow warning box `"Block component not found: {blockType}"`; prod → silently skip + server console log.

**Visual break divider:**
```html
<div class="h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-2xl mx-auto" />
```

**Verification:**
```bash
pnpm build:astro
# Visit existing pages — MUST render identically (backward compat path)
```

### Sub-Phase 1E: 11 New Universal Astro Components

All files in `templates/astro-site/src/components/`.

**1. AnimatedSection.astro**
- Props: `animation: AnimationToken`, `class?: string`
- If `none`: plain `<div class={class}><slot /></div>`
- Else: `<div data-animate={animation} data-animated="false" class={class}><slot /></div>`
- Client `<script>`: IntersectionObserver, threshold 0.1, animate once
- Respect `prefers-reduced-motion` — disable all animations via `matchMedia`
- GPU-only: transform + opacity
- Stagger: child delay `index * 0.1s`, cap 0.5s total
- Progressive enhancement: content visible by default (opacity: 1). JS adds hidden state.
- CSS animations: fade-in (opacity 0→1, 0.6s), fade-up (opacity 0→1 + translateY 30→0, 0.5s), stagger (fade-up with delay)

**2. FilterBar.astro**
- Props: `filters: string[]`, `activeFilter?: string`, `baseUrl: string`
- URL-based pill buttons as `<a>` tags. "All" links to baseUrl, each filter to `${baseUrl}?filter=${encodeURIComponent(f)}`
- Active: `bg-primary text-primary-foreground`. Inactive: `bg-muted hover:bg-muted/80`
- Reads `Astro.url.searchParams.get('filter')` for active detection

**3. Pagination.astro**
- Props: `currentPage: number`, `totalPages: number`, `baseUrl: string`
- Server-rendered `<nav aria-label="Pagination">`
- Shows: First (if current > 3), Prev, current±2 pages, Next, Last (if current < total-2)
- Current: `aria-current="page"`, disabled prev/next at boundaries

**4. FeaturedPostCard.astro**
- Props: `post: BlogPost`
- Horizontal: `grid grid-cols-1 md:grid-cols-2`, image left (aspect-[4/3]), content right
- "Featured" badge: `absolute top-4 left-4`
- Bottom: author avatar+name, date, readTime

**5. AuthorBio.astro**
- Props: `author: TeamMember`
- Photo (rounded-full, 80x80) + name + role + bio (line-clamp-3)
- Social links (gracefully handle absence)
- Link to team page

**6. TableOfContents.astro**
- Props: `headings: {depth: number, slug: string, text: string}[]`
- Desktop: `sticky top-24` sidebar. Mobile: collapsible `<details>`
- h2 = top level, h3 = indented (`pl-4`)
- Client: IntersectionObserver on heading elements, updates `aria-current`

**7. SocialShare.astro**
- Props: `url: string`, `title: string`
- Desktop: `sticky top-24` sidebar, vertical buttons. Mobile: fixed bottom bar `lg:hidden`
- Twitter (intent), Facebook (sharer), LinkedIn (shareArticle), Copy Link (clipboard API)
- No external JS

**8. FAQSearch.astro**
- Props: `placeholder?: string`
- Client: debounced (300ms) filter over `[data-faq-item]` elements
- Hides non-matching, shows "No results" empty state
- Progressive enhancement: works without JS (all shown)

**9. PayloadForm.tsx** (React island `client:load`)
- Props: `formSlug: string`, `contactInfo?: {phone, email, address, hours}`
- Fetches form config from Payload forms API at runtime
- `react-hook-form` + `zod` validation (dynamically built schema from form fields)
- Two-column: form left, contact details right
- Submit: POST to Payload form-submissions endpoint
- Success: inline thank-you message

**Dependencies to add:** `react-hook-form`, `@hookform/resolvers`, `zod` — add to astro-site package.json

**10. StickyPhoneBar.astro**
- Props: `phone: string`, `ctaText?: string`
- `fixed bottom-0 left-0 right-0 lg:hidden z-50`
- `pb-[env(safe-area-inset-bottom)]`
- `bg-primary text-primary-foreground`

**11. EmptyState.astro**
- Props: `heading?, message?, ctaText?, ctaHref?`
- `text-center py-16`, optional SVG illustration, optional CTA button

**Verification:**
```bash
cd templates/astro-site && npx astro check && pnpm build:astro
```

### Sub-Phase 1F: Sitemap & Navigation Refactoring

**Files to modify:**
1. `templates/astro-site/src/pages/sitemap.xml.ts` → import from `sitemap-config.ts`, loop over config
2. `templates/astro-site/src/components/SiteHeader.astro` → import from `nav-config.ts`
3. `templates/astro-site/src/components/SiteFooter.astro` → import from `nav-config.ts`

**Constraint:** Output must be identical to current.

**Verification:**
```bash
pnpm build:astro
# Diff sitemap/header/footer before vs after
```

### Sub-Phase 1G: Plugin Configuration Refactoring

**File to create:** `templates/next-app/src/lib/plugin-config.ts`
```typescript
export const pluginCollections = {
  seo: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  search: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  redirects: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  nestedDocs: ['pages', 'services'],
  livePreview: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  importExport: ['pages', 'media', 'services', 'locations', 'service-pages', 'blog-posts', 'faqs', 'testimonials', 'team-members'],
  ai: ['pages', 'blog-posts', 'services', 'locations', 'service-pages', 'faqs', 'testimonials', 'team-members'],
  formBuilder: { redirectRelationships: ['pages'] },
}
```

**File to modify:** `templates/next-app/src/plugins/index.ts` → replace all hardcoded arrays with `pluginCollections.*`

**Verification:**
```bash
cd templates/next-app && npx tsc --noEmit && pnpm build:next
```

### Sub-Phase 1H: Schema Generator Infrastructure

**File to modify:** `templates/astro-site/src/lib/seo.ts` — add 4 new generator stubs:
- `generateCollectionPageSchema(data, baseUrl)` → `@type: CollectionPage`
- `generateContactPageSchema(siteSettings, baseUrl)` → `@type: ContactPage`
- `generateWebPageSchema(data, baseUrl)` → `@type: WebPage`
- `generatePersonSchema(member, baseUrl)` → `@type: Person`

**File to modify:** `templates/astro-site/src/lib/schema-registry.ts` — bootstrap with existing generators + new stubs.

**Verification:**
```bash
cd templates/astro-site && npx tsc --noEmit && pnpm build:astro
# Check existing pages still have correct JSON-LD
```

### Phase 1 Execution Strategy

```
Session 1: Parallel subagents → 1A (types) + 1B (dir reorg) + 1G (plugin config)
Session 2: Parallel subagents → 1C (registries) + 1E (11 components)
Session 3: Sequential → 1D (BlockRenderer) → 1F (sitemap/nav) → 1H (schema stubs)
```

### Phase 1 Final Verification Gate

```bash
pnpm build:next && pnpm build:astro
bash scripts/validate-template.sh
# Visit all existing pages — must render identically
# All new code compiles but is dormant
```

---

## 5. Phase 2: Generation Engine Core

**Goal:** Build all 11 MCP tools, define 12 PageBlueprints, create orchestration prompt, implement manifest system.

**Sessions:** 3-4

### Sub-Phase 2A: Generation Type System

**File to create:** `templates/next-app/src/mcp/types/generation.ts` — all types from Section 3 (Generation Types)
**File to create:** `templates/next-app/src/mcp/types/index.ts` — barrel export

**Verification:** `cd templates/next-app && npx tsc --noEmit`

### Sub-Phase 2B: 11 MCP Tool Implementations

**File to create:** `templates/next-app/src/mcp/tools/generation.ts`

All tools follow existing pattern from `pseo-seeding.ts`: zod parameter schemas, handler `({ payload }, args)`, return `text()`.

See [Section 9: All 11 MCP Tool Specifications](#9-all-11-mcp-tool-specifications) for complete specs.

**Registration:** Update `templates/next-app/src/mcp/tools/index.ts` to import + spread `generationTools`.
**MCP config:** Update `templates/next-app/src/mcp/index.ts`.

### Sub-Phase 2C: 12 PageBlueprint Definitions

**Directory to create:** `templates/astro-site/src/lib/blueprints/`
- One file per blueprint: `homepage.ts`, `entity-detail.ts`, `entity-listing.ts`, `cross-product.ts`, `blog-post.ts`, `blog-index.ts`, `team.ts`, `faq.ts`, `contact.ts`, `about.ts`, `landing-page.ts`, `not-found.ts`
- `index.ts` barrel that registers all in `blueprint-registry.ts`

See [Section 8: All 12 PageBlueprint Definitions](#8-all-12-pageblueprint-definitions) for complete section arrays.

### Sub-Phase 2D: Master Orchestration Prompt

**File to create:** `templates/next-app/src/mcp/prompts/generation-protocol.ts`

See [Section 10: Master Orchestration Prompt](#10-master-orchestration-prompt) for complete prompt text.

### Sub-Phase 2E: Manifest System

**File to create:** `templates/next-app/src/mcp/lib/manifest.ts`

Functions: `readManifest()`, `writeManifest()`, `updateStep()`, `getResumePoint()`, `cleanupGeneration()`, `readSeedManifest()`, `writeSeedManifest()`

### Phase 2 Execution Strategy

```
Session 4: Parallel → 2A (types) + 2C (blueprints)
Session 5: Parallel → tools 1-4 (analyze, collection, cross-product, page)
Session 6: Parallel → tools 5-8 (block, schema, CRM, email) + 2D (prompt) + 2E (manifest)
Session 7: Sequential → tools 9-11 (seed, nav, validate)
```

### Phase 2 Final Verification Gate

```bash
pnpm build:next && pnpm build:astro
# All 11 tools registered in MCP
# All 12 blueprints in registry
# Manifest read/write cycle works
# CRITICAL: Generate "plumbing company in Austin" → must produce buildable output
```

---

## 6. Phase 3: Integration Generation

**Goal:** Wire CRM, email, content seeding with blueprint awareness, analytics.

**Sessions:** 2-3

### Sub-Phase 3A: CRM Pipeline Integration Testing

Test `configure_crm_pipeline`:
1. With `TWENTY_API_URL` → pipeline created via GraphQL
2. Without → `crm-deferred-config.json` written
3. `apply_crm_config` applies deferred config
4. Sync mappings updated in `twenty-crm.ts`

### Sub-Phase 3B: Email Sequence Integration Testing

Test `generate_email_sequence`:
1. Generate 5 templates for dog grooming
2. Each `.tsx` compiles with React Email
3. Webhook triggers updated
4. With Resend → test send. Without → deferred.

### Sub-Phase 3C: Blueprint-Aware Content Seeding

Test `seed_collection` with `pageType`:
1. Homepage entry → layout has 10 blocks matching blueprint
2. Entity detail → conditional pricing block
3. Cross-product → 55% uniqueness, 600 unique words
4. CTA text contextualized per entity
5. `.seed-manifest.json` tracking
6. `--resume` and `--cleanup` flags
7. Image tier fallback

### Sub-Phase 3D: Analytics Event Generation

Generate `templates/astro-site/src/lib/analytics-config.ts`:
- Universal: `page_viewed`, `cta_clicked`, `form_submitted`, `search_performed`, `phone_clicked`
- Business-specific from BusinessModel

### Sub-Phase 3E: Plugin Config Wiring

Verify `generate_collection` updates `plugin-config.ts` for all plugins.

### Phase 3 Execution Strategy

```
Session 8: Parallel → 3A (CRM) + 3B (email) + 3D (analytics)
Session 9: Sequential → 3C (seeding) + 3E (plugin wiring)
```

---

## 7. Phase 4: Validation & Polish

**Goal:** End-to-end testing with 3+ business types, edge cases, wizard, docs.

**Sessions:** 1-2

### Sub-Phase 4A: Dog Grooming E2E

**Input:** "Paws & Claws dog grooming in Austin, TX. Three locations: Downtown (123 Congress Ave), South Lamar (456 S Lamar Blvd), Round Rock (789 Main St). Services: full grooming, bath & brush, nail trimming, teeth cleaning, flea treatment, puppy's first groom. Premium brand, appointment-based. Open Mon-Sat 8am-6pm."

**Expected:** Treatments (6), Locations (3), TreatmentPages (18), BlogPosts (5), FAQs (12), Testimonials (10), TeamMembers (5). CRM: Inquiry → Booked → Completed → Follow-up → Repeat. Emails: booking_confirmation, appointment_reminder, review_request, loyalty_offer, puppy_milestone.

### Sub-Phase 4B: Law Firm E2E

**Input:** "Smith & Associates personal injury law firm in Houston, TX. Practice areas: car accidents, truck accidents, workplace injuries, slip and fall, medical malpractice, wrongful death. Two offices: Downtown Houston, The Woodlands."

**Expected:** PracticeAreas (6), Offices (2), PracticeAreaPages (12). LegalService + Attorney schemas. CRM: Inquiry → Consultation → Retained → Active → Settled.

### Sub-Phase 4C: Restaurant E2E

**Input:** "Bella Cucina Italian restaurant in Portland, OR. Fine dining, reservation-based. Menu categories: antipasti, pasta, secondi, dolci, wine list."

**Expected:** MenuCategories (5), MenuItems. Restaurant + Menu schemas. Single location (no cross-products). CRM: Reservation → Visit → Loyalty.

### Sub-Phase 4D: Edge Cases

| Test | Expected |
|------|----------|
| Online-only business | No locations, no cross-products, no LocationMap |
| >200 cross-products | Cap at 200, log remainder |
| No pricing | PricingBlock excluded, no `offers` in schema |
| Resume from interruption | Manifest resumes from last step |
| Cleanup and re-generate | All files deleted, fresh generation |
| Reserved slug collision | Renamed to `{businessType}-media` |

### Sub-Phase 4E: Project Wizard Update

Modify `scripts/create-project.mjs` — add "Describe your business" prompt. Store BusinessModel in `.generation-manifest.json`.

### Sub-Phase 4F: Documentation

Update `CLAUDE.md` with generation tools, protocol, manifest system, blueprints.

---

## 8. All 12 PageBlueprint Definitions

### Homepage (`homepage`)

**Sections (10):**

| # | Name | Required | Position | Blocks | Background | Width | Animation |
|---|------|----------|----------|--------|------------|-------|-----------|
| 0 | hero | true | fixed | `[{blockType:'hero', priority:'preferred'}]` | dark | full-bleed | fade-in |
| 1 | trust-bar | true | fixed | `[{blockType:'stats', priority:'preferred'}]` | muted | contained | fade-up |
| 2 | primary-offerings | true | fixed | `[{blockType:'relatedLinks', priority:'preferred'}]` | default | contained | stagger |
| 3 | mid-page-cta | true | fixed | `[{blockType:'cta', priority:'preferred'}]` | primary | contained | fade-up |
| 4 | content-preview | false | flexible | `[{blockType:'content', priority:'preferred'}]` | default | contained | fade-up |
| 5 | social-proof | true | flexible | `[{blockType:'testimonials', priority:'preferred'}, {blockType:'stats', priority:'alternative'}]` | muted | contained | fade-up |
| 6 | why-us | false | flexible | `[{blockType:'serviceDetail', priority:'preferred'}, {blockType:'content', priority:'alternative'}]` | default | contained | fade-up |
| 7 | faq-preview | false | flexible | `[{blockType:'faq', priority:'preferred'}]` | default | narrow | none |
| 8 | location-overview | false | flexible | `[{blockType:'locationMap', priority:'preferred', when:'business has physical locations'}]` | muted | contained | fade-up |
| 9 | final-cta | true | fixed | `[{blockType:'cta', priority:'preferred'}]` | dark | full-bleed | fade-up |

**CRO:** primaryCTA `{text:'dynamic', link:'/contact', phone:'from SiteSettings'}`, ctaFrequency: 4, trustSignalPositions: ['trust-bar', 'social-proof'], aboveFoldRequirements: ['hero with CTA', 'phone number']
**SEO:** schemas `['Organization', 'WebSite', 'LocalBusiness']`, metaTitle `'{BusinessName} — {Tagline}'`, metaDesc `'{BusinessType} in {Location}. {ValueProp}. Call {Phone}.'`
**Rhythm:** spacing `spacious`, backgroundAlternation: true, visualBreaks: [3, 7]

### Entity Detail (`entity-detail`)

**Sections (10):**

| # | Name | Required | Position | Blocks | Background | Width | Animation |
|---|------|----------|----------|--------|------------|-------|-----------|
| 0 | hero | true | fixed | `[{blockType:'hero', priority:'preferred'}]` | dark | full-bleed | fade-in |
| 1 | entity-overview | true | fixed | `[{blockType:'content', priority:'preferred'}]` | default | contained | fade-up |
| 2 | features | true | flexible | `[{blockType:'serviceDetail', priority:'preferred'}]` | default | contained | stagger |
| 3 | pricing | false | flexible | `[{blockType:'pricing', priority:'preferred', when:'entity has pricing data'}]` | muted | contained | fade-up |
| 4 | mid-cta | true | flexible | `[{blockType:'cta', priority:'preferred'}]` | primary | contained | fade-up |
| 5 | gallery | false | flexible | `[{blockType:'gallery', priority:'preferred'}]` | default | full-bleed | fade-in |
| 6 | testimonials | true | flexible | `[{blockType:'testimonials', priority:'preferred'}]` | muted | contained | fade-up |
| 7 | faq | false | flexible | `[{blockType:'faq', priority:'preferred'}]` | default | narrow | none |
| 8 | related-entities | true | fixed | `[{blockType:'relatedLinks', priority:'preferred'}]` | default | contained | stagger |
| 9 | final-cta | true | fixed | `[{blockType:'cta', priority:'preferred'}]` | dark | full-bleed | fade-up |

**CRO:** primaryCTA `{text:'contextual to entity', link:'/contact', phone:'from SiteSettings'}`, ctaFrequency: 3
**SEO:** schemas `['Service', 'FAQPage', 'BreadcrumbList']`, metaTitle `'{EntityName} | {BusinessName}'`
**Rhythm:** spacing `default`, backgroundAlternation: true, visualBreaks: [4]
**Extension:** `entityDetail: { featureDisplay:'alternating', relatedEntitiesCount:5, pricingDisplay:true, galleryLayout:'grid', testimonialFilter:'entity-specific', testimonialFallback:'entity-only' }`

### Entity Listing (`entity-listing`)

**Sections (6):**

| # | Name | Required | Position | Blocks | Background | Width | Animation |
|---|------|----------|----------|--------|------------|-------|-----------|
| 0 | page-header | true | fixed | `[]` (code-rendered h1 + description) | default | contained | fade-in |
| 1 | filter-and-grid | true | fixed | `[]` (FilterBar + card grid) | default | contained | stagger |
| 2 | mid-cta | true | flexible | `[{blockType:'cta', priority:'preferred'}]` | primary | contained | fade-up |
| 3 | why-us | false | flexible | `[{blockType:'serviceDetail', priority:'preferred'}, {blockType:'content', priority:'alternative'}]` | muted | contained | fade-up |
| 4 | social-proof | false | flexible | `[{blockType:'testimonials', priority:'preferred'}, {blockType:'stats', priority:'alternative'}]` | default | contained | fade-up |
| 5 | final-cta | true | fixed | `[{blockType:'cta', priority:'preferred'}]` | dark | full-bleed | fade-up |

**Extension:** `listing: { cardComponent:'EntityCard', gridColumns:{sm:1,md:2,lg:3}, cardFields:{image:'featuredImage', title:'name', subtitle:'category', description:'shortDescription', link:'slug'}, filterBar:{enabled:true, filters:['category'], position:'above'}, pagination:{perPage:12, layout:'load-more'} }`

### Cross-Product (`cross-product`)

**Sections (10):**

| # | Name | Required | Position | Blocks | Background | Width | Animation |
|---|------|----------|----------|--------|------------|-------|-----------|
| 0 | hero | true | fixed | `[{blockType:'hero'}]` | dark | full-bleed | fade-in |
| 1 | local-introduction | true | fixed | `[{blockType:'content'}]` | default | contained | fade-up |
| 2 | offering-details | true | flexible | `[{blockType:'serviceDetail'}]` | default | contained | stagger |
| 3 | pricing | false | flexible | `[{blockType:'pricing', when:'entity has pricing data'}]` | muted | contained | fade-up |
| 4 | mid-cta | true | flexible | `[{blockType:'cta'}]` | primary | contained | fade-up |
| 5 | local-testimonials | true | flexible | `[{blockType:'testimonials'}]` | muted | contained | fade-up |
| 6 | location-info | true | flexible | `[{blockType:'locationMap', when:'business has physical locations'}]` | default | contained | fade-up |
| 7 | faq | false | flexible | `[{blockType:'faq'}]` | default | narrow | none |
| 8 | related-cross-products | true | fixed | `[{blockType:'relatedLinks'}]` | default | contained | stagger |
| 9 | final-cta | true | fixed | `[{blockType:'cta'}]` | dark | full-bleed | fade-up |

**SEO:** schemas `['Service', 'LocalBusiness', 'FAQPage', 'BreadcrumbList']`, metaTitle `'{EntityName} in {LocationName} | {BusinessName}'`
**Extension:** See `CrossProductConfig` in types above (55% uniqueness, 600 unique words, quality threshold 65)

### Blog Post (`blog-post`)

**Sections (8):**

| # | Name | Required | Position | Blocks | Background | Width | Animation |
|---|------|----------|----------|--------|------------|-------|-----------|
| 0 | article-header | true | fixed | `[]` (code: h1, author, date, readTime) | default | narrow | fade-in |
| 1 | featured-image | true | fixed | `[]` (code: featured image) | default | contained | fade-in |
| 2 | article-body | true | fixed | `[]` (code: Lexical richText) | default | narrow | none |
| 3 | in-content-cta | true | flexible | `[{blockType:'cta'}]` | primary | narrow | fade-up |
| 4 | author-bio | true | fixed | `[]` (AuthorBio component) | muted | narrow | fade-up |
| 5 | related-entities | false | flexible | `[{blockType:'relatedLinks'}]` | default | contained | stagger |
| 6 | related-posts | true | fixed | `[{blockType:'relatedLinks'}]` | default | contained | stagger |
| 7 | final-cta | true | fixed | `[{blockType:'cta'}]` | dark | full-bleed | fade-up |

**SEO:** schemas `['Article', 'Person', 'BreadcrumbList']`, metaTitle `'{ArticleTitle} | {BusinessName} Blog'`
**Rhythm:** spacing `compact`, visualBreaks: []
**Extension:** See `BlogConfig` in types (max-w-3xl, typography scale, sticky sidebar ToC/social, author bio)

### Blog Index (`blog-index`)

**Sections (5):**

| # | Name | Required | Position | Blocks | Background | Width | Animation |
|---|------|----------|----------|--------|------------|-------|-----------|
| 0 | page-header | true | fixed | `[]` | default | contained | fade-in |
| 1 | featured-post | false | fixed | `[]` (FeaturedPostCard) | default | contained | fade-up |
| 2 | filter-and-grid | true | fixed | `[]` (FilterBar + blog cards) | default | contained | stagger |
| 3 | newsletter-cta | false | flexible | `[{blockType:'cta'}]` | muted | narrow | fade-up |
| 4 | final-cta | true | fixed | `[{blockType:'cta'}]` | dark | full-bleed | fade-up |

**Extension:** `listing: { cardComponent:'BlogCard', gridColumns:{sm:1,md:2,lg:3}, cardFields:{image:'featuredImage', title:'title', description:'excerpt', link:'slug', meta:['date','readTime'], author:'author.name'}, filterBar:{enabled:true, filters:['category'], position:'above'}, pagination:{perPage:12, layout:'load-more'}, featuredPost:true }`

### Team (`team`)

**Sections (7):**

| # | Name | Blocks | Background | Animation |
|---|------|--------|------------|-----------|
| 0 | page-header | `[]` | default | fade-in |
| 1 | leadership | `[{blockType:'team'}]` | default | fade-up |
| 2 | team-grid | `[{blockType:'team'}]` | default | stagger |
| 3 | credentials | `[{blockType:'stats'}]` | muted | fade-up |
| 4 | culture | `[{blockType:'gallery'}]` | default | fade-in |
| 5 | careers-cta | `[{blockType:'cta'}]` | primary | fade-up |
| 6 | final-cta | `[{blockType:'cta'}]` | dark | fade-up |

### FAQ (`faq`)

**Sections (3):**

| # | Name | Blocks | Background | Width | Animation |
|---|------|--------|------------|-------|-----------|
| 0 | page-header | `[]` (+ FAQSearch) | default | contained | fade-in |
| 1 | faq-by-category | `[{blockType:'faq'}]` | default | narrow | none |
| 2 | still-have-questions | `[{blockType:'cta'}]` | primary | contained | fade-up |

**Extension:** `faq: { grouping:{strategy:'by-entity', generalFirst:true}, accordion:{behavior:'single-open'}, search:{enabled:true, position:'below-header', placeholder:'Search FAQs...'}, schema:{generateFAQPage:true, maxSchemaItems:50} }`

### Contact (`contact`)

**Sections (5):**

| # | Name | Blocks | Background | Width | Animation |
|---|------|--------|------------|-------|-----------|
| 0 | page-header | `[]` | default | contained | fade-in |
| 1 | contact-form-and-info | `[]` (PayloadForm island) | default | contained | fade-up |
| 2 | locations-map | `[{blockType:'locationMap', when:'business has physical locations'}]` | muted | contained | fade-up |
| 3 | trust-reinforcement | `[{blockType:'testimonials'}]` | default | contained | fade-up |
| 4 | response-guarantee | `[{blockType:'cta'}]` | primary | contained | fade-up |

### About (`about`)

**Sections (8):**

| # | Name | Blocks | Background | Animation |
|---|------|--------|------------|-----------|
| 0 | hero | `[{blockType:'hero'}]` | dark | fade-in |
| 1 | origin-story | `[{blockType:'content'}]` | default | fade-up |
| 2 | mission-values | `[{blockType:'serviceDetail'}]` | default | stagger |
| 3 | by-the-numbers | `[{blockType:'stats'}]` | muted | fade-up |
| 4 | team-preview | `[{blockType:'team'}]` | default | stagger |
| 5 | social-proof | `[{blockType:'testimonials'}]` | muted | fade-up |
| 6 | community | `[{blockType:'gallery'}]` | default | fade-in |
| 7 | final-cta | `[{blockType:'cta'}]` | dark | fade-up |

### Landing Page (`landing-page`)

**Sections (9):**

| # | Name | Blocks | Background | Width | Animation |
|---|------|--------|------------|-------|-----------|
| 0 | hero-with-form | `[{blockType:'hero'}]` | dark | full-bleed | fade-in |
| 1 | trust-bar | `[{blockType:'stats'}]` | muted | contained | fade-up |
| 2 | problem-agitation | `[{blockType:'content'}]` | default | contained | fade-up |
| 3 | solution | `[{blockType:'serviceDetail'}]` | default | contained | stagger |
| 4 | mid-cta | `[{blockType:'cta'}]` | primary | contained | fade-up |
| 5 | social-proof | `[{blockType:'testimonials'}]` | muted | contained | fade-up |
| 6 | process | `[{blockType:'stats'}]` | default | contained | stagger |
| 7 | objections | `[{blockType:'faq'}]` | default | narrow | none |
| 8 | final-cta | `[{blockType:'cta'}]` | dark | full-bleed | fade-up |

**Extension:** `landing: { navigation:{showHeader:false, showFooter:false, showBreadcrumbs:false}, form:{position:'sidebar', sticky:true, submitText:'Get My Free Quote'}, phoneNumber:{prominent:true, sticky:true, trackingNumber:true}, urgency:{enabled:false, style:'none'} }`

### 404 (`404`)

**Sections (5):**

| # | Name | Blocks | Background | Width | Animation |
|---|------|--------|------------|-------|-----------|
| 0 | error-message | `[]` (h1 + friendly message) | default | contained | fade-in |
| 1 | search | `[]` (search input) | default | narrow | fade-up |
| 2 | popular-pages | `[{blockType:'relatedLinks'}]` | default | contained | stagger |
| 3 | quick-links | `[{blockType:'relatedLinks'}]` | muted | contained | stagger |
| 4 | contact-fallback | `[{blockType:'cta'}]` | primary | contained | fade-up |

**Extension:** `notFound: { errorDisplay:{heading:'Page Not Found', tone:'friendly'}, recovery:{searchEnabled:true, suggestedLinks:['/','/services','/contact'], contactCTA:true}, seo:{httpStatus:404} }`

---

## 9. All 11 MCP Tool Specifications

### Tool 1: `analyze_business`

**Parameters:**
```typescript
{ prompt: z.string(), followUpQuestions: z.boolean().optional() }
```
**Returns:** BusinessModel JSON or clarifying questions
**Implementation:** MCP prompt structures Claude's reasoning into BusinessModel. Validates structure. If ambiguous + followUpQuestions=true, returns questions.
**Error:** Returns questions, does NOT proceed with ambiguous input.

### Tool 2: `generate_collection`

**Parameters:**
```typescript
{ entity: z.string() /* JSON EntityDefinition */, blocks: z.string().optional() /* comma-separated slugs */ }
```
**Returns:** `{ filePath, collectionSlug, helpersGenerated }`
**Implementation:** Writes `.ts` to `src/collections/`. Includes: fields, access control (`publishedOrLoggedIn`/`isAdminOrEditor`), versioning+drafts+autosave+schedulePublish, auto-slug hook, rebuild trigger, admin config.
**Localization:** `localized: true` ONLY for text/textarea/richText.
**SEO fields:** seoTitle, seoDescription, keywords (if hasPublicPages).
**Layout:** if hasBlocks, add layout array field.
**Reserved slug guard:** Check against reserved list, prepend business type if collision.
**Also updates:** payload.config.ts, shared types, shared client, plugin-config.ts.

### Tool 3: `generate_cross_product_collection`

**Parameters:**
```typescript
{ crossProduct: z.string() /* JSON */, parentEntities: z.string() /* JSON */ }
```
**Returns:** `{ filePath, collectionSlug, hookFilePath }`
**Implementation:** Two relationship fields, auto-slug hook (concatenates parent slugs), contentQualityScore (threshold: 65), quality gate (blocks publishing below threshold), max 200 pages.

### Tool 4: `generate_page`

**Parameters:**
```typescript
{ urlPattern: z.string(), collection: z.string(), fetchMethod: z.string(), pageType: z.string(), blueprint: z.string(), renderBlocks: z.boolean().optional(), context: z.string().optional() }
```
**Returns:** `{ filePath }`
**Implementation:** Creates `.astro` file. SSR (`prerender = false`), data fetching, 404 redirect, SEOLayout, Breadcrumbs, BlockRenderer with blueprintSections, setCacheHeaders.
**Listing pages:** Also generates card component from blueprint.listing.cardFields.

### Tool 5: `generate_block`

**Parameters:**
```typescript
{ name: z.string(), slug: z.string(), fields: z.string() /* JSON */, componentTemplate: z.string().optional() }
```
**Returns:** `{ blockFilePath, componentFilePath }`
**Implementation:** Payload block config + Astro component. Updates block-registry.ts and BlockRenderer.

### Tool 6: `generate_schema`

**Parameters:**
```typescript
{ pageType: z.string(), schemaOrgType: z.string(), fieldMappings: z.string() /* JSON */ }
```
**Returns:** `{ updated: true }`
**Implementation:** Adds generator to seo.ts, registers in schema-registry.ts.

### Tool 7: `configure_crm_pipeline`

**Parameters:**
```typescript
{ pipeline: z.string() /* JSON PipelineDefinition */ }
```
**Returns:** `{ pipelineId, stageIds }` or `{ deferred: true, configPath }`
**Implementation:** Twenty CRM GraphQL API. NON-BLOCKING: writes crm-deferred-config.json if unreachable.

### Tool 8: `generate_email_sequence`

**Parameters:**
```typescript
{ sequence: z.string() /* JSON */, businessContext: z.string() /* JSON */ }
```
**Returns:** `{ templateFilePath, triggerUpdated }`
**Implementation:** React Email .tsx in src/emails/. NON-BLOCKING if Resend unreachable.

### Tool 9: `seed_collection`

**Parameters:**
```typescript
{ collection: z.string(), count: z.number(), businessContext: z.string(), relationships: z.string().optional(), pageType: z.string().optional() }
```
**Returns:** `{ created, ids }`
**Implementation:** Payload REST API. Blueprint-aware when pageType provided. Idempotent via .seed-manifest.json. --resume and --cleanup. Image tiers: DALL-E → Unsplash → no images.

### Tool 10: `generate_nav`

**Parameters:**
```typescript
{ navStructure: z.string() /* JSON */, primaryEntity: z.string(), secondaryLinks: z.string().optional() }
```
**Returns:** `{ headerUpdated, footerUpdated }`
**Implementation:** Writes nav-config.ts.

### Tool 11: `validate_generation`

**Parameters:**
```typescript
{ manifest: z.string() /* JSON GenerationOutput */ }
```
**Returns:** `{ buildResult: 'pass'|'fail', errors: string[] }`
**Implementation:** Runs pnpm build:next + pnpm build:astro. Validates TypeScript, JSON-LD, internal links.

---

## 10. Master Orchestration Prompt

```
## Universal Website Generation Protocol

You are generating a complete website stack from a business description. Follow these steps exactly.

### Phase 1: Analysis (no file writes)
1. Read the business description carefully
2. Identify all content entities the business needs
3. Map relationships between entities
4. Identify cross-product opportunities (entity × entity for pSEO)
5. Determine the primary conversion goal
6. Design the CRM pipeline stages
7. Plan email sequences
8. Determine schema.org types
9. Design URL structure
10. Plan navigation hierarchy
11. Output the complete BusinessModel as structured data

### Phase 2: Layer 1 Preparation
1. Verify Layer 1 primitives are in place (SEOLayout, BlockRenderer, etc.)
2. Identify which universal blocks will be reused
3. Identify which new business-specific blocks are needed
4. Plan the complete file manifest (what will be created/modified)

### Phase 3: Collection Generation
For each entity in the business model:
1. Generate the Payload collection config file
2. Include all fields with correct types, validation, and relationships
3. Apply access control (publishedOrLoggedIn read, isAdminOrEditor write)
4. Add versioning if the entity has public pages
5. Attach slug auto-generation and rebuild trigger hooks
6. Configure admin UI (useAsTitle, defaultColumns, group)

After all collections:
1. Update payload.config.ts to import and register
2. Update shared types
3. Update shared client helpers

### Phase 4: Cross-Product Generation
For each cross-product:
1. Generate collection with parent relationships
2. Generate auto-slug hook (concatenate parent slugs)
3. Add quality gate (contentQualityScore < 65 blocks publishing)

### Phase 5: Block Generation
1. List universal blocks being reused
2. For each new block: create Payload config + Astro component
3. Register in block-registry.ts

### Phase 6: Route Generation
For each URL pattern:
1. Create Astro page with SSR
2. Implement data fetching
3. Handle 404
4. Render SEOLayout, Breadcrumbs, BlockRenderer with blueprint sections
5. For listing pages: generate card component from blueprint.listing.cardFields
6. Update sitemap-config.ts

### Phase 7: SEO Generation
1. Add schema generators to seo.ts
2. Register in schema-registry.ts

### Phase 8: Integration Generation
1. Configure CRM pipeline (non-blocking if unreachable)
2. Generate email templates (non-blocking if unreachable)
3. Generate analytics config

### Phase 9: Content Seeding
For each collection:
1. Generate realistic content via Payload API
2. When pageType provided, populate layout array per PageBlueprint:
   - Required sections: add preferred block with contextual content
   - Optional sections: add if when condition matches
   - Contextualize CTA text with entity names
3. Seed in dependency order (entities before cross-products)
4. Track via .seed-manifest.json

### Phase 10: Navigation + Validation
1. Write nav-config.ts
2. Run validate_generation
3. Report completion
```

---

## 11. Content Seeding Strategy

### Volume Guidelines

| Collection | Count | Notes |
|-----------|-------|-------|
| Primary entity | All user-specified | Full description, image, SEO fields |
| Locations | All user-specified | Address, hours, coordinates |
| Cross-products | All combos (max 200) | Service × Location |
| Blog posts | 5-10 | Industry-relevant topics |
| FAQs | 10-15 | Mix of general + entity-specific |
| Testimonials | 8-12 | Varied ratings (mostly 4-5 stars) |
| Team members | 3-6 | Appropriate titles and bios |

### Image Tiers

1. **Tier 1 (AI):** `OPENAI_API_KEY` → DALL-E generates contextual images → upload to Media
2. **Tier 2 (Stock):** Unsplash API → download relevant photos → upload to Media
3. **Tier 3 (None):** Create entries without images → log list to stdout

### Layout Array Population (Blueprint-Aware)

When `seed_collection` called with `pageType`:
1. Fetch PageBlueprint matching pageType
2. For each `required: true` section → add block (prefer `priority: 'preferred'`)
3. For each `required: false` section → add if `when` condition matches BusinessModel
4. Populate fields with contextual content (entity names in CTAs, entity-specific testimonials)
5. Order MUST match blueprint sections array (BlockRenderer maps by index)

### Cross-Product Uniqueness

- Minimum 55% unique content vs siblings
- Minimum 600 unique words per page
- Minimum 1000 total words
- Quality score threshold: 65
- Pairwise similarity max: 0.45
- Unique sections: local-introduction, offering-details, faq, location-info
- Shared sections: hero, pricing, final-cta

---

## 12. Design Tokens & CSS Mappings

### Section Backgrounds

| Token | Tailwind | Usage |
|-------|----------|-------|
| `default` | `bg-background` | Standard sections |
| `muted` | `bg-muted/50` | Subtle gray separation |
| `primary` | `bg-primary text-primary-foreground` | Brand-color CTAs |
| `dark` | `bg-foreground text-background` | Hero/final CTA |
| `gradient` | `bg-gradient-to-b from-muted/50 to-background` | Soft transitions |

### Section Widths

| Token | Tailwind | Usage |
|-------|----------|-------|
| `contained` | `container mx-auto px-4 max-w-7xl` | Most sections |
| `full-bleed` | `w-full` | Heroes, CTAs, galleries |
| `narrow` | `container mx-auto px-4 max-w-3xl` | Blog body, FAQ (optimal reading) |

### Section Spacing

| Token | Tailwind | Usage |
|-------|----------|-------|
| `compact` | `py-12 md:py-16` | Blog, FAQ |
| `default` | `py-16 md:py-20` | Most pages |
| `spacious` | `py-20 md:py-28` | Homepage, About |

### Animations

| Token | CSS | Trigger |
|-------|-----|---------|
| `fade-in` | `opacity: 0→1, duration: 0.6s` | On mount |
| `fade-up` | `opacity: 0→1, translateY: 30→0, duration: 0.5s` | Scroll |
| `stagger` | `fade-up + delay: index * 0.1s per child` | Scroll |
| `none` | — | — |

### Card Design Tokens

| Property | Value | Rationale |
|----------|-------|-----------|
| Image aspect | `4:3` | Shows more subject |
| Border radius | `rounded-xl` | Modern feel |
| Hover | `shadow + -translate-y-1 + image scale-105` | Premium |
| Click area | `after:absolute after:inset-0` | Entire card clickable |
| Truncation | `line-clamp-2` | Consistent grid heights |
| Padding | `p-5` | Not cramped |
| Image transition | `duration-500` | Subtle zoom |

### Visual Break Divider

```html
<div class="h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-2xl mx-auto" />
```

---

## 13. Error Handling & Recovery

### Per-Step Failure Modes

| Step | Failure | Behavior |
|------|---------|----------|
| Analyze | Ambiguous prompt | Ask follow-up questions; don't proceed |
| Collections | TypeScript error | Fix and retry; can't proceed |
| Blocks | Missing dependency | Fall back to universal blocks; log warning |
| Routes | Broken import | Fix path and retry |
| Schemas | Invalid type | Fall back to generic Organization |
| CRM | Twenty unreachable | **NON-BLOCKING** — write crm-deferred-config.json |
| Emails | Resend unreachable | **NON-BLOCKING** — defer |
| Seed | API timeout | Resume via .seed-manifest.json |
| Nav | Missing page refs | Generate with available; log skipped |
| Validate | Build failure | Report errors; don't mark complete |

### Manifest-Based Resume

`.generation-manifest.json` tracks all steps. On restart:
1. Read manifest
2. Skip `completed` steps
3. Re-run `in-progress` from beginning
4. Continue with `pending` steps

### Cleanup

`--cleanup` flag:
1. Read manifest's `generatedFiles` array
2. Delete all listed files
3. `git checkout` modified files
4. Delete manifest

---

## 14. Breaking Changes & Migration

| Change | Current | New | Migration |
|--------|---------|-----|-----------|
| ServicePages quality threshold | 50 | 65 | Audit pages scoring 50-64. Enrich. Phased: warn 2 weeks → enforce |
| ServiceDetail block naming | Service-area specific | Universal use across 5 blueprints | Layer 1 extraction handles rename |

---

## 15. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Astro can't dynamically import .astro | Block registry limited | Static imports + conditional rendering; registry is metadata |
| MCP tools write from Payload process | Permission issues | Absolute paths, verify write access, text output fallback |
| payload.config.ts needs restart | Can't hot-add collections | Include restart in orchestration prompt; validate TS first |
| Cross-product volume explosion | Performance/quality | Enforce 200-page cap in both generation and seeding |
| Generated code TypeScript errors | Build failures | validate_generation runs tsc --noEmit |
| PayloadForm.tsx needs dependencies | Build error | Add react-hook-form, @hookform/resolvers, zod to astro-site |

---

## 16. Post-Phase Audit Protocol

After EACH phase completes:

### Step 1: Multi-Agent Audit (3+ parallel agents)
- **Spec Compliance Agent** — reads both specs line-by-line, checks every requirement
- **Build Verification Agent** — `pnpm build:next && pnpm build:astro && bash scripts/validate-template.sh --full`
- **Backward Compat Agent** — verifies existing pages render identically

### Step 2: Issue Categorization
- **Critical** — blocks deployment (build failures, data loss, security)
- **High** — incorrect behavior (wrong schema, broken links, missing sections)
- **Medium** — degraded quality (missing animation, wrong spacing)
- **Low** — cosmetic (naming, whitespace)

### Step 3: Enforcer Agent
Fixes all Critical and High issues. Re-runs builds after each fix.

### Step 4: Re-Audit
Fresh agent validates fixes. Confirms no regressions.

### Step 5: Phase Gate Checklist
- [ ] Zero Critical issues
- [ ] Zero High issues
- [ ] All builds pass (`pnpm build:next && pnpm build:astro`)
- [ ] All existing pages render correctly
- [ ] All new code compiles
- [ ] `bash scripts/validate-template.sh` passes
- [ ] Phase-specific verification (see each phase's gate)

---

## 17. Reference: Existing Files to Reuse

| Pattern | File | Reuse For |
|---------|------|-----------|
| Collection structure | `templates/next-app/src/collections/Services.ts` | `generate_collection` template |
| Cross-product | `templates/next-app/src/collections/ServicePages.ts` | `generate_cross_product_collection` |
| Astro SSR page | `templates/astro-site/src/pages/services/[slug].astro` | `generate_page` template |
| Listing page | `templates/astro-site/src/pages/services/index.astro` | Listing generation |
| Cross-product page | `templates/astro-site/src/pages/services/[service]/[city].astro` | Cross-product routes |
| MCP tool | `templates/next-app/src/mcp/tools/pseo-seeding.ts` | All 11 tools |
| MCP prompt | `templates/next-app/src/mcp/prompts/prompts.ts` | Orchestration prompt |
| Email template | `templates/next-app/src/emails/welcome-contact.tsx` | Email generation |
| Auto-slug hook | `templates/next-app/src/hooks/auto-generate-slug.ts` | Collection generation |
| Cross-product slug | `templates/next-app/src/hooks/auto-generate-service-page-slug.ts` | Cross-product generation |
| Access predicates | `templates/next-app/src/access/index.ts` | All generated collections |
| Twenty client | `templates/next-app/src/lib/twenty/client.ts` | CRM pipeline tool |
| SEO generators | `templates/astro-site/src/lib/seo.ts` | Schema generation |
| BlockRenderer | `templates/astro-site/src/components/blocks/BlockRenderer.astro` | Phase 1D refactor |
| SiteHeader | `templates/astro-site/src/components/SiteHeader.astro` | Phase 1F refactor |
| SiteFooter | `templates/astro-site/src/components/SiteFooter.astro` | Phase 1F refactor |
| Sitemap | `templates/astro-site/src/pages/sitemap.xml.ts` | Phase 1F refactor |
| Plugins | `templates/next-app/src/plugins/index.ts` | Phase 1G refactor |
| pSEO constants | `templates/next-app/src/mcp/tools/pseo-constants.ts` | MAX_SEED_ITEMS = 200 |

---

## 18. Environment Variables

### Required for Generation

| Variable | Purpose | Used By |
|----------|---------|---------|
| `PAYLOAD_SECRET` | Encryption key | All Payload operations |
| `DATABASE_URL` | Database connection | Payload CMS |
| `NEXT_PUBLIC_SERVER_URL` | Next.js server URL | API calls |
| `SITE_URL` | Astro URL | Page generation |
| `PUBLIC_ASTRO_URL` | Astro origin | CORS, live preview |
| `PREVIEW_SECRET` | Preview auth | Live preview |
| `PAYLOAD_API_KEY` | Draft content | Astro → Payload |

### Optional (graceful degradation)

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `TWENTY_API_URL` + `TWENTY_API_KEY` | CRM pipeline | Deferred config |
| `RESEND_API_KEY` | Email sending | Deferred config |
| `OPENAI_API_KEY` | DALL-E images | Unsplash → no images |
| `UNSPLASH_ACCESS_KEY` | Stock photos | No images |
| `STRIPE_SECRET_KEY` | Payments | Plugin disabled |
| `POSTHOG_API_KEY` | Analytics | Events defined but not tracked |
| `SENTRY_DSN` | Error tracking | Disabled |

---

## 19. Reserved Slugs

**Never use for generated collections:**
```
pages, media, users, contacts, search, redirects, forms, form-submissions,
payload-preferences, payload-migrations, plugin-ai-instructions
```

**Collision handling:** Prepend business type prefix.
- `media` → `portfolio-media`, `restaurant-media`
- `pages` → `restaurant-pages`

---

## 20. Example Generations

### Dog Grooming (Paws & Claws, Austin TX)

**Entities:** Treatments (6), Locations (3), TreatmentPages (18 cross-product), BlogPosts (5-10), FAQs (10-15), Testimonials (8-12), TeamMembers (3-6)
**Routes:** /treatments, /treatments/[slug], /treatments/[treatment]/[location], /locations, /locations/[slug], /blog, /blog/[slug], /team, /faq, /contact, /about
**Schemas:** LocalBusiness, Service, FAQPage, Article, BreadcrumbList
**CRM:** Inquiry → Appointment Booked → Completed → Follow-up → Repeat Customer
**Emails:** booking_confirmation, appointment_reminder (24h), review_request (24h after), loyalty_offer (6 weeks), puppy_milestone

### Law Firm (Smith & Associates, Houston TX)

**Entities:** PracticeAreas (6), Offices (2), PracticeAreaPages (12 cross-product), CaseResults, BlogPosts, FAQs, Testimonials, Attorneys
**Routes:** /practice-areas, /practice-areas/[slug], /practice-areas/[area]/[office], /offices, /offices/[slug], /results, /blog, /blog/[slug], /attorneys, /faq, /contact, /about
**Schemas:** LegalService, Attorney (Person), FAQPage, Article, BreadcrumbList
**CRM:** Inquiry → Free Consultation → Case Evaluation → Retained → Active Case → Settled/Won
**Emails:** consultation_confirmation, case_update, settlement_notification, referral_request, annual_checkup

### Restaurant (Bella Cucina, Portland OR)

**Entities:** MenuCategories (5), MenuItems, Events, BlogPosts, Reviews, TeamMembers
**Routes:** /menu, /menu/[category], /events, /reservations, /blog, /blog/[slug], /about, /private-dining, /contact
**Schemas:** Restaurant, Menu, MenuItem, FoodEvent, Article, BreadcrumbList
**CRM:** Reservation Request → Confirmed → Completed → Follow-up
**Emails:** reservation_confirmation, reminder (2h before), thank_you_review_request, special_event_invitation, birthday_offer

---

## 21. Pre-Implementation Fixes

> **CRITICAL:** These fixes must be applied BEFORE starting Phase 1 implementation. The specs were written in a different project directory (`Website-Template`) and copied to this project (`Universal-Template`). This section documents all discrepancies found during the cross-project file path audit.

### Audit Results Summary

Both specs were audited by parallel agents that extracted every file/directory path and verified existence in this project.

- **Spec 1 (Universal Generation Platform):** 96 paths referenced, 90 confirmed present (94%)
- **Spec 2 (Page Blueprint Design System):** 80+ paths referenced, 68 confirmed present (85%)
- **Cross-project name references found:** 1 (in Spec 1 only)
- **All relative paths (templates/, packages/, etc.) are correct** — directory structure is identical between projects

### Fix 1: Wrong Project Name in Spec 1

**File:** `docs/specs/2026-04-13-universal-generation-platform-spec.md`
**Line:** ~89 (Section 2.1 current system description)
**Current:** References `/Users/syber/Desktop/AI Projects/Websites/Website Template/`
**Fix:** Change to `/Users/syber/Desktop/AI Projects/Websites/Universal-Template/`
**Impact:** Documentation only — no code references this absolute path

### Fix 2: Missing Email Templates Referenced as Existing

**File:** `docs/specs/2026-04-13-universal-generation-platform-spec.md`
**Sections:** 2.1 and 2.8.1
**Issue:** These 4 email templates are described as existing infrastructure but don't exist:
- `templates/next-app/src/emails/WelcomeContact.tsx`
- `templates/next-app/src/emails/ClosedWonCongratulations.tsx`
- `templates/next-app/src/emails/FollowUpReminder.tsx`
- `templates/next-app/src/emails/DealStageNotification.tsx`

**Resolution:** The email files referenced in the spec match the email file names from the old project. Check the `src/emails/` directory — the actual filenames may use different casing/naming (e.g., `welcome-contact.tsx` vs `WelcomeContact.tsx`). Either:
- (a) Update spec to reference actual filenames if they exist with different names, OR
- (b) These templates will be generated during Phase 3B (email sequence tool), so mark them as "to be created" in the spec

### Fix 3: Missing About Page

**File:** `docs/specs/2026-04-13-page-blueprint-design-system.md`
**Section:** §15 (About Page Blueprint)
**Issue:** The About page blueprint is fully specified but `templates/astro-site/src/pages/about.astro` does not exist in this project.
**Resolution:** Add `about.astro` creation to Phase 1 as a pre-requisite. This is a static page (SSG) that will use the About blueprint's section structure. It should be created alongside the other existing static pages (team, faq, contact).

### Fix 4: PayloadForm.tsx Location

**File:** `docs/specs/2026-04-13-page-blueprint-design-system.md`
**Section:** §19
**Issue:** Spec lists `PayloadForm.tsx` at `templates/next-app/src/components/PayloadForm.tsx` but the implementation plan (and all other new components) places it at `templates/astro-site/src/components/PayloadForm.tsx` since it's a React island rendered by Astro.
**Resolution:** The correct location is `templates/astro-site/src/components/PayloadForm.tsx` — it's an Astro React island (`client:load`), not a Next.js component.

### Verified Clean (No Issues)

The following areas were confirmed to have zero discrepancies:
- All 12 Payload block file paths (Hero.ts through RelatedLinks.ts) ✓
- All 11 Payload collection file paths ✓
- All Astro page routes (19 pages) ✓ (except about.astro noted above)
- All Astro component paths ✓
- All hooks, access predicates, plugin files ✓
- All shared package paths ✓
- All MCP tool/prompt directory structure ✓
- All configuration files (astro.config.mjs, payload.config.ts, etc.) ✓
- Tailwind/CSS paths ✓
- Docker, Supabase, scripts paths ✓

### Pre-Implementation Checklist

Before starting Phase 1, execute these fixes:
- [ ] Fix absolute project path in Spec 1 line ~89
- [ ] Verify email template filenames in `src/emails/` and update Spec 1 references
- [ ] Create `templates/astro-site/src/pages/about.astro` stub (or add to Phase 1 scope)
- [ ] Confirm PayloadForm.tsx target is `astro-site/src/components/` (not `next-app/`)
- [ ] Run `pnpm build:next && pnpm build:astro` to confirm clean baseline before any changes
