# Page Blueprint Design System

> **Document**: Design specification for the Page Blueprint Registry — defines how the AI generation engine composes world-class, SEO/CRO-optimized pages for any business type
> **Date**: 2026-04-13
> **Status**: Specification — ready for implementation
> **Companion to**: `docs/specs/2026-04-13-universal-generation-platform-spec.md`
> **Audience**: Claude Code sessions implementing the generation engine (no prior conversation context assumed)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Integration with the Generation Pipeline](#2-integration-with-the-generation-pipeline)
3. [The PageBlueprint Interface](#3-the-pageblueprint-interface)
4. [Visual Rhythm & Section Design](#4-visual-rhythm--section-design)
5. [Motion & Animation System](#5-motion--animation-system)
6. [Homepage Blueprint](#6-homepage-blueprint)
7. [Entity Detail Page Blueprint](#7-entity-detail-page-blueprint)
8. [Entity Listing Page Blueprint](#8-entity-listing-page-blueprint)
9. [Cross-Product Page Blueprint](#9-cross-product-page-blueprint)
10. [Blog Post Blueprint](#10-blog-post-blueprint)
11. [Blog Index Blueprint](#11-blog-index-blueprint)
12. [Team Page Blueprint](#12-team-page-blueprint)
13. [FAQ Page Blueprint](#13-faq-page-blueprint)
14. [Contact Page Blueprint](#14-contact-page-blueprint)
15. [About Page Blueprint](#15-about-page-blueprint)
16. [Landing Page Blueprint](#16-landing-page-blueprint)
17. [404 Page Blueprint](#17-404-page-blueprint)
18. [Card Component System](#18-card-component-system)
19. [Current Design Baseline & Gaps](#19-current-design-baseline--gaps)
20. [Implementation Order & Dependencies](#20-implementation-order--dependencies)

---

## 1. Overview

### What This Is

A **Page Blueprint Registry** — a set of TypeScript configurations that define the structure, block sequence, CRO rules, SEO rules, and visual rhythm for every page type the AI generation engine produces.

### Why It Exists

The generation engine (see companion spec) takes a business description and produces a full website. Without blueprints, the AI decides page structure ad-hoc, resulting in inconsistent quality. Blueprints provide **guardrails with flexibility**:

- **Required blocks** that every page must include (Hero, CTA, social proof)
- **Recommended sequences** that follow proven conversion patterns
- **Conditional blocks** that appear based on business context (`when` conditions)
- **Visual rhythm rules** that prevent the "stacked boxes" look
- **SEO rules** that ensure schema markup, heading hierarchy, and internal linking
- **CRO rules** that ensure conversion points appear at strategic positions

### Design Philosophy

Every page must look premium AND convert. These are not competing goals:

- **Premium design builds trust** → trust increases conversion
- **Strategic CTA placement captures intent** → without being pushy
- **Content quality drives SEO** → SEO brings traffic to convert
- **Visual rhythm creates professionalism** → professionalism reduces bounce

The blueprints encode the patterns used by world-class web design studios — the kind of sites that win Awwwards, rank on page 1, and convert at 5-8%.

---

## 2. Integration with the Generation Pipeline

### Where Blueprints Fit

Blueprints are consumed at **two points** in the generation pipeline (see companion spec Section 7):

**1. Code generation time (Steps 2-4):**

- **Step 2 (Generate Collections)**: The blueprint determines which blocks are available in each collection's `layout` field. If the homepage blueprint uses `hero`, `stats`, `cta`, `testimonials`, `faq`, `relatedLinks`, `content`, and `gallery` — those block slugs must be registered in the collection's layout field config.
- **Step 3 (Generate Blocks)**: If a blueprint references a business-specific block (e.g., `menuBlock` for a restaurant), the generator creates the Payload block config + Astro component.
- **Step 4 (Generate Routes)**: The blueprint determines the `.astro` page structure — what data to fetch, what to pass to SEOLayout, whether to use BlockRenderer or page-level components, and which card components to generate.

**2. Content seeding time (Step 8):**

- The blueprint's section sequence determines what blocks are placed in each entry's `layout` array field in Payload.
- Required sections are always populated. Optional sections are populated based on `when` conditions evaluated against the business model.
- CTA text, headings, and descriptions are contextual to the entity name and business type.

### Data Flow

```text
PageBlueprint
  │
  ├─► generate_collection()
  │     └─ layout field: blocks = blueprint.sections.flatMap(s => s.blocks.map(b => b.blockType))
  │
  ├─► generate_page()
  │     └─ .astro file structure: SEOLayout(pageType, schemaTypes) + BlockRenderer(layout, context)
  │     └─ Page-level components for sections where blocks = [] (filter bars, article headers, etc.)
  │
  ├─► generate_nav()
  │     └─ SiteHeader/SiteFooter read from blueprint.seo.internalLinkingRules
  │
  └─► seed_collection()
        └─ Each entry's layout[] populated following blueprint.sections order
        └─ CTA text = blueprint.cro.primaryCTA contextualized with entity name
```

### Existing System Touchpoints

| Blueprint Property | Maps To | File |
|-------------------|---------|------|
| `sections[].blocks[].blockType` | Block slugs in Payload layout field | `src/collections/*.ts` → layout field |
| `sections[].background` | Section wrapper class in BlockRenderer | `src/components/blocks/BlockRenderer.astro` |
| `sections[].width` | Container class (`container mx-auto` vs `w-full`) | Each block component |
| `sections[].animation` | Motion component wrapper | **New**: `src/components/AnimatedSection.astro` |
| `seo.schemaTypes` | `generateSchemas()` dispatch in SEOLayout | `src/lib/seo.ts` (see Schema Status table below) |
| `seo.metaTitlePattern` | `<title>` in SEOLayout | `src/layouts/SEOLayout.astro` |
| `cro.primaryCTA` | CTA block text/link/phone fields | Seed data for CTA blocks |
| `listing.cardComponent` | Generated card component name | `src/components/{Entity}Card.astro` |
| `listing.filterBar` | Page-level filter component | `src/pages/{entities}/index.astro` |
| `listing.pagination` | Pagination component | `src/components/Pagination.astro` |
| `rhythm.backgroundAlternation` | BlockRenderer section wrapper alternation | `src/components/blocks/BlockRenderer.astro` |

### Schema Generator Status

The blueprints reference JSON-LD schema types. Some have existing generators in `seo.ts`, others must be created during implementation:

| Schema Type | Status | Existing Generator | Blueprint(s) |
|------------|--------|-------------------|--------------|
| `Organization` | Exists | `generateOrganizationSchema()` | Homepage, Team, About |
| `WebSite` | Exists | `generateWebSiteSchema()` | Homepage |
| `LocalBusiness` | Exists | `generateLocalBusinessSchema()` | Homepage, Cross-product, Contact, Landing |
| `Service` | Exists | `generateServiceSchema()` | Entity Detail, Cross-product |
| `FAQPage` | Exists | `generateFAQSchema()` | Entity Detail, Cross-product, FAQ |
| `Article` | Exists | `generateArticleSchema()` | Blog Post |
| `BreadcrumbList` | Exists | `generateBreadcrumbSchema()` | All pages except 404 |
| `Review`/`AggregateRating` | Exists | `generateReviewSchema()` | (used within other schemas) |
| `CollectionPage` | **New — to be created** | — | Entity Listing, Blog Index |
| `ContactPage` | **New — to be created** | — | Contact |
| `WebPage` | **New — to be created** | — | Landing Page |
| `Person` | **New — to be created** | — | Blog Post (author), Team (each member) |

The generation engine creates these new generators as part of Step 5 (Generate JSON-LD Schemas) in the companion spec.

### Page Type → Schema Dispatch Mapping

| Blueprint pageType | seo.ts dispatch value | Schemas Generated |
|---|---|---|
| `homepage` | `home` | Organization, WebSite, LocalBusiness |
| `entity-detail` | `{entity-slug}` (dynamic) | Service, FAQPage, BreadcrumbList |
| `entity-listing` | `listing` | CollectionPage, BreadcrumbList |
| `cross-product` | `{entity1}-{entity2}` (dynamic) | Service, LocalBusiness, FAQPage, BreadcrumbList |
| `blog-post` | `blog` | Article, Person, BreadcrumbList |
| `blog-index` | `blog-index` | CollectionPage, BreadcrumbList |
| `team` | `team` | Organization, Person (per member), BreadcrumbList |
| `faq` | `faq` | FAQPage, BreadcrumbList |
| `contact` | `contact` | ContactPage, LocalBusiness, BreadcrumbList |
| `about` | `about` | Organization, BreadcrumbList |
| `landing-page` | `landing` | WebPage, LocalBusiness |
| `404` | — | (no schemas) |

---

## 3. The PageBlueprint Interface

```typescript
interface PageBlueprint {
  pageType: string
  purpose: string

  // Block composition
  sections: SectionDefinition[]

  // CRO rules
  cro: {
    primaryCTA: CTAPlacement
    ctaFrequency: number              // Max blocks between CTA appearances (0 = no automatic CTA insertion — page manages CTAs explicitly via sections)
    trustSignalPositions: string[]    // Section names (not indices) where social proof should appear. Using names avoids fragility when optional sections are omitted.
    aboveFoldRequirements: string[]   // What must be visible before scrolling
  }

  // SEO rules
  seo: {
    schemaTypes: string[]
    headingHierarchy: string
    internalLinkingRules: string[]
    metaTitlePattern: string
    metaDescPattern: string
    noindex?: boolean                  // For landing pages
    httpStatus?: number                // For 404 pages
  }

  // Visual rhythm
  rhythm: {
    sectionSpacing: 'compact' | 'default' | 'spacious'
    backgroundAlternation: boolean
    visualBreaks: number[]
  }

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
  name: string
  required: boolean
  position: 'fixed' | 'flexible'
  blocks: BlockChoice[]
  purpose: string
  background: 'default' | 'muted' | 'primary' | 'dark' | 'gradient' | 'auto'
  width: 'contained' | 'full-bleed' | 'narrow'
  animation: 'fade-up' | 'fade-in' | 'stagger' | 'none'
}

interface BlockChoice {
  blockType: string
  priority: 'preferred' | 'alternative'
  when?: string
}

interface CTAPlacement {
  text: string
  link: string | null
  phone: string
}

// --- Page-type-specific extension interfaces ---

interface ListingConfig {
  cardComponent: string
  gridColumns: { sm: number; md: number; lg: number }
  cardFields: {
    image: string
    title: string
    subtitle?: string
    description: string
    link: string
    meta?: string[]                     // Additional metadata fields (e.g., date, read time)
    author?: string                     // Author name field path (e.g., 'author.name')
  }
  featuredPost?: {                      // Optional — used by Blog Index
    enabled: boolean
    layout: 'horizontal' | 'vertical'
    fields: string[]
    source: 'latest' | 'pinned'
  }
  groupBy: string | null
  sortDefault: string
  filterBar: {
    enabled: boolean
    field: string
    style: 'pills' | 'dropdown' | 'tabs'
    includeAll: boolean
    when?: string                                    // Guard condition (e.g., 'entity has a select-type field')
  }
  pagination: {
    style: 'load-more' | 'numbered' | 'infinite-scroll'
    perPage: number
    showCount: boolean
  }
  emptyState: {
    heading: string
    description: string
    showCTA: boolean
  }
}

interface CrossProductConfig {
  contentUniqueness: {
    minimumUniquePercentage: number    // Target: 55%
    minimumUniqueWords: number         // Target: 600
    minimumTotalWords: number          // Target: 1000
    qualityScoreThreshold: number      // Target: 65 (increased from current 50 — requires updating ServicePages.ts hook)
    uniqueSections: string[]
    sharedSections: string[]
    validation: {
      pairwiseSimilarityMax: number
      clusterSimilarityMax: number
      nearDuplicateThreshold: number
      checkFields: string[]
    }
  }
  contentFallbacks: Record<string, string>
  internalLinkingMesh: {
    sameLocationOtherOfferings: number
    sameOfferingOtherLocations: number
    parentEntityLink: boolean
    parentLocationLink: boolean
  }
}

interface BlogConfig {
  readingExperience: {
    maxContentWidth: string
    typographyScale: Record<string, string>
    imageHandling: { inlineImages: string; figcaption: string }
  }
  articleHeader: {
    fields: Record<string, string>
    layout: string
  }
  authorBio: {
    fields: Record<string, string>
    layout: string
  }
  tableOfContents: {
    enabled: boolean
    position: 'above-content' | 'sidebar'
    style: 'collapsible' | 'always-visible'
    minHeadings: number
  }
  socialSharing: {
    enabled: boolean
    position: 'sticky-sidebar' | 'bottom-bar' | 'inline'
    mobilePosition?: 'bottom-bar' | 'inline'        // Fallback for mobile viewports
    platforms: string[]
    layout?: {
      desktop: string                                  // Layout description for desktop
      mobile: string                                   // Layout description for mobile
      breakpoint: 'md' | 'lg' | 'xl'                  // Switch point
    }
  }
}

interface TeamConfig {
  cardVariants: {
    leadership: { layout: string; fields: string[]; maxItems: number }
    standard: { layout: string; fields: string[]; gridColumns: Record<string, number> }
  }
  interactions: {
    hoverEffect: 'reveal-contact' | 'none'
    clickAction: 'expand-bio' | 'link-to-profile' | 'none'
  }
}

interface FAQConfig {
  grouping: { strategy: 'by-entity' | 'flat'; generalFirst: boolean; entityOrder: string }
  accordion: { behavior: 'single-open' | 'multi-open'; animation: string; iconStyle: string; defaultOpen: number }
  search: { enabled: boolean; position: string; placeholder: string; behavior: string; noResults: string }
  schema: { generateFAQPage: boolean; maxSchemaItems: number; prioritize: string }
}

interface ContactConfig {
  form: {
    source: 'payload-form-builder'
    layout: 'stacked' | 'two-column'
    fields: { required: string[]; optional: string[] }
    submitButton: { text: string; style: string }
    successState: { message: string; action: 'show-inline' | 'redirect' }
    rendering?: {
      component: string                                // React island component name (e.g., 'PayloadForm')
      library: string                                  // Form library (e.g., 'react-hook-form + zod')
      submission: string                               // Submission endpoint
    }
  }
  contactDetails: {
    fields: Array<{ icon: string; label: string; value: string; action: string | null }>
    socialLinks: boolean
  }
}

interface LandingConfig {
  navigation: { showHeader: boolean; showFooter: boolean; showBreadcrumbs: boolean }
  form: { position: string; sticky: boolean; fields: string[]; submitText: string }
  phoneNumber: { prominent: boolean; sticky: boolean; trackingNumber: boolean }
  urgency: { enabled: boolean; style: 'banner' | 'countdown' | 'none' }
}

interface NotFoundConfig {
  errorDisplay: { heading: string; subheading: string; illustration: string; tone: string }
  recovery: {
    searchEnabled: boolean
    popularEntities: { collection: string; limit: number; sortBy: string }
    quickLinks: Array<{ label: string; url: string }>
  }
}

interface EntityDetailConfig {
  featureDisplay: 'list' | 'grid' | 'alternating'   // How features/details section renders
  relatedEntitiesCount: number                        // How many related entities to show (default: 5)
  pricingDisplay: boolean                             // Whether to show pricing section
  galleryLayout: 'grid' | 'masonry' | 'carousel'     // Gallery section layout
}
```

Homepage and About page types do not have extension interfaces. Their behavior is fully defined by their `sections` array, `cro`, `seo`, and `rhythm` properties, combined with the business model analysis that determines content.

**Type safety note**: The PageBlueprint interface allows multiple extension properties simultaneously (e.g., both `listing` and `blog`). In practice, only one extension is used per blueprint. To enforce mutual exclusivity at the type level, use a discriminated union:

```typescript
type PageBlueprintTyped =
  | (PageBlueprintBase & { listing: ListingConfig })
  | (PageBlueprintBase & { crossProduct: CrossProductConfig })
  | (PageBlueprintBase & { blog: BlogConfig })
  // ... etc.
```

This is recommended for implementation but not required for the spec.

### Section Background Mapping

| Background Value | Tailwind Classes | Purpose |
|-----------------|-----------------|---------|
| `default` | `bg-background` | Standard white/light background |
| `muted` | `bg-muted/50` | Subtle gray to create visual separation |
| `primary` | `bg-primary text-primary-foreground` | Brand color — used for CTA sections |
| `dark` | `bg-foreground text-background` | Dark sections — hero, final CTA |
| `gradient` | `bg-gradient-to-b from-muted/50 to-background` | Soft transition between sections |
| `auto` | Alternates based on rhythm.backgroundAlternation | Let the system choose |

### Section Width Mapping

| Width Value | Tailwind Classes | Use Case |
|------------|-----------------|----------|
| `contained` | `container mx-auto px-4 max-w-7xl` | Standard content width — most sections |
| `full-bleed` | `w-full` (no container) | Hero backgrounds, CTA banners, gallery carousels |
| `narrow` | `container mx-auto px-4 max-w-3xl` | Blog content, FAQ accordions, focused reading |

### Section Spacing Mapping

| Spacing Value | Tailwind Classes | Use Case |
|--------------|-----------------|----------|
| `compact` | `py-12 md:py-16` | Blog pages, FAQ — continuous reading flow |
| `default` | `py-16 md:py-20` | Most pages — balanced breathing room |
| `spacious` | `py-20 md:py-28` | Homepage, about — premium, generous whitespace |

---

## 4. Visual Rhythm & Section Design

### Background Alternation

When `rhythm.backgroundAlternation` is `true`, BlockRenderer alternates section backgrounds to create visual separation without explicit dividers:

```text
Section 1: bg-background     (white)
Section 2: bg-muted/50       (light gray)
Section 3: bg-background     (white)
Section 4: bg-muted/50       (light gray)
...
```

**Exception**: Sections with explicit `background` values (`primary`, `dark`, `gradient`) override the alternation pattern. The alternation resumes after the override.

### Visual Breaks

`rhythm.visualBreaks` defines section indices where a subtle divider appears — a thin line or gradient fade between sections. Used sparingly (1-2 per page) to mark transitions between page "acts":

- Act 1: Establish (hero, trust, offerings)
- Act 2: Convince (features, proof, details)
- Act 3: Convert (CTA, FAQ, final push)

Implementation: A `<div class="h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-2xl mx-auto">` between the specified sections.

### BlockRenderer Architecture Update

The current BlockRenderer renders blocks directly with no section wrapper. To support background alternation, width control, and animations, BlockRenderer must be refactored:

**Option chosen: Section metadata via block-registry mapping**

During content seeding, the layout array stores only block data (no section metadata). Instead, the page's `.astro` file passes the PageBlueprint's sections array alongside the layout array. BlockRenderer matches each block to its blueprint section by index and applies the section's background, width, and animation as a wrapper:

```astro
{blocks.map((block, index) => {
  const section = blueprintSections[index]
  return (
    <AnimatedSection animation={section?.animation || 'none'}>
      <div class={getSectionClasses(section)}>
        <BlockComponent data={block} context={context} headingLevel={baseHeadingLevel + index} />
      </div>
    </AnimatedSection>
  )
})}
```

This approach keeps Payload's layout array clean (no metadata pollution) while applying visual rhythm at render time.

### Unknown Block Fallback

When BlockRenderer encounters a `blockType` in the layout array that has no matching component in the block registry:

- **Development mode**: Render a visible warning box with the block type name, yellow border, and message "Block component not found: {blockType}". This helps developers identify missing or misnamed blocks.
- **Production mode**: Silently skip the block and log a warning to the server console. Never render broken content to visitors.

### Heading Hierarchy Rules

Every page follows strict heading hierarchy for SEO and accessibility:

1. **One h1 per page** — always in the first section (hero or page header)
2. **h2 for section headings** — each major section gets an h2
3. **h3 for items within sections** — FAQ questions, feature titles, card headings
4. **Never skip levels** — no h1 → h3 jumps
5. **BlockRenderer passes `baseHeadingLevel`** — the existing prop cascades correctly

---

## 5. Motion & Animation System

### Animation Types

Using the existing Motion library (`motion` package, already installed in both templates):

| Animation | Trigger | CSS/Motion Config | Use Case |
|-----------|---------|------------------|----------|
| `fade-in` | On mount | `opacity: 0→1, duration: 0.6s` | Hero sections, page headers |
| `fade-up` | Scroll into view | `opacity: 0→1, y: 30→0, duration: 0.5s` | Content sections, CTAs |
| `stagger` | Scroll into view | `fade-up` with `delay: index * 0.1s` per child | Card grids, feature lists, stats |
| `none` | — | No animation | Article body text, forms |

### Implementation

A new `AnimatedSection.astro` component wraps each section output by BlockRenderer:

```astro
---
interface Props {
  animation: 'fade-up' | 'fade-in' | 'stagger' | 'none'
  class?: string
}
const { animation, class: className } = Astro.props
---

{animation === 'none' ? (
  <div class={className}><slot /></div>
) : (
  <div
    class={className}
    data-animate={animation}
    data-animated="false"
  >
    <slot />
  </div>
)}
```

A lightweight client-side script uses `IntersectionObserver` to trigger animations when sections scroll into view. No JavaScript framework needed — pure CSS transitions triggered by adding a class.

### Performance Rules

- Animations only trigger once (no re-triggering on scroll back up)
- `prefers-reduced-motion` media query disables all animations
- Animations use `transform` and `opacity` only (GPU-accelerated, no layout thrashing)
- Stagger delay caps at 0.5s total (5 items × 0.1s) — never makes users wait
- **Progressive enhancement**: Elements start visible (`opacity: 1`). The animation script adds the hidden state (`opacity: 0`) only after loading. If JavaScript fails to load or is disabled, all content remains visible — content is never hidden by default.
- **No-JS fallback**: Use CSS `@supports` or a `js-loaded` class on `<html>` to scope animation styles. Without this class, animations are inert.

---

## 6. Homepage Blueprint

```typescript
const homepageBlueprint: PageBlueprint = {
  pageType: 'homepage',
  purpose: 'Establish brand, communicate value proposition, drive primary conversion',

  sections: [
    {
      name: 'hero',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'hero', priority: 'preferred' }],
      purpose: 'Value proposition + primary CTA. Must answer: what do you do, who is it for, why should I care?',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-in',
    },
    {
      name: 'trust-bar',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'stats', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Instant credibility — years in business, customers served, rating, certifications',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'primary-offerings',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'relatedLinks', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Showcase top 3-6 services/products/offerings with cards linking to detail pages',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'mid-page-cta',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Conversion point for visitors who have seen enough. Phone + form.',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
    {
      name: 'differentiator',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'content', priority: 'preferred' },
        { blockType: 'gallery', priority: 'alternative' },
      ],
      purpose: 'What makes this business different. Process, quality, unique approach.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'social-proof',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'testimonials', priority: 'preferred' }],
      purpose: 'Customer testimonials — 3-6 featured reviews with ratings and names',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'content-preview',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }],
      purpose: 'Show expertise via recent blog posts or resources. 3 cards.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'locations',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'relatedLinks', priority: 'preferred' },
        { blockType: 'locationMap', priority: 'alternative', when: 'business has physical locations' },
      ],
      purpose: 'Show service areas or physical locations. Map + address cards.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'faq-preview',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'faq', priority: 'preferred' }],
      purpose: 'Top 4-5 FAQs to address objections and boost SEO. Accordion format.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Final conversion push. Strong headline, phone + form. Creates urgency.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  cro: {
    primaryCTA: { text: 'dynamic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 4,
    trustSignalPositions: ['trust-bar', 'social-proof'],
    aboveFoldRequirements: [
      'Business name and value proposition',
      'Primary CTA button (form or phone)',
      'One trust signal (rating, years, customer count)',
    ],
  },

  seo: {
    schemaTypes: ['Organization', 'WebSite', 'LocalBusiness'],
    headingHierarchy: 'h1 in hero → h2 per section',
    internalLinkingRules: [
      'Link to all primary entity pages from offerings section',
      'Link to blog from content-preview section',
      'Link to contact from both CTAs',
    ],
    metaTitlePattern: '{BusinessName} — {Tagline}',
    metaDescPattern: '{BusinessType} in {Location}. {ValueProp}. Call {Phone}.',
  },

  rhythm: {
    sectionSpacing: 'spacious',
    backgroundAlternation: true,
    visualBreaks: [3, 7],
  },
}
```

**Design rationale:**

- Hero and final CTA are **fixed** (always first and last) — everything between is flexible
- Two CTAs minimum (mid-page + final) — visitors convert at different scroll depths
- Trust bar is **second** (not buried) — credibility must come immediately after the promise
- Social proof is required, FAQ is optional — reviews are universal, FAQs depend on business type
- Locations section only appears when the business has physical locations (`when` condition)

---

## 7. Entity Detail Page Blueprint

```typescript
const entityDetailBlueprint: PageBlueprint = {
  pageType: 'entity-detail',
  purpose: 'Convince visitor this specific offering solves their problem, then convert',

  sections: [
    {
      name: 'hero',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'hero', priority: 'preferred' }],
      purpose: 'Entity name, short description, featured image. Primary CTA visible.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-in',
    },
    {
      name: 'overview',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'Detailed description of the offering. Image + text side-by-side. Answers: what is it, who is it for, what do you get?',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'features-or-details',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'serviceDetail', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Feature list, process steps, or key details. Icon grid or alternating rows.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'pricing',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'pricing', priority: 'preferred', when: 'entity has pricing data' },
      ],
      purpose: 'Transparent pricing builds trust. Tiers or starting-at pricing.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'mid-page-cta',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Convert visitors who have seen enough detail. Contextual — "Book your {entityName}" not generic.',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
    {
      name: 'gallery',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'gallery', priority: 'preferred', when: 'entity has gallery images' },
      ],
      purpose: 'Visual proof — before/after, portfolio shots, completed work.',
      background: 'default',
      width: 'full-bleed',
      animation: 'stagger',
    },
    {
      name: 'social-proof',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'testimonials', priority: 'preferred' }],
      purpose: 'Testimonials filtered to THIS entity. "Here is what people say about {entityName}".',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'faq',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'faq', priority: 'preferred' }],
      purpose: 'Entity-specific FAQs. Address objections, generate FAQ schema markup.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'related-entities',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }],
      purpose: 'Internal linking — "You might also be interested in..." 3-6 related entity cards.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Final conversion. Contextual to the entity — "Ready for {entityName}? Call now."',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  entityDetail: {
    featureDisplay: 'grid',
    relatedEntitiesCount: 5,
    pricingDisplay: true,
    galleryLayout: 'grid',
  },

  cro: {
    primaryCTA: { text: 'contextual to entity', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 4,
    trustSignalPositions: ['social-proof'],
    aboveFoldRequirements: [
      'Entity name as h1',
      'Short description (1-2 sentences)',
      'Featured image',
      'Primary CTA button',
      'Rating or review count badge (if available)',
    ],
  },

  seo: {
    schemaTypes: ['Service', 'FAQPage', 'BreadcrumbList'],
    headingHierarchy: 'h1 in hero (entity name) → h2 per section → h3 for features/FAQ items',
    internalLinkingRules: [
      'Link to parent listing page via breadcrumbs',
      'Link to 3-5 related entities in related section',
      'Link to relevant blog posts if they exist',
      'Link to location pages if cross-product pages exist',
    ],
    metaTitlePattern: '{EntityName} | {BusinessName}',
    metaDescPattern: '{ShortDescription}. {TrustSignal}. Call {Phone}.',
  },

  rhythm: {
    sectionSpacing: 'default',
    backgroundAlternation: true,
    visualBreaks: [4],
  },
}
```

**Design rationale:**

- Testimonials are **filtered to the entity** — not global reviews, but "what people say about THIS treatment/service." The Testimonials collection already has a `service` relationship field that enables this
- FAQ is **required** — entity-specific FAQs generate `FAQPage` schema markup which is a major SEO advantage (rich results in Google)
- Related entities section is **required** — internal linking is the #1 SEO lever for pSEO sites and feeds the `relatedServices`/`relatedLinks` Payload fields
- CTAs are **contextual** — "Book your teeth cleaning" not "Contact us." The seeder writes CTA text using the entity name from the business model
- Pricing is **conditional** — appears only when the entity has pricing data (checked via `when` condition on the `pricing` group field). The `analyze_business` tool determines pricing applicability. Businesses with transparent, displayable pricing (fixed rates, tier-based) set `pricing.showPricing: true`. Businesses with variable/quote-based pricing (law firms, custom services) set `pricing.showPricing: false`, and the pricing section is omitted.

---

## 8. Entity Listing Page Blueprint

```typescript
const entityListingBlueprint: PageBlueprint = {
  pageType: 'entity-listing',
  purpose: 'Help visitors browse all offerings, find what they need, click into detail pages',

  sections: [
    {
      name: 'page-header',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'hero', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Page title, brief description of what the business offers. NOT a full hero — shorter, text-focused.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-in',
    },
    {
      name: 'filter-and-grid',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Category filter bar (if entity has categories) + responsive card grid. This section is code-generated, not a CMS block.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'mid-page-cta',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Catch visitors who browsed but need a push. "Not sure which {entity} is right? Call us."',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
    {
      name: 'why-choose-us',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'stats', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Reinforce credibility below the listings. Quick stats or differentiator.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'social-proof',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'testimonials', priority: 'preferred' }],
      purpose: 'General testimonials — not entity-specific. "What our customers say."',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Bottom conversion point for visitors who scrolled through all offerings.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  listing: {
    cardComponent: 'EntityCard',
    gridColumns: { sm: 1, md: 2, lg: 3 },
    cardFields: {
      image: 'featuredImage',
      title: 'name',
      subtitle: 'category',
      description: 'shortDescription',
      link: 'slug',
    },
    groupBy: 'category',
    sortDefault: 'name',
    filterBar: {
      enabled: true,                     // Only renders if entity actually has the specified field
      field: 'category',
      style: 'pills',
      includeAll: true,
      when: 'entity has a select-type field matching filterBar.field',  // Guard condition
    },
    pagination: {
      style: 'load-more',
      perPage: 12,
      showCount: true,
    },
    emptyState: {
      heading: 'No {entities} found',
      description: 'Try adjusting your filters or contact us for help.',
      showCTA: true,
    },
  },

  cro: {
    primaryCTA: { text: 'contextual', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 5,
    trustSignalPositions: ['why-choose-us', 'social-proof'],
    aboveFoldRequirements: [
      'Page title as h1',
      'Brief intro text (1-2 sentences)',
      'At least 3 entity cards visible',
      'Filter bar (if enabled)',
    ],
  },

  seo: {
    schemaTypes: ['CollectionPage', 'BreadcrumbList'],
    headingHierarchy: 'h1 page title → h2 category groups (if grouped) → h3 entity names in cards',
    internalLinkingRules: [
      'Every card links to its detail page',
      'Category groups link to filtered views',
      'Breadcrumb links to homepage',
    ],
    metaTitlePattern: '{EntityPluralName} | {BusinessName}',
    metaDescPattern: 'Browse our {entityPluralName}. {BusinessType} in {Location}. {TrustSignal}.',
  },

  rhythm: {
    sectionSpacing: 'default',
    backgroundAlternation: true,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- Filter-and-grid is **NOT a CMS block** — it's generated as page-level code in the `.astro` file. The generator writes this directly based on the entity's fields (if it has a `category` select field → filter bar appears)
- Card component is **generated per entity** — `TreatmentCard.astro`, `PracticeAreaCard.astro`. The blueprint's `listing.cardFields` mapping tells the generator which Payload fields map to which card positions
- **Load-more pagination** over numbered or infinite scroll — it's the best UX/SEO balance (content is server-rendered, more loads client-side)
- Group-by is **optional** — only activates if the entity has a category/type field
- Empty state is **defined** — if filters return zero results, the page shows a helpful message with a CTA instead of blank space

---

## 9. Cross-Product Page Blueprint

**Applicability**: This blueprint is only used when the business model includes at least two entity types with `hasPublicPages: true` and at least 2 entries each. Purely online businesses (SaaS, e-commerce, digital agencies) with no location dimension should skip cross-product pages entirely. The `analyze_business` tool validates this before generating cross-product blueprints.

```typescript
const crossProductBlueprint: PageBlueprint = {
  pageType: 'cross-product',
  purpose: 'Rank for "{offering} in {location}" long-tail keywords with unique, localized content',

  sections: [
    {
      name: 'hero',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'hero', priority: 'preferred' }],
      purpose: 'h1 = "{EntityName} in {LocationName}". Background image from entity or location. CTA with phone.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-in',
    },
    {
      name: 'local-introduction',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'Location-specific intro. NOT a copy of the entity description — unique content that mentions the area, local context, why this offering matters HERE.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'offering-details',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'serviceDetail', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'What the offering includes — features, process, what to expect. Pulled from parent entity but can be overridden.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'pricing',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'pricing', priority: 'preferred', when: 'entity has pricing data' },
      ],
      purpose: 'Location-specific pricing if it varies by area. Otherwise inherits from parent entity.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'mid-page-cta',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Get {EntityName} in {LocationName} — Call {LocationPhone} or book online"',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
    {
      name: 'local-proof',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'testimonials', priority: 'preferred' }],
      purpose: 'Testimonials filtered to BOTH this entity AND this location. Falls back to entity-only or location-only if not enough.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'location-info',
      required: true,
      position: 'flexible',
      blocks: [
        { blockType: 'locationMap', priority: 'preferred', when: 'business has physical locations' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Address, hours, map embed for this specific location. Drives local SEO signals.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'faq',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'faq', priority: 'preferred' }],
      purpose: 'FAQs specific to this entity+location combo. "How much does {entity} cost in {location}?" Generates FAQPage schema.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'related-cross-products',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }],
      purpose: 'Two link groups: (1) Other offerings at this location, (2) This offering at other locations. Critical for internal linking mesh.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Final push — "Ready for {EntityName} in {LocationName}?"',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  crossProduct: {
    contentUniqueness: {
      minimumUniquePercentage: 55,
      minimumUniqueWords: 600,
      minimumTotalWords: 1000,
      qualityScoreThreshold: 65,
      uniqueSections: [
        'local-introduction',
        'offering-details',
        'faq',
        'location-info',
      ],
      sharedSections: [
        'hero',
        'pricing',
        'final-cta',
      ],
      validation: {
        pairwiseSimilarityMax: 0.45,
        clusterSimilarityMax: 0.40,
        nearDuplicateThreshold: 0.60,
        checkFields: ['introduction', 'localContent', 'layout'],
      },
    },
    contentFallbacks: {
      introduction: 'Generate unique using location.areaInfo + entity.shortDescription',
      features: 'Inherit from parent entity (same across locations)',
      testimonials: 'Filter by entity+location → entity-only → featured (cascading)',
      faqs: 'Filter by entity+location → entity-only → general (cascading)',
      pricing: 'Inherit from parent entity unless location-specific override exists',
    },
    internalLinkingMesh: {
      sameLocationOtherOfferings: 3,
      sameOfferingOtherLocations: 3,
      parentEntityLink: true,
      parentLocationLink: true,
    },
  },

  cro: {
    primaryCTA: { text: 'contextual to entity+location', link: '/contact', phone: 'location-specific or SiteSettings' },
    ctaFrequency: 4,
    trustSignalPositions: ['local-proof'],
    aboveFoldRequirements: [
      'h1 with entity + location name',
      'Location-specific intro sentence',
      'Primary CTA with local phone number',
      'Rating badge (if available)',
    ],
  },

  seo: {
    schemaTypes: ['Service', 'LocalBusiness', 'FAQPage', 'BreadcrumbList'],
    headingHierarchy: 'h1 = "{Entity} in {Location}" → h2 per section → h3 for features/FAQ items',
    internalLinkingRules: [
      'Breadcrumbs: Home > {Entities} > {Entity} > {Entity} in {Location}',
      'Link to parent entity page',
      'Link to parent location page',
      'Link to 3 sibling cross-product pages (same location, different offering)',
      'Link to 3 sibling cross-product pages (same offering, different location)',
    ],
    metaTitlePattern: '{EntityName} in {LocationName} | {BusinessName}',
    metaDescPattern: '{EntityName} in {LocationDisplayName}. {UniqueLocalSentence}. Call {Phone}.',
  },

  rhythm: {
    sectionSpacing: 'default',
    backgroundAlternation: true,
    visualBreaks: [4],
  },
}
```

**Design rationale:**

- **55% content uniqueness enforced** — each cross-product page must have 55%+ unique content vs sibling pages to avoid Google's thin/duplicate content penalties. The `contentUniqueness` config maps to the existing `contentQualityScore` field and quality gate in the ServicePages collection
- **Cascading fallbacks** for testimonials and FAQs — when seeding 50+ pages, not every page will have entity+location-specific testimonials. The system cascades: try entity+location filtered → entity-only → featured. Uses existing `service` and `location` relationship fields
- **Internal linking mesh** — 3 sibling links in each direction (same location + same offering) creates the dense internal linking structure that makes pSEO work. Feeds the `relatedServicePages` relationship field
- **Local introduction must be unique** — the seeder uses `location.areaInfo` + `entity.shortDescription` + local demographics/climate/regulations to generate unique intros. Stored in `localContent` richText field

---

## 10. Blog Post Blueprint

```typescript
const blogPostBlueprint: PageBlueprint = {
  pageType: 'blog-post',
  purpose: 'Rank for informational keywords, build topical authority, funnel readers to entity pages',

  sections: [
    {
      name: 'article-header',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'h1 title, author byline with photo, publish date, category badge, estimated read time, featured image. Page-level component, not a CMS block.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-in',
    },
    {
      name: 'featured-image',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Full-width featured image with caption. Uses hero image size (1920x1080). Aspect ratio 16:9.',
      background: 'default',
      width: 'contained',
      animation: 'none',
    },
    {
      name: 'article-body',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'The article content from the Lexical richText field. Rendered via RichText.astro with prose styling. Minimum 800 words for SEO value.',
      background: 'default',
      width: 'narrow',
      animation: 'none',
    },
    {
      name: 'in-content-cta',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Contextual CTA within the article flow — "Need help with {relatedEntity}? We can help." Positioned after the core value has been delivered, roughly 60% through the content.',
      background: 'muted',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'author-bio',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Author card — photo, name, role, short bio, link to team page. Builds E-E-A-T signals. Uses post.author relationship to TeamMembers collection.',
      background: 'muted',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'related-entities',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }],
      purpose: 'Link to entity pages this article references. "Services mentioned in this article" — uses post.relatedServices and post.relatedLocations relationship fields.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'related-posts',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }],
      purpose: '3 related blog posts — same category or shared tags. Card grid with image, title, excerpt, date.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Bottom conversion point. Readers who finished the article are warm leads.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  blog: {
    readingExperience: {
      maxContentWidth: 'max-w-3xl',
      typographyScale: {
        h1: 'text-4xl md:text-5xl font-bold leading-tight',
        h2: 'text-2xl md:text-3xl font-semibold mt-12 mb-4',
        h3: 'text-xl md:text-2xl font-semibold mt-8 mb-3',
        body: 'text-lg leading-relaxed text-muted-foreground',
        caption: 'text-sm text-muted-foreground',
      },
      imageHandling: {
        inlineImages: 'rounded-lg shadow-md my-8',
        figcaption: 'text-center text-sm text-muted-foreground mt-2 italic',
      },
    },
    articleHeader: {
      fields: {
        title: 'post.title',
        category: 'post.category',
        author: 'post.author || post.authorOverride',
        authorPhoto: 'post.author.photo',
        publishDate: 'post.publishedAt',
        readTime: 'calculated',
      },
      layout: 'category-badge → h1 → meta-row (author photo + name + date + read time)',
    },
    authorBio: {
      fields: {
        name: 'author.name',
        role: 'author.role',
        photo: 'author.photo',
        bio: 'author.bio',
        link: '/team#{author.slug}',
      },
      layout: 'Horizontal card — photo left, name/role/bio right, "View profile" link',
    },
    tableOfContents: {
      enabled: true,
      position: 'above-content',
      style: 'collapsible',
      minHeadings: 3,
    },
    socialSharing: {
      enabled: true,
      position: 'sticky-sidebar',       // Desktop: floating left sidebar outside max-w-3xl content
      mobilePosition: 'bottom-bar',     // Mobile (<lg): fixed bottom bar
      platforms: ['x', 'linkedin', 'facebook', 'copy-link'],
      layout: {
        desktop: 'max-w-5xl container with max-w-3xl content column + narrow sidebar column',
        mobile: 'Full-width bottom bar with horizontal icon row',
        breakpoint: 'lg',               // Switch from sidebar to bottom-bar at lg breakpoint
      },
    },
  },

  cro: {
    primaryCTA: { text: 'contextual to article topic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['author-bio'],  // Author bio serves as E-E-A-T trust signal (Experience, Expertise, Authoritativeness, Trustworthiness)
    aboveFoldRequirements: [
      'Article title as h1',
      'Author name and photo',
      'Category badge',
      'Publish date and read time',
      'Featured image',
    ],
  },

  seo: {
    schemaTypes: ['Article', 'BreadcrumbList', 'Person'],
    headingHierarchy: 'h1 = article title → h2/h3 within content (from Lexical) → h2 for related sections',
    internalLinkingRules: [
      'Link to 2-3 entity pages within article body (contextual, not forced)',
      'Link to related entity pages in dedicated section below article',
      'Link to 3 related blog posts',
      'Link to author profile on team page',
      'Breadcrumbs: Home > Blog > Article Title',
    ],
    metaTitlePattern: '{ArticleTitle} | {BusinessName} Blog',
    metaDescPattern: '{Excerpt (truncated to 155 chars)}',
  },

  rhythm: {
    sectionSpacing: 'compact',
    backgroundAlternation: false,
    visualBreaks: [5],
  },
}
```

**Design rationale:**

- **Narrow content width** (`max-w-3xl`) — optimal reading line length is 50-75 characters
- **Table of contents auto-generated** from h2/h3 headings in the Lexical richText. Only appears if 3+ headings exist. Collapsible.
- **Author bio is mandatory** — Google's E-E-A-T guidelines weight author attribution heavily. Uses existing `author` → TeamMembers relationship
- **Only 2 CTAs** — one in-content, one final. Blog readers came for information; excessive CTAs increase bounce rate
- **Social sharing is sticky sidebar** on desktop, bottom bar on mobile
- **Read time calculated** — `Math.ceil(wordCount / 200)` minutes

---

## 11. Blog Index Blueprint

```typescript
const blogIndexBlueprint: PageBlueprint = {
  pageType: 'blog-index',
  purpose: 'Help visitors discover content by category, drive traffic to individual posts',

  sections: [
    {
      name: 'page-header',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'h1 "Blog" or "{BusinessName} Blog", brief description. Clean, editorial feel.',
      background: 'default',
      width: 'contained',
      animation: 'fade-in',
    },
    {
      name: 'featured-post',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Latest or pinned post displayed prominently — large image, full title, excerpt, author, date. Spans full width.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'filter-and-grid',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Category filter (pills/tabs) + card grid of remaining posts. Excludes the featured post.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'newsletter-cta',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Subscribe to our newsletter." Email capture, not a sales CTA.',
      background: 'muted',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Soft conversion — "Have questions? Contact us." Blog visitors are top-of-funnel.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  listing: {
    cardComponent: 'BlogCard',
    gridColumns: { sm: 1, md: 2, lg: 3 },
    cardFields: {
      image: 'featuredImage',
      title: 'title',
      subtitle: 'category',
      description: 'excerpt',
      link: 'slug',
      meta: ['publishedAt', 'readTime'],
      author: 'author.name',
    },
    featuredPost: {
      enabled: true,
      layout: 'horizontal',
      fields: ['featuredImage(hero)', 'title', 'excerpt(full)', 'author', 'publishedAt', 'category', 'readTime'],
      source: 'latest',
    },
    groupBy: null,
    sortDefault: '-publishedAt',
    filterBar: {
      enabled: true,
      field: 'category',
      style: 'pills',
      includeAll: true,
    },
    pagination: {
      style: 'load-more',
      perPage: 12,
      showCount: true,
    },
    emptyState: {
      heading: 'No posts found',
      description: 'Check back soon — we publish new content regularly.',
      showCTA: false,
    },
  },

  cro: {
    primaryCTA: { text: 'soft — newsletter or contact', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: [
      'Page title',
      'Featured post with image, title, excerpt',
      'Category filter pills',
    ],
  },

  seo: {
    schemaTypes: ['CollectionPage', 'BreadcrumbList'],
    headingHierarchy: 'h1 page title → h2 featured post title → h3 card titles',
    internalLinkingRules: [
      'Every card links to its blog post',
      'Featured post links to its page',
      'Category pills filter in-page (client-side)',
      'Breadcrumbs: Home > Blog',
    ],
    metaTitlePattern: 'Blog | {BusinessName}',
    metaDescPattern: '{BusinessType} tips, guides, and news. Expert insights from {BusinessName}.',
  },

  rhythm: {
    sectionSpacing: 'compact',
    backgroundAlternation: false,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- **Featured post gets hero treatment** — large horizontal card, separate from the grid. Rewards consistent publishing
- **Newsletter CTA, not sales CTA** — blog visitors are top-of-funnel. "Subscribe for tips" is appropriate; "Get a free quote" is not
- **Sort by newest first** — matches existing Payload client helper `-publishedAt`

---

## 12. Team Page Blueprint

```typescript
const teamBlueprint: PageBlueprint = {
  pageType: 'team',
  purpose: 'Build trust through personal connection. Show the humans behind the business. E-E-A-T signal.',

  sections: [
    {
      name: 'page-header',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'hero', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'h1 "Meet Our Team" or "The People Behind {BusinessName}". Brief paragraph about culture, values, expertise.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-in',
    },
    {
      name: 'leadership',
      required: false,
      position: 'flexible',
      blocks: [],
      purpose: 'Owner/founder/leadership displayed prominently — larger cards with full bio, photo, credentials. 1-2 people max.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'team-grid',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'team', priority: 'preferred' }],
      purpose: 'All team members in a responsive grid. Photo, name, role, 1-line bio.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'credentials',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'stats', priority: 'preferred' }],
      purpose: 'Aggregate credentials — "50+ years combined experience", "12 certified technicians". Uses TeamMembers.certifications.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'culture',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'gallery', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Behind-the-scenes photos, team events, workspace. Humanizes the brand.',
      background: 'default',
      width: 'full-bleed',
      animation: 'stagger',
    },
    {
      name: 'careers-cta',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Join our team" — optional hiring CTA.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Work with our team" — soft conversion. Seeing the team builds trust, now convert.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  team: {
    cardVariants: {
      leadership: {
        layout: 'horizontal',
        fields: ['photo(hero)', 'name', 'role', 'bio(full)', 'email', 'phone', 'certifications'],
        maxItems: 2,
      },
      standard: {
        layout: 'vertical',
        fields: ['photo(square)', 'name', 'role', 'bio(truncated-2-lines)'],
        gridColumns: { sm: 1, md: 2, lg: 3, xl: 4 },
      },
    },
    interactions: {
      hoverEffect: 'reveal-contact',
      clickAction: 'expand-bio',
    },
  },

  cro: {
    primaryCTA: { text: 'soft trust-based', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['credentials'],
    aboveFoldRequirements: [
      'Page title',
      'Intro paragraph about the team',
      'At least 2-3 team member photos visible',
    ],
  },

  seo: {
    schemaTypes: ['Organization', 'Person', 'BreadcrumbList'],  // Person schema generated for each team member individually
    headingHierarchy: 'h1 page title → h2 section headings → h3 team member names',
    internalLinkingRules: [
      'Team members with specialties link to related entity pages',
      'Team members with locations link to location pages',
      'Breadcrumbs: Home > Team',
    ],
    metaTitlePattern: 'Our Team | {BusinessName}',
    metaDescPattern: 'Meet the team at {BusinessName}. {CredentialsSummary}. {Location}.',
  },

  rhythm: {
    sectionSpacing: 'spacious',
    backgroundAlternation: true,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- **Leadership gets premium treatment** — 1-2 owners/founders as large horizontal cards, separate from the staff grid
- **Credentials aggregated from TeamMembers.certifications** — the existing array field provides the data for the stats block
- **Hover reveals contact info** — cards show email/phone only on hover, keeping the default view clean
- **Person schema for each member** — E-E-A-T signals to Google

---

## 13. FAQ Page Blueprint

```typescript
const faqBlueprint: PageBlueprint = {
  pageType: 'faq',
  purpose: 'Answer common questions, reduce support burden, generate FAQ rich results in Google, address conversion objections',

  sections: [
    {
      name: 'page-header',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'h1 "Frequently Asked Questions", brief intro. Search bar to filter FAQs by keyword.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-in',
    },
    {
      name: 'faq-by-category',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'FAQs grouped by entity (general, then per-entity sections). Each group has h2 heading. Accordion format.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'still-have-questions',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Still have questions? Contact us." Phone + form CTA. Critical — if the FAQ did not answer their question, catch them here.',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  faq: {
    grouping: {
      strategy: 'by-entity',
      generalFirst: true,
      entityOrder: 'alphabetical',
    },
    accordion: {
      behavior: 'single-open',
      animation: 'slide-down',
      iconStyle: 'chevron-rotate',
      defaultOpen: 0,
    },
    search: {
      enabled: true,
      position: 'below-header',
      placeholder: 'Search questions...',
      behavior: 'client-side-filter',
      noResults: "No matching questions found. Contact us and we'll answer directly.",
    },
    schema: {
      generateFAQPage: true,
      maxSchemaItems: 10,
      prioritize: 'sortOrder',
    },
  },

  cro: {
    primaryCTA: { text: '"Still have questions?"', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: [
      'Page title',
      'Search bar',
      'At least 3 FAQ questions visible (first one open)',
    ],
  },

  seo: {
    schemaTypes: ['FAQPage', 'BreadcrumbList'],
    headingHierarchy: 'h1 page title → h2 entity group names → h3 individual questions',
    internalLinkingRules: [
      'FAQ answers should link to relevant entity pages where contextual',
      'Entity group headings link to entity listing page',
      'Breadcrumbs: Home > FAQ',
    ],
    metaTitlePattern: 'FAQ | {BusinessName}',
    metaDescPattern: 'Answers to common questions about {BusinessType}. {TopQuestion}?',
  },

  rhythm: {
    sectionSpacing: 'compact',
    backgroundAlternation: false,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- **Search/filter is mandatory** — visitors come with a specific question. Let them find it fast
- **Single-open accordion** — one FAQ expanded at a time prevents wall-of-text
- **Grouped by entity** — uses existing `service` relationship field on FAQs collection
- **FAQPage schema limited to 10 items** — Google's rich results cap. `sortOrder` field determines priority
- **"Still have questions" CTA** — highest-converting element on the page

---

## 14. Contact Page Blueprint

```typescript
const contactBlueprint: PageBlueprint = {
  pageType: 'contact',
  purpose: 'Convert visitors into leads. Remove all friction. Provide every contact method.',

  sections: [
    {
      name: 'page-header',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'h1 "Contact Us" or "Get in Touch". Brief reassurance — "We respond within 24 hours" or "Free consultation".',
      background: 'muted',
      width: 'contained',
      animation: 'fade-in',
    },
    {
      name: 'contact-form-and-info',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Two-column layout: (1) Contact form on the left (60%), (2) Contact details on the right (40%). Form uses Payload Form Builder. Details show phone, email, address, hours.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'locations-map',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'locationMap', priority: 'preferred', when: 'business has physical locations' },
      ],
      purpose: 'Google Maps embed showing all locations. Address cards below the map if multiple locations.',
      background: 'muted',
      width: 'full-bleed',
      animation: 'fade-up',
    },
    {
      name: 'trust-reinforcement',
      required: true,
      position: 'flexible',
      blocks: [
        { blockType: 'stats', priority: 'preferred' },
        { blockType: 'testimonials', priority: 'alternative' },
      ],
      purpose: 'Last-minute trust signal. "500+ happy customers", "4.9 average rating", or a testimonial carousel.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'response-guarantee',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'Set expectations — "We respond within 2 hours during business hours." Reduces form abandonment anxiety.',
      background: 'muted',
      width: 'narrow',
      animation: 'fade-up',
    },
  ],

  contact: {
    form: {
      source: 'payload-form-builder',
      layout: 'stacked',
      fields: {
        required: ['name', 'email', 'message'],
        optional: ['phone', 'entity-interest', 'preferred-location'],
      },
      submitButton: {
        text: 'Send Message',
        style: 'w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold',
      },
      successState: {
        message: "Thank you! We'll be in touch within {responseTime}.",
        action: 'show-inline',
      },
      rendering: {
        component: 'PayloadForm',          // React island (client:load) — fetches form config from Payload
        library: 'react-hook-form + zod',  // Already installed in Astro template
        submission: 'Payload form-submissions API endpoint',
      },
    },
    contactDetails: {
      fields: [
        { icon: 'Phone', label: 'Call us', value: 'siteSettings.phone', action: 'tel:' },
        { icon: 'Mail', label: 'Email us', value: 'siteSettings.email', action: 'mailto:' },
        { icon: 'MapPin', label: 'Visit us', value: 'siteSettings.address (formatted)', action: 'google-maps-link' },
        { icon: 'Clock', label: 'Hours', value: 'business-specific', action: null },
      ],
      socialLinks: true,
    },
  },

  cro: {
    primaryCTA: { text: 'the form IS the CTA', link: null, phone: 'prominent next to form' },
    ctaFrequency: 0,
    trustSignalPositions: ['trust-reinforcement'],
    aboveFoldRequirements: [
      'Page title with reassurance text',
      'Contact form visible (at least first 2 fields)',
      'Phone number visible and clickable',
      'Business hours or response time visible',
    ],
  },

  seo: {
    schemaTypes: ['ContactPage', 'LocalBusiness', 'BreadcrumbList'],
    headingHierarchy: 'h1 page title → h2 form heading → h2 contact details heading',
    internalLinkingRules: [
      'Link to location pages from map section',
      'Breadcrumbs: Home > Contact',
    ],
    metaTitlePattern: 'Contact Us | {BusinessName}',
    metaDescPattern: 'Contact {BusinessName} in {Location}. Call {Phone} or send us a message. {ResponseTimePromise}.',
  },

  rhythm: {
    sectionSpacing: 'default',
    backgroundAlternation: true,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- **Form + contact details side-by-side** — visitors see both options simultaneously. Phone callers call immediately; form submitters submit
- **Entity-interest field is dynamic** — select dropdown populated from the primary entity collection, feeding data into the CRM pipeline
- **Response guarantee reduces abandonment** — explicitly stating response time is a proven conversion technique
- **Inline success state** — no redirect to "thank you" page. Form replaced with success message in-place
- **No additional CTAs** — the page IS the conversion endpoint

---

## 15. About Page Blueprint

> **Note**: `about.astro` does not exist in the current codebase. This page is generated by the AI generation engine as part of route generation (companion spec Step 4).

```typescript
const aboutBlueprint: PageBlueprint = {
  pageType: 'about',
  purpose: 'Build brand story, establish credibility, create emotional connection. Supports E-E-A-T.',

  sections: [
    {
      name: 'hero',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'hero', priority: 'preferred' }],
      purpose: 'h1 "About {BusinessName}". Mission statement. Team photo or brand image.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-in',
    },
    {
      name: 'origin-story',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'How the business started, why it exists, what problem it solves. Image + text side-by-side. Emotional hook.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'mission-values',
      required: true,
      position: 'flexible',
      blocks: [
        { blockType: 'serviceDetail', priority: 'preferred' },
        { blockType: 'stats', priority: 'alternative' },
      ],
      purpose: '3-4 core values with icons. "Quality Craftsmanship", "Customer First", "Transparent Pricing".',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'by-the-numbers',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'stats', priority: 'preferred' }],
      purpose: 'Key stats — years in business, projects completed, team size, customer satisfaction.',
      background: 'default',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'team-preview',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'team', priority: 'preferred' }],
      purpose: 'Show 4-6 key team members with "Meet the full team" link. Uses TeamMembers collection.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'social-proof',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'testimonials', priority: 'preferred' }],
      purpose: 'Featured testimonials — 3 high-rated reviews. Reinforces everything said above.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'community',
      required: false,
      position: 'flexible',
      blocks: [
        { blockType: 'gallery', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Community involvement, sponsorships, charity work. Photo gallery. Builds local trust.',
      background: 'muted',
      width: 'full-bleed',
      animation: 'stagger',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Ready to work with us?" — now that they know the story, push toward conversion.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  cro: {
    primaryCTA: { text: 'relationship-focused', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['mission-values', 'by-the-numbers', 'social-proof'],
    aboveFoldRequirements: [
      'Business name in h1',
      'Mission statement or tagline',
      'Professional brand or team photo',
    ],
  },

  seo: {
    schemaTypes: ['Organization', 'BreadcrumbList'],
    headingHierarchy: 'h1 "About {BusinessName}" → h2 per section',
    internalLinkingRules: [
      'Link to team page from team preview section',
      'Link to entity pages where relevant in origin story',
      'Link to contact from CTA',
      'Breadcrumbs: Home > About',
    ],
    metaTitlePattern: 'About Us | {BusinessName}',
    metaDescPattern: '{OriginStoryFirstSentence}. Serving {Location} for {YearsInBusiness} years.',
  },

  rhythm: {
    sectionSpacing: 'spacious',
    backgroundAlternation: true,
    visualBreaks: [3],
  },
}
```

**Design rationale:**

- Only **final CTA** — the about page is storytelling, not selling
- **Three trust signal positions** (values, stats, testimonials) — the page IS trust-building
- Spacious rhythm — premium feel, generous whitespace

---

## 16. Landing Page Blueprint

Landing pages have **no navigation and no distractions**. They exist for paid traffic where every visitor has a cost and every bounce is money lost.

```typescript
const landingPageBlueprint: PageBlueprint = {
  pageType: 'landing-page',
  purpose: 'Single-purpose conversion page for paid traffic. No navigation, no exit except converting.',

  sections: [
    {
      name: 'hero-with-form',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'hero', priority: 'preferred' }],
      purpose: 'Split layout — value proposition left, inline form right. h1 matches the ad headline. Phone number prominent.',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-in',
    },
    {
      name: 'trust-bar',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'stats', priority: 'preferred' }],
      purpose: 'Instant credibility strip — rating, review count, years, certifications.',
      background: 'muted',
      width: 'contained',
      animation: 'fade-up',
    },
    {
      name: 'problem-agitation',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'content', priority: 'preferred' }],
      purpose: 'Describe the problem. Agitate — what happens if they don\'t act? Creates urgency.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'solution',
      required: true,
      position: 'fixed',
      blocks: [
        { blockType: 'serviceDetail', priority: 'preferred' },
        { blockType: 'content', priority: 'alternative' },
      ],
      purpose: 'Present the offering as the solution. 3-4 key benefits with icons.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'mid-page-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Repeat the form or CTA. Visitors who scrolled past hero are more qualified.',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
    {
      name: 'social-proof',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'testimonials', priority: 'preferred' }],
      purpose: '3 high-impact testimonials. Real names, specific results.',
      background: 'default',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'process',
      required: false,
      position: 'flexible',
      blocks: [{ blockType: 'stats', priority: 'preferred' }],
      purpose: '"How it works" in 3 steps. Reduces anxiety. "1. Call → 2. We assess → 3. Problem solved."',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'objection-handler',
      required: true,
      position: 'flexible',
      blocks: [{ blockType: 'faq', priority: 'preferred' }],
      purpose: '4-5 objection-focused FAQs. "Is this expensive?", "How long?", "Are you licensed?" Addresses reasons NOT to convert.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'final-cta',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: 'Final conversion push with urgency. "Limited availability" or "Same-day service."',
      background: 'dark',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  landing: {
    navigation: {
      showHeader: false,
      showFooter: false,
      showBreadcrumbs: false,
    },
    form: {
      position: 'hero-inline',
      sticky: true,
      fields: ['name', 'phone', 'email'],
      submitText: 'Get My Free Quote',
    },
    phoneNumber: {
      prominent: true,
      sticky: true,
      trackingNumber: true,
    },
    urgency: {
      enabled: true,
      style: 'banner',
    },
  },

  cro: {
    primaryCTA: { text: 'action-oriented first-person', link: null, phone: 'tracking number' },
    ctaFrequency: 3,
    trustSignalPositions: ['trust-bar', 'social-proof'],
    aboveFoldRequirements: [
      'Headline matching ad copy',
      'Complete form visible (all fields + submit button)',
      'Phone number visible and clickable',
      'One trust signal (rating or certification)',
    ],
  },

  seo: {
    schemaTypes: ['WebPage', 'LocalBusiness'],
    headingHierarchy: 'h1 = ad headline match → h2 per section',
    internalLinkingRules: [],
    metaTitlePattern: '{AdHeadline} | {BusinessName}',
    metaDescPattern: '{ValueProp}. Call {Phone}. {UrgencyStatement}.',
    noindex: true,
  },

  rhythm: {
    sectionSpacing: 'compact',
    backgroundAlternation: true,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- **No header, no footer, no navigation** — every non-CTA link is an exit. The `landing.navigation` config tells the generator to skip SiteHeader/SiteFooter
- **noindex** — landing pages duplicate entity page content and exist solely for paid traffic
- **Sticky form** — floats in sidebar on desktop, sticky phone bar on mobile. Conversion action always visible
- **Objection-handler FAQs** — specifically address reasons NOT to convert, not informational queries
- **Problem-agitation-solution flow** — classic copywriting framework that consistently outperforms feature-list layouts
- **3 CTAs** — aggressive frequency for paid traffic

---

## 17. 404 Page Blueprint

**Template variable resolution**: The blueprint uses placeholder values like `'primary-entity'` and `'{EntityPluralName}'`. The `generate_page` tool resolves these during generation by substituting values from the BusinessModel: `'primary-entity'` becomes the actual primary entity collection slug, and `'{EntityPluralName}'` becomes the entity's plural display name.

```typescript
const notFoundBlueprint: PageBlueprint = {
  pageType: '404',
  purpose: 'Recover lost visitors. Turn a dead end into a navigation opportunity.',

  sections: [
    {
      name: 'error-message',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Friendly error — "We couldn\'t find that page." NOT technical jargon. Brief, human, brand-appropriate tone.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-in',
    },
    {
      name: 'search',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Search bar — "Try searching for what you need." Links to /search results.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'popular-pages',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Top 3-6 entity cards — "Popular {entities}" with card grid. Immediate next step.',
      background: 'muted',
      width: 'contained',
      animation: 'stagger',
    },
    {
      name: 'quick-links',
      required: true,
      position: 'fixed',
      blocks: [],
      purpose: 'Navigation fallback — links to Homepage, all main sections. Simple list.',
      background: 'default',
      width: 'narrow',
      animation: 'fade-up',
    },
    {
      name: 'contact-fallback',
      required: true,
      position: 'fixed',
      blocks: [{ blockType: 'cta', priority: 'preferred' }],
      purpose: '"Can\'t find what you need? Call us." Last resort recovery.',
      background: 'primary',
      width: 'full-bleed',
      animation: 'fade-up',
    },
  ],

  notFound: {
    errorDisplay: {
      heading: 'Page not found',
      subheading: "The page you're looking for doesn't exist or has been moved.",
      illustration: 'optional',
      tone: 'friendly',
    },
    recovery: {
      searchEnabled: true,
      popularEntities: {
        collection: 'primary-entity',
        limit: 6,
        sortBy: 'name',
      },
      quickLinks: [
        { label: 'Home', url: '/' },
        { label: '{EntityPluralName}', url: '/{entities}' },
        { label: 'Blog', url: '/blog' },
        { label: 'Contact', url: '/contact' },
        { label: 'About', url: '/about' },
      ],
    },
  },

  cro: {
    primaryCTA: { text: 'recovery-focused', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: [
      'Error message',
      'Search bar',
      'At least 3 popular entity cards OR quick links visible',
    ],
  },

  seo: {
    schemaTypes: [],
    headingHierarchy: 'h1 "Page not found" → h2 section headings',
    internalLinkingRules: [
      'Link to homepage',
      'Link to primary entity listing',
      'Link to contact page',
    ],
    metaTitlePattern: 'Page Not Found | {BusinessName}',
    metaDescPattern: 'This page could not be found on {BusinessName}. Try searching or browse our {EntityPluralName}.',
    httpStatus: 404,
  },

  rhythm: {
    sectionSpacing: 'compact',
    backgroundAlternation: true,
    visualBreaks: [],
  },
}
```

**Design rationale:**

- **Search is mandatory** — lets visitors self-recover
- **Popular entities, not random pages** — relevant next steps, not a sitemap dump
- **Phone CTA at bottom** — if all else fails, a conversation recovers the lead
- **Friendly tone** — "We couldn't find that page" not "Error 404"
- **HTTP 404 status explicit** — critical for SEO (Google must receive real 404, not soft 404)

---

### 17.1 Breaking Changes from Current Implementation

| Change | Current Value | New Value | Migration |
|--------|-------------|-----------|-----------|
| Content quality score threshold | 50 | 65 | Audit existing ServicePage scores. Pages scoring 50-64 must be enriched before the threshold is raised. Implement as a phased rollout: warn at 50-64 for 2 weeks, then enforce 65. |

---

## 18. Card Component System

Every listing page needs card components. The generator creates one per entity, but all cards follow a consistent design pattern.

### Base Card Structure

```html
<article class="group relative border rounded-xl overflow-hidden bg-background
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
  <!-- Image -->
  <div class="relative aspect-[4/3] overflow-hidden">
    <PayloadImage
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      size="card"
      loading="lazy"
    />
    {badge && (
      <span class="absolute top-3 left-3 px-2 py-1 text-xs font-medium uppercase tracking-wider
                    bg-primary text-primary-foreground rounded-md">
        {badge}
      </span>
    )}
  </div>

  <!-- Content -->
  <div class="p-5">
    {subtitle && (
      <span class="text-xs font-medium uppercase tracking-wider text-primary mb-1 block">
        {subtitle}
      </span>
    )}
    <h3 class="text-lg font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
      <a href={link} class="after:absolute after:inset-0">
        {title}
      </a>
    </h3>
    {description && (
      <p class="mt-2 text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>
    )}
    {meta && (
      <div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {meta}
      </div>
    )}
  </div>
</article>
```

### Card Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Image aspect ratio | 4:3 | Taller than 16:9 — shows more of the subject matter |
| Border radius | `rounded-xl` | Softer than `rounded-lg` — feels more modern |
| Hover effect | Shadow + translate-y -1px + image scale 1.05 | Three subtle effects compound into premium feel |
| Title click area | `after:absolute after:inset-0` | Entire card is clickable, not just the title text |
| Text truncation | `line-clamp-2` on title, `line-clamp-2` on description | Consistent card heights in grids |
| Badge position | Top-left over image | Visible but doesn't block the subject |
| Spacing | `p-5` | Slightly less than current `p-6` — tighter but not cramped |
| Transition duration | `duration-300` (card), `duration-500` (image) | Image zooms slower for subtlety |

### Card Variants

| Variant | Layout | Use Case |
|---------|--------|----------|
| **Standard vertical** | Image top, content bottom | Entity cards in listing grids |
| **Horizontal** | Image left (40%), content right (60%) | Featured blog post, leadership team |
| **Minimal** | No image, text only | Related links, quick link lists |
| **Featured** | Larger, spans 2 columns | Pinned/featured items at top of listings |

### Card Generation from Blueprint Config

The `listing.cardFields` config in each blueprint drives card component generation. The `generate_page` tool reads this config and produces a typed Astro component:

| Blueprint Field | Maps To | Card Element |
|----------------|---------|-------------|
| `cardFields.image` | `item.{fieldName}` → PayloadImage | Card image (aspect-ratio 4:3, `card` size) |
| `cardFields.title` | `item.{fieldName}` | h3 heading with link |
| `cardFields.subtitle` | `item.{fieldName}` | Category badge above title |
| `cardFields.description` | `item.{fieldName}` | Truncated text (`line-clamp-2`) |
| `cardFields.link` | `item.{fieldName}` → `/{urlPrefix}/{slug}` | Full-card click target |
| `cardFields.meta` | `item.{fieldNames[]}` | Small metadata row below description |
| `cardFields.author` | `item.{fieldPath}` | Author byline (blog cards only) |

Example: A blueprint with `cardFields: { image: 'featuredImage', title: 'name', subtitle: 'category', description: 'shortDescription', link: 'slug' }` generates a component that renders `item.featuredImage` as a PayloadImage, `item.name` as the h3 title linked to `/{urlPrefix}/${item.slug}`, `item.category` as a badge, and `item.shortDescription` truncated to 2 lines.

---

## 19. Current Design Baseline & Gaps

### Current State (from codebase analysis)

| Pattern | Current Implementation | Quality |
|---------|----------------------|---------|
| Section spacing | `py-16` (64px) uniform | Basic — no variation |
| Section backgrounds | Only `bg-muted/50` on testimonials | Minimal |
| Card hover | `hover:shadow-lg transition-shadow` | Basic — shadow only |
| Typography | `text-3xl`/`text-4xl` — no scale | Inconsistent |
| Animation | None | Missing entirely |
| Grid responsive | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Functional |
| Blog pagination | Client-side hidden class toggles | Clunky |
| Heading hierarchy | `baseHeadingLevel` prop cascades | Good |
| Image optimization | PayloadImage with 9 sizes, srcset | Good |
| Color system | OKLCh with light/dark mode | Good |

### Gaps to Address

| Gap | Impact | Blueprint Solution |
|-----|--------|-------------------|
| No animation framework | Sites feel static and template-like | `AnimatedSection.astro` with IntersectionObserver |
| No section rhythm | "Stacked boxes" appearance | `rhythm.backgroundAlternation` + `rhythm.sectionSpacing` |
| No visual breaks | Monotonous scrolling experience | `rhythm.visualBreaks` with gradient dividers |
| Basic card design | Cards don't feel premium | New base card with hover transform + image zoom |
| No filter bar on listings | Users can't find what they need | `listing.filterBar` with pill-style category filters |
| No featured items | All content treated equally | `listing.featuredPost` for blog, leadership for team |
| No sticky CTA | Conversion action scrolls away | `landing.form.sticky` + phone bar on mobile |
| No table of contents | Long articles hard to navigate | `blog.tableOfContents` auto-generated from headings |
| No social sharing | Content doesn't spread | `blog.socialSharing` with sticky sidebar |
| No search on FAQ | Users scroll through all FAQs | `faq.search` with client-side filter |
| No empty states | Filtered results show blank | `listing.emptyState` with helpful message + CTA |
| No response guarantee | Form submissions feel uncertain | `contact.responseGuarantee` section |

### New Components Required

| Component | Purpose | Blueprint Reference | Implementation Phase |
|-----------|---------|-------------------|---------------------|
| `AnimatedSection.astro` | Scroll-triggered animation wrapper | All blueprints, `animation` field | Phase 1 |
| `FilterBar.astro` | Category filter pills for listing pages | §8, §11 `listing.filterBar` | Phase 1 |
| `Pagination.astro` | Load-more / numbered pagination | §8, §11 `listing.pagination` | Phase 1 |
| `FeaturedPostCard.astro` | Large horizontal blog card | §11 `listing.featuredPost` | Phase 1 |
| `AuthorBio.astro` | Author card with photo, bio, link | §10 `blog.authorBio` | Phase 1 |
| `TableOfContents.astro` | Auto-generated from headings | §10 `blog.tableOfContents` | Phase 1 |
| `SocialShare.astro` | Sticky sidebar social sharing | §10 `blog.socialSharing` | Phase 1 |
| `FAQSearch.astro` | Client-side FAQ filter | §13 `faq.search` | Phase 1 |
| `PayloadForm.tsx` | Form + contact details React island | §14 `contact.form` | Phase 1 |
| `StickyPhoneBar.astro` | Mobile sticky phone CTA | §16 `landing.phoneNumber` | Phase 1 |
| `EmptyState.astro` | Zero-results message with CTA | §8, §11 `listing.emptyState` | Phase 1 |

---

### Block Reclassification

The `serviceDetail` block should be reclassified as **universal** during Layer 1 extraction. Its functionality (heading + richText content + features array with icons + layout options) is not inherently service-specific — it's a general-purpose feature/detail list used across Homepage, Entity Detail, Cross-Product, About, and Landing Page blueprints. Consider renaming to `detailList` or `featureGrid` to remove the service-area naming bias.

Similarly, the `locationMap` block remains **business-specific** (only relevant for businesses with physical locations) and should stay in the service-area reference.

---

## 20. Implementation Order & Dependencies

### Relationship to Platform Spec

This document is a **companion** to `docs/specs/2026-04-13-universal-generation-platform-spec.md`. The platform spec defines the generation engine (pipeline, MCP tools, data schemas). This document defines **what the engine produces** (page structures, block sequences, CRO/SEO rules).

The blueprints are consumed at two points in the platform spec's generation pipeline:
- **Step 4 (Generate Routes)**: The `generate_page` tool reads the blueprint to determine page structure, block rendering order, and section styling
- **Step 8 (Seed Content)**: The `seed_collection` tool reads the blueprint to populate each entry's `layout` array with the correct block sequence

### Implementation Phase Mapping

| Platform Spec Phase | Blueprint Work Required |
|---------------------|------------------------|
| **Phase 1: Layer 1 Extraction** | Build 11 universal components (§19): AnimatedSection, FilterBar, Pagination, FeaturedPostCard, AuthorBio, TableOfContents, SocialShare, FAQSearch, PayloadForm, StickyPhoneBar, EmptyState. Refactor BlockRenderer for section wrappers (§4). Implement animation system (§5). |
| **Phase 2: Generation Engine Core** | Implement PageBlueprint registry (`blueprint-registry.ts`). Wire blueprints into `generate_page` and `seed_collection` tools. Implement card generation from `listing.cardFields` config (§18). |
| **Phase 3: Integration Generation** | Verify seeded layout arrays match blueprint section sequences. Test CRO rules (CTA placement, trust signal positions). Test SEO rules (schema types, heading hierarchy). |
| **Phase 4: Validation & Polish** | Validate all 12 page types render correctly across 3+ business types. Verify visual rhythm (background alternation, spacing, animations). Screenshot comparison. |

### Blueprint Dependency Graph

```text
Tier 1 — No dependencies (build first):
  ├── Homepage (§6) — standalone, references no other page types
  ├── Contact (§14) — standalone
  ├── About (§15) — standalone
  └── 404 (§17) — standalone

Tier 2 — Depend on Tier 1:
  ├── Entity Detail (§7) — homepage links to detail pages
  ├── FAQ (§13) — references entity relationships
  └── Team (§12) — standalone but enables blog author bios

Tier 3 — Depend on Tier 2:
  ├── Entity Listing (§8) — each card links to an entity detail page
  ├── Blog Post (§10) — requires Team (for author bio), Entity Detail (for related links)
  └── Cross-Product (§9) — requires Entity Detail + Location pages

Tier 4 — Depend on Tier 3:
  ├── Blog Index (§11) — requires Blog Post pages to exist
  └── Landing Page (§16) — requires entity data for CTAs and social proof
```

### Block Implementation Order

Blocks should be available in this order (some are dependencies for multiple blueprints):

1. **Core blocks** (needed by all pages): `hero`, `content`, `cta`
2. **Social proof blocks** (needed by 8+ pages): `testimonials`, `stats`, `faq`
3. **Media blocks** (needed by 6+ pages): `gallery`, `relatedLinks`
4. **Specialized blocks** (needed by 3-4 pages): `pricing`, `team`, `serviceDetail` (universal), `locationMap` (business-specific)

### Card Component Generation Order

Card components are generated per entity. Implement the base card system (§18) first, then generate variants:

1. **Base card structure** (§18) — shared HTML/CSS pattern with image, title, subtitle, description, hover effects
2. **Entity cards** — generated from `listing.cardFields` during `generate_page` (one per entity collection)
3. **Blog card** — generated from blog listing's `listing.cardFields` + `meta` fields (date, read time)
4. **Featured post card** — large horizontal variant for blog index (§11 `listing.featuredPost`)

### Minimal Viable Generation (MVP)

To validate the generation engine with the fewest blueprints, implement in this order:

1. **Homepage** (§6) — proves block composition, CRO placement, visual rhythm
2. **Entity Detail** (§7) — proves collection-driven pages, contextual CTAs, FAQ schema
3. **Entity Listing** (§8) — proves card generation, filter bar, pagination
4. **Contact** (§14) — proves form integration, conversion endpoint
5. **404** (§17) — proves error recovery, entity card reuse

These 5 blueprints cover all core patterns. Remaining 7 blueprints add depth but follow established patterns.

*End of specification. This document defines the page composition rules the AI generation engine follows when producing any website. It is a companion to the Universal Generation Platform spec.*
