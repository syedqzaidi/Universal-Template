# Website SEO Playbook — Documentation Index

> **Purpose**: This is the master reference for the Agency Web Stack's website SEO playbook. It catalogs every document, what it contains, how documents relate to each other, and where to find information for any given task. Feed this document to Claude Code or any LLM before starting website SEO work — it will know exactly where to look.
>
> **Folder**: `website-seo-playbook/` (formerly `programmatic-seo/`)
>
> **Last updated**: 2026-04-09
>
> **Total documents**: 16 | **Total lines**: ~33,500+
>
> **Note**: Line counts are snapshots from the date above. Run `wc -l *.md` to get current counts.

---

## How to Use This Index

- **Starting a new project?** Follow the [Reading Order](#recommended-reading-order)
- **Looking for specific information?** Use the [Task Router](#task-router--where-to-go-for-what)
- **Need to understand relationships?** See the [Document Dependency Map](#document-dependency-map)
- **Want a quick overview?** See the [Document Summary Table](#document-summary-table)

---

## Document Summary Table

| # | Document | Lines | Type | Primary Focus | Key Contents |
|---|----------|-------|------|---------------|-------------|
| 1 | [PROGRAMMATIC_SEO_BLUEPRINT.md](#1-programmatic_seo_blueprintmd) | 2,064 | Master Blueprint | Architecture, strategy, and implementation reference for the entire programmatic SEO system | 18 sections covering overview, architecture, CMS plugins, collections, blocks, routing, SEO implementation, content uniqueness, seed scripts, pillar pages, linking, analytics, white-labeling, automation, deployment, page types, launch checklist |
| 2 | [CLIENT_ONBOARDING_GUIDE.md](#2-client_onboarding_guidemd) | 1,651 | Process Guide | End-to-end client onboarding from discovery through 90-day post-launch monitoring | Discovery questionnaire (76 fields), 5 CSV templates, 4 industry configs, brand setup, CMS white-label, content requirements, SEO baseline, deployment, training, handoff checklist, monitoring, CLAUDE.md template |
| 3 | [CMS_COLLECTIONS_AND_BLOCKS.md](#3-cms_collections_and_blocksmd) | 1,457 | Technical Blueprint | Payload CMS plugin setup, collection definitions, and block system | 7 required plugins, 8 core collections (Services, Locations, ServicePages, BlogPosts, FAQs, Testimonials, TeamMembers, Media), 12 reusable blocks |
| 4 | [ROUTING_AND_SITEMAPS.md](#4-routing_and_sitemapsmd) | 525 | Technical Blueprint | Astro dynamic routing, sitemap generation, and Schema.org structured data | Payload API helper, 3 route patterns, sitemap XML generation, robots.txt, 7 Schema.org generators, SEO layout component |
| 5 | [SEED_SCRIPTS_AND_AUTOMATION.md](#5-seed_scripts_and_automationmd) | 524 | Technical Blueprint | Bulk data import, content templates, AI enrichment, and Payload hooks | Content template system, AI enrichment pipeline, 3 seed scripts, 4 Payload hooks (slug, SEO, CRM sync, email), CSV format examples |
| 6 | [LOCAL_SEO_AND_GBP.md](#6-local_seo_and_gbpmd) | 1,825 | Strategy + Implementation | Google Business Profile, NAP consistency, citations, reviews, LocalBusiness schema | GBP optimization (2026), multi-location management, citation building (Tier 1/2/3), review management funnel, 6 Schema.org implementations |
| 7 | [CANONICAL_TAGS_STRATEGY.md](#7-canonical_tags_strategymd) | 1,013 | Strategy + Implementation | Canonical tag implementation at scale for 100k+ pages | Self-referencing canonicals, near-duplicate handling, cross-domain canonicals, canonical vs noindex decision framework, Astro SEO component, build-time validation, pagination, hreflang interaction, GSC monitoring |
| 8 | [URL_STRUCTURE_RULES.md](#8-url_structure_rulesmd) | 1,140 | Technical Reference | URL structure rules, slugification, location patterns, redirects, multilingual URLs | Character rules, URL length limits, stop words, depth rules, trailing slash policy, slugification algorithm, location URL format, page type URL map, 301 redirect architecture, multilingual patterns, Payload CMS auto-slug hooks |
| 9 | [CONTENT_FRESHNESS_STRATEGY.md](#9-content_freshness_strategymd) | 2,125 | Strategy + Implementation | Preventing 100k+ pages from going stale with automated refresh | QDF (Query Deserves Freshness), freshness signals (7 types), dynamic data injection, testimonial rotation, seasonal content calendar, blog cadence, content pruning triggers, IndexNow/GSC re-crawl, Payload hooks, monitoring dashboard |
| 10 | [CONVERSION_OPTIMIZATION.md](#10-conversion_optimizationmd) | 2,440 | Technical Blueprint | High-converting page anatomy, CTAs, forms, tracking, A/B testing | Page structure diagram, 5-position CTA framework, click-to-call implementation, lead capture forms, trust signals, urgency triggers, mobile optimization, PostHog A/B testing, conversion event taxonomy, lead attribution models |
| 11 | [IMAGE_SEO_STRATEGY.md](#11-image_seo_strategymd) | 2,096 | Technical Reference | Image optimization for 100k+ pages — naming, formats, alt text, sitemaps, responsive | SEO file naming conventions, AVIF/WebP/JPEG strategy, context-specific sizing, alt text templates + validation, lazy loading strategy, image sitemaps (50k limit), responsive srcset/sizes, compression targets, OG image generation |
| 12 | [PAGE_EXPERIENCE_SIGNALS.md](#12-page_experience_signalsmd) | 3,431 | Technical Blueprint | Core Web Vitals, HTTPS, mobile-first indexing, accessibility, performance | LCP/INP/CLS optimization for Astro + Next.js, HTTPS + security headers, mobile-first design, interstitial policy, font loading, third-party script management, Lighthouse CI, real user monitoring, performance budgets, accessibility |
| 13 | [404_ERROR_PAGE_STRATEGY.md](#13-404_error_page_strategymd) | 2,778 | Technical Blueprint | Custom error pages, soft 404 prevention, URL change management, broken link detection | 404 page design + intent parsing, soft 404 detection scripts, 404 vs 410 decision framework, service/location removal workflows, URL change tracking (previousSlugs), broken link scanner, redirect chain prevention, error monitoring |
| 14 | [CONTENT_PRUNING_STRATEGY.md](#14-content_pruning_strategymd) | 3,094 | Strategy + Implementation | Identifying and removing underperforming pages at scale | Pruning decision framework (Keep/Refresh/Consolidate/Noindex/Remove), automated analysis pipeline, content consolidation, quality scoring system, Payload CMS implementation, bulk operations, recovery from over-pruning, pruning cadence |
| 15 | [COMPETITOR_KEYWORD_RESEARCH.md](#15-competitor_keyword_researchmd) | 2,538 | Process Guide | Competitive analysis and keyword research workflows for service-area businesses | 3 competitor categories, 7-dimension analysis framework, keyword expansion process, search intent classification, keyword-to-page mapping, prioritization matrix, content gap analysis, SERP analysis, tool comparison, 7-phase onboarding workflow, seed lists for 4 verticals |
| 16 | [GSC_SETUP_AND_MONITORING.md](#16-gsc_setup_and_monitoringmd) | 4,826 | Technical Reference | Google Search Console setup, API integration, and monitoring at scale | Property setup automation, sitemap strategy for 100k+, crawl budget management, index coverage monitoring, URL inspection API, performance tracking, BigQuery integration, CWV monitoring via CrUX, automated alerting pipeline, multi-site agency management, IndexNow, Search Analytics API |

---

## Document Dependency Map

### Visual Overview

```
                    ┌─────────────────────────────────────┐
                    │   PROGRAMMATIC_SEO_BLUEPRINT.md     │
                    │   (Master Blueprint — Start Here)    │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌──────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐
│ CMS_COLLECTIONS  │  │ ROUTING_AND        │  │ SEED_SCRIPTS_AND         │
│ _AND_BLOCKS      │  │ _SITEMAPS          │  │ _AUTOMATION              │
│ (Data Models)    │  │ (Routes + Schema)  │  │ (Import + Hooks)         │
└────────┬─────────┘  └────────┬───────────┘  └────────────┬─────────────┘
         │                     │                           │
         └─────────────────────┼───────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  CORE IMPLEMENTATION │
                    │  (Build the site)    │
                    └──────────┬──────────┘
                               │
    ┌──────────┬───────────┬───┴───┬───────────┬──────────┐
    ▼          ▼           ▼       ▼           ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│URL     │ │CANON-  │ │IMAGE   │ │PAGE    │ │CONVER- │ │404     │
│STRUCT  │ │ICAL    │ │SEO     │ │EXPERI- │ │SION    │ │ERROR   │
│RULES   │ │TAGS    │ │STRAT   │ │ENCE   │ │OPTIM   │ │PAGE    │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │          │           │       │           │          │
    └──────────┴───────────┴───┬───┴───────────┴──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  SEO OPTIMIZATION   │
                    │  (Optimize the site) │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ LOCAL_SEO        │ │ CONTENT          │ │ CONTENT          │
│ _AND_GBP         │ │ _FRESHNESS       │ │ _PRUNING         │
│ (Local SEO)      │ │ (Keep Fresh)     │ │ (Remove Weak)    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ COMPETITOR       │ │ GSC_SETUP_AND    │ │ CLIENT           │
│ _KEYWORD         │ │ _MONITORING      │ │ _ONBOARDING      │
│ _RESEARCH        │ │ (Monitor)        │ │ _GUIDE           │
│ (Research)       │ │                  │ │ (Deliver)        │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Dependency Details

| Document | Depends On | Depended On By |
|----------|-----------|----------------|
| PROGRAMMATIC_SEO_BLUEPRINT | *(none — root document)* | All other documents |
| CLIENT_ONBOARDING_GUIDE | Blueprint (sections 4, 9, 10, 13, 17) | *(end of chain — delivery)* |
| CMS_COLLECTIONS_AND_BLOCKS | Blueprint (sections 3-5) | Routing, Seeds, 404 Error, Content Pruning, GSC |
| ROUTING_AND_SITEMAPS | Blueprint (sections 6-7), CMS Collections | GSC Setup, Content Freshness, Canonical Tags |
| SEED_SCRIPTS_AND_AUTOMATION | Blueprint (sections 8-9), CMS Collections | Client Onboarding |
| LOCAL_SEO_AND_GBP | Blueprint | Competitor Keyword Research |
| CANONICAL_TAGS_STRATEGY | Blueprint. Related: URL Structure Rules | 404 Error Page, Content Pruning |
| URL_STRUCTURE_RULES | Blueprint | Canonical Tags, 404 Error Page, Competitor Keyword Research |
| CONTENT_FRESHNESS_STRATEGY | Blueprint, CMS Collections, Routing | Content Pruning, GSC Monitoring |
| CONVERSION_OPTIMIZATION | Blueprint | *(standalone — conversion focus)* |
| IMAGE_SEO_STRATEGY | Blueprint | Page Experience Signals |
| PAGE_EXPERIENCE_SIGNALS | Blueprint, Image SEO | GSC Monitoring |
| 404_ERROR_PAGE_STRATEGY | Blueprint, URL Structure, Canonical Tags | Content Pruning |
| CONTENT_PRUNING_STRATEGY | Blueprint. Related: GSC Setup, Content Freshness, Canonical Tags | *(end of chain — optimization)* |
| COMPETITOR_KEYWORD_RESEARCH | Blueprint. Related: URL Structure, Local SEO | *(pre-build — research phase)* |
| GSC_SETUP_AND_MONITORING | Blueprint, Routing, CMS Collections, Page Experience | Content Pruning, Content Freshness |

---

## Recommended Reading Order

### For a New Project (Start to Finish)

1. **PROGRAMMATIC_SEO_BLUEPRINT.md** — Understand the architecture and strategy
2. **COMPETITOR_KEYWORD_RESEARCH.md** — Research keywords before building anything
3. **CMS_COLLECTIONS_AND_BLOCKS.md** — Set up Payload CMS data models
4. **URL_STRUCTURE_RULES.md** — Define URL patterns before creating routes
5. **ROUTING_AND_SITEMAPS.md** — Implement dynamic routes and sitemaps
6. **SEED_SCRIPTS_AND_AUTOMATION.md** — Import data and set up automation hooks
7. **IMAGE_SEO_STRATEGY.md** — Configure image optimization pipeline
8. **CANONICAL_TAGS_STRATEGY.md** — Implement canonical tags at scale
9. **PAGE_EXPERIENCE_SIGNALS.md** — Optimize Core Web Vitals and performance
10. **CONVERSION_OPTIMIZATION.md** — Build high-converting page templates
11. **LOCAL_SEO_AND_GBP.md** — Set up Google Business Profile and local SEO
12. **404_ERROR_PAGE_STRATEGY.md** — Implement error handling and redirects
13. **GSC_SETUP_AND_MONITORING.md** — Set up monitoring infrastructure
14. **CONTENT_FRESHNESS_STRATEGY.md** — Configure automated content refresh
15. **CONTENT_PRUNING_STRATEGY.md** — Set up pruning analysis pipeline
16. **CLIENT_ONBOARDING_GUIDE.md** — Follow the onboarding process for delivery

### For Client Onboarding Only

1. **CLIENT_ONBOARDING_GUIDE.md** (sections 18.1-18.3) — Discovery and intake
2. **COMPETITOR_KEYWORD_RESEARCH.md** — Research phase
3. **CLIENT_ONBOARDING_GUIDE.md** (sections 18.4-18.8) — Setup and deployment
4. **CLIENT_ONBOARDING_GUIDE.md** (sections 18.9-18.13) — Training, handoff, monitoring

### For Ongoing Maintenance

1. **CONTENT_FRESHNESS_STRATEGY.md** — Keep content updated
2. **CONTENT_PRUNING_STRATEGY.md** — Remove underperforming pages
3. **GSC_SETUP_AND_MONITORING.md** — Monitor indexing and performance
4. **404_ERROR_PAGE_STRATEGY.md** — Handle broken links and errors

### For Debugging / Fixing an Existing Site

1. **GSC_SETUP_AND_MONITORING.md** — Diagnose indexing, crawl, and performance issues
2. **PAGE_EXPERIENCE_SIGNALS.md** — Debug Core Web Vitals failures
3. **404_ERROR_PAGE_STRATEGY.md** — Find and fix broken links, soft 404s, redirect chains
4. **CONTENT_PRUNING_STRATEGY.md** — Identify underperforming pages dragging down quality
5. **CONTENT_FRESHNESS_STRATEGY.md** — Refresh stale content, trigger re-crawls
6. **CANONICAL_TAGS_STRATEGY.md** — Fix duplicate content and crawl budget waste

---

## Task Router — Where to Go for What

### Architecture & Planning

| Task / Question | Go To |
|----------------|-------|
| "What is programmatic SEO and when should I use it?" | [Blueprint §1](#1-programmatic_seo_blueprintmd) |
| "Should I use Astro or Next.js?" | [Blueprint §1](#1-programmatic_seo_blueprintmd) — "When to Use Astro vs Next.js" |
| "What's the overall system architecture?" | [Blueprint §2](#1-programmatic_seo_blueprintmd) |
| "What data models do I need?" | [CMS Collections](#3-cms_collections_and_blocksmd) |
| "How do I structure URLs for 100k+ pages?" | [URL Structure Rules](#8-url_structure_rulesmd) |
| "What keywords should I target?" | [Competitor Keyword Research](#15-competitor_keyword_researchmd) |
| "Who are my competitors and what are they doing?" | [Competitor Keyword Research §2-3](#15-competitor_keyword_researchmd) |

### CMS & Data Setup

| Task / Question | Go To |
|----------------|-------|
| "What Payload CMS plugins do I need?" | [CMS Collections §1](#3-cms_collections_and_blocksmd) |
| "How do I define the Services collection?" | [CMS Collections §2](#3-cms_collections_and_blocksmd) |
| "How do I create reusable page blocks?" | [CMS Collections §3](#3-cms_collections_and_blocksmd) |
| "How do I bulk import data from CSV?" | [Seed Scripts](#5-seed_scripts_and_automationmd) |
| "How do I auto-generate slugs and SEO fields?" | [Seed Scripts §4](#5-seed_scripts_and_automationmd) — Payload Hooks |
| "How do I set up CRM sync?" | [Seed Scripts §4](#5-seed_scripts_and_automationmd) — sync-to-crm hook |
| "How do I adapt the CMS for a law firm vs plumber?" | [Client Onboarding §18.3](#2-client_onboarding_guidemd) |
| "How do I set up Supabase for a client?" | [Client Onboarding §18.8](#2-client_onboarding_guidemd) |
| "How do I generate content with AI?" | [Seed Scripts §2](#5-seed_scripts_and_automationmd) |
| "How do I set up email notifications on form submit?" | [Seed Scripts §4](#5-seed_scripts_and_automationmd) — sendNotification hook |

### Routing & Pages

| Task / Question | Go To |
|----------------|-------|
| "How do I create dynamic routes in Astro?" | [Routing & Sitemaps §1](#4-routing_and_sitemapsmd) |
| "How do I generate sitemaps for 100k+ pages?" | [Routing & Sitemaps §1](#4-routing_and_sitemapsmd) + [GSC §2](#16-gsc_setup_and_monitoringmd) |
| "What Schema.org markup do I need?" | [Routing & Sitemaps §2](#4-routing_and_sitemapsmd) |
| "How should my 404 page work?" | [404 Error Page Strategy](#13-404_error_page_strategymd) |
| "How do I handle URL changes and redirects?" | [404 Error Page §6](#13-404_error_page_strategymd) + [URL Structure §10](#8-url_structure_rulesmd) |
| "How do I handle pagination?" | [Canonical Tags §9](#7-canonical_tags_strategymd) |
| "How do I handle multilingual/multi-language sites?" | [URL Structure §11](#8-url_structure_rulesmd) + [Canonical Tags §11](#7-canonical_tags_strategymd) |

### SEO Implementation

| Task / Question | Go To |
|----------------|-------|
| "How do I implement canonical tags at scale?" | [Canonical Tags Strategy](#7-canonical_tags_strategymd) |
| "Should I use canonical or noindex?" | [Canonical Tags §5](#7-canonical_tags_strategymd) |
| "How do I set up Google Business Profile?" | [Local SEO & GBP](#6-local_seo_and_gbpmd) |
| "How do I manage NAP consistency?" | [Local SEO & GBP §2](#6-local_seo_and_gbpmd) |
| "How do I manage reviews at scale?" | [Local SEO & GBP §9](#6-local_seo_and_gbpmd) |
| "How do I optimize images for SEO?" | [Image SEO Strategy](#11-image_seo_strategymd) |
| "What alt text pattern should I use?" | [Image SEO §4](#11-image_seo_strategymd) |
| "How do I generate image sitemaps?" | [Image SEO §7](#11-image_seo_strategymd) |
| "How do I make content unique across 100k pages?" | [Blueprint §8](#1-programmatic_seo_blueprintmd) |
| "How do I build pillar pages and topic clusters?" | [Blueprint §10](#1-programmatic_seo_blueprintmd) |

### Performance & Conversion

| Task / Question | Go To |
|----------------|-------|
| "How do I optimize Core Web Vitals?" | [Page Experience Signals](#12-page_experience_signalsmd) |
| "How do I fix LCP / INP / CLS issues?" | [Page Experience §2](#12-page_experience_signalsmd) |
| "How do I set up Lighthouse CI?" | [Page Experience §10](#12-page_experience_signalsmd) |
| "How do I design high-converting pages?" | [Conversion Optimization](#10-conversion_optimizationmd) |
| "Where should I place CTAs?" | [Conversion §2](#10-conversion_optimizationmd) |
| "How do I implement click-to-call?" | [Conversion §3](#10-conversion_optimizationmd) |
| "How do I A/B test with PostHog?" | [Conversion §9](#10-conversion_optimizationmd) |
| "How do I track conversions?" | [Conversion §10-11](#10-conversion_optimizationmd) |
| "How do I configure security headers (HSTS, CSP)?" | [Page Experience §3](#12-page_experience_signalsmd) |

### Content Management

| Task / Question | Go To |
|----------------|-------|
| "How do I keep 100k+ pages fresh?" | [Content Freshness Strategy](#9-content_freshness_strategymd) |
| "What's the right blog publishing cadence?" | [Content Freshness §8](#9-content_freshness_strategymd) |
| "How do I identify pages to prune?" | [Content Pruning Strategy](#14-content_pruning_strategymd) |
| "Should I delete, noindex, or redirect a page?" | [Content Pruning §7](#14-content_pruning_strategymd) + [404 Error §3](#13-404_error_page_strategymd) |
| "How do I recover from over-pruning?" | [Content Pruning §14](#14-content_pruning_strategymd) |
| "How do I detect and prevent soft 404s?" | [404 Error Page §2](#13-404_error_page_strategymd) |
| "What's the content template system?" | [Seed Scripts §1](#5-seed_scripts_and_automationmd) |
| "How do I handle seasonal content?" | [Content Freshness §7](#9-content_freshness_strategymd) |

### Monitoring & Analytics

| Task / Question | Go To |
|----------------|-------|
| "How do I set up Google Search Console?" | [GSC Setup §1](#16-gsc_setup_and_monitoringmd) |
| "How do I monitor index coverage?" | [GSC Setup §4](#16-gsc_setup_and_monitoringmd) |
| "How do I manage crawl budget?" | [GSC Setup §3](#16-gsc_setup_and_monitoringmd) |
| "How do I set up BigQuery for SEO data?" | [GSC Setup §8](#16-gsc_setup_and_monitoringmd) |
| "How do I automate GSC monitoring?" | [GSC Setup §11](#16-gsc_setup_and_monitoringmd) |
| "How do I manage 50+ client sites in GSC?" | [GSC Setup §12](#16-gsc_setup_and_monitoringmd) |
| "How do I use IndexNow?" | [GSC Setup §13](#16-gsc_setup_and_monitoringmd) + [Content Freshness §10](#9-content_freshness_strategymd) |
| "How do I deploy to Vercel?" | [Client Onboarding §18.8](#2-client_onboarding_guidemd) |

### Client Delivery

| Task / Question | Go To |
|----------------|-------|
| "How do I onboard a new client?" | [Client Onboarding Guide](#2-client_onboarding_guidemd) |
| "What information do I need from the client?" | [Client Onboarding §18.1](#2-client_onboarding_guidemd) |
| "What CSV templates do clients fill out?" | [Client Onboarding §18.2](#2-client_onboarding_guidemd) |
| "How do I white-label the CMS?" | [Client Onboarding §18.5](#2-client_onboarding_guidemd) + [Blueprint §13](#1-programmatic_seo_blueprintmd) |
| "What should the client's training cover?" | [Client Onboarding §18.9](#2-client_onboarding_guidemd) |
| "What's the pre-launch handoff checklist?" | [Client Onboarding §18.10](#2-client_onboarding_guidemd) + [Blueprint §17](#1-programmatic_seo_blueprintmd) |
| "How do I monitor a site post-launch?" | [Client Onboarding §18.11](#2-client_onboarding_guidemd) |

---

## Detailed Document Profiles

### 1. PROGRAMMATIC_SEO_BLUEPRINT.md

**Path**: `./PROGRAMMATIC_SEO_BLUEPRINT.md`
**Lines**: 2,064 | **Type**: Master Blueprint | **Code blocks**: 25+ | **Tables**: 15

**What this document is**: The foundational reference for the entire programmatic SEO system. Covers architecture decisions, data models, SEO strategy, content uniqueness rules, linking architecture, and the pre-launch checklist. This is the document Claude Code should read first when starting any programmatic SEO work.

**What this document is NOT**: Not a step-by-step implementation guide — the detailed implementations have been extracted into companion documents (CMS Collections, Routing, Seed Scripts, etc.).

**Sections**:
1. Overview and Strategy — What programmatic SEO is, Astro vs Next.js decision matrix
2. Architecture — Three-layer architecture, project structure, data flow
3. Payload CMS Plugins *(see CMS_COLLECTIONS_AND_BLOCKS.md for details)*
4. Collection Definitions *(see CMS_COLLECTIONS_AND_BLOCKS.md for details)*
5. Block Definitions *(see CMS_COLLECTIONS_AND_BLOCKS.md for details)*
6. Routing *(see ROUTING_AND_SITEMAPS.md for details)*
7. SEO Implementation — Semantic HTML, heading hierarchy, keyword strategy, Schema.org
8. Content Uniqueness — 50-60% differentiation rule, content quality scoring
9. Seed Scripts *(see SEED_SCRIPTS_AND_AUTOMATION.md for details)*
10. Pillar Pages & Linking Architecture — Topic clusters, internal linking rules, breadcrumbs, backlinks
11. Performance and Build Optimization
12. Analytics and Tracking
13. CMS White-Labeling
14. Automation Workflows
15. Deployment Considerations
16. Common Programmatic SEO Page Types
17. Pre-Launch Checklist — ~70 items across 7 categories
18. Client Onboarding *(see CLIENT_ONBOARDING_GUIDE.md)*

**Key cross-references**: Links to CMS_COLLECTIONS_AND_BLOCKS.md (§3-5), ROUTING_AND_SITEMAPS.md (§6-7), SEED_SCRIPTS_AND_AUTOMATION.md (§8-9), CLIENT_ONBOARDING_GUIDE.md (§18)

---

### 2. CLIENT_ONBOARDING_GUIDE.md

**Path**: `./CLIENT_ONBOARDING_GUIDE.md`
**Lines**: 1,651 | **Type**: Process Guide | **Checklists**: 10+ | **CSV templates**: 5

**What this document is**: The complete, repeatable process for onboarding a new client — from initial discovery call through 90 days of post-launch monitoring. Contains everything needed to collect client info, configure the CMS, deploy, train the client, and hand off.

**What this document is NOT**: Not a technical implementation guide — references the Blueprint for architecture and code details.

**Sections**:
- 18.1: Client Discovery Questionnaire — 76 fields across 8 categories (business, services, competitors, brand, contact, team, content, technical)
- 18.2: Data Collection Templates — 5 CSV templates (services, locations, FAQs, testimonials, team members) with column definitions and sample data
- 18.3: Industry-Specific Configuration — 4 vertical adaptations (Home Services, Legal, Healthcare, Real Estate) with TypeScript code
- 18.4: Brand Configuration Checklist — File structure, site.ts template, CSS custom properties, 13-item checklist
- 18.5: CMS White-Label Setup — 6 steps + 14-item checklist (admin branding, welcome dashboard, access control, role-based permissions)
- 18.6: Initial Content Requirements — Minimum thresholds table, quality standards, 5-week timeline
- 18.7: SEO Baseline Setup — GSC, GBP, analytics, sitemap, robots.txt, 17-item checklist
- 18.8: Environment/Deployment Setup — 8-step infrastructure setup, env vars inventory, 20-item checklist
- 18.9: Client Training Plan — What clients CAN/should NOT do, 60-minute training agenda
- 18.10: Handoff Checklist — 46 items across 5 categories (technical, content, SEO, performance, analytics) + handoff communication
- 18.11: Post-Launch Monitoring — 3 phases (30/60/90 days), reporting templates, monitoring tools checklist
- 18.12: Template for Client-Specific CLAUDE.md — Complete project documentation template
- 18.13: Complete Workflow Summary — 8-phase timeline (15-22 business days), 63 checkbox items

**Key cross-references**: Blueprint §4 (collections), §9 (seed scripts), §10 (linking), §13 (white-labeling), §17 (launch checklist)

---

### 3. CMS_COLLECTIONS_AND_BLOCKS.md

**Path**: `./CMS_COLLECTIONS_AND_BLOCKS.md`
**Lines**: 1,457 | **Type**: Technical Blueprint | **Code blocks**: 25+ TypeScript

**What this document is**: The complete Payload CMS setup guide — every plugin to install, every collection to create, every block to define. Contains copy-paste TypeScript configurations.

**What this document is NOT**: Not for routing, content generation, SEO strategy, or client onboarding — focuses exclusively on Payload CMS plugin configuration, collection schemas, and block definitions.

**Sections**:
- §1: Payload CMS Plugins — 7 required plugins (SEO, Form Builder, Redirects, Nested Docs, Search, Import/Export, S3 Storage) with installation commands and configuration
- §2: Collection Definitions — 8 core collections with complete field definitions:
  - Services (with parentService hierarchy, SEO fields, rich text)
  - Locations (with geo data, zip codes, nearby locations)
  - ServicePages (cross-product: service x location combinations)
  - BlogPosts (with categories, author, publish scheduling)
  - FAQs (linked to services and locations)
  - Testimonials (with source, rating, featured flag)
  - TeamMembers (with specialties, certifications)
  - Media (enhanced with alt text, focal point, sizes)
- §3: Block Definitions — 12 reusable blocks (Hero, ServiceDetail, FAQ, Testimonials, CTA, LocationMap, Content, Stats, Gallery, Pricing, Team, RelatedLinks)

**Key cross-references**: Referenced by Routing, Seed Scripts, 404 Error, Content Pruning, GSC. References Seed Scripts for hook implementations.

---

### 4. ROUTING_AND_SITEMAPS.md

**Path**: `./ROUTING_AND_SITEMAPS.md`
**Lines**: 525 | **Type**: Technical Blueprint | **Code blocks**: 8 major examples

**What this document is**: Implementation guide for Astro dynamic routes that consume Payload CMS data, plus sitemap/robots.txt generation and Schema.org structured data.

**What this document is NOT**: Not for CMS data model setup or content strategy — focuses on Astro dynamic route implementation, sitemap generation, and Schema.org structured data markup.

**Sections**:
- §1: Astro Dynamic Routes — Payload API helper (6 query functions), 3 route patterns (/services/[slug], /locations/[city], /[service]/[city])
- §1.2: Sitemap Generation — XML sitemap with priority weighting, robots.txt template
- §2: Schema.org Structured Data — 7 schema generators (Service, LocalBusiness, Organization, WebSite, FAQPage, Review, Breadcrumb), SEO layout component with all meta tags

**Key cross-references**: Depends on CMS Collections. Referenced by GSC Setup (sitemaps), Content Freshness (sitemap lastmod).

---

### 5. SEED_SCRIPTS_AND_AUTOMATION.md

**Path**: `./SEED_SCRIPTS_AND_AUTOMATION.md`
**Lines**: 524 | **Type**: Technical Blueprint | **Code blocks**: 11 major examples

**What this document is**: Scripts for bulk data import and Payload CMS lifecycle hooks for automation. Contains the content template system, AI enrichment pipeline, and integration hooks.

**What this document is NOT**: Not for CMS schema definitions or route setup — focuses on data import scripts, content template systems, AI enrichment pipelines, and Payload lifecycle hooks.

**Sections**:
- §1: Content Template System — Variable interpolation, deterministic template selection (hash-based for build consistency)
- §2: AI Content Enrichment — Pipeline skeleton with prompt engineering example
- §3: Seed Scripts — 3 scripts (services, locations, cross-product service pages) with batch processing and rate limiting
- §4: Automation Workflows — 4 Payload hooks (autoGenerateSlug, autoGenerateSEO, syncToCRM via Twenty GraphQL, sendNotification via Resend)
- Appendix: CSV format examples (services.csv, locations.csv)

**Key cross-references**: Depends on CMS Collections. Referenced by Client Onboarding (§18.2 CSV templates feed these scripts).

---

### 6. LOCAL_SEO_AND_GBP.md

**Path**: `./LOCAL_SEO_AND_GBP.md`
**Lines**: 1,825 | **Type**: Strategy + Implementation | **Code blocks**: 50 | **Tables**: 12+

**What this document is**: Everything about local SEO for service-area businesses — Google Business Profile optimization, NAP consistency, citations, reviews, and LocalBusiness schema markup.

**What this document is NOT**: Not for technical site architecture, URL structure, or content generation — focuses specifically on local SEO signals, GBP, and citations.

**Key topics**: GBP optimization (2026), NAP sync architecture, multi-location management, citation building (Tier 1/2/3 directories), Local Pack ranking factors, SAB vs storefront setup, GBP categories/attributes/posts, review management funnel, Schema.org implementations (6 types), implementation summary with Payload CMS collections and Supabase schemas

**Key cross-references**: References Blueprint. Related to Canonical Tags (schema), URL Structure (location URLs), GSC Setup (local monitoring).

---

### 7. CANONICAL_TAGS_STRATEGY.md

**Path**: `./CANONICAL_TAGS_STRATEGY.md`
**Lines**: 1,013 | **Type**: Strategy + Implementation | **Code blocks**: 42

**What this document is**: How to implement canonical tags correctly at scale for 100k+ page programmatic sites — preventing crawl budget waste, duplicate content issues, and index bloat.

**What this document is NOT**: Not for content strategy or CMS configuration — focuses only on canonical tag implementation and URL deduplication at scale.

**Key topics**: Self-referencing canonicals, near-duplicate handling (40-60% uniqueness target), cross-domain canonicals, canonical vs noindex decision framework, common mistakes, URL normalization, Astro SEO component, build-time validation script, pagination canonicals, hreflang interaction, GSC monitoring automation

**Key cross-references**: References Blueprint. Depends on URL Structure Rules. Referenced by 404 Error Page, Content Pruning.

---

### 8. URL_STRUCTURE_RULES.md

**Path**: `./URL_STRUCTURE_RULES.md`
**Lines**: 1,140 | **Type**: Technical Reference | **Code blocks**: 38 | **Tables**: 8+

**What this document is**: The definitive guide to URL structure for programmatic SEO — rules, algorithms, and Payload CMS implementation for generating SEO-optimized URLs at scale.

**What this document is NOT**: Not for SEO content strategy or page design — focuses on URL formatting, slugification, and redirect architecture.

**Key topics**: Character rules (lowercase, hyphens), URL length limits (75 char ideal), stop word removal, URL depth (max 3 segments), trailing slash policy, slugification algorithm (with test cases), location URL format ({city}-{state}), page type URL map, 301 redirect architecture, multilingual patterns (subdirectory), Payload CMS auto-slug hooks, URL Builder utility

**Key cross-references**: References Blueprint. Referenced by Canonical Tags, 404 Error Page, Competitor Keyword Research.

---

### 9. CONTENT_FRESHNESS_STRATEGY.md

**Path**: `./CONTENT_FRESHNESS_STRATEGY.md`
**Lines**: 2,125 | **Type**: Strategy + Implementation | **Code blocks**: 50 | **Tables**: 6+

**What this document is**: How to prevent 100k+ pages from going stale — automated refresh strategies, seasonal content, blog cadence, and monitoring.

**What this document is NOT**: Not for initial content creation or keyword research — focuses on keeping existing content fresh and triggering re-crawls.

**Key topics**: QDF (Query Deserves Freshness), 7 freshness signals Google uses, stale content death spiral, dynamic data injection (reviews, weather, pricing), testimonial rotation, "Last Verified" timestamps, seasonal content calendar, blog cadence (2-4/week), content pruning triggers, IndexNow/GSC re-crawl, Payload CMS hooks for change tracking, Supabase freshness scoring, monitoring and alerting

**Key cross-references**: References Blueprint, CMS Collections, Routing. Referenced by Content Pruning, GSC Monitoring.

---

### 10. CONVERSION_OPTIMIZATION.md

**Path**: `./CONVERSION_OPTIMIZATION.md`
**Lines**: 2,440 | **Type**: Technical Blueprint | **Code blocks**: 12+ | **Tables**: 11+

**What this document is**: How to build pages that convert visitors into leads — page anatomy, CTAs, forms, tracking, and A/B testing with PostHog.

**What this document is NOT**: Not for SEO rankings or technical site health — focuses purely on converting visitors into leads via page design, CTAs, forms, and tracking.

**Key topics**: High-converting page structure (ASCII diagram), 5-position CTA framework, click-to-call implementation (DNI for paid ads), lead capture forms (minimal fields, validation, honeypot), Payload CMS Leads collection, trust signals (ratings, licenses, guarantees), urgency/scarcity triggers, social proof placement, mobile optimization (sticky CTA bar), PostHog A/B testing setup, conversion event taxonomy, lead attribution (first-touch vs last-touch, UTM capture)

**Key cross-references**: References Blueprint. Related to Page Experience (speed affects conversion), Image SEO (hero images).

---

### 11. IMAGE_SEO_STRATEGY.md

**Path**: `./IMAGE_SEO_STRATEGY.md`
**Lines**: 2,096 | **Type**: Technical Reference | **Code blocks**: 8+ | **Tables**: 12+

**What this document is**: Image optimization playbook for 100k+ programmatic pages — naming conventions, format selection, sizing, alt text, lazy loading, sitemaps, and responsive images.

**What this document is NOT**: Not for image content strategy or photography — focuses on technical optimization, naming, formats, alt text, and sitemaps.

**Key topics**: SEO file naming (`{service}-{descriptor}-{location}.{ext}`), AVIF/WebP/JPEG priority, context-specific sizing (hero 1920x1080, cards 600x400, OG 1200x630), alt text templates + validation function, lazy loading strategy (hero=eager, below-fold=lazy), image sitemaps (50k URL limit, batch generation), responsive srcset/sizes for Astro and Next.js, compression targets, OG image generation, Google Image Search optimization

**Key cross-references**: References Blueprint. Related to Page Experience Signals (CWV impacts), Routing & Sitemaps (image sitemaps).

---

### 12. PAGE_EXPERIENCE_SIGNALS.md

**Path**: `./PAGE_EXPERIENCE_SIGNALS.md`
**Lines**: 3,431 | **Type**: Technical Blueprint | **Code blocks**: 20+ | **Tables**: 15+

**What this document is**: The largest document in the suite — deep technical guide to every Google Page Experience signal, with framework-specific optimizations for both Astro and Next.js.

**What this document is NOT**: Not for content relevance, backlinks, or topical authority — covers only technical health signals and performance optimization.

**Key topics**: Page Experience signals (2026), Core Web Vitals (LCP <=2.5s, INP <=200ms, CLS <=0.1) with Astro and Next.js optimization code, HTTPS + security headers (HSTS, CSP), mixed content detection, mobile-first indexing, content parity, interstitial policy, viewport/mobile usability (48px tap targets), font loading (`font-display: optional`, subsetting), third-party script management, Lighthouse CI integration, real user monitoring, performance budgets, accessibility as ranking factor

**Key cross-references**: References Blueprint. Related to Image SEO (image optimization impacts CWV), Conversion Optimization (speed affects conversion). Referenced by GSC Setup.

---

### 13. 404_ERROR_PAGE_STRATEGY.md

**Path**: `./404_ERROR_PAGE_STRATEGY.md`
**Lines**: 2,778 | **Type**: Technical Blueprint | **Code blocks**: 10+ | **Tables**: 12+

**What this document is**: How to handle errors gracefully at scale — custom 404 design, soft 404 prevention, URL change management, and broken link detection.

**What this document is NOT**: Not for server errors (5xx), incident response, or user experience design beyond error pages — focuses on HTTP 4xx handling and URL lifecycle management.

**Key topics**: Custom 404 design (intent parsing, fuzzy URL matching), soft 404 detection and prevention (build-time validation, minimum content thresholds, audit scripts), 404 vs 410 decision framework, service removal workflow (decision tree + Payload CMS implementation), location removal workflow, URL change management (previousSlugs tracking), broken link detection (pre-build + post-build scanning), redirect chain prevention, error monitoring and alerting

**Key cross-references**: References Blueprint, URL Structure Rules, Canonical Tags, Content Freshness. Related to Content Pruning (removal decisions).

---

### 14. CONTENT_PRUNING_STRATEGY.md

**Path**: `./CONTENT_PRUNING_STRATEGY.md`
**Lines**: 3,094 | **Type**: Strategy + Implementation | **Code blocks**: 84 | **Tables**: 61

**What this document is**: The most data-intensive document — comprehensive framework for identifying and removing underperforming pages, with automated analysis pipelines and recovery procedures.

**What this document is NOT**: Not for content creation or keyword research — focuses on identifying and removing underperforming pages. See Content Freshness for refresh strategies.

**Key topics**: Google's Helpful Content System, crawl budget waste, index bloat, pruning decision framework (Keep/Refresh/Consolidate/Noindex/Remove with ASCII decision tree), metrics (primary/secondary/authority/content quality), page type segmentation, data sources (GSC, PostHog, Payload, Ahrefs), automated pruning analysis pipeline (production TypeScript), content consolidation, noindex vs delete vs redirect matrix, pruning cadence (monthly/quarterly), grace period for new pages, impact measurement, content quality scoring algorithm, Payload CMS implementation, bulk operations, recovery from over-pruning

**Key cross-references**: References Blueprint. Depends on GSC Setup (data source), Content Freshness (refresh vs delete), Canonical Tags (consolidation). Related to 404 Error Page (removal workflows).

---

### 15. COMPETITOR_KEYWORD_RESEARCH.md

**Path**: `./COMPETITOR_KEYWORD_RESEARCH.md`
**Lines**: 2,538 | **Type**: Process Guide | **Tables**: 203 lines | **Seed lists**: 4 verticals

**What this document is**: The research-first methodology for programmatic SEO — competitor analysis, keyword research, and mapping keywords to pages. Should be completed BEFORE building the site.

**What this document is NOT**: Not for site implementation or content writing — this is a pre-build research document. See Blueprint for architecture and CMS Collections for implementation.

**Key topics**: Research-first philosophy (7 failure modes of skipping), 3 competitor categories (direct/indirect/content), 7-dimension analysis framework, keyword expansion process, service keyword research (with seed lists for plumbing, HVAC, electrical, roofing), location keyword patterns, keyword difficulty assessment, search intent classification (4 types), keyword-to-page mapping, prioritization matrix, content gap analysis, SERP analysis, tool comparison (free/paid/agency), Payload CMS keyword schema, 7-phase client onboarding research workflow (90-150 min)

**Key cross-references**: References Blueprint, URL Structure, Local SEO, Content Freshness, Canonical Tags, Conversion Optimization, Image SEO.

---

### 16. GSC_SETUP_AND_MONITORING.md

**Path**: `./GSC_SETUP_AND_MONITORING.md`
**Lines**: 4,826 | **Type**: Technical Reference | **Code blocks**: 96 | **Tables**: 77 lines

**What this document is**: The most comprehensive document in the suite — covers every aspect of Google Search Console for programmatic SEO at scale, including API integration, BigQuery, and multi-site agency management.

**What this document is NOT**: Not for on-page SEO or content strategy — focuses on Google Search Console API integration, monitoring infrastructure, and data analysis.

**Key topics**: Property setup (domain vs URL-prefix, verification methods), sitemap strategy for 100k+ pages (segmentation, index files, dynamic generation, programmatic submission), crawl budget management (optimization strategies), index coverage monitoring (status meanings, programmatic tracking, Payload CMS schema), crawl stats analysis, URL Inspection API (batch sampling strategy), performance report (segmented by page type), BigQuery integration (native export, SQL queries, automated pipeline), Core Web Vitals via CrUX API, indexing issue diagnosis (thin content, duplicates, redirect chains, structured data errors), automated monitoring pipeline (orchestrated with GitHub Actions), multi-site agency management (50+ sites, aggregated dashboard), IndexNow integration, Search Analytics API client, Supabase migration file, monitoring checklist (daily/weekly/monthly/quarterly)

**Key cross-references**: References Blueprint, Routing & Sitemaps, CMS Collections. Referenced by Content Pruning, Content Freshness.

---

## Content Type Quick Reference

### Where to Find Code Snippets

| Language | Documents |
|----------|-----------|
| **TypeScript** (Payload CMS) | CMS Collections, Seed Scripts, Content Pruning, GSC Setup, Content Freshness, Local SEO, 404 Error, Conversion Optimization |
| **TypeScript** (Astro) | Routing & Sitemaps, Canonical Tags, Page Experience, Image SEO |
| **TypeScript** (Next.js) | Page Experience, Conversion Optimization |
| **SQL** (Supabase/PostgreSQL) | GSC Setup, Local SEO, Content Freshness, Content Pruning |
| **CSS** | Client Onboarding (brand custom properties), Page Experience |
| **HTML** | Page Experience (meta tags, semantic markup), Image SEO (picture/figure elements) |
| **Bash** | CMS Collections (plugin install), Seed Scripts, Client Onboarding (deployment) |
| **CSV** | Client Onboarding (5 templates), Seed Scripts (2 examples), Competitor Research (keyword template) |
| **XML** | Routing & Sitemaps (sitemap), Image SEO (image sitemap) |
| **JSON-LD** | Routing & Sitemaps (Schema.org), Local SEO (LocalBusiness schema) |
| **YAML** | GSC Setup (GitHub Actions) |

### Where to Find Checklists

| Checklist Type | Document | Section |
|----------------|----------|---------|
| Pre-launch (70 items) | Blueprint | §17 |
| Brand configuration (13 items) | Client Onboarding | §18.4 |
| CMS white-label (14 items) | Client Onboarding | §18.5 |
| SEO baseline (17 items) | Client Onboarding | §18.7 |
| Deployment (20 items) | Client Onboarding | §18.8 |
| Handoff (46 items) | Client Onboarding | §18.10 |
| Post-launch monitoring tools (7 items) | Client Onboarding | §18.11 |
| Complete onboarding workflow (63 items) | Client Onboarding | §18.13 |
| Mobile optimization | Conversion Optimization | §8 |
| CWV optimization (10 items) | GSC Setup | §9 |
| GSC monitoring (daily/weekly/monthly) | GSC Setup | Appendix C |
| Pruning workflow | Content Pruning | Appendix A |

### Where to Find CSV/Data Templates

| Template | Document | Section |
|----------|----------|---------|
| services.csv | Client Onboarding | §18.2 |
| locations.csv | Client Onboarding | §18.2 |
| faqs.csv | Client Onboarding | §18.2 |
| testimonials.csv | Client Onboarding | §18.2 |
| team-members.csv | Client Onboarding | §18.2 |
| services.csv (format example) | Seed Scripts | Appendix |
| locations.csv (format example) | Seed Scripts | Appendix |
| Keyword research CSV | Competitor Research | Appendix B |
| Competitor analysis template | Competitor Research | Appendix C |

### Where to Find Decision Frameworks

| Decision | Document | Section |
|----------|----------|---------|
| Astro vs Next.js | Blueprint | §1 |
| Canonical vs noindex | Canonical Tags | §5 |
| 404 vs 410 | 404 Error Page | §3 |
| Keep/Refresh/Consolidate/Noindex/Remove | Content Pruning | §3 |
| Service removal workflow | 404 Error Page | §4 |
| Location removal workflow | 404 Error Page | §5 |
| Domain property vs URL-prefix | GSC Setup | §1 |
| Keyword prioritization tiers | Competitor Research | §10 |

---

## Document Statistics

| Metric | Value |
|--------|-------|
| **Total documents** | 16 |
| **Total lines** | ~33,500+ |
| **Total code blocks** | ~450+ |
| **Total tables** | ~150+ |
| **Total checklists** | ~20+ (with 300+ individual items) |
| **Largest document** | GSC_SETUP_AND_MONITORING.md (4,826 lines) |
| **Smallest document** | SEED_SCRIPTS_AND_AUTOMATION.md (524 lines) |
| **Most code-heavy** | GSC_SETUP_AND_MONITORING.md (96 code blocks) |
| **Most table-heavy** | COMPETITOR_KEYWORD_RESEARCH.md (203 table lines) |

---

*This index should be loaded into Claude Code's context before starting any website SEO task. It enables the LLM to quickly identify which document(s) to read for any given question or implementation task, without needing to scan all 33,500+ lines of documentation.*
