# Programmatic SEO Blueprint — Agency Web Stack

> **Purpose**: This document is a complete implementation blueprint for building programmatic SEO websites at scale using the Agency Web Stack (Payload CMS + Astro + Next.js + Supabase). It is designed to be fed into Claude Code as a reference when implementing programmatic SEO for any client project.
>
> **Audience**: Claude Code instances, developers, and agency team members building SEO-optimized websites that generate hundreds to hundreds of thousands of pages from structured data.

---

## Table of Contents

1. [Overview and Strategy](#1-overview-and-strategy)
2. [Architecture](#2-architecture)
3. [Payload CMS Plugins - Installation and Configuration](#3-payload-cms-plugins-installation-and-configuration)
4. [Collection Definitions - Data Models](#4-collection-definitions-data-models)
5. [Block Definitions - Page Template System](#5-block-definitions-page-template-system)
6. [Routing - Dynamic Page Generation](#6-routing-dynamic-page-generation)
7. [SEO Implementation](#7-seo-implementation)
8. [Content Uniqueness Requirements and Generation at Scale](#8-content-uniqueness-requirements-generation-at-scale)
9. [Seed Scripts and Data Import](#9-seed-scripts-and-data-import)
10. [Pillar Pages, Topic Clusters and Linking Architecture](#10-pillar-pages-topic-clusters-linking-architecture)
11. [Performance and Build Optimization](#11-performance-and-build-optimization)
12. [Analytics and Tracking](#12-analytics-and-tracking)
13. [CMS White-Labeling](#13-cms-white-labeling)
14. [Automation Workflows](#14-automation-workflows)
15. [Deployment Considerations](#15-deployment-considerations)
16. [Common Programmatic SEO Page Types](#16-common-programmatic-seo-page-types)
17. [Checklist - Before Launching a Client Site](#17-checklist-before-launching-a-client-site)
18. [Client Onboarding Guide](#18-client-onboarding-guide) *(see [`CLIENT_ONBOARDING_GUIDE.md`](./CLIENT_ONBOARDING_GUIDE.md))*

---

## 1. Overview and Strategy

### What Is Programmatic SEO?

Programmatic SEO creates large numbers of unique, search-optimized pages from structured data rather than manually writing each page. Instead of creating 10,000 individual pages, you create:

- **Data models** (collections in Payload CMS) — the structured content
- **Page templates** (blocks + frontend routes) — the rendering logic
- **Seed data** (scripts or CSV imports) — the raw information

The CMS stores the data. The frontend (Astro or Next.js) renders it. One template + N rows of data = N unique, indexable pages.

### When to Use Astro vs Next.js

| Use Case | Framework | Why |
|---|---|---|
| Marketing/SEO pages (services, locations, blog) | **Astro** | Static generation, zero JS by default, fastest possible page loads, best for Core Web Vitals |
| Dashboard/admin/interactive app pages | **Next.js** | Server components, API routes, Payload CMS admin panel lives here |
| E-commerce with dynamic pricing | **Next.js** | Needs server-side rendering for real-time data |
| Content-heavy blog with thousands of posts | **Astro** | Static build with incremental builds, minimal client JS |
| Hybrid (marketing site + client portal) | **Both** | Astro for public pages, Next.js for authenticated areas |

For programmatic SEO specifically, **Astro is the primary choice** for the public-facing pages. Next.js hosts the CMS admin panel and API. The pages fetch data from Payload's REST API at build time.

### The Three-Layer Architecture

```
Layer 1: DATA (Payload CMS Collections)
  └── Services, Locations, FAQs, Testimonials, Team, etc.
  └── Stored in Supabase Postgres via Payload's postgres adapter
  └── Managed through the admin panel at /admin

Layer 2: TEMPLATES (Payload Blocks + Frontend Components)
  └── Block definitions in payload.config.ts
  └── React/Astro components that render each block type
  └── Clients stack blocks to compose page layouts

Layer 3: ROUTES (Astro/Next.js Dynamic Pages)
  └── /services/[slug] → fetches service data, renders with template
  └── /locations/[city] → fetches location data, renders with template
  └── /[service]/[city] → fetches cross-product data, renders with template
  └── Static generation at build time for maximum performance
```

---

## 2. Architecture

### Project Structure for Programmatic SEO

This extends the existing Agency Web Stack monorepo structure. New files and directories are marked with `(NEW)`.

```
capabilities/
├── templates/
│   ├── astro-site/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/                    # shadcn/ui components (existing)
│   │       │   └── blocks/                # (NEW) Block renderer components
│   │       │       ├── BlockRenderer.tsx   # (NEW) Maps blockType to component
│   │       │       ├── HeroBlock.tsx       # (NEW)
│   │       │       ├── ServiceDetailBlock.tsx  # (NEW)
│   │       │       ├── FAQBlock.tsx        # (NEW)
│   │       │       ├── TestimonialsBlock.tsx   # (NEW)
│   │       │       ├── CTABlock.tsx        # (NEW)
│   │       │       ├── LocationMapBlock.tsx    # (NEW)
│   │       │       ├── GalleryBlock.tsx    # (NEW)
│   │       │       ├── PricingBlock.tsx    # (NEW)
│   │       │       ├── TeamBlock.tsx       # (NEW)
│   │       │       ├── ContentBlock.tsx    # (NEW)
│   │       │       ├── StatsBlock.tsx      # (NEW)
│   │       │       └── RelatedLinksBlock.tsx   # (NEW)
│   │       ├── layouts/
│   │       │   ├── Layout.astro           # Base layout (existing)
│   │       │   ├── SEOLayout.astro        # (NEW) Extended with full SEO head
│   │       │   └── ServiceLayout.astro    # (NEW) Service page wrapper
│   │       ├── lib/
│   │       │   ├── utils.ts               # (existing)
│   │       │   ├── payload.ts             # (NEW) Payload API client helper
│   │       │   ├── seo.ts                 # (NEW) SEO utility functions
│   │       │   └── sitemap.ts             # (NEW) Sitemap generation helpers
│   │       ├── pages/
│   │       │   ├── index.astro            # Homepage (existing)
│   │       │   ├── services/
│   │       │   │   ├── index.astro        # (NEW) Services listing page
│   │       │   │   └── [slug].astro       # (NEW) Individual service page
│   │       │   ├── locations/
│   │       │   │   ├── index.astro        # (NEW) Locations listing page
│   │       │   │   └── [city].astro       # (NEW) Individual location page
│   │       │   ├── [service]/
│   │       │   │   └── [city].astro       # (NEW) Service + Location combo page
│   │       │   ├── blog/
│   │       │   │   ├── index.astro        # (NEW) Blog listing
│   │       │   │   └── [slug].astro       # (NEW) Blog post page
│   │       │   ├── sitemap.xml.ts         # (NEW) Dynamic XML sitemap
│   │       │   └── robots.txt.ts          # (NEW) Dynamic robots.txt
│   │       └── styles/
│   │           └── global.css             # (existing)
│   │
│   └── next-app/
│       └── src/
│           ├── app/
│           │   ├── (app)/                 # Application pages (existing)
│           │   └── (payload)/             # CMS admin panel (existing)
│           ├── payload.config.ts          # CMS configuration (modify)
│           ├── collections/               # (NEW) Collection definitions
│           │   ├── Services.ts            # (NEW)
│           │   ├── Locations.ts           # (NEW)
│           │   ├── ServicePages.ts        # (NEW)
│           │   ├── BlogPosts.ts           # (NEW)
│           │   ├── FAQs.ts               # (NEW)
│           │   ├── Testimonials.ts        # (NEW)
│           │   ├── TeamMembers.ts         # (NEW)
│           │   ├── Forms.ts               # (NEW) (via form-builder plugin)
│           │   ├── Redirects.ts           # (NEW) (via redirects plugin)
│           │   └── Media.ts              # (NEW) Extracted from config
│           ├── blocks/                    # (NEW) Block type definitions
│           │   ├── Hero.ts               # (NEW)
│           │   ├── ServiceDetail.ts      # (NEW)
│           │   ├── FAQ.ts                # (NEW)
│           │   ├── Testimonials.ts       # (NEW)
│           │   ├── CTA.ts               # (NEW)
│           │   ├── LocationMap.ts        # (NEW)
│           │   ├── Gallery.ts            # (NEW)
│           │   ├── Pricing.ts            # (NEW)
│           │   ├── Team.ts              # (NEW)
│           │   ├── Content.ts            # (NEW)
│           │   ├── Stats.ts             # (NEW)
│           │   └── RelatedLinks.ts       # (NEW)
│           └── hooks/                     # (NEW) Payload lifecycle hooks
│               ├── auto-generate-slug.ts  # (NEW)
│               ├── auto-generate-seo.ts   # (NEW)
│               ├── sync-to-crm.ts         # (NEW)
│               └── send-notification.ts   # (NEW)
│
├── packages/
│   └── shared/                            # @capabilities/shared (existing)
│
├── scripts/
│   ├── seed-services.ts                   # (NEW) Bulk import services
│   ├── seed-locations.ts                  # (NEW) Bulk import locations
│   ├── seed-service-pages.ts              # (NEW) Generate cross-product pages
│   ├── seed-faqs.ts                       # (NEW) Generate FAQ content
│   ├── enrich-content.ts                  # (NEW) AI content enrichment
│   ├── generate-sitemap-index.ts          # (NEW) Sitemap index for large sites
│   └── validate-seo.ts                    # (NEW) SEO audit script
│
├── data/                                  # (NEW) Raw data for seeding
│   ├── services.csv                       # (NEW) Service definitions
│   ├── locations.csv                      # (NEW) Cities, states, zips, coords
│   ├── service-areas.csv                  # (NEW) Neighborhoods, sub-areas
│   └── faqs-template.csv                  # (NEW) FAQ templates per service type
│
├── supabase/
│   ├── config.toml                        # (existing)
│   └── migrations/                        # (existing + new migrations)
│
└── docs/
    └── PROGRAMMATIC_SEO_BLUEPRINT.md      # This file
```

### Data Flow

```
CSV/JSON Data
  │
  ▼
Seed Scripts (scripts/seed-*.ts)
  │
  ▼
Payload CMS REST API (POST /api/services, /api/locations, etc.)
  │
  ▼
Supabase Postgres (via Payload's postgresAdapter)
  │
  ▼
Astro Build Process (fetches from Payload REST API)
  │
  ▼
Static HTML Pages (deployed to Vercel/Netlify/Cloudflare)
  │
  ▼
Google Crawls & Indexes
```

### API Access Pattern

Payload CMS exposes a REST API automatically for every collection:

```
GET    /api/services              → List all services
GET    /api/services?where[slug][equals]=plumbing  → Find by slug
GET    /api/services/:id          → Get single service
POST   /api/services              → Create service
PATCH  /api/services/:id          → Update service
DELETE /api/services/:id          → Delete service

# Pagination
GET    /api/services?limit=100&page=2

# Filtering
GET    /api/services?where[status][equals]=published
GET    /api/service-pages?where[service][equals]=SERVICE_ID&where[location][equals]=LOCATION_ID

# Depth (populate relationships)
GET    /api/service-pages?depth=2  → Includes full service and location objects
```

The Astro site fetches from this API at build time. The base URL for local development is `http://localhost:3158/api` (the Next.js port from `.ports`).

---

## 3. Payload CMS Plugins - Installation and Configuration

### Required Plugins for Programmatic SEO

The Payload CMS configuration uses 7 plugins to support programmatic SEO: SEO metadata generation, form building, URL redirects, nested document hierarchies, full-text search, CSV/JSON import-export, and S3-compatible media storage. Each plugin is configured in `payload.config.ts` with SEO-specific callbacks and collection targeting.

| Plugin | Purpose |
|---|---|
| `@payloadcms/plugin-seo` | Adds meta title, description, OG image fields with auto-generation callbacks and SERP preview |
| `@payloadcms/plugin-form-builder` | Dynamic contact forms and lead capture, built in the admin panel |
| `@payloadcms/plugin-redirects` | 301/302 redirect management for URL changes without losing SEO equity |
| `@payloadcms/plugin-nested-docs` | Parent/child hierarchies with auto-generated breadcrumbs and URL paths |
| `@payloadcms/plugin-search` | Full-text search with priority weighting across collections |
| `@payloadcms/plugin-import-export` | Bulk CSV/JSON import and export from the admin panel |
| `@payloadcms/storage-s3` | S3-compatible media storage (Supabase Storage, AWS S3, Cloudflare R2) for serverless deployment |

> **Full implementation**: See [CMS Collections & Block Definitions](./CMS_COLLECTIONS_AND_BLOCKS.md#1-payload-cms-plugins-installation-and-configuration) for complete plugin installation commands, `payload.config.ts` configuration, and detailed plugin descriptions.

---

## 4. Collection Definitions - Data Models

Each collection is defined in its own file for maintainability. Collections represent the data models — the structured content that powers every page. All collections use versioning with drafts, auto-save, and scheduled publishing. Public read access filters by `status: published`; authenticated users see all documents.

| Collection | Slug | Key Fields | Purpose |
|---|---|---|---|
| **Services** | `services` | name, slug, category, status, shortDescription, description, featuredImage, gallery, features, pricing, layout (blocks), relatedServices, faqs, seoTitle, seoDescription, schemaType | Core service offerings — each generates a page at `/services/[slug]` |
| **Locations** | `locations` | displayName, slug, type (city/neighborhood/county/etc.), city, state, stateCode, zipCodes, coordinates, population, description, parentLocation, nearbyLocations | Geographic service areas — cities, neighborhoods, zip codes with geo data |
| **Service Pages** | `service-pages` | title, slug, service (rel), location (rel), headline, introduction, localContent, layout (blocks), seoTitle, seoDescription, relatedServicePages, contentSource, contentQualityScore | Cross-product pages (service x location) — the core of programmatic SEO |
| **Blog Posts** | `blog-posts` | title, slug, excerpt, content, featuredImage, author, publishedAt, category, tags, relatedServices, relatedLocations | Blog/content marketing — tips, guides, case studies, news |
| **FAQs** | `faqs` | question, answer, service (rel), location (rel), sortOrder | Reusable FAQ entries — used in FAQ blocks and FAQPage schema markup |
| **Testimonials** | `testimonials` | clientName, clientTitle, review, rating, date, avatar, service (rel), location (rel), featured, source | Customer reviews — filterable by service, location, and source |
| **Team Members** | `team-members` | name, role, bio, photo, email, phone, locations (rel), specialties (rel), certifications | Staff profiles — filterable by location and service specialty |
| **Media** | `media` | alt, caption + upload config with 4 image sizes (thumbnail, card, hero, og) | Images and documents with auto-generated responsive sizes |

> **Full implementation**: See [CMS Collections & Block Definitions](./CMS_COLLECTIONS_AND_BLOCKS.md#2-collection-definitions-data-models) for complete TypeScript collection configs including field definitions, access control, hooks, and admin panel configuration.

---

## 5. Block Definitions - Page Template System

Blocks are the building blocks of page layouts. Each block type defines a reusable content section that clients stack in any order to compose pages. All blocks are defined in `templates/next-app/src/blocks/` and registered in the `layout` field of collections that use page templates (Services, ServicePages, etc.).

| Block | Slug | Purpose |
|---|---|---|
| **Hero Section** | `hero` | Page header with heading, subheading, background image, CTA, and style variants (centered, left, split, fullbleed) |
| **Service Detail** | `serviceDetail` | Rich text content with features array; layouts: list, grid, or alternating rows |
| **FAQ Section** | `faq` | Manual or auto-populated FAQs from the FAQ collection; optional FAQPage schema generation |
| **Testimonials** | `testimonials` | Customer reviews — source by featured, service, location, or manual; carousel/grid/stack layouts |
| **Call to Action** | `cta` | Conversion block with button, phone click-to-call, optional inline form; banner/card/minimal/fullwidth styles |
| **Location Map** | `locationMap` | Google Maps embed with address, service radius, and nearby locations toggle |
| **Content Section** | `content` | Generic rich text with optional image (left, right, above, below positioning) |
| **Stats / Counters** | `stats` | 2-6 stat items with value, label, and icon (e.g., "500+ Happy Customers") |
| **Image Gallery** | `gallery` | Image array with captions; grid, masonry, or carousel layout; configurable columns |
| **Pricing Table** | `pricing` | Tiered pricing with features checklists, highlighted tier, CTA per tier |
| **Team Section** | `team` | Team members — all, by location, or manual selection; optional contact info display |
| **Related Links** | `relatedLinks` | Auto-generated or manual links for internal linking (related services/locations) |

All 12 blocks are imported and registered in the `layout` field of any collection that supports page templates.

> **Full implementation**: See [CMS Collections & Block Definitions](./CMS_COLLECTIONS_AND_BLOCKS.md#3-block-definitions-page-template-system) for complete TypeScript block configs including all field definitions, conditional display logic, and registration code.

---

## 6. Routing - Dynamic Page Generation

### Astro Dynamic Routes

Astro generates static pages at build time by fetching from Payload's REST API. Each dynamic route defines `getStaticPaths()` to enumerate all pages. The routing pattern works as follows:

- A shared **Payload API helper** (`src/lib/payload.ts`) provides typed fetch functions for all collections, handling pagination, filtering by status, and relationship depth
- **Service pages** at `/services/[slug].astro` use `getStaticPaths()` to generate one page per published service
- **Cross-product pages** at `/[service]/[city].astro` generate one page per service-location combination — the core of programmatic SEO
- **Location pages** and **blog pages** follow the same pattern at `/locations/[city].astro` and `/blog/[slug].astro`

Each route wraps content in the `SEOLayout` component with meta tags, OG data, and schema.org JSON-LD, then renders the page's block layout via `BlockRenderer`.

### Sitemap and Robots.txt

For sites with thousands of pages, sitemaps are generated dynamically as Astro API routes (`sitemap.xml.ts` and `robots.txt.ts`). The sitemap fetches all published services, locations, and service-pages, assigns priority weights (homepage 1.0, services 0.8, locations 0.7, cross-product pages 0.6), and outputs valid XML. For very large sites (>50,000 URLs), the system supports splitting into a sitemap index with multiple child sitemaps.

> **Full implementation**: See [Routing, Sitemaps & Schema Markup](./ROUTING_AND_SITEMAPS.md) for Astro dynamic routes, Payload API helpers, sitemap generation, and robots.txt code.

---

## 7. SEO Implementation

### HTML Tag Structure — Semantic Markup for Indexing (CRITICAL)

Proper HTML tag structure is how search engines understand what your page is about, what content is most important, and how sections relate to each other. Google's AI models (BERT, MUM, Gemini) parse semantic HTML to build a structural understanding of every page. Pages using semantic elements correctly receive higher crawl priority, better content extraction for featured snippets, and stronger ranking signals than pages built with generic `<div>` and `<span>` tags.

**In 2026 and beyond, semantic HTML is no longer optional — it is the foundation of how AI-powered search engines and answer engines (AEO) evaluate your content.**

#### The Single H1 Rule

**Every page MUST have exactly one `<h1>` tag.** This is the most important heading rule:

- The `<h1>` tells Google the primary topic of the page
- Google uses the `<h1>` as a candidate for the title link shown in search results (alongside the `<title>` tag and `og:title`)
- Multiple H1s dilute the signal — Google can't determine which one represents the main topic
- While Google has stated they don't technically "penalize" multiple H1s, their own documentation emphasizes making it "clear which text is the main title" and ensuring it is "the most prominent on the page"
- John Mueller (Google) has explicitly recommended using a single H1 per page for clarity

**H1 specifications:**
- **Length**: 20-60 characters (prevents truncation on mobile SERPs)
- **Content**: Must contain the primary keyword, naturally phrased
- **Uniqueness**: Every page's H1 must be unique across the entire site — no two pages share the same H1
- **Relationship to `<title>`**: The H1 and `<title>` tag should be related but NOT identical. The `<title>` is for the search result listing; the H1 is for the page itself. Vary the phrasing.
- **Position**: Must be the first heading element in the `<main>` content area

```html
<!-- CORRECT: Single, descriptive H1 with primary keyword -->
<h1>Professional Plumbing Services in Austin, TX</h1>

<!-- WRONG: Multiple H1 tags -->
<h1>Plumbing Services</h1>
<h1>Austin, TX Plumber</h1>

<!-- WRONG: Generic, keyword-less H1 -->
<h1>Our Services</h1>

<!-- WRONG: Keyword-stuffed H1 -->
<h1>Plumbing Services Plumber Austin TX Plumbing Repair Austin Texas</h1>
```

#### Heading Hierarchy — H2 Through H6

After the single H1, use H2-H6 tags to create a logical content outline. Think of it as a table of contents — each heading level represents a deeper level of specificity.

**The hierarchy must be sequential — never skip levels.** An H3 must follow an H2, not jump directly from H1. An H4 must follow an H3. This matters for:
- Screen reader accessibility (WCAG compliance)
- Google's content structure parsing
- AI answer engine extraction (structured content is 2.2x more likely to appear in featured snippets)

```html
<!-- CORRECT heading hierarchy -->
<h1>Plumbing Services in Austin, TX</h1>                    <!-- Page topic -->
  <h2>Residential Plumbing Services</h2>                     <!-- Major section -->
    <h3>Kitchen Plumbing</h3>                                <!-- Sub-section -->
      <h4>Garbage Disposal Installation</h4>                 <!-- Detail -->
      <h4>Kitchen Faucet Repair</h4>                         <!-- Detail -->
    <h3>Bathroom Plumbing</h3>                               <!-- Sub-section -->
      <h4>Toilet Repair and Replacement</h4>                 <!-- Detail -->
      <h4>Shower and Bathtub Installation</h4>               <!-- Detail -->
  <h2>Commercial Plumbing Services</h2>                      <!-- Major section -->
    <h3>Office Building Plumbing</h3>                        <!-- Sub-section -->
    <h3>Restaurant Plumbing</h3>                             <!-- Sub-section -->
  <h2>Emergency Plumbing in Austin</h2>                      <!-- Major section -->
  <h2>Why Choose Our Austin Plumbing Team</h2>               <!-- Major section -->
  <h2>Frequently Asked Questions</h2>                        <!-- Major section -->
    <h3>How much does a plumber cost in Austin?</h3>         <!-- FAQ item -->
    <h3>Do you offer 24/7 emergency plumbing?</h3>           <!-- FAQ item -->
  <h2>Service Areas Near Austin, TX</h2>                     <!-- Major section -->

<!-- WRONG: Skipping heading levels -->
<h1>Plumbing Services in Austin, TX</h1>
  <h3>Kitchen Plumbing</h3>           <!-- SKIPPED H2! -->
  <h5>Faucet Repair</h5>             <!-- SKIPPED H4! -->
```

**Heading tag specifications:**

| Tag | Purpose | Count Per Page | Length | Keyword Usage |
|---|---|---|---|---|
| `<h1>` | Page topic — what this entire page is about | **Exactly 1** | 20-60 chars | Primary keyword (required) |
| `<h2>` | Major sections — the main divisions of content | 3-8 typical | 30-70 chars | One secondary keyword per H2 (varied) |
| `<h3>` | Sub-sections within an H2 | 2-5 per H2 section | 30-70 chars | Long-tail keywords, LSI terms |
| `<h4>` | Details within an H3 | 0-4 per H3 section | 20-60 chars | Specific terms, feature names |
| `<h5>` | Rare — fine-grained sub-detail | 0-3 per H4 section | 20-50 chars | Rarely needed, use sparingly |
| `<h6>` | Very rare — deepest nesting | 0-2 per H5 section | 20-50 chars | Almost never needed for SEO pages |

**Practical guidance**: Most programmatic SEO pages will use H1, H2, and H3 only. H4 is useful for detailed feature lists or pricing breakdowns. H5 and H6 are rarely needed — if you're going that deep, consider restructuring the content.

#### Semantic HTML Elements — Beyond Headings

Google's crawlers and AI models use semantic HTML elements to understand page structure. Using the correct elements (instead of generic `<div>` tags) gives search engines explicit signals about what each section of the page represents.

**Required semantic elements for every page:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Plumbing Services in Austin, TX | ClientName</title>
  <meta name="description" content="...">
  <!-- ... other meta tags, schema, etc. -->
</head>
<body>

  <!-- HEADER: Site-wide navigation and branding -->
  <header>
    <nav aria-label="Main navigation">
      <a href="/">ClientName</a>
      <ul>
        <li><a href="/services">Services</a></li>
        <li><a href="/locations">Locations</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <!-- MAIN: The primary content of the page (search engines weight this highest) -->
  <main>
    <!-- ARTICLE: Self-contained content unit — Google treats this as the core indexable content -->
    <article>
      <h1>Professional Plumbing Services in Austin, TX</h1>

      <!-- Use <p> for ALL paragraph text — never use <div> for text blocks -->
      <p>
        Looking for a licensed plumber in Austin, Texas? Our team provides
        expert plumbing services throughout the Austin metro area...
      </p>

      <!-- SECTION: Thematically grouped content with its own heading -->
      <section>
        <h2>Our Residential Plumbing Services</h2>
        <p>We handle all types of home plumbing needs in Austin...</p>

        <section>
          <h3>Kitchen Plumbing Repair</h3>
          <p>From leaky faucets to clogged drains, our Austin plumbers...</p>
        </section>

        <section>
          <h3>Bathroom Plumbing Installation</h3>
          <p>Professional bathroom plumbing for Austin homes...</p>
        </section>
      </section>

      <section>
        <h2>Why Austin Homeowners Trust Our Plumbers</h2>
        <p>With over 15 years serving the Austin area...</p>

        <!-- Use <strong> for semantically important text (not just bold styling) -->
        <p>We are <strong>licensed, bonded, and insured</strong> in the state of Texas.</p>

        <!-- Use <em> for emphasized text that changes meaning -->
        <p>We offer <em>same-day</em> emergency service throughout Travis County.</p>
      </section>

      <section>
        <h2>Frequently Asked Questions</h2>
        <!-- FAQ items map to FAQPage schema -->
        <section>
          <h3>How much does a plumber cost in Austin, TX?</h3>
          <p>The average cost for plumbing services in Austin ranges from...</p>
        </section>
      </section>
    </article>

    <!-- ASIDE: Supplementary content (sidebar, related links) -->
    <!-- Google understands <aside> as secondary to <article> — less weight in indexing -->
    <aside>
      <h2>Related Services in Austin</h2>
      <ul>
        <li><a href="/hvac/austin-tx">HVAC Services in Austin</a></li>
        <li><a href="/electrical/austin-tx">Electrical Services in Austin</a></li>
      </ul>
    </aside>
  </main>

  <!-- FOOTER: Site-wide footer — Google knows this is boilerplate -->
  <footer>
    <nav aria-label="Footer navigation">
      <!-- Footer links -->
    </nav>
    <p>&copy; 2026 ClientName. All rights reserved.</p>
  </footer>

</body>
</html>
```

**Semantic element importance for SEO:**

| Element | SEO Signal | What Google Does With It |
|---|---|---|
| `<main>` | **Highest** — isolates the core page topic | Google weights content inside `<main>` heavier than `<header>` or `<footer>` |
| `<article>` | **High** — marks a complete content unit | Google treats `<article>` as a self-contained indexable entity, especially for featured snippets |
| `<section>` | **Medium** — groups thematically related content | Creates meaningful content outline; each `<section>` should have its own heading |
| `<header>` | **Low** — site-wide boilerplate | Google identifies this as navigation/branding, not unique page content |
| `<footer>` | **Low** — site-wide boilerplate | Same as header — not weighted for page-specific relevance |
| `<nav>` | **Medium** — identifies navigation links | Google uses this to understand site structure and internal link relationships |
| `<aside>` | **Low-Medium** — supplementary content | Google understands this is secondary; still indexed but weighted less than `<article>` |
| `<p>` | **Required** for text | **Always use `<p>` for paragraph text.** Never use `<div>` or `<span>` to wrap paragraphs. Google's NLP models expect `<p>` tags for body content extraction. |
| `<strong>` | **Semantic emphasis** | Tells Google this text has strong importance — use for key phrases, not just visual bold |
| `<em>` | **Semantic emphasis** | Tells Google this text is emphasized — use for terms that change meaning when stressed |
| `<ul>` / `<ol>` | **List structure** | Google extracts lists for featured snippets (list snippets); use for features, steps, benefits |
| `<figure>` + `<figcaption>` | **Image context** | Associates captions with images for better image search indexing |
| `<time>` | **Date parsing** | Google extracts dates for freshness signals and article date display in SERPs |
| `<address>` | **Contact info** | Google extracts for local SEO and business knowledge panels |

#### Common Mistakes to Avoid

1. **Using `<div>` for everything** — `<div class="section">` tells Google nothing. `<section>` tells Google this is a thematic grouping.
2. **Using `<div>` for paragraphs** — `<div class="text">Some paragraph...</div>` is invisible to Google's paragraph extraction. Use `<p>`.
3. **Styling elements as headings without using heading tags** — `<div class="big-title">` looks like a heading to users but is invisible to crawlers. Use actual `<h1>`-`<h6>` tags.
4. **Using heading tags for styling** — Don't use `<h3>` just because you want smaller bold text. Use CSS for styling, heading tags for structure.
5. **Hiding important content in `<footer>` or `<aside>`** — Content in these elements gets less indexing weight. Put your key content in `<main>` > `<article>`.
6. **Missing `lang` attribute on `<html>`** — `<html lang="en">` tells Google the page language, critical for geo-targeting and localization.
7. **Using `<b>` instead of `<strong>`** — `<b>` is purely visual. `<strong>` carries semantic weight. Same applies to `<i>` vs `<em>`.
8. **Not using `<time datetime="...">`** — For blog posts and dated content, `<time datetime="2026-04-09">April 9, 2026</time>` lets Google parse dates accurately.

#### Astro and Next.js Implementation Notes

**Astro**: Astro outputs clean semantic HTML by default. Each `.astro` page component controls the full HTML output. Ensure the `SEOLayout.astro` component wraps content in `<main>` and uses `<article>` for page content.

**Next.js / React**: React components often default to `<div>` wrappers. Explicitly use semantic elements in your block renderer components:

```tsx
// WRONG — renders as meaningless div soup
function ServiceDetailBlock({ data }) {
  return (
    <div className="service-detail">
      <div className="heading">{data.heading}</div>
      <div className="content">{data.content}</div>
    </div>
  );
}

// CORRECT — renders as semantically meaningful HTML
function ServiceDetailBlock({ data }) {
  return (
    <section className="service-detail">
      <h2>{data.heading}</h2>
      <p>{data.content}</p>
    </section>
  );
}
```

**Block Renderer heading level management**: Since blocks are stacked dynamically, the renderer must manage heading levels to maintain hierarchy. The page's H1 is set by the layout, so all blocks should start at H2. Sub-headings within blocks use H3.

```tsx
// components/blocks/BlockRenderer.tsx
// Each block receives a baseHeadingLevel prop (default: 2) to maintain hierarchy

interface BlockRendererProps {
  blocks: any[];
  context: any;
  baseHeadingLevel?: 2 | 3 | 4;  // Blocks never use H1 — that's the page title
}

function BlockRenderer({ blocks, context, baseHeadingLevel = 2 }: BlockRendererProps) {
  const HeadingTag = `h${baseHeadingLevel}` as keyof JSX.IntrinsicElements;
  const SubHeadingTag = `h${baseHeadingLevel + 1}` as keyof JSX.IntrinsicElements;

  return (
    <>
      {blocks.map((block) => {
        switch (block.blockType) {
          case "hero":
            // Hero blocks typically don't have their own heading —
            // they display the page H1 which is outside the block system
            return <HeroBlock key={block.id} data={block} />;
          case "serviceDetail":
            return (
              <section key={block.id}>
                <HeadingTag>{block.heading}</HeadingTag>
                {/* Sub-items use the next heading level */}
                {block.features?.map((feature: any) => (
                  <section key={feature.title}>
                    <SubHeadingTag>{feature.title}</SubHeadingTag>
                    <p>{feature.description}</p>
                  </section>
                ))}
              </section>
            );
          case "faq":
            return (
              <section key={block.id}>
                <HeadingTag>{block.heading}</HeadingTag>
                {block.faqs?.map((faq: any) => (
                  <section key={faq.id}>
                    <SubHeadingTag>{faq.question}</SubHeadingTag>
                    <p>{faq.answer}</p>
                  </section>
                ))}
              </section>
            );
          // ... other block types
        }
      })}
    </>
  );
}
```

#### Reference Sources

- [Google Search Central — Title Links](https://developers.google.com/search/docs/appearance/title-link): H1 as title link source, "make it clear which text is the main title"
- [Google Search Central — Bloggers Guidelines](https://developers.google.com/search/docs/advanced/guidelines/bloggers): "no magical ideal amount of headings"
- [Conductor — Optimize H1-H6 for SEO, AEO, and Visibility](https://www.conductor.com/academy/headings/): 12% better rankings with proper heading structure, 2.2x more featured snippets
- [Search Engine Journal — Semantic HTML for SEO](https://www.searchenginejournal.com/why-you-should-consider-semantic-html-for-seo/506384/): Semantic elements improve crawl efficiency and AI model understanding
- [Yoast — How to Use Headings](https://yoast.com/how-to-use-headings-on-your-site/): Heading hierarchy and accessibility
- [ClickRank — HTML Tags for SEO 2026](https://www.clickrank.ai/html-tags-for-seo/): Answer Engine Optimization requires structured tags
- [AcquireX — Semantic HTML for SEO 2026](https://acquirex.io/blog/why-semantic-html-is-so-important-for-your-seo-in-2026/): Google AI models weight semantic elements heavier than generic divs

---

### Keyword Strategy — Maximum Coverage Without Stuffing

Every page targets a **primary keyword** and a set of **secondary/semantic keywords**. The goal is to saturate the page with relevant terms in natural positions so Google understands exactly what the page is about — without triggering keyword stuffing penalties.

#### Keyword Types per Page

**Service page** (`/services/plumbing`):
- **Primary keyword**: `plumbing services`
- **Secondary keywords**: `licensed plumber`, `plumbing repair`, `plumbing installation`, `residential plumbing`, `commercial plumbing`
- **Long-tail keywords**: `how much does a plumber cost`, `emergency plumbing near me`, `best plumbing company`
- **LSI/Semantic keywords**: `leak repair`, `pipe replacement`, `drain cleaning`, `water heater`, `sewer line`, `faucet installation`, `toilet repair`

**Location page** (`/locations/austin-tx`):
- **Primary keyword**: `[business type] in Austin TX`
- **Secondary keywords**: `Austin TX [business type]`, `[business type] near Austin`, `local [business type] Austin`
- **Geo-modifiers**: `Austin`, `Austin TX`, `Austin Texas`, `Travis County`, `Central Texas`, specific neighborhoods, zip codes
- **LSI/Semantic keywords**: Local landmarks, area characteristics, nearby cities

**Service + Location page** (`/plumbing/austin-tx`):
- **Primary keyword**: `plumbing services in Austin TX`
- **Secondary keywords**: `Austin plumber`, `plumber in Austin TX`, `Austin TX plumbing company`, `plumbing repair Austin`
- **Long-tail keywords**: `emergency plumber in Austin TX`, `best plumbing company in Austin`, `affordable plumber Austin TX`, `24 hour plumber Austin`
- **LSI/Semantic keywords**: All service LSI terms + all location geo-modifiers combined
- **NLP entities**: Business name, staff names, certifications, local landmarks, neighborhood names

#### Where Keywords Must Appear (Placement Map)

Keywords must be placed strategically in high-signal HTML positions. Google weighs these positions differently — title tags and H1s carry the most weight, body text carries the least per-instance but volume matters.

```
HIGHEST WEIGHT
│
├── <title> tag (meta title)
│   └── Primary keyword MUST appear here, ideally near the front
│   └── Format: "[Primary Keyword] | [Brand Name]"
│   └── Example: "Plumbing Services in Austin, TX | ClientName"
│   └── Max 60 characters (Google truncates beyond this)
│
├── <h1> tag (one per page)
│   └── Primary keyword MUST appear here
│   └── Should be natural, not identical to title tag
│   └── Example: "Expert Plumbing Services in Austin, Texas"
│
├── <meta name="description">
│   └── Primary keyword + 1-2 secondary keywords
│   └── Must be compelling (this is your ad copy in search results)
│   └── Max 155-160 characters
│   └── Example: "Licensed plumbers in Austin, TX. Same-day plumbing repair,
│   │    installation & emergency service. Free estimates. Call (555) 123-4567."
│
├── URL slug
│   └── Primary keyword in the path
│   └── Example: /plumbing/austin-tx (contains "plumbing" and "austin-tx")
│
├── <h2> tags (section headings)
│   └── Secondary keywords spread across H2s — one keyword theme per H2
│   └── Example H2s for a plumbing + Austin page:
│       ├── "Residential Plumbing Services in Austin"     (secondary keyword)
│       ├── "Why Austin Homeowners Trust Our Plumbers"    (geo + trust signal)
│       ├── "Emergency Plumbing Repair in Austin, TX"     (long-tail keyword)
│       ├── "Austin Plumbing Service Areas"                (geo keyword)
│       └── "Frequently Asked Questions About Plumbing"   (supports FAQ schema)
│
├── <h3> tags (sub-headings)
│   └── Long-tail keywords and LSI terms
│   └── Example: "Drain Cleaning in Downtown Austin", "Tankless Water Heater Installation"
│
├── First 100 words of body content
│   └── Primary keyword MUST appear in the opening paragraph
│   └── Most natural placement: first or second sentence
│
├── Image alt text
│   └── Descriptive alt text that includes relevant keywords naturally
│   └── Example: "Plumber repairing kitchen sink in Austin TX home"
│   └── NOT: "plumbing plumber Austin TX plumbing services"
│
├── Internal link anchor text
│   └── Use keyword-rich anchor text when linking to other pages
│   └── Example: "our drain cleaning services" linking to /services/drain-cleaning
│   └── Vary anchor text — don't use the exact same phrase every time
│
├── FAQ questions and answers
│   └── Questions naturally include long-tail keywords
│   └── "How much does a plumber cost in Austin, TX?"
│   └── "What should I do if I have a plumbing emergency in Austin?"
│
├── Schema.org structured data
│   └── name, description, and areaServed fields contain keywords
│   └── Google extracts entities from schema for knowledge graph
│
└── Body text throughout
    └── Primary keyword: 3-5 times across the full page (naturally)
    └── Secondary keywords: 1-2 times each
    └── LSI/semantic terms: Sprinkle throughout — these are the most natural
    └── Geo-modifiers: Vary between "Austin", "Austin, TX", "Austin, Texas",
    │    "Travis County", neighborhood names
    └── NEVER repeat the exact same phrase more than 3 times on a page

LOWEST WEIGHT (per instance, but cumulative)
```

#### Keyword Density Guidelines

There is no magic percentage. Google's algorithms use NLP and semantic analysis, not raw keyword counting. However, these practical guidelines prevent both under-optimization and stuffing:

| Keyword Type | Target Frequency | Where |
|---|---|---|
| Primary keyword (exact match) | 3-5x per page | Title, H1, first paragraph, 1-2x in body, meta description |
| Primary keyword (variations) | 5-8x per page | H2s, H3s, body text — use natural variations like "plumbing services" / "plumbing repair" / "plumber" / "plumbing company" |
| Secondary keywords | 1-2x each | H2/H3 headings, body paragraphs, feature descriptions |
| Long-tail keywords | 1x each | FAQ questions, H3 headings, body paragraphs |
| LSI/semantic keywords | Unlimited (natural use) | Throughout — these are the safe zone, Google expects them |
| Geo-modifiers | 5-10x per page | Vary the format — city, city+state, state code, county, neighborhoods |
| Brand name | 1-3x | Usually in CTA, footer, about section |

**The litmus test**: Read the page out loud. If any keyword or phrase feels forced or repetitive, it's too much. If a visitor from that city reading about that service would find the language natural and informative, the density is right.

#### CMS Implementation: Keyword Fields

Add keyword tracking fields to the collections so content editors know what to target:

```typescript
// Add this group to Services, Locations, and ServicePages collections
{
  name: "keywords",
  type: "group",
  admin: {
    description: "Target keywords for this page — guides content writing and SEO optimization",
  },
  fields: [
    {
      name: "primary",
      type: "text",
      required: true,
      admin: {
        description: "The #1 keyword this page must rank for. Must appear in title, H1, first paragraph, and URL.",
      },
    },
    {
      name: "secondary",
      type: "array",
      admin: {
        description: "3-6 secondary keywords to include in H2 headings and body content",
      },
      fields: [
        { name: "keyword", type: "text", required: true },
      ],
    },
    {
      name: "longTail",
      type: "array",
      admin: {
        description: "Long-tail keyword phrases — use as FAQ questions and H3 subheadings",
      },
      fields: [
        { name: "phrase", type: "text", required: true },
      ],
    },
    {
      name: "lsiTerms",
      type: "textarea",
      admin: {
        description: "Comma-separated LSI/semantic terms to weave into body content naturally (e.g., 'leak repair, pipe replacement, drain cleaning, water heater')",
      },
    },
    {
      name: "geoModifiers",
      type: "textarea",
      admin: {
        description: "Comma-separated geographic variations to use throughout the page (e.g., 'Austin, Austin TX, Austin Texas, Travis County, Central Texas, Downtown Austin')",
      },
    },
  ],
}
```

#### Auto-Generating Keywords for Service-Location Pages

When seeding cross-product pages, auto-generate the keyword fields:

```typescript
// In scripts/seed-service-pages.ts — add to the createServicePage function

function generateKeywords(service: any, location: any) {
  const svc = service.name.toLowerCase();
  const city = location.city;
  const state = location.stateCode;
  const stateFull = location.state;
  const neighborhoods = (location.zipCodes || "").split(",").map((z: string) => z.trim()).filter(Boolean);

  return {
    primary: `${svc} in ${city} ${state}`,
    secondary: [
      { keyword: `${city} ${svc}` },
      { keyword: `${svc} company ${city}` },
      { keyword: `${svc} repair ${city} ${state}` },
      { keyword: `best ${svc} ${city}` },
      { keyword: `affordable ${svc} ${city} ${state}` },
      { keyword: `licensed ${svc.replace('services', '').trim()} ${city}` },
    ],
    longTail: [
      { phrase: `how much does ${svc} cost in ${city}` },
      { phrase: `emergency ${svc.replace('services', '').trim()} in ${city} ${state}` },
      { phrase: `best ${svc} company in ${city} ${stateFull}` },
      { phrase: `${svc} near me in ${city}` },
    ],
    lsiTerms: service.features?.map((f: any) => f.title.toLowerCase()).join(", ") || "",
    geoModifiers: [
      city,
      `${city} ${state}`,
      `${city}, ${stateFull}`,
      location.county ? `${location.county} County` : "",
      ...neighborhoods.slice(0, 5),
    ].filter(Boolean).join(", "),
  };
}
```

#### Content Generation Prompts — Keyword-Aware

When using AI to generate content (Section 8), include keyword requirements in the prompt:

```typescript
const prompt = `Write a unique, SEO-optimized introduction paragraph (200-250 words) for a page about "${service.name}" services in "${location.displayName}, ${location.stateCode}".

TARGET KEYWORDS (weave these in naturally — do NOT force them):
- Primary: "${keywords.primary}" — must appear once in the first two sentences
- Include at least 2 of these secondary keywords naturally: ${keywords.secondary.map(k => k.keyword).join(", ")}
- Use geographic variations: ${keywords.geoModifiers}
- Weave in these related terms where natural: ${keywords.lsiTerms}

RULES:
- The primary keyword should appear exactly once in the paragraph
- Use at least 2 different geographic variations (not just "${location.city}" every time)
- Do NOT start the paragraph with the primary keyword
- Do NOT end any sentence with a keyword
- LSI terms should feel like natural word choices, not insertions
- Write at a 7th-8th grade reading level
- Include one specific local detail about ${location.city} to make it unique`;
```

#### Keyword Validation in the SEO Audit

Add keyword checks to the pre-launch validation:

```typescript
// In scripts/validate-seo.ts — add keyword placement checks

function validateKeywordPlacement(page: any, renderedHtml: string) {
  const issues = [];
  const primary = page.keywords?.primary;

  if (!primary) {
    issues.push({ severity: "critical", message: "No primary keyword defined" });
    return issues;
  }

  const primaryLower = primary.toLowerCase();

  // Check title tag
  const titleMatch = renderedHtml.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && !titleMatch[1].toLowerCase().includes(primaryLower)) {
    issues.push({ severity: "critical", message: `Primary keyword "${primary}" missing from <title> tag` });
  }

  // Check H1
  const h1Match = renderedHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && !h1Match[1].toLowerCase().includes(primaryLower)) {
    issues.push({ severity: "critical", message: `Primary keyword "${primary}" missing from <h1>` });
  }

  // Check meta description
  const metaMatch = renderedHtml.match(/<meta\s+name="description"\s+content="(.*?)"/i);
  if (metaMatch && !metaMatch[1].toLowerCase().includes(primaryLower)) {
    issues.push({ severity: "high", message: `Primary keyword "${primary}" missing from meta description` });
  }

  // Check first 100 words
  const bodyText = renderedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const first100Words = bodyText.split(" ").slice(0, 100).join(" ").toLowerCase();
  if (!first100Words.includes(primaryLower)) {
    issues.push({ severity: "high", message: `Primary keyword "${primary}" not found in first 100 words` });
  }

  // Check for keyword stuffing (primary keyword > 5 times in body)
  const bodyLower = bodyText.toLowerCase();
  const occurrences = (bodyLower.match(new RegExp(primaryLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (occurrences > 8) {
    issues.push({ severity: "warning", message: `Primary keyword appears ${occurrences} times — possible keyword stuffing (target: 3-5)` });
  }
  if (occurrences < 2) {
    issues.push({ severity: "high", message: `Primary keyword appears only ${occurrences} time(s) — under-optimized (target: 3-5)` });
  }

  return issues;
}
```

---

### Schema.org Structured Data (Critical for Rich Snippets)

Schema markup is what tells Google exactly what a page is about in a machine-readable format. Proper schema implementation directly controls whether your pages get rich snippets (star ratings, FAQ dropdowns, business info panels, breadcrumbs) in search results. Pages with rich snippets get significantly higher click-through rates.

**Every page type must have the appropriate schema.** Missing schema = missed rich snippet opportunities.

#### Required Schema Types by Page

| Page Type | Required Schemas | Rich Snippet Result |
|---|---|---|
| Service page | `Service`, `BreadcrumbList`, `Organization` | Service description in knowledge panel |
| Location page | `LocalBusiness`, `BreadcrumbList`, `GeoCoordinates`, `AreaServed` | Google Maps integration, business panel |
| Service + Location page | `LocalBusiness`, `Service`, `BreadcrumbList`, `AreaServed` | Local pack listing, business info |
| Service + Location page (with reviews) | Above + `AggregateRating`, `Review` | Star ratings in search results |
| Any page with FAQ block | Above + `FAQPage` | FAQ dropdown accordion in SERP |
| Blog post | `Article`, `BreadcrumbList`, `Author` | Article rich result with date/author |
| Pricing page | Above + `Offer`, `PriceSpecification` | Price display in search results |
| Team page | `Person`, `Organization` | People info in knowledge graph |
| Contact/form page | `ContactPoint`, `Organization` | Contact info in business panel |
| Homepage | `Organization`, `WebSite`, `SearchAction` | Sitelinks search box |

#### Additional High-Value Schema Properties

Beyond the basic types, include these properties for maximum rich snippet coverage:

```typescript
// Organization schema (include on every page, usually in the layout)
{
  "@type": "Organization",
  "name": "CLIENT_NAME",
  "url": "https://clientsite.com",
  "logo": "https://clientsite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service",
    "areaServed": "US",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://facebook.com/clientname",
    "https://twitter.com/clientname",
    "https://instagram.com/clientname",
    "https://linkedin.com/company/clientname",
    "https://yelp.com/biz/clientname"
  ]
}

// WebSite schema with SearchAction (homepage only — enables sitelinks search box)
{
  "@type": "WebSite",
  "url": "https://clientsite.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://clientsite.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

The implementation provides 5 schema generator functions (`generateServiceSchema`, `generateLocalBusinessSchema`, `generateFAQSchema`, `generateReviewSchema`, `generateBreadcrumbSchema`) plus a rich text extractor for Payload's Lexical editor. These are used by the `SEOLayout.astro` component, which handles all meta tags (title, description, canonical, robots), Open Graph tags, Twitter cards, and JSON-LD schema injection via a `schemas` prop array.

> **Full implementation**: See [Routing, Sitemaps & Schema Markup](./ROUTING_AND_SITEMAPS.md#2-schemaorg-structured-data-critical-for-rich-snippets) for all schema generator functions and the SEO layout component.

---

## 8. Content Uniqueness Requirements and Generation at Scale

### The 50-60% Differentiation Rule (CRITICAL)

**Every page on the site must be at least 50-60% unique from every other page.** This is non-negotiable for programmatic SEO. Google's helpful content system and duplicate content detection will deindex, suppress, or penalize pages that are too similar. If 1,000 service-location pages share 80% of their content with only the city name swapped, Google treats them as thin/duplicate content — the entire site's authority suffers.

#### What Counts as "Different"

Google evaluates uniqueness at the **rendered page level** — the final HTML a user sees. This means:

- **Swapping just the city name in a template paragraph is NOT enough** — "Professional plumbing in Austin, TX" vs "Professional plumbing in Dallas, TX" is essentially the same page to Google
- **Different blocks in different order IS meaningful** — a service page with Hero → Features → FAQ → CTA is structurally different from one with Hero → Testimonials → Pricing → CTA
- **Unique paragraphs of real content ARE the strongest signal** — 2-3 paragraphs of genuinely unique text per page is the minimum
- **Different images, different FAQs, different testimonials all contribute** — even if the template structure is similar, the actual content within sections must vary
- **Schema markup, meta tags, and head content do NOT count** — Google evaluates visible body content

#### Content Differentiation Strategy

Each service-location page must achieve 50-60% unique content through a combination of these layers:

```
Layer 1: STRUCTURAL VARIATION (10-15% differentiation)
  └── Different block combinations per page type
  └── Different block ordering based on service category
  └── Conditional sections (show pricing for some services, not others)
  └── Different CTA styles based on service urgency

Layer 2: DYNAMIC DATA-DRIVEN CONTENT (15-20% differentiation)
  └── Location-specific FAQs (different questions per city)
  └── Location-specific testimonials (reviews from that area)
  └── Location-specific team members
  └── Service-specific features and benefits lists
  └── Local statistics (population, housing data, climate data)
  └── Nearby locations list (different for every page)
  └── Related services list (varies by context)

Layer 3: UNIQUE WRITTEN CONTENT (25-30% differentiation)
  └── Unique introduction paragraph per page (AI-generated or manual)
  └── Location-specific content paragraph (local regulations, area info, challenges)
  └── Service-in-location specific advice (unique to that combination)
  └── Local case studies or project examples
  └── Area-specific tips and recommendations

TOTAL: 50-65% differentiation per page
```

#### Implementation: Ensuring Uniqueness per Page

**1. Unique Introduction (Required — every page)**

Each service-location page MUST have a unique introduction paragraph of 150-250 words. This is the single most important differentiator. Options:

- **AI-generated**: Use the enrichment script (Section 8.3) to generate unique intros per page. Prompt the AI with specific local context (population, climate, common housing types, local challenges).
- **Template with deep variables**: Go beyond city/state — include neighborhood names, local landmarks, county name, regional weather patterns, local building codes, area-specific challenges.
- **Manual writing**: For top-priority pages (high-traffic cities), write custom content.

**2. Location-Specific Content Block (Required — every page)**

A dedicated content section that discusses the service in the context of the specific location:
- Local regulations and permit requirements
- Climate/weather impact on the service (e.g., "Austin's clay soil causes foundation shifts that stress plumbing")
- Common local issues (e.g., "Hard water in the Dallas area leads to faster pipe corrosion")
- Local housing stock characteristics (e.g., "Many Round Rock homes built in the 2000s use PEX plumbing")
- Area-specific pricing factors

**3. Dynamic Data Sections (Required — at least 3 per page)**

Pull different data for each page from the collections:
- FAQs: Show 5-8 FAQs that are tagged to this specific service AND/OR location. Different pages show different FAQ sets.
- Testimonials: Show reviews from customers in this location or who used this service. Different pages show different reviews.
- Team: Show team members who serve this location. Different locations show different staff.
- Related Links: Auto-generate from the cross-product — "Same service in nearby cities" and "Other services in this city" produce unique link sets per page.
- Stats: Local statistics (population served, jobs completed in area, average response time to area).

**4. Structural Variation (Recommended)**

Define 3-5 layout templates and assign them by service category:

```typescript
const layoutTemplates = {
  emergency: ["hero", "cta", "serviceDetail", "stats", "testimonials", "faq", "locationMap", "relatedLinks"],
  residential: ["hero", "serviceDetail", "gallery", "pricing", "testimonials", "faq", "cta", "relatedLinks"],
  commercial: ["hero", "serviceDetail", "stats", "team", "testimonials", "cta", "faq", "relatedLinks"],
  maintenance: ["hero", "serviceDetail", "pricing", "faq", "testimonials", "cta", "relatedLinks"],
};
```

#### Content Quality Scoring

Track differentiation quality in the `contentQualityScore` field on each service page:

| Score | Meaning | Action Required |
|---|---|---|
| 0-30 | Template-only, city name swaps | **Will be deindexed** — needs AI enrichment or manual writing immediately |
| 31-50 | Template + basic variable interpolation | **At risk** — needs unique intro paragraph and location content |
| 51-70 | AI-generated unique content + dynamic data | **Acceptable** — monitor search performance |
| 71-85 | Enriched content with local specifics | **Good** — prioritize for internal linking |
| 86-100 | Manually written or heavily customized | **Excellent** — use as pillar pages |

**Never publish pages scoring below 50.** Use the `contentQualityScore` field and the `contentSource` field to filter and prioritize which pages need attention.

#### Validation Script

Build a content similarity checker into the SEO validation pipeline:

```typescript
// scripts/validate-content-uniqueness.ts
// Compare page content across service-location pages to flag duplicates.
//
// Usage: npx tsx scripts/validate-content-uniqueness.ts
//
// Approach:
// 1. Fetch all published service pages
// 2. For each page, extract the rendered text content (intro + localContent + FAQ answers)
// 3. Compute pairwise similarity using Jaccard index or cosine similarity on word n-grams
// 4. Flag any pair with > 40% similarity (meaning < 60% unique)
// 5. Output a report with the most similar page pairs
//
// This should be run before every production build and as part of CI.

// Implementation notes:
// - Use 3-gram (trigram) word sequences for comparison — more accurate than single words
// - Exclude common stop words before comparison
// - Group comparisons by service (pages for the same service are most likely to be similar)
// - Set a threshold: any pair above 40% similarity needs content rework
// - Output: CSV with columns [page_a_slug, page_b_slug, similarity_pct, action_needed]
```

#### What Google Penalizes (Avoid These)

- **City-swap pages**: Same content with only the city name changed. Google calls these "doorway pages" — a manual action penalty.
- **Thin content**: Pages with less than 300 words of unique body content. These won't rank and dilute site quality.
- **Boilerplate-heavy pages**: If 70%+ of a page is shared boilerplate (header, footer, sidebar, template text), the unique portion is too small.
- **Auto-generated content without value**: Content that is clearly machine-generated and doesn't provide unique value to the user.
- **Keyword stuffing**: Cramming "[service] in [city]" repeatedly throughout the page.

#### What Google Rewards

- **Genuinely helpful local content**: Information specific to that city/area that a user couldn't get from a generic page.
- **E-E-A-T signals**: Experience, Expertise, Authoritativeness, Trust — local case studies, named team members, real reviews, certifications.
- **Unique FAQ content**: Real questions that locals would ask, with detailed answers.
- **Local statistics and data**: Population, housing data, local regulations — things that prove the content is actually about that area.
- **Internal linking that makes sense**: Links to nearby locations and related services that form a logical site structure.

---

### Content Template System

For thousands of pages, you need a system that generates unique-enough content from templates with variable interpolation. **Templates alone are not sufficient for the 50-60% uniqueness requirement** — they must be combined with AI enrichment, dynamic data, and structural variation as described above.

The template system provides multiple headline, introduction, localContent, and CTA text variants with `{variable}` slot interpolation. A deterministic hash-based template picker ensures consistent results across builds while providing variety across pages. An `interpolate()` function handles variable replacement, and `pickTemplate()` selects from the variant pool based on a seed string (typically the service-location slug).

### AI Content Enrichment Script

For higher-quality unique content at scale, use the Payload AI plugin or an external AI API to generate unique paragraphs per page. The enrichment script (`scripts/enrich-content.ts`) fetches all service-pages where `contentSource = "template"`, generates unique intro and local content via AI API calls with SEO-aware prompts, updates each page via the Payload REST API, and marks pages as `contentSource: "enriched"` with an updated quality score. It includes batch processing and rate limiting.

> **Full implementation**: See [Seed Scripts & Automation](./SEED_SCRIPTS_AND_AUTOMATION.md#content-template-system) for template code and [AI Content Enrichment](./SEED_SCRIPTS_AND_AUTOMATION.md#ai-content-enrichment-script) for the enrichment pipeline.

---

## 9. Seed Scripts and Data Import

Three seed scripts populate the CMS with structured data, all run via `npx tsx scripts/seed-*.ts` and targeting the Payload REST API:

| Script | File | What It Does |
|---|---|---|
| **Seed Services** | `scripts/seed-services.ts` | Reads `data/services.csv` (columns: name, category, shortDescription, icon), auto-generates slugs, creates published service documents via POST to `/api/services` |
| **Seed Locations** | `scripts/seed-locations.ts` | Reads `data/locations.csv` (columns: displayName, city, state, stateCode, type, zipCodes, lat, lng, population), parses coordinates and population, creates published location documents |
| **Seed Cross-Product Pages** | `scripts/seed-service-pages.ts` | Fetches all published services and locations, generates one page per service x location combination using the content template system (Section 8), sets `contentSource: "template"` and `contentQualityScore: 50`, auto-generates SEO titles and descriptions. For 50 services x 500 locations = 25,000 pages. |

All scripts include error handling, progress logging, and slugification. The cross-product script uses the `interpolate()` and `pickTemplate()` functions from the content template system for headline and introduction variety.

> **Full implementation**: See [Seed Scripts & Automation](./SEED_SCRIPTS_AND_AUTOMATION.md#seed-scripts-and-data-import) for complete seed scripts.

---

## 10. Pillar Pages, Topic Clusters and Linking Architecture

This section defines the content architecture that determines how every page on the site relates to every other page. This is the structural foundation for topical authority — Google's AI models evaluate not just individual pages, but how comprehensively and cohesively an entire site covers a subject.

**Why this matters in 2026**: Google now officially uses "topic authority" as a ranking factor. Sites with clear topic clusters get 30-43% more organic traffic (HubSpot). Pillar pages with topic clusters receive 3.2x more AI citations than standalone posts. Google's December 2025 core update reinforced that deep, substantive content organized into clear topical hierarchies outperforms scattered content.

### 10.1 Pillar Page Architecture

#### What Is a Pillar Page?

A **pillar page** is a comprehensive, long-form page (2,500-5,000 words) that provides a broad overview of an entire topic. It covers every major subtopic at a high level — but does not go deep into any single subtopic. Instead, it links out to **cluster pages** that provide in-depth coverage of each subtopic.

Think of it as the table of contents for a topic. The pillar page is the hub; cluster pages are the spokes.

#### The Three-Tier Content Hierarchy

For an agency building service-area websites, the hierarchy maps directly to the collection structure:

```
TIER 1: PILLAR PAGES (Broadest — highest authority target)
│
│   These are the main service pages at /services/[slug]
│   Example: /services/plumbing
│   Content: 2,500-5,000 words covering ALL aspects of plumbing
│   Target: Head terms ("plumbing services", "plumber")
│   Links TO: Every Tier 2 cluster page for this service
│   Links FROM: Every Tier 2 page, homepage, navigation, blog posts
│
├── TIER 2: CLUSTER PAGES (Specific — support the pillar)
│   │
│   │   These are the service + location combo pages at /[service]/[city]
│   │   AND the sub-service pages at /services/[service]/[sub-service]
│   │   Example: /plumbing/austin-tx, /services/plumbing/drain-cleaning
│   │   Content: 1,500-2,500 words focused on specific subtopic
│   │   Target: Long-tail terms ("plumbing in Austin TX", "drain cleaning services")
│   │   Links TO: Pillar page (required), 2-3 sibling cluster pages, Tier 3 pages
│   │   Links FROM: Pillar page, sibling clusters, related blog posts
│   │
│   └── TIER 3: SUPPORTING CONTENT (Deepest — feeds authority upward)
│       │
│       │   These are blog posts, FAQ pages, case studies, guides
│       │   Example: /blog/5-signs-you-need-a-plumber, /blog/plumbing-costs-austin-2026
│       │   Content: 800-1,500 words on very specific topics
│       │   Target: Question-based and informational queries
│       │   Links TO: Relevant Tier 2 page(s), relevant Tier 1 pillar
│       │   Links FROM: Related Tier 2 pages, other blog posts
│       │
│       └── (Authority flows upward: Tier 3 → Tier 2 → Tier 1)
```

#### Pillar Page Mapping for Agency Sites

Each major service category becomes a pillar. Here's how it maps to the Payload CMS collections:

```
PILLAR: Plumbing Services (/services/plumbing)
├── CLUSTER: Plumbing in Austin, TX (/plumbing/austin-tx)
├── CLUSTER: Plumbing in Dallas, TX (/plumbing/dallas-tx)
├── CLUSTER: Plumbing in Houston, TX (/plumbing/houston-tx)
├── CLUSTER: Drain Cleaning (/services/plumbing/drain-cleaning)
├── CLUSTER: Water Heater Installation (/services/plumbing/water-heater)
├── CLUSTER: Emergency Plumbing (/services/plumbing/emergency)
├── SUPPORT: "5 Signs You Need a Plumber" (/blog/signs-you-need-plumber)
├── SUPPORT: "How Much Does Plumbing Cost in Austin?" (/blog/plumbing-costs-austin)
├── SUPPORT: "DIY vs Professional Plumbing" (/blog/diy-vs-professional-plumbing)
└── SUPPORT: "Austin Plumbing Code Requirements 2026" (/blog/austin-plumbing-codes)

PILLAR: HVAC Services (/services/hvac)
├── CLUSTER: HVAC in Austin, TX (/hvac/austin-tx)
├── CLUSTER: HVAC in Dallas, TX (/hvac/dallas-tx)
├── CLUSTER: AC Installation (/services/hvac/ac-installation)
├── CLUSTER: Heating Repair (/services/hvac/heating-repair)
├── SUPPORT: "Best HVAC Systems for Texas Heat" (/blog/best-hvac-texas)
├── SUPPORT: "HVAC Maintenance Checklist" (/blog/hvac-maintenance-checklist)
└── SUPPORT: "When to Replace Your AC Unit" (/blog/when-replace-ac)

PILLAR: Locations Hub (/locations)
├── CLUSTER: Austin, TX (/locations/austin-tx)
│   ├── SUB-CLUSTER: Downtown Austin (/locations/austin-tx/downtown)
│   ├── SUB-CLUSTER: Round Rock (/locations/round-rock-tx)
│   └── SUB-CLUSTER: Cedar Park (/locations/cedar-park-tx)
├── CLUSTER: Dallas, TX (/locations/dallas-tx)
└── CLUSTER: Houston, TX (/locations/houston-tx)
```

**Ideal cluster size**: 8-15 cluster pages per pillar. Minimum 5 (fewer means the topic isn't deep enough to warrant a pillar). Maximum 20-25 (beyond this, consider splitting into multiple pillars).

#### Pillar Page Content Structure

Every pillar page should follow this template structure in the CMS:

```
[Hero Block]
  H1: "Professional [Service] Services"
  Intro paragraph (300-500 words) — broad overview of the service

[Table of Contents Block] (links to H2 sections below)
  Auto-generated from H2 headings on the page

[Service Overview Section]
  H2: "What Is [Service]?"
  Content: 300-400 words defining the service, who needs it, why it matters

[Sub-Service Sections] (one per major sub-service — each links to its cluster page)
  H2: "Drain Cleaning Services"
  Content: 150-200 words summarizing this sub-service
  Contextual link: "Learn more about our [drain cleaning services](/services/plumbing/drain-cleaning)"

  H2: "Water Heater Installation and Repair"
  Content: 150-200 words
  Contextual link: "See our [water heater services](/services/plumbing/water-heater)"

  (repeat for each sub-service — these are the cluster links)

[Service Area Section]
  H2: "Areas We Serve"
  Content: 100-200 words overview
  Links to top location cluster pages:
    "We provide plumbing services in [Austin, TX](/plumbing/austin-tx),
     [Dallas, TX](/plumbing/dallas-tx), [Houston, TX](/plumbing/houston-tx),
     and [50+ other cities across Texas](/locations)"

[Why Choose Us / Trust Signals]
  H2: "Why Choose [Company] for [Service]"
  Stats, certifications, years of experience, awards

[FAQ Section]
  H2: "Frequently Asked Questions About [Service]"
  5-8 FAQs (links to blog posts where applicable for deeper answers)

[Testimonials Section]
  H2: "What Our Customers Say"
  Featured reviews for this service category

[CTA Section]
  H2: "Get a Free [Service] Estimate"
  Contact form or phone number

[Related Services]
  H2: "Related Services"
  Links to other pillar pages (cross-pillar linking):
    "[HVAC Services](/services/hvac)", "[Electrical Services](/services/electrical)"
```

### 10.2 Internal Linking Rules

Internal links are the connective tissue that distributes authority throughout the site. These rules must be followed for every page.

#### Mandatory Link Rules

| Rule | Description | Implementation |
|---|---|---|
| **Every cluster page links to its pillar** | Non-negotiable. Every service+location page must link back to the parent service pillar page. | Contextual link in intro paragraph + breadcrumbs |
| **Every pillar page links to all its clusters** | The pillar page must have links to every cluster page it supports. | Service area section + sub-service sections |
| **Cluster pages link to 2-3 sibling clusters** | Each service+location page links to the same service in nearby cities AND other services in the same city. | RelatedLinksBlock with auto-generation |
| **Blog posts link to relevant Tier 1 and Tier 2 pages** | Every blog post must link to at least 1 pillar page and 1-2 relevant cluster pages. | Contextual links within blog content |
| **Breadcrumbs on every page** | Provides hierarchical navigation back to parent pages. | BreadcrumbList schema + visual breadcrumbs |
| **No orphan pages** | Every page must have at least 3 internal links pointing to it. | Validate with crawl audit |

#### Anchor Text Strategy

Anchor text — the clickable text of a link — tells Google what the linked page is about. This must be done right.

**Rules:**
- **Use descriptive, keyword-rich anchor text** — not "click here" or "learn more"
- **Vary anchor text** — don't use the exact same anchor for every link to a page
- **Mix anchor types** to look natural:

| Anchor Type | Example | Usage |
|---|---|---|
| **Exact match** | "plumbing services in Austin TX" | Use sparingly — 10-15% of links to a page |
| **Partial match** | "our Austin plumbing team" | Primary usage — 40-50% of links |
| **Branded** | "ClientName plumbing" | 10-20% of links |
| **Natural/generic** | "our plumbing services", "this page" | 10-20% of links |
| **Long-tail** | "learn about emergency plumbing repair in Austin" | 10-15% of links |

```html
<!-- GOOD: Varied, descriptive anchor text -->
<p>We provide expert <a href="/plumbing/austin-tx">plumbing services in Austin, TX</a>
including drain cleaning, water heater repair, and emergency service.</p>

<p>Our <a href="/plumbing/austin-tx">Austin plumbing team</a> serves the entire
metro area including Round Rock and Cedar Park.</p>

<p>Homeowners in Austin trust <a href="/plumbing/austin-tx">our licensed plumbers</a>
for reliable, same-day service.</p>

<!-- BAD: Same anchor text every time (over-optimization) -->
<p><a href="/plumbing/austin-tx">Plumbing services in Austin TX</a> are available.</p>
<p>Get <a href="/plumbing/austin-tx">plumbing services in Austin TX</a> today.</p>
<p>Our <a href="/plumbing/austin-tx">plumbing services in Austin TX</a> are top-rated.</p>

<!-- BAD: Generic anchor text (no keyword signal) -->
<p>For plumbing services in Austin, <a href="/plumbing/austin-tx">click here</a>.</p>
<p>Learn more about our services <a href="/plumbing/austin-tx">here</a>.</p>
```

#### Link Placement Rules

- **Contextual links within body text are the strongest signal** — links embedded in paragraph content where they're most relevant
- **One link per 300 words of content** is the guideline for density — don't over-link
- **First link on the page carries the most weight** — place the most important link early
- **Links in the upper half of the page are weighted more** than footer or bottom-of-page links
- **Navigation and footer links help crawling but carry less authority weight** than contextual body links
- **Never place all internal links in a single block at the bottom** — distribute throughout the content

#### Link Flow Diagrams

**Within a Service Pillar Cluster:**

```
                    ┌──────────────────────┐
                    │   PILLAR PAGE        │
                    │   /services/plumbing │
                    │   (Authority Hub)    │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ CLUSTER:        │  │ CLUSTER:        │  │ CLUSTER:         │
│ /plumbing/      │  │ /plumbing/      │  │ /services/       │
│ austin-tx       │◄─┼─► dallas-tx     │  │ plumbing/        │
│                 │  │                 │  │ drain-cleaning   │
└────────┬────────┘  └────────┬────────┘  └────────┬─────────┘
         │                    │                     │
    ┌────┴────┐          ┌────┴────┐           ┌────┴────┐
    ▼         ▼          ▼         ▼           ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│SUPPORT:│ │SUPPORT:│ │SUPPORT:│ │SUPPORT:│ │SUPPORT:│ │SUPPORT:│
│Blog    │ │Blog    │ │Blog    │ │Blog    │ │Blog    │ │Blog    │
│Post A  │ │Post B  │ │Post C  │ │Post D  │ │Post E  │ │Post F  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘

Arrows indicate bidirectional links.
Cluster pages link to each other laterally (◄─┼─►).
All clusters link up to the pillar.
All support content links up to relevant clusters and pillar.
Authority flows UPWARD: Support → Cluster → Pillar.
```

**Cross-Pillar Linking (Between Service Categories):**

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ PILLAR:          │     │ PILLAR:          │     │ PILLAR:          │
│ Plumbing         │◄───►│ HVAC             │◄───►│ Electrical       │
│ /services/       │     │ /services/       │     │ /services/       │
│ plumbing         │     │ hvac             │     │ electrical       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Plumbing in      │◄───►│ HVAC in          │◄───►│ Electrical in    │
│ Austin, TX       │     │ Austin, TX       │     │ Austin, TX       │
└──────────────────┘     └──────────────────┘     └──────────────────┘

Cross-pillar links connect related services.
Same-city links connect different services in the same location.
This creates a mesh that tells Google: "This site is THE authority for
home services in Austin."
```

**Location Hierarchy Linking:**

```
                    ┌──────────────────┐
                    │ LOCATION HUB     │
                    │ /locations        │
                    └──────────┬───────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ STATE/REGION:   │  │ STATE/REGION:   │  │ STATE/REGION:   │
│ Texas           │  │ Florida         │  │ California      │
│ /locations/tx   │  │ /locations/fl   │  │ /locations/ca   │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
    ┌────┴────┐          ┌────┴────┐           ┌────┴────┐
    ▼         ▼          ▼         ▼           ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Austin  │ │Dallas  │ │Miami   │ │Orlando │ │LA      │ │SF      │
│/loca.. │ │/loca.. │ │/loca.. │ │/loca.. │ │/loca.. │ │/loca.. │
│/austin │ │/dallas │ │/miami  │ │/orla.. │ │/los-a..│ │/san-f..│
└───┬────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │
    ├── Downtown Austin
    ├── Round Rock
    ├── Cedar Park
    └── Georgetown

Cities link to parent state/region.
Cities link to nearby cities (lateral).
Neighborhoods link to parent city.
```

### 10.3 Contextual Link Types — Complete Reference

Every link on the site should fit one of these patterns:

| Link Type | From → To | Anchor Text Style | Placement | Example |
|---|---|---|---|---|
| **Pillar → Cluster (down)** | Service page → Service+Location page | Partial match with location | Sub-section about that area | "our [plumbing services in Austin](/plumbing/austin-tx)" |
| **Pillar → Cluster (down)** | Service page → Sub-service page | Partial match with sub-service | Sub-section about that sub-service | "learn about our [drain cleaning services](/services/plumbing/drain-cleaning)" |
| **Cluster → Pillar (up)** | Service+Location page → Service page | Branded or partial match | Intro paragraph or CTA | "as part of our full [plumbing services](/services/plumbing)" |
| **Cluster → Cluster (lateral, same service)** | Same service, different city | Natural with location | "Nearby areas" section or inline | "we also serve [Dallas, TX](/plumbing/dallas-tx) and [Houston](/plumbing/houston-tx)" |
| **Cluster → Cluster (lateral, same city)** | Different service, same city | Natural with service | "Related services" section or inline | "also need [HVAC in Austin](/hvac/austin-tx) or [electrical work](/electrical/austin-tx)?" |
| **Cross-pillar** | Pillar → other pillar | Branded or partial | "Related Services" section | "explore our [HVAC services](/services/hvac)" |
| **Support → Cluster (up)** | Blog post → Service+Location page | Long-tail or natural | Within blog content | "if you're in Austin, see our [emergency plumbing services](/plumbing/austin-tx)" |
| **Support → Pillar (up)** | Blog post → Service page | Partial match | Within blog content | "for a full overview, see our [plumbing services guide](/services/plumbing)" |
| **Cluster → Support (down)** | Service page → Blog post | Natural/descriptive | FAQ section or inline | "read our guide on [how much plumbing costs in Austin](/blog/plumbing-costs-austin)" |
| **Breadcrumb (up)** | Any page → parent pages | Page title or topic | Top of page breadcrumb | Home > Services > Plumbing > Austin, TX |
| **Navigation** | All pages → pillar pages | Service name | Header nav | Services, Locations, Blog, Contact |

### 10.4 Auto-Generating Related Links

The `RelatedLinksBlock` with `source: "auto"` should automatically generate contextual links based on the page's relationships. Implementation logic:

```typescript
// When rendering a RelatedLinksBlock with source: "auto":

// ON A SERVICE PAGE (Pillar):
// 1. Link to all sub-service pages (cluster pages within this pillar)
// 2. Link to top 6-8 service+location pages (cluster pages, prioritized by traffic/population)
// 3. Link to 2-3 related service pillars (cross-pillar links)
// 4. Link to 3-5 relevant blog posts (support content)

// ON A SERVICE+LOCATION PAGE (Cluster):
// 1. Link back to the parent service pillar page (REQUIRED — always first)
// 2. Link to same service in 3-5 nearby cities (lateral cluster links)
// 3. Link to 2-3 other services in the same city (cross-pillar lateral links)
// 4. Link to 1-2 relevant blog posts (support content links)

// ON A LOCATION PAGE:
// 1. Link to all service+location pages for this city
// 2. Link to nearby locations (lateral)
// 3. Link to parent location (city → state/region)
// 4. Link to sub-locations (neighborhoods within this city)

// ON A BLOG POST (Support):
// 1. Link to the most relevant service pillar page (REQUIRED)
// 2. Link to 1-2 most relevant service+location cluster pages
// 3. Link to 2-3 related blog posts (lateral support links)
```

### 10.5 Breadcrumb Structure

Every page must have breadcrumbs for both UX and SEO (BreadcrumbList schema). Breadcrumbs provide hierarchical navigation and tell Google exactly where a page sits in the site structure.

```
Service Pillar:
Home > Services > Plumbing

Sub-Service Cluster:
Home > Services > Plumbing > Drain Cleaning

Service+Location Cluster:
Home > Services > Plumbing > Austin, TX

Location Page:
Home > Locations > Texas > Austin, TX

Neighborhood:
Home > Locations > Texas > Austin, TX > Downtown Austin

Blog Post:
Home > Blog > Tips & Guides > 5 Signs You Need a Plumber

Blog Post (service-related):
Home > Blog > Plumbing > How Much Does Plumbing Cost in Austin?
```

### 10.6 External Backlinking Strategy

Internal links distribute authority within your site. External backlinks bring new authority IN from other sites. Both are required for ranking.

#### What Google Values in 2026

Google's approach to backlinks in 2026 prioritizes **relevance, trust, and entity associations** over raw volume. A single link from a relevant local news site is worth more than 100 links from generic directories.

**Quality signals Google evaluates:**
- **Topical relevance**: Does the linking site cover a related topic?
- **Geographic relevance**: For local SEO, links from local sources carry extra weight
- **Editorial context**: Was the link placed editorially (someone chose to link to you) or is it a paid/template link?
- **Entity association**: Does Google's knowledge graph connect the linking entity to your entity?
- **Link diversity**: Natural link profiles have links from many different domains, not one source repeatedly

#### Backlink Acquisition Methods (Ranked by Effectiveness)

**Tier 1 — Highest Value (Earned/Editorial)**

| Method | Description | Example |
|---|---|---|
| **Digital PR / Local press** | Get featured in local news outlets, industry publications | Local newspaper covers "Best Plumbers in Austin" — includes your link |
| **Original research & data** | Publish local data others cite | "2026 Austin Home Repair Cost Report" — real estate blogs and news sites link to it |
| **Linkable assets** | Create tools, calculators, guides that earn links naturally | "Plumbing Cost Calculator for Texas" — other sites embed or link to it |
| **Expert quotes / HARO** | Provide expert commentary to journalists | Quoted in article about home maintenance — includes link |

**Tier 2 — Good Value (Proactive Outreach)**

| Method | Description | Example |
|---|---|---|
| **Guest posting** | Write original articles for relevant industry or local blogs | Write "Spring Plumbing Checklist" for a home improvement blog with link back |
| **Resource page links** | Get listed on curated resource pages | City's "Local Service Directory" page links to your service page |
| **Partnership links** | Cross-promotion with complementary businesses | Real estate agent links to your services from their "New Homeowner Resources" page |
| **Community involvement** | Sponsorships, events, local organizations | Local chamber of commerce links to your site from member directory |

**Tier 3 — Foundational (Minimum Required)**

| Method | Description | Example |
|---|---|---|
| **Business directories** | Google Business Profile, Yelp, BBB, industry directories | Consistent NAP (Name, Address, Phone) across all directories |
| **Social profiles** | Company profiles on LinkedIn, Facebook, etc. | NoFollow but contributes to entity recognition |
| **Industry associations** | Trade organization memberships | Licensed plumber association member page |

#### Backlink Strategy for Programmatic SEO Sites

For sites with thousands of pages, you can't build backlinks to every page individually. The strategy is:

1. **Build backlinks to pillar pages** — These are your highest-value pages. Most link building effort goes here.
2. **Let internal links distribute authority** — Backlinks to the pillar flow down through internal links to cluster pages.
3. **Build location-specific links for top cities** — For your highest-priority locations, get local backlinks (local news, local directories, local partnerships).
4. **Create linkable blog content** — Blog posts (Tier 3 support content) are easier to get links to than service pages. Those links flow authority up to the service pillar.

```
External Backlinks → Pillar Page (/services/plumbing)
                          │
                     Internal Links
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         /plumbing/   /plumbing/  /services/plumbing/
         austin-tx    dallas-tx   drain-cleaning
              │           │           │
         (authority flows to cluster pages)

External Backlinks → Blog Post (/blog/plumbing-costs-austin)
                          │
                     Internal Links
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         /plumbing/austin-tx    /services/plumbing
         (cluster)              (pillar)
```

#### Link Profile Health Guidelines

A natural-looking link profile has:
- **DoFollow / NoFollow ratio**: 60-70% dofollow, 30-40% nofollow (all-dofollow looks manipulated)
- **Anchor text distribution**: Branded (30%), partial match (25%), generic (20%), exact match (10%), URL (10%), miscellaneous (5%)
- **Domain diversity**: Links from many different domains, not concentrated on a few
- **Acquisition velocity**: Gradual, steady growth — not 500 links in one week then nothing
- **Relevance**: Majority of links from topically relevant or geographically relevant sources

#### What to Avoid (Google Penalties)

- **Buying links** — Google's algorithms detect paid link patterns
- **Link exchange schemes** — "I'll link to you if you link to me" at scale
- **PBNs (Private Blog Networks)** — Networks of sites created solely to generate links
- **Automated link building** — Mass directory submissions, blog comment spam
- **Irrelevant links** — Links from completely unrelated sites (gambling, pharma, etc.)
- **Excessive exact-match anchor text** — Over-optimized anchors trigger algorithmic penalties

#### Reference Sources

- [Search Engine Land — Complete Guide to Topic Clusters and Pillar Pages](https://searchengineland.com/guide/topic-clusters)
- [SiteImprove — Pillar and Cluster Content Strategy](https://www.siteimprove.com/blog/pillar-and-cluster-content-strategy/)
- [SiteImprove — Designing Pillar Pages for Maximum SEO Impact](https://www.siteimprove.com/blog/pillar-page-design/)
- [HubSpot — Topics, Pillar Pages, and Subtopics](https://knowledge.hubspot.com/content-strategy/pillar-pages-topics-and-subtopics)
- [SEOScore.tools — Content Clusters & Internal Linking for SEO 2026](https://seoscore.tools/blog/content-clusters/)
- [LinkBot — Topic Clusters for SEO: Build Topical Authority 2026](https://library.linkbot.com/topic-clusters-seo/)
- [Flora Fountain — Master Pillar Pages & Topic Clusters in 2026](https://florafountain.com/pillar-pages-topic-clusters-strategy-2026/)
- [Semrush — Internal Links: Ultimate Guide + Strategies](https://www.semrush.com/blog/internal-links/)
- [LinkBuildingHQ — Backlink Acquisition in 2026](https://www.linkbuildinghq.com/blog/what-you-should-know-about-backlink-acquisition-in-2026/)
- [ALM Corp — Definitive Guide to Link Building 2026](https://almcorp.com/blog/definitive-guide-link-building-2026/)

---

## 11. Performance and Build Optimization

### Large-Scale Static Builds

For sites with 100,000+ pages, Astro's static build can take a long time. Strategies:

1. **Incremental builds**: Only rebuild pages that changed (Astro supports this natively)
2. **On-demand rendering**: Use Astro's server-side rendering for less-trafficked pages (hybrid mode)
3. **Pagination in getStaticPaths**: Fetch pages in batches to avoid memory issues
4. **Build caching**: Cache Payload API responses during build

```javascript
// astro.config.mjs — hybrid mode for large sites
export default defineConfig({
  output: "hybrid", // Static by default, server-render on demand
  // ...
});
```

For hybrid mode, mark high-traffic pages as static (`export const prerender = true`) and let long-tail pages render on demand.

### Image Optimization

- Use Astro's `<Image>` component for automatic WebP/AVIF conversion and lazy loading
- Define image sizes in the Media collection (thumbnail, card, hero, og) to avoid layout shift
- Set `loading="lazy"` on all below-the-fold images
- Use `fetchpriority="high"` on hero/LCP images

### Core Web Vitals Targets

| Metric | Target | How |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Preload hero images, minimize server response time |
| INP (Interaction to Next Paint) | < 200ms | Minimal client JS (Astro's islands architecture) |
| CLS (Cumulative Layout Shift) | < 0.1 | Set explicit image dimensions, avoid dynamic content injection |

---

## 12. Analytics and Tracking

### PostHog Integration for SEO Monitoring

Track which programmatic pages are performing well:

```typescript
// Track page views with service/location metadata
posthog.capture("$pageview", {
  page_type: "service-page",       // or "service", "location", "blog"
  service_name: service.name,
  service_slug: service.slug,
  location_city: location.city,
  location_state: location.stateCode,
  content_source: page.contentSource, // "template", "ai", "manual", "enriched"
  content_quality_score: page.contentQualityScore,
});
```

This lets you build dashboards showing:
- Which service+location combos get the most traffic
- Whether AI-enriched content performs better than template content
- Which locations/services need more content investment
- Conversion rates by page type

---

## 13. CMS White-Labeling

### Customizing the Payload Admin Panel for Clients

```typescript
// In payload.config.ts admin section:
admin: {
  meta: {
    titleSuffix: " — Client Name Portal",
    icons: [
      { url: "/client-favicon.ico", type: "image/x-icon" },
    ],
    openGraph: {
      title: "Client Name — Content Portal",
      description: "Manage your website content",
      images: [{ url: "/og-admin.png" }],
    },
  },
  components: {
    graphics: {
      Logo: "/src/components/admin/Logo",      // Custom logo component
      Icon: "/src/components/admin/Icon",       // Custom sidebar icon
    },
    // Custom dashboard after login
    afterDashboard: ["/src/components/admin/WelcomeDashboard"],
  },
  // Custom CSS for brand colors
  // The file already exists at: src/app/(payload)/custom.css
}
```

```css
/* templates/next-app/src/app/(payload)/custom.css */
/* Override Payload admin panel colors with client brand */
:root {
  /* Primary brand color — change these per client */
  --theme-elevation-0: #ffffff;
  --theme-elevation-50: #f8f9fa;
  --theme-elevation-100: #f1f3f5;
  /* Add more overrides as needed */
}

/* Custom login page branding */
.login .form-header {
  /* Custom styles */
}

/* Custom sidebar */
.nav {
  /* Brand sidebar styles */
}
```

---

## 14. Automation Workflows

### Payload Hooks for Automation

Four lifecycle hooks automate common tasks across the CMS:

| Hook | File | Type | What It Does |
|---|---|---|---|
| **Auto-Generate Slug** | `hooks/auto-generate-slug.ts` | `beforeChange` | Generates URL-safe slug from name/title on create or when slug is empty on update |
| **Auto-Generate SEO** | `hooks/auto-generate-seo.ts` | `beforeChange` | Fills empty `seoTitle` (from name + brand) and `seoDescription` (from shortDescription, max 160 chars) |
| **Sync to CRM** | `hooks/sync-to-crm.ts` | `afterChange` | On form submission create, syncs lead data to Twenty CRM via REST API; fails silently if CRM not configured |
| **Send Notification** | `hooks/send-notification.ts` | `afterChange` | On form submission create, sends email notification via Resend; fails silently if API key not set |

All hooks are designed to fail gracefully — secondary actions (CRM sync, email) never block the primary operation.

> **Full implementation**: See [Seed Scripts & Automation](./SEED_SCRIPTS_AND_AUTOMATION.md#automation-workflows) for complete hook implementations.

---

## 15. Deployment Considerations

### Pre-Deployment Checklist

1. **Configure S3 storage adapter** — Uncomment and configure `s3Storage` in `payload.config.ts`
2. **Set production DATABASE_URL** — Point to Supabase cloud, not localhost
3. **Set PAYLOAD_SECRET** — Generate with `openssl rand -hex 32`
4. **Set SITE_URL** — Used for canonical URLs, sitemaps, and OG tags
5. **Configure Vercel root directory** — `templates/astro-site` or `templates/next-app`
6. **Add environment variables to Vercel/hosting platform**
7. **Submit sitemap to Google Search Console**
8. **Set up Sentry for error monitoring**
9. **Configure PostHog for analytics**

### Build Pipeline for Large Sites

For sites with 100k+ pages:

```
1. Build Next.js (CMS + API)         → Deploy to Vercel
2. Build Astro (fetches from API)    → Deploy to Vercel/Cloudflare Pages
3. Generate sitemap index            → Submit to GSC
4. Run SEO validation script         → Flag issues
```

### Environment Variables for Production

```bash
# Production .env (Vercel environment variables)
SITE_URL=https://clientsite.com
PAYLOAD_API_URL=https://cms.clientsite.com/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
PAYLOAD_SECRET=<generated-hex-string>
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
SENTRY_DSN=https://xxxx@sentry.io/xxxx
SENTRY_AUTH_TOKEN=sntrys_xxxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx
S3_BUCKET=media
S3_ENDPOINT=https://xxxx.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=xxxx
S3_SECRET_ACCESS_KEY=xxxx
S3_REGION=us-east-1
RESEND_API_KEY=re_xxxx
```

---

## 16. Common Programmatic SEO Page Types

### Service Industry (Plumbing, HVAC, Electrical, Roofing, etc.)

```
/services/[service]                    → "Plumbing Services"
/services/[service]/[sub-service]      → "Drain Cleaning" (nested docs)
/locations/[city-state]                → "Austin, TX"
/locations/[city-state]/[neighborhood] → "Downtown Austin"
/[service]/[city-state]                → "Plumbing in Austin, TX"
/[service]/[city-state]/[neighborhood] → "Plumbing in Downtown Austin"
/blog/[slug]                           → "5 Signs You Need a Plumber"
```

### Real Estate / Property Management

```
/properties/[city]/[type]              → "Apartments in Austin"
/neighborhoods/[slug]                  → "Downtown Austin Guide"
/[type]/[city]/[beds]-bedroom          → "2 Bedroom Apartments in Austin"
```

### Legal / Professional Services

```
/practice-areas/[area]                 → "Personal Injury"
/locations/[city]                      → "Austin Office"
/[practice-area]/[city]                → "Personal Injury Lawyer in Austin"
/[practice-area]/[city]/[case-type]    → "Car Accident Lawyer in Austin"
```

### Healthcare / Medical

```
/services/[specialty]                  → "Dermatology"
/conditions/[condition]                → "Acne Treatment"
/locations/[city]                      → "Austin Clinic"
/[specialty]/[city]                    → "Dermatologist in Austin"
/[condition]/treatment-in-[city]       → "Acne Treatment in Austin"
```

### E-commerce / SaaS

```
/products/[category]                   → "Running Shoes"
/products/[category]/[brand]           → "Nike Running Shoes"
/compare/[product-a]-vs-[product-b]    → "Nike vs Adidas Running Shoes"
/alternatives/[competitor]             → "Nike Alternatives"
/[product]/reviews                     → "Nike Air Max Reviews"
```

For each of these patterns, the same approach applies:
1. Define collections for each entity type
2. Create blocks for page sections
3. Set up dynamic routes
4. Seed cross-product data
5. Generate schema.org markup per page type

---

## Companion Documents

The following detailed reference documents extend this blueprint. Each covers a specific topic in depth with full implementation code, Payload CMS collection configs, Astro/Next.js components, and validation scripts. **Claude Code should reference these when implementing the corresponding feature.**

| Document | File | What It Covers |
|---|---|---|
| **Local SEO & Google Business Profile** | [`LOCAL_SEO_AND_GBP.md`](./LOCAL_SEO_AND_GBP.md) | GBP optimization, NAP consistency, multi-location management, citations, review management, LocalBusiness schema, SAB vs storefront setup |
| **Canonical Tags Strategy** | [`CANONICAL_TAGS_STRATEGY.md`](./CANONICAL_TAGS_STRATEGY.md) | Self-referencing canonicals, near-duplicate handling, cross-domain canonicals, pagination, hreflang interaction, build-time validation, GSC monitoring |
| **URL Structure Rules** | [`URL_STRUCTURE_RULES.md`](./URL_STRUCTURE_RULES.md) | Slugification algorithm, location URL patterns, stop words, trailing slashes, URL depth, redirect tracking, multilingual URLs, Payload CMS slug validation |
| **Content Freshness Strategy** | [`CONTENT_FRESHNESS_STRATEGY.md`](./CONTENT_FRESHNESS_STRATEGY.md) | Google's freshness factor, automated refresh jobs, seasonal content engine, content pruning, IndexNow/GSC notifications, freshness monitoring dashboard |
| **Conversion Optimization (CRO)** | [`CONVERSION_OPTIMIZATION.md`](./CONVERSION_OPTIMIZATION.md) | High-converting page anatomy, CTA placement, click-to-call, lead forms, trust signals, mobile sticky CTAs, A/B testing with PostHog, lead attribution |
| **Image SEO Strategy** | [`IMAGE_SEO_STRATEGY.md`](./IMAGE_SEO_STRATEGY.md) | File naming conventions, WebP/AVIF format strategy, responsive images, alt text generation, image sitemaps, OG image generation, Payload CMS Media collection |
| **Client Onboarding Process** | [`CLIENT_ONBOARDING_GUIDE.md`](./CLIENT_ONBOARDING_GUIDE.md) | Discovery questionnaire, data collection templates, industry-specific configuration, brand setup, CMS white-label, training plan, handoff checklist, onboarding workflow summary |
| **Google Search Console Setup & Monitoring** | [`GSC_SETUP_AND_MONITORING.md`](./GSC_SETUP_AND_MONITORING.md) | GSC property setup, sitemap submission, crawl budget management, index coverage monitoring, URL Inspection API, BigQuery integration, automated alerting pipeline, multi-site agency management |
| **404 / Error Page Strategy** | [`404_ERROR_PAGE_STRATEGY.md`](./404_ERROR_PAGE_STRATEGY.md) | Custom error pages, soft 404 prevention, 404 vs 410 usage, removed services/locations handling, broken link detection, redirect chain prevention, Payload CMS auto-redirect hooks |
| **Content Pruning Strategy** | [`CONTENT_PRUNING_STRATEGY.md`](./CONTENT_PRUNING_STRATEGY.md) | Identifying underperformers, pruning decision framework, automated analysis scripts, content consolidation, quality scoring system, bulk operations, over-pruning recovery |
| **Page Experience Signals** | [`PAGE_EXPERIENCE_SIGNALS.md`](./PAGE_EXPERIENCE_SIGNALS.md) | Core Web Vitals (LCP/INP/CLS), HTTPS enforcement, mobile-first design, Lighthouse CI, RUM with PostHog, performance budgets, font loading, third-party script management, accessibility |
| **Competitor Analysis & Keyword Research** | [`COMPETITOR_KEYWORD_RESEARCH.md`](./COMPETITOR_KEYWORD_RESEARCH.md) | Competitor identification, keyword research workflows, search intent mapping, keyword-to-page mapping, prioritization framework, content gap analysis, repeatable onboarding process |
| **CMS Collections & Block Definitions** | [`CMS_COLLECTIONS_AND_BLOCKS.md`](./CMS_COLLECTIONS_AND_BLOCKS.md) | Complete TypeScript configs for all 8 collections (Services, Locations, ServicePages, BlogPosts, FAQs, Testimonials, TeamMembers, Media), all 12 block definitions, plugin installation and configuration |
| **Routing, Sitemaps & Schema Markup** | [`ROUTING_AND_SITEMAPS.md`](./ROUTING_AND_SITEMAPS.md) | Astro dynamic routes, Payload API helper functions, sitemap XML generation, robots.txt, Schema.org generator functions (Service, LocalBusiness, FAQ, Review, Breadcrumb), SEOLayout component |
| **Seed Scripts & Automation** | [`SEED_SCRIPTS_AND_AUTOMATION.md`](./SEED_SCRIPTS_AND_AUTOMATION.md) | Content template system, AI content enrichment pipeline, seed scripts (services, locations, cross-product pages), Payload lifecycle hooks (slug, SEO, CRM sync, notifications), CSV format examples |

---

## 17. Checklist - Before Launching a Client Site

### CMS Setup
- [ ] All collections created and configured
- [ ] Blocks registered in page layout fields
- [ ] Versioning and drafts enabled
- [ ] SEO plugin configured with auto-generation callbacks
- [ ] Form builder plugin installed with at least one contact form
- [ ] Redirects plugin installed
- [ ] Import/Export plugin installed
- [ ] S3 storage adapter configured for production
- [ ] Admin panel white-labeled with client branding
- [ ] Access control configured (client can edit content, not delete collections)
- [ ] Live preview configured and pointing at correct frontend URL

### Content
- [ ] All services seeded
- [ ] All locations seeded
- [ ] Cross-product service pages generated
- [ ] FAQs created per service (at minimum)
- [ ] At least 3-5 testimonials per service
- [ ] Blog posts created for primary keywords
- [ ] All content reviewed for quality (no template variables visible)
- [ ] All images have alt text

### SEO
- [ ] Schema.org JSON-LD on every page type (Service, LocalBusiness, FAQPage, BreadcrumbList, Review)
- [ ] Meta title and description on every page
- [ ] Open Graph tags on every page
- [ ] Canonical URLs set correctly
- [ ] XML sitemap generated and accessible
- [ ] robots.txt configured
- [ ] Breadcrumbs on every page
- [ ] Internal linking between related pages
- [ ] **50-60% content uniqueness** between all service-location pages (run validate-content-uniqueness.ts)
- [ ] No pages published with contentQualityScore below 50
- [ ] Every service-location page has a unique intro paragraph (150-250 words)
- [ ] Every service-location page has a location-specific content section
- [ ] At least 3 dynamic data sections differ per page (FAQs, testimonials, team, links)
- [ ] Page titles follow pattern: "[Service] in [City], [State] | [Brand]"
- [ ] Meta descriptions are unique and under 160 characters
- [ ] Primary keyword defined for every page (keywords.primary field populated)
- [ ] Primary keyword appears in title tag, H1, meta description, URL, and first 100 words of every page
- [ ] Secondary keywords used in H2 headings across each page
- [ ] Geo-modifiers varied throughout location pages (not just city name repeated)
- [ ] No page has primary keyword appearing more than 8 times (keyword stuffing check)
- [ ] Image alt text includes relevant keywords naturally
- [ ] Keyword validation script passes with no critical issues
- [ ] Every page has exactly one `<h1>` tag (no more, no less)
- [ ] Heading hierarchy is sequential on every page (H1 → H2 → H3, no skipped levels)
- [ ] All page content wrapped in semantic elements (`<main>`, `<article>`, `<section>`, `<nav>`)
- [ ] All paragraph text uses `<p>` tags (no `<div>` for text content)
- [ ] `<strong>` used for important text (not `<b>`); `<em>` used for emphasis (not `<i>`)
- [ ] `<html lang="en">` (or appropriate language) set on every page
- [ ] Blog posts use `<time datetime="...">` for publish dates
- [ ] Block renderer outputs correct heading levels (H2 for sections, H3 for sub-sections)

### Pillar Pages & Linking Architecture
- [ ] Each service category has a pillar page (2,500-5,000 words)
- [ ] Each pillar page links to all its cluster pages (service+location combos and sub-services)
- [ ] Every cluster page links back to its parent pillar page (mandatory)
- [ ] Cluster pages link to 2-3 sibling clusters (same service nearby cities + other services same city)
- [ ] Every blog post links to at least 1 pillar page and 1-2 relevant cluster pages
- [ ] No orphan pages — every page has at least 3 internal links pointing to it
- [ ] Anchor text is varied per link (mix of exact match, partial match, branded, natural)
- [ ] No generic anchor text ("click here", "learn more", "read more")
- [ ] Link density does not exceed 1 link per 300 words of content
- [ ] Cross-pillar links connect related service categories
- [ ] Location hierarchy links connect neighborhoods → cities → states
- [ ] Breadcrumbs present on every page with correct hierarchy
- [ ] Google Business Profile and key directories set up with consistent NAP
- [ ] Backlink acquisition plan documented for top pillar pages and priority locations

### Performance
- [ ] Lighthouse score > 90 on all Core Web Vitals
- [ ] Images optimized (WebP/AVIF, proper dimensions, lazy loading)
- [ ] Minimal client-side JavaScript
- [ ] Server response time < 200ms (static pages)
- [ ] No layout shift (CLS < 0.1)

### Analytics & Monitoring
- [ ] PostHog tracking code installed
- [ ] Page type metadata included in analytics events
- [ ] Sentry error tracking configured
- [ ] Google Search Console site verified
- [ ] Sitemap submitted to Google Search Console
- [ ] Google Analytics or PostHog funnels set up for lead conversion

### Deployment
- [ ] Production environment variables set in hosting platform
- [ ] S3/cloud storage working for media uploads
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] 301 redirects from old site (if migrating)
- [ ] Build and deploy pipeline tested

---

## 18. Client Onboarding Guide

> **Reference Document**: The complete client onboarding process has been moved to a dedicated companion guide: [`CLIENT_ONBOARDING_GUIDE.md`](./CLIENT_ONBOARDING_GUIDE.md).

This guide covers the end-to-end process for bringing a new client into the Agency Web Stack — from initial discovery through 90 days of post-launch monitoring. It includes:

- **Intake & Discovery** (18.1–18.3): Client discovery questionnaire, CSV data collection templates, industry-specific collection configuration
- **Infrastructure & Branding** (18.4–18.5, 18.8): Brand configuration checklist, CMS white-label setup, environment & deployment setup
- **Content & SEO** (18.6–18.7): Initial content requirements & thresholds, SEO baseline setup (GSC, GBP, analytics)
- **Training & Handoff** (18.9–18.10): Client training plan (can do / should not do), comprehensive handoff checklist
- **Post-Launch** (18.11–18.12): 90-day monitoring setup (3 phases), template for client-specific CLAUDE.md
- **Complete Workflow** (18.13): Sequential 8-phase onboarding timeline with checkboxes and time estimates

**Total estimated time per client: 15–22 business days from kickoff to launch, plus 90 days of post-launch monitoring.**

For the full process, checklists, CSV templates, and code snippets, see [`CLIENT_ONBOARDING_GUIDE.md`](./CLIENT_ONBOARDING_GUIDE.md).

---

## Appendix: CSV Data Format Examples

> **CSV format examples**: See [Seed Scripts & Automation](./SEED_SCRIPTS_AND_AUTOMATION.md#appendix-csv-data-format-examples) for complete `services.csv` and `locations.csv` format examples with sample data.

---

*This document should be treated as a living blueprint. Update it as new Payload plugins become available, as the stack evolves, or as new programmatic SEO patterns are identified for client projects.*
