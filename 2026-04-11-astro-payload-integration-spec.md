# Astro + Payload CMS Integration Specification

> **Date**: 2026-04-11
> **Status**: Approved for implementation
> **Author**: Specification derived from interactive brainstorming session with project owner

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Architecture Overview](#3-architecture-overview)
4. [Payload CMS Changes](#4-payload-cms-changes)
5. [Shared Data Layer](#5-shared-data-layer-packagessharedpayload)
6. [Astro Site Changes](#6-astro-site-changes)
7. [SEO Implementation](#7-seo-implementation)
8. [Rebuild and Deploy Pipeline](#8-rebuild-and-deploy-pipeline)
9. [Environment Variables](#9-environment-variables)
10. [Error Handling and Edge Cases](#10-error-handling-and-edge-cases)
11. [Localization](#11-localization)
12. [CI/CD Updates](#12-cicd-updates)
13. [Project Setup Changes](#13-project-setup-changes)
14. [Testing and Verification](#14-testing-and-verification)
15. [Implementation Checklist](#15-implementation-checklist)
16. [Reference](#16-reference)

---

## 1. Executive Summary

### What This Integration Is

This specification defines how to connect the Astro marketing site (`templates/astro-site/`) to Payload CMS (running inside `templates/next-app/`) so that agency clients can manage all content -- services, locations, blog posts, FAQs, testimonials, team members -- through the Payload admin panel at `/admin`, and have those changes rendered as static HTML pages by Astro for maximum SEO performance and fastest possible page loads.

### Why It Matters

The Agency Web Stack currently has two disconnected templates: an Astro site with a single static `index.astro` page and 16 shadcn/ui components, and a Next.js app hosting Payload CMS with 4 collections (Users, Pages, Media, Contacts). There is no data flow between them. Clients cannot manage marketing content through the CMS, and the Astro site cannot render dynamic pages.

This integration bridges that gap, enabling:
- **Content management**: Clients manage all marketing content in Payload's admin panel
- **Programmatic SEO at scale**: Service x Location cross-product pages (100k+) generated from structured CMS data
- **Static-first performance**: Astro renders pages as static HTML at build time -- zero JavaScript by default, sub-second page loads, perfect Core Web Vitals
- **Preview workflow**: Editors see draft changes in real-time via Payload's Live Preview pointed at Astro
- **Multi-host deployment**: Same integration works on Vercel, Cloudflare, self-hosted VPS, or Hostinger -- adapter swap is one config line

### The Three-Layer Architecture

```
Layer 1: DATA (Payload CMS Collections in Next.js)
  -- Services, Locations, ServicePages, BlogPosts, FAQs, Testimonials, TeamMembers
  -- Stored in Supabase Postgres via Payload's postgres adapter
  -- Managed through the admin panel at /admin
  -- Populated via MCP tools (Claude), CSV import, or manual entry

Layer 2: TEMPLATES (Payload Blocks + Astro/React Components)
  -- 12 block definitions in Payload (Hero, ServiceDetail, FAQ, etc.)
  -- Corresponding Astro/React components render each block type
  -- Clients stack blocks to compose page layouts in the admin panel

Layer 3: ROUTES (Astro Dynamic Pages)
  -- /services/[slug] -> fetches service data, renders with template
  -- /locations/[city] -> fetches location data, renders with template
  -- /services/[service]/[city] -> fetches cross-product data, renders with template
  -- /blog/[slug] -> fetches blog post, renders with template
  -- Static generation at build time (SSG) for all published pages
  -- SSR for preview and search routes only
```

### Design Decisions and Rationale

1. **Shared data layer in `packages/shared`** (not Astro-only, not a separate integration package). Rationale: The monorepo already has `@template/shared` exporting Supabase, PostHog, Resend, and Sentry clients via a factory function pattern with named exports. Adding a Payload client follows the identical pattern. Both templates can import from `@template/shared/payload`. This avoids duplicating fetch logic and keeps the single-source-of-truth principle intact.

2. **Client usage model: all three modes** (Astro-only, Next.js-only, or both). The shared data layer and Astro routes are optional features -- a client using only Next.js ignores the Astro template; a client using only Astro still needs Payload running in Next.js for the CMS API. The Payload collections and blocks exist regardless; the Astro integration is additive.

3. **Hybrid output mode** for Astro (most pages SSG, some SSR). Marketing pages change infrequently -- static HTML = fastest load times, best CWV, cheapest hosting. Preview and search routes need SSR. Astro's `output: 'hybrid'` is first-class, not a hack.

4. **Host-agnostic deployment**. The integration supports Vercel, Cloudflare Pages, self-hosted VPS (Docker), and Hostinger VPS. The only host-specific code is the Astro adapter import in `astro.config.mjs` -- one line to swap.

5. **Three rebuild trigger modes**, configurable per client: auto (webhook), manual (admin button/CLI), auto-with-review (auto for published edits, queued for bulk operations). Not every client wants auto-deploy.

6. **Generic wrapper + typed collection helpers** for the data layer. Generic `fetchPayload()` handles any collection for custom schemas. Typed helpers like `getServicePages()` provide autocomplete and validation for the 7 standard pSEO collections. Agency clients vary; generic covers custom, typed covers standard.

7. **Service-first URL structure** by default (`/services/plumbing/austin-tx`), configurable per client to location-first. Project-level config, not runtime toggle. Rationale: Most service-area businesses think service-first; location-first is an option for geo-dominant businesses.

8. **Preview system**: Payload's built-in Live Preview (admin panel iframe, postMessage API, device breakpoints). One Astro SSR preview route (~50-80 lines) receives the preview data.

9. **Hybrid navigation**: Structure in Astro (static links), dynamic content from Payload (services dropdown items, footer locations). Header nav fetches services at build time for the dropdown. Footer fetches contact info and locations from SiteSettings global.

10. **Optional localization**: Payload already has `en/es/fr` configured. Astro localization is opt-in per client via URL prefixing (`/es/services/plumbing`). Not active by default.

---

## 2. Current State Audit

### 2.1 Payload CMS (in `templates/next-app/`)

**Location**: `templates/next-app/src/`

**Existing Collections** (4):

| Collection | Slug | File | Key Fields | Access |
|------------|------|------|------------|--------|
| Users | `users` | `src/collections/Users.ts` | email, name, role (admin/editor/viewer) | `isAdminOrSelf` read, `isAdmin` create/delete |
| Pages | `pages` | `src/collections/Pages.ts` | title, slug, excerpt, featuredImage, content (richText) | `publishedOrLoggedIn` read, `isAdminOrEditor` write |
| Media | `media` | `src/collections/Media.ts` | alt (localized) | Public read, `isAdminOrEditor` write |
| Contacts | `contacts` | `src/collections/Contacts.ts` | twentyId, email, firstName, lastName, company, engagementScore | Conditional -- only loaded if `TWENTY_API_URL` is set |

**Collection index** (`src/collections/index.ts`):
```typescript
export { Contacts } from './Contacts'
export { Pages } from './Pages'
export { Media } from './Media'
export { Users } from './Users'
```

**Existing Access Control** (`src/access/`):
- `isAdmin.ts` -- `user?.role === 'admin'`
- `isAdminOrEditor.ts` -- `user?.role === 'admin' || user?.role === 'editor'`
- `isAdminOrSelf.ts` -- admin or own user doc
- `publishedOrLoggedIn.ts` -- if user, return true; else `{ _status: { equals: 'published' } }`

**Existing Plugins** (`src/plugins/index.ts`):
- `nestedDocsPlugin` -- collections: `['pages']`
- `seoPlugin` -- collections: `['pages']`, with ogTitle, robots, jsonLd custom fields
- `redirectsPlugin` -- collections: `['pages']`
- `searchPlugin` -- collections: `['pages']`
- `formBuilderPlugin` -- all 12 field types, Stripe payment handling, email templates
- `importExportPlugin` -- collections: `['pages', 'media']`
- `s3Storage` (conditional on `S3_BUCKET`)
- `vercelBlobStorage` (conditional on `BLOB_READ_WRITE_TOKEN`)
- `stripePlugin` (conditional on `STRIPE_SECRET_KEY`)
- `twentyCrmPlugin` (conditional on `TWENTY_API_URL`)
- `mcpPlugin` -- 61 custom tools, 8 prompts
- `payloadAiPlugin` (conditional on AI provider keys)
- `sentryPlugin` (conditional on `SENTRY_DSN`)

**Live Preview** -- currently configured for `['pages']` collection only, pointing at `NEXT_PUBLIC_SERVER_URL`.

**Localization** -- enabled: `en`, `es`, `fr` with fallback.

**Editor** -- Lexical rich text editor.

**Database** -- `postgresAdapter` pointing at `DATABASE_URL` (Supabase Postgres).

**Payload config** (`src/payload.config.ts`): 90 lines, imports collections from `./collections`, plugins from `./plugins`.

### 2.2 Astro Site (in `templates/astro-site/`)

**Location**: `templates/astro-site/src/`

**Current state**: Minimal scaffold.

- **Pages**: Single `src/pages/index.astro` with an "Astro Site" heading
- **Layouts**: Single `src/layouts/Layout.astro` with basic HTML shell (title, description props, no OG/schema)
- **Components**: 16 shadcn/ui components in `src/components/ui/` (avatar, badge, button, card, dialog, dropdown-menu, field, form, input, label, navigation-menu, separator, sheet, sonner, table, tabs)
- **Styles**: `src/styles/global.css` (Tailwind v4 import)
- **Data fetching**: None
- **Dynamic routes**: None
- **Output mode**: Static (default -- no `output` set in config)
- **Adapters**: None configured

**Astro config** (`astro.config.mjs`):
```javascript
export default defineConfig({
  server: { port: 4400 },
  vite: { plugins: [tailwindcss()] },
  integrations: [react(), sentry({ ... })],
});
```

**Package name**: `@template/astro-site`

**Dependencies**: Astro 6.1.4, React 19, Tailwind CSS v4, shadcn/ui, Sentry, Motion, Lucide icons, Zod, react-hook-form.

### 2.3 Shared Package (`packages/shared/`)

**Package name**: `@template/shared` (NOT `@capabilities/shared` -- the CLAUDE.md references an older name)

**Export map** (`package.json`):
```json
{
  "./supabase": "./src/supabase/client.ts",
  "./posthog": "./src/posthog/init.ts",
  "./resend": "./src/resend/client.ts",
  "./types": "./src/types/index.ts"
}
```

**Pattern**: Factory functions that accept config parameters (URLs, keys) and return initialized clients. No environment variable access inside the shared package -- callers pass config from their own env.

**Supabase client** (`src/supabase/client.ts`): Exports `createSupabaseBrowserClient()`, `createSupabaseServerClient()`, `createSupabaseServiceClient()` -- each takes explicit URL and key parameters.

### 2.4 MCP Tools

The MCP config (`src/mcp/index.ts`) defines 61 custom tools with collection permissions for collections that **do not yet exist**: `services`, `locations`, `service-pages`, `blog-posts`, `faqs`, `testimonials`, `team-members`. These will be satisfied by the new collections defined in this spec.

### 2.5 SEO Playbook

**Location**: `website-seo-playbook/` (17 documents, ~34,184 lines)

The playbook is the authoritative reference for all SEO rules. Key documents:
- `PROGRAMMATIC_SEO_BLUEPRINT.md` -- master architecture and strategy
- `CMS_COLLECTIONS_AND_BLOCKS.md` -- all collection and block definitions
- `ROUTING_AND_SITEMAPS.md` -- Astro routes, sitemap generation, Schema.org generators
- `URL_STRUCTURE_RULES.md` -- URL patterns, slugification, depth rules
- `IMAGE_SEO_STRATEGY.md` -- naming, formats, alt text, sizing, compression
- `PAGE_EXPERIENCE_SIGNALS.md` -- Core Web Vitals thresholds, performance budgets
- `CANONICAL_TAGS_STRATEGY.md` -- canonical tags at scale
- `CONTENT_FRESHNESS_STRATEGY.md` -- preventing stale pages

---

## 3. Architecture Overview

### 3.1 Data Flow

```
Claude Code / MCP Tools
        |
        v
Payload CMS REST API (POST /api/services, etc.)
        |
        v
Supabase Postgres (via Payload's postgresAdapter)
        |
        v (on content change)
Payload afterChange hook --> Webhook (debounced)
        |
        v
Rebuild trigger (Vercel deploy hook / CF Pages hook / VPS listener)
        |
        v
Astro Build Process
  - Fetches from Payload REST API (GET /api/services?where[_status][equals]=published)
  - Generates static HTML for all published pages
  - Outputs to dist/
        |
        v
CDN / Web Server serves static HTML
```

### 3.2 Monorepo Structure With New Files

Files marked `(NEW)` must be created. Files marked `(MODIFY)` already exist.

```
capabilities/
├── templates/
│   ├── astro-site/
│   │   ├── astro.config.mjs                          (MODIFY)
│   │   ├── package.json                               (MODIFY)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/                                (EXISTING - 16 shadcn components)
│   │       │   ├── blocks/                            (NEW)
│   │       │   │   ├── BlockRenderer.astro              (NEW)
│   │       │   │   ├── HeroBlock.astro                 (NEW)
│   │       │   │   ├── ServiceDetailBlock.astro        (NEW)
│   │       │   │   ├── FAQBlock.astro                  (NEW)
│   │       │   │   ├── TestimonialsBlock.astro         (NEW)
│   │       │   │   ├── CTABlock.astro                  (NEW)
│   │       │   │   ├── LocationMapBlock.astro          (NEW)
│   │       │   │   ├── ContentBlock.astro              (NEW)
│   │       │   │   ├── StatsBlock.astro                (NEW)
│   │       │   │   ├── GalleryBlock.astro              (NEW)
│   │       │   │   ├── PricingBlock.astro              (NEW)
│   │       │   │   ├── TeamBlock.astro                 (NEW)
│   │       │   │   └── RelatedLinksBlock.astro         (NEW)
│   │       │   ├── SiteHeader.astro                    (NEW)
│   │       │   ├── SiteFooter.astro                    (NEW)
│   │       │   ├── PayloadImage.astro                  (NEW)
│   │       │   ├── RichText.astro                      (NEW)
│   │       │   ├── Breadcrumbs.astro                   (NEW)
│   │       │   ├── TestimonialCard.astro               (NEW)
│   │       │   ├── TeamMemberCard.astro                (NEW)
│   │       │   ├── ServiceCard.astro                   (NEW)
│   │       │   └── LocationCard.astro                  (NEW)
│   │       ├── layouts/
│   │       │   ├── Layout.astro                        (EXISTING)
│   │       │   └── SEOLayout.astro                     (NEW)
│   │       ├── lib/
│   │       │   ├── utils.ts                            (EXISTING)
│   │       │   └── seo.ts                              (NEW)
│   │       ├── pages/
│   │       │   ├── index.astro                         (MODIFY)
│   │       │   ├── services/
│   │       │   │   ├── index.astro                     (NEW)
│   │       │   │   ├── [slug].astro                    (NEW)
│   │       │   │   └── [service]/
│   │       │   │       └── [city].astro                (NEW)
│   │       │   ├── locations/
│   │       │   │   ├── index.astro                     (NEW)
│   │       │   │   └── [city].astro                    (NEW)
│   │       │   ├── blog/
│   │       │   │   ├── index.astro                     (NEW)
│   │       │   │   └── [slug].astro                    (NEW)
│   │       │   ├── team.astro                          (NEW)
│   │       │   ├── faq.astro                           (NEW)
│   │       │   ├── contact.astro                        (NEW)
│   │       │   ├── privacy.astro                       (NEW)
│   │       │   ├── terms.astro                         (NEW)
│   │       │   ├── 404.astro                           (NEW)
│   │       │   ├── preview.astro                       (NEW - SSR only)
│   │       │   ├── search.astro                        (NEW - SSR only)
│   │       │   ├── sitemap.xml.ts                      (NEW)
│   │       │   ├── sitemap-index.xml.ts                (NEW)
│   │       │   └── robots.txt.ts                       (NEW)
│   │       └── styles/
│   │           └── global.css                          (EXISTING)
│   │
│   └── next-app/
│       └── src/
│           ├── payload.config.ts                       (MODIFY)
│           ├── collections/
│           │   ├── index.ts                            (MODIFY)
│           │   ├── Users.ts                            (EXISTING)
│           │   ├── Pages.ts                            (EXISTING)
│           │   ├── Media.ts                            (MODIFY)
│           │   ├── Contacts.ts                         (EXISTING)
│           │   ├── Services.ts                         (NEW)
│           │   ├── Locations.ts                        (NEW)
│           │   ├── ServicePages.ts                     (NEW)
│           │   ├── BlogPosts.ts                        (NEW)
│           │   ├── FAQs.ts                             (NEW)
│           │   ├── Testimonials.ts                     (NEW)
│           │   └── TeamMembers.ts                      (NEW)
│           ├── blocks/                                 (NEW directory)
│           │   ├── index.ts                            (NEW)
│           │   ├── Hero.ts                             (NEW)
│           │   ├── ServiceDetail.ts                    (NEW)
│           │   ├── FAQ.ts                              (NEW)
│           │   ├── Testimonials.ts                     (NEW)
│           │   ├── CTA.ts                              (NEW)
│           │   ├── LocationMap.ts                      (NEW)
│           │   ├── Content.ts                          (NEW)
│           │   ├── Stats.ts                            (NEW)
│           │   ├── Gallery.ts                          (NEW)
│           │   ├── Pricing.ts                          (NEW)
│           │   ├── Team.ts                             (NEW)
│           │   └── RelatedLinks.ts                     (NEW)
│           ├── globals/                                (NEW directory)
│           │   └── SiteSettings.ts                     (NEW)
│           ├── hooks/                                  (NEW directory)
│           │   ├── auto-generate-slug.ts               (NEW)
│           │   ├── auto-generate-service-page-slug.ts  (NEW)
│           │   └── trigger-rebuild.ts                   (NEW)
│           ├── plugins/
│           │   ├── index.ts                            (MODIFY)
│           │   └── twenty-crm.ts                       (EXISTING)
│           ├── access/                                 (EXISTING - no changes)
│           ├── webhooks/
│           │   ├── twenty-handler.ts                   (EXISTING)
│           │   ├── resend-handler.ts                   (EXISTING)
│           │   └── rebuild-handler.ts                  (NEW)
│           └── components/                             (NEW -- admin UI)
│               └── DeployButton.tsx                    (NEW)
│
├── packages/
│   └── shared/
│       ├── package.json                                (MODIFY)
│       └── src/
│           ├── payload/                                (NEW directory)
│           │   ├── client.ts                           (NEW)
│           │   └── types.ts                            (NEW)
│           ├── supabase/                               (EXISTING)
│           ├── posthog/                                (EXISTING)
│           ├── resend/                                 (EXISTING)
│           └── types/                                  (EXISTING)
│
├── scripts/
│   ├── create-project.mjs                              (MODIFY)
│   └── init-project.sh                                 (MODIFY)
│
├── .env.template                                       (MODIFY)
├── .github/workflows/validate.yml                      (MODIFY)
└── website-seo-playbook/                               (EXISTING - reference only)
```

---

## 4. Payload CMS Changes

All files in this section are located under `templates/next-app/src/`.

### 4.1 New Collections (7)

#### 4.1.1 Services Collection

**File**: `src/collections/Services.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'
import {
  HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
  CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
  GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
} from '../blocks'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'category', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Service offerings -- each generates a page at /services/[slug]',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
    // NOTE: Add an afterDelete hook that unpublishes related ServicePages when a
    // Service is deleted, to prevent orphaned cross-product pages with broken data.
    // Example:
    //   afterDelete: [async ({ id, req }) => {
    //     await req.payload.update({
    //       collection: 'service-pages',
    //       where: { service: { equals: id } },
    //       data: { _status: 'draft' },
    //     })
    //   }],
  },
  fields: [
    // -- Core Fields --
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Service name displayed as the page title' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-safe identifier -- auto-generated from name',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Emergency', value: 'emergency' },
        { label: 'Maintenance', value: 'maintenance' },
      ],
      admin: { position: 'sidebar' },
    },

    // -- Description and Content --
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      maxLength: 300,
      localized: true,
      admin: { description: 'Brief description for cards, listings, and meta descriptions' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: { description: 'Full service description for the main content area' },
    },

    // -- Media --
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Primary image for this service (used in cards and hero)' },
    },
    {
      name: 'gallery',
      type: 'array',
      admin: { description: 'Additional images for the service gallery' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'icon',
      type: 'text',
      admin: { description: 'Lucide icon name (e.g., "wrench", "zap", "home")' },
    },

    // -- Features and Benefits --
    {
      name: 'features',
      type: 'array',
      admin: { description: 'Key features or selling points' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'icon', type: 'text' },
      ],
    },

    // -- Pricing --
    {
      name: 'pricing',
      type: 'group',
      admin: { description: 'Pricing information (optional)' },
      fields: [
        { name: 'startingAt', type: 'number', admin: { description: 'Starting price in dollars' } },
        { name: 'priceRange', type: 'text', admin: { description: 'e.g., "$150 - $500"' } },
        { name: 'unit', type: 'text', admin: { description: 'e.g., "per visit", "per hour"' } },
        { name: 'showPricing', type: 'checkbox', defaultValue: false },
      ],
    },

    // -- Page Layout (Blocks) --
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      admin: { description: 'Page layout -- add and reorder content sections' },
      blocks: [
        HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
        CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
        GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
      ],
    },

    // -- Relationships --
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Cross-link to related services for internal linking' },
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: { description: 'FAQs specific to this service' },
    },

    // -- SEO Overrides --
    // NOTE: maxLength values match Google's truncation thresholds (60 for title, 160 for description).
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Custom SEO title (overrides auto-generated). Max 60 chars.',
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Custom meta description (overrides auto-generated). Max 160 chars.',
        position: 'sidebar',
      },
    },

    // -- Schema.org Structured Data --
    {
      name: 'schemaType',
      type: 'select',
      defaultValue: 'Service',
      options: [
        { label: 'Service', value: 'Service' },
        { label: 'ProfessionalService', value: 'ProfessionalService' },
        { label: 'HomeAndConstructionBusiness', value: 'HomeAndConstructionBusiness' },
        { label: 'FinancialService', value: 'FinancialService' },
        { label: 'HealthAndBeautyBusiness', value: 'HealthAndBeautyBusiness' },
        { label: 'LegalService', value: 'LegalService' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Schema.org type for structured data (affects rich snippets in Google)',
      },
    },

    // -- Keywords --
    {
      name: 'keywords',
      type: 'group',
      admin: { description: 'Target keywords -- guides content writing and SEO optimization' },
      fields: [
        {
          name: 'primary',
          type: 'text',
          admin: { description: 'The #1 keyword this page must rank for.' },
        },
        {
          name: 'secondary',
          type: 'array',
          fields: [{ name: 'keyword', type: 'text', required: true }],
        },
        {
          name: 'longTail',
          type: 'array',
          fields: [{ name: 'phrase', type: 'text', required: true }],
        },
        {
          name: 'lsiTerms',
          type: 'textarea',
          admin: { description: 'Comma-separated LSI/semantic terms' },
        },
      ],
    },
  ],
}
```

#### 4.1.2 Locations Collection

**File**: `src/collections/Locations.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'city', 'state', 'type', '_status'],
    group: 'Content',
    description: 'Service areas -- cities, neighborhoods, zip codes',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
    beforeValidate: [
      // Prevent circular parentLocation references by walking up the parent chain.
      // Rejects if the current document's ID appears in its own ancestry.
      async ({ data, originalDoc, req }) => {
        if (!data?.parentLocation) return data
        const currentId = originalDoc?.id
        if (!currentId) return data // New document, no cycle possible

        let parentId = typeof data.parentLocation === 'object'
          ? data.parentLocation.id
          : data.parentLocation
        const visited = new Set<string>()

        while (parentId) {
          if (parentId === currentId) {
            throw new Error(
              'Circular parentLocation detected: this location appears in its own ancestry chain. ' +
              'Choose a different parent location.'
            )
          }
          if (visited.has(parentId)) break // Already visited, no cycle involving current doc
          visited.add(parentId)

          const parent = await req.payload.findByID({
            collection: 'locations',
            id: parentId,
            depth: 0,
          })
          parentId = parent?.parentLocation || null
        }
        return data
      },
    ],
    // NOTE: Add an afterDelete hook that unpublishes related ServicePages when a
    // Location is deleted, to prevent orphaned cross-product pages with broken data.
    // Example:
    //   afterDelete: [async ({ id, req }) => {
    //     await req.payload.update({
    //       collection: 'service-pages',
    //       where: { location: { equals: id } },
    //       data: { _status: 'draft' },
    //     })
    //   }],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Display name (e.g., "Austin, TX" or "Downtown Austin")' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'City', value: 'city' },
        { label: 'Neighborhood', value: 'neighborhood' },
        { label: 'County', value: 'county' },
        { label: 'Region', value: 'region' },
        { label: 'Zip Code', value: 'zip' },
        { label: 'State', value: 'state' },
      ],
      admin: { position: 'sidebar' },
    },

    // -- Geographic Data --
    { name: 'city', type: 'text', required: true },
    {
      name: 'state',
      type: 'text',
      required: true,
      admin: { description: 'Full state name (e.g., "Texas")' },
    },
    {
      name: 'stateCode',
      type: 'text',
      required: true,
      maxLength: 2,
      admin: { description: 'Two-letter state code (e.g., "TX")' },
    },
    {
      name: 'zipCodes',
      type: 'text',
      admin: { description: 'Comma-separated zip codes served in this area' },
    },
    {
      name: 'coordinates',
      type: 'point',
      admin: { description: 'Latitude/longitude for map embeds' },
    },
    {
      name: 'population',
      type: 'number',
      admin: { description: 'Population (for content generation and prioritization)' },
    },
    {
      name: 'timezone',
      type: 'text',
      admin: { description: 'e.g., "America/Chicago"' },
    },

    // -- Content --
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: { description: 'About this location -- local information, service area details' },
    },
    {
      name: 'areaInfo',
      type: 'textarea',
      localized: true,
      admin: { description: 'Brief area description for use in cross-product pages' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Representative image of this area' },
    },

    // -- Relationships --
    {
      name: 'parentLocation',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'Parent location (e.g., city is parent of neighborhood)' },
    },
    {
      name: 'nearbyLocations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      admin: { description: 'Nearby areas for cross-linking' },
    },

    // -- SEO Overrides --
    // NOTE: maxLength values match Google's truncation thresholds (60 for title, 160 for description).
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Custom SEO title. Max 60 chars.',
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Custom meta description. Max 160 chars.',
        position: 'sidebar',
      },
    },
  ],
}
```

#### 4.1.3 ServicePages Collection (Cross-Product)

**File**: `src/collections/ServicePages.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateServicePageSlug } from '../hooks/auto-generate-service-page-slug'
import {
  HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
  CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
  GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
} from '../blocks'

export const ServicePages: CollectionConfig = {
  slug: 'service-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'service', 'location', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Service + Location combination pages -- the core of programmatic SEO',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 10,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateServicePageSlug],
    beforeValidate: [
      // Enforce content quality score minimum for publishing.
      // Drafts can be saved at any score, but publishing requires score >= 50.
      async ({ data, operation }) => {
        if (!data) return data
        const isPublishing = data._status === 'published'
        const score = data.contentQualityScore
        if (isPublishing && typeof score === 'number' && score < 50) {
          throw new Error(
            `Cannot publish: contentQualityScore is ${score} (minimum 50 required). ` +
            `Save as draft and improve content quality before publishing.`
          )
        }
        return data
      },
      // NOTE: Add a beforeValidate hook that checks for existing documents with the
      // same service+location combination to enforce uniqueness at the application level.
      // The slug uniqueness constraint alone is not sufficient because slugs can be
      // manually overridden. Example:
      //   async ({ data, req, operation }) => {
      //     if (operation === 'create' && data.service && data.location) {
      //       const existing = await req.payload.find({
      //         collection: 'service-pages',
      //         where: { and: [
      //           { service: { equals: data.service } },
      //           { location: { equals: data.location } },
      //         ]},
      //         limit: 1,
      //       })
      //       if (existing.totalDocs > 0) {
      //         throw new Error('A ServicePage for this service+location combination already exists')
      //       }
      //     }
      //     return data
      //   },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Page title -- auto-generated as "[Service] in [Location]" but customizable' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL slug -- auto-generated as "[service-slug]-in-[location-slug]"' },
    },

    // -- Relationships (the cross-product) --
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      admin: { description: 'Which service this page is about' },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
      admin: { description: 'Which location this page targets' },
    },

    // -- Unique Content per Combination --
    {
      name: 'headline',
      type: 'text',
      localized: true,
      admin: { description: 'Custom headline (e.g., "Expert Plumbing Services in Austin, TX")' },
    },
    {
      name: 'introduction',
      type: 'richText',
      localized: true,
      admin: { description: 'Unique intro paragraph for this service+location combo' },
    },
    {
      name: 'localContent',
      type: 'richText',
      localized: true,
      admin: { description: 'Location-specific content -- local regulations, area-specific tips' },
    },

    // -- Page Layout (Blocks) --
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      admin: { description: 'Page content sections' },
      blocks: [
        HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
        CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
        GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
      ],
    },

    // -- SEO Overrides --
    // NOTE: maxLength values match Google's truncation thresholds (60 for title, 160 for description).
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: { description: 'Custom SEO title for this specific combination. Max 60 chars.' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: { description: 'Custom meta description. Max 160 chars.' },
    },

    // -- Internal Linking --
    {
      name: 'relatedServicePages',
      type: 'relationship',
      relationTo: 'service-pages',
      hasMany: true,
      admin: { description: 'Related service+location pages for cross-linking' },
    },

    // -- Content Flags --
    {
      name: 'contentSource',
      type: 'select',
      defaultValue: 'template',
      options: [
        { label: 'Template Generated', value: 'template' },
        { label: 'AI Generated', value: 'ai' },
        { label: 'Manually Written', value: 'manual' },
        { label: 'Enriched', value: 'enriched' },
      ],
      admin: { position: 'sidebar', description: 'Track how this page\'s content was created' },
    },
    {
      name: 'contentQualityScore',
      type: 'number',
      min: 0,
      max: 100,
      admin: { position: 'sidebar', description: 'Content quality score (0-100)' },
    },

    // -- Keywords --
    {
      name: 'keywords',
      type: 'group',
      fields: [
        { name: 'primary', type: 'text' },
        { name: 'secondary', type: 'array', fields: [{ name: 'keyword', type: 'text', required: true }] },
        { name: 'longTail', type: 'array', fields: [{ name: 'phrase', type: 'text', required: true }] },
        { name: 'lsiTerms', type: 'textarea' },
        { name: 'geoModifiers', type: 'textarea' },
      ],
    },
  ],
}
```

#### 4.1.4 BlogPosts Collection

**File**: `src/collections/BlogPosts.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'category', '_status', 'publishedAt'],
    group: 'Content',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea', maxLength: 300, localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'team-members',
      admin: { description: 'Select the author from the team. Use authorOverride for external authors.' },
    },
    {
      name: 'authorOverride',
      type: 'text',
      admin: { description: 'Fallback author name when the author is not a team member (overrides the relationship).' },
    },
    { name: 'publishedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Tips & Guides', value: 'tips' },
        { label: 'Industry News', value: 'news' },
        { label: 'Case Studies', value: 'case-studies' },
        { label: 'Company Updates', value: 'updates' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'relatedLocations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
    },

    // -- SEO Overrides --
    // NOTE: maxLength values match Google's truncation thresholds (60 for title, 160 for description).
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Custom SEO title. Max 60 chars.',
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Custom meta description. Max 160 chars.',
        position: 'sidebar',
      },
    },
  ],
}
```

#### 4.1.5 FAQs Collection

**File**: `src/collections/FAQs.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'service', 'location', 'updatedAt'],
    group: 'Content',
    description: 'Frequently asked questions -- used in FAQ blocks and FAQ schema markup',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'richText', required: true, localized: true },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: { description: 'Service this FAQ applies to (leave empty for global)' },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'Location this FAQ applies to (leave empty for global)' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order within a FAQ block (lower = first)' },
    },
  ],
}
```

#### 4.1.6 Testimonials Collection

**File**: `src/collections/Testimonials.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'rating', 'service', 'location', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'clientName', type: 'text', required: true },
    { name: 'clientTitle', type: 'text', admin: { description: 'e.g., "Homeowner" or "Business Owner"' } },
    { name: 'review', type: 'textarea', required: true, localized: true },
    { name: 'rating', type: 'number', min: 1, max: 5, required: true },
    { name: 'date', type: 'date' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    { name: 'service', type: 'relationship', relationTo: 'services' },
    { name: 'location', type: 'relationship', relationTo: 'locations' },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Yelp', value: 'yelp' },
        { label: 'Direct', value: 'direct' },
        { label: 'Facebook', value: 'facebook' },
      ],
    },
  ],
}
```

#### 4.1.7 TeamMembers Collection

**File**: `src/collections/TeamMembers.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'richText', localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      admin: { description: 'Locations this team member serves' },
    },
    {
      name: 'specialties',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'certifications',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'issuer', type: 'text' },
        { name: 'year', type: 'number' },
      ],
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
```

### 4.2 Media Collection Enhancement

**File**: `src/collections/Media.ts` (MODIFY existing)

Replace the current minimal upload config with detailed image sizes and mime types:

```typescript
import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: [
      'image/png', 'image/jpeg', 'image/webp', 'image/avif',
      'image/svg+xml', 'image/gif', 'application/pdf',
    ],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, fit: 'cover', position: 'centre' },
      { name: 'card', width: 600, height: 400, fit: 'cover', position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, fit: 'cover', position: 'centre' },
      { name: 'heroMobile', width: 768, height: 1024, fit: 'cover', position: 'centre' },
      { name: 'gallery', width: 1200, height: 800, fit: 'cover', position: 'centre' },
      { name: 'galleryThumb', width: 300, height: 200, fit: 'cover', position: 'centre' },
      { name: 'og', width: 1200, height: 630, fit: 'cover', position: 'centre' },
      { name: 'square', width: 400, height: 400, fit: 'cover', position: 'centre' },
      { name: 'content', width: 800, height: undefined, fit: 'inside', position: 'centre' },
    ],
  },
  admin: {
    group: 'Content',
    description: 'Images, documents, and other files',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Alt text for accessibility and SEO (max 125 chars)' },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      admin: { description: 'Optional caption displayed below the image' },
    },
  ],
}
```

### 4.3 Site Settings Global

**File**: `src/globals/SiteSettings.ts` (NEW)

```typescript
import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    // -- Branding --
    { name: 'siteName', type: 'text', required: true, localized: true },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'favicon', type: 'upload', relationTo: 'media' },

    // -- Contact Information --
    { name: 'phone', type: 'text', admin: { description: 'Primary phone number (e.g., +1-555-123-4567)' } },
    { name: 'email', type: 'email' },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'stateCode', type: 'text', maxLength: 2 },
        { name: 'zip', type: 'text' },
        { name: 'country', type: 'text', defaultValue: 'US' },
      ],
    },

    // -- Social Links --
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Yelp', value: 'yelp' },
            { label: 'Google Business', value: 'google' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },

    // -- Footer --
    { name: 'footerText', type: 'textarea', localized: true },

    // -- SEO Defaults --
    { name: 'defaultSeoImage', type: 'upload', relationTo: 'media' },
    { name: 'googleAnalyticsId', type: 'text', admin: { description: 'e.g., G-XXXXXXXXXX' } },

    // -- Business Schema --
    // This JSON field is spread into the Organization schema output in `generateOrganizationSchema()`.
    // Any keys defined here override or extend the auto-generated Organization schema properties.
    // Example: { "@type": "LocalBusiness", "priceRange": "$$", "openingHours": "Mo-Fr 08:00-18:00" }
    // The merge happens via: { ...autoGeneratedOrgSchema, ...settings.businessSchema }
    {
      name: 'businessSchema',
      type: 'json',
      admin: {
        description: 'Base Organization/LocalBusiness schema.org JSON-LD. Spread into the Organization schema on every page. Keys here override auto-generated values.',
      },
      validate: (value: any) => {
        if (!value) return true // Field is optional
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return 'businessSchema must be a JSON object (not an array or primitive).'
          }
          // Warn if missing @type but don't reject -- it will inherit from the base schema
          return true
        } catch (e) {
          return 'Invalid JSON. Please enter a valid JSON object.'
        }
      },
    },

    // -- Rebuild Configuration --
    {
      name: 'rebuildMode',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual (button/CLI only)', value: 'manual' },
        { label: 'Auto (webhook on publish)', value: 'auto' },
        { label: 'Auto with Review (queue bulk ops)', value: 'auto-review' },
      ],
      admin: { description: 'How Astro site rebuilds are triggered on content changes' },
    },
    {
      name: 'webhookUrl',
      type: 'text',
      admin: { description: 'Deploy webhook URL (Vercel, Cloudflare, or custom)' },
    },
  ],
}
```

### 4.4 Block Definitions (12)

**Directory**: `src/blocks/` (NEW)

All blocks are defined as Payload `Block` types and exported from `src/blocks/index.ts`.

**File**: `src/blocks/index.ts`

```typescript
export { HeroBlock } from './Hero'
export { ServiceDetailBlock } from './ServiceDetail'
export { FAQBlock } from './FAQ'
export { TestimonialsBlock } from './Testimonials'
export { CTABlock } from './CTA'
export { LocationMapBlock } from './LocationMap'
export { ContentBlock } from './Content'
export { StatsBlock } from './Stats'
export { GalleryBlock } from './Gallery'
export { PricingBlock } from './Pricing'
export { TeamBlock } from './Team'
export { RelatedLinksBlock } from './RelatedLinks'
```

Each block file (`Hero.ts`, `ServiceDetail.ts`, `FAQ.ts`, `Testimonials.ts`, `CTA.ts`, `LocationMap.ts`, `Content.ts`, `Stats.ts`, `Gallery.ts`, `Pricing.ts`, `Team.ts`, `RelatedLinks.ts`) follows the exact definitions from the SEO playbook at `website-seo-playbook/CMS_COLLECTIONS_AND_BLOCKS.md`, Section 3. The complete field definitions are:

**`src/blocks/Hero.ts`**:
```typescript
import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero Section', plural: 'Hero Sections' },
  fields: [
    { name: 'heading', type: 'text', required: true, localized: true },
    { name: 'subheading', type: 'text', localized: true },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', defaultValue: 'Get a Free Quote', localized: true },
        { name: 'link', type: 'text' },
        { name: 'phone', type: 'text', admin: { description: 'Phone number for click-to-call' } },
      ],
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Left-aligned', value: 'left' },
        { label: 'Split (image + text)', value: 'split' },
        { label: 'Full-bleed background', value: 'fullbleed' },
      ],
    },
    {
      name: 'overlayOpacity',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 40,
      admin: { description: 'Dark overlay percentage on background image' },
    },
  ],
}
```

**`src/blocks/ServiceDetail.ts`**:
```typescript
import type { Block } from 'payload'

export const ServiceDetailBlock: Block = {
  slug: 'serviceDetail',
  interfaceName: 'ServiceDetailBlock',
  labels: { singular: 'Service Detail', plural: 'Service Details' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'icon', type: 'text' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Feature List', value: 'list' },
        { label: 'Grid Cards', value: 'grid' },
        { label: 'Alternating Rows', value: 'alternating' },
      ],
    },
  ],
}
```

**`src/blocks/FAQ.ts`**:
```typescript
import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ Section', plural: 'FAQ Sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Frequently Asked Questions', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual (pick FAQs below)', value: 'manual' },
        { label: 'Auto (pull from FAQ collection by service/location)', value: 'auto' },
      ],
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: {
        description: 'Select specific FAQs (only used when source is "manual")',
        condition: (_, siblingData) => siblingData?.source === 'manual',
      },
    },
    { name: 'maxItems', type: 'number', defaultValue: 8, admin: { description: 'Maximum FAQs to show' } },
    { name: 'generateSchema', type: 'checkbox', defaultValue: true, admin: { description: 'Generate FAQPage schema.org markup' } },
  ],
}
```

**`src/blocks/Testimonials.ts`**:
```typescript
import type { Block } from 'payload'

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'What Our Customers Say', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'featured',
      options: [
        { label: 'Featured Only', value: 'featured' },
        { label: 'By Service', value: 'service' },
        { label: 'By Location', value: 'location' },
        { label: 'Manual Selection', value: 'manual' },
      ],
    },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    { name: 'maxItems', type: 'number', defaultValue: 6 },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'carousel',
      options: [
        { label: 'Carousel', value: 'carousel' },
        { label: 'Grid', value: 'grid' },
        { label: 'Stack', value: 'stack' },
      ],
    },
    { name: 'generateSchema', type: 'checkbox', defaultValue: true, admin: { description: 'Generate Review schema.org markup' } },
  ],
}
```

**`src/blocks/CTA.ts`**:
```typescript
import type { Block } from 'payload'

export const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  labels: { singular: 'Call to Action', plural: 'Calls to Action' },
  fields: [
    { name: 'heading', type: 'text', required: true, localized: true },
    { name: 'subheading', type: 'text', localized: true },
    { name: 'buttonText', type: 'text', defaultValue: 'Contact Us', localized: true },
    { name: 'buttonLink', type: 'text' },
    { name: 'phone', type: 'text', admin: { description: 'Phone number for click-to-call CTA' } },
    { name: 'showForm', type: 'checkbox', defaultValue: false },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      admin: { condition: (_, siblingData) => siblingData?.showForm },
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'banner',
      options: [
        { label: 'Banner', value: 'banner' },
        { label: 'Card', value: 'card' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Full-width', value: 'fullwidth' },
      ],
    },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
  ],
}
```

**`src/blocks/LocationMap.ts`**:
```typescript
import type { Block } from 'payload'

export const LocationMapBlock: Block = {
  slug: 'locationMap',
  interfaceName: 'LocationMapBlock',
  labels: { singular: 'Location Map', plural: 'Location Maps' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Our Service Area', localized: true },
    { name: 'embedUrl', type: 'text', admin: { description: 'Google Maps embed URL' } },
    { name: 'address', type: 'textarea', admin: { description: 'Physical address displayed alongside map' } },
    { name: 'serviceRadius', type: 'text', admin: { description: 'e.g., "25 miles from downtown"' } },
    { name: 'showNearbyLocations', type: 'checkbox', defaultValue: true },
  ],
}
```

**`src/blocks/Content.ts`**:
```typescript
import type { Block } from 'payload'

export const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: { singular: 'Content Section', plural: 'Content Sections' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'No Image', value: 'none' },
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
        { label: 'Above', value: 'above' },
        { label: 'Below', value: 'below' },
      ],
    },
  ],
}
```

**`src/blocks/Stats.ts`**:
```typescript
import type { Block } from 'payload'

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats / Counters', plural: 'Stats / Counters' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'stats',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g., "500+", "24/7", "98%"' } },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'icon', type: 'text' },
      ],
    },
  ],
}
```

**`src/blocks/Gallery.ts`**:
```typescript
import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Image Gallery', plural: 'Image Galleries' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'images',
      type: 'array',
      minRows: 2,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    { name: 'columns', type: 'number', defaultValue: 3, min: 2, max: 4 },
  ],
}
```

**`src/blocks/Pricing.ts`**:
```typescript
import type { Block } from 'payload'

export const PricingBlock: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: { singular: 'Pricing Table', plural: 'Pricing Tables' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Our Pricing', localized: true },
    { name: 'subheading', type: 'text', localized: true },
    {
      name: 'tiers',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'price', type: 'text', required: true, admin: { description: 'e.g., "$150", "From $99", "Custom"' } },
        { name: 'unit', type: 'text', admin: { description: 'e.g., "/visit", "/hour"' } },
        { name: 'description', type: 'textarea', localized: true },
        {
          name: 'features',
          type: 'array',
          fields: [
            { name: 'feature', type: 'text', required: true, localized: true },
            { name: 'included', type: 'checkbox', defaultValue: true },
          ],
        },
        { name: 'highlighted', type: 'checkbox', defaultValue: false },
        { name: 'ctaText', type: 'text', defaultValue: 'Get Started', localized: true },
        { name: 'ctaLink', type: 'text' },
      ],
    },
    { name: 'disclaimer', type: 'text', localized: true, admin: { description: 'e.g., "Prices may vary by location"' } },
  ],
}
```

**`src/blocks/Team.ts`**:
```typescript
import type { Block } from 'payload'

export const TeamBlock: Block = {
  slug: 'team',
  interfaceName: 'TeamBlock',
  labels: { singular: 'Team Section', plural: 'Team Sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Meet Our Team', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'All Team Members', value: 'all' },
        { label: 'By Location', value: 'location' },
        { label: 'Manual Selection', value: 'manual' },
      ],
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'team-members',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    { name: 'maxItems', type: 'number', defaultValue: 8 },
    { name: 'showContact', type: 'checkbox', defaultValue: false },
  ],
}
```

**`src/blocks/RelatedLinks.ts`**:
```typescript
import type { Block } from 'payload'

export const RelatedLinksBlock: Block = {
  slug: 'relatedLinks',
  interfaceName: 'RelatedLinksBlock',
  labels: { singular: 'Related Links', plural: 'Related Links' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Related Services', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto (related services/locations)', value: 'auto' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'links',
      type: 'array',
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
    { name: 'maxItems', type: 'number', defaultValue: 6 },
  ],
}
```

### 4.5 Plugin Configuration Updates

**File**: `src/plugins/index.ts` (MODIFY)

Add the new collections to every plugin that references collections:

```typescript
// seoPlugin -- add new collections
seoPlugin({
  collections: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  // ... rest of existing config unchanged
})

// redirectsPlugin -- add new collections
redirectsPlugin({
  collections: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  // ... rest unchanged
})

// searchPlugin -- add new collections with priorities
searchPlugin({
  collections: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  defaultPriorities: {
    pages: 10,
    services: 20,
    locations: 30,
    'service-pages': 10,
    'blog-posts': 40,
  },
  syncDrafts: false,
  deleteDrafts: true,
})

// nestedDocsPlugin -- add services (for sub-service hierarchy)
nestedDocsPlugin({
  collections: ['pages', 'services'],
  generateLabel: (_, doc) => String(doc.title || doc.name),
  generateURL: (docs) =>
    docs.reduce((url, doc) => `${url}/${String(doc.slug)}`, ''),
})

// importExportPlugin -- add new collections
importExportPlugin({
  collections: [
    { slug: 'pages' },
    { slug: 'media' },
    { slug: 'services' },
    { slug: 'locations' },
    { slug: 'service-pages' },
    { slug: 'blog-posts' },
    { slug: 'faqs' },
    { slug: 'testimonials' },
    { slug: 'team-members' },
  ],
})
```

### 4.6 Live Preview Updates

There are **two distinct preview mechanisms** in this system:

1. **Live Preview (Payload's built-in)**: Real-time editing in the admin panel. Payload renders the target page in an iframe and sends content updates via the `postMessage` API. The `livePreview.url` function must point at SSR-capable routes (not static pages). We point it at the `/preview` SSR route with query parameters.

2. **Draft Preview (our preview route)**: Token-based draft sharing for clients. The `/preview?collection=...&slug=...&token=...` route fetches draft content from the API and renders it server-side. Used for sharing draft URLs with stakeholders.

For Live Preview to work with Astro static pages, the admin iframe must load an SSR route that can receive `postMessage` events. Static pages cannot respond to live edits. The `/preview` route serves both purposes.

**File**: `src/payload.config.ts` (MODIFY the `admin.livePreview` section)

```typescript
livePreview: {
  url: ({ data, collectionConfig, locale }) => {
    // Point Live Preview at the SSR preview route, not static pages
    const astroUrl = process.env.PUBLIC_ASTRO_URL || 'http://localhost:4400'
    const slug = (data as any)?.slug || ''
    const collection = collectionConfig?.slug || ''
    const localeParam = locale?.code && locale.code !== 'en' ? `&locale=${locale.code}` : ''

    // All collections go through the preview route for real-time editing
    // Include the PREVIEW_SECRET token so the preview route accepts the request
    const token = process.env.PREVIEW_SECRET || ''
    return `${astroUrl}/preview?collection=${collection}&slug=${slug}&token=${token}${localeParam}`
  },
  collections: ['pages', 'services', 'locations', 'service-pages', 'blog-posts'],
  breakpoints: [
    { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
    { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
    { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
  ],
},
```

### 4.7 Hooks

**File**: `src/hooks/auto-generate-slug.ts` (NEW)

```typescript
import type { CollectionBeforeChangeHook } from 'payload'

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'your', 'our', 'my', 'his', 'her', 'its', 'their', 'this', 'that',
  'near', 'area',
])

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Convert accented chars: e→e, u→u, n→n
    .split(/\s+/)
    .filter((word) => !STOP_WORDS.has(word))
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// MD-2: Blog posts use a lighter slug generation that only strips articles (a, an, the)
// to preserve readability. Other collections use the full stop-word list.
const ARTICLE_WORDS = new Set(['a', 'an', 'the'])

function slugifyLight(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => !ARTICLE_WORDS.has(word))
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const autoGenerateSlug: CollectionBeforeChangeHook = ({ data, operation, collection }) => {
  if (operation === 'create' && !data.slug) {
    const source = data.name || data.title || data.displayName || ''
    if (source) {
      // Use lighter slugification for blog posts to preserve readability
      data.slug = collection.slug === 'blog-posts' ? slugifyLight(source) : slugify(source)
    }
  }
  return data
}
```

**File**: `src/hooks/auto-generate-service-page-slug.ts` (NEW)

```typescript
import type { CollectionBeforeChangeHook } from 'payload'

export const autoGenerateServicePageSlug: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation === 'create' && !data.slug && data.service && data.location) {
    const serviceDoc = await req.payload.findByID({
      collection: 'services',
      id: data.service,
    })
    const locationDoc = await req.payload.findByID({
      collection: 'locations',
      id: data.location,
    })
    if (serviceDoc?.slug && locationDoc?.slug) {
      data.slug = `${serviceDoc.slug}-in-${locationDoc.slug}`
    }
  }

  // Auto-generate title if not provided
  if (operation === 'create' && !data.title && data.service && data.location) {
    const serviceDoc = await req.payload.findByID({
      collection: 'services',
      id: data.service,
    })
    const locationDoc = await req.payload.findByID({
      collection: 'locations',
      id: data.location,
    })
    if (serviceDoc?.name && locationDoc?.displayName) {
      data.title = `${serviceDoc.name} in ${locationDoc.displayName}`
    }
  }

  return data
}
```

### 4.8 Access Control

All 7 new content collections use the existing `publishedOrLoggedIn` pattern for read access and `isAdminOrEditor` for create/update/delete. FAQs, Testimonials, and TeamMembers use public read access (no draft filtering) since they are supporting data, not standalone pages.

The `publishedOrLoggedIn` function (already exists at `src/access/publishedOrLoggedIn.ts`):
```typescript
import type { Access } from 'payload'

export const publishedOrLoggedIn: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

### 4.9 Updated Collections Index

**File**: `src/collections/index.ts` (MODIFY)

```typescript
export { Contacts } from './Contacts'
export { Pages } from './Pages'
export { Media } from './Media'
export { Users } from './Users'
export { Services } from './Services'
export { Locations } from './Locations'
export { ServicePages } from './ServicePages'
export { BlogPosts } from './BlogPosts'
export { FAQs } from './FAQs'
export { Testimonials } from './Testimonials'
export { TeamMembers } from './TeamMembers'
```

### 4.10 Updated payload.config.ts

**File**: `src/payload.config.ts` (MODIFY)

Add new collections to the `collections` array and SiteSettings to globals:

```typescript
import {
  Contacts, Pages, Media, Users,
  Services, Locations, ServicePages,
  BlogPosts, FAQs, Testimonials, TeamMembers,
} from './collections'
import { SiteSettings } from './globals/SiteSettings'

// In buildConfig:
collections: [
  Pages, Media, Users, Services, Locations, ServicePages,
  BlogPosts, FAQs, Testimonials, TeamMembers,
  ...(process.env.TWENTY_API_URL ? [Contacts] : []),
],
globals: [SiteSettings],
```

---

## 5. Shared Data Layer (`packages/shared/payload`)

### 5.1 PayloadClient

**File**: `packages/shared/src/payload/client.ts` (NEW)

This follows the existing shared package pattern: factory functions that accept config, no env access inside the package.

```typescript
// packages/shared/src/payload/client.ts

import type {
  PayloadListResponse,
  PayloadClient,
  PayloadClientConfig,
  Service,
  Location,
  ServicePage,
  BlogPost,
  FAQ,
  Testimonial,
  TeamMember,
  Page,
  SiteSettings,
} from './types'

export function createPayloadClient(config: PayloadClientConfig): PayloadClient {
  const { apiUrl, apiKey, defaultDepth = 1 } = config

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `users API-Key ${apiKey}`
  }

  async function fetchPayload<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${apiUrl}/${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) =>
        url.searchParams.set(key, value),
      )
    }

    const response = await fetch(url.toString(), { headers })

    if (!response.ok) {
      throw new Error(
        `Payload API error: ${response.status} ${response.statusText} at ${endpoint}`,
      )
    }
    return response.json()
  }

  // MD-7: For production builds, add retry logic with exponential backoff and a timeout.
  // Recommended: 3 retries with exponential backoff (1s, 2s, 4s) and a 30-second
  // request timeout via AbortController. Example:
  //
  //   const controller = new AbortController()
  //   const timeout = setTimeout(() => controller.abort(), 30_000)
  //   const response = await fetch(url, { headers, signal: controller.signal })
  //   clearTimeout(timeout)
  //
  // For retries, wrap fetchPayload in a retry helper:
  //
  //   async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  //     for (let i = 0; i < retries; i++) {
  //       try { return await fn() }
  //       catch (e) { if (i === retries - 1) throw e; await new Promise(r => setTimeout(r, 1000 * 2 ** i)) }
  //     }
  //     throw new Error('Unreachable')
  //   }

  async function fetchList<T>(
    collection: string,
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<T>> {
    return fetchPayload<PayloadListResponse<T>>(collection, {
      depth: String(defaultDepth),
      ...params,
    })
  }

  async function fetchById<T>(
    collection: string,
    id: string,
    depth?: number,
  ): Promise<T> {
    return fetchPayload<T>(`${collection}/${id}`, {
      depth: String(depth ?? defaultDepth),
    })
  }

  async function fetchBySlug<T>(
    collection: string,
    slug: string,
    depth?: number,
  ): Promise<T | null> {
    const result = await fetchList<T>(collection, {
      'where[slug][equals]': slug,
      depth: String(depth ?? defaultDepth),
    })
    return result.docs[0] ?? null
  }

  async function fetchPublished<T>(
    collection: string,
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<T>> {
    return fetchList<T>(collection, {
      'where[_status][equals]': 'published',
      ...params,
    })
  }

  async function fetchPaginated<T>(
    collection: string,
    page: number,
    limit: number,
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<T>> {
    return fetchList<T>(collection, {
      page: String(page),
      limit: String(limit),
      ...params,
    })
  }

  async function fetchGlobal<T>(slug: string): Promise<T> {
    return fetchPayload<T>(`globals/${slug}`)
  }

  // -- Typed Collection Helpers --

  async function getAllServices(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<Service>> {
    return fetchPublished<Service>('services', {
      limit: '1000',
      depth: '1',
      ...params,
    })
  }

  async function getServiceBySlug(slug: string): Promise<Service | null> {
    return fetchBySlug<Service>('services', slug, 2)
  }

  async function getAllLocations(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<Location>> {
    return fetchPublished<Location>('locations', {
      limit: '10000',
      depth: '1',
      ...params,
    })
  }

  async function getLocationBySlug(slug: string): Promise<Location | null> {
    return fetchBySlug<Location>('locations', slug, 2)
  }

  async function getAllServicePages(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<ServicePage>> {
    // Paginate in batches of 1000 to avoid OOM on large datasets (100k+ pages)
    const batchSize = 1000
    let page = 1
    let hasMore = true
    const allDocs: ServicePage[] = []
    let lastResult: PayloadListResponse<ServicePage> | null = null

    while (hasMore) {
      const result = await fetchPublished<ServicePage>('service-pages', {
        limit: String(batchSize),
        page: String(page),
        depth: '2',
        ...params,
      })
      allDocs.push(...result.docs)
      hasMore = result.hasNextPage
      lastResult = result
      page++
    }

    // Return a merged response that matches PayloadListResponse shape
    return {
      docs: allDocs,
      totalDocs: lastResult?.totalDocs ?? allDocs.length,
      limit: lastResult?.totalDocs ?? allDocs.length,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    }
  }

  async function getServicePage(
    serviceSlug: string,
    locationSlug: string,
  ): Promise<ServicePage | null> {
    const result = await fetchPublished<ServicePage>('service-pages', {
      'where[slug][equals]': `${serviceSlug}-in-${locationSlug}`,
      depth: '2',
    })
    return result.docs[0] ?? null
  }

  async function getAllBlogPosts(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<BlogPost>> {
    return fetchPublished<BlogPost>('blog-posts', {
      limit: '1000',
      sort: '-publishedAt',
      depth: '1',
      ...params,
    })
  }

  async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return fetchBySlug<BlogPost>('blog-posts', slug, 2)
  }

  async function getFAQs(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<FAQ>> {
    return fetchList<FAQ>('faqs', {
      limit: '500',
      sort: 'sortOrder',
      depth: '1',
      ...params,
    })
  }

  async function getFAQsByService(serviceId: string): Promise<PayloadListResponse<FAQ>> {
    return getFAQs({ 'where[service][equals]': serviceId })
  }

  async function getFAQsByLocation(locationId: string): Promise<PayloadListResponse<FAQ>> {
    return getFAQs({ 'where[location][equals]': locationId })
  }

  async function getTestimonials(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<Testimonial>> {
    return fetchList<Testimonial>('testimonials', {
      limit: '100',
      depth: '1',
      ...params,
    })
  }

  async function getFeaturedTestimonials(): Promise<PayloadListResponse<Testimonial>> {
    return getTestimonials({ 'where[featured][equals]': 'true' })
  }

  async function getTeamMembers(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<TeamMember>> {
    return fetchList<TeamMember>('team-members', {
      limit: '100',
      sort: 'sortOrder',
      depth: '1',
      ...params,
    })
  }

  async function getAllPages(
    params?: Record<string, string>,
  ): Promise<PayloadListResponse<Page>> {
    return fetchPublished<Page>('pages', {
      limit: '1000',
      depth: '1',
      ...params,
    })
  }

  async function getPageBySlug(slug: string): Promise<Page | null> {
    return fetchBySlug<Page>('pages', slug, 2)
  }

  async function getSiteSettings(): Promise<SiteSettings> {
    return fetchGlobal<SiteSettings>('site-settings')
  }

  return {
    // Generic
    fetch: fetchPayload,
    fetchList,
    fetchById,
    fetchBySlug,
    fetchPublished,
    fetchPaginated,
    fetchGlobal,
    // Typed helpers
    getAllServices,
    getServiceBySlug,
    getAllLocations,
    getLocationBySlug,
    getAllServicePages,
    getServicePage,
    getAllBlogPosts,
    getBlogPostBySlug,
    getFAQs,
    getFAQsByService,
    getFAQsByLocation,
    getTestimonials,
    getFeaturedTestimonials,
    getTeamMembers,
    getAllPages,
    getPageBySlug,
    getSiteSettings,
  }
}
```

### 5.2 TypeScript Types

**File**: `packages/shared/src/payload/types.ts` (NEW)

```typescript
// packages/shared/src/payload/types.ts

// -- Client Config --

export interface PayloadClientConfig {
  apiUrl: string        // e.g., "http://localhost:3158/api"
  apiKey?: string       // Optional API key for authenticated requests
  defaultDepth?: number // Default relationship population depth (default: 1)
}

// -- Generic Response --

export interface PayloadListResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

// -- Media --

export interface MediaSize {
  url: string
  width: number
  height: number
  mimeType: string
  filesize: number
  filename: string
}

export interface Media {
  id: string
  alt: string
  caption?: string
  url: string
  filename: string
  mimeType: string
  filesize: number
  width: number
  height: number
  sizes: {
    thumbnail?: MediaSize
    card?: MediaSize
    hero?: MediaSize
    heroMobile?: MediaSize
    gallery?: MediaSize
    galleryThumb?: MediaSize
    og?: MediaSize
    square?: MediaSize
    content?: MediaSize
  }
  createdAt: string
  updatedAt: string
}

// -- Collections --

export interface Service {
  id: string
  name: string
  slug: string
  category: 'residential' | 'commercial' | 'emergency' | 'maintenance'
  shortDescription: string
  description?: any // Lexical rich text JSON
  featuredImage?: Media | string
  gallery?: Array<{ image: Media | string; caption?: string }>
  icon?: string
  features?: Array<{ title: string; description?: string; icon?: string }>
  pricing?: {
    startingAt?: number
    priceRange?: string
    unit?: string
    showPricing?: boolean
  }
  layout?: Block[]
  relatedServices?: (Service | string)[]
  faqs?: (FAQ | string)[]
  seoTitle?: string
  seoDescription?: string
  schemaType?: string
  keywords?: KeywordGroup
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  displayName: string
  slug: string
  type: 'city' | 'neighborhood' | 'county' | 'region' | 'zip' | 'state'
  city: string
  state: string
  stateCode: string
  zipCodes?: string
  coordinates?: [number, number] // [longitude, latitude]
  population?: number
  timezone?: string
  description?: any // Lexical rich text JSON
  areaInfo?: string
  featuredImage?: Media | string
  parentLocation?: Location | string
  nearbyLocations?: (Location | string)[]
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface ServicePage {
  id: string
  title: string
  slug: string
  service: Service | string
  location: Location | string
  headline?: string
  introduction?: any // Lexical rich text JSON
  localContent?: any // Lexical rich text JSON
  layout?: Block[]
  seoTitle?: string
  seoDescription?: string
  relatedServicePages?: (ServicePage | string)[]
  contentSource?: 'template' | 'ai' | 'manual' | 'enriched'
  contentQualityScore?: number
  keywords?: KeywordGroup & { geoModifiers?: string }
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: any // Lexical rich text JSON
  featuredImage?: Media | string
  author?: TeamMember | string
  authorOverride?: string
  publishedAt?: string
  category?: 'tips' | 'news' | 'case-studies' | 'updates'
  tags?: Array<{ tag: string }>
  relatedServices?: (Service | string)[]
  relatedLocations?: (Location | string)[]
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface FAQ {
  id: string
  question: string
  answer: any // Lexical rich text JSON
  service?: Service | string
  location?: Location | string
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface Testimonial {
  id: string
  clientName: string
  clientTitle?: string
  review: string
  rating: number
  date?: string
  avatar?: Media | string
  service?: Service | string
  location?: Location | string
  featured?: boolean
  source?: 'google' | 'yelp' | 'direct' | 'facebook'
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio?: any // Lexical rich text JSON
  photo?: Media | string
  email?: string
  phone?: string
  locations?: (Location | string)[]
  specialties?: (Service | string)[]
  certifications?: Array<{ name: string; issuer?: string; year?: number }>
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: Media | string
  content?: any // Lexical rich text JSON
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

// -- Globals --

export interface SiteSettings {
  siteName: string
  tagline?: string
  logo?: Media | string
  favicon?: Media | string
  phone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    stateCode?: string
    zip?: string
    country?: string
  }
  socialLinks?: Array<{
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'yelp' | 'google'
    url: string
  }>
  footerText?: string
  defaultSeoImage?: Media | string
  googleAnalyticsId?: string
  businessSchema?: Record<string, any>
  rebuildMode?: 'manual' | 'auto' | 'auto-review'
  webhookUrl?: string
}

// -- Blocks --

export interface Block {
  id?: string
  blockType: string
  [key: string]: any
}

// -- SEO --

export interface SEOMeta {
  title?: string
  description?: string
  image?: Media | string
  ogTitle?: string
  robots?: string
  jsonLd?: Record<string, any>
}

export interface KeywordGroup {
  primary?: string
  secondary?: Array<{ keyword: string }>
  longTail?: Array<{ phrase: string }>
  lsiTerms?: string
}

// -- Client Interface --

export interface PayloadClient {
  // Generic methods
  fetch: <T>(endpoint: string, params?: Record<string, string>) => Promise<T>
  fetchList: <T>(collection: string, params?: Record<string, string>) => Promise<PayloadListResponse<T>>
  fetchById: <T>(collection: string, id: string, depth?: number) => Promise<T>
  fetchBySlug: <T>(collection: string, slug: string, depth?: number) => Promise<T | null>
  fetchPublished: <T>(collection: string, params?: Record<string, string>) => Promise<PayloadListResponse<T>>
  fetchPaginated: <T>(collection: string, page: number, limit: number, params?: Record<string, string>) => Promise<PayloadListResponse<T>>
  fetchGlobal: <T>(slug: string) => Promise<T>

  // Typed collection helpers
  getAllServices: (params?: Record<string, string>) => Promise<PayloadListResponse<Service>>
  getServiceBySlug: (slug: string) => Promise<Service | null>
  getAllLocations: (params?: Record<string, string>) => Promise<PayloadListResponse<Location>>
  getLocationBySlug: (slug: string) => Promise<Location | null>
  getAllServicePages: (params?: Record<string, string>) => Promise<PayloadListResponse<ServicePage>>
  getServicePage: (serviceSlug: string, locationSlug: string) => Promise<ServicePage | null>
  getAllBlogPosts: (params?: Record<string, string>) => Promise<PayloadListResponse<BlogPost>>
  getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>
  getFAQs: (params?: Record<string, string>) => Promise<PayloadListResponse<FAQ>>
  getFAQsByService: (serviceId: string) => Promise<PayloadListResponse<FAQ>>
  getFAQsByLocation: (locationId: string) => Promise<PayloadListResponse<FAQ>>
  getTestimonials: (params?: Record<string, string>) => Promise<PayloadListResponse<Testimonial>>
  getFeaturedTestimonials: () => Promise<PayloadListResponse<Testimonial>>
  getTeamMembers: (params?: Record<string, string>) => Promise<PayloadListResponse<TeamMember>>
  getAllPages: (params?: Record<string, string>) => Promise<PayloadListResponse<Page>>
  getPageBySlug: (slug: string) => Promise<Page | null>
  getSiteSettings: () => Promise<SiteSettings>
}
```

### 5.3 Package.json Changes

**File**: `packages/shared/package.json` (MODIFY)

Add the new export:

```json
{
  "exports": {
    "./supabase": "./src/supabase/client.ts",
    "./posthog": "./src/posthog/init.ts",
    "./resend": "./src/resend/client.ts",
    "./types": "./src/types/index.ts",
    "./payload": "./src/payload/client.ts",
    "./payload/types": "./src/payload/types.ts"
  }
}
```

No new dependencies needed -- the client uses native `fetch`.

---

## 6. Astro Site Changes

### 6.1 Config Changes

**File**: `templates/astro-site/astro.config.mjs` (MODIFY)

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sentry from '@sentry/astro';

// Adapter: install ONE of these packages matching your deploy target:
//   pnpm add @astrojs/vercel       -- for Vercel
//   pnpm add @astrojs/cloudflare   -- for Cloudflare Pages
//   pnpm add @astrojs/node         -- for self-hosted VPS / Docker / Hostinger
// Then uncomment the matching import:
// import vercel from '@astrojs/vercel';
// import cloudflare from '@astrojs/cloudflare';
// import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',  // Most pages static, some SSR (preview, search)
  site: process.env.SITE_URL || 'http://localhost:4400',
  trailingSlash: 'never',
  server: { port: 4400 },
  // adapter: vercel(),  // Uncomment for deployment target
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sentry({
      project: process.env.SENTRY_PROJECT || 'astro-site',
      authToken: process.env.SENTRY_AUTH_TOKEN || '',
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      enabled: !!process.env.SENTRY_DSN,
    }),
  ],
});
```

**Key changes**:
- `output: 'hybrid'` -- enables per-route SSR opt-in via `export const prerender = false`
- `site` -- required for canonical URLs and sitemap generation
- `trailingSlash: 'never'` -- consistent with Next.js default; canonical URL consistency

> **MD-4: Astro 5+ Deprecation Note**
>
> Astro 5+ deprecated `output: 'hybrid'` in favor of `output: 'static'` with per-route `export const prerender = false` for SSR opt-in. Both syntaxes achieve the same result: static by default, SSR where explicitly opted in. Check `node_modules/astro/dist/docs/` for the correct syntax in your installed Astro version.
>
> **Astro 4.x (hybrid mode):**
> ```javascript
> export default defineConfig({
>   output: 'hybrid',
>   // All pages are static by default; SSR pages use `export const prerender = false`
> })
> ```
>
> **Astro 5+ (static mode with per-route SSR):**
> ```javascript
> export default defineConfig({
>   output: 'static',
>   // All pages are static by default; SSR pages use `export const prerender = false`
>   // No adapter needed for purely static pages; add adapter only if SSR routes exist
> })
> ```
>
> If using Astro 5+, change `output: 'hybrid'` to `output: 'static'` in the config above. The SSR routes (`preview.astro`, `search.astro`) still use `export const prerender = false` in both versions.

### 6.2 Route Structure

#### URL Pattern Configuration

The URL pattern is chosen during project setup via the `URL_PATTERN` environment variable:

| Variable | Values | Default |
|----------|--------|---------|
| `URL_PATTERN` | `service-first` or `location-first` | `service-first` |

This is a project-level config set at init time -- not a runtime toggle. The developer creates the matching route files for the chosen pattern.

#### Service-First URL Pattern (Default: `URL_PATTERN=service-first`)

**Route files**: `src/pages/services/[service]/[city].astro`

```
/                                    -> index.astro (SSG)
/services/                           -> services/index.astro (SSG)
/services/[slug]                     -> services/[slug].astro (SSG)
/services/[service]/[city]           -> services/[service]/[city].astro (SSG)
/locations/                          -> locations/index.astro (SSG)
/locations/[city]                    -> locations/[city].astro (SSG)
/blog/                               -> blog/index.astro (SSG)
/blog/[slug]                         -> blog/[slug].astro (SSG)
/team                                -> team.astro (SSG)
/faq                                 -> faq.astro (SSG)
/contact                             -> contact.astro (SSG)
/privacy                             -> privacy.astro (SSG)
/terms                               -> terms.astro (SSG)
/404                                 -> 404.astro (SSG, HTTP 404 status)
/preview                             -> preview.astro (SSR only)
/search                              -> search.astro (SSR only)
/sitemap.xml                         -> sitemap.xml.ts (SSG endpoint)
/sitemap-index.xml                   -> sitemap-index.xml.ts (SSG endpoint)
/robots.txt                          -> robots.txt.ts (SSG endpoint)
```

#### Location-First URL Pattern (`URL_PATTERN=location-first`)

**Route files**: `src/pages/locations/[city]/[service].astro`

For geo-dominant businesses (e.g., real estate, property management) where the location matters more than the service:

```
/                                    -> index.astro (SSG)
/locations/                          -> locations/index.astro (SSG)
/locations/[city]                    -> locations/[city].astro (SSG)
/locations/[city]/[service]          -> locations/[city]/[service].astro (SSG)
/services/                           -> services/index.astro (SSG)
/services/[slug]                     -> services/[slug].astro (SSG)
/blog/                               -> blog/index.astro (SSG)
/blog/[slug]                         -> blog/[slug].astro (SSG)
/team                                -> team.astro (SSG)
/faq                                 -> faq.astro (SSG)
/contact                             -> contact.astro (SSG)
/privacy                             -> privacy.astro (SSG)
/terms                               -> terms.astro (SSG)
/404                                 -> 404.astro (SSG, HTTP 404 status)
/preview                             -> preview.astro (SSR only)
/search                              -> search.astro (SSR only)
/sitemap.xml                         -> sitemap.xml.ts (SSG endpoint)
/sitemap-index.xml                   -> sitemap-index.xml.ts (SSG endpoint)
/robots.txt                          -> robots.txt.ts (SSG endpoint)
```

The `locations/[city]/[service].astro` route uses the same `getStaticPaths()` pattern as the service-first variant, but swaps the parameter order and URL structure. The sitemap generation must also adapt to the chosen pattern.

#### Service Route: `/services/[slug].astro`

```astro
---
import SEOLayout from '../../layouts/SEOLayout.astro'
import BlockRenderer from '../../components/blocks/BlockRenderer.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

export async function getStaticPaths() {
  const payload = createPayloadClient({
    apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  })
  const { docs: services } = await payload.getAllServices()
  return services.map((service) => ({
    params: { slug: service.slug },
  }))
}

const { slug } = Astro.params
const service = await payload.getServiceBySlug(slug!)

if (!service) return Astro.redirect('/404')

const siteUrl = import.meta.env.SITE_URL || 'https://example.com'
---

<SEOLayout
  title={service.seoTitle || service.meta?.title || `${service.name} | Site Name`}
  description={service.seoDescription || service.meta?.description || service.shortDescription}
  ogImage={typeof service.featuredImage === 'object' ? service.featuredImage?.sizes?.og?.url : undefined}
  canonicalUrl={`${siteUrl}/services/${service.slug}`}
  pageType="service"
  schemaData={service}
>
  <BlockRenderer blocks={service.layout || []} context={{ service }} />
</SEOLayout>
```

#### Service x Location Route: `/services/[service]/[city].astro`

```astro
---
import SEOLayout from '../../../layouts/SEOLayout.astro'
import BlockRenderer from '../../../components/blocks/BlockRenderer.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

export async function getStaticPaths() {
  const payload = createPayloadClient({
    apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  })
  // Use paginated fetching to avoid OOM on large datasets (100k+ service pages)
  const allPaths = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await payload.fetchPaginated('service-pages', page, 1000, {
      'where[_status][equals]': 'published',
    })
    allPaths.push(...result.docs.map((sp) => ({
      params: {
        service: typeof sp.service === 'object' ? sp.service.slug : '',
        city: typeof sp.location === 'object' ? sp.location.slug : '',
      },
    })))
    hasMore = result.hasNextPage
    page++
  }

  return allPaths
}

const { service: serviceSlug, city: citySlug } = Astro.params
const page = await payload.getServicePage(serviceSlug!, citySlug!)

if (!page) return Astro.redirect('/404')

const siteUrl = import.meta.env.SITE_URL || 'https://example.com'
const service = typeof page.service === 'object' ? page.service : null
const location = typeof page.location === 'object' ? page.location : null
---

<SEOLayout
  title={page.seoTitle || page.meta?.title || page.title}
  description={page.seoDescription || page.meta?.description || `${service?.name} services in ${location?.displayName}`}
  ogImage={typeof service?.featuredImage === 'object' ? service.featuredImage?.sizes?.og?.url : undefined}
  canonicalUrl={`${siteUrl}/services/${serviceSlug}/${citySlug}`}
  pageType="service-location"
  schemaData={{ page, service, location }}
>
  <BlockRenderer blocks={page.layout || []} context={{ service, location, page }} />
</SEOLayout>
```

#### Location Route, Blog Route, Listing Pages

Follow the same pattern: `getStaticPaths()` enumerates all published items, the page body fetches by slug, and `SEOLayout` wraps everything with proper meta tags and schema.

**MD-12: Representative listing page implementation** (`services/index.astro`):

```astro
---
// src/pages/services/index.astro
import SEOLayout from '../../layouts/SEOLayout.astro'
import ServiceCard from '../../components/ServiceCard.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const [siteSettings, { docs: services }] = await Promise.all([
  payload.getSiteSettings(),
  payload.getAllServices({ sort: 'name' }),
])

const siteUrl = import.meta.env.SITE_URL || 'https://example.com'

// Group services by category for organized display
const categories = ['residential', 'commercial', 'emergency', 'maintenance'] as const
const grouped = categories.map((cat) => ({
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
  services: services.filter((s) => s.category === cat),
})).filter((g) => g.services.length > 0)
---

<SEOLayout
  title={`Our Services | ${siteSettings.siteName}`}
  description={`Professional services offered by ${siteSettings.siteName}. Browse our full range of ${services.length} services.`}
  canonicalUrl={`${siteUrl}/services`}
  pageType="page"
  schemaData={{ title: 'Our Services', slug: 'services' }}
>
  <div class="container mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold mb-8">Our Services</h1>

    {grouped.map((group) => (
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6">{group.label} Services</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {group.services.map((service) => (
            <ServiceCard service={service} />
          ))}
        </div>
      </section>
    ))}

    {services.length === 0 && (
      <p class="text-muted-foreground text-center py-12">No services available yet. Check back soon.</p>
    )}
  </div>
</SEOLayout>
```

> **Note**: Other listing pages (`locations/index.astro`, `blog/index.astro`, `team.astro`, `faq.astro`) follow the same pattern: fetch data, render a grid of cards. Adjust the component, grid layout, and grouping logic per content type.

**Listing page implementation notes**:

- **`services/index.astro`**: Fetches all published services via `payload.getAllServices()`. Renders a grid of `ServiceCard.astro` components (3 columns on desktop, 1 on mobile). Each card shows featured image, service name, short description, and category badge. Page title: "Our Services | {siteName}". No `getStaticPaths()` needed (not a dynamic route).

- **`locations/index.astro`**: Fetches all published locations via `payload.getAllLocations()`. Renders a grid of `LocationCard.astro` components grouped by state. Each card shows location display name, type badge, and area info excerpt. Includes an SVG map or text-based list of service areas. Page title: "Service Areas | {siteName}".

- **`blog/index.astro`**: Fetches all published blog posts via `payload.getAllBlogPosts()` sorted by `publishedAt` descending. Implements pagination (10 posts per page) using Astro's static pagination pattern with `paginate()` in `getStaticPaths()`. Each post shows featured image, title, excerpt, author, date, and category. Page title: "Blog | {siteName}".

- **`team.astro`**: Fetches all team members via `payload.getTeamMembers()`. Renders a grid of `TeamMemberCard.astro` components (3-4 columns). Each card shows photo, name, role, bio excerpt, and specialties. Page title: "Our Team | {siteName}".

- **`faq.astro`**: Fetches all FAQs via `payload.getFAQs()`. Groups FAQs by their associated service (using the `service` relationship). Renders each group with a service name heading and an accordion of questions/answers using `<details>`/`<summary>`. Global FAQs (no service association) appear in a separate "General" section. Generates `FAQPage` JSON-LD schema for all FAQs on the page. Page title: "Frequently Asked Questions | {siteName}".

#### Contact, Privacy, and Terms Pages

**MD-11: Implementation notes for static CMS pages:**

**`contact.astro`**: Uses Payload's Form Builder plugin. The page fetches a form by relationship from the `forms` collection. The form definition (fields, validation, submit button text) comes from Payload; the Astro page renders it using a React component with `client:visible` for interactivity.

```astro
---
// src/pages/contact.astro
import SEOLayout from '../layouts/SEOLayout.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const siteSettings = await payload.getSiteSettings()
// Fetch the contact form -- assumes a form with slug 'contact' exists in the forms collection
const contactPage = await payload.getPageBySlug('contact')
---

<SEOLayout
  title={`Contact Us | ${siteSettings.siteName}`}
  description={`Get in touch with ${siteSettings.siteName}. Call ${siteSettings.phone || 'us'} or fill out our contact form.`}
  canonicalUrl={`${import.meta.env.SITE_URL || 'https://example.com'}/contact`}
  pageType="page"
>
  <h1>Contact Us</h1>
  <!-- Render Payload Form Builder form with client:visible for interactivity -->
  <!-- Phone, email, and address from SiteSettings -->
</SEOLayout>
```

**`privacy.astro`** and **`terms.astro`**: Generic CMS pages fetched from the `pages` collection by slug. The content is managed in Payload's admin panel as rich text.

```astro
---
// src/pages/privacy.astro (terms.astro follows the same pattern with slug 'terms')
import SEOLayout from '../layouts/SEOLayout.astro'
import RichText from '../components/RichText.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const page = await payload.getPageBySlug('privacy')
const siteSettings = await payload.getSiteSettings()

if (!page) return Astro.redirect('/404')
---

<SEOLayout
  title={`${page.title} | ${siteSettings.siteName}`}
  description={page.excerpt || `${page.title} for ${siteSettings.siteName}`}
  canonicalUrl={`${import.meta.env.SITE_URL || 'https://example.com'}/privacy`}
  pageType="page"
  schemaData={page}
>
  <div class="container max-w-3xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-8">{page.title}</h1>
    <RichText content={page.content} />
  </div>
</SEOLayout>
```

### 6.2.1 Homepage Modification (`index.astro`)

The existing `index.astro` must be updated from its current static "Astro Site" heading to a dynamic homepage that fetches content from Payload:

```astro
---
// src/pages/index.astro
import SEOLayout from '../layouts/SEOLayout.astro'
import BlockRenderer from '../components/blocks/BlockRenderer.astro'
import ServiceCard from '../components/ServiceCard.astro'
import TestimonialCard from '../components/TestimonialCard.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const [
  siteSettings,
  { docs: services },
  { docs: blogPosts },
  { docs: testimonials },
] = await Promise.all([
  payload.getSiteSettings(),
  payload.getAllServices({ limit: '6', sort: 'name' }),
  payload.getAllBlogPosts({ limit: '3' }),
  payload.getFeaturedTestimonials(),
])

const siteUrl = import.meta.env.SITE_URL || 'https://example.com'
---

<SEOLayout
  title={`${siteSettings.siteName} | ${siteSettings.tagline || 'Home'}`}
  description={siteSettings.tagline || ''}
  canonicalUrl={siteUrl}
  pageType="home"
  schemaData={{ settings: siteSettings }}
>
  <h1 class="sr-only">{siteSettings.siteName}</h1>

  <!-- Featured Services Grid -->
  <!-- Latest Blog Posts -->
  <!-- Featured Testimonials -->
  <!-- CTA Section -->
</SEOLayout>
```

**Key data to fetch**: featured services (up to 6), latest blog posts (up to 3), featured testimonials, and site settings. The homepage should render a hero section, services grid, recent blog posts, testimonial carousel, and a CTA section. The H1 is visually hidden (sr-only) containing the site name, with the hero block providing the visual heading.

### 6.3 Layouts

#### SEOLayout.astro

**File**: `src/layouts/SEOLayout.astro` (NEW)

```astro
---
import '../styles/global.css'
import SiteHeader from '../components/SiteHeader.astro'
import SiteFooter from '../components/SiteFooter.astro'
// NOTE: Head tags (meta, OG, Twitter, hreflang, JSON-LD) are managed directly
// in this layout's <head> section below -- no separate SEOHead component needed.
import { generateSchemas } from '../lib/seo'
import { createPayloadClient } from '@template/shared/payload'

// Fetch SiteSettings once per build (cached across pages during SSG)
// MD-1: In-memory cache ensures SiteSettings is fetched only once per build process.
// During SSG, Astro runs in a single Node process, so a module-level variable persists
// across all page renders within a single build. This avoids redundant API calls.
let _cachedSiteSettings: any = null
async function getCachedSiteSettings() {
  if (_cachedSiteSettings) return _cachedSiteSettings
  const client = createPayloadClient({
    apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  })
  _cachedSiteSettings = await client.getSiteSettings()
  return _cachedSiteSettings
}

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})
const siteSettings = await getCachedSiteSettings()

interface Props {
  title: string
  description?: string
  ogImage?: string
  ogTitle?: string
  canonicalUrl?: string
  pageType?: 'home' | 'service' | 'location' | 'service-location' | 'blog' | 'page' | 'team' | 'faq'
  schemaData?: any
  noindex?: boolean
  locale?: string
  alternateLocales?: Array<{ code: string; url: string }>
}

const {
  title,
  description = '',
  ogImage,
  ogTitle,
  canonicalUrl,
  pageType = 'page',
  schemaData,
  noindex = false,
  locale = 'en',
  alternateLocales = [],
} = Astro.props

const siteUrl = import.meta.env.SITE_URL || 'https://example.com'
const fullOgImage = ogImage?.startsWith('http') ? ogImage : ogImage ? `${siteUrl}${ogImage}` : undefined
const schemas = schemaData ? generateSchemas(pageType, schemaData, siteUrl, siteSettings) : []
---

<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- Primary Meta Tags -->
    <title>{title}</title>
    {description && <meta name="description" content={description.substring(0, 160)} />}
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    {noindex
      ? <meta name="robots" content="noindex, nofollow" />
      : <meta name="robots" content="index, follow" />
    }

    <!-- Open Graph -->
    <meta property="og:type" content={pageType === 'blog' ? 'article' : 'website'} />
    <meta property="og:title" content={ogTitle || title} />
    {description && <meta property="og:description" content={description.substring(0, 160)} />}
    {fullOgImage && <meta property="og:image" content={fullOgImage} />}
    {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
    <meta property="og:site_name" content={title.split(' | ').pop() || 'Site'} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={ogTitle || title} />
    {description && <meta name="twitter:description" content={description.substring(0, 160)} />}
    {fullOgImage && <meta name="twitter:image" content={fullOgImage} />}

    <!-- Hreflang (localization) -->
    {alternateLocales.map(({ code, url }) => (
      <link rel="alternate" hreflang={code} href={url} />
    ))}
    {alternateLocales.length > 0 && canonicalUrl && (
      <link rel="alternate" hreflang={locale} href={canonicalUrl} />
    )}
    {alternateLocales.length > 0 && canonicalUrl && (
      <link rel="alternate" hreflang="x-default" href={canonicalUrl} />
    )}

    <!-- Schema.org JSON-LD -->
    {schemas.map((schema) => (
      <script type="application/ld+json" set:html={JSON.stringify(schema)} />
    ))}
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased">
    <SiteHeader />
    <main>
      <article>
        <slot />
      </article>
    </main>
    <SiteFooter />
  </body>
</html>
```

### 6.4 Components

#### BlockRenderer.astro

**File**: `src/components/blocks/BlockRenderer.astro` (NEW)

This is an Astro-native component (not React) that server-renders each block at build time. No `client:load` directive is needed on pages that use it -- blocks are rendered as static HTML.

```astro
---
// src/components/blocks/BlockRenderer.astro
import type { Block } from '@template/shared/payload/types'
import HeroBlock from './HeroBlock.astro'
import ServiceDetailBlock from './ServiceDetailBlock.astro'
import FAQBlock from './FAQBlock.astro'
import TestimonialsBlock from './TestimonialsBlock.astro'
import CTABlock from './CTABlock.astro'
import LocationMapBlock from './LocationMapBlock.astro'
import ContentBlock from './ContentBlock.astro'
import StatsBlock from './StatsBlock.astro'
import GalleryBlock from './GalleryBlock.astro'
import PricingBlock from './PricingBlock.astro'
import TeamBlock from './TeamBlock.astro'
import RelatedLinksBlock from './RelatedLinksBlock.astro'

interface Props {
  blocks: Block[]
  context?: Record<string, any>
  baseHeadingLevel?: 2 | 3 | 4
}

const { blocks = [], context = {}, baseHeadingLevel = 2 } = Astro.props
---

{blocks.map((block, index) => {
  const key = block.id || `block-${index}`
  switch (block.blockType) {
    case 'hero':
      return <HeroBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'serviceDetail':
      return <ServiceDetailBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'faq':
      return <FAQBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'testimonials':
      return <TestimonialsBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'cta':
      return <CTABlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'locationMap':
      return <LocationMapBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'content':
      return <ContentBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'stats':
      return <StatsBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'gallery':
      return <GalleryBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'pricing':
      return <PricingBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'team':
      return <TeamBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    case 'relatedLinks':
      return <RelatedLinksBlock data={block} context={context} headingLevel={baseHeadingLevel} />
    default:
      return null
  }
})}
```

Because this is an Astro component, it runs entirely at build time (SSG) or on the server (SSR). No JavaScript is shipped to the client. Pages that use `BlockRenderer` do NOT need a `client:load` directive.

#### Block Components (12)

Each block component is an `.astro` file that receives block data as props and outputs semantic HTML. Example for `HeroBlock.astro`:

```astro
---
// src/components/blocks/HeroBlock.astro
// NOTE: All 12 block components must include `context` and `headingLevel` in their
// Props interface to support BlockRenderer's heading hierarchy and page context passing.
interface Props {
  data: {
    heading: string
    subheading?: string
    backgroundImage?: any
    cta?: { text?: string; link?: string; phone?: string }
    style?: 'centered' | 'left' | 'split' | 'fullbleed'
    overlayOpacity?: number
  }
  context?: Record<string, any>
  headingLevel?: 2 | 3 | 4
}

const { data, context = {}, headingLevel = 2 } = Astro.props
const bgUrl = typeof data.backgroundImage === 'object' ? data.backgroundImage?.sizes?.hero?.url || data.backgroundImage?.url : undefined
const overlay = data.overlayOpacity ?? 40
---

<section
  class:list={['relative py-20 px-4', {
    'text-center': data.style === 'centered' || !data.style,
    'text-left': data.style === 'left',
  }]}
>
  {bgUrl && (
    <div
      class="absolute inset-0 bg-cover bg-center"
      style={`background-image: url(${bgUrl})`}
    >
      <div class="absolute inset-0 bg-black" style={`opacity: ${overlay / 100}`}></div>
    </div>
  )}
  <div class="relative z-10 max-w-4xl mx-auto">
    <!-- Note: H1 is set by the page, not the hero block. Hero displays the heading as display text. -->
    <p class="text-4xl md:text-6xl font-bold text-white">{data.heading}</p>
    {data.subheading && <p class="mt-4 text-xl text-white/80">{data.subheading}</p>}
    {data.cta && (
      <div class="mt-8 flex gap-4 justify-center">
        {data.cta.link && (
          <a href={data.cta.link} class="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
            {data.cta.text || 'Get a Free Quote'}
          </a>
        )}
        {data.cta.phone && (
          <a href={`tel:${data.cta.phone}`} class="px-8 py-3 border border-white text-white rounded-lg font-semibold">
            Call {data.cta.phone}
          </a>
        )}
      </div>
    )}
  </div>
</section>
```

All 12 block components follow this pattern: receive typed props, output semantic HTML with proper heading levels, use Tailwind CSS for styling. Implementation guidance for each:

**`ServiceDetailBlock.astro`**: Renders service features with heading, rich text content, and feature list. Props match `ServiceDetailBlock` definition. Uses `<section>` wrapper. Feature list renders as a `<ul>` with icons (Lucide) when `layout` is `'list'`, CSS Grid cards when `'grid'`, or alternating image-text rows when `'alternating'`. Each feature's `title` is an H3 (or `baseHeadingLevel + 1`).

**`FAQBlock.astro`**: Renders FAQ items in an accordion pattern. When `source` is `'auto'`, fetch FAQs from Payload filtered by the page's service/location context. Uses `<details>`/`<summary>` for native accordion (no JavaScript needed). Each question is wrapped in `<dt>`, each answer in `<dd>` inside a `<dl>`. Generates `FAQPage` JSON-LD schema when `generateSchema` is true.

**`TestimonialsBlock.astro`**: Renders customer reviews. When `layout` is `'carousel'`, uses CSS scroll-snap (`scroll-snap-type: x mandatory` on the container, `scroll-snap-align: start` on each card) -- no JavaScript carousel library needed. `'grid'` uses CSS Grid (2-3 columns). `'stack'` renders vertically. Each testimonial shows star rating, review text, client name, and source badge. Generates `Review` schema when `generateSchema` is true.

**`CTABlock.astro`**: Call-to-action section with heading, subheading, button, and optional phone number. Renders a `<section>` with variant styling based on `style` prop. When `showForm` is true and a `form` relationship is set, renders a Payload Form Builder form (requires client-side React for form handling via `client:visible`). Background image uses the same pattern as HeroBlock.

**`LocationMapBlock.astro`**: Renders a Google Maps embed with surrounding service area info. Uses `<iframe>` with `loading="lazy"` for the map embed. The `embedUrl` should be a Google Maps Embed API URL. Shows address text and service radius. When `showNearbyLocations` is true, renders links to nearby location pages from the context's `nearbyLocations` relationship.

**`ContentBlock.astro`**: General-purpose rich text content section with optional image. Uses the `RichText.astro` component for content rendering. Image position (`left`, `right`, `above`, `below`) is handled with CSS Flexbox (`flex-row` / `flex-row-reverse` / `flex-col` / `flex-col-reverse`). Image uses `PayloadImage.astro` component with `size="card"`.

**`StatsBlock.astro`**: Renders 2-6 stat counters in a horizontal row. Uses CSS Grid with equal columns. Each stat shows the `value` in large bold text and the `label` below. Optional Lucide icon above each stat. Wrapped in a `<section>` with optional heading.

**`GalleryBlock.astro`**: Image gallery with three layout modes. `'grid'` uses CSS Grid with configurable columns (2-4). `'masonry'` uses CSS `columns` property (`column-count: N`) for a true masonry layout without JavaScript. `'carousel'` uses CSS scroll-snap (same pattern as testimonials carousel). Each image uses `PayloadImage.astro` with `size="gallery"` and is wrapped in `<figure>` with optional `<figcaption>` for captions.

**`PricingBlock.astro`**: Renders pricing tiers in a card grid. Each tier is a `<div>` card with name, price, unit, description, feature checklist, and CTA button. Highlighted tier gets a border accent and "Popular" badge. Uses CSS Grid for layout. Disclaimer text rendered at the bottom in `<small>`.

**`TeamBlock.astro`**: Renders team members. When `source` is `'all'`, fetches all team members sorted by `sortOrder`. When `'location'`, filters by the page's location context. When `'manual'`, uses the selected `members` relationship. Each member renders via `TeamMemberCard.astro` in a CSS Grid (3-4 columns). Shows photo, name, role, and optionally contact info when `showContact` is true.

**`RelatedLinksBlock.astro`**: Internal linking section. When `source` is `'auto'`, generates links from the page context's `relatedServices`, `relatedLocations`, or `relatedServicePages` relationships. Uses `<aside>` as the wrapper element (secondary content). Each link renders with title, URL, and optional description. Limited to `maxItems` links.

#### SiteHeader.astro

**File**: `src/components/SiteHeader.astro` (NEW)

Fetches published services at build time to populate the navigation dropdown. Sticky on desktop.

```astro
---
// src/components/SiteHeader.astro
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const { docs: services } = await payload.getAllServices({ sort: 'name' })
const siteSettings = await payload.getSiteSettings()
---

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <nav aria-label="Main navigation" class="container flex h-16 items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-xl">
      {typeof siteSettings.logo === 'object' && siteSettings.logo?.url && (
        <img src={siteSettings.logo.url} alt={siteSettings.siteName} class="h-8 w-auto" />
      )}
      <span>{siteSettings.siteName}</span>
    </a>

    <div class="hidden md:flex items-center gap-6">
      <!-- Services dropdown -->
      <div class="relative group">
        <a href="/services" class="font-medium hover:text-primary transition-colors" aria-haspopup="true">Services</a>
        <div class="absolute top-full left-0 pt-2 hidden group-hover:block group-focus-within:block">
          <ul class="bg-background border rounded-lg shadow-lg p-2 min-w-48">
            {services.map((service) => (
              <li>
                <a href={`/services/${service.slug}`} class="block px-4 py-2 rounded hover:bg-muted transition-colors">
                  {service.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <a href="/locations" class="font-medium hover:text-primary transition-colors">Locations</a>
      <a href="/blog" class="font-medium hover:text-primary transition-colors">Blog</a>
      <a href="/contact" class="font-medium hover:text-primary transition-colors">Contact</a>

      {siteSettings.phone && (
        <a href={`tel:${siteSettings.phone}`} class="font-semibold text-primary">
          {siteSettings.phone}
        </a>
      )}
    </div>
  </nav>
</header>
```

**Key implementation details**:
- Services are fetched at build time (SSG) -- no runtime API calls
- Phone number from SiteSettings displayed in nav for click-to-call
- Sticky positioning on desktop via `sticky top-0`
- Mobile navigation should use the existing shadcn Sheet component for a slide-out menu
- **Keyboard accessibility**: The dropdown uses `group-focus-within:block` alongside `group-hover:block` so keyboard users can tab into the dropdown. The trigger link has `aria-haspopup="true"`. For full keyboard and screen-reader support (arrow key navigation, Escape to close, ARIA roles), consider replacing this CSS-only dropdown with the existing shadcn `NavigationMenu` component (`src/components/ui/navigation-menu.tsx`), which implements the WAI-ARIA Navigation Menu pattern out of the box.

#### SiteFooter.astro

**File**: `src/components/SiteFooter.astro` (NEW)

Fetches locations and SiteSettings to render location links, contact info, social links, and copyright.

```astro
---
// src/components/SiteFooter.astro
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const { docs: locations } = await payload.getAllLocations({ sort: 'displayName', limit: '20' })
const siteSettings = await payload.getSiteSettings()
const currentYear = new Date().getFullYear()
---

<footer class="border-t bg-muted/50 mt-auto">
  <div class="container py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Brand and contact -->
      <div>
        <p class="font-bold text-lg">{siteSettings.siteName}</p>
        {siteSettings.tagline && <p class="text-muted-foreground mt-1">{siteSettings.tagline}</p>}
        {siteSettings.address && (
          <address class="mt-4 not-italic text-sm text-muted-foreground">
            {siteSettings.address.street && <span>{siteSettings.address.street}<br /></span>}
            {siteSettings.address.city}, {siteSettings.address.stateCode} {siteSettings.address.zip}
          </address>
        )}
        {siteSettings.phone && (
          <a href={`tel:${siteSettings.phone}`} class="block mt-2 text-sm font-medium">{siteSettings.phone}</a>
        )}
        {siteSettings.email && (
          <a href={`mailto:${siteSettings.email}`} class="block mt-1 text-sm text-muted-foreground">{siteSettings.email}</a>
        )}
      </div>

      <!-- Locations -->
      <div>
        <p class="font-semibold mb-3">Locations</p>
        <nav aria-label="Footer navigation - Locations">
          <ul class="space-y-2 text-sm">
            {locations.map((location) => (
              <li><a href={`/locations/${location.slug}`} class="text-muted-foreground hover:text-foreground transition-colors">{location.displayName}</a></li>
            ))}
          </ul>
        </nav>
      </div>

      <!-- Quick links -->
      <div>
        <p class="font-semibold mb-3">Company</p>
        <nav aria-label="Footer navigation - Company">
          <ul class="space-y-2 text-sm">
            <li><a href="/team" class="text-muted-foreground hover:text-foreground">Our Team</a></li>
            <li><a href="/blog" class="text-muted-foreground hover:text-foreground">Blog</a></li>
            <li><a href="/faq" class="text-muted-foreground hover:text-foreground">FAQ</a></li>
            <li><a href="/contact" class="text-muted-foreground hover:text-foreground">Contact</a></li>
            <li><a href="/privacy" class="text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
            <li><a href="/terms" class="text-muted-foreground hover:text-foreground">Terms of Service</a></li>
          </ul>
        </nav>
      </div>

      <!-- Social links -->
      <div>
        {siteSettings.socialLinks && siteSettings.socialLinks.length > 0 && (
          <>
            <p class="font-semibold mb-3">Follow Us</p>
            <div class="flex gap-3">
              {siteSettings.socialLinks.map((social) => (
                <a href={social.url} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors" aria-label={social.platform}>
                  {social.platform}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>

    <div class="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
      <p>&copy; {currentYear} {siteSettings.siteName}. All rights reserved.</p>
      {siteSettings.footerText && <p class="mt-2">{siteSettings.footerText}</p>}
    </div>
  </div>
</footer>
```

**Key implementation details**:
- Fetches locations at build time for internal linking (SEO benefit)
- Uses `<address>` element for business address (semantic HTML)
- Uses `<nav aria-label="...">` for footer navigation sections
- Social links open in new tab with `rel="noopener noreferrer"`
- Copyright year auto-generated

#### PayloadImage.astro

**File**: `src/components/PayloadImage.astro` (NEW)

Handles images from any Payload storage backend (local disk, S3, Vercel Blob):

> **MD-5: AVIF/WebP Source Generation Requires CDN Auto-Format Conversion**
>
> The `<source>` elements for AVIF and WebP below assume a CDN with automatic format conversion (e.g., Cloudflare Polish, Vercel Image Optimization, or Imgix). These CDNs intercept the `.avif` / `.webp` URL and serve the converted format automatically. **Without such a CDN, the format sources will return 404s** because Payload does not generate AVIF/WebP variants natively.
>
> If deploying without a CDN that supports auto-format conversion, set the `enableFormatSources` prop to `false` (or remove the `<source>` elements entirely). The component includes a conditional flag for this:

```astro
---
interface Props {
  image: any  // Media object or string ID
  size?: 'thumbnail' | 'card' | 'hero' | 'heroMobile' | 'gallery' | 'galleryThumb' | 'og' | 'square' | 'content'
  alt?: string
  class?: string
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'high' | 'low' | 'auto'
  widths?: number[]
  enableFormatSources?: boolean  // MD-5: Set to false if no CDN with auto-format conversion
}

const { image, size, alt, class: className, loading = 'lazy', fetchpriority, widths, enableFormatSources = true } = Astro.props

if (!image || typeof image === 'string') return null

const src = size && image.sizes?.[size]?.url
  ? image.sizes[size].url
  : image.url

const imgAlt = alt || image.alt || ''
const width = size && image.sizes?.[size]?.width ? image.sizes[size].width : image.width
const height = size && image.sizes?.[size]?.height ? image.sizes[size].height : image.height

// Build srcset for responsive images
const srcset = widths
  ? widths
      .map((w) => {
        const matchingSize = Object.values(image.sizes || {}).find(
          (s: any) => s?.width >= w
        ) as any
        return matchingSize ? `${matchingSize.url} ${matchingSize.width}w` : null
      })
      .filter(Boolean)
      .join(', ')
  : undefined
---

{image.caption ? (
  <figure>
    <picture>
      {/* AVIF/WebP sources -- only render if CDN auto-format is available (MD-5) */}
      {enableFormatSources && src && <source srcset={src.replace(/\.(jpe?g|png|webp)$/i, '.avif')} type="image/avif" />}
      {enableFormatSources && src && <source srcset={src.replace(/\.(jpe?g|png)$/i, '.webp')} type="image/webp" />}
      {/* Fallback JPEG/PNG */}
      <img
        src={src}
        alt={imgAlt}
        width={width}
        height={height}
        loading={loading}
        fetchpriority={fetchpriority}
        class={className}
        srcset={srcset}
        decoding="async"
      />
    </picture>
    <figcaption class="text-sm text-muted-foreground mt-2">{image.caption}</figcaption>
  </figure>
) : (
  <picture>
    {enableFormatSources && src && <source srcset={src.replace(/\.(jpe?g|png|webp)$/i, '.avif')} type="image/avif" />}
    {enableFormatSources && src && <source srcset={src.replace(/\.(jpe?g|png)$/i, '.webp')} type="image/webp" />}
    <img
      src={src}
      alt={imgAlt}
      width={width}
      height={height}
      loading={loading}
      fetchpriority={fetchpriority}
      class={className}
      srcset={srcset}
      decoding="async"
    />
  </picture>
)}
```

#### RichText.astro

**File**: `src/components/RichText.astro` (NEW)

Renders Payload's Lexical JSON to HTML:

```astro
---
interface Props {
  content: any  // Lexical JSON
  class?: string
}

const { content, class: className } = Astro.props

// HTML-escape text content to prevent XSS injection
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Validate URL protocol -- only allow safe protocols to prevent javascript: XSS
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid')
    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    // Relative URLs are safe (they resolve against the page origin)
    return !url.startsWith('javascript:') && !url.startsWith('data:')
  }
}

// NOTE: For production deployments, consider using a sanitizer library
// (e.g., DOMPurify or sanitize-html) for defense-in-depth against XSS.

function renderNode(node: any): string {
  if (!node) return ''

  switch (node.type) {
    case 'root':
      return (node.children || []).map(renderNode).join('')
    case 'paragraph':
      const pContent = (node.children || []).map(renderNode).join('')
      return pContent ? `<p>${pContent}</p>` : ''
    case 'heading': {
      const tag = `h${node.tag || '2'}`
      return `<${tag}>${(node.children || []).map(renderNode).join('')}</${tag}>`
    }
    case 'text': {
      let text = escapeHtml(node.text || '')
      if (node.format & 1) text = `<strong>${text}</strong>`  // bold
      if (node.format & 2) text = `<em>${text}</em>`          // italic
      if (node.format & 4) text = `<s>${text}</s>`            // strikethrough
      if (node.format & 8) text = `<u>${text}</u>`            // underline
      if (node.format & 16) text = `<code>${text}</code>`     // code
      if (node.format & 32) text = `<sub>${text}</sub>`       // subscript
      if (node.format & 64) text = `<sup>${text}</sup>`       // superscript
      return text
    }
    case 'link': {
      const href = node.fields?.url || '#'
      if (!isSafeUrl(href)) return (node.children || []).map(renderNode).join('')
      return `<a href="${escapeHtml(href)}" ${node.fields?.newTab ? 'target="_blank" rel="noopener noreferrer"' : ''}>${(node.children || []).map(renderNode).join('')}</a>`
    }
    case 'list':
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${(node.children || []).map(renderNode).join('')}</${tag}>`
    case 'listitem':
      return `<li>${(node.children || []).map(renderNode).join('')}</li>`
    case 'quote':
      return `<blockquote>${(node.children || []).map(renderNode).join('')}</blockquote>`
    case 'upload': {
      const img = node.value
      if (img?.url) {
        return `<figure><img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || '')}" loading="lazy" />${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ''}</figure>`
      }
      return ''
    }
    default:
      return (node.children || []).map(renderNode).join('')
  }
}

const html = content?.root ? renderNode(content.root) : ''
---

{html && <div class:list={['prose prose-lg max-w-none', className]} set:html={html} />}
```

#### Breadcrumbs.astro

**File**: `src/components/Breadcrumbs.astro` (NEW)

```astro
---
interface BreadcrumbItem {
  name: string
  url: string
}

interface Props {
  items: BreadcrumbItem[]
}

const { items } = Astro.props
const siteUrl = import.meta.env.SITE_URL || 'https://example.com'

// JSON-LD BreadcrumbList schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
  })),
}
---

<nav aria-label="Breadcrumb" class="text-sm text-muted-foreground py-4">
  <ol class="flex items-center gap-2">
    {items.map((item, index) => (
      <li class="flex items-center gap-2">
        {index > 0 && <span aria-hidden="true">/</span>}
        {index === items.length - 1 ? (
          <span aria-current="page">{item.name}</span>
        ) : (
          <a href={item.url} class="hover:text-foreground transition-colors">{item.name}</a>
        )}
      </li>
    ))}
  </ol>
</nav>

<script type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)} />
```

### 6.5 Preview Route

**File**: `src/pages/preview.astro` (NEW -- SSR only)

```astro
---
export const prerender = false  // SSR -- must run on every request

import SEOLayout from '../layouts/SEOLayout.astro'
import BlockRenderer from '../components/blocks/BlockRenderer.astro'
import { createPayloadClient } from '@template/shared/payload'

const url = new URL(Astro.request.url)
const collection = url.searchParams.get('collection')
const slug = url.searchParams.get('slug')
const token = url.searchParams.get('token')

// Build-time check: require PREVIEW_SECRET in non-localhost environments
const siteUrl = import.meta.env.SITE_URL || ''
const previewSecret = import.meta.env.PREVIEW_SECRET
if (!previewSecret && !siteUrl.includes('localhost')) {
  throw new Error('PREVIEW_SECRET environment variable is required in non-localhost environments')
}

// Validate preview token
// NOTE: For production, use crypto.timingSafeEqual() for timing-safe comparison
// to prevent timing attacks that could leak the secret character-by-character.
// Example: crypto.timingSafeEqual(Buffer.from(token), Buffer.from(previewSecret))
if (!previewSecret || token !== previewSecret) {
  return new Response('Unauthorized', { status: 401 })
}

if (!collection || !slug) {
  return new Response('Missing collection or slug', { status: 400 })
}

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  apiKey: import.meta.env.PAYLOAD_API_KEY,
})

// Fetch draft content (requires authenticated request)
const doc = await payload.fetchBySlug(collection, slug, 2)

if (!doc) {
  return new Response('Document not found', { status: 404 })
}
---

<SEOLayout
  title={`[PREVIEW] ${(doc as any).title || (doc as any).name || slug}`}
  noindex={true}
>
  <div class="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-center text-sm font-medium text-yellow-800">
    Preview Mode -- This page is not published
  </div>
  <article>
    <h1 class="text-4xl font-bold px-4 py-8 max-w-4xl mx-auto">
      {(doc as any).title || (doc as any).name || (doc as any).displayName}
    </h1>
    <!-- Block rendering for preview -->
    {(doc as any).layout && (
      <div class="max-w-4xl mx-auto px-4">
        <BlockRenderer blocks={(doc as any).layout || []} context={{}} />
      </div>
    )}
  </article>
</SEOLayout>
```

### 6.6 Custom 404 Page

**File**: `src/pages/404.astro` (NEW)

The 404 page must return HTTP 404 status (not 200), include `noindex`, and provide a helpful user experience.

```astro
---
// src/pages/404.astro
// Uses SEOLayout with noindex={true} so that robots meta is rendered in <head>,
// not in <body> (a nested <head> inside <body> is invalid HTML and ignored by browsers).
import SEOLayout from '../layouts/SEOLayout.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const siteSettings = await payload.getSiteSettings()
const { docs: services } = await payload.getAllServices({ limit: '5' })

// Set HTTP 404 status
Astro.response.status = 404
---

<SEOLayout
  title="Page Not Found"
  noindex={true}
>
  {/* No canonical tag on 404 pages -- SEOLayout omits it when canonicalUrl is not provided */}

  <div class="container max-w-2xl mx-auto py-20 text-center">
    {/* Brand header */}
    <p class="text-6xl font-bold text-muted-foreground">404</p>
    <h1 class="text-2xl font-semibold mt-4">Page Not Found</h1>
    <p class="text-muted-foreground mt-2">
      Sorry, the page you're looking for doesn't exist or has been moved.
    </p>

    {/* Search bar */}
    <form action="/search" method="GET" class="mt-8 max-w-md mx-auto">
      <div class="flex gap-2">
        <input
          type="search"
          name="q"
          placeholder="Search our site..."
          class="flex-1 rounded-lg border px-4 py-2"
          aria-label="Search"
        />
        <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Search
        </button>
      </div>
    </form>

    {/* Suggested links */}
    <div class="mt-10">
      <p class="font-medium mb-4">Popular Services</p>
      <ul class="space-y-2">
        {services.map((service) => (
          <li>
            <a href={`/services/${service.slug}`} class="text-primary hover:underline">
              {service.name}
            </a>
          </li>
        ))}
      </ul>
    </div>

    {/* Primary CTA */}
    <div class="mt-10">
      <a href="/" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold inline-block">
        Back to Home
      </a>
      {siteSettings.phone && (
        <p class="mt-4 text-muted-foreground">
          Or call us at <a href={`tel:${siteSettings.phone}`} class="font-medium text-foreground">{siteSettings.phone}</a>
        </p>
      )}
    </div>
  </div>
</SEOLayout>
```

**Requirements**:
- HTTP 404 status code (set via `Astro.response.status = 404`)
- `<meta name="robots" content="noindex, nofollow" />` -- prevent indexing
- No `<link rel="canonical">` tag (404 pages should not have canonicals)
- Brand header with site name
- Error message with helpful copy
- Search bar that submits to `/search`
- Suggested links (top 5 services, dynamically fetched)
- Primary CTA button (back to home)
- Phone number from SiteSettings for direct contact
- Smart URL parsing: consider parsing the failed URL path to suggest related pages (e.g., `/services/plmbing` could suggest `/services/plumbing`)

### 6.7 Sitemap and Robots.txt

**File**: `src/pages/sitemap.xml.ts` (NEW)

```typescript
import type { APIRoute } from 'astro'
import { createPayloadClient } from '@template/shared/payload'

export const GET: APIRoute = async () => {
  const payload = createPayloadClient({
    apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  })

  const [
    { docs: services },
    { docs: locations },
    { docs: servicePages },
    { docs: blogPosts },
    { docs: pages },
  ] = await Promise.all([
    payload.getAllServices(),
    payload.getAllLocations(),
    payload.getAllServicePages(),
    payload.getAllBlogPosts(),
    payload.getAllPages(),
  ])

  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  const urls = [
    // Homepage
    { loc: baseUrl, changefreq: 'weekly', priority: 1.0 },

    // Service pages
    ...services.map((s) => ({
      loc: `${baseUrl}/services/${s.slug}`,
      lastmod: s.updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.8,
    })),

    // Location pages
    ...locations.map((l) => ({
      loc: `${baseUrl}/locations/${l.slug}`,
      lastmod: l.updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.7,
    })),

    // Service x Location combo pages
    ...servicePages.map((sp) => {
      const svc = typeof sp.service === 'object' ? sp.service.slug : ''
      const loc = typeof sp.location === 'object' ? sp.location.slug : ''
      return {
        loc: `${baseUrl}/services/${svc}/${loc}`,
        lastmod: sp.updatedAt,
        changefreq: 'monthly' as const,
        priority: 0.6,
      }
    }),

    // Blog posts
    ...blogPosts.map((bp) => ({
      loc: `${baseUrl}/blog/${bp.slug}`,
      lastmod: bp.updatedAt,
      changefreq: 'weekly' as const,
      priority: 0.5,
    })),

    // CMS pages
    ...pages.map((p) => ({
      loc: `${baseUrl}/${p.slug}`,
      lastmod: p.updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.4,
    })),
  ]

  // For sites with >50,000 URLs, this should use sitemap-index.xml.ts instead
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
```

**File**: `src/pages/robots.txt.ts` (NEW)

```typescript
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin, API, and preview routes
Disallow: /admin
Disallow: /api/
Disallow: /preview
`

  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
```

### 6.8 Search Route

**File**: `src/pages/search.astro` (NEW -- SSR only)

An SSR route that queries Payload's search plugin API and returns results.

```astro
---
export const prerender = false  // SSR -- must run on every request

import SEOLayout from '../layouts/SEOLayout.astro'
import { createPayloadClient } from '@template/shared/payload'

const payload = createPayloadClient({
  apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
})

const url = new URL(Astro.request.url)
const query = url.searchParams.get('q') || ''

// Fetch search results from Payload's search plugin endpoint
// The search plugin creates a 'search' collection that indexes configured collections
let results: Array<{ doc: { relationTo: string; value: any }; title?: string; slug?: string; priority?: number }> = []
if (query.trim()) {
  try {
    const response = await payload.fetchList<any>('search', {
      'where[or][0][title][like]': query,
      limit: '20',
      sort: '-priority',
    })
    results = response.docs
  } catch {
    // Search collection may not exist if search plugin is not configured
    results = []
  }
}

// Map collection slugs to URL prefixes
function getResultUrl(result: any): string {
  const collection = result.doc?.relationTo || ''
  const slug = result.slug || ''
  switch (collection) {
    case 'services': return `/services/${slug}`
    case 'locations': return `/locations/${slug}`
    case 'service-pages': return `/services/${slug}`
    case 'blog-posts': return `/blog/${slug}`
    case 'pages': return `/${slug}`
    default: return `/${slug}`
  }
}
---

<SEOLayout title={query ? `Search: ${query}` : 'Search'} noindex={true}>
  <div class="container max-w-3xl mx-auto py-12">
    <h1 class="text-3xl font-bold mb-6">Search</h1>

    <form action="/search" method="GET" class="mb-8">
      <div class="flex gap-2">
        <input
          type="search"
          name="q"
          value={query}
          placeholder="Search services, locations, blog posts..."
          class="flex-1 rounded-lg border px-4 py-3 text-lg"
          aria-label="Search"
          autofocus
        />
        <button type="submit" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
          Search
        </button>
      </div>
    </form>

    {query && (
      <p class="text-muted-foreground mb-6">
        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>
    )}

    {results.length > 0 ? (
      <ul class="space-y-4">
        {results.map((result) => (
          <li class="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <a href={getResultUrl(result)} class="block">
              <h2 class="text-lg font-semibold text-primary">{result.title || 'Untitled'}</h2>
              <p class="text-sm text-muted-foreground mt-1 capitalize">
                {(result.doc?.relationTo || '').replace(/-/g, ' ')}
              </p>
            </a>
          </li>
        ))}
      </ul>
    ) : query ? (
      <p class="text-muted-foreground">No results found. Try a different search term.</p>
    ) : null}
  </div>
</SEOLayout>
```

### 6.9 Sitemap Index

**File**: `src/pages/sitemap-index.xml.ts` (NEW)

For sites with more than 50,000 URLs, a single sitemap file exceeds the sitemap protocol limit. This endpoint generates a sitemap index that splits URLs into sub-sitemaps of up to 50,000 URLs each.

```typescript
import type { APIRoute } from 'astro'
import { createPayloadClient } from '@template/shared/payload'

const MAX_URLS_PER_SITEMAP = 50_000

export const GET: APIRoute = async () => {
  const payload = createPayloadClient({
    apiUrl: import.meta.env.PAYLOAD_API_URL || 'http://localhost:3158/api',
  })

  const baseUrl = import.meta.env.SITE_URL || 'https://example.com'

  // Count total documents across all collections to determine if we need sub-sitemaps
  const [services, locations, servicePages, blogPosts, pages] = await Promise.all([
    payload.fetchPublished<any>('services', { limit: '1' }),
    payload.fetchPublished<any>('locations', { limit: '1' }),
    payload.fetchPublished<any>('service-pages', { limit: '1' }),
    payload.fetchPublished<any>('blog-posts', { limit: '1' }),
    payload.fetchPublished<any>('pages', { limit: '1' }),
  ])

  const totalUrls =
    services.totalDocs +
    locations.totalDocs +
    servicePages.totalDocs +
    blogPosts.totalDocs +
    pages.totalDocs +
    1 // homepage

  // If total URLs fit in a single sitemap, redirect to the standard sitemap
  if (totalUrls <= MAX_URLS_PER_SITEMAP) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/sitemap.xml` },
    })
  }

  // Generate sub-sitemap entries: one per collection, split large collections into chunks
  interface SitemapEntry {
    loc: string
    lastmod: string
  }

  const sitemaps: SitemapEntry[] = []
  const now = new Date().toISOString()

  // Static pages sitemap (homepage, team, faq, contact, etc.)
  sitemaps.push({ loc: `${baseUrl}/sitemap-static.xml`, lastmod: now })

  // Per-collection sitemaps, chunked if needed
  const collections = [
    { slug: 'services', total: services.totalDocs },
    { slug: 'locations', total: locations.totalDocs },
    { slug: 'service-pages', total: servicePages.totalDocs },
    { slug: 'blog-posts', total: blogPosts.totalDocs },
    { slug: 'pages', total: pages.totalDocs },
  ]

  for (const col of collections) {
    if (col.total === 0) continue
    const chunks = Math.ceil(col.total / MAX_URLS_PER_SITEMAP)
    for (let i = 0; i < chunks; i++) {
      sitemaps.push({
        loc: `${baseUrl}/sitemap-${col.slug}${chunks > 1 ? `-${i + 1}` : ''}.xml`,
        lastmod: now,
      })
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
```

**Implementation notes**:
- For sites under 50k URLs, redirects to the standard `sitemap.xml` endpoint
- For larger sites, generates a sitemap index pointing to per-collection sub-sitemaps
- Each sub-sitemap is capped at 50,000 URLs per the sitemap protocol specification
- The per-collection sub-sitemap endpoints (e.g., `/sitemap-service-pages-1.xml`) need corresponding route files that use paginated fetching to generate their URL sets
- The `robots.txt` should reference `/sitemap-index.xml` instead of `/sitemap.xml` when the site exceeds 50k URLs

---

## 7. SEO Implementation

This section maps requirements from the SEO playbook (`website-seo-playbook/`) to their Astro implementation.

### 7.1 Semantic HTML

**Reference**: `PROGRAMMATIC_SEO_BLUEPRINT.md`, Section 7 -- "HTML Tag Structure"

Every page rendered by Astro must use this semantic structure:

```html
<html lang="en">
  <head><!-- meta, schema, OG --></head>
  <body>
    <header>
      <nav aria-label="Main navigation"><!-- services dropdown, static links --></nav>
    </header>
    <main>
      <article>
        <h1><!-- Single H1, 20-60 chars, primary keyword --></h1>
        <section>
          <h2><!-- Major section heading --></h2>
          <p><!-- Paragraph content in <p> tags, never <div> --></p>
          <section>
            <h3><!-- Sub-section --></h3>
          </section>
        </section>
      </article>
      <aside><!-- Related links, secondary content --></aside>
    </main>
    <footer>
      <nav aria-label="Footer navigation"><!-- location links, contact --></nav>
    </footer>
  </body>
</html>
```

**SEO weight table** (from playbook):

| Element | Weight | Google Usage |
|---------|--------|-------------|
| `<main>` | Highest | Core page topic isolation |
| `<article>` | High | Self-contained indexable entity |
| `<section>` | Medium | Thematic content grouping |
| `<nav>` | Medium | Site structure understanding |
| `<aside>` | Low-Medium | Secondary content |
| `<header>` | Low | Boilerplate identification |
| `<footer>` | Low | Boilerplate identification |
| `<p>` | Required | Body content extraction |
| `<strong>` | Semantic | Key phrase importance |
| `<time>` | Date parsing | Freshness signals |

**Required semantic elements across the site**:
- `<article>` wrapper inside `<main>` in SEOLayout for all content pages (services, locations, blog posts)
- `<aside>` for `RelatedLinksBlock` (secondary/supplementary content)
- `<time datetime="YYYY-MM-DD">` for blog post dates (e.g., `<time datetime={post.publishedAt}>{formattedDate}</time>`)
- `<address>` in SiteFooter for business address (already implemented above)
- `<figure>` + `<figcaption>` in `PayloadImage.astro` when a caption is present
- `<strong>` not `<b>`, `<em>` not `<i>` -- enforced in the RichText renderer (already using bitwise format flags correctly)

**Common mistakes to avoid**:
1. Using `<div>` for paragraphs -- always use `<p>`
2. Using `<div class="heading">` instead of actual `<h2>`-`<h6>` tags
3. Multiple `<h1>` tags on a single page
4. Skipping heading levels (H1 -> H3, skipping H2)
5. Putting important content in `<footer>` or `<aside>`
6. Using `<b>` instead of `<strong>`, `<i>` instead of `<em>`

### 7.2 Heading Hierarchy

**Reference**: `PROGRAMMATIC_SEO_BLUEPRINT.md`, Section 7 -- "The Single H1 Rule"

| Tag | Count Per Page | Length | Keyword Usage |
|-----|---------------|--------|---------------|
| `<h1>` | Exactly 1 | 20-60 chars | Primary keyword required |
| `<h2>` | 3-8 typical | 30-70 chars | One secondary keyword per H2 |
| `<h3>` | 2-5 per H2 | 30-70 chars | Long-tail keywords, LSI terms |
| `<h4>` | 0-4 per H3 | 20-60 chars | Specific terms |
| `<h5>`-`<h6>` | Rare | 20-50 chars | Almost never needed |

**BlockRenderer heading level management**: The page layout sets H1. All blocks start at H2. Sub-headings within blocks use H3. The `baseHeadingLevel` prop controls this (default: 2).

H1 rules:
- Must contain the primary keyword, naturally phrased
- Must be unique across the entire site
- Related to but NOT identical to the `<title>` tag
- Must be the first heading in `<main>`

### 7.3 Meta Tags

**Reference**: `ROUTING_AND_SITEMAPS.md`, SEO Layout Component; `CANONICAL_TAGS_STRATEGY.md`

| Meta Tag | Max Length | Requirements |
|----------|-----------|-------------|
| `<title>` | 60 chars | Primary keyword near front. Format: `[Keyword] | [Brand]` |
| `<meta name="description">` | 160 chars | Primary keyword + 1-2 secondary. Compelling copy. |
| `<meta name="robots">` | -- | `index, follow` default. `noindex, nofollow` for preview/search. |
| `<link rel="canonical">` | -- | Absolute URL. Self-referencing on every indexable page. |
| `og:title` | -- | Social-optimized version of title (can differ) |
| `og:description` | -- | Same as meta description |
| `og:image` | -- | 1200x630 OG image |
| `og:url` | -- | Canonical URL |
| `twitter:card` | -- | `summary_large_image` |

**Canonical URL rules** (from `CANONICAL_TAGS_STRATEGY.md`):
- Every indexable page gets a self-referencing canonical
- Must be fully-qualified absolute URL (not relative)
- Must match the site's canonical domain format exactly
- No trailing slashes (matches `trailingSlash: 'never'` config)
- No query parameters in canonical URLs

### 7.4 Structured Data (JSON-LD)

**Reference**: `ROUTING_AND_SITEMAPS.md`, Section 2

**File**: `src/lib/seo.ts` (NEW)

```typescript
// templates/astro-site/src/lib/seo.ts

import type { SiteSettings } from '@template/shared/payload/types'

export function generateSchemas(
  pageType: string,
  data: any,
  baseUrl: string,
  siteSettings: SiteSettings,
): Record<string, any>[] {
  const schemas: Record<string, any>[] = []

  switch (pageType) {
    case 'home':
      schemas.push(generateOrganizationSchema(siteSettings, baseUrl))
      schemas.push(generateWebSiteSchema(baseUrl))
      break

    case 'service':
      schemas.push(generateServiceSchema(data, baseUrl, siteSettings))
      schemas.push(generateOrganizationSchema(siteSettings, baseUrl))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Services', url: `${baseUrl}/services` },
        { name: data.name, url: `${baseUrl}/services/${data.slug}` },
      ]))
      break

    case 'location':
      schemas.push(generateLocalBusinessSchema(data, null, baseUrl, siteSettings))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Locations', url: `${baseUrl}/locations` },
        { name: data.displayName, url: `${baseUrl}/locations/${data.slug}` },
      ]))
      break

    case 'service-location': {
      const { service, location, page } = data
      schemas.push(generateLocalBusinessSchema(location, service, baseUrl, siteSettings))
      schemas.push(generateServiceSchema(service, baseUrl, siteSettings))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Services', url: `${baseUrl}/services` },
        { name: service?.name, url: `${baseUrl}/services/${service?.slug}` },
        { name: location?.displayName, url: `${baseUrl}/services/${service?.slug}/${location?.slug}` },
      ]))
      break
    }

    case 'blog':
      schemas.push(generateArticleSchema(data, baseUrl))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Blog', url: `${baseUrl}/blog` },
        { name: data.title, url: `${baseUrl}/blog/${data.slug}` },
      ]))
      break

    // MD-8: FAQ page generates FAQPage schema with all FAQs
    case 'faq':
      if (data.faqs && Array.isArray(data.faqs)) {
        schemas.push(generateFAQSchema(data.faqs))
      }
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'FAQ', url: `${baseUrl}/faq` },
      ]))
      break

    // MD-8: Generic page generates BreadcrumbList only
    case 'page':
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: data.title || data.name || '', url: `${baseUrl}/${data.slug || ''}` },
      ]))
      break
  }

  return schemas
}

export function generateServiceSchema(service: any, baseUrl: string, siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': service.schemaType || 'Service',
    name: service.name,
    description: service.shortDescription,
    url: `${baseUrl}/services/${service.slug}`,
    image: typeof service.featuredImage === 'object' ? service.featuredImage?.url : undefined,
    provider: {
      '@type': 'LocalBusiness',
      name: siteSettings.siteName,
      url: baseUrl,
    },
    ...(service.pricing?.showPricing && {
      offers: {
        '@type': 'Offer',
        priceRange: service.pricing.priceRange,
      },
    }),
  }
}

export function generateLocalBusinessSchema(location: any, service: any, baseUrl: string, siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: service ? `${siteSettings.siteName} - ${location.displayName}` : siteSettings.siteName,
    url: service
      ? `${baseUrl}/services/${service.slug}/${location.slug}`
      : `${baseUrl}/locations/${location.slug}`,
    description: service
      ? `${service.name} services in ${location.displayName}`
      : `Services in ${location.displayName}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.city,
      addressRegion: location.stateCode,
    },
    ...(location.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      },
    }),
    areaServed: {
      '@type': 'City',
      name: location.city,
    },
  }
}

export function generateFAQSchema(faqs: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: typeof faq.answer === 'string' ? faq.answer : extractTextFromRichText(faq.answer),
      },
    })),
  }
}

export function generateReviewSchema(testimonials: any[], siteSettings: SiteSettings) {
  if (!testimonials.length) return null
  const ratings = testimonials.map((t) => t.rating).filter(Boolean)
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteSettings.siteName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: testimonials.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: testimonials.map((t) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.clientName },
      reviewRating: { '@type': 'Rating', ratingValue: t.rating },
      reviewBody: t.review,
      datePublished: t.date,
    })),
  }
}

export function generateArticleSchema(post: any, baseUrl: string) {
  // Resolve author: use authorOverride (plain text fallback) if set,
  // otherwise use the related team member's name and URL.
  const authorObj = typeof post.author === 'object' ? post.author : null
  const authorName = post.authorOverride || authorObj?.name || 'Staff'
  const authorUrl = authorObj?.slug ? `${baseUrl}/team#${authorObj.slug}` : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    url: `${baseUrl}/blog/${post.slug}`,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
    },
    image: typeof post.featuredImage === 'object' ? post.featuredImage?.url : undefined,
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationSchema(settings: SiteSettings, baseUrl: string) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: baseUrl,
    logo: typeof settings?.logo === 'object' ? settings.logo?.url : undefined,
    ...(settings?.phone && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: settings.phone,
        contactType: 'customer service',
      },
    }),
    ...(settings?.socialLinks && {
      sameAs: settings.socialLinks.map((s: any) => s.url),
    }),
  }

  // Merge in the businessSchema JSON field from SiteSettings.
  // This allows clients to override @type (e.g., to "LocalBusiness"),
  // add priceRange, openingHours, areaServed, etc.
  if (settings?.businessSchema && typeof settings.businessSchema === 'object') {
    return { ...baseSchema, ...settings.businessSchema }
  }

  return baseSchema
}

export function generateWebSiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function extractTextFromRichText(richText: any): string {
  if (!richText?.root?.children) return ''
  return richText.root.children
    .map((node: any) => {
      if (node.type === 'paragraph') {
        return node.children?.map((child: any) => child.text || '').join('') || ''
      }
      return ''
    })
    .join(' ')
    .trim()
}
```

**Required Schema Types by Page** (from playbook):

| Page Type | Required Schemas |
|-----------|-----------------|
| Homepage | `Organization`, `WebSite` + `SearchAction` |
| Service page | `Service`, `BreadcrumbList`, `Organization` |
| Location page | `LocalBusiness`, `BreadcrumbList`, `GeoCoordinates` |
| Service x Location page | `LocalBusiness`, `Service`, `BreadcrumbList`, `AreaServed` |
| Blog post | `Article`, `BreadcrumbList`, `Author` |
| Any page with FAQ block | + `FAQPage` |
| Any page with testimonials | + `AggregateRating`, `Review` |

### 7.5 Keyword Strategy

**Reference**: `PROGRAMMATIC_SEO_BLUEPRINT.md`, Section 7 -- "Keyword Strategy"

**Keyword placement map** (highest to lowest weight):

1. `<title>` tag -- primary keyword MUST appear, ideally near front
2. `<h1>` tag -- primary keyword MUST appear, natural phrasing
3. `<meta name="description">` -- primary + 1-2 secondary keywords
4. URL slug -- primary keyword in path
5. `<h2>` tags -- one secondary keyword per H2, varied
6. `<h3>` tags -- long-tail keywords, LSI terms
7. First 100 words of body -- primary keyword in opening paragraph
8. Image alt text -- relevant keywords naturally
9. Internal link anchor text -- keyword-rich, varied
10. FAQ questions and answers -- long-tail keywords
11. Schema.org data -- name, description, areaServed
12. Body text throughout -- 3-5x primary, 1-2x each secondary

**Keyword density guidelines**:

| Type | Frequency | Where |
|------|-----------|-------|
| Primary (exact match) | 3-5x per page | Title, H1, first paragraph, body |
| Primary (variations) | 5-8x per page | H2s, H3s, body |
| Secondary | 1-2x each | H2/H3, body paragraphs |
| Long-tail | 1x each | FAQ questions, H3s |
| LSI/semantic | Unlimited | Throughout (safe zone) |
| Geo-modifiers | 5-10x per page | Vary format |

### 7.6 Image SEO

**Reference**: `IMAGE_SEO_STRATEGY.md`

**Filename pattern**: `{service-slug}-{city}-{state-abbr}-{descriptor}.{ext}`

**Alt text rules**:
- Max 125 characters
- Descriptive, include relevant keyword naturally
- Never keyword-stuff
- Empty alt (`alt=""`) for decorative images only

**Format strategy**: AVIF > WebP > JPEG (use `<picture>` element for negotiation)

**Dimension table** (from playbook):

| Context | Width | Height | Aspect |
|---------|-------|--------|--------|
| Hero image | 1920 | 1080 | 16:9 |
| Service card | 600 | 400 | 3:2 |
| Gallery | 1200 | 800 | 3:2 |
| OG image | 1200 | 630 | 1.91:1 |
| Team photo | 400 | 400 | 1:1 |
| Thumbnail | 400 | 300 | 4:3 |

**Loading strategy**:
- Hero/above-fold images: `loading="eager"` + `fetchpriority="high"`
- Everything else: `loading="lazy"` + `decoding="async"`

**Compression targets**:
- AVIF: quality 55, effort 4
- WebP: quality 80
- JPEG: quality 82 (mozjpeg)
- Max file size: 200KB per image

### 7.7 Internal Linking

**Reference**: `PROGRAMMATIC_SEO_BLUEPRINT.md`, Section 10

**Pillar-cluster linking architecture**:
- Service pillar page (`/services/plumbing`) links to all location cluster pages (`/services/plumbing/austin-tx`)
- Each cluster page links back to its pillar
- Cluster pages cross-link to nearby location variants
- Blog posts link to relevant service and location pages

**Anchor text rules**:
- Use keyword-rich anchor text (not "click here")
- Vary anchor text for the same destination
- Contextual placement within body paragraphs (not just lists)

**Implementation**: The `RelatedLinksBlock` handles auto-generated internal links. Manual links also added via the `relatedServices`, `relatedLocations`, and `relatedServicePages` relationship fields.

### 7.8 Content Uniqueness

**Reference**: `PROGRAMMATIC_SEO_BLUEPRINT.md`, Section 8

**The 50-60% differentiation rule**: Every page must be at least 50-60% unique from every other page. Google's helpful content system deindexes thin/duplicate content.

**Three-layer strategy**:
- Layer 1: Structural variation (10-15%) -- different block combinations per page type
- Layer 2: Dynamic data-driven content (15-20%) -- location-specific FAQs, testimonials, team members
- Layer 3: Unique written content (25-30%) -- unique intro paragraph per page (AI-generated or manual)

**Quality scoring**: 0-100 scale in `contentQualityScore` field. Action table:

| Score Range | Status | Action Required |
|-------------|--------|-----------------|
| 0-30 | Will be deindexed | Complete rewrite required. Do not publish. |
| 31-50 | At risk | Needs unique intro paragraph + location-specific content. Add local FAQs, testimonials. |
| 51-70 | Acceptable | Monitor search performance. Prioritize for enrichment when capacity allows. |
| 71-85 | Good | Prioritize for internal linking. Use as targets for blog cross-links. |
| 86-100 | Excellent | Use as pillar pages. Feature in navigation. Build content clusters around these. |

**Hard rule**: Never publish pages with `contentQualityScore` below 50. Pages scoring 0-30 should be deleted or completely rewritten -- they will drag down the site's overall quality signal.

### 7.9 Performance Budget

**Reference**: `PAGE_EXPERIENCE_SIGNALS.md`

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | less than or equal to 2.5s |
| INP (Interaction to Next Paint) | less than or equal to 200ms |
| CLS (Cumulative Layout Shift) | less than or equal to 0.1 |
| Total JavaScript | max 170KB compressed |
| Total CSS | max 55KB compressed |
| Largest image | max 200KB |
| Total fonts | max 100KB |
| Time to First Byte | less than 800ms |

Astro's zero-JS-by-default architecture makes these budgets achievable. Only components with `client:load` or `client:visible` directives ship JavaScript.

---

## 8. Rebuild and Deploy Pipeline

### 8.1 Three Trigger Modes

Configured in `SiteSettings.rebuildMode`:

**Manual** (`'manual'`):
- Deploy button in Payload admin panel
- CLI command: `pnpm build:astro` or `curl -X POST <webhookUrl>`
- Used for clients who want full control over when changes go live

**Auto** (`'auto'`):
- Payload `afterChange` hook fires webhook on every publish/unpublish
- 30-second debounce window batches rapid changes
- Used for clients with low content volume who want instant publishing

**Auto with Review** (`'auto-review'`):
- Auto-triggers for single document publish/unpublish
- Queues bulk operations (CSV import, batch updates) for manual review
- Used for clients doing both day-to-day edits and periodic bulk updates

### 8.2 Webhook Design

**File**: `src/webhooks/rebuild-handler.ts` (NEW -- in Next.js app)

```typescript
import type { PayloadHandler } from 'payload'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const triggerRebuild = async (webhookUrl: string) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(async () => {
    try {
      await fetch(webhookUrl, { method: 'POST' })
      console.log(`[Rebuild] Triggered deploy at ${webhookUrl}`)
    } catch (error) {
      console.error('[Rebuild] Failed to trigger deploy:', error)
    }
  }, 30_000) // 30-second debounce
}
```

> **MD-6: Serverless Environment Note**
>
> The module-level `debounceTimer` above only works in persistent server environments (VPS, Docker, long-running Node process). In serverless environments (Vercel Functions, Cloudflare Workers), each invocation runs in an isolated context -- the module-level variable is not shared across requests.
>
> For serverless deployments:
> - **Vercel**: Use Vercel's built-in deploy hook deduplication (deploy hooks automatically ignore duplicate triggers within a short window)
> - **Cloudflare Workers**: Implement rate-limiting at the webhook receiver using Durable Objects or KV for state
> - **General**: Move the debounce logic to an external store (Redis, KV) or rely on the hosting platform's native deduplication

**Per hosting platform**:

| Platform | Webhook URL Format | Setup |
|----------|-------------------|-------|
| Vercel | `https://api.vercel.com/v1/integrations/deploy/<HOOK_ID>` | Project Settings > Git > Deploy Hooks |
| Cloudflare Pages | `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<HOOK_ID>` | Pages project settings |
| Self-hosted VPS | `http://your-server:9000/hooks/rebuild` | Custom webhook listener (e.g., `webhook` or `adnanh/webhook`) |
| Hostinger VPS | `http://your-hostinger-vps:9000/hooks/rebuild` | Same as self-hosted VPS -- install `adnanh/webhook` or a Node.js listener that runs `pnpm build:astro` on POST. Use Hostinger's SSH access to set up the listener as a systemd service. |

#### Concurrent Build Behavior by Platform

When multiple content changes trigger rapid successive builds, each platform handles concurrency differently:

- **Vercel**: Queues builds sequentially. If a new build is triggered while one is in progress, it queues and the latest build wins (previous queued builds are skipped). No risk of concurrent artifact corruption.
- **Cloudflare Pages**: Cancels any in-progress build and starts the new one. This means rapid edits may cause several cancelled builds before one completes. The 30-second debounce in the webhook handler mitigates this.
- **Self-hosted (VPS/Docker)**: No built-in concurrency protection. **Recommend implementing a build lockfile** (e.g., check for `/tmp/astro-build.lock` before starting, create it at build start, remove on completion) to prevent concurrent builds from corrupting the output directory. Example: `flock -n /tmp/astro-build.lock pnpm build:astro || echo "Build already in progress, skipping"`.

### 8.2.1 afterChange Hook for Auto-Rebuild

**File**: `src/hooks/trigger-rebuild.ts` (NEW)

This hook is added to all content collections that should trigger a rebuild when published, updated, or deleted:

```typescript
import type { CollectionAfterChangeHook } from 'payload'
import { triggerRebuild } from '../webhooks/rebuild-handler'

const CONTENT_COLLECTIONS = [
  'services', 'locations', 'service-pages', 'blog-posts',
  'faqs', 'testimonials', 'team-members', 'pages',
]

export const triggerRebuildAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only trigger on publish, unpublish, or delete
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc?._status === 'published'
  const statusChanged = wasPublished !== isPublished

  if (!statusChanged && operation !== 'delete') return doc

  // Fetch rebuild config from SiteSettings
  const siteSettings = await req.payload.findGlobal({ slug: 'site-settings' })
  const { rebuildMode, webhookUrl } = siteSettings

  if (!webhookUrl) return doc

  switch (rebuildMode) {
    case 'auto':
      // Always trigger rebuild (with debounce)
      await triggerRebuild(webhookUrl)
      break

    case 'auto-review':
      // Auto for single edits, queue for bulk operations
      // Check if this is part of a bulk operation by looking at the request context
      const isBulkOperation = (req as any)._bulkOperation === true
      if (isBulkOperation) {
        console.log(`[Rebuild] Queued: bulk operation on ${collection.slug}/${doc.id}`)
        // Bulk operations are queued -- admin must manually trigger via Deploy Button
      } else {
        await triggerRebuild(webhookUrl)
      }
      break

    case 'manual':
    default:
      // No auto-rebuild -- admin uses Deploy Button or CLI
      break
  }

  return doc
}
```

Add this hook to each content collection's `hooks.afterChange` array:

```typescript
// In Services.ts, Locations.ts, ServicePages.ts, BlogPosts.ts, etc.
import { triggerRebuildAfterChange } from '../hooks/trigger-rebuild'

hooks: {
  beforeChange: [autoGenerateSlug],
  afterChange: [triggerRebuildAfterChange],
},
```

### 8.3 Admin Deploy Button

**File**: `src/components/DeployButton.tsx` (NEW -- Payload admin custom component)

A React component rendered in the Payload admin dashboard that calls the rebuild webhook when clicked. Registered via Payload's `admin.components` config.

```tsx
// src/components/DeployButton.tsx
'use client'

import React, { useState } from 'react'

const DeployButton: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')

  const handleDeploy = async () => {
    setStatus('deploying')
    try {
      // Fetch the webhook URL from SiteSettings via the Payload REST API
      const settingsRes = await fetch('/api/globals/site-settings')
      const settings = await settingsRes.json()
      const { webhookUrl } = settings

      if (!webhookUrl) {
        alert('No webhook URL configured in Site Settings.')
        setStatus('error')
        return
      }

      // Fire the deploy webhook
      const res = await fetch(webhookUrl, { method: 'POST' })
      if (res.ok) {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error('Deploy failed:', err)
      setStatus('error')
    }
  }

  return (
    <button
      onClick={handleDeploy}
      disabled={status === 'deploying'}
      style={{
        padding: '8px 16px',
        backgroundColor: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: status === 'deploying' ? 'wait' : 'pointer',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {status === 'idle' && 'Deploy Astro Site'}
      {status === 'deploying' && 'Deploying...'}
      {status === 'success' && 'Deploy Triggered!'}
      {status === 'error' && 'Deploy Failed - Retry'}
    </button>
  )
}

export default DeployButton
```

**Register in `payload.config.ts`** via admin components:

```typescript
// In buildConfig:
admin: {
  components: {
    // Add the deploy button to the admin dashboard
    afterDashboard: ['/src/components/DeployButton'],
  },
  // ... rest of admin config
},
```

### 8.4 Build Optimization for Large Sites

For sites with 100k+ pages:

**Paginated getStaticPaths()**: Fetch pages in batches of 1000 to avoid API timeouts and memory issues.

```typescript
export async function getStaticPaths() {
  const payload = createPayloadClient({ apiUrl: '...' })
  const allPaths = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await payload.fetchPaginated('service-pages', page, 1000, {
      'where[_status][equals]': 'published',
    })
    allPaths.push(...result.docs.map((sp) => ({
      params: {
        service: typeof sp.service === 'object' ? sp.service.slug : '',
        city: typeof sp.location === 'object' ? sp.location.slug : '',
      },
    })))
    hasMore = result.hasNextPage
    page++
  }

  return allPaths
}
```

**API response caching during build**: Use a simple in-memory cache to avoid re-fetching the same data (e.g., SiteSettings) on every page.

---

## 9. Environment Variables

### Complete Variable Matrix

| Variable | Template | Purpose | Required | Example |
|----------|----------|---------|----------|---------|
| `URL_PATTERN` | Astro | URL structure: `service-first` or `location-first` | No | `service-first` |
| `PAYLOAD_API_URL` | Astro | Payload CMS REST API base URL | Yes | `http://localhost:3158/api` |
| `PAYLOAD_API_KEY` | Astro | API key for authenticated requests (preview) | No | `abc123...` |
| `SITE_URL` | Astro | Canonical site URL for SEO | Yes (prod) | `https://clientsite.com` |
| `PUBLIC_ASTRO_URL` | Next.js | Astro site URL for Live Preview | No | `http://localhost:4400` |
| `PREVIEW_SECRET` | Astro | Token for preview route validation | No | `my-preview-secret` |
| `DATABASE_URL` | Next.js | Supabase Postgres connection string | Yes | `postgresql://...` |
| `PAYLOAD_SECRET` | Next.js | Payload encryption secret | Yes (prod) | `random-32-chars` |
| `NEXT_PUBLIC_SERVER_URL` | Next.js | Next.js public URL | Yes | `http://localhost:3158` |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js | Supabase anonymous key | Yes | `eyJ...` |
| `PUBLIC_SUPABASE_URL` | Astro | Supabase project URL (Astro prefix) | If using Supabase | `https://xxx.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Astro | Supabase anonymous key (Astro prefix) | If using Supabase | `eyJ...` |
| `SENTRY_DSN` | Both | Sentry error tracking DSN | No | `https://xxx@sentry.io/xxx` |
| `S3_BUCKET` | Next.js | S3 media storage bucket | If using S3 | `media-uploads` |
| `BLOB_READ_WRITE_TOKEN` | Next.js | Vercel Blob storage token | If using Vercel Blob | `vercel_blob_...` |
| `RESEND_API_KEY` | Next.js | Resend email API key | If using email | `re_...` |
| `STRIPE_SECRET_KEY` | Next.js | Stripe payment processing | If using payments | `sk_...` |
| `TWENTY_API_URL` | Next.js | Twenty CRM API URL | If using CRM | `http://localhost:3001` |

---

## 10. Error Handling and Edge Cases

### 10.1 Payload Unreachable

**During build (SSG)**: Build fails with clear error message. This is correct behavior -- if Payload is down, static pages cannot be generated. The build should not silently produce empty pages.

```typescript
// In shared payload client
if (!response.ok) {
  throw new Error(
    `Payload API error: ${response.status} ${response.statusText} at ${endpoint}`
  )
}
```

**During runtime (SSR preview/search)**: Return a user-friendly error page, not a crash. Log to Sentry.

### 10.2 Empty Collections

When a collection has zero published documents, `getStaticPaths()` returns an empty array. Astro handles this gracefully -- no pages are generated for that route pattern. Listing pages (`/services/`, `/locations/`) should show a "No content yet" message rather than a blank page.

### 10.3 Missing Slugs

If a slug parameter does not match any document, redirect to 404:
```astro
const service = await payload.getServiceBySlug(slug!)
if (!service) return Astro.redirect('/404')
```

### 10.4 Invalid Preview Tokens

The preview route validates the token before fetching content. Invalid tokens receive a 401 response.

### 10.5 Locale Fallback

Payload is configured with `fallback: true`. If a document does not have a translation for the requested locale, Payload returns the default locale (`en`) content. The Astro route passes the locale to SEOLayout for correct `lang` attribute and `hreflang` tags.

### 10.6 Image Source Mismatch

The `PayloadImage.astro` component handles three storage backends:
- Local disk: URLs start with `/api/media/` or `/media/`
- S3: Full HTTPS URLs
- Vercel Blob: Full HTTPS URLs

The component detects the URL pattern and renders accordingly. If the image object is a string (unpopulated relationship), it renders nothing.

---

## 11. Localization

### URL Prefixing Strategy

Optional per project. When enabled:

```
/services/plumbing          -> English (default, no prefix)
/es/services/plumbing       -> Spanish
/fr/services/plumbing       -> French
```

### getStaticPaths() for Locales

```typescript
export async function getStaticPaths() {
  const locales = ['en', 'es', 'fr']  // From project config
  const { docs: services } = await payload.getAllServices()

  return services.flatMap((service) =>
    locales.map((locale) => ({
      params: {
        locale: locale === 'en' ? undefined : locale,
        slug: service.slug,
      },
    }))
  )
}
```

### Hreflang Output

In SEOLayout, when `alternateLocales` are provided:
```html
<link rel="alternate" hreflang="en" href="https://example.com/services/plumbing" />
<link rel="alternate" hreflang="es" href="https://example.com/es/services/plumbing" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/services/plumbing" />
<link rel="alternate" hreflang="x-default" href="https://example.com/services/plumbing" />
```

---

## 12. CI/CD Updates

### GitHub Actions Changes

**File**: `.github/workflows/validate.yml` (MODIFY)

Add validation steps for new collections and blocks:

```yaml
- name: Verify new collection files exist
  run: |
    for file in Services Locations ServicePages BlogPosts FAQs Testimonials TeamMembers; do
      test -f templates/next-app/src/collections/${file}.ts || (echo "Missing: ${file}.ts" && exit 1)
    done

- name: Verify block files exist
  run: |
    for file in Hero ServiceDetail FAQ Testimonials CTA LocationMap Content Stats Gallery Pricing Team RelatedLinks; do
      test -f templates/next-app/src/blocks/${file}.ts || (echo "Missing: ${file}.ts" && exit 1)
    done

- name: Verify shared payload client
  run: |
    test -f packages/shared/src/payload/client.ts || (echo "Missing payload client" && exit 1)
    test -f packages/shared/src/payload/types.ts || (echo "Missing payload types" && exit 1)

- name: Verify Astro route structure
  run: |
    test -f templates/astro-site/src/pages/services/index.astro
    test -f templates/astro-site/src/pages/services/\[slug\].astro
    test -f templates/astro-site/src/pages/locations/index.astro
    test -f templates/astro-site/src/pages/blog/index.astro
    test -f templates/astro-site/src/pages/sitemap.xml.ts
    test -f templates/astro-site/src/pages/robots.txt.ts
```

---

## 13. Project Setup Changes

### init-project.sh Updates

Add prompts for Payload integration options:
- Ask if project uses Payload CMS integration (y/n)
- If yes, add `PAYLOAD_API_URL` to `.env.local` for the Astro site
- Set `PUBLIC_ASTRO_URL` in Next.js `.env.local`
- Generate a `PREVIEW_SECRET` and add to both `.env.local` files

### create-project.mjs Wizard Updates

Add a step in the interactive wizard:
- "Enable Payload CMS integration?" (checkbox)
- If enabled, show options:
  - URL structure: Service-first (default) or Location-first
  - Rebuild mode: Manual / Auto / Auto with Review
  - Localization: Enable (en/es/fr) or Disable

---

## 14. Testing and Verification

### 14.1 Build Verification

After each implementation phase, verify the Astro site builds successfully:

```bash
# Must complete without errors
pnpm build:astro
```

### 14.2 Page Count Verification

After build, check that the expected number of pages were generated:

```bash
# Count generated HTML files
find templates/astro-site/dist -name "*.html" | wc -l

# Expected counts (example with 10 services, 50 locations, 500 service pages, 20 blog posts):
# - 10 service pages + 1 index = 11
# - 50 location pages + 1 index = 51
# - 500 service x location pages = 500
# - 20 blog posts + 1 index = 21
# - Static pages: home, team, faq, contact, privacy, terms, 404 = 7
# - Total: ~590 pages
```

### 14.3 SEO Validation

```bash
# Lighthouse audit (requires Chrome and lighthouse CLI)
npx lighthouse http://localhost:4400 --only-categories=seo,performance,accessibility --output=json

# Google Rich Results Test (manual)
# https://search.google.com/test/rich-results -- paste any page URL
```

### 14.4 Schema Validation

```bash
# Validate JSON-LD output from built pages
# Extract JSON-LD from a built page and validate against schema.org
node -e "
const fs = require('fs');
const html = fs.readFileSync('templates/astro-site/dist/services/plumbing/index.html', 'utf-8');
const ldMatch = html.match(/<script type=\"application\/ld\+json\">(.*?)<\/script>/gs);
if (ldMatch) ldMatch.forEach(m => {
  const json = m.replace(/<\/?script[^>]*>/g, '');
  console.log(JSON.parse(json));
});
"
```

### 14.5 Payload Client Connectivity

```bash
# Smoke test: verify Payload API is reachable from Astro
curl -s http://localhost:3158/api/services?limit=1 | jq '.totalDocs'
```

### 14.6 H1 Validation

Scan all built HTML pages to ensure exactly one `<h1>` per page:

```bash
# Check for pages with zero or multiple H1 tags
for file in $(find templates/astro-site/dist -name "*.html"); do
  count=$(grep -c '<h1' "$file")
  if [ "$count" -ne 1 ]; then
    echo "WARNING: $file has $count <h1> tags (expected 1)"
  fi
done
```

### 14.7 Per-Phase Verification Commands

| Phase | Verification Command | Expected Result |
|-------|---------------------|-----------------|
| Phase 1 (Payload) | `pnpm dev:next` then visit `/admin` | All 7 new collections visible in admin panel |
| Phase 2 (Shared) | `pnpm tsc --noEmit -p packages/shared` | No TypeScript errors |
| Phase 3 (Astro config) | `pnpm build:astro` (empty content) | Build succeeds with 0 dynamic pages |
| Phase 4 (Routes) | `pnpm build:astro` (with seed data) | All routes generate expected pages |
| Phase 5 (Components) | Visual inspection at `http://localhost:4400` | All blocks render correctly |
| Phase 6 (Deploy) | Click Deploy Button in admin | Webhook fires, build triggers |
| Phase 7 (CI/CD) | Push to branch, check Actions | Validation workflow passes |

---

## 15. Implementation Checklist

### Phase 1: Payload Collections and Blocks

- [ ] Create `src/hooks/auto-generate-slug.ts`
- [ ] Create `src/hooks/auto-generate-service-page-slug.ts`
- [ ] Create `src/hooks/trigger-rebuild.ts`
- [ ] Create `src/blocks/` directory with all 12 block files + `index.ts`
- [ ] Create `src/collections/Services.ts`
- [ ] Create `src/collections/Locations.ts`
- [ ] Create `src/collections/ServicePages.ts`
- [ ] Create `src/collections/BlogPosts.ts`
- [ ] Create `src/collections/FAQs.ts`
- [ ] Create `src/collections/Testimonials.ts`
- [ ] Create `src/collections/TeamMembers.ts`
- [ ] Create `src/globals/SiteSettings.ts`
- [ ] Modify `src/collections/Media.ts` (add imageSizes and mimeTypes)
- [ ] Modify `src/collections/index.ts` (export new collections)
- [ ] Modify `src/payload.config.ts` (add collections, globals, update livePreview)
- [ ] Modify `src/plugins/index.ts` (add new collections to all plugins)
- [ ] Run Payload to generate migrations and verify schema

### Phase 2: Shared Package

- [ ] Create `packages/shared/src/payload/` directory
- [ ] Create `packages/shared/src/payload/types.ts`
- [ ] Create `packages/shared/src/payload/client.ts`
- [ ] Modify `packages/shared/package.json` (add export map entries)

### Phase 3: Astro Configuration

- [ ] Modify `templates/astro-site/astro.config.mjs` (output hybrid, site, trailingSlash)
- [ ] Modify `templates/astro-site/package.json` (add adapter dependency if needed)

### Phase 4: Astro Routes

- [ ] Create `src/pages/services/index.astro`
- [ ] Create `src/pages/services/[slug].astro`
- [ ] Create `src/pages/services/[service]/[city].astro`
- [ ] Create `src/pages/locations/index.astro`
- [ ] Create `src/pages/locations/[city].astro`
- [ ] Create `src/pages/blog/index.astro`
- [ ] Create `src/pages/blog/[slug].astro`
- [ ] Create `src/pages/team.astro`
- [ ] Create `src/pages/faq.astro`
- [ ] Create `src/pages/contact.astro`
- [ ] Create `src/pages/privacy.astro`
- [ ] Create `src/pages/terms.astro`
- [ ] Create `src/pages/404.astro` (HTTP 404 status, noindex, search bar, suggested links, CTA, phone number)
- [ ] Create `src/pages/preview.astro` (SSR)
- [ ] Create `src/pages/search.astro` (SSR)
- [ ] Create `src/pages/sitemap.xml.ts`
- [ ] Create `src/pages/sitemap-index.xml.ts`
- [ ] Create `src/pages/robots.txt.ts`
- [ ] Modify `src/pages/index.astro` (see homepage modification notes below)

### Phase 5: Astro Components

- [ ] Create `src/layouts/SEOLayout.astro`
- [ ] Create `src/lib/seo.ts`
- [ ] Create `src/components/SiteHeader.astro`
- [ ] Create `src/components/SiteFooter.astro`
- [ ] Create `src/components/Breadcrumbs.astro`
- [ ] Create `src/components/PayloadImage.astro`
- [ ] Create `src/components/RichText.astro`
- [ ] ~~`FAQSection.astro`~~ -- Removed. `FAQBlock.astro` covers the FAQ accordion use case within the block system. The standalone `/faq` page route renders FAQs directly using `FAQBlock.astro` with `source: 'auto'`, so a separate `FAQSection.astro` component is unnecessary.
- [ ] Create `src/components/TestimonialCard.astro`
- [ ] Create `src/components/TeamMemberCard.astro`
- [ ] Create `src/components/ServiceCard.astro`
- [ ] Create `src/components/LocationCard.astro`
- [ ] Create `src/components/blocks/BlockRenderer.astro`
- [ ] Create all 12 block `.astro` components

### Phase 6: Deploy Pipeline

- [ ] Create `src/webhooks/rebuild-handler.ts` (in Next.js)
- [ ] Create `src/components/DeployButton.tsx` (Payload admin)
- [ ] Add afterChange hooks to content collections for auto-rebuild (see Section 8.2)

### Phase 7: CI/CD and Setup

- [ ] Modify `.github/workflows/validate.yml`
- [ ] Modify `.env.template` (add new variables)
- [ ] Modify `scripts/init-project.sh` (add Payload integration setup)
- [ ] Modify `scripts/create-project.mjs` (add wizard options)

---

## 16. Reference

### SEO Playbook Files

All files in `website-seo-playbook/`:

| File | Sections Referenced |
|------|-------------------|
| `PROGRAMMATIC_SEO_BLUEPRINT.md` | Architecture (Sec 2), Collections (Sec 4), Blocks (Sec 5), Routing (Sec 6), SEO (Sec 7), Content Uniqueness (Sec 8), Pillar Pages (Sec 10), Deployment (Sec 15) |
| `CMS_COLLECTIONS_AND_BLOCKS.md` | Plugin config (Sec 1), All 8 collection definitions (Sec 2), All 12 block definitions (Sec 3) |
| `ROUTING_AND_SITEMAPS.md` | Payload API helpers, dynamic routes, sitemap generation, Schema.org generators, SEO layout |
| `URL_STRUCTURE_RULES.md` | Slug rules, URL depth, trailing slash, stop words, location URL patterns |
| `IMAGE_SEO_STRATEGY.md` | File naming, format strategy, dimension table, alt text, compression |
| `PAGE_EXPERIENCE_SIGNALS.md` | Core Web Vitals thresholds, performance budgets, font loading |
| `CANONICAL_TAGS_STRATEGY.md` | Self-referencing canonicals, near-duplicate handling |
| `CONTENT_FRESHNESS_STRATEGY.md` | Rebuild triggers, freshness signals, stale content prevention |
| `SEED_SCRIPTS_AND_AUTOMATION.md` | Content templates, AI enrichment, Payload hooks |
| `LOCAL_SEO_AND_GBP.md` | LocalBusiness schema, GBP optimization, citations |

### External Documentation

- Payload CMS: https://payloadcms.com/docs
- Astro: https://docs.astro.build
- Astro hybrid rendering: https://docs.astro.build/en/guides/on-demand-rendering/
- Schema.org: https://schema.org/docs/schemas.html
- Google Search Central: https://developers.google.com/search/docs

### Key Thresholds Summary

| Metric | Value | Source |
|--------|-------|--------|
| Title tag max length | 60 chars | SEO playbook |
| Meta description max | 160 chars | SEO playbook |
| H1 length | 20-60 chars | SEO playbook |
| Alt text max | 125 chars | IMAGE_SEO_STRATEGY |
| Image file name max | 60 chars before ext | IMAGE_SEO_STRATEGY |
| LCP target | 2.5s or less | PAGE_EXPERIENCE_SIGNALS |
| INP target | 200ms or less | PAGE_EXPERIENCE_SIGNALS |
| CLS target | 0.1 or less | PAGE_EXPERIENCE_SIGNALS |
| JS budget | 170KB compressed | PAGE_EXPERIENCE_SIGNALS |
| CSS budget | 55KB compressed | PAGE_EXPERIENCE_SIGNALS |
| Image max size | 200KB | PAGE_EXPERIENCE_SIGNALS |
| Font budget | 100KB | PAGE_EXPERIENCE_SIGNALS |
| Content uniqueness | 50-60% minimum | PROGRAMMATIC_SEO_BLUEPRINT |
| Quality score minimum | 50/100 | PROGRAMMATIC_SEO_BLUEPRINT |
| URL path max depth | 3-4 segments | URL_STRUCTURE_RULES |
| URL path ideal length | Under 75 chars | URL_STRUCTURE_RULES |
| Primary keyword frequency | 3-5x per page | PROGRAMMATIC_SEO_BLUEPRINT |
| Geo-modifier frequency | 5-10x per page | PROGRAMMATIC_SEO_BLUEPRINT |
| Sitemap URL limit | 50,000 per file | ROUTING_AND_SITEMAPS |
| Webhook debounce | 30 seconds | This spec |
| Hero image dimensions | 1920x1080 | IMAGE_SEO_STRATEGY |
| OG image dimensions | 1200x630 | IMAGE_SEO_STRATEGY |
| Card image dimensions | 600x400 | IMAGE_SEO_STRATEGY |
| Thumbnail dimensions | 400x300 | IMAGE_SEO_STRATEGY (aligned with Media collection) |
| Square dimensions | 400x400 | IMAGE_SEO_STRATEGY (aligned with Media collection) |
