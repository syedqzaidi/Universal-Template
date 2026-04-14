# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Agency Web Stack — a pnpm monorepo template for building client websites. Two framework templates (Astro for marketing, Next.js for dashboards/CMS), shared packages, and integrated services (Supabase, Payload CMS, Twenty CRM, Stripe, Sentry, PostHog, Resend).

## Commands

```bash
# Development
pnpm dev:astro              # Astro dev server
pnpm dev:next               # Next.js dev server
pnpm dev:supabase           # Start local Supabase
pnpm stop:supabase          # Stop local Supabase

# Building
pnpm build:astro            # Production build for Astro
pnpm build:next             # Production build for Next.js

# Linting
cd templates/next-app && pnpm lint  # ESLint for Next.js

# Project setup
node scripts/create-project.mjs        # Interactive project wizard (choose preset, services)
bash scripts/bootstrap.sh my-project   # One-command bootstrap (wizard + init)
bash scripts/init-project.sh           # Port allocation, env injection, secrets generation
bash scripts/launch-ui.sh              # GUI dashboard (port 3333)

# Validation & testing
bash scripts/validate-template.sh           # Health checks (files, deps, config quality)
bash scripts/validate-template.sh --full    # + dev server smoke tests
bash scripts/validate-template.sh --fix     # Auto-fix (apply RLS, etc.)
bash scripts/e2e-test.sh                    # End-to-end workflow tests

# Docker (Twenty CRM)
docker compose -f docker/twenty/docker-compose.yml up -d
```

## Architecture

```
├── templates/
│   ├── astro-site/          # Astro 6 — marketing/SEO sites, file-based routing
│   │   └── src/{pages,components/ui,layouts,lib,styles}/
│   └── next-app/            # Next.js 16 — dashboard + Payload CMS admin
│       └── src/
│           ├── app/(app)/       # Main app routes
│           ├── app/(payload)/   # Payload admin UI mount point
│           ├── app/api/         # API routes (Payload REST + webhooks)
│           ├── collections/     # Payload collection definitions
│           ├── blocks/          # Reusable content blocks for layout arrays
│           ├── hooks/           # Payload lifecycle hooks (beforeChange, afterChange)
│           ├── globals/         # Payload globals (SiteSettings)
│           ├── access/          # Access control predicates
│           ├── fields/          # Custom Payload field components
│           ├── plugins/         # Payload plugin initialization
│           ├── webhooks/        # Incoming webhook handlers (Twenty, Resend)
│           ├── lib/             # Utilities (Supabase, Payload clients)
│           ├── emails/          # React Email templates
│           └── mcp/             # MCP tools and prompts for AI integration
├── packages/
│   ├── shared/              # @template/shared — Supabase, PostHog, Resend, Payload clients
│   └── create-site/         # @agency/create-site — setup wizard CLI
├── tools/ai-website-cloner/ # Standalone Next.js tool for reverse-engineering sites
├── docker/twenty/           # Twenty CRM v1.20 Docker Compose
├── supabase/                # Local Supabase config + migrations
├── scripts/                 # Bootstrap, setup, validation, e2e test scripts
├── docs/                    # Documentation site + integration seams
└── website-seo-playbook/    # 17 SEO strategy guides
```

### Key Relationships

- **@template/shared** exports `./supabase`, `./posthog`, `./resend`, `./payload`, `./types` — consumed by both templates
- **Payload CMS** lives inside `templates/next-app/` — collections in `src/collections/`, config at `src/payload.config.ts`
- **Astro fetches from Payload** via REST API client in `packages/shared/src/payload/client.ts` — all CMS pages are SSR
- **Twenty CRM** integration: API client at `src/lib/twenty/`, webhooks at `src/webhooks/`
- **MCP tools** (72 tools, 9 prompts) at `templates/next-app/src/mcp/` — AI-powered CMS operations + website generation

## Port Allocation System

**Ports are never hardcoded in source code.** Each project gets unique ports via `init-project.sh`, which hashes the project name to generate an offset:

- Astro: `4400 + offset`, Next.js: `3100 + offset`, Twenty: `3200 + offset`
- Supabase services use wider spacing: `(offset % 50) * 10`
- Ports saved to `.ports` file and injected into `.env.local` for both templates

This enables multiple client projects to run simultaneously without port collisions. The `.env.template` has default ports (4400, 3100) that get overwritten per-project.

**Critical rule:** Never use port fallbacks like `|| 'http://localhost:3100'` in template source. Use env vars only. The validation script (`check_no_hardcoded_ports`) enforces this.

**Config-time env loading:** `astro.config.mjs` reads `.env.local` manually via `fs.readFileSync` because Astro hasn't loaded env files yet when the config runs.

## Environment Variable Flow

1. `.env.template` — source of truth (checked in), defines all vars with default ports
2. `create-project.mjs` — wizard removes unused service vars based on preset
3. `init-project.sh` — copies `.env.template` → `.env.local`, injects per-project ports + generated secrets
4. `.env.local` copied to `templates/next-app/.env.local` and `templates/astro-site/.env.local`

Payload plugins activate conditionally based on env vars (e.g., MCP plugin only if API keys present, Stripe plugin only if `STRIPE_SECRET_KEY` is set).

## Payload CMS Architecture

### Collections vs Blocks

- **Collections** (10): Pages, Services, Locations, ServicePages, BlogPosts, FAQs, Testimonials, TeamMembers, Media, Users — top-level content types with access control, versioning, and drafts
- **Blocks** (13): Hero, ServiceDetail, FAQ, Testimonials, CTA, LocationMap, Content, Stats, Gallery, Pricing, Team, RelatedLinks — reusable content sections added to collection `layout` array fields

### Service + Location Cross-Product

Services (offerings) × Locations (cities) = ServicePages. This powers programmatic SEO with pages like `/services/plumbing/austin-tx`. All three collections interlink for internal linking.

### Access Control

Predicates in `src/access/`: `isAdmin`, `isAdminOrEditor`, `publishedOrLoggedIn` (public sees published, logged-in users see all). Applied per-collection at read/create/update/delete level.

### Slug Auto-Generation

`src/hooks/auto-generate-slug.ts` runs on every collection with a slug field:
- On create: generates from `title`/`name`/`displayName` using `slugify()` (aggressive) or `slugifyLight()` (blog posts)
- On every save: normalizes existing slugs to lowercase, removes special chars, collapses dashes

### Live Preview (Astro ↔ Payload)

Real-time preview in Payload's admin panel, rendered by Astro:

1. `payload.config.ts` configures `livePreview.url` pointing to Astro's `/preview` route with collection, slug, and token
2. Astro's `preview.astro` (SSR) fetches the document and renders a `<LivePreview>` React island (`client:load`)
3. `@payloadcms/live-preview-react` subscribes to `window.postMessage` events from the admin panel
4. Edits in the admin form merge into the preview data in real-time via `useLivePreview` hook
5. CORS: `payload.config.ts` allows the Astro origin, and a custom `OPTIONS` handler in `api/[...slug]/route.ts` handles preflight

**Requirements:** `PREVIEW_SECRET` must match in both `.env.local` files. `PAYLOAD_API_KEY` must be set in Astro's env for draft content. Users collection has `useAPIKey: true`.

## SSR vs SSG

- **SSR pages** (`export const prerender = false`): All CMS-driven routes (services, blog, locations), preview, search — content appears instantly without rebuilds
- **SSG pages** (default): Static pages (404, terms, privacy, faq, contact, team) — built at build time
- **Cache headers**: SSR pages set `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` in production for CDN caching; disabled in dev for fresh content

## Tailwind CSS v4

No `tailwind.config.js` file. Configuration is CSS-native:
- Astro: `@tailwindcss/vite` plugin in `astro.config.mjs`
- Next.js: `@tailwindcss/postcss` in `postcss.config.mjs`
- Import via `@import "tailwindcss"` in CSS files
- Design tokens defined in CSS `@theme` blocks; colors use OKLCh color space

## UI Components

Both templates use shadcn/ui with Radix UI primitives. Components live in `src/components/ui/`. Animation via Motion library (not Framer Motion).

## Project Presets

`full` | `marketing` (Astro only) | `dashboard` (Next.js only) | `both-frameworks` | `minimal` | `nextjs-minimal`

## Node Requirements

Root: >=20, Astro: >=22.12.0, AI Website Cloner: >=24

## Universal Generation Platform

A two-layer system that generates complete client websites from natural language business descriptions.

### Layer 1 (Universal Primitives)

Pre-built infrastructure that never changes:
- **3 universal collections** (Pages, Media, Users) in `collections/_universal/`
- **12 universal blocks** in `blocks/_universal/`
- **5 registries** (blueprint, schema, block, sitemap, nav) in `astro-site/src/lib/`
- **12 PageBlueprints** in `astro-site/src/lib/blueprints/` defining section structure, CRO rules, and visual rhythm
- **11 universal components** (AnimatedSection, FilterBar, Pagination, etc.)
- **BlockRenderer** enhanced with blueprint section metadata support

### Layer 2 (Generation Engine — 12 MCP Tools)

| Tool | Purpose |
|------|---------|
| `analyze_business` | Parse business description → BusinessModel JSON |
| `generate_collection` | Create Payload collection .ts file + auto-wire plugins/analytics |
| `generate_cross_product_collection` | Entity × entity pSEO collections (quality gate: 65) |
| `generate_page` | Create Astro SSR page with blueprint sections |
| `generate_block` | Create Payload block config + Astro component |
| `generate_schema` | Add JSON-LD schema.org generator |
| `configure_crm_pipeline` | Twenty CRM pipeline (defers if unavailable, writes sync config) |
| `apply_crm_config` | Apply deferred CRM config when Twenty becomes available |
| `generate_email_sequence` | React Email template + webhook trigger mapping |
| `seed_collection` | Populate collections (blueprint-aware layout, cleanup support) |
| `generate_nav` | Header/footer navigation config |
| `validate_generation` | Run builds, verify TypeScript |

### Generation Protocol

Use the `generation_protocol` MCP prompt to start a generation. Flow:
1. Analyze business → 2. Generate collections → 3. Cross-products → 4. Blocks → 5. Routes → 6. Schemas → 7. CRM/email → 8. Seed content → 9. Nav → 10. Validate

### Manifest System

- `.generation-manifest.json` tracks step completion and generated files
- `.seed-manifest.json` tracks seeded CMS entries
- Supports resume from interruption and cleanup

### PageBlueprint System

12 built-in blueprints: homepage, entity-detail, entity-listing, cross-product, blog-post, blog-index, team, faq, contact, about, landing-page, 404.

Each blueprint defines:
- **Sections** with background/width/animation tokens
- **CRO** config (CTA frequency, trust signal positions)
- **SEO** config (schema types, meta patterns)
- **Rhythm** (spacing, background alternation, visual breaks)

Section metadata is applied by BlockRenderer at render time — Payload data stays clean.

### Plugin Configuration

`src/lib/plugin-config.ts` centralizes all plugin collection arrays. Generation tools append to these arrays when creating new collections.

### Reserved Slugs

Never use for generated collections: `pages, media, users, contacts, search, redirects, forms, form-submissions, payload-preferences, payload-migrations, plugin-ai-instructions`

### Project Wizard Integration

`scripts/create-project.mjs` includes a "Describe your business" prompt when Payload is selected. The description is saved to `.generation-manifest.json` for the generation protocol to use. CLI: `--business-description="..."`.

### E2E Testing

```bash
node scripts/e2e-generation-test.mjs           # Run all validation tests (77 checks)
node scripts/e2e-generation-test.mjs dog-grooming  # Single scenario
node scripts/e2e-generation-test.mjs edge-cases    # Edge case tests only
```

Tests validate: file existence, blueprint structure, component inventory, TypeScript compilation, scenario definitions (3 business types), edge cases (reserved slugs, 200-page cap, manifest system).

## Next.js 16 Warning

This uses Next.js 16 which has breaking changes from earlier versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
