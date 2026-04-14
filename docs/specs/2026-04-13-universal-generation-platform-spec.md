# Product Specification: Universal Website Generation Platform

> **Document**: Full product specification for the AI-powered universal website generation system
> **Date**: 2026-04-13
> **Status**: Specification — ready for implementation
> **Audience**: Claude Code sessions that will implement this system (no prior conversation context assumed)
> **Companion**: `docs/specs/2026-04-13-page-blueprint-design-system.md` — Page Blueprint Registry defining block composition, CRO rules, SEO rules, and visual rhythm for all 12 page types

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System: Complete Analysis](#2-current-system-complete-analysis)
3. [Vision & Requirements](#3-vision--requirements)
4. [Architecture Design](#4-architecture-design)
5. [Layer 1: Universal Platform Primitives](#5-layer-1-universal-platform-primitives)
6. [Layer 2: AI Generation Engine](#6-layer-2-ai-generation-engine)
7. [Generation Pipeline: Step-by-Step](#7-generation-pipeline-step-by-step)
8. [MCP Tool Specifications](#8-mcp-tool-specifications)
9. [Master Orchestration Prompt](#9-master-orchestration-prompt)
10. [Content Seeding System](#10-content-seeding-system)
11. [CRM Pipeline Generation](#11-crm-pipeline-generation)
12. [Email Sequence Generation](#12-email-sequence-generation)
13. [SEO Strategy Generation](#13-seo-strategy-generation)
14. [Analytics & Tracking Generation](#14-analytics--tracking-generation)
15. [Validation & Quality Assurance](#15-validation--quality-assurance)
16. [Migration Strategy](#16-migration-strategy)
17. [File Manifest](#17-file-manifest)
18. [Implementation Phases](#18-implementation-phases)

---

## 1. Executive Summary

### What We're Building

A system where a user provides a single natural language prompt describing a business (e.g., "Dog grooming business in Austin with 3 locations") and Claude Code autonomously generates the **entire website stack**:

- Payload CMS collections, fields, blocks, hooks, and access control
- Astro pages, routes, components, and layouts
- JSON-LD structured data schemas
- Twenty CRM pipeline configuration (stages, contact properties, automations)
- Email sequences (welcome, booking confirmation, follow-up, nurture campaigns)
- Seed content (realistic pages, copy, blog posts, testimonials, team members)
- SEO strategy (keyword patterns, internal linking, meta templates)
- PostHog analytics event definitions
- MCP tools for ongoing content operations

**This is not a template picker.** There are no predefined business types. The AI analyzes the business description and generates everything from scratch, composing from universal platform primitives (Layer 1).

### Why This Matters

The current system is hardcoded for service-area businesses (plumbers, HVAC, electricians). If a client needs a portfolio site, e-commerce store, SaaS marketing page, or restaurant site, you'd have to rebuild most of the collections, routes, schemas, CRM flows, and email sequences. This system eliminates that constraint entirely.

### Architecture Summary

```text
Layer 1: Universal Platform (existing code, extracted and cleaned)
   ├── Payload primitives (client, base blocks, access control, preview, deploy)
   ├── Astro primitives (SEOLayout, BlockRenderer, RichText, PayloadImage)
   ├── Infrastructure (sitemap, robots, 404, search, breadcrumbs)
   └── Integration primitives (Twenty client, Resend client, PostHog, Sentry)

Layer 2: AI Generation Engine (new — the core of this spec)
   ├── Business Model Analyzer (prompt → structured business model)
   ├── Collection Generator (business model → Payload collection configs)
   ├── Route Generator (collections → Astro pages and routes)
   ├── Schema Generator (page types → JSON-LD structured data)
   ├── CRM Pipeline Generator (conversion funnel → Twenty CRM config)
   ├── Email Sequence Generator (business events → React Email templates)
   ├── Content Seeder (collections → realistic CMS entries)
   ├── SEO Strategy Generator (business model → keyword/linking strategy)
   ├── Analytics Generator (user journeys → PostHog event definitions)
   └── Validation Engine (generated output → build/serve/verify)

Layer 3: Client Customization (manual tweaks after generation)
```

---

## 2. Current System: Complete Analysis

This section documents the **entire existing codebase** so implementation sessions have full context.

### 2.1 Repository Structure

```text
/Users/syber/Desktop/AI Projects/Websites/Website Template/
├── .mcp.json                              # MCP server configurations
├── .env.template                          # Master env vars (source of truth, 36 vars)
├── .ports                                 # Auto-generated per-project port assignments
├── package.json                           # Root workspace (pnpm monorepo)
├── pnpm-workspace.yaml                    # Workspace packages definition
│
├── scripts/
│   ├── create-project.mjs                 # Interactive project wizard (41.5 KB)
│   ├── init-project.sh                    # Service init + port allocation (30 KB)
│   ├── bootstrap.sh                       # One-command clone + setup (4.1 KB)
│   ├── validate-template.sh               # Health checks + smoke tests (22.8 KB)
│   ├── e2e-test.sh                        # End-to-end workflow test (9.1 KB)
│   └── launch-ui.sh                       # GUI dashboard launcher (1.9 KB)
│
├── templates/
│   ├── astro-site/                        # Astro 6 — marketing/SEO frontend
│   │   ├── astro.config.mjs              # Hybrid SSR/SSG, @astrojs/node adapter
│   │   ├── package.json                  # Node >=22.12.0
│   │   └── src/
│   │       ├── pages/                    # 15 route files (SSR + SSG)
│   │       ├── components/               # 15+ components + ui/ (shadcn)
│   │       │   ├── blocks/               # 12 block components
│   │       │   │   └── BlockRenderer.astro
│   │       │   ├── ui/                   # shadcn/ui primitives
│   │       │   ├── SiteHeader.astro
│   │       │   ├── SiteFooter.astro
│   │       │   ├── PayloadImage.astro
│   │       │   ├── RichText.astro
│   │       │   ├── Breadcrumbs.astro
│   │       │   ├── RefreshOnSave.tsx      # Live preview React island
│   │       │   └── *Card.astro           # ServiceCard, LocationCard, etc.
│   │       ├── layouts/
│   │       │   ├── SEOLayout.astro       # Primary layout (meta, OG, JSON-LD)
│   │       │   └── Layout.astro          # Minimal fallback
│   │       ├── lib/
│   │       │   ├── payload.ts            # Singleton Payload client
│   │       │   ├── seo.ts               # Schema generators (10 functions)
│   │       │   ├── cache.ts             # CDN cache headers
│   │       │   └── utils.ts             # cn() Tailwind merge
│   │       └── styles/
│   │           └── global.css            # Tailwind v4 + OKLCh colors
│   │
│   └── next-app/                          # Next.js 16 — Payload CMS admin
│       ├── next.config.ts                # withPayload + withSentryConfig
│       ├── package.json                  # Node >=20
│       └── src/
│           ├── payload.config.ts         # Central CMS config (90+ lines)
│           ├── app/
│           │   ├── (app)/               # Dashboard routes + /api/deploy
│           │   ├── (payload)/           # Payload admin mount @ /admin
│           │   └── api/[...slug]/       # Payload REST API + CORS handler
│           ├── collections/             # 11 collection configs
│           │   ├── Pages.ts
│           │   ├── Media.ts
│           │   ├── Users.ts
│           │   ├── Services.ts          # ★ Business-specific
│           │   ├── Locations.ts         # ★ Business-specific
│           │   ├── ServicePages.ts      # ★ Business-specific (cross-product)
│           │   ├── BlogPosts.ts
│           │   ├── FAQs.ts
│           │   ├── Testimonials.ts
│           │   ├── TeamMembers.ts
│           │   └── Contacts.ts          # Conditional (Twenty CRM)
│           ├── blocks/                  # 12 block configs
│           │   ├── Hero.ts
│           │   ├── Content.ts
│           │   ├── CTA.ts
│           │   ├── Stats.ts
│           │   ├── Gallery.ts
│           │   ├── Pricing.ts
│           │   ├── Team.ts
│           │   ├── FAQ.ts
│           │   ├── Testimonials.ts
│           │   ├── ServiceDetail.ts     # ★ Business-specific
│           │   ├── LocationMap.ts       # ★ Business-specific
│           │   └── RelatedLinks.ts
│           ├── globals/
│           │   └── SiteSettings.ts      # Site-wide config (name, logo, contact, SEO)
│           ├── hooks/
│           │   ├── auto-generate-slug.ts
│           │   ├── auto-generate-service-page-slug.ts  # ★ Business-specific
│           │   └── trigger-rebuild.ts
│           ├── access/
│           │   ├── isAdmin.ts
│           │   ├── isAdminOrEditor.ts
│           │   ├── isAdminOrSelf.ts
│           │   └── publishedOrLoggedIn.ts
│           ├── fields/
│           │   └── slug.ts              # Auto-slug field with lock toggle
│           ├── plugins/
│           │   ├── index.ts             # getPlugins() — 13 plugins (conditional)
│           │   └── twenty-crm.ts        # CRM sync plugin
│           ├── webhooks/
│           │   ├── twenty-handler.ts    # Twenty CRM inbound webhooks
│           │   ├── resend-handler.ts    # Email engagement tracking
│           │   └── rebuild-handler.ts   # Deploy webhook + debounce
│           ├── lib/
│           │   └── twenty/
│           │       ├── client.ts        # Twenty CRM GraphQL client
│           │       └── queries.ts       # Query builders + default field sets
│           ├── emails/
│           │   ├── WelcomeContact.tsx
│           │   ├── ClosedWonCongratulations.tsx
│           │   ├── FollowUpReminder.tsx
│           │   └── DealStageNotification.tsx
│           ├── mcp/
│           │   ├── tools/               # 61 MCP tools
│           │   ├── prompts/             # 8 MCP prompts
│           │   └── index.ts             # MCP plugin config
│           └── components/
│               └── DeployButton.tsx      # Admin panel deploy trigger
│
├── packages/
│   ├── shared/                           # @template/shared
│   │   ├── package.json                 # Exports: supabase, posthog, resend, payload, types
│   │   └── src/
│   │       ├── payload/
│   │       │   ├── client.ts            # REST client factory + 20+ collection helpers
│   │       │   └── types.ts             # TypeScript interfaces for all collections
│   │       ├── supabase/client.ts       # Browser/Server/ServiceRole clients
│   │       ├── posthog/init.ts          # Analytics initialization
│   │       ├── resend/client.ts         # Email client factory
│   │       └── sentry/config.ts         # Error tracking defaults
│   │
│   └── create-site/                      # CLI package (minimal)
│
├── docker/twenty/
│   └── docker-compose.yml               # Twenty CRM v1.20 (3 services)
│
├── supabase/
│   ├── config.toml                      # Local Supabase configuration
│   └── seed.sql                         # Database seed script
│
├── docs/
│   ├── INTEGRATION_SEAMS.md
│   ├── SECURITY_CHECKLIST.md
│   └── specs/                           # This document lives here
│
├── website-seo-playbook/                # 17 SEO strategy guides
│   ├── PROGRAMMATIC_SEO_BLUEPRINT.md
│   ├── URL_STRUCTURE_RULES.md
│   ├── LOCAL_SEO_AND_GBP.md
│   └── ... (14 more guides)
│
└── tools/ai-website-cloner/             # Standalone reverse-engineering tool
```

### 2.2 Payload CMS: Complete Collection Inventory

#### 2.2.1 Universal Collections (keep as-is in Layer 1)

**Pages** (`src/collections/Pages.ts`)
- Slug: `pages`
- Fields: `title` (text, required, localized), `slug` (text, unique), `excerpt` (textarea, max 160), `featuredImage` (upload→media), `content` (richText, localized)
- Access: `publishedOrLoggedIn` read, `isAdminOrEditor` write
- Versions: drafts + autosave (1.5s) + schedulePublish, max 25

**Media** (`src/collections/Media.ts`)
- Slug: `media`
- Upload: PNG, JPEG, WebP, AVIF, SVG, GIF, PDF
- 9 image sizes: thumbnail (400×300), card (600×400), hero (1920×1080), heroMobile (768×1024), gallery (1200×800), galleryThumb (300×200), og (1200×630), square (400×400), content (800×auto)
- Fields: `alt` (text, required, localized, max 125), `caption` (text, localized)
- Access: public read, `isAdminOrEditor` write

**Users** (`src/collections/Users.ts`)
- Slug: `users`
- Auth: `useAPIKey: true` (for Astro draft access)
- Fields: `name` (text), `role` (select: admin|editor|viewer, default editor)
- Access: `isAdminOrSelf` read, `isAdmin` create/delete
- Hook: First user auto-gets admin role

**Contacts** (`src/collections/Contacts.ts`) — conditional on `TWENTY_API_URL`
- Slug: `contacts`
- Fields: `twentyId` (text, unique, indexed), `email` (email, required, unique), `firstName`, `lastName`, `company`, `engagementScore` (number, default 0), `lastSyncedAt` (date), `source` (select: twenty-webhook|payload-sync|manual)
- Access: `isAdminOrEditor` read, `isAdmin` write

#### 2.2.2 Business-Specific Collections (currently service-area — will be generated by AI)

**Services** (`src/collections/Services.ts`)
- Slug: `services`
- Fields (17 top-level): `name`, `slug`, `category` (residential|commercial|emergency|maintenance), `shortDescription` (max 300), `description` (richText), `featuredImage`, `gallery[]` (image+caption), `icon` (Lucide name), `features[]` (title+description+icon), `pricing` group (startingAt, priceRange, unit, showPricing), `layout` (12 block types), `relatedServices` (self-ref), `faqs` (→FAQs), `seoTitle` (max 60), `seoDescription` (max 160), `schemaType` (Service|ProfessionalService|...), `keywords` group (primary, secondary[], longTail[], lsiTerms)
- Hooks: `autoGenerateSlug`, `triggerRebuildAfterChange`
- Versions: drafts + autosave + schedulePublish, max 25

**Locations** (`src/collections/Locations.ts`)
- Slug: `locations`
- Fields (17 top-level): `displayName`, `slug`, `type` (city|neighborhood|county|region|zip|state), `city`, `state`, `stateCode` (2-letter, regex validated), `zipCodes`, `coordinates` (GeoJSON point, lat/lon validated), `population`, `timezone`, `description` (richText), `areaInfo` (textarea), `featuredImage`, `parentLocation` (self-ref, cycle detection), `nearbyLocations` (self-ref), `seoTitle`, `seoDescription`
- Hooks: `autoGenerateSlug`, `triggerRebuildAfterChange`, circular parent detection (max 10 depth)
- Versions: drafts + autosave + schedulePublish, max 25

**ServicePages** (`src/collections/ServicePages.ts`)
- Slug: `service-pages`
- Fields (14 top-level): `title` (auto: "[Service] in [Location]"), `slug` (auto: "service-in-location"), `service` (→Services, required), `location` (→Locations, required), `headline`, `introduction` (richText), `localContent` (richText), `layout` (12 blocks), `seoTitle`, `seoDescription`, `relatedServicePages` (self-ref), `contentSource` (template|ai|manual|enriched), `contentQualityScore` (0-100), `keywords` group (includes geoModifiers)
- Quality gate: Throws if score < 50 on publish
- Hooks: `autoGenerateServicePageSlug`, `triggerRebuildAfterChange`
- Versions: drafts + autosave + schedulePublish, max 10

**BlogPosts** (`src/collections/BlogPosts.ts`)
- Slug: `blog-posts`
- Fields (13 top-level): `title`, `slug`, `excerpt` (max 300), `content` (richText, required), `featuredImage`, `author` (→TeamMembers), `authorOverride` (text fallback), `publishedAt` (date), `category` (tips|news|case-studies|updates), `tags[]`, `relatedServices` (→Services), `relatedLocations` (→Locations), `seoTitle`, `seoDescription`
- Hooks: `autoGenerateSlug` (uses `slugifyLight`), `triggerRebuildAfterChange`
- Versions: drafts + autosave + schedulePublish, max 50

**FAQs** (`src/collections/FAQs.ts`)
- Slug: `faqs`
- Fields: `question` (text, required, localized), `answer` (richText, required, localized), `service` (→Services), `location` (→Locations), `sortOrder` (number)
- **No versions** — all items immediately public
- Access: public read, `isAdminOrEditor` write

**Testimonials** (`src/collections/Testimonials.ts`)
- Slug: `testimonials`
- Fields: `clientName`, `clientTitle`, `review` (textarea, localized), `rating` (1-5, integer), `date`, `avatar` (→Media), `service` (→Services), `location` (→Locations), `featured` (checkbox), `source` (google|yelp|direct|facebook)
- **No versions**
- Access: public read, `isAdminOrEditor` write

**TeamMembers** (`src/collections/TeamMembers.ts`)
- Slug: `team-members`
- Fields: `name`, `role`, `bio` (richText, localized), `photo` (→Media), `email`, `phone` (regex validated), `locations` (→Locations), `specialties` (→Services), `certifications[]` (name+issuer+year), `sortOrder`
- **No versions**
- Access: public read, `isAdminOrEditor` write

### 2.3 Payload Blocks: Complete Inventory

All blocks are used in `layout` array fields on content collections.

| Block | Slug | Key Fields | Universal? |
|-------|------|-----------|------------|
| Hero | `hero` | heading, subheading, backgroundImage, cta (text+link+phone), style (centered\|left\|split\|fullbleed), overlayOpacity | ✅ Yes |
| Content | `content` | heading, content (richText), image, imagePosition (none\|left\|right\|above\|below) | ✅ Yes |
| CTA | `cta` | heading, subheading, buttonText, buttonLink, phone, showForm, form (→forms), style (banner\|card\|minimal\|fullwidth), backgroundImage | ✅ Yes |
| Stats | `stats` | heading, stats[] (value+label+icon), minRows 2, maxRows 6 | ✅ Yes |
| Gallery | `gallery` | heading, images[] (image+caption), layout (grid\|masonry\|carousel), columns (2-4) | ✅ Yes |
| Team | `team` | heading, source (all\|manual\|location), members (→team-members), maxItems, showContact | ✅ Yes |
| FAQ | `faq` | heading, source (manual\|auto), faqs (→faqs), maxItems, generateSchema (checkbox) | ✅ Yes |
| Testimonials | `testimonials` | heading, source (featured\|service\|location\|manual), testimonials (→testimonials), maxItems, layout (carousel\|grid\|stack), generateSchema | ✅ Yes |
| Pricing | `pricing` | heading, subheading, tiers[] (name+price+unit+description+features[]+highlighted+cta), disclaimer | ⚠️ Mostly (not all business types) |
| RelatedLinks | `relatedLinks` | heading, source (auto\|manual), links[] (title+url+description), maxItems | ✅ Yes |
| ServiceDetail | `serviceDetail` | heading, content (richText), features[] (title+description+icon), layout (list\|grid\|alternating) | ❌ Service-area specific |
| LocationMap | `locationMap` | heading, embedUrl, address, serviceRadius, showNearbyLocations | ❌ Service-area specific |

### 2.4 Payload Plugins: Complete Activation Matrix

| # | Plugin | Activation Condition | Purpose |
|---|--------|---------------------|---------|
| 1 | Nested Docs | Always | Hierarchical pages/services |
| 2 | SEO | Always | Meta fields (title, description, OG, robots, JSON-LD) |
| 3 | Redirects | Always | 301/302 URL redirect management |
| 4 | Search | Always | Full-text search index |
| 5 | Form Builder | Always | Dynamic forms (12 field types) + Stripe payments |
| 6 | Import/Export | Always | CSV/JSON bulk operations |
| 7 | S3 Storage | `S3_BUCKET` set | AWS S3 media storage |
| 8 | Vercel Blob | `BLOB_READ_WRITE_TOKEN` set (no S3) | Vercel Blob media storage |
| 9 | Stripe | `STRIPE_SECRET_KEY` set | Payment processing + customer sync |
| 10 | Twenty CRM | `TWENTY_API_URL` + `TWENTY_API_KEY` set | CRM sync (form→people, form→notes, users→people) |
| 11 | MCP | Always | 61 AI tools + 8 prompts |
| 12 | Payload AI | Any AI key set (OpenAI/Anthropic/Google) | Content generation, proofread, translate |
| 13 | Sentry | `SENTRY_DSN` set | Error tracking (unshifted to position 0) |

### 2.5 Astro Site: Complete Page Inventory

| Page | Path | SSR/SSG | Data Source | Purpose |
|------|------|---------|-------------|---------|
| Homepage | `/` | SSG (rebuilt on deploy via webhook; not SSR because homepage is the highest-traffic page and benefits from full caching) | siteSettings, services (6), blogPosts (3), testimonials | Landing page |
| Services Index | `/services` | SSR | services (all), siteSettings | Service listing by category |
| Service Detail | `/services/[slug]` | SSR | service (by slug), siteSettings | Individual service + blocks |
| Service×Location | `/services/[service]/[city]` | SSR | servicePage (by service+city slugs) | Cross-product pSEO page |
| Locations Index | `/locations` | SSR | locations (all, grouped by state) | Location listing |
| Location Detail | `/locations/[city]` | SSR | location (by slug) | Individual location |
| Blog Index | `/blog` | SSR | blogPosts (all), client-side pagination (12/page) | Blog listing |
| Blog Post | `/blog/[slug]` | SSR | blogPost (by slug) | Individual article |
| Team | `/team` | SSG | teamMembers, siteSettings | Team member grid |
| FAQ | `/faq` | SSG | faqs (grouped by service), services, siteSettings | FAQ accordion |
| Contact | `/contact` | SSG | siteSettings | Contact info + form placeholder |
| Privacy | `/privacy` | SSG | page (slug='privacy'), siteSettings | Privacy policy |
| Terms | `/terms` | SSG | page (slug='terms'), siteSettings | Terms of service |
| 404 | `/404` | SSG | siteSettings, services (5) | Custom error page |
| Preview | `/preview` | SSR | doc (by collection+slug+token), validates PREVIEW_SECRET | Payload live preview |
| Search | `/search` | SSR | search index (by query), maps to collection URLs | Full-text search |
| Sitemap | `/sitemap.xml` | SSG | All published collections | XML sitemap (`.ts` endpoint file) |
| Sitemap Index | `/sitemap-index.xml` | SSG | Collection counts | Multi-sitemap for 50k+ pages (`.ts` endpoint file) |
| Robots | `/robots.txt` | SSG | SITE_URL | Search engine directives (`.ts` endpoint file) |

### 2.6 Shared Payload Client: Method Inventory

**File**: `packages/shared/src/payload/client.ts`

```typescript
// Generic methods (collection-agnostic)
fetch<T>(endpoint, params): Promise<T>
fetchList<T>(collection, params): Promise<PayloadListResponse<T>>
fetchById<T>(collection, id, depth): Promise<T>
fetchBySlug<T>(collection, slug, depth, draft): Promise<T>
fetchPublished<T>(collection, params): Promise<PayloadListResponse<T>>
fetchPaginated<T>(collection, page, limit, params): Promise<PayloadListResponse<T>>
fetchGlobal<T>(slug): Promise<T>

// Typed collection helpers
getAllServices(params?): Promise<PayloadListResponse<Service>>
getServiceBySlug(slug): Promise<Service>
getAllLocations(params?): Promise<PayloadListResponse<Location>>
getLocationBySlug(slug): Promise<Location>
getAllServicePages(params?): Promise<PayloadListResponse<ServicePage>>  // Paginated in 1000-doc batches
getServicePage(serviceSlug, locationSlug): Promise<ServicePage>
getAllBlogPosts(params?): Promise<PayloadListResponse<BlogPost>>
getBlogPostBySlug(slug): Promise<BlogPost>
getAllPages(params?): Promise<PayloadListResponse<Page>>
getPageBySlug(slug): Promise<Page>
getFAQs(params?): Promise<PayloadListResponse<FAQ>>
getFAQsByService(serviceId): Promise<PayloadListResponse<FAQ>>
getFAQsByLocation(locationId): Promise<PayloadListResponse<FAQ>>
getTestimonials(params?): Promise<PayloadListResponse<Testimonial>>
getFeaturedTestimonials(): Promise<PayloadListResponse<Testimonial>>
getTeamMembers(params?): Promise<PayloadListResponse<TeamMember>>
getSiteSettings(): Promise<SiteSettings>
```

Config: `{ apiUrl, apiKey?, defaultDepth: 1, timeout: 60000, authCollection: 'users' }`

### 2.7 Twenty CRM Client: Complete API

**File**: `templates/next-app/src/lib/twenty/client.ts`

Namespaced CRUD with GraphQL:

| Namespace | Methods | Default Fields |
|-----------|---------|---------------|
| `people` | findMany, findById, findByEmail, create, update, delete, createMany, upsert | id, name.firstName/lastName, emails.primaryEmail, phones, city, jobTitle, companyId |
| `companies` | findMany, findById, create, update, delete, createMany, upsert | id, name, domainName, address (all 6), employees, linkedinLink |
| `opportunities` | findMany, findById, create, update, delete, createMany, upsert | id, name, amount (Currency), closeDate, stage, pointOfContactId, companyId |
| `notes` | findMany, findById, create, update, delete, createMany, upsert | id, title, bodyV2 (blocknote), position |
| `tasks` | findMany, findById, create, update, delete, createMany, upsert | id, title, bodyV2, status (TODO\|IN_PROGRESS\|DONE), dueAt, assigneeId |
| `metadata` | createObject, createField, createRelation, listObjects | Schema extension API |

Features: 3 retries, exponential backoff, rate limit handling (429 + Retry-After), max 60 items/batch.

### 2.8 Webhook Handlers

**Twenty Handler** (`src/webhooks/twenty-handler.ts`):
- `person.created` → Upsert Contacts collection + send WelcomeContact email
- `person.updated` → Update Contacts (with `skipCrmSync` to prevent loops)
- `opportunity.stage_changed` (CLOSED_WON) → Send congratulations email + schedule 7-day follow-up

**Resend Handler** (`src/webhooks/resend-handler.ts`):
- `email.opened` → engagementScore +1
- `email.clicked` → engagementScore +3
- `email.bounced` → Log warning

**Rebuild Handler** (`src/webhooks/rebuild-handler.ts`):
- 30-second debounce, POST to webhookUrl
- Called by `triggerRebuildAfterChange` hook

### 2.9 Environment Variable System

**36 variables** in `.env.template`, organized by service:

| Category | Variables | Count |
|----------|----------|-------|
| Supabase | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY | 5 |
| PostHog | NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST | 4 |
| Sentry | SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_DSN | 6 |
| Resend | RESEND_API_KEY, EMAIL_FROM_ADDRESS | 2 |
| Twenty CRM | TWENTY_API_URL, TWENTY_API_KEY | 2 |
| Payload CMS | PAYLOAD_SECRET, DATABASE_URL, NEXT_PUBLIC_SERVER_URL, PUBLIC_ASTRO_URL, PAYLOAD_API_URL, PAYLOAD_API_KEY, SITE_URL, PREVIEW_SECRET, URL_PATTERN | 9 |
| Storage | S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT, BLOB_READ_WRITE_TOKEN | 6 |
| Stripe | STRIPE_SECRET_KEY, STRIPE_WEBHOOKS_ENDPOINT_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | 3 |
| AI | OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ELEVENLABS_API_KEY | 4 |

**Flow**: `.env.template` → `create-project.mjs` filters → `init-project.sh` injects secrets/ports → `.env.local` copied to both templates.

### 2.10 Port Allocation System

Hash-based: `sum(ASCII chars of project name) % 100 = offset`

| Service | Formula | Example (offset=23) |
|---------|---------|-------------------|
| Astro | 4400 + offset | 4423 |
| Next.js/Payload | 3100 + offset | 3123 |
| Twenty CRM | 3200 + offset | 3223 |
| Supabase API | 54321 + (offset%50)*10 | 54551 |
| Supabase DB | 54322 + (offset%50)*10 | 54552 |
| Supabase Studio | 54323 + (offset%50)*10 | 54553 |

**Critical rule**: Never hardcode ports in template source. Use env vars only.

### 2.11 MCP Tools: Current Inventory (61 tools, 8 prompts)

**Categories**:
- Content Lifecycle (7): Publish/unpublish, schedule, archive
- SEO & Indexing (10): Sitemaps, JSON-LD, hreflang, robots, canonicals
- Content Quality (6): Readability, orphan pages, thin content, broken links, freshness
- CRO (3): CTA placement, form performance, trust signals
- i18n (2): Translation workflow, locale SEO
- Search & Redirects (3): 301/302 management, redirect chains
- Media (2): Image optimization, alt text audit
- Forms (2): Submission stats, bulk export
- pSEO Seeding (5): seed_services, seed_locations, seed_faqs, seed_testimonials, seed_team_members (max 200/call)
- Page Generation (3): generate_service_pages (max 100/call), enrich_service_pages, update_service_page_content
- Keywords (2): generate_keywords, validate_keyword_placement
- Quality Audits (4): Content uniqueness (trigram Jaccard), quality report, SEO completeness, heading structure
- Architecture (4): Internal links, orphan pages, slug audit, canonical consistency
- Lifecycle (4): Stale pages, pruning candidates, keyword cannibalization, redirect manifest
- Local SEO (4): NAP consistency, testimonial coverage, image alt, filename validation
- Launch (2): Pre-launch checklist, collection stats

**Prompts**: brand_voice, seo_content_standards, landing_page_structure, image_guidelines, translation_guidelines, pseo_page_template, pseo_enrichment_prompt, pseo_launch_readiness

### 2.12 SEO Infrastructure

**Schema generators** (`templates/astro-site/src/lib/seo.ts`):
- `generateOrganizationSchema()` — Every page
- `generateWebSiteSchema()` — Homepage (SearchAction)
- `generateServiceSchema()` — Service pages
- `generateLocalBusinessSchema()` — Location + service×location pages
- `generateFAQSchema()` — FAQ blocks with `generateSchema: true`
- `generateReviewSchema()` — Testimonials (AggregateRating)
- `generateArticleSchema()` — Blog posts
- `generateBreadcrumbSchema()` — All pages with breadcrumbs

**SEOLayout.astro** generates: meta title/description, canonical, og:title/description/image/url/type, twitter:card, hreflang alternates, JSON-LD schemas per page type.

### 2.13 Project Wizard: Presets

| Preset | Frameworks | Services |
|--------|-----------|----------|
| `full` | Astro + Next.js | Supabase, Payload, Twenty, Sentry, PostHog, Resend |
| `marketing` | Astro | Supabase, Sentry, PostHog |
| `dashboard` | Next.js | Supabase, Payload, Sentry |
| `both-frameworks` | Astro + Next.js | Supabase, Sentry |
| `minimal` | Astro | None |
| `nextjs-minimal` | Next.js | None |

---

## 3. Vision & Requirements

### 3.1 The Problem

Everything in Section 2 is **hardcoded for service-area businesses** (plumbers, HVAC, electricians serving multiple cities). The collections (Services, Locations, ServicePages), routes (`/services/plumbing/austin-tx`), JSON-LD schemas (LocalBusiness, Service), keyword strategies (geo-modifiers, service+city), CRO elements (phone click-to-call, "Free Estimate"), and CRM flows (form→contact→deal) all assume this single business model.

For any other business type — portfolio, e-commerce, SaaS, restaurant, gym, law firm, nonprofit, real estate — you'd need to rebuild most of the system.

### 3.2 The Solution

**Replace predefined templates with AI-powered generation.** Instead of maintaining 5+ business type templates that go stale, build a generation engine that:

1. Takes a natural language business description as input
2. Analyzes the business model (entities, relationships, user journeys, conversion goals)
3. Generates all code, configuration, and content
4. Validates the output builds and serves correctly

### 3.3 Core Requirements

| # | Requirement | Priority |
|---|-------------|----------|
| R1 | Accept any business type via natural language prompt | Must |
| R2 | Generate Payload collection configs (fields, access, hooks, versions) | Must |
| R3 | Generate Astro pages, routes, and components | Must |
| R4 | Generate JSON-LD schemas appropriate to business type | Must |
| R5 | Configure Twenty CRM pipelines, stages, and contact properties | Must |
| R6 | Generate React Email templates with trigger logic | Must |
| R7 | Seed CMS with realistic, SEO-optimized content | Must |
| R8 | Generate navigation structure (header, footer) | Must |
| R9 | Generate SEO strategy (keywords, internal linking, meta templates) | Must |
| R10 | Generate PostHog analytics event definitions | Should |
| R11 | Generate business-specific MCP tools for ongoing operations | Should |
| R12 | Validate generated output (build, serve, screenshot) | Must |
| R13 | Compose from Layer 1 universal primitives (not from scratch) | Must |
| R14 | Support iterative refinement after initial generation | Should (deferred to post-v1 — initial implementation focuses on first-time generation; iterative refinement including partial regeneration and merging manual edits will be designed after the core generation pipeline is validated) |
| R15 | Update `payload.config.ts` to register generated collections | Must |
| R16 | Update shared Payload client with new collection helpers | Must |
| R17 | Preserve all existing universal infrastructure (preview, deploy, search) | Must |

### 3.4 Non-Requirements (Explicitly Out of Scope)

- Real-time generation (this runs during project setup, not at runtime)
- Multi-tenant support (one business per project)
- Visual drag-and-drop builder (Claude Code is the interface)
- E-commerce cart/checkout/payment (defer — fundamentally different product category)
- User authentication flows (separate from CMS)

---

## 4. Architecture Design

### 4.1 System Overview

```text
┌────────────────────────────────────────────────────────────┐
│                    USER PROMPT                              │
│  "Dog grooming business in Austin, 3 locations..."         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              MASTER ORCHESTRATION PROMPT                     │
│  (MCP prompt or Claude Code skill)                          │
│  Defines the generation workflow sequence                   │
└────────────────────────┬───────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   ANALYZE    │ │   GENERATE   │ │   VALIDATE   │
│              │ │              │ │              │
│ Business     │ │ Collections  │ │ Build check  │
│ Model        │ │ Routes       │ │ Serve check  │
│ Analyzer     │ │ Schemas      │ │ Screenshot   │
│              │ │ CRM config   │ │ Link check   │
│ Outputs:     │ │ Emails       │ │ Schema check │
│ entities,    │ │ Seed content │ │              │
│ relationships│ │ SEO strategy │ │ Outputs:     │
│ goals,       │ │ Analytics    │ │ pass/fail    │
│ journeys     │ │ Nav/footer   │ │ error list   │
└──────────────┘ └──────────────┘ └──────────────┘
          │              │              │
          ▼              ▼              ▼
┌────────────────────────────────────────────────────────────┐
│                  LAYER 1: UNIVERSAL PLATFORM                │
│                                                             │
│  Payload: client, base blocks, access, preview, deploy      │
│  Astro: SEOLayout, BlockRenderer, RichText, PayloadImage    │
│  Infra: sitemap, robots, 404, search, breadcrumbs           │
│  Services: Twenty client, Resend client, PostHog, Sentry    │
└────────────────────────────────────────────────────────────┘
```

### 4.2 What Gets Generated vs. What's Reused

| Component | Generated by AI | Reused from Layer 1 |
|-----------|:-:|:-:|
| Payload collection `.ts` files | ✅ | |
| Payload block `.ts` files (business-specific) | ✅ | |
| Astro page `.astro` files | ✅ | |
| Astro block components (business-specific) | ✅ | |
| Astro card components (business-specific) | ✅ | |
| `payload.config.ts` (updated to register collections) | ✅ | |
| `packages/shared/src/payload/client.ts` (new helpers) | ✅ | |
| `packages/shared/src/payload/types.ts` (new types) | ✅ | |
| `seo.ts` schema generators (business-specific) | ✅ | |
| SiteHeader/SiteFooter (nav items) | ✅ | |
| CRM pipeline + contact properties | ✅ | |
| React Email templates | ✅ | |
| Email trigger webhook handlers | ✅ | |
| Seed content (CMS entries) | ✅ | |
| SEO keyword strategy | ✅ | |
| PostHog event definitions | ✅ | |
| MCP tools (business-specific) | ✅ | |
| SEOLayout.astro | | ✅ |
| BlockRenderer.astro | | ✅ |
| RichText.astro | | ✅ |
| PayloadImage.astro | | ✅ |
| Breadcrumbs.astro | | ✅ |
| RefreshOnSave.tsx | | ✅ |
| Universal blocks (Hero, Content, CTA, Stats, Gallery, Team, FAQ, Testimonials) | | ✅ |
| preview.astro | | ✅ |
| search.astro | | ✅ |
| sitemap.xml.ts | | ✅ (updated to include new collections) |
| robots.txt.ts | | ✅ |
| 404.astro | | ✅ |
| Payload client factory | | ✅ |
| Access control predicates | | ✅ |
| Slug auto-generation hook | | ✅ |
| Rebuild trigger hook | | ✅ |
| Deploy button | | ✅ |
| Twenty CRM client | | ✅ |
| Resend client | | ✅ |
| Port allocation system | | ✅ |
| Validation scripts | | ✅ |

### 4.3 Generation Primitives (New MCP Tools)

These are the tools Claude Code will call during the generation pipeline:

| Tool | Input | Output | Section |
|------|-------|--------|---------|
| `analyze_business` | Natural language prompt | Structured business model (JSON) | §8.1 |
| `generate_collection` | Entity definition | Payload collection `.ts` file | §8.2 |
| `generate_cross_product_collection` | Two parent entities | Cross-product collection `.ts` file | §8.3 |
| `generate_page` | Route pattern + collection | Astro `.astro` file | §8.4 |
| `generate_block` | Block definition | Payload block `.ts` + Astro component | §8.5 |
| `generate_schema` | Page type + business context | JSON-LD generator function | §8.6 |
| `configure_crm_pipeline` | Conversion funnel definition | Twenty CRM API calls | §8.7 |
| `generate_email_sequence` | Business event + context | React Email template files | §8.8 |
| `seed_collection` | Collection + business context | Payload API calls (create entries) | §8.9 |
| `generate_nav` | Pages + hierarchy | SiteHeader/SiteFooter updates | §8.10 |
| `validate_generation` | Generated file manifest | Build result + error list | §8.11 |

---

## 5. Layer 1: Universal Platform Primitives

### 5.1 Extraction Plan

The current codebase mixes universal and business-specific code. Layer 1 extraction requires:

**Keep in place (already universal):**
- `packages/shared/src/payload/client.ts` — generic methods (fetch, fetchList, fetchBySlug, etc.)
- `packages/shared/src/payload/types.ts` — base types (PayloadListResponse, Media, Block, SEOMeta)
- All access control predicates
- `auto-generate-slug.ts` hook (works for any collection with title/name)
- `trigger-rebuild.ts` hook (works for any collection)
- `slugField` custom field
- All plugins in `getPlugins()` (they're already conditional)
- SEOLayout, BlockRenderer, RichText, PayloadImage, Breadcrumbs
- Universal blocks (Hero, Content, CTA, Stats, Gallery, Team, FAQ, Testimonials, RelatedLinks, Pricing)
- Preview, search, sitemap, robots, 404 pages
- SiteSettings global (needs field splitting — see below)

**Extract to "service-area" reference (move, don't delete):**
- Service-area collections (Services, Locations, ServicePages)
- ServiceDetail and LocationMap blocks
- Service-area-specific Astro pages
- `auto-generate-service-page-slug.ts` hook
- Service-area schema generators in `seo.ts`
- Service-area card components
- Service-area MCP tools and prompts
- Service-area CRM sync config in `twenty-crm.ts`
- Service-area email templates

### 5.2 SiteSettings Split

Current SiteSettings has both universal and business-specific fields. Split:

**Universal SiteSettings** (stays in Layer 1):
- `siteName`, `tagline`, `logo`, `favicon`
- `phone`, `email`, `address` group
- `socialLinks[]`
- `footerText`, `defaultSeoImage`
- `googleAnalyticsId`, `businessSchema`
- `rebuildMode`, `webhookUrl`

**Business-specific** (generated per business type):
- The generator may add additional globals or fields to SiteSettings based on business needs (e.g., `serviceAreas` for service businesses, `storeHours` for retail, `portfolioCategories` for agencies)

### 5.3 Sitemap Update Strategy

The current `sitemap.xml.ts` hardcodes collection slugs (services, locations, service-pages, blog-posts, pages). After generation, it must include whatever collections the AI created.

**Solution**: Sitemap reads a config file (`src/lib/sitemap-config.ts`) that lists collections to include. The generator writes this file.

```typescript
// Generated by AI generation engine
export const sitemapCollections = [
  { slug: 'treatments', priority: 0.8, changefreq: 'monthly', urlPrefix: '/treatments' },
  { slug: 'locations', priority: 0.7, changefreq: 'monthly', urlPrefix: '/locations' },
  { slug: 'blog-posts', priority: 0.5, changefreq: 'weekly', urlPrefix: '/blog' },
  // ... generated based on business model
]
```

**Sitemap consumption**: `sitemap.xml.ts` iterates over `sitemapCollections` using the generic `fetchPublished()` method:

```typescript
// sitemap.xml.ts iterates over sitemapCollections using generic fetchPublished()
for (const collection of sitemapCollections) {
  const { docs } = await payload.fetchPublished(collection.slug, { limit: '50000' })
  for (const doc of docs) {
    urls.push({
      loc: `${baseUrl}${collection.urlPrefix}/${doc.slug}`,
      lastmod: doc.updatedAt,
      priority: collection.priority,
      changefreq: collection.changefreq,
    })
  }
}
```

**Navigation config** (`src/lib/nav-config.ts`):

```typescript
// Generated by AI generation engine
export const navConfig: NavDefinition = {
  primary: [
    { label: 'Treatments', href: '/treatments', collection: 'treatments', fetchMethod: 'getAll' },
    { label: 'Locations', href: '/locations' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  secondary: [
    { label: 'Call Us', href: 'tel:{phone}', icon: 'Phone' },
  ],
  footer: [
    { heading: 'Treatments', links: [/* populated from collection */] },
    { heading: 'Locations', links: [/* populated from collection */] },
    { heading: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }] },
  ],
}
```

Note: SiteHeader and SiteFooter must be refactored in Layer 1 extraction to consume `navConfig` instead of making direct `payload.getAllServices()` calls. Items with a `collection` and `fetchMethod` property are populated dynamically at render time by fetching from the specified Payload collection.

### 5.4 Plugin Collection Registry

All Payload plugins that reference content collections (SEO, Search, Redirects, Import/Export, AI, Live Preview, Nested Docs, Form Builder) currently hardcode collection arrays. A generated project needs these plugins to include whatever collections the AI creates.

**Solution**: A `plugin-config.ts` file that all plugins read from:

```typescript
// templates/next-app/src/lib/plugin-config.ts
// Generated by AI generation engine — consumed by all plugins in getPlugins()
export const contentCollections: string[] = [
  'treatments', 'locations', 'treatment-pages', 'blog-posts', 'pages'
]
// Used by: seoPlugin, searchPlugin, redirectsPlugin, importExportPlugin,
// payloadAiPlugin, livePreview, nestedDocsPlugin (for hierarchical entities)
```

`getPlugins()` in `templates/next-app/src/plugins/index.ts` must be refactored to read from this config instead of hardcoding collection arrays. The following plugins need updating:

- **SEO plugin** — `generateTitle`/`generateURL` collections list
- **Search plugin** — `collections` array
- **Redirects plugin** — `redirectRelationships` on each content collection
- **Import/Export plugin** — `collections` array
- **Payload AI plugin** — `collections` config must include all generated content collections so AI content generation/proofread/translate works on them
- **Live Preview** — `livePreview.collections` array
- **Nested Docs plugin** — `collections` must include generated collections that have parent-child relationships (e.g., entities with `parentLocation` or category hierarchies)
- **Form Builder plugin** — `redirectRelationships` must include generated content collections so forms can redirect to them after submission

### 5.5 Block Component Registry

BlockRenderer currently dispatches blocks via a switch statement. Generated blocks must be renderable without modifying BlockRenderer's source code.

**Solution**: A block registry that maps block slugs to lazy-loaded Astro components:

```typescript
// templates/astro-site/src/components/blocks/block-registry.ts
export const blockRegistry: Record<string, () => Promise<any>> = {
  hero: () => import('./HeroBlock.astro'),
  content: () => import('./ContentBlock.astro'),
  cta: () => import('./CTABlock.astro'),
  stats: () => import('./StatsBlock.astro'),
  gallery: () => import('./GalleryBlock.astro'),
  team: () => import('./TeamBlock.astro'),
  faq: () => import('./FAQBlock.astro'),
  testimonials: () => import('./TestimonialsBlock.astro'),
  pricing: () => import('./PricingBlock.astro'),
  relatedLinks: () => import('./RelatedLinksBlock.astro'),
  // ... universal blocks pre-registered
  // Generated blocks appended by generate_block tool
}
```

BlockRenderer reads from this registry instead of a switch statement. The `generate_block` tool (Section 8.5) must append an entry to `block-registry.ts` for each new business-specific block it creates.

### 5.6 Schema Generator Registry

The `seo.ts` file currently dispatches schema generation via a switch on page type. Generated schema generators must be callable without modifying the switch statement.

**Solution**: A schema registry that maps page types to generator functions:

```typescript
// templates/astro-site/src/lib/schema-registry.ts
export const schemaRegistry: Record<string, (data: any, baseUrl: string, settings: any) => any[]> = {
  home: generateHomeSchemas,
  service: generateServiceSchemas,
  location: generateLocationSchemas,
  blog: generateBlogSchemas,
  faq: generateFAQSchemas,
  // ... existing generators pre-registered
  // Generated schema generators appended by generate_schema tool
}
```

`generateSchemas()` in `seo.ts` reads from this registry instead of a switch. The `generate_schema` tool (Section 8.6) must append an entry to `schema-registry.ts` for each new page type.

### 5.7 BlockRenderer Architecture Update

Section metadata (background color/image, max-width, animation) should be applied at the BlockRenderer level rather than within individual block components. This enables consistent section styling across all blocks (universal and generated).

During content seeding, each block in the layout array can include additional metadata fields:
- `_sectionBackground`: `'white' | 'gray' | 'dark' | 'primary' | 'image'`
- `_sectionWidth`: `'narrow' | 'default' | 'wide' | 'full'`
- `_sectionAnimation`: `'none' | 'fade-in' | 'slide-up'`

BlockRenderer reads these metadata fields from each block entry and wraps the block component with the appropriate section container styling. This means block components remain pure content renderers while BlockRenderer handles layout concerns.

Alternatively, the blueprint can define section metadata at page generation time (via PageBlueprint's `sections` array), and BlockRenderer applies the metadata by matching section index to block index.

---

## 6. Layer 2: AI Generation Engine

### 6.1 How It's Invoked

The generation engine is **not a standalone script**. It's Claude Code itself, guided by the Master Orchestration Prompt (Section 9). The user gives Claude Code a prompt, and Claude Code follows the orchestration workflow, calling MCP tools and writing files.

**Entry points** (any of these work):

1. User types business description directly in Claude Code
2. User runs a generation skill/command (e.g., `/generate-site`)
3. `create-project.mjs` wizard includes a "Describe your business" step that saves the prompt, and Claude Code picks it up

### 6.2 Business Model Schema

The `analyze_business` tool outputs this structured format:

```typescript
interface BusinessModel {
  // Core identity
  businessName: string
  businessType: string              // e.g., "dog-grooming", "restaurant", "law-firm"
  industry: string                  // e.g., "pet-services", "food-beverage", "legal"
  description: string               // 2-3 sentence summary

  // Entity model
  entities: EntityDefinition[]      // What content types exist
  relationships: Relationship[]     // How entities relate
  crossProducts: CrossProduct[]     // Entity combinations that generate pages

  // User journeys
  primaryConversion: ConversionGoal // The main thing users should do
  secondaryConversions: ConversionGoal[]
  userJourneys: UserJourney[]       // Paths through the site

  // Content strategy
  contentPillars: string[]          // Main topic areas
  seoStrategy: SEOStrategy          // Keyword patterns, target search intents

  // CRM & automation
  crmPipeline: PipelineDefinition   // Stages, properties, automations
  emailSequences: EmailSequence[]   // Triggered email campaigns

  // Technical
  schemaOrgTypes: string[]          // Which schema.org types apply
  urlPatterns: URLPattern[]         // Route structure
  navStructure: NavDefinition       // Header/footer organization
}

interface EntityDefinition {
  name: string                      // e.g., "Treatment", "Location", "Pet"
  slug: string                      // e.g., "treatments", "locations", "pets"
  purpose: string                   // Why this entity exists
  fields: FieldDefinition[]         // Every field with type, validation, relations
  hasPublicPages: boolean           // Does this generate frontend routes?
  hasVersioning: boolean            // Drafts/publish workflow?
  hasBlocks: boolean                // Layout field with content blocks?
  sortField?: string                // Default sort (e.g., "name", "-publishedAt")
  adminGroup: string                // Payload admin sidebar group
}

interface FieldDefinition {
  name: string
  type: 'text' | 'textarea' | 'richText' | 'number' | 'select' | 'checkbox' |
        'date' | 'email' | 'upload' | 'relationship' | 'array' | 'group' | 'point' | 'json'
  required?: boolean
  unique?: boolean
  localized?: boolean
  validation?: string               // Regex or custom validation description
  options?: string[]                // For select fields
  relationTo?: string               // For relationship fields
  hasMany?: boolean                 // For relationship fields
  fields?: FieldDefinition[]        // For array/group fields
  min?: number
  max?: number
  defaultValue?: any
  adminPosition?: 'sidebar'         // Sidebar placement
  description?: string              // Admin UI help text
}

interface Relationship {
  from: string                      // Entity slug
  to: string                        // Entity slug
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  fieldName: string                 // Field on the 'from' entity
  required?: boolean
}

interface CrossProduct {
  entity1: string                   // e.g., "treatments"
  entity2: string                   // e.g., "locations"
  slug: string                      // e.g., "treatment-pages"
  urlPattern: string                // e.g., "/treatments/{treatment}/{location}"
  titlePattern: string              // e.g., "{Treatment} in {Location}"
  purpose: string                   // Why this cross-product exists
}
// Note: The `crossProducts` array can be empty. Not all businesses need cross-product pages
// (e.g., a single-location restaurant or a purely online SaaS).

interface ConversionGoal {
  action: string                    // e.g., "Book Appointment", "Request Quote"
  type: 'form' | 'phone' | 'link' | 'purchase'
  ctaText: string                   // Button text
  ctaStyle: 'primary' | 'secondary'
}

interface PipelineDefinition {
  name: string                      // e.g., "Grooming Customers"
  stages: string[]                  // e.g., ["Inquiry", "Booked", "Completed", "Repeat"]
  contactProperties: ContactProperty[]
  automations: CRMAutomation[]
}

interface EmailSequence {
  name: string                      // e.g., "booking-confirmation"
  trigger: string                   // When to send (e.g., "appointment booked")
  delay?: string                    // e.g., "24h", "7d"
  subject: string                   // Email subject line
  purpose: string                   // What the email achieves
  dataFields: string[]              // What data the template needs
}

interface URLPattern {
  pattern: string                   // e.g., "/treatments/[slug]"
  collection: string                // Which Payload collection
  pageType: string                  // For schema generation
  priority: number                  // Sitemap priority
}

interface UserJourney {
  name: string                        // e.g., "New Customer Discovery"
  steps: string[]                     // Page sequence: ["homepage", "listing", "detail", "contact"]
  conversionPoint: string             // Where conversion happens
  intent: string                      // "informational" | "transactional" | "navigational"
}

interface SEOStrategy {
  keywordPatterns: string[]            // e.g., ["{entity} in {location}", "{entity} near me"]
  targetIntents: string[]             // "transactional", "informational"
  contentPillars: string[]            // Main topic areas for blog content
  internalLinkingRules: string[]      // How pages should link to each other
  localSEO: boolean                   // Whether to optimize for local search
}

interface ContactProperty {
  name: string                        // CRM field name
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  options?: string[]                  // For select fields
  source: string                      // Where this data comes from (e.g., "form field", "computed")
}

interface CRMAutomation {
  trigger: string                     // e.g., "deal enters stage 'Completed'"
  action: string                      // e.g., "send review request email"
  delay?: string                      // e.g., "24h", "7d"
  condition?: string                  // Optional guard condition
}

interface NavDefinition {
  primary: NavItem[]                  // Main header navigation items
  secondary: NavItem[]                // Utility links (search, phone, etc.)
  footer: FooterSection[]             // Footer column sections
}

interface NavItem {
  label: string
  href: string
  children?: NavItem[]                // Dropdown items
  collection?: string                 // If populated from a Payload collection
  fetchMethod?: string                // e.g., "getAll" — how to populate children dynamically
}

interface FooterSection {
  heading: string
  links: NavItem[]
}

interface EntityDetailConfig {
  featureDisplay: 'list' | 'grid' | 'alternating'
  relatedEntitiesCount: number         // How many related entities to show (default: 5)
  pricingDisplay: boolean             // Whether to show pricing section
  galleryLayout: 'grid' | 'masonry' | 'carousel'
}
```

**Note on page type extensions**: Homepage and About page types do not have extension interfaces — their behavior is fully defined by their sections array (from PageBlueprint) and the business model analysis. Only entity detail pages, listing pages, and cross-product pages require `EntityDetailConfig` or similar extension interfaces.

### 6.3 Generation Contract

Every generation run must produce these outputs:

```typescript
interface GenerationOutput {
  // Payload CMS files
  collections: string[]             // File paths of generated collection configs
  blocks: string[]                  // File paths of generated block configs (business-specific only)
  hooks: string[]                   // File paths of generated hooks (if needed)
  globals: string[]                 // File paths of new/modified globals

  // Astro site files
  pages: string[]                   // File paths of generated .astro pages
  components: string[]              // File paths of generated components
  blockComponents: string[]         // File paths of generated block components

  // Configuration updates
  payloadConfigUpdates: string[]    // Changes to payload.config.ts
  sharedClientUpdates: string[]     // New collection helpers in client.ts
  sharedTypeUpdates: string[]       // New type definitions in types.ts
  seoUpdates: string[]              // New schema generators in seo.ts
  sitemapConfig: string             // sitemap-config.ts
  navConfig: string                 // nav-config.ts

  // Integration files
  crmConfig: string                 // CRM pipeline setup script
  emailTemplates: string[]          // React Email template files
  emailTriggers: string             // Webhook handler updates
  analyticsConfig: string           // PostHog event definitions

  // Content
  seedScript: string                // Script to populate CMS with content

  // Validation
  buildResult: 'pass' | 'fail'
  errors: string[]
}
```

---

## 7. Generation Pipeline: Step-by-Step

This is the complete sequence Claude Code follows for any business prompt.

### Step 1: Analyze Business Model

**Input**: Natural language business description
**Output**: Structured `BusinessModel` (Section 6.2)
**Tool**: `analyze_business` MCP tool (or Claude Code reasoning)

Claude Code:

1. Parses the business description
2. Identifies the core entities (what content types does this business need?)
3. Maps relationships between entities
4. Identifies cross-product opportunities (entity×entity pages for pSEO)
5. Determines the primary conversion goal (what should visitors do?)
6. Designs the CRM pipeline (how do leads flow?)
7. Plans email sequences (what automated emails make sense?)
8. Determines schema.org types
9. Designs URL structure
10. Plans navigation hierarchy

**Example** (dog grooming in Austin):
```yaml
entities:
  - Treatment (bath, haircut, nail trim, teeth cleaning, flea treatment)
  - Location (Downtown, South Lamar, Round Rock)
  - Pet (for CRM tracking — dogs, cats)
  - TeamMember (groomers)
  - BlogPost (pet care content marketing)
  - FAQ (common questions)
  - Testimonial (social proof)

crossProducts:
  - Treatment × Location = TreatmentPage (15 pages)

primaryConversion: Book Appointment (form)
secondaryConversion: Phone call

crmPipeline: Inquiry → Booked → Completed → Repeat Customer
emailSequences: booking_confirmation, appointment_reminder, review_request, loyalty_offer
schemaOrgTypes: LocalBusiness, Service, FAQPage, Article
```

### Step 2: Generate Payload Collections

**Input**: `BusinessModel.entities`
**Output**: One `.ts` file per entity in `templates/next-app/src/collections/`

For each entity, the generator creates a Payload `CollectionConfig` with:
- Appropriate field types (text, richText, upload, relationship, etc.)
- Access control (using existing predicates from Layer 1)
- Versioning (if `hasVersioning: true`)
- Auto-slug hook (if entity has public pages)
- Rebuild trigger hook (if entity has public pages)
- Admin config (useAsTitle, defaultColumns, group)
- Localization (if applicable): fields of type `text` (title/name/description), `textarea`, and `richText` should be `localized: true`. Fields of type `select`, `number`, `date`, `email`, `point`, `slug`, and `relationship` should NOT be localized.
- SEO fields (seoTitle, seoDescription, keywords group)
- Layout blocks field (if `hasBlocks: true`)

**Also updates**:
- `payload.config.ts` — import and register new collections
- `packages/shared/src/payload/types.ts` — add TypeScript interfaces
- `packages/shared/src/payload/client.ts` — add typed collection helpers

### Step 3: Generate Payload Blocks (Business-Specific)

**Input**: Business model analysis
**Output**: Block `.ts` files + corresponding Astro components

The generator reuses universal blocks (Hero, Content, CTA, Stats, Gallery, Team, FAQ, Testimonials, Pricing, RelatedLinks) and creates new blocks only if the business requires them.

**Examples of business-specific blocks**:
- Dog grooming: `TreatmentDetails` (duration, price, pet types, before/after gallery)
- Restaurant: `MenuBlock` (categories, items, prices, dietary tags)
- Law firm: `PracticeAreaDetails` (case types, success rates, timeline)
- Real estate: `PropertyListings` (price range, bedrooms, sqft, map)

### Step 4: Generate Astro Routes

**Input**: `BusinessModel.urlPatterns` + generated collections
**Output**: `.astro` files in `templates/astro-site/src/pages/`

For each URL pattern:

1. Create the page file with SSR header (`export const prerender = false`)
2. Import the Payload client and relevant helpers
3. Fetch data from the appropriate collection
4. Handle missing data (redirect to 404)
5. Pass data to SEOLayout with correct pageType and schemaData
6. Render Breadcrumbs
7. Render BlockRenderer with the layout blocks
8. Apply cache headers via `setCacheHeaders(Astro)`
9. Look up the PageBlueprint matching this route's `pageType` (see blueprint spec §6-17). The blueprint defines:
   - Required and optional sections (`sections[]` array)
   - Block types for each section (`sections[].blocks[]`)
   - Section styling (`background`, `width`, `animation`)
   - CRO rules (`cro` — CTA placement, trust signal positions)
   - SEO rules (`seo` — schema types, heading hierarchy, internal linking)
10. For listing pages, generate card components using the blueprint's `listing.cardComponent` name and `listing.cardFields` field mapping (see blueprint spec §8, §18)

**Also generates**:
- Index pages (e.g., `/treatments`, `/locations`) with listing grids
- Card components for each entity (e.g., `TreatmentCard.astro`)
- Updated `sitemap-config.ts` with new collections

**Redirect handling**: Before generating new routes, snapshot all existing URL patterns. After generation, compare old and new patterns and automatically create 301 redirects via the redirects plugin for any changed URLs. This prevents SEO loss when re-generating a site that already has indexed pages.

### Step 5: Generate JSON-LD Schemas

**Input**: `BusinessModel.schemaOrgTypes` + page types
**Output**: New schema generator functions in `seo.ts`

For each page type, add a schema generator to `templates/astro-site/src/lib/seo.ts`:
- Uses the correct schema.org type (LocalBusiness, Service, Product, CreativeWork, etc.)
- Populates fields from the page's data
- Includes breadcrumbs
- Includes organization schema

### Step 6: Configure Twenty CRM

**Input**: `BusinessModel.crmPipeline`
**Output**: Twenty CRM API calls + updated plugin config

CRM configuration is a non-blocking step. If Twenty CRM is unreachable (Docker not running, API key invalid), the tool writes pipeline configuration to `crm-deferred-config.json` and the pipeline continues. A standalone `apply_crm_config` tool can apply the deferred config later when Twenty becomes available.

When Twenty is available:

1. Create pipeline with stages via Twenty metadata API
2. Create custom contact properties (e.g., `petName`, `preferredLocation`)
3. Update `twenty-crm.ts` plugin config with new sync mappings
4. Update webhook handler for new CRM events

### Step 7: Generate Email Sequences

**Input**: `BusinessModel.emailSequences`
**Output**: React Email template files + trigger logic

For each email sequence:

1. Create `.tsx` template in `templates/next-app/src/emails/`
2. Include business-specific content and data fields
3. Add trigger logic to webhook handlers (immediate or scheduled via Resend)

### Step 8: Seed Content

**Input**: Business model + generated collections
**Output**: Payload API calls creating CMS entries

For each collection:

1. Generate realistic content appropriate to the business
2. Create entries via Payload REST API
3. Link entries via relationships (e.g., FAQ→Treatment, TeamMember→Location)
4. Set publish status on entries that should be live
5. For collections with a `layout` field, populate the layout array following the PageBlueprint's section sequence:
   - Fetch the PageBlueprint matching the collection's page type
   - For each `required: true` section: add a block from `sections[].blocks[]` (prefer `priority: 'preferred'`)
   - For each `required: false` section: add only if the `when` condition matches the business model
   - Populate block fields with contextual content (entity name in CTAs, entity-specific testimonials, etc.)
   - See blueprint spec §2 (Integration) and §6-17 (page type blueprints)

### Step 9: Generate Navigation

**Input**: `BusinessModel.navStructure` + generated pages
**Output**: Updated SiteHeader and SiteFooter

1. Write `nav-config.ts` with primary/secondary/footer link definitions
2. Update SiteHeader to use the config (dropdown for main entity, static links)
3. Update SiteFooter to use the config (entity links, company links, social)

### Step 10: Validate

**Input**: All generated files
**Output**: Build pass/fail + error list

1. Run `pnpm build:next` (Payload config must compile)
2. Run `pnpm build:astro` (all pages must render)
3. Check for TypeScript errors
4. Verify all routes resolve
5. Verify JSON-LD schemas validate
6. Take screenshots of key pages

### 7.1 Error Handling & Recovery

#### Step Failure Modes

Each pipeline step can fail independently:

| Step | Failure Mode | Behavior |
|------|-------------|----------|
| Step 1 (Analyze) | Ambiguous prompt | Ask follow-up questions; do not proceed |
| Step 2 (Collections) | TypeScript compile error | Fix and retry; generation cannot proceed without valid collections |
| Step 3 (Blocks) | Missing block dependency | Fall back to universal blocks; log warning |
| Step 4 (Routes) | Broken import / missing helper | Fix import path and retry |
| Step 5 (Schemas) | Invalid schema.org type | Fall back to generic Organization schema |
| Step 6 (CRM) | Twenty CRM unreachable / API key invalid | **Non-blocking** — write to `crm-deferred-config.json` and continue |
| Step 7 (Emails) | Resend unreachable / template error | **Non-blocking** — write templates to disk, defer sending config |
| Step 8 (Seed) | Payload API timeout | Resume from last successful entry via manifest |
| Step 9 (Nav) | Missing page references | Generate nav with available pages; log skipped entries |
| Step 10 (Validate) | Build failure | Report errors; do not mark generation as complete |

#### Generation Manifest

A `.generation-manifest.json` file tracks completed steps and generated files. Each step writes its outputs to the manifest before proceeding:

```json
{
  "businessModel": "dog-grooming",
  "startedAt": "2026-04-13T10:00:00Z",
  "steps": {
    "analyze": { "status": "completed", "outputs": ["business-model.json"] },
    "collections": { "status": "completed", "outputs": ["src/collections/Treatments.ts", "..."] },
    "blocks": { "status": "completed", "outputs": ["src/blocks/TreatmentDetails.ts", "..."] },
    "routes": { "status": "in-progress", "outputs": ["src/pages/treatments/index.astro"] },
    "schemas": { "status": "pending" },
    "crm": { "status": "deferred", "deferredConfig": "crm-deferred-config.json" },
    "emails": { "status": "pending" },
    "seed": { "status": "pending" },
    "nav": { "status": "pending" },
    "validate": { "status": "pending" }
  },
  "generatedFiles": ["path/to/file1.ts", "path/to/file2.astro"]
}
```

#### Resume from Failure

The orchestration prompt checks for an existing `.generation-manifest.json` and resumes from the last incomplete step. Completed steps are skipped entirely. In-progress steps are re-run from the beginning of that step.

#### Rollback via Manifest

A `--cleanup` flag reads the manifest and deletes all generated files listed in `generatedFiles`, restoring the project to its pre-generation state. Files listed in §17.2 (modified files) are reverted via `git checkout` for those specific paths.

#### Non-blocking Steps

CRM configuration (Step 6) and email generation (Step 7) are deferrable. If they fail:
1. Write the intended configuration to a deferred file (`crm-deferred-config.json` or `email-deferred-config.json`)
2. Mark the step as `"deferred"` in the manifest
3. Continue with the remaining pipeline steps
4. A standalone `apply_crm_config` or `apply_email_config` tool can apply the deferred config later when the external service becomes available

---

## 8. MCP Tool Specifications

### 8.1 `analyze_business`

**Purpose**: Convert natural language business description into structured BusinessModel.

**Parameters**:
```typescript
{
  prompt: string       // The business description
  followUpQuestions?: boolean  // If true, ask clarifying questions
}
```

**Returns**: `BusinessModel` (Section 6.2)

**Implementation**: This is primarily Claude Code reasoning, not a tool that calls external APIs. The "tool" is an MCP prompt that structures the output format and ensures completeness.

**Cross-product validation rule**: Cross-products require both parent entities to have `hasPublicPages: true` and at least 2 planned entries each. Do not create cross-products for purely online businesses unless the cross-product provides distinct SEO value (e.g., a SaaS company with industry-specific landing pages).

**Pricing applicability guidance**: The `analyze_business` tool should set pricing data on entities only when the business has transparent, displayable pricing. Businesses with variable/quote-based pricing (law firms, custom services) should set `pricing.showPricing: false`.

### 8.2 `generate_collection`

**Purpose**: Create a Payload collection config file from an entity definition.

**Parameters**:
```typescript
{
  entity: EntityDefinition
  blocks: string[]     // Available block slugs for the layout field
  hooks: string[]      // Hook file paths to attach
}
```

**Returns**: `{ filePath: string, collectionSlug: string }`

**Implementation**: Writes a `.ts` file to `templates/next-app/src/collections/`. Uses the entity's field definitions to build the Payload config.

**Slug collision guard**: The following slugs are reserved and must never be used for generated collections:

```
pages, media, users, contacts, search, redirects, forms, form-submissions,
payload-preferences, payload-migrations, plugin-ai-instructions
```

If the AI produces a collision with a reserved slug, append the business type prefix (e.g., `portfolio-media` instead of `media`, `restaurant-pages` instead of `pages`). The tool must validate the slug against this deny-list before writing the file.

**Standard helper generation pattern**: For each generated collection, the tool also generates typed helper methods in the shared Payload client following this pattern:

```typescript
// Standard pattern for generated collection helpers:
getAll{Entity}(params?) → fetchPublished('{slug}', { limit: '1000', sort: '{sortField}', ...params })
get{Entity}BySlug(slug) → fetchBySlug('{slug}', slug, 2)
// For cross-products:
get{CrossProduct}(parent1Slug, parent2Slug) → fetchPublished('{slug}', { where query matching both parents })
```

### 8.3 `generate_cross_product_collection`

**Purpose**: Create a cross-product collection (e.g., Treatment × Location = TreatmentPage).

**Parameters**:
```typescript
{
  crossProduct: CrossProduct
  parentEntities: [EntityDefinition, EntityDefinition]
}
```

**Returns**: `{ filePath: string, collectionSlug: string, hookFilePath: string }`

**Implementation**: Creates collection with required relationships to both parents, auto-slug hook that concatenates parent slugs, quality gate, and title auto-generation.

### 8.4 `generate_page`

**Purpose**: Create an Astro page file for a route pattern.

**Parameters**:
```typescript
{
  urlPattern: URLPattern
  collection: string           // Payload collection slug
  fetchMethod: string          // e.g., "getBySlug", "getAll"
  pageType: string             // For schema generation
  blueprint: string              // Required. The pageType that maps to a registered PageBlueprint.
                                 // Determines page structure, block rendering order, section styling,
                                 // CRO rules, and SEO config. See blueprint spec §3 and §6-17.
  renderBlocks: boolean        // Whether to use BlockRenderer
  context?: Record<string, string>  // Additional context for block rendering
}
```

**Returns**: `{ filePath: string }`

### 8.5 `generate_block`

**Purpose**: Create a business-specific Payload block + Astro component.

**Parameters**:
```typescript
{
  name: string
  slug: string
  fields: FieldDefinition[]
  componentTemplate: string    // Rendering instructions
}
```

**Returns**: `{ blockFilePath: string, componentFilePath: string }`

### 8.6 `generate_schema`

**Purpose**: Add a JSON-LD schema generator to `seo.ts`.

**Parameters**:
```typescript
{
  pageType: string
  schemaOrgType: string
  fieldMappings: Record<string, string>  // schema.org field → data path
}
```

**Returns**: `{ updated: true }`

### 8.7 `configure_crm_pipeline`

**Purpose**: Set up Twenty CRM pipeline via API.

**Parameters**:
```typescript
{
  pipeline: PipelineDefinition
}
```

**Returns**: `{ pipelineId: string, stageIds: string[] }`

**Implementation**: Calls Twenty metadata API to create objects, fields, and relations.

CRM configuration is a non-blocking step. If Twenty CRM is unreachable (Docker not running, API key invalid), the tool writes pipeline configuration to `crm-deferred-config.json` and the pipeline continues. A standalone `apply_crm_config` tool can apply the deferred config later when Twenty becomes available.

### 8.8 `generate_email_sequence`

**Purpose**: Create React Email template + trigger logic.

**Parameters**:
```typescript
{
  sequence: EmailSequence
  businessContext: { businessName: string, businessType: string }
}
```

**Returns**: `{ templateFilePath: string, triggerUpdated: boolean }`

### 8.9 `seed_collection`

**Purpose**: Populate a collection with realistic content.

**Parameters**:
```typescript
{
  collection: string
  count: number
  businessContext: BusinessModel
  relationships?: Record<string, string[]>  // Related doc IDs
  pageType?: string            // If provided, the seeder populates each entry's layout array
                               // following the corresponding PageBlueprint's section sequence
}
```

**Returns**: `{ created: number, ids: string[] }`

**Implementation**: Calls Payload REST API to create entries. Uses the business model to generate contextually appropriate content.

### 8.10 `generate_nav`

**Purpose**: Write navigation config and update header/footer.

**Parameters**:
```typescript
{
  navStructure: NavDefinition
  primaryEntity: string        // Entity for main dropdown
  secondaryLinks: string[]     // Static page links
}
```

**Returns**: `{ headerUpdated: boolean, footerUpdated: boolean }`

### 8.11 `validate_generation`

**Purpose**: Verify everything works.

**Parameters**:
```typescript
{
  manifest: GenerationOutput
}
```

**Returns**: `{ buildResult: 'pass'|'fail', errors: string[] }`

**Implementation**: Runs `pnpm build:next`, `pnpm build:astro`, checks TypeScript, validates JSON-LD.

---

## 9. Master Orchestration Prompt

This is the system prompt / MCP prompt that guides Claude Code through the generation pipeline. It should be stored as an MCP prompt or Claude Code skill.

> ### Universal Website Generation Protocol
>
> You are generating a complete website stack from a business description. Follow these steps exactly.
>
> #### Phase 1: Analysis (no file writes)
>
> 1. Read the business description carefully
> 2. Identify all content entities the business needs
> 3. Map relationships between entities
> 4. Identify cross-product opportunities (entity × entity for pSEO)
> 5. Determine the primary conversion goal
> 6. Design the CRM pipeline stages
> 7. Plan email sequences
> 8. Determine schema.org types
> 9. Design URL structure
> 10. Plan navigation hierarchy
> 11. Output the complete BusinessModel as structured data
>
> #### Phase 2: Layer 1 Preparation
>
> 1. Verify Layer 1 primitives are in place (SEOLayout, BlockRenderer, etc.)
> 2. Identify which universal blocks will be reused
> 3. Identify which new business-specific blocks are needed
> 4. Plan the complete file manifest (what will be created/modified)
>
> #### Phase 3: Collection Generation
>
> For each entity in the business model:
>
> 1. Generate the Payload collection config file
> 2. Include all fields with correct types, validation, and relationships
> 3. Apply access control (`publishedOrLoggedIn` read, `isAdminOrEditor` write)
> 4. Add versioning if the entity has public pages
> 5. Attach slug auto-generation and rebuild trigger hooks
> 6. Configure admin UI (useAsTitle, defaultColumns, group)
>
> Then, after all collections are generated:
>
> 1. Update `payload.config.ts` to import and register collections
> 2. Update shared types (`packages/shared/src/payload/types.ts`)
> 3. Update shared client (`packages/shared/src/payload/client.ts`)
>
> #### Phase 4: Block Generation
>
> 1. List the universal blocks being reused
> 2. For each new business-specific block:
>    - Create the Payload block config
>    - Create the corresponding Astro component
> 3. Register new blocks in the block index
>
> #### Phase 5: Route Generation
>
> For each URL pattern:
>
> 1. Create the Astro page file
> 2. Set SSR mode (`export const prerender = false`)
> 3. Implement data fetching from the correct collection
> 4. Handle missing data (redirect to 404)
> 5. Render SEOLayout with correct page type
> 6. Render Breadcrumbs and BlockRenderer
> 7. Look up the PageBlueprint for this page type (see blueprint spec §6-17)
> 8. Apply blueprint's section styling (background, width, animation via AnimatedSection)
> 9. For listing pages, generate card component from blueprint's `listing.cardFields` config
>
> Additionally, create these supporting files:
>
> 1. Index pages for each entity listing
> 2. Card components for grid displays
> 3. Update `sitemap-config.ts`
>
> #### Phase 6: SEO Generation
>
> 1. Add schema generators to `seo.ts` for each page type
> 2. Update SEOLayout dispatch to include new page types
> 3. Generate keyword strategy document
> 4. Configure internal linking patterns
>
> #### Phase 7: Integration Generation
>
> 1. Configure Twenty CRM pipeline (stages, contact properties)
> 2. Update CRM sync plugin mapping
> 3. Generate email templates
> 4. Update webhook handlers with new triggers
> 5. Define PostHog analytics events
>
> #### Phase 8: Content Seeding
>
> 1. Generate realistic content for each collection
> 2. Create CMS entries via Payload API
> 3. Link entries via relationships
> 4. Publish entries
> 5. For entries with layout fields, populate the layout array following the PageBlueprint's section sequence (blueprint spec §2, §6-17)
> 6. Evaluate `when` conditions on optional sections against the business model
>
> #### Phase 9: Navigation
>
> 1. Write `nav-config.ts`
> 2. Update SiteHeader with correct dropdown/links
> 3. Update SiteFooter with correct sections
>
> #### Phase 10: Validation
>
> 1. Run `pnpm build:next` (must pass)
> 2. Run `pnpm build:astro` (must pass)
> 3. Fix any errors and re-run
> 4. Take screenshots of key pages
> 5. Report completion with file manifest

---

## 10. Content Seeding System

### 10.1 Seed Content Requirements

For each business, the generator must create **realistic, SEO-optimized content** — not placeholder text. This means:

- Entity names and descriptions should be real and specific to the business
- Blog posts should cover topics relevant to the industry
- Testimonials should have realistic names, ratings, and reviews
- Team members should have appropriate titles and bios
- FAQs should answer real questions customers would ask
- Cross-product pages should have location-specific content

### 10.2 Content Volume Guidelines

| Collection | Minimum Entries | Notes |
|-----------|----------------|-------|
| Primary entity (treatments, projects, etc.) | All that the user specified | Each with full description, image (see image strategy below), SEO fields |
| Locations | All that the user specified | Each with address, hours, coordinates |
| Cross-product pages | All combinations | Service × Location |
| Blog posts | 5-10 | Industry-relevant topics |
| FAQs | 10-15 | Mix of general and entity-specific |
| Testimonials | 8-12 | Varied ratings (mostly 4-5 stars) |
| Team members | 3-6 | Appropriate titles and bios |

**Image seeding strategy**: The seeder handles images in three tiers:
1. **AI generation** (preferred): If AI image generation keys are available (`OPENAI_API_KEY` for DALL-E), generate contextual images matching the entity name and description, then upload to the Media collection.
2. **Stock photos**: If no AI keys, download royalty-free images from the Unsplash API matching the entity name as a search query.
3. **No images**: If no API access is available, create entries without images and log a list of entities needing manual image uploads to stdout.

**Performance limits**: Cross-product page limit: maximum 200 pages per generation run. For businesses exceeding this (e.g., 30 services x 20 locations = 600), the generator creates the first 200 highest-priority combinations and logs the remainder for subsequent runs. Content uniqueness validation uses sampling for sets > 100 pages (validate 10% of pairs randomly).

### 10.3 Seed Script Architecture

The seed script is a TypeScript file that:

1. Checks if content already exists (idempotent)
2. Creates entries in dependency order (entities before cross-products)
3. Stores created IDs for relationship linking
4. Reports creation counts

**Seed manifest**: A `.seed-manifest.json` file records each created entry's collection, ID, and slug:

```json
{
  "seededAt": "2026-04-13T10:30:00Z",
  "entries": [
    { "collection": "treatments", "id": "abc123", "slug": "full-grooming" },
    { "collection": "locations", "id": "def456", "slug": "downtown-austin" }
  ],
  "progress": { "current": 47, "total": 500 }
}
```

- **`--cleanup` flag**: Deletes all entries listed in the manifest, in reverse dependency order (cross-products first, then parent entities)
- **`--resume` flag**: Reads the manifest, skips already-created entries, and continues from the last successful entry
- **Batch creation**: Entries are created in batches (default 10 per batch) with per-batch verification that all entries were successfully created before proceeding
- **Progress reporting**: Logs progress to stdout (e.g., "Seeding treatments 47/500...") for visibility during long seeding runs

---

## 11. CRM Pipeline Generation

### 11.1 Pipeline Design by Business Type

The CRM pipeline adapts to the business model:

| Business Type | Pipeline Stages | Key Properties |
|--------------|----------------|----------------|
| Service business | Inquiry → Quoted → Booked → Completed → Follow-up | serviceNeeded, preferredDate, estimateAmount |
| Restaurant | Reservation → Confirmed → Completed → Review | partySize, dietaryReqs, specialOccasion |
| Law firm | Inquiry → Consultation → Retained → Active → Closed | caseType, urgency, referralSource |
| Agency/Portfolio | Lead → Proposal → Negotiation → Won → Delivery | projectType, budget, timeline |
| SaaS | Lead → Demo → Trial → Negotiation → Customer | planInterest, companySize, useCase |

### 11.2 Automation Rules

For each pipeline, generate automations:

- **Stage entry**: Send appropriate email when deal enters a stage
- **Time-based**: Send follow-up if deal sits in a stage too long
- **Completion**: Send review request after service delivery
- **Loyalty**: Schedule re-engagement after defined period

### 11.3 CRM Sync Mapping

The `configure_crm_pipeline` tool must also output a sync configuration that maps generated collections to Twenty CRM objects. This mapping is appended to the `twentyCrmPlugin` config in `twenty-crm.ts`:

```typescript
// Generated sync mapping appended to twentyCrmPlugin config
{
  collection: 'form-submissions',
  formSubmission: true,
  targets: [
    { object: 'people', fields: [/* mapped from contact form */] },
    { object: 'notes', bodyField: 'message', linkToPersonByEmail: 'email' },
  ],
}
```

The sync mapping connects form submissions to CRM contacts and notes, and can optionally create opportunities (deals) in the pipeline when specific form types are submitted (e.g., a booking form creates an opportunity in the "Inquiry" stage).

---

## 12. Email Sequence Generation

### 12.1 Universal Sequences (every business gets these)

1. **Welcome** — When contact is created in CRM
2. **Follow-up** — 3-7 days after initial contact if no conversion
3. **Thank you** — After conversion/purchase/booking

### 12.2 Business-Specific Sequences

Generated based on the business model's email sequence definitions. Examples:

| Sequence | Trigger | Delay | Purpose |
|----------|---------|-------|---------|
| Booking confirmation | Appointment booked | Immediate | Confirm details, prep instructions |
| Appointment reminder | Scheduled appointment | 24h before | Reduce no-shows |
| Review request | Service completed | 24h after | Generate reviews |
| Loyalty offer | Last visit age | 30-90 days | Drive repeat business |
| Birthday/anniversary | Contact birthdate | On date | Personal touch |

### 12.3 Email Template Architecture

All templates use:
- `@react-email/components` for rendering
- Consistent branding from SiteSettings (siteName, logo, phone, address)
- Resend for delivery with tags for tracking
- `scheduledAt` for delayed sends

---

## 13. SEO Strategy Generation

### 13.1 Keyword Strategy

Based on business type, the generator creates keyword patterns:

| Pattern | Example (dog grooming) | Example (law firm) |
|---------|----------------------|-------------------|
| Primary | "dog grooming" | "personal injury lawyer" |
| + Location | "dog grooming austin tx" | "personal injury lawyer houston" |
| + Service | "dog teeth cleaning" | "car accident attorney" |
| + Service + Location | "dog teeth cleaning austin" | "car accident attorney houston" |
| Long-tail | "how often should you groom your dog" | "what to do after a car accident" |
| LSI terms | "pet grooming, canine care, dog spa" | "legal representation, injury claim, settlement" |

### 13.2 Internal Linking Strategy

- **Pillar pages**: Main entity pages link to all related content
- **Cross-links**: Related entities link to each other
- **Blog → Entity**: Blog posts link to relevant services/treatments
- **Footer**: Top locations and services in footer
- **Breadcrumbs**: Every page has breadcrumb trail

### 13.3 Meta Template Generation

For each page type, generate meta title/description templates:

| Page Type | Title Template | Description Template |
|-----------|---------------|---------------------|
| Service page | `{ServiceName} \| {BusinessName}` | `Professional {serviceName} services. {shortDescription}. Call {phone}.` |
| Location page | `{BusinessName} in {City}, {State}` | `{businessType} serving {city}, {state}. {tagline}. Book today!` |
| Cross-product | `{ServiceName} in {City}, {State} \| {BusinessName}` | `Expert {serviceName} in {city}. {localContent snippet}. Call {phone}.` |

---

## 14. Analytics & Tracking Generation

### 14.1 PostHog Event Definitions

For each business, define tracking events:

**Universal events** (every business):
- `page_viewed` (url, pageType, collection)
- `cta_clicked` (ctaText, destination, location)
- `form_submitted` (formName, source)
- `search_performed` (query, resultCount)
- `phone_clicked` (source)

**Business-specific events** (generated):
- `appointment_booked` (treatmentType, location, date)
- `review_submitted` (rating, source)
- `blog_article_read` (slug, readTime, scrollDepth)

**Contact page form rendering**: The contact page requires a `PayloadForm` React island component (`templates/astro-site/src/components/PayloadForm.tsx`) that fetches form configuration from Payload's forms collection at runtime and renders fields client-side with `react-hook-form`. This component is a Layer 1 universal component (added to Section 17.1).

**Note**: Analytics event generation is handled as part of the orchestration prompt reasoning (Phase 7, Step 5). The output is an `analytics-config.ts` file listing PostHog events. No dedicated MCP tool is required — the AI writes the config file directly during the integration generation phase.

### 14.2 Analytics Dashboard Recommendations

The generator outputs a PostHog dashboard config with:
- Conversion funnel (visit → CTA click → form submit → booking)
- Top pages by traffic
- Source attribution
- Geographic distribution (for multi-location businesses)

---

## 15. Validation & Quality Assurance

### 15.1 Build Validation

After generation, verify that the project compiles without errors:

1. `pnpm build:next` passes (Payload config compiles, TypeScript clean)
2. `pnpm build:astro` passes (all pages render, no broken imports)
3. No TypeScript errors in generated files
4. All Astro pages resolve (no 500 errors during build)

### 15.2 Content Validation

Verify that seed content meets minimum quality thresholds:

1. All collections have at least minimum entries
2. All relationships are valid (no dangling references)
3. All required fields are populated
4. SEO fields are within character limits
5. JSON-LD schemas validate against schema.org

### 15.3 Link Validation

Verify that all internal navigation is functional:

1. No broken internal links
2. All nav links resolve to real pages
3. Breadcrumbs are consistent
4. Sitemap includes all public pages

### 15.4 Visual Validation

Verify that pages render correctly in the browser:

1. Take screenshots of homepage, entity listings, detail pages
2. Verify layout renders correctly (no broken grids, missing images)
3. Verify mobile responsiveness (if screenshot tool supports viewport)

---

## 16. Migration Strategy

### 16.1 From Current State to Universal Platform

**Phase 1: Extract Layer 1** (non-breaking)

1. Create `src/collections/_universal/` directory
2. Move Pages, Media, Users to `_universal/`
3. Create `src/blocks/_universal/` directory
4. Move universal blocks there
5. Keep all imports working via barrel exports
6. Verify existing functionality unchanged

**Phase 2: Extract Service-Area as Reference** (non-breaking)

1. Create `src/collections/_service-area/` directory
2. Move Services, Locations, ServicePages, BlogPosts, FAQs, Testimonials, TeamMembers there
3. Create `src/blocks/_service-area/` directory
4. Move ServiceDetail, LocationMap there
5. Keep all imports working
6. Document as "reference implementation"

**Phase 3: Build Generation Engine** (new functionality)

1. Implement MCP tools (Section 8)
2. Implement Master Orchestration Prompt (Section 9)
3. Test with service-area business (should reproduce current output)
4. Test with 2-3 different business types

**Phase 4: Validate and Ship**

1. Run E2E tests
2. Generate a portfolio site from scratch
3. Generate a restaurant site from scratch
4. Verify all infrastructure works (preview, deploy, search, sitemap)

### 16.2 Backwards Compatibility

Existing projects using the service-area template are **not affected**. The generation engine is additive — it runs on new projects. Existing projects continue to use their committed collection/route files.

---

## 17. File Manifest

### 17.1 New Files to Create

**Generation engine:**

- `templates/next-app/src/mcp/tools/analyze-business.ts`
- `templates/next-app/src/mcp/tools/generate-collection.ts`
- `templates/next-app/src/mcp/tools/generate-cross-product.ts`
- `templates/next-app/src/mcp/tools/generate-page.ts`
- `templates/next-app/src/mcp/tools/generate-block.ts`
- `templates/next-app/src/mcp/tools/generate-schema.ts`
- `templates/next-app/src/mcp/tools/configure-crm.ts`
- `templates/next-app/src/mcp/tools/generate-email.ts`
- `templates/next-app/src/mcp/tools/seed-collection.ts`
- `templates/next-app/src/mcp/tools/generate-nav.ts`
- `templates/next-app/src/mcp/tools/validate-generation.ts`

**Orchestration:**

- `templates/next-app/src/mcp/prompts/generation-protocol.ts`

**Configuration helpers:**

- `templates/astro-site/src/lib/sitemap-config.ts`
- `templates/astro-site/src/lib/nav-config.ts`
- `templates/astro-site/src/lib/blueprint-registry.ts`
- `templates/astro-site/src/lib/schema-registry.ts`
- `templates/astro-site/src/components/blocks/block-registry.ts`
- `templates/next-app/src/lib/plugin-config.ts`

**Layer 1 organization:**

- `templates/next-app/src/collections/_universal/index.ts`
- `templates/next-app/src/blocks/_universal/index.ts`

**Layer 1 universal components:**

- `templates/astro-site/src/components/AnimatedSection.astro`
- `templates/astro-site/src/components/FilterBar.astro`
- `templates/astro-site/src/components/Pagination.astro`
- `templates/astro-site/src/components/FeaturedPostCard.astro`
- `templates/astro-site/src/components/AuthorBio.astro`
- `templates/astro-site/src/components/TableOfContents.astro`
- `templates/astro-site/src/components/SocialShare.astro`
- `templates/astro-site/src/components/FAQSearch.astro`
- `templates/astro-site/src/components/PayloadForm.tsx`
- `templates/astro-site/src/components/StickyPhoneBar.astro`
- `templates/astro-site/src/components/EmptyState.astro`

### 17.2 Files to Modify

**Registration:**

- `templates/next-app/src/payload.config.ts` — Dynamic collection imports
- `templates/next-app/src/plugins/index.ts` — Refactor `getPlugins()` to read from `plugin-config.ts` instead of hardcoding collection arrays
- `templates/next-app/src/mcp/index.ts` — Register new tools/prompts

**Shared package:**

- `packages/shared/src/payload/client.ts` — Add generated collection helpers
- `packages/shared/src/payload/types.ts` — Add generated type definitions

**Astro infrastructure:**

- `templates/astro-site/src/pages/sitemap.xml.ts` — Read from sitemap-config.ts
- `templates/astro-site/src/components/SiteHeader.astro` — Read from nav-config.ts
- `templates/astro-site/src/components/SiteFooter.astro` — Read from nav-config.ts
- `templates/astro-site/src/lib/seo.ts` — Add generated schema functions

**CRM:**

- `templates/next-app/src/plugins/twenty-crm.ts` — Updated sync mappings
- `templates/next-app/src/webhooks/twenty-handler.ts` — New event handlers

**Project wizard:**

- `scripts/create-project.mjs` — Add "describe your business" step

---

## 18. Implementation Phases

### Phase 1: Layer 1 Extraction (2-3 sessions)

**Goal**: Cleanly separate universal from business-specific code without breaking anything.

**Tasks**:

1. Create `_universal/` directories for collections and blocks
2. Move universal collections (Pages, Media, Users) with barrel exports. The `_universal/index.ts` barrel export must maintain the same public API as the current `collections/index.ts` to avoid breaking import paths in `payload.config.ts`.
3. Move universal blocks with barrel exports
4. Split SiteSettings into universal fields
5. Create `sitemap-config.ts` and `nav-config.ts` (config-driven)
6. Update sitemap/header/footer to read from configs
7. Build 11 universal components from blueprint spec §19: AnimatedSection, FilterBar, Pagination, FeaturedPostCard, AuthorBio, TableOfContents, SocialShare, FAQSearch, PayloadForm, StickyPhoneBar, EmptyState
8. Refactor BlockRenderer to support section wrappers for background alternation, width control, and scroll animations (blueprint spec §4-5)
9. Verify `pnpm build:astro` and `pnpm build:next` pass
10. Verify existing preview, search, deploy functionality works

**Success criteria**: All existing functionality unchanged. `validate-template.sh` passes.

### Phase 2: Generation Engine Core (3-4 sessions)

**Goal**: Build the MCP tools and orchestration prompt.

**Tasks**:

1. Implement `analyze_business` tool/prompt
2. Implement `generate_collection` tool
3. Implement `generate_cross_product_collection` tool
4. Implement `generate_page` tool
5. Implement `generate_block` tool
6. Implement `generate_schema` tool
7. Implement PageBlueprint registry — load universal blueprints from blueprint spec §6-17; `generate_page` and `seed_collection` tools consume blueprints to determine page structure and layout array composition
8. Implement `generate_nav` tool
9. Implement `validate_generation` tool
10. Write the Master Orchestration Prompt
11. Test: regenerate the service-area business from a prompt

**Success criteria**: Can describe "plumbing company in Austin with 5 service areas" and get equivalent output to current hardcoded implementation. Generated pages must follow the appropriate PageBlueprint structure (see blueprint spec §7-9 for entity detail, listing, and cross-product page structures).

### Phase 3: Integration Generation (2-3 sessions)

**Goal**: CRM, email, content seeding, analytics.

**Tasks**:

1. Implement `configure_crm_pipeline` tool
2. Implement `generate_email_sequence` tool
3. Implement `seed_collection` tool
4. Implement analytics event generation
5. Test CRM pipeline creation via Twenty API
6. Test email template generation and sending
7. Test content seeding for a new business type
8. Verify seeded entries' layout arrays match their PageBlueprint section sequences — all required sections populated, optional sections respect `when` conditions

**Success criteria**: Full generation pipeline produces CRM config, emails, and seed content.

### Phase 4: Validation & Polish (1-2 sessions)

**Goal**: End-to-end testing with multiple business types.

**Tasks**:

1. Generate a portfolio/agency site from scratch
2. Generate a restaurant site from scratch
3. Generate a law firm site from scratch
4. Fix edge cases discovered during testing
5. Update `create-project.mjs` with business description step
6. Update documentation
7. Run `validate-template.sh` on generated projects

**Success criteria**: 3+ different business types successfully generated, built, and served.

---

## Appendix A: Example Generation — Dog Grooming Business

**User prompt**:
> "Paws & Claws dog grooming in Austin, TX. Three locations: Downtown (123 Congress Ave), South Lamar (456 S Lamar Blvd), Round Rock (789 Main St). Services: full grooming, bath & brush, nail trimming, teeth cleaning, flea treatment, puppy's first groom. Premium brand, appointment-based. Open Mon-Sat 8am-6pm."

**Generated collections**: Treatments, Locations, TreatmentPages (cross-product), BlogPosts, FAQs, Testimonials, TeamMembers

**Generated routes**: `/treatments`, `/treatments/[slug]`, `/treatments/[treatment]/[location]`, `/locations`, `/locations/[slug]`, `/blog`, `/blog/[slug]`, `/team`, `/faq`, `/contact`, `/about`

**Generated schemas**: LocalBusiness, Service, FAQPage, Article, BreadcrumbList

**Generated CRM pipeline**: Inquiry → Appointment Booked → Completed → Follow-up → Repeat Customer

**Generated emails**: booking_confirmation, appointment_reminder (24h), review_request (24h after), loyalty_offer (6 weeks), puppy_milestone (after first groom)

**Seed content**: 6 treatments, 3 locations, 18 treatment×location pages, 5 blog posts, 12 FAQs, 10 testimonials, 5 team members

---

## Appendix B: Example Generation — Law Firm

**User prompt**:
> "Smith & Associates personal injury law firm in Houston, TX. Practice areas: car accidents, truck accidents, workplace injuries, slip and fall, medical malpractice, wrongful death. Two offices: Downtown Houston (500 Main St) and The Woodlands (100 Woodlands Pkwy). Want to rank for injury lawyer keywords in Houston metro."

**Generated collections**: PracticeAreas, Offices, PracticeAreaPages (cross-product), CaseResults, BlogPosts, FAQs, Testimonials, Attorneys

**Generated routes**: `/practice-areas`, `/practice-areas/[slug]`, `/practice-areas/[area]/[office]`, `/offices`, `/offices/[slug]`, `/results`, `/blog`, `/blog/[slug]`, `/attorneys`, `/faq`, `/contact`, `/about`

**Generated schemas**: LegalService, Attorney (Person), FAQPage, Article, BreadcrumbList

**Generated CRM pipeline**: Inquiry → Free Consultation → Case Evaluation → Retained → Active Case → Settled/Won

**Generated emails**: consultation_confirmation, case_update, settlement_notification, referral_request, annual_checkup

---

## Appendix C: Example Generation — Restaurant

**User prompt**:
> "Bella Cucina Italian restaurant in Portland, OR. Fine dining, reservation-based. Menu categories: antipasti, pasta, secondi, dolci, wine list. Chef's table experience available. Open Tue-Sun 5pm-10pm. Located at 200 NW 23rd Ave."

**Generated collections**: MenuCategories, MenuItems, Events, BlogPosts, Reviews, TeamMembers (chef profiles)

**Generated routes**: `/menu`, `/menu/[category]`, `/events`, `/reservations`, `/blog`, `/blog/[slug]`, `/about`, `/private-dining`, `/contact`

**Generated schemas**: Restaurant, Menu, MenuItem, FoodEvent, Article, BreadcrumbList

**Generated CRM pipeline**: Reservation Request → Confirmed → Completed → Follow-up

**Generated emails**: reservation_confirmation, reminder (2h before), thank_you_review_request, special_event_invitation, birthday_offer

---

*End of specification. This document is self-contained and provides all context needed for implementation sessions.*
