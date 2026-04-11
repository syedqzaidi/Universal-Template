# MCP Tools Reference

This directory contains **61 custom MCP tools** and **8 prompts** built into Payload CMS via `@payloadcms/plugin-mcp`. These tools enable an AI agent to manage the entire CMS — from content creation to SEO auditing — through conversation.

## Architecture

```
src/mcp/
├── index.ts                    # Plugin config: collection permissions + tool/prompt registration
├── tools/
│   ├── index.ts                # Barrel export — aggregates all tool arrays into allTools
│   ├── pseo-constants.ts       # Shared constants (SITE_NAME, MAX_SEED_ITEMS)
│   ├── content-lifecycle.ts    # 7 tools — page publishing, scheduling, archiving
│   ├── seo-indexing.ts         # 10 tools — sitemap, indexing, JSON-LD, hreflang, robots.txt
│   ├── content-quality.ts      # 6 tools — readability, orphan pages, thin content, broken links
│   ├── cro.ts                  # 3 tools — conversion rate optimization
│   ├── i18n.ts                 # 2 tools — translation management
│   ├── search-redirects.ts     # 3 tools — redirect management
│   ├── media.ts                # 2 tools — image/file management
│   ├── forms.ts                # 2 tools — form submission stats/exports
│   ├── pseo-seeding.ts         # 5 tools — bulk data seeding
│   ├── pseo-page-generation.ts # 3 tools — cross-product page generation + AI enrichment
│   ├── pseo-keywords.ts        # 2 tools — keyword generation + validation
│   ├── pseo-quality.ts         # 4 tools — content uniqueness, quality scoring, SEO audit
│   ├── pseo-architecture.ts    # 4 tools — internal linking, orphan detection, slug/canonical validation
│   ├── pseo-lifecycle.ts       # 4 tools — freshness, pruning, cannibalization, redirects
│   ├── pseo-local-seo.ts       # 4 tools — NAP, testimonials, image alt/filenames
│   └── pseo-launch.ts          # 2 tools — pre-launch checklist, collection stats
└── prompts/
    ├── index.ts                # Barrel export for prompts
    └── prompts.ts              # 8 prompt definitions
```

## How It Works

The MCP plugin exposes tools and prompts over the Model Context Protocol. An AI agent (Claude, GPT, etc.) connects to the Payload CMS MCP endpoint and can call any tool. All CRUD operations use `req.payload` (Payload's internal API), which runs in-process — no REST calls.

### Tool Contract

Every tool follows this pattern:

```ts
{
  name: string                                    // snake_case identifier
  description: string                             // Human-readable purpose
  parameters: Record<string, z.ZodType>           // Plain object (NOT z.object())
  handler: async (
    args: Record<string, unknown>,
    req: PayloadRequest,
    _extra: unknown
  ) => { content: [{ text: string; type: 'text' }] }
}
```

### Error Handling

- Every handler wraps its body in `try/catch`, returning `text('Error: ...')` on failure
- Bulk operations (seed tools, page generation) use per-item `try/catch` to continue on individual failures
- Paginated queries include truncation warnings when `totalDocs > docs.length`

## Configuration

### `pseo-constants.ts`

Update these before deploying to a client:

```ts
export const SITE_NAME = 'Our Company'  // Used in SEO titles and meta descriptions
export const MAX_SEED_ITEMS = 200       // Max items per bulk seed call
```

### Collection Permissions

Configured in `index.ts`. Each collection has granular `find/create/update/delete` permissions:

| Collection | Find | Create | Update | Delete | Description |
|------------|------|--------|--------|--------|-------------|
| pages | ✓ | ✓ | ✓ | ✓ | Website pages with SEO, i18n, versioning |
| media | ✓ | ✓ | ✓ | — | Uploaded images and files |
| users | ✓ | — | — | — | CMS users (read-only via MCP) |
| services | ✓ | ✓ | ✓ | — | Business services with SEO metadata |
| locations | ✓ | ✓ | ✓ | — | Service areas with coordinates |
| service-pages | ✓ | ✓ | ✓ | ✓ | Cross-product service×location pages |
| blog-posts | ✓ | ✓ | ✓ | — | Blog articles with service/location links |
| faqs | ✓ | ✓ | ✓ | ✓ | FAQ entries for schema.org markup |
| testimonials | ✓ | ✓ | ✓ | — | Client reviews with ratings |
| team-members | ✓ | ✓ | ✓ | — | Team with location/specialty assignments |

---

## Programmatic SEO Tools Reference

### Data Seeding (`pseo-seeding.ts`)

These tools bulk-create foundational data. All accept JSON array strings and enforce a 200-item limit per call.

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `seed_services` | `services` (JSON), `status?` | Bulk-create services with auto-generated slugs, SEO titles, and descriptions |
| `seed_locations` | `locations` (JSON), `status?` | Bulk-create locations with `city-stateCode` slugs and GeoJSON coordinates |
| `seed_faqs` | `faqs` (JSON) | Bulk-create FAQs, resolving service/location names to IDs |
| `seed_testimonials` | `testimonials` (JSON) | Bulk-create testimonials with relationship resolution |
| `seed_team_members` | `members` (JSON) | Bulk-create team members, resolving location/specialty names to IDs |

**Example — seeding services:**
```
seed_services({
  services: '[{"name":"Plumbing","category":"home-services","shortDescription":"Professional plumbing for residential and commercial properties."},{"name":"HVAC","category":"home-services","shortDescription":"Heating, ventilation, and air conditioning services."}]',
  status: 'published'
})
```

### Page Generation (`pseo-page-generation.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `generate_service_pages` | `serviceFilter?`, `locationFilter?`, `dryRun?`, `batchSize?` | Cross-product services × locations → service-pages (max 100/call) |
| `enrich_service_pages` | `limit?`, `serviceFilter?`, `locationFilter?`, `qualityThreshold?` | Find template pages, return enrichment prompts + template variants |
| `update_service_page_content` | `id`, `introduction?`, `localContent?`, `contentSource?`, `contentQualityScore?` | Update a service-page after enrichment |

**Workflow:** `generate_service_pages` → `enrich_service_pages` → (AI generates content) → `update_service_page_content`

### Keywords (`pseo-keywords.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `generate_keywords` | `serviceName`, `city`, `state`, `stateCode`, `features?` | Pure computation: primary, secondary (6), long-tail (4), geo-modifiers |
| `validate_keyword_placement` | `id`, `primaryKeyword?` | Check SEO fields for keyword presence, stuffing (>8), and meta lengths |

### Quality (`pseo-quality.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `validate_content_uniqueness` | `serviceFilter?`, `similarityThreshold?`, `limit?` | Trigram Jaccard similarity — find near-duplicate pages (default threshold: 0.4) |
| `content_quality_report` | `serviceFilter?`, `minScore?`, `maxScore?` | Segment pages by quality band (0-30 through 86-100) with action recommendations |
| `audit_seo_completeness` | `collections?` | Check published pages for missing SEO title, description, and linked FAQs |
| `audit_heading_structure` | `limit?` | Validate H1 count, heading hierarchy, keyword placement, H1 length (20-60 chars) |

### Architecture (`pseo-architecture.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `build_internal_links` | `id`, `maxSiblingLinks?`, `maxCrossServiceLinks?` | Generate internal link recommendations (sibling, cross-service, pillar) |
| `find_orphan_pages_advanced` | `minInboundLinks?`, `collection?` | Find pages with <3 inbound references |
| `audit_slugs` | `collection?` | Validate slugs: lowercase, hyphens, length ≤60/segment, depth ≤3 |
| `audit_canonical_consistency` | `baseUrl`, `trailingSlash?` | Validate canonical URLs: HTTPS, lowercase, no trailing slash, detect duplicates |

### Lifecycle (`pseo-lifecycle.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `audit_stale_pages` | `collection?`, `pillarDays?`, `clusterDays?` | Find pages past freshness deadline (pillar: 30d, cluster: 60d) |
| `get_pruning_candidates` | `collection?`, `gracePeriodDays?` | Identify pages to refresh, flag, or keep (grace period: 180d) |
| `detect_keyword_cannibalization` | `collection?` | Find pages competing for the same primary keyword |
| `generate_redirect_manifest` | `collection`, `status?` | Generate 301 redirects for archived services/locations |

### Local SEO (`pseo-local-seo.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `audit_nap_consistency` | `phonePattern?` | Validate phone/address format consistency across locations |
| `audit_testimonial_coverage` | `minTestimonials?`, `minRating?` | Check minimum testimonials per service+location combo |
| `audit_image_alt_advanced` | `limit?` | Validate alt text: present, ≤125 chars, no "image of..." prefix, no stuffing |
| `validate_image_filenames` | `limit?` | Check filenames: lowercase, hyphens, ≤60 chars, extension matches MIME type |

### Launch (`pseo-launch.ts`)

| Tool | Parameters | What It Does |
|------|-----------|--------------|
| `run_prelaunch_checklist` | `baseUrl`, `sampleSize?` | Full pre-launch validation: CMS setup, content quality, SEO, linking, canonicals |
| `list_collection_stats` | *(none)* | Dashboard: counts by status across all 8 content collections |

---

## Prompts Reference

| Prompt | Args | Purpose |
|--------|------|---------|
| `brand_voice` | `context?` | Professional agency tone guidelines |
| `seo_content_standards` | `keyword?` | Meta title/description and keyword placement rules |
| `landing_page_structure` | `product?` | Hero → problem → solution → CTA conversion flow |
| `image_guidelines` | `imageType?` | Aspect ratios, alt text, format preferences, file size limits |
| `translation_guidelines` | `targetLocale?`, `sourceText?` | SEO-preserving translation with cultural adaptation |
| `pseo_page_template` | `serviceName`, `city`, `state` | Service-page content templates (5 headlines, 3 intros, 2 local, 3 CTAs) |
| `pseo_enrichment_prompt` | `serviceName`, `city`, `stateCode` | AI enrichment prompt for upgrading template-generated pages |
| `pseo_launch_readiness` | `pageCount?` | Pre-launch quality thresholds and readiness checklist |

---

## Key Thresholds

These values are codified in the tools and match the SEO playbook:

| Rule | Value | Used In |
|------|-------|---------|
| Min quality score to publish | 50 | `generate_service_pages`, `content_quality_report` |
| Keyword stuffing threshold | >8 occurrences | `validate_keyword_placement` |
| Content uniqueness fail | Jaccard ≥ 0.4 | `validate_content_uniqueness` |
| H1 length | 20-60 chars | `audit_heading_structure` |
| Meta title max | 60 chars | `audit_seo_completeness`, `validate_keyword_placement` |
| Meta description max | 160 chars | `audit_seo_completeness` |
| Thin content threshold | <300 words | `get_pruning_candidates` |
| Min inbound links (orphan) | 3 | `find_orphan_pages_advanced` |
| Slug max per segment | 60 chars | `audit_slugs` |
| Max URL depth | 3 segments | `audit_slugs` |
| Pillar freshness | 30 days | `audit_stale_pages` |
| Cluster freshness | 60 days | `audit_stale_pages` |
| Pruning grace period | 180 days | `get_pruning_candidates` |
| Alt text max | 125 chars | `audit_image_alt_advanced` |
| Filename max | 60 chars | `validate_image_filenames` |
| Min testimonials per combo | 2 | `audit_testimonial_coverage` |
| Max seed items per call | 200 | All `seed_*` tools |
| Max page creates per call | 100 | `generate_service_pages` |

---

## Typical pSEO Workflow

1. **Seed data:** `seed_services` → `seed_locations` → `seed_faqs` → `seed_testimonials`
2. **Generate pages:** `generate_service_pages` (creates all service×location combinations)
3. **Enrich content:** `enrich_service_pages` → AI writes unique intros → `update_service_page_content`
4. **Validate quality:** `validate_content_uniqueness`, `content_quality_report`, `audit_heading_structure`
5. **Audit SEO:** `audit_seo_completeness`, `validate_keyword_placement`, `audit_slugs`
6. **Build linking:** `build_internal_links`, `find_orphan_pages_advanced`
7. **Check local SEO:** `audit_nap_consistency`, `audit_testimonial_coverage`, `audit_image_alt_advanced`
8. **Pre-launch:** `run_prelaunch_checklist`, `list_collection_stats`
9. **Ongoing:** `audit_stale_pages`, `get_pruning_candidates`, `detect_keyword_cannibalization`

## Adding New Tools

1. Create a new file in `src/mcp/tools/` (e.g., `my-tools.ts`)
2. Export a named array following the tool contract pattern
3. Import and spread it in `src/mcp/tools/index.ts`
4. If new collections are needed, add them in `src/mcp/index.ts`
