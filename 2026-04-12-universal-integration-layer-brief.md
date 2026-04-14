# Brief: Universal Integration Layer — Astro + Payload + Twenty CRM

> **Purpose**: Starting point for designing a business-type-agnostic integration layer. Feed this to a fresh Claude Code session to continue the discussion.
>
> **Date**: 2026-04-12
> **Status**: Discussion phase — no implementation yet

---

## Background

The Agency Web Stack (`/Users/syber/Desktop/AI Projects/testing/capabilities/`) is a pnpm monorepo with:

- **Astro** (`templates/astro-site/`) — static/SSR marketing frontend
- **Next.js** (`templates/next-app/`) — Payload CMS admin + dashboard
- **Shared package** (`packages/shared/`) — `@template/shared` with Supabase, PostHog, Resend, Sentry, and Payload clients
- **Supabase** — PostgreSQL database via Payload's postgres adapter
- **Twenty CRM** — Customer relationship management (Docker-based)

### What Was Just Built

A complete Astro ↔ Payload CMS integration was implemented (see `docs/specs/2026-04-11-astro-payload-integration-spec.md` for the full spec). This includes:

- **7 new Payload collections**: Services, Locations, ServicePages, BlogPosts, FAQs, Testimonials, TeamMembers
- **12 block types**: Hero, ServiceDetail, FAQ, Testimonials, CTA, LocationMap, Content, Stats, Gallery, Pricing, Team, RelatedLinks
- **SiteSettings global**: branding, contact info, social links, rebuild config
- **Shared Payload client** (`@template/shared/payload`): generic REST wrapper + typed collection helpers
- **Astro routes**: services, locations, service×location (pSEO), blog, team, FAQ, contact, 404, preview, search, sitemap, robots.txt
- **Astro components**: SEOLayout, SiteHeader, SiteFooter, BlockRenderer, 12 block components, PayloadImage, RichText, Breadcrumbs, cards
- **SEO infrastructure**: JSON-LD schemas, meta tags, OG, canonical, hreflang, keyword fields, content quality scoring
- **Deploy pipeline**: afterChange webhook triggers (auto/manual/auto-with-review), DeployButton in admin
- **61 MCP tools** for programmatic SEO (seeding, page generation, quality auditing, etc.)
- **Twenty CRM integration**: contacts sync, webhook handlers, email templates via Resend

### The Problem

**Everything above is hardcoded for service-area businesses** (plumbers, HVAC, electricians serving multiple cities). The collections, routes, URL patterns, JSON-LD schemas, keyword strategies, nav structure, and CRO elements all assume a local service business model.

If a client needs a **portfolio site**, **e-commerce store**, **SaaS marketing page**, or **blog-only site**, the current integration doesn't apply — you'd have to rebuild most of it.

---

## The Goal

Create a **layered architecture** where:

1. **Layer 1 (Universal)** — works for EVERY project, regardless of business type
2. **Layer 2 (Business Templates)** — chosen at project setup, provides business-specific collections/routes/schemas
3. **Layer 3 (Client Customization)** — per-project tweaks

The project wizard (`scripts/create-project.mjs`) would ask "What type of site?" and scaffold the correct Layer 2 on top of the universal Layer 1.

---

## Current Analysis: What's Universal vs. Business-Specific

### Already Universal (Layer 1 candidates)

| Component | Location | Why Universal |
|---|---|---|
| `createPayloadClient()` | `packages/shared/src/payload/client.ts` | Generic REST client — works with any collection |
| `fetchPayload()`, `fetchBySlug()`, `fetchPaginated()` | Same | Collection-agnostic methods |
| `SEOLayout.astro` | `templates/astro-site/src/layouts/` | Every site needs meta, OG, canonical, JSON-LD |
| `RichText.astro` | `templates/astro-site/src/components/` | Renders Lexical content regardless of type |
| `PayloadImage.astro` | Same | Images are images |
| `BlockRenderer.astro` | `templates/astro-site/src/components/blocks/` | Block system is content-agnostic |
| `SiteSettings` global | `templates/next-app/src/globals/` | Every site has name, logo, phone, socials |
| Preview system | `templates/astro-site/src/pages/preview.astro` | Every site needs draft preview |
| Rebuild pipeline | `src/hooks/trigger-rebuild.ts`, `src/webhooks/rebuild-handler.ts` | Every site needs deploy triggers |
| `sitemap.xml.ts`, `robots.txt.ts`, `404.astro` | `templates/astro-site/src/pages/` | Universal SEO infrastructure |
| Astro hybrid mode + adapter strategy | `astro.config.mjs` | Host-agnostic deployment |
| `SiteHeader.astro`, `SiteFooter.astro` | `templates/astro-site/src/components/` | Structure is universal; content is business-specific |
| Utility components (Breadcrumbs, cards) | Same | Reusable patterns |
| Some blocks (Hero, Content, CTA, Stats, Gallery, Pricing, Team) | `templates/astro-site/src/components/blocks/` | Used across business types |

### Business-Specific (Layer 2 candidates)

| Component | Current Assumption | Breaks For |
|---|---|---|
| 7 pSEO collections (Services, Locations, ServicePages, etc.) | Business sells services in geographic areas | E-commerce (products), portfolio (projects), SaaS (features) |
| URL structure (`/services/plumbing/austin-tx`) | Service × location cross-product | Portfolio (`/projects/brand-redesign`), e-com (`/products/shoes`) |
| JSON-LD schemas (LocalBusiness, Service) | Local service business | E-com needs Product, Offer. Portfolio needs CreativeWork |
| `generateSchemas()` page types | Only service/location/blog/faq | No product, project, category types |
| Nav structure (services dropdown, locations footer) | Service businesses | E-com needs categories/cart. Portfolio needs project filters |
| Keyword strategy (geo-modifiers, service+city) | Local SEO | E-com: product keywords. Portfolio: brand keywords |
| CRO elements (phone click-to-call, "Free Estimate") | Lead generation | E-com: "Add to Cart". Portfolio: "View Case Study" |
| Some blocks (ServiceDetail, LocationMap, RelatedLinks) | Service-area specific | Not relevant for portfolio or e-com |
| Twenty CRM sync logic (form → contact → deal) | Lead-based business | E-com: order → customer. Portfolio: inquiry → prospect |
| MCP tools (61 pSEO tools) | Service-area pSEO | Different content operations per business type |

---

## Proposed Layer 2 Business Templates

### service-area/ (Current — already built)
Collections: Services, Locations, ServicePages, FAQs, Testimonials, TeamMembers
Routes: /services/[slug], /services/[service]/[city], /locations/[city], /blog, /team, /faq
Schemas: LocalBusiness, Service, FAQPage
CRM flow: Form submission → Twenty contact → deal pipeline

### ecommerce/
Collections: Products, Categories, Orders, Reviews, Inventory
Routes: /products/[slug], /categories/[slug], /cart, /checkout, /account
Schemas: Product, Offer, AggregateRating, BreadcrumbList
CRM flow: Order → Twenty contact → customer pipeline

### portfolio/
Collections: Projects, CaseStudies, Skills, Clients, Awards
Routes: /projects/[slug], /case-studies/[slug], /about, /services (simple list)
Schemas: CreativeWork, Organization, Person
CRM flow: Contact form → Twenty contact → prospect pipeline

### saas/
Collections: Features, PricingPlans, Changelog, Docs, Integrations
Routes: /features/[slug], /pricing, /changelog, /docs/[...slug]
Schemas: SoftwareApplication, Offer, Organization
CRM flow: Demo request → Twenty contact → trial pipeline

### blog-only/
Collections: Posts, Authors, Tags, Categories (minimal)
Routes: /[slug], /author/[slug], /tag/[slug]
Schemas: BlogPosting, Person, BreadcrumbList
CRM flow: Newsletter signup → Twenty contact

---

## Key Design Questions to Resolve

1. **Interface between Layer 1 and Layer 2**: What must a business template provide for the universal layer to work? (collection list, route patterns, schema generators, nav items, CRM mapping?)

2. **Block library**: Which blocks are universal vs. business-specific? Should all blocks ship with Layer 1 and templates just choose which to use?

3. **Schema generator architecture**: Should `generateSchemas()` be a pluggable system where templates register their own schema generators? Or should each template provide its own `seo.ts`?

4. **Nav/footer contract**: Should Layer 1 define a nav interface (e.g., "give me primary links and secondary links") that templates populate?

5. **Twenty CRM mapping**: Should the CRM sync be event-based (templates emit events like "lead_created", "order_placed") with a universal handler that maps to Twenty?

6. **MCP tools**: Should each business template bring its own MCP tools? Or should MCP tools be generic CRUD + business-specific tools as plugins?

7. **Migration path**: How do we refactor the current monolithic service-area implementation into Layer 1 + Layer 2 without breaking existing projects?

8. **Project wizard**: How should `create-project.mjs` present the business type choice and scaffold accordingly?

---

## Recommended Approach

**Don't redesign from scratch.** The current implementation is working. Instead:

1. **Identify the seams** — where does universal end and business-specific begin?
2. **Extract Layer 1** — move universal code into a clear boundary (base template, shared interfaces)
3. **Extract service-area as first Layer 2 template** — the current code becomes the reference implementation
4. **Define the template interface** — what a business template must export
5. **Build one more template** (e.g., portfolio or e-commerce) to validate the interface
6. **Iterate** — refine the boundary based on what we learn

This is a refactoring exercise, not a rewrite.

---

## Files to Reference

- Full integration spec: `docs/specs/2026-04-11-astro-payload-integration-spec.md`
- SEO playbook: `website-seo-playbook/` (17 documents)
- Current Payload config: `templates/next-app/src/payload.config.ts`
- Current Astro routes: `templates/astro-site/src/pages/`
- Shared Payload client: `packages/shared/src/payload/`
- Twenty CRM integration: `templates/next-app/src/lib/twenty/`, `src/plugins/twenty-crm.ts`
- Project wizard: `scripts/create-project.mjs`
- Project init: `scripts/init-project.sh`
