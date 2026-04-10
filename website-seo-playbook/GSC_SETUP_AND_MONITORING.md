# Google Search Console Setup & Monitoring — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers GSC property setup, crawl budget management, index coverage monitoring, performance tracking, automated alerting, and multi-site agency management for programmatic SEO sites with 100k+ pages.

---

## Table of Contents

1. [GSC Property Setup](#1-gsc-property-setup)
2. [Sitemap Submission Strategy for 100k+ Pages](#2-sitemap-submission-strategy-for-100k-pages)
3. [Crawl Budget Management](#3-crawl-budget-management)
4. [Index Coverage Monitoring](#4-index-coverage-monitoring)
5. [Crawl Stats Analysis](#5-crawl-stats-analysis)
6. [URL Inspection API](#6-url-inspection-api)
7. [Performance Report](#7-performance-report)
8. [Bulk Data Export and BigQuery Integration](#8-bulk-data-export-bigquery-integration)
9. [Core Web Vitals Monitoring via GSC](#9-core-web-vitals-monitoring-via-gsc)
10. [Identifying and Fixing Indexing Issues at Scale](#10-identifying-and-fixing-indexing-issues-at-scale)
11. [Automated GSC Monitoring Pipeline](#11-automated-gsc-monitoring-pipeline)
12. [Multi-Site GSC Management for Agencies](#12-multi-site-gsc-management-for-agencies)
13. [IndexNow Integration Alongside GSC](#13-indexnow-integration-alongside-gsc)
14. [Search Analytics API](#14-search-analytics-api)

---

## 1. GSC Property Setup

### Domain Property vs URL-Prefix Property

Google Search Console offers two property types. For programmatic SEO at scale, the choice matters significantly.

#### Domain Property

- **Scope**: Covers all subdomains, all protocols (http/https), all paths
- **Verification**: DNS TXT record only
- **Example**: `example.com` covers `www.example.com`, `blog.example.com`, `https://example.com/any-path`
- **Best for**: Single-brand sites where you control the DNS, and you want aggregated data across all subdomains

#### URL-Prefix Property

- **Scope**: Only the exact prefix — protocol-specific, subdomain-specific, path-specific
- **Verification**: HTML file, meta tag, Google Analytics, Google Tag Manager, or DNS
- **Example**: `https://www.example.com/` only covers URLs under that exact prefix
- **Best for**: Client sites where you may not have DNS access, multi-tenant setups, or when you want to isolate specific subdirectories

#### Agency Decision Matrix

| Scenario | Property Type | Reasoning |
|---|---|---|
| New client site, full DNS access | Domain property | Maximum data coverage, one property for everything |
| Client manages their own DNS, won't add TXT record | URL-prefix property | Use HTML tag or file verification |
| Subdomain-based city pages (`austin.example.com`) | Domain property | Captures all subdomains in one view |
| Path-based city pages (`example.com/austin/`) | Either works | Domain is simpler; URL-prefix if you want to isolate paths |
| White-label / multi-tenant platform | URL-prefix per tenant | Each client gets their own GSC property for their prefix |
| Staging/preview environment | URL-prefix property | Isolate staging from production data |

#### Verification Methods Ranked by Reliability

1. **DNS TXT record** (most reliable, required for domain properties) — Survives site rebuilds, CMS changes, theme switches. Add `google-site-verification=XXXXX` as a TXT record on the root domain.

2. **HTML file upload** — Place `googleXXXXXX.html` at the site root. For Astro, put it in `public/`. For Next.js, put it in `public/` or use a catch-all route. Survives deploys if in source control.

3. **Meta tag** — `<meta name="google-site-verification" content="XXXXX">` in the `<head>`. Fragile if templates change. For Astro, add to `BaseLayout.astro`. For Next.js, add to `app/layout.tsx` or `_document.tsx`.

4. **Google Analytics / GTM** — Relies on external scripts loading. Not recommended for programmatic pages that may not load GA on every page type.

#### Setup Automation Script

```typescript
// scripts/gsc/setup-property.ts
// Automates GSC property creation via the Search Console API
// Requires: googleapis npm package, service account with Search Console API access

import { google } from 'googleapis';

interface PropertySetupConfig {
  siteUrl: string;
  type: 'DOMAIN' | 'URL_PREFIX';
  serviceAccountKeyPath: string;
}

async function setupGSCProperty(config: PropertySetupConfig) {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // For domain properties, the siteUrl format is "sc-domain:example.com"
  // For URL-prefix properties, it's the full URL like "https://www.example.com/"
  const formattedSiteUrl = config.type === 'DOMAIN'
    ? `sc-domain:${config.siteUrl}`
    : config.siteUrl;

  try {
    // Add the site
    await searchconsole.sites.add({
      siteUrl: formattedSiteUrl,
    });
    console.log(`Property added: ${formattedSiteUrl}`);

    // Verify the site (DNS must already be configured for domain properties)
    const verifyResult = await searchconsole.sites.get({
      siteUrl: formattedSiteUrl,
    });
    console.log(`Verification status: ${verifyResult.data.permissionLevel}`);

    return verifyResult.data;
  } catch (error: any) {
    if (error.code === 409) {
      console.log('Property already exists, fetching current state...');
      const existing = await searchconsole.sites.get({
        siteUrl: formattedSiteUrl,
      });
      return existing.data;
    }
    throw error;
  }
}

// Batch setup for multiple client sites
async function setupMultipleProperties(
  sites: Array<{ url: string; type: 'DOMAIN' | 'URL_PREFIX' }>,
  serviceAccountKeyPath: string
) {
  const results = [];
  for (const site of sites) {
    try {
      const result = await setupGSCProperty({
        siteUrl: site.url,
        type: site.type,
        serviceAccountKeyPath,
      });
      results.push({ site: site.url, status: 'success', data: result });
    } catch (error: any) {
      results.push({ site: site.url, status: 'error', error: error.message });
    }
  }
  return results;
}

export { setupGSCProperty, setupMultipleProperties };
```

### Service Account Setup (Critical for All API Operations)

Every API operation in this document requires a Google Cloud service account. Here's the complete setup:

1. **Create a Google Cloud Project** (or use an existing one)
2. **Enable the Search Console API**: `APIs & Services > Library > Search Console API > Enable`
3. **Enable the Indexing API**: Same process for the Indexing API (used for IndexNow-like instant indexing)
4. **Create a Service Account**: `IAM & Admin > Service Accounts > Create Service Account`
5. **Download the JSON key file** and store it securely (never commit to git)
6. **Add the service account email as an owner** in each GSC property: `Settings > Users and permissions > Add user > [service-account-email]@[project].iam.gserviceaccount.com > Owner`

```bash
# .env configuration for the service account
GSC_SERVICE_ACCOUNT_KEY_PATH=./secrets/gsc-service-account.json
GSC_SERVICE_ACCOUNT_EMAIL=gsc-bot@your-project.iam.gserviceaccount.com
```

---

## 2. Sitemap Submission Strategy for 100k+ Pages

### Sitemap Protocol Limits

- **Maximum 50,000 URLs per sitemap file**
- **Maximum 50MB uncompressed per sitemap file** (gzip recommended)
- **A sitemap index file can reference up to 50,000 sitemap files** (theoretical max: 2.5 billion URLs)
- **For 100k pages**: You need at minimum 2 sitemap files + 1 sitemap index

### Sitemap Architecture for Service-Area Businesses

```
/sitemap-index.xml              ← Sitemap index (entry point)
├── /sitemap-services.xml       ← All service pages (~50-200 URLs)
├── /sitemap-locations.xml      ← All location pages (~500-5,000 URLs)
├── /sitemap-combo-1.xml        ← Service+Location combo pages 1-50,000
├── /sitemap-combo-2.xml        ← Service+Location combo pages 50,001-100,000
├── /sitemap-combo-3.xml        ← Service+Location combo pages 100,001+
├── /sitemap-blog.xml           ← Blog posts
└── /sitemap-static.xml         ← Homepage, about, contact, etc.
```

### Sitemap Index File Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.example.com/sitemap-services.xml.gz</loc>
    <lastmod>2026-04-09T00:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.example.com/sitemap-locations.xml.gz</loc>
    <lastmod>2026-04-09T00:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.example.com/sitemap-combo-1.xml.gz</loc>
    <lastmod>2026-04-09T00:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.example.com/sitemap-combo-2.xml.gz</loc>
    <lastmod>2026-04-09T00:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.example.com/sitemap-blog.xml.gz</loc>
    <lastmod>2026-04-09T00:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.example.com/sitemap-static.xml.gz</loc>
    <lastmod>2026-04-09T00:00:00+00:00</lastmod>
  </sitemap>
</sitemapindex>
```

### Dynamic Sitemap Generation with Astro

```typescript
// src/pages/sitemap-index.xml.ts
// Generates the sitemap index pointing to all chunked sitemaps

import type { APIRoute } from 'astro';
import { getServiceLocationCombos } from '../lib/data';

export const GET: APIRoute = async () => {
  const totalCombos = await getServiceLocationCombos({ countOnly: true });
  const CHUNK_SIZE = 45000; // Stay under 50k with buffer
  const comboChunks = Math.ceil(totalCombos / CHUNK_SIZE);
  const baseUrl = import.meta.env.SITE;
  const now = new Date().toISOString();

  const sitemaps = [
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-services.xml`,
    `${baseUrl}/sitemap-locations.xml`,
    ...Array.from({ length: comboChunks }, (_, i) =>
      `${baseUrl}/sitemap-combo-${i + 1}.xml`
    ),
    `${baseUrl}/sitemap-blog.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(loc => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
```

```typescript
// src/pages/sitemap-combo-[chunk].xml.ts
// Generates individual chunked sitemaps for service+location combo pages

import type { APIRoute, GetStaticPaths } from 'astro';
import { getServiceLocationCombos } from '../lib/data';

const CHUNK_SIZE = 45000;

export const getStaticPaths: GetStaticPaths = async () => {
  const total = await getServiceLocationCombos({ countOnly: true });
  const chunks = Math.ceil(total / CHUNK_SIZE);
  return Array.from({ length: chunks }, (_, i) => ({
    params: { chunk: String(i + 1) },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  const chunkIndex = parseInt(params.chunk!) - 1;
  const offset = chunkIndex * CHUNK_SIZE;
  const baseUrl = import.meta.env.SITE;

  const combos = await getServiceLocationCombos({
    offset,
    limit: CHUNK_SIZE,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${combos.map(combo => `  <url>
    <loc>${baseUrl}/${combo.stateSlug}/${combo.citySlug}/${combo.serviceSlug}/</loc>
    <lastmod>${combo.updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
```

### Programmatic Sitemap Submission via GSC API

```typescript
// scripts/gsc/submit-sitemaps.ts
// Submits all sitemaps to GSC and checks their status

import { google } from 'googleapis';

interface SitemapSubmissionConfig {
  siteUrl: string; // e.g., "sc-domain:example.com" or "https://www.example.com/"
  sitemapUrls: string[];
  serviceAccountKeyPath: string;
}

async function submitSitemaps(config: SitemapSubmissionConfig) {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });

  const results: Array<{ url: string; status: string; error?: string }> = [];

  for (const sitemapUrl of config.sitemapUrls) {
    try {
      await webmasters.sitemaps.submit({
        siteUrl: config.siteUrl,
        feedpath: sitemapUrl,
      });

      // Check status after submission
      const status = await webmasters.sitemaps.get({
        siteUrl: config.siteUrl,
        feedpath: sitemapUrl,
      });

      results.push({
        url: sitemapUrl,
        status: 'submitted',
        error: status.data.errors
          ? `${status.data.errors} errors`
          : undefined,
      });

      console.log(`Submitted: ${sitemapUrl}`);
      console.log(`  URLs discovered: ${status.data.contents?.[0]?.submitted}`);
      console.log(`  URLs indexed: ${status.data.contents?.[0]?.indexed}`);

      // Rate limiting — be gentle with the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      results.push({
        url: sitemapUrl,
        status: 'error',
        error: error.message,
      });
      console.error(`Failed to submit ${sitemapUrl}: ${error.message}`);
    }
  }

  return results;
}

async function listAllSitemaps(siteUrl: string, serviceAccountKeyPath: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });

  const response = await webmasters.sitemaps.list({
    siteUrl,
  });

  return (response.data.sitemap || []).map(sm => ({
    path: sm.path,
    lastSubmitted: sm.lastSubmitted,
    isPending: sm.isPending,
    isSitemapsIndex: sm.isSitemapsIndex,
    lastDownloaded: sm.lastDownloaded,
    warnings: sm.warnings,
    errors: sm.errors,
    contents: sm.contents?.map(c => ({
      type: c.type,
      submitted: c.submitted,
      indexed: c.indexed,
    })),
  }));
}

async function deleteSitemap(
  siteUrl: string,
  sitemapUrl: string,
  serviceAccountKeyPath: string
) {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });

  await webmasters.sitemaps.delete({
    siteUrl,
    feedpath: sitemapUrl,
  });

  console.log(`Deleted sitemap: ${sitemapUrl}`);
}

export { submitSitemaps, listAllSitemaps, deleteSitemap };
```

### Sitemap Best Practices for 100k+ Pages

1. **Always gzip sitemaps** — A 50k URL sitemap can be 5-10MB uncompressed but <500KB gzipped
2. **Use `<lastmod>` accurately** — Only update when content actually changes. Google ignores `<lastmod>` if it's always "now"
3. **Segment by page type** — Separate sitemaps for services, locations, combos, and blog. Makes monitoring easier
4. **Include only canonical URLs** — Never put non-canonical URLs in sitemaps
5. **Include only 200-status URLs** — Never include redirects, 404s, or noindex pages
6. **Reference the sitemap index in robots.txt**:
   ```
   Sitemap: https://www.example.com/sitemap-index.xml
   ```
7. **Re-submit after major content updates** — The API submission acts as a "ping" to Google
8. **Monitor submission/indexed counts** — A large gap between submitted and indexed signals problems

---

## 3. Crawl Budget Management

### What is Crawl Budget?

Crawl budget is the number of pages Googlebot will crawl on your site within a given timeframe. It's determined by two factors:

- **Crawl rate limit**: The maximum fetching rate that Googlebot uses without overloading your server. Googlebot auto-adjusts this based on server response times. If your server slows down, Googlebot backs off.
- **Crawl demand**: How much Google wants to crawl your site, based on popularity, freshness, and perceived quality.

**At 100k+ pages, crawl budget is a real constraint.** Google won't crawl all 100k pages in a single day. You may see 1,000-10,000 pages crawled per day depending on site authority and server performance. At 100k pages with 5,000 crawls/day, it takes 20 days to crawl the entire site once.

### Why Crawl Budget Matters for Programmatic SEO

1. **New pages take longer to discover** — If Googlebot is spending crawl budget on low-value pages, new high-value pages wait
2. **Content updates don't get picked up** — Updated pages may not be re-crawled for weeks
3. **Server overload risk** — Aggressive crawling can degrade server performance, causing a negative feedback loop
4. **Wasted budget on duplicate/thin content** — Programmatic sites risk generating near-duplicate pages that waste crawl resources

### Crawl Budget Optimization Strategies

#### 3.1 robots.txt Configuration

```txt
# robots.txt for a service-area business with programmatic pages

User-agent: Googlebot
# Allow all valuable content
Allow: /

# Block faceted navigation and filters that create duplicate content
Disallow: /search?
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*?page=  # Block pagination parameters if using rel=next/prev or infinite scroll
Disallow: /*?ref=
Disallow: /*?utm_

# Block internal utility pages
Disallow: /admin/
Disallow: /api/
Disallow: /preview/
Disallow: /draft/
Disallow: /_next/data/  # Next.js data routes — Googlebot doesn't need JSON endpoints

# Block low-value auto-generated pages
Disallow: /tag/  # If tag pages are thin
Disallow: /author/  # If author pages are thin

# Crawl-delay (respected by some bots, NOT by Googlebot)
# Googlebot ignores this — use GSC crawl rate settings instead
User-agent: *
Crawl-delay: 1

# Sitemap reference
Sitemap: https://www.example.com/sitemap-index.xml
```

#### 3.2 Server Response Time Optimization

Googlebot's crawl rate is directly tied to server response time. Targets:

| Metric | Target | Impact on Crawl |
|---|---|---|
| TTFB (Time to First Byte) | < 200ms | Googlebot will crawl aggressively |
| TTFB | 200-500ms | Normal crawl rate |
| TTFB | 500ms-2s | Reduced crawl rate |
| TTFB | > 2s | Significantly throttled crawling |
| 5xx error rate | < 0.1% | Normal crawling |
| 5xx error rate | > 1% | Googlebot backs off dramatically |

**Optimization tactics for the stack:**

- **Astro static generation**: Pre-render all programmatic pages at build time. Static HTML = ~5ms TTFB from CDN
- **Edge caching**: Use Cloudflare/Vercel Edge to cache all programmatic pages. Cache key = URL path
- **ISR (Incremental Static Regeneration)** with Next.js: Set `revalidate` to 86400 (24h) for programmatic pages
- **Supabase query optimization**: Add indexes on `(state_slug, city_slug, service_slug)` composite keys. Use materialized views for complex joins
- **Connection pooling**: Use Supabase's pgBouncer connection pooling to prevent connection exhaustion during crawl spikes

#### 3.3 Removing Low-Value URLs from Crawl

For programmatic sites, some generated pages may be low-value:

```typescript
// scripts/gsc/identify-low-value-pages.ts
// Identifies pages that are wasting crawl budget

import { google } from 'googleapis';

interface LowValuePage {
  url: string;
  reason: string;
  recommendation: string;
}

async function identifyLowValuePages(
  siteUrl: string,
  serviceAccountKeyPath: string
): Promise<LowValuePage[]> {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Get pages with 0 clicks and 0 impressions over 90 days
  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: getDateString(-90),
      endDate: getDateString(-1),
      dimensions: ['page'],
      rowLimit: 25000,
      dataState: 'final',
    },
  });

  const allPages = response.data.rows || [];

  // Pages with impressions but 0 clicks and position > 50 are candidates
  const lowValue = allPages
    .filter(row => {
      const clicks = row.clicks || 0;
      const impressions = row.impressions || 0;
      const position = row.position || 100;
      return clicks === 0 && impressions < 10 && position > 50;
    })
    .map(row => ({
      url: row.keys![0],
      reason: `0 clicks, ${row.impressions} impressions, avg position ${row.position?.toFixed(1)}`,
      recommendation: 'Consider noindex, improving content, or consolidating with a stronger page',
    }));

  return lowValue;
}

function getDateString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

export { identifyLowValuePages };
```

#### 3.4 Internal Linking Strategy for Crawl Efficiency

- **Hub-and-spoke model**: Service pages link to all their city variants. City pages link to all services available. This creates a shallow crawl depth.
- **Maximum crawl depth**: No programmatic page should be more than 3 clicks from the homepage
  - Homepage > State page > City page > Service+City page (3 clicks)
  - Homepage > Service page > Service+City page (2 clicks)
- **HTML sitemaps**: Create browsable HTML sitemap pages organized by state/city that link to all combo pages. These serve as crawl entry points.
- **Breadcrumbs**: Every page has breadcrumbs that create upward links, improving crawl connectivity

#### 3.5 Crawl Rate Settings in GSC

In GSC UI: `Settings > Crawl rate > Limit Googlebot's crawl rate`

- **Default**: Let Google decide (recommended for most sites)
- **Reduce crawl rate**: Only if Googlebot is causing server issues. This is a cap, not a target
- **Never reduce permanently** — Only use temporarily during server issues, then reset
- **API equivalent**: There is no API to set crawl rate. This is UI-only

---

## 4. Index Coverage Monitoring

### Understanding the Pages Report

The GSC Pages report (formerly "Index Coverage") is the single most important report for programmatic SEO at scale. It tells you which of your pages Google knows about and what it's doing with them.

### Key Statuses and What They Mean

#### Indexed Statuses (Good)

| Status | Meaning | Action |
|---|---|---|
| **Submitted and indexed** | Page was in your sitemap and is now indexed | None — this is the goal |
| **Indexed, not submitted in sitemap** | Page was found via crawling (not sitemap) and indexed | Add to sitemap for completeness |

#### Not Indexed Statuses (Need Attention)

| Status | Meaning | Action |
|---|---|---|
| **Discovered - currently not indexed** | Google knows the URL exists but hasn't crawled it yet | Crawl budget issue. Improve internal linking, ensure sitemap submission, wait |
| **Crawled - currently not indexed** | Google crawled the page but chose not to index it | **Critical** — Content quality issue. Page is too thin, duplicate, or low-value. Improve content uniqueness |
| **Excluded by 'noindex' tag** | Page has a `noindex` meta tag or header | Intentional? If not, remove the tag |
| **Blocked by robots.txt** | robots.txt prevents crawling | Intentional? If not, update robots.txt |
| **Page with redirect** | URL redirects to another URL | Expected for URL migrations. Remove from sitemap if permanent |
| **Soft 404** | Page returns 200 but Google thinks it's a 404 (thin/empty content) | **Critical for programmatic SEO** — Fix content generation. Ensure pages have substantial unique content |
| **Duplicate without user-selected canonical** | Google found duplicates and chose a canonical | Check if Google's canonical choice matches yours. Fix content duplication |
| **Duplicate, Google chose different canonical than user** | Your canonical tag points to URL A, but Google chose URL B | **Serious** — Fix canonical tags or consolidate content |
| **Not found (404)** | Page returns 404 | Remove from sitemap, fix internal links pointing to it |
| **Server error (5xx)** | Page returned a server error during crawl | Fix server issues immediately — this degrades crawl budget |
| **Alternate page with proper canonical tag** | Page is an alternate version (e.g., mobile) pointing to canonical | Expected behavior, no action needed |

### Monitoring Index Coverage Programmatically

```typescript
// scripts/gsc/monitor-index-coverage.ts
// Tracks index coverage trends over time and alerts on regressions

import { createClient } from '@supabase/supabase-js';

// Note: The GSC API does not directly expose the Pages/Index Coverage report.
// You must use the URL Inspection API (Section 6) to check individual URLs,
// or export data from GSC UI / use the Bulk Data Export to BigQuery.
// This script tracks coverage by sampling URLs and storing results.

interface CoverageSnapshot {
  date: string;
  siteUrl: string;
  totalIndexed: number;
  totalDiscovered: number;
  totalCrawledNotIndexed: number;
  totalExcluded: number;
  totalErrors: number;
  details: Record<string, number>;
}

async function trackCoverageFromSampling(
  siteUrl: string,
  sampleUrls: string[],
  inspectUrl: (url: string) => Promise<any>
): Promise<CoverageSnapshot> {
  const statusCounts: Record<string, number> = {};
  let indexed = 0;
  let discovered = 0;
  let crawledNotIndexed = 0;
  let excluded = 0;
  let errors = 0;

  for (const url of sampleUrls) {
    try {
      const result = await inspectUrl(url);
      const verdict = result.inspectionResult?.indexStatusResult?.verdict;
      const coverageState = result.inspectionResult?.indexStatusResult?.coverageState;

      const status = coverageState || verdict || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      switch (verdict) {
        case 'PASS':
          indexed++;
          break;
        case 'NEUTRAL':
          if (coverageState?.includes('Discovered')) discovered++;
          else if (coverageState?.includes('Crawled')) crawledNotIndexed++;
          else excluded++;
          break;
        case 'FAIL':
          errors++;
          break;
        default:
          excluded++;
      }

      // Rate limit: URL Inspection API has quotas
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      console.error(`Failed to inspect ${url}:`, error);
      errors++;
    }
  }

  return {
    date: new Date().toISOString().split('T')[0],
    siteUrl,
    totalIndexed: indexed,
    totalDiscovered: discovered,
    totalCrawledNotIndexed: crawledNotIndexed,
    totalExcluded: excluded,
    totalErrors: errors,
    details: statusCounts,
  };
}

export { trackCoverageFromSampling, CoverageSnapshot };
```

### Payload CMS Collection for Storing Coverage Data

```typescript
// payload/collections/GSCCoverageSnapshots.ts
import type { CollectionConfig } from 'payload';

export const GSCCoverageSnapshots: CollectionConfig = {
  slug: 'gsc-coverage-snapshots',
  admin: {
    group: 'SEO Monitoring',
    useAsTitle: 'label',
    defaultColumns: ['siteUrl', 'date', 'totalIndexed', 'totalErrors'],
    listSearchableFields: ['siteUrl'],
  },
  fields: [
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'GSC property URL (e.g., sc-domain:example.com)',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'label',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            return `${siblingData.siteUrl} — ${siblingData.date}`;
          },
        ],
      },
    },
    {
      name: 'totalSubmitted',
      type: 'number',
      required: true,
      admin: { description: 'Total URLs submitted via sitemaps' },
    },
    {
      name: 'totalIndexed',
      type: 'number',
      required: true,
    },
    {
      name: 'totalDiscovered',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Discovered — currently not indexed' },
    },
    {
      name: 'totalCrawledNotIndexed',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Crawled — currently not indexed' },
    },
    {
      name: 'totalExcluded',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'totalErrors',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'indexRate',
      type: 'number',
      admin: {
        description: 'Percentage of submitted URLs that are indexed',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            if (siblingData.totalSubmitted > 0) {
              return Math.round(
                (siblingData.totalIndexed / siblingData.totalSubmitted) * 100 * 10
              ) / 10;
            }
            return 0;
          },
        ],
      },
    },
    {
      name: 'statusBreakdown',
      type: 'json',
      admin: {
        description: 'Detailed breakdown by GSC coverage status',
      },
    },
    {
      name: 'pageTypeBreakdown',
      type: 'array',
      admin: {
        description: 'Coverage broken down by page type',
      },
      fields: [
        {
          name: 'pageType',
          type: 'select',
          options: [
            { label: 'Service Pages', value: 'service' },
            { label: 'Location Pages', value: 'location' },
            { label: 'Service + Location Combos', value: 'combo' },
            { label: 'Blog Posts', value: 'blog' },
            { label: 'Static Pages', value: 'static' },
          ],
        },
        { name: 'submitted', type: 'number' },
        { name: 'indexed', type: 'number' },
        { name: 'errors', type: 'number' },
      ],
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: { siteUrl: 1, date: -1 },
      unique: true,
    },
  ],
};
```

### Key Coverage Metrics to Track

For a 100k-page programmatic SEO site, target these benchmarks:

| Metric | Healthy | Warning | Critical |
|---|---|---|---|
| Index rate (indexed/submitted) | > 90% | 70-90% | < 70% |
| Discovered not indexed | < 5% of total | 5-15% | > 15% |
| Crawled not indexed | < 3% of total | 3-10% | > 10% |
| Soft 404s | < 0.5% | 0.5-2% | > 2% |
| Server errors (5xx) | 0% | < 0.1% | > 0.1% |
| Week-over-week index change | Growing or stable | Flat | Declining |

---

## 5. Crawl Stats Analysis

### Accessing Crawl Stats

Crawl Stats are available in GSC under `Settings > Crawl stats`. The data covers the last 90 days and shows:

- **Total crawl requests per day**
- **Total download size per day**
- **Average response time per day**
- **Host status (availability)**
- **Crawl request breakdown by response type, file type, purpose, and Googlebot type**

### Interpreting the Data

#### Total Crawl Requests

| Daily Crawl Volume | Site Size 100k+ | Interpretation |
|---|---|---|
| > 10,000/day | Good | Google is actively crawling your site |
| 5,000-10,000/day | Acceptable | Normal for newer sites |
| 1,000-5,000/day | Concerning | Crawl budget is limited; optimize |
| < 1,000/day | Critical | Severe crawl budget issues or site quality problems |

**Goal**: For a 100k page site, aim for 5,000-20,000 crawl requests per day. At 10,000/day, Google can re-crawl your entire site every 10 days.

#### Average Response Time

- **< 200ms**: Excellent. Googlebot will crawl aggressively
- **200-500ms**: Good. Normal range
- **500ms-1s**: Suboptimal. Crawl rate will decrease
- **> 1s**: Poor. Googlebot will significantly reduce crawling. Fix immediately

For static Astro sites served from CDN, response times should consistently be < 100ms.

#### Response Breakdown

Watch for:
- **High 304 (Not Modified) ratio**: Good — means Google is re-checking pages and finding them unchanged, saving bandwidth
- **Any 5xx responses**: Server errors. Investigate immediately
- **High 301/302 ratio**: Too many redirects. Clean up redirect chains
- **404 responses**: Pages being crawled that don't exist. Remove from sitemaps, fix internal links

#### File Type Breakdown

For programmatic SEO sites:
- **HTML** should be 80%+ of crawl requests
- **Images** at 10-15% is normal
- **CSS/JS** should be minimal after initial crawl (browsers cache, Googlebot does too)
- **If JSON/API responses are high**: Check if Googlebot is hitting your API endpoints. Block with robots.txt if not needed

### Automated Crawl Stats Monitoring

```typescript
// scripts/gsc/crawl-stats-monitor.ts
// Note: The Crawl Stats report is NOT available via the GSC API.
// This script uses BigQuery Bulk Data Export (Section 8) which includes crawl data,
// or you can use the CrUX API for performance metrics.
// For crawl stats specifically, you need to either:
// 1. Use the GSC Bulk Data Export to BigQuery
// 2. Parse server access logs for Googlebot requests

import { createClient } from '@supabase/supabase-js';

interface CrawlStatsDay {
  date: string;
  totalRequests: number;
  avgResponseTimeMs: number;
  totalBytesDownloaded: number;
  statusCodes: Record<string, number>;
  fileTypes: Record<string, number>;
  googlebotTypes: Record<string, number>;
}

// Parse Googlebot activity from server access logs
function parseAccessLogForGooglebot(logLines: string[]): CrawlStatsDay[] {
  const dailyStats = new Map<string, CrawlStatsDay>();

  for (const line of logLines) {
    // Skip non-Googlebot requests
    if (!line.includes('Googlebot') && !line.includes('googlebot')) continue;

    // Parse common log format:
    // IP - - [date] "METHOD path HTTP/1.1" status bytes "referer" "user-agent" response_time
    const match = line.match(
      /\[(\d{2}\/\w{3}\/\d{4}).*?"(\w+)\s+(\S+).*?"\s+(\d{3})\s+(\d+).*?(\d+)$/
    );
    if (!match) continue;

    const [, dateStr, , path, statusCode, bytes, responseTimeUs] = match;
    const date = formatLogDate(dateStr);

    if (!dailyStats.has(date)) {
      dailyStats.set(date, {
        date,
        totalRequests: 0,
        avgResponseTimeMs: 0,
        totalBytesDownloaded: 0,
        statusCodes: {},
        fileTypes: {},
        googlebotTypes: {},
      });
    }

    const stats = dailyStats.get(date)!;
    stats.totalRequests++;
    stats.totalBytesDownloaded += parseInt(bytes);
    stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;

    // Determine file type from path
    const ext = getFileType(path);
    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

    // Running average for response time
    const responseTimeMs = parseInt(responseTimeUs) / 1000;
    stats.avgResponseTimeMs =
      (stats.avgResponseTimeMs * (stats.totalRequests - 1) + responseTimeMs) /
      stats.totalRequests;
  }

  return Array.from(dailyStats.values());
}

function getFileType(path: string): string {
  if (path.endsWith('.js')) return 'JavaScript';
  if (path.endsWith('.css')) return 'CSS';
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(path)) return 'Image';
  if (path.endsWith('.xml')) return 'XML';
  if (path.endsWith('.json')) return 'JSON';
  return 'HTML';
}

function formatLogDate(dateStr: string): string {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const [day, month, year] = dateStr.split('/');
  return `${year}-${months[month]}-${day.padStart(2, '0')}`;
}

export { parseAccessLogForGooglebot, CrawlStatsDay };
```

### Payload CMS Collection for Crawl Stats

```typescript
// payload/collections/GSCCrawlStats.ts
import type { CollectionConfig } from 'payload';

export const GSCCrawlStats: CollectionConfig = {
  slug: 'gsc-crawl-stats',
  admin: {
    group: 'SEO Monitoring',
    useAsTitle: 'label',
    defaultColumns: ['siteUrl', 'date', 'totalRequests', 'avgResponseTimeMs'],
  },
  fields: [
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'label',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) =>
            `${siblingData.siteUrl} — ${new Date(siblingData.date).toISOString().split('T')[0]}`,
        ],
      },
    },
    { name: 'totalRequests', type: 'number', required: true },
    { name: 'avgResponseTimeMs', type: 'number', required: true },
    { name: 'totalBytesDownloaded', type: 'number' },
    {
      name: 'statusCodes',
      type: 'json',
      admin: { description: 'Breakdown by HTTP status code: { "200": 5000, "301": 100, ... }' },
    },
    {
      name: 'fileTypes',
      type: 'json',
      admin: { description: 'Breakdown by file type: { "HTML": 8000, "Image": 1500, ... }' },
    },
    {
      name: 'crawlBudgetEfficiency',
      type: 'number',
      admin: {
        description: 'Percentage of crawl requests that returned indexable HTML (200 status)',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const codes = siblingData.statusCodes as Record<string, number> | undefined;
            if (!codes || !siblingData.totalRequests) return 0;
            const ok = codes['200'] || 0;
            return Math.round((ok / siblingData.totalRequests) * 100 * 10) / 10;
          },
        ],
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: { siteUrl: 1, date: -1 },
      unique: true,
    },
  ],
};
```

---

## 6. URL Inspection API

### Overview

The URL Inspection API allows you to programmatically check the index status of individual URLs. This is the API equivalent of the "Inspect URL" feature in the GSC UI.

**API Limits**:
- **2,000 requests per day per property** (as of 2025)
- **600 requests per minute**
- Each request inspects one URL

For a 100k-page site, you cannot inspect every URL daily. You need a sampling strategy.

### Basic URL Inspection

```typescript
// scripts/gsc/url-inspection.ts
import { google } from 'googleapis';

interface InspectionResult {
  url: string;
  verdict: string;
  coverageState: string;
  indexingState: string;
  lastCrawlTime: string | null;
  pageFetchState: string;
  robotsTxtState: string;
  crawledAs: string;
  referringUrls: string[];
  sitemap: string[];
}

async function inspectUrl(
  siteUrl: string,
  inspectionUrl: string,
  serviceAccountKeyPath: string
): Promise<InspectionResult> {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl,
      siteUrl,
    },
  });

  const result = response.data.inspectionResult!;
  const indexResult = result.indexStatusResult!;

  return {
    url: inspectionUrl,
    verdict: indexResult.verdict || 'UNKNOWN',
    coverageState: indexResult.coverageState || 'UNKNOWN',
    indexingState: indexResult.indexingState || 'UNKNOWN',
    lastCrawlTime: indexResult.lastCrawlTime || null,
    pageFetchState: indexResult.pageFetchState || 'UNKNOWN',
    robotsTxtState: indexResult.robotsTxtState || 'UNKNOWN',
    crawledAs: indexResult.crawledAs || 'UNKNOWN',
    referringUrls: indexResult.referringUrls || [],
    sitemap: indexResult.sitemap || [],
  };
}

export { inspectUrl, InspectionResult };
```

### Batch Inspection with Sampling Strategy

```typescript
// scripts/gsc/batch-inspection.ts
// Inspects a stratified sample of URLs across page types,
// staying within the 2,000/day API quota

import { inspectUrl, InspectionResult } from './url-inspection';
import { createClient } from '@supabase/supabase-js';

interface SamplingConfig {
  siteUrl: string;
  serviceAccountKeyPath: string;
  supabaseUrl: string;
  supabaseKey: string;
  // Allocate daily quota across page types
  quotaAllocation: {
    service: number;      // e.g., 100
    location: number;     // e.g., 200
    combo: number;        // e.g., 1200 (largest segment gets most quota)
    blog: number;         // e.g., 300
    static: number;       // e.g., 50
    recheck: number;      // e.g., 150 (re-check previously problematic URLs)
  };
}

interface BatchInspectionReport {
  date: string;
  siteUrl: string;
  totalInspected: number;
  totalIndexed: number;
  totalNotIndexed: number;
  totalErrors: number;
  resultsByPageType: Record<string, {
    inspected: number;
    indexed: number;
    notIndexed: number;
    issues: Array<{ url: string; status: string; lastCrawl: string | null }>;
  }>;
}

async function runBatchInspection(
  config: SamplingConfig
): Promise<BatchInspectionReport> {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  const report: BatchInspectionReport = {
    date: new Date().toISOString().split('T')[0],
    siteUrl: config.siteUrl,
    totalInspected: 0,
    totalIndexed: 0,
    totalNotIndexed: 0,
    totalErrors: 0,
    resultsByPageType: {},
  };

  // 1. Get URLs to re-check (previously problematic)
  const { data: recheckUrls } = await supabase
    .from('gsc_url_inspections')
    .select('url')
    .eq('site_url', config.siteUrl)
    .in('verdict', ['NEUTRAL', 'FAIL'])
    .order('inspected_at', { ascending: true })
    .limit(config.quotaAllocation.recheck);

  // 2. Get random samples for each page type from the pages table
  const pageTypes = ['service', 'location', 'combo', 'blog', 'static'] as const;
  const urlsByType: Record<string, string[]> = {};

  for (const pageType of pageTypes) {
    const quota = config.quotaAllocation[pageType];
    if (quota <= 0) continue;

    // Use Supabase's random ordering for sampling
    // For combo pages, also prioritize recently created ones
    const { data: pages } = await supabase
      .from('pages')
      .select('url')
      .eq('page_type', pageType)
      .eq('status', 'published')
      .order('created_at', { ascending: false }) // Bias toward newer pages
      .limit(quota);

    urlsByType[pageType] = (pages || []).map(p => p.url);
  }

  // Add recheck URLs
  urlsByType['recheck'] = (recheckUrls || []).map(r => r.url);

  // 3. Inspect all URLs with rate limiting
  for (const [pageType, urls] of Object.entries(urlsByType)) {
    const typeReport = {
      inspected: 0,
      indexed: 0,
      notIndexed: 0,
      issues: [] as Array<{ url: string; status: string; lastCrawl: string | null }>,
    };

    for (const url of urls) {
      try {
        const result = await inspectUrl(
          config.siteUrl,
          url,
          config.serviceAccountKeyPath
        );

        typeReport.inspected++;
        report.totalInspected++;

        if (result.verdict === 'PASS') {
          typeReport.indexed++;
          report.totalIndexed++;
        } else {
          typeReport.notIndexed++;
          report.totalNotIndexed++;
          typeReport.issues.push({
            url: result.url,
            status: result.coverageState,
            lastCrawl: result.lastCrawlTime,
          });
        }

        // Store result in Supabase
        await supabase.from('gsc_url_inspections').upsert({
          site_url: config.siteUrl,
          url,
          page_type: pageType === 'recheck' ? 'recheck' : pageType,
          verdict: result.verdict,
          coverage_state: result.coverageState,
          indexing_state: result.indexingState,
          last_crawl_time: result.lastCrawlTime,
          page_fetch_state: result.pageFetchState,
          robots_txt_state: result.robotsTxtState,
          crawled_as: result.crawledAs,
          inspected_at: new Date().toISOString(),
        }, {
          onConflict: 'site_url,url',
        });

        // Rate limit: ~1 request per 100ms = 600/min (API limit)
        await new Promise(resolve => setTimeout(resolve, 120));
      } catch (error: any) {
        console.error(`Inspection failed for ${url}: ${error.message}`);
        report.totalErrors++;

        if (error.code === 429) {
          // Rate limited — wait and continue
          console.log('Rate limited, waiting 60 seconds...');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }
    }

    report.resultsByPageType[pageType] = typeReport;
  }

  return report;
}

export { runBatchInspection, SamplingConfig, BatchInspectionReport };
```

### Supabase Schema for URL Inspections

```sql
-- supabase/migrations/20260409_gsc_url_inspections.sql

CREATE TABLE gsc_url_inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  url TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'unknown',
  verdict TEXT NOT NULL,           -- PASS, NEUTRAL, FAIL
  coverage_state TEXT,             -- e.g., "Submitted and indexed", "Crawled - currently not indexed"
  indexing_state TEXT,             -- INDEXING_ALLOWED, BLOCKED_BY_ROBOTS_TXT, etc.
  last_crawl_time TIMESTAMPTZ,
  page_fetch_state TEXT,           -- SUCCESSFUL, SOFT_404, REDIRECT, etc.
  robots_txt_state TEXT,           -- ALLOWED, DISALLOWED
  crawled_as TEXT,                 -- DESKTOP, MOBILE
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(site_url, url)
);

CREATE INDEX idx_gsc_inspections_site_verdict
  ON gsc_url_inspections(site_url, verdict);

CREATE INDEX idx_gsc_inspections_site_page_type
  ON gsc_url_inspections(site_url, page_type);

CREATE INDEX idx_gsc_inspections_inspected_at
  ON gsc_url_inspections(inspected_at);

-- View for quick coverage summary
CREATE OR REPLACE VIEW gsc_coverage_summary AS
SELECT
  site_url,
  page_type,
  COUNT(*) AS total_inspected,
  COUNT(*) FILTER (WHERE verdict = 'PASS') AS indexed,
  COUNT(*) FILTER (WHERE verdict = 'NEUTRAL') AS not_indexed,
  COUNT(*) FILTER (WHERE verdict = 'FAIL') AS errors,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE verdict = 'PASS') / NULLIF(COUNT(*), 0),
    1
  ) AS index_rate_pct,
  MAX(inspected_at) AS last_inspected
FROM gsc_url_inspections
GROUP BY site_url, page_type;
```

### Inspection Priority Rotation Strategy

With a 2,000/day quota and 100k pages, a full inspection cycle takes 50 days. Optimize by:

1. **Prioritize new pages** — Pages published in the last 7 days get inspected first (catch indexing issues early)
2. **Re-check failures** — URLs that previously failed get re-inspected every 3 days
3. **Random sampling for indexed pages** — Already-indexed pages are spot-checked randomly (10% of quota)
4. **Never inspect the same URL twice in 24 hours** — Waste of quota
5. **Rotate through page types** — Ensure proportional coverage of each segment

---

## 7. Performance Report

### Overview

The GSC Performance report shows how your pages perform in Google Search results:

- **Clicks**: Number of times users clicked through to your site
- **Impressions**: Number of times your pages appeared in search results
- **CTR (Click-Through Rate)**: Clicks / Impressions
- **Position**: Average ranking position in search results

### Segmenting Performance by Page Type

For programmatic SEO, aggregate metrics are useless. You need to segment by page type:

| Page Type | URL Pattern | Expected Performance |
|---|---|---|
| Service pages | `/services/[service]/` | High CTR, moderate volume |
| Location pages | `/[state]/[city]/` | Moderate CTR, high local volume |
| Service + Location combos | `/[state]/[city]/[service]/` | Lower CTR, very high volume (this is the bulk) |
| Blog posts | `/blog/[slug]/` | Variable CTR, informational intent |
| Static pages | `/about/`, `/contact/` | Brand queries, high CTR |

### Performance Tracking Script

```typescript
// scripts/gsc/performance-tracker.ts
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

interface PerformanceConfig {
  siteUrl: string;
  serviceAccountKeyPath: string;
  supabaseUrl: string;
  supabaseKey: string;
}

interface PageTypePerformance {
  pageType: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topPages: Array<{
    url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

// URL pattern matchers for each page type
const PAGE_TYPE_PATTERNS: Array<{ type: string; regex: RegExp }> = [
  { type: 'blog', regex: /\/blog\// },
  { type: 'combo', regex: /\/[a-z-]+\/[a-z-]+\/[a-z-]+\/$/ },  // /state/city/service/
  { type: 'location', regex: /\/[a-z-]+\/[a-z-]+\/$/ },          // /state/city/
  { type: 'service', regex: /\/services\/[a-z-]+\/$/ },          // /services/service/
  { type: 'static', regex: /^\/$|\/about|\/contact|\/privacy/ },
];

function classifyUrl(url: string): string {
  const path = new URL(url).pathname;
  for (const pattern of PAGE_TYPE_PATTERNS) {
    if (pattern.regex.test(path)) return pattern.type;
  }
  return 'other';
}

async function fetchPerformanceByPageType(
  config: PerformanceConfig,
  startDate: string,
  endDate: string
): Promise<PageTypePerformance[]> {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Fetch page-level performance data
  // The API returns max 25,000 rows per request
  // For 100k+ pages, we need to paginate
  let allRows: any[] = [];
  let startRow = 0;
  const ROW_LIMIT = 25000;

  while (true) {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: config.siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: ROW_LIMIT,
        startRow,
        dataState: 'final',
      },
    });

    const rows = response.data.rows || [];
    allRows = allRows.concat(rows);

    if (rows.length < ROW_LIMIT) break;
    startRow += ROW_LIMIT;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Group by page type
  const byType = new Map<string, {
    clicks: number;
    impressions: number;
    positionSum: number;
    count: number;
    pages: Array<{ url: string; clicks: number; impressions: number; ctr: number; position: number }>;
  }>();

  for (const row of allRows) {
    const url = row.keys![0];
    const pageType = classifyUrl(url);

    if (!byType.has(pageType)) {
      byType.set(pageType, { clicks: 0, impressions: 0, positionSum: 0, count: 0, pages: [] });
    }

    const bucket = byType.get(pageType)!;
    bucket.clicks += row.clicks || 0;
    bucket.impressions += row.impressions || 0;
    bucket.positionSum += (row.position || 0) * (row.impressions || 0); // Weight by impressions
    bucket.count++;
    bucket.pages.push({
      url,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    });
  }

  // Now fetch query data for each page type using URL filters
  const results: PageTypePerformance[] = [];

  for (const [pageType, data] of byType) {
    const avgPosition = data.impressions > 0
      ? data.positionSum / data.impressions
      : 0;

    // Sort pages by clicks to get top performers
    data.pages.sort((a, b) => b.clicks - a.clicks);

    results.push({
      pageType,
      clicks: data.clicks,
      impressions: data.impressions,
      ctr: data.impressions > 0 ? data.clicks / data.impressions : 0,
      position: Math.round(avgPosition * 10) / 10,
      topPages: data.pages.slice(0, 20),
      topQueries: [], // Populated separately below
    });
  }

  // Fetch top queries (separate API call, not filtered by page type in API)
  const queryResponse = await searchconsole.searchanalytics.query({
    siteUrl: config.siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 25000,
      dataState: 'final',
    },
  });

  // Map queries to page types
  for (const row of queryResponse.data.rows || []) {
    const [query, url] = row.keys!;
    const pageType = classifyUrl(url);
    const typeResult = results.find(r => r.pageType === pageType);
    if (typeResult) {
      typeResult.topQueries.push({
        query,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      });
    }
  }

  // Sort queries by clicks and trim
  for (const result of results) {
    result.topQueries.sort((a, b) => b.clicks - a.clicks);
    result.topQueries = result.topQueries.slice(0, 20);
  }

  return results;
}

async function storePerformanceSnapshot(
  config: PerformanceConfig,
  date: string,
  data: PageTypePerformance[]
) {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  for (const typeData of data) {
    await supabase.from('gsc_performance_snapshots').upsert({
      site_url: config.siteUrl,
      date,
      page_type: typeData.pageType,
      clicks: typeData.clicks,
      impressions: typeData.impressions,
      ctr: typeData.ctr,
      position: typeData.position,
      top_pages: typeData.topPages,
      top_queries: typeData.topQueries,
    }, {
      onConflict: 'site_url,date,page_type',
    });
  }
}

// Week-over-week comparison
async function comparePerformance(
  config: PerformanceConfig,
  currentWeekStart: string,
  currentWeekEnd: string
): Promise<Array<{
  pageType: string;
  currentClicks: number;
  previousClicks: number;
  clicksChange: number;
  clicksChangePct: number;
  currentImpressions: number;
  previousImpressions: number;
  impressionsChange: number;
  currentPosition: number;
  previousPosition: number;
  positionChange: number;
}>> {
  // Calculate previous week dates
  const prevStart = new Date(currentWeekStart);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(currentWeekEnd);
  prevEnd.setDate(prevEnd.getDate() - 7);

  const [current, previous] = await Promise.all([
    fetchPerformanceByPageType(config, currentWeekStart, currentWeekEnd),
    fetchPerformanceByPageType(
      config,
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0]
    ),
  ]);

  const comparison = [];
  const allTypes = new Set([
    ...current.map(c => c.pageType),
    ...previous.map(p => p.pageType),
  ]);

  for (const pageType of allTypes) {
    const curr = current.find(c => c.pageType === pageType);
    const prev = previous.find(p => p.pageType === pageType);

    comparison.push({
      pageType,
      currentClicks: curr?.clicks || 0,
      previousClicks: prev?.clicks || 0,
      clicksChange: (curr?.clicks || 0) - (prev?.clicks || 0),
      clicksChangePct: prev?.clicks
        ? Math.round(((curr?.clicks || 0) - prev.clicks) / prev.clicks * 100 * 10) / 10
        : 0,
      currentImpressions: curr?.impressions || 0,
      previousImpressions: prev?.impressions || 0,
      impressionsChange: (curr?.impressions || 0) - (prev?.impressions || 0),
      currentPosition: curr?.position || 0,
      previousPosition: prev?.position || 0,
      positionChange: (prev?.position || 0) - (curr?.position || 0), // Positive = improvement
    });
  }

  return comparison;
}

export {
  fetchPerformanceByPageType,
  storePerformanceSnapshot,
  comparePerformance,
  classifyUrl,
};
```

### Supabase Schema for Performance Data

```sql
-- supabase/migrations/20260409_gsc_performance.sql

CREATE TABLE gsc_performance_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  date DATE NOT NULL,
  page_type TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr DOUBLE PRECISION NOT NULL DEFAULT 0,
  position DOUBLE PRECISION NOT NULL DEFAULT 0,
  top_pages JSONB,
  top_queries JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(site_url, date, page_type)
);

CREATE INDEX idx_gsc_perf_site_date
  ON gsc_performance_snapshots(site_url, date DESC);

CREATE INDEX idx_gsc_perf_page_type
  ON gsc_performance_snapshots(page_type);

-- Materialized view for weekly trends
CREATE MATERIALIZED VIEW gsc_weekly_performance AS
SELECT
  site_url,
  page_type,
  date_trunc('week', date) AS week,
  SUM(clicks) AS total_clicks,
  SUM(impressions) AS total_impressions,
  ROUND(
    (SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100,
    2
  ) AS avg_ctr_pct,
  ROUND(AVG(position)::NUMERIC, 1) AS avg_position
FROM gsc_performance_snapshots
GROUP BY site_url, page_type, date_trunc('week', date)
ORDER BY week DESC;

-- Refresh weekly
-- Schedule: SELECT cron.schedule('refresh-gsc-weekly', '0 6 * * 1', 'REFRESH MATERIALIZED VIEW gsc_weekly_performance');
```

### GSC Performance Filters for Programmatic SEO

When using the GSC UI or API, set up these saved comparisons:

1. **Service pages vs Service+Location combos** — Are combo pages cannibalizing service pages?
2. **New pages (last 30 days) vs established pages** — How quickly are new pages gaining impressions?
3. **Desktop vs Mobile** — Programmatic pages may render differently on mobile
4. **Country filter** — For US-only service-area businesses, filter to US traffic only
5. **Regex filters for page groups**:
   - `/plumbing/` to see all plumbing-related pages
   - `/texas/` to see all Texas pages
   - `/emergency/` to see all emergency service pages

---

## 8. Bulk Data Export and BigQuery Integration

### Why BigQuery?

GSC retains only 16 months of data, and the API limits you to 25,000 rows per query. For 100k+ page sites, you need:

- **Historical data beyond 16 months** — Track year-over-year trends
- **Unlimited row counts** — Query all 100k+ pages without pagination
- **Cross-site aggregation** — Compare performance across all agency client sites
- **Custom analytics** — SQL queries for insights the GSC UI can't provide

### GSC Bulk Data Export Setup (Native BigQuery Export)

Google offers a native bulk data export from GSC to BigQuery. This is the recommended approach:

1. **In GSC**: `Settings > Bulk data export > Set up`
2. **Select Google Cloud project** and BigQuery dataset
3. **Choose export types**:
   - Search appearance data (clicks, impressions, CTR, position by page and query)
4. **Data starts flowing within 48 hours** — Historical data is not backfilled

> **Note:** Index status data is **not** available via BigQuery bulk export. To obtain index status for your pages, use the [URL Inspection API](https://developers.google.com/webmaster-tools/v1/api_reference/urlInspection.index/inspect) or check manually in the GSC UI under "Pages" (Index Coverage).

Once enabled, data lands in BigQuery tables:
- `searchdata_site_impression` — Site-level search analytics
- `searchdata_url_impression` — URL-level search analytics

### BigQuery Queries for Programmatic SEO

```sql
-- Query 1: Index rate by page type over time
-- Requires: GSC Bulk Data Export to BigQuery enabled

SELECT
  DATE_TRUNC(data_date, WEEK) AS week,
  CASE
    WHEN url LIKE '%/blog/%' THEN 'blog'
    WHEN REGEXP_CONTAINS(url, r'/[a-z-]+/[a-z-]+/[a-z-]+/$') THEN 'combo'
    WHEN REGEXP_CONTAINS(url, r'/[a-z-]+/[a-z-]+/$') THEN 'location'
    WHEN url LIKE '%/services/%' THEN 'service'
    ELSE 'static'
  END AS page_type,
  COUNT(DISTINCT url) AS total_urls,
  SUM(clicks) AS total_clicks,
  SUM(impressions) AS total_impressions,
  SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS avg_ctr,
  AVG(position) AS avg_position
FROM `project.dataset.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY week, page_type
ORDER BY week DESC, total_clicks DESC;

-- Query 2: Top performing service+location combos
SELECT
  url,
  SUM(clicks) AS total_clicks,
  SUM(impressions) AS total_impressions,
  SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS ctr,
  AVG(position) AS avg_position
FROM `project.dataset.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND REGEXP_CONTAINS(url, r'/[a-z-]+/[a-z-]+/[a-z-]+/$')
GROUP BY url
HAVING total_impressions > 100
ORDER BY total_clicks DESC
LIMIT 100;

-- Query 3: Pages losing traffic (week-over-week decline > 50%)
WITH current_week AS (
  SELECT url, SUM(clicks) AS clicks
  FROM `project.dataset.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND CURRENT_DATE()
  GROUP BY url
),
previous_week AS (
  SELECT url, SUM(clicks) AS clicks
  FROM `project.dataset.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  GROUP BY url
)
SELECT
  COALESCE(c.url, p.url) AS url,
  COALESCE(c.clicks, 0) AS current_clicks,
  COALESCE(p.clicks, 0) AS previous_clicks,
  COALESCE(c.clicks, 0) - COALESCE(p.clicks, 0) AS clicks_change,
  SAFE_DIVIDE(
    COALESCE(c.clicks, 0) - COALESCE(p.clicks, 0),
    NULLIF(COALESCE(p.clicks, 0), 0)
  ) * 100 AS change_pct
FROM current_week c
FULL OUTER JOIN previous_week p USING (url)
WHERE COALESCE(p.clicks, 0) > 10
  AND SAFE_DIVIDE(
    COALESCE(c.clicks, 0) - COALESCE(p.clicks, 0),
    NULLIF(COALESCE(p.clicks, 0), 0)
  ) < -0.5
ORDER BY clicks_change ASC
LIMIT 50;

-- Query 4: Query cannibalization detection
-- Find queries where multiple pages compete for the same keyword
SELECT
  query,
  COUNT(DISTINCT url) AS competing_pages,
  ARRAY_AGG(STRUCT(url, clicks, impressions, position) ORDER BY clicks DESC LIMIT 5) AS top_pages
FROM `project.dataset.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND impressions > 0
GROUP BY query
HAVING COUNT(DISTINCT url) > 3
ORDER BY SUM(impressions) DESC
LIMIT 100;

-- Query 5: Zero-impression pages (never appeared in search)
-- Compare sitemap URLs against GSC data
WITH sitemap_urls AS (
  -- Replace with your actual sitemap URL list or external table
  SELECT url FROM `project.dataset.sitemap_urls`
),
gsc_urls AS (
  SELECT DISTINCT url
  FROM `project.dataset.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
)
SELECT s.url AS never_appeared_url
FROM sitemap_urls s
LEFT JOIN gsc_urls g ON s.url = g.url
WHERE g.url IS NULL;
```

### Automated GSC-to-BigQuery Pipeline Script

```typescript
// scripts/gsc/bigquery-sync.ts
// For sites that don't use the native Bulk Data Export,
// this script pulls data via the Search Analytics API and writes to BigQuery

import { google } from 'googleapis';
import { BigQuery } from '@google-cloud/bigquery';

interface BigQuerySyncConfig {
  siteUrl: string;
  serviceAccountKeyPath: string;
  bigqueryDataset: string;
  bigqueryTable: string;
  projectId: string;
  rowLimit?: number;          // Max rows per paginated request (capped at API max of 25000)
}

async function syncGSCToBigQuery(
  config: BigQuerySyncConfig,
  startDate: string,
  endDate: string
) {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountKeyPath,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/bigquery',
    ],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const bigquery = new BigQuery({
    projectId: config.projectId,
    keyFilename: config.serviceAccountKeyPath,
  });

  // Ensure table exists
  const dataset = bigquery.dataset(config.bigqueryDataset);
  const table = dataset.table(config.bigqueryTable);

  const [tableExists] = await table.exists();
  if (!tableExists) {
    await dataset.createTable(config.bigqueryTable, {
      schema: {
        fields: [
          { name: 'site_url', type: 'STRING' },
          { name: 'date', type: 'DATE' },
          { name: 'page', type: 'STRING' },
          { name: 'query', type: 'STRING' },
          { name: 'country', type: 'STRING' },
          { name: 'device', type: 'STRING' },
          { name: 'clicks', type: 'INTEGER' },
          { name: 'impressions', type: 'INTEGER' },
          { name: 'ctr', type: 'FLOAT' },
          { name: 'position', type: 'FLOAT' },
          { name: 'page_type', type: 'STRING' },
          { name: 'synced_at', type: 'TIMESTAMP' },
        ],
      },
      timePartitioning: {
        type: 'DAY',
        field: 'date',
      },
    });
    console.log(`Created table ${config.bigqueryTable}`);
  }

  // Fetch data day by day to stay within API limits
  const dates = getDateRange(startDate, endDate);

  for (const date of dates) {
    console.log(`Syncing ${date}...`);

    let allRows: any[] = [];
    let startRow = 0;
    const rowLimit = Math.min(config.rowLimit ?? 25000, 25000);

    while (true) {
      const response = await searchconsole.searchanalytics.query({
        siteUrl: config.siteUrl,
        requestBody: {
          startDate: date,
          endDate: date,
          dimensions: ['page', 'query', 'country', 'device'],
          rowLimit,
          startRow,
          dataState: 'final',
        },
      });

      const rows = response.data.rows || [];
      allRows = allRows.concat(rows);

      if (rows.length < rowLimit) break;
      startRow += rowLimit;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (allRows.length === 0) {
      console.log(`  No data for ${date}`);
      continue;
    }

    // Transform to BigQuery format
    const bqRows = allRows.map(row => ({
      site_url: config.siteUrl,
      date,
      page: row.keys![0],
      query: row.keys![1],
      country: row.keys![2],
      device: row.keys![3],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
      page_type: classifyUrlForBQ(row.keys![0]),
      synced_at: new Date().toISOString(),
    }));

    // Insert in batches of 10,000
    for (let i = 0; i < bqRows.length; i += 10000) {
      const batch = bqRows.slice(i, i + 10000);
      await table.insert(batch);
    }

    console.log(`  Synced ${allRows.length} rows for ${date}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function classifyUrlForBQ(url: string): string {
  try {
    const path = new URL(url).pathname;
    if (path.includes('/blog/')) return 'blog';
    if (/\/[a-z-]+\/[a-z-]+\/[a-z-]+\/$/.test(path)) return 'combo';
    if (/\/[a-z-]+\/[a-z-]+\/$/.test(path)) return 'location';
    if (path.includes('/services/')) return 'service';
    return 'static';
  } catch {
    return 'unknown';
  }
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export { syncGSCToBigQuery };
```

### Automated Reporting Script

```typescript
// scripts/gsc/weekly-report.ts
// Generates a weekly performance report and sends it via email/Slack

import { fetchPerformanceByPageType, comparePerformance } from './performance-tracker';
import { createClient } from '@supabase/supabase-js';

interface WeeklyReport {
  siteUrl: string;
  period: string;
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCTR: number;
    avgPosition: number;
    clicksChangeWoW: number;
    impressionsChangeWoW: number;
  };
  byPageType: Array<{
    pageType: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    clicksChangeWoW: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  alerts: string[];
  topGainers: Array<{ url: string; clicksGain: number }>;
  topLosers: Array<{ url: string; clicksLoss: number }>;
}

async function generateWeeklyReport(
  config: {
    siteUrl: string;
    serviceAccountKeyPath: string;
    supabaseUrl: string;
    supabaseKey: string;
  },
): Promise<WeeklyReport> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3); // GSC data has ~3 day delay
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const comparison = await comparePerformance(config, startStr, endStr);

  const totalClicks = comparison.reduce((sum, c) => sum + c.currentClicks, 0);
  const totalImpressions = comparison.reduce((sum, c) => sum + c.currentImpressions, 0);
  const prevTotalClicks = comparison.reduce((sum, c) => sum + c.previousClicks, 0);
  const prevTotalImpressions = comparison.reduce((sum, c) => sum + c.previousImpressions, 0);

  const alerts: string[] = [];

  // Generate alerts
  for (const item of comparison) {
    if (item.clicksChangePct < -20 && item.previousClicks > 50) {
      alerts.push(
        `ALERT: ${item.pageType} pages dropped ${Math.abs(item.clicksChangePct)}% in clicks (${item.previousClicks} -> ${item.currentClicks})`
      );
    }
    if (item.positionChange < -2) {
      alerts.push(
        `WARNING: ${item.pageType} pages avg position worsened by ${Math.abs(item.positionChange).toFixed(1)} positions`
      );
    }
  }

  if (totalClicks < prevTotalClicks * 0.8) {
    alerts.push(
      `CRITICAL: Total site clicks dropped ${Math.round((1 - totalClicks / prevTotalClicks) * 100)}% week-over-week`
    );
  }

  return {
    siteUrl: config.siteUrl,
    period: `${startStr} to ${endStr}`,
    summary: {
      totalClicks,
      totalImpressions,
      avgCTR: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      avgPosition: comparison.reduce((sum, c) => sum + c.currentPosition, 0) / comparison.length,
      clicksChangeWoW: totalClicks - prevTotalClicks,
      impressionsChangeWoW: totalImpressions - prevTotalImpressions,
    },
    byPageType: comparison.map(c => ({
      pageType: c.pageType,
      clicks: c.currentClicks,
      impressions: c.currentImpressions,
      ctr: c.currentImpressions > 0 ? c.currentClicks / c.currentImpressions : 0,
      position: c.currentPosition,
      clicksChangeWoW: c.clicksChange,
      trend: c.clicksChangePct > 5 ? 'up' : c.clicksChangePct < -5 ? 'down' : 'stable',
    })),
    alerts,
    topGainers: [], // Populated from BigQuery/detailed data
    topLosers: [],
  };
}

// Format report for Slack
function formatReportForSlack(report: WeeklyReport): string {
  const lines: string[] = [];

  lines.push(`*Weekly GSC Report: ${report.siteUrl}*`);
  lines.push(`Period: ${report.period}\n`);

  lines.push('*Summary*');
  lines.push(`Clicks: ${report.summary.totalClicks.toLocaleString()} (${report.summary.clicksChangeWoW >= 0 ? '+' : ''}${report.summary.clicksChangeWoW.toLocaleString()} WoW)`);
  lines.push(`Impressions: ${report.summary.totalImpressions.toLocaleString()} (${report.summary.impressionsChangeWoW >= 0 ? '+' : ''}${report.summary.impressionsChangeWoW.toLocaleString()} WoW)`);
  lines.push(`Avg CTR: ${(report.summary.avgCTR * 100).toFixed(1)}%`);
  lines.push(`Avg Position: ${report.summary.avgPosition.toFixed(1)}\n`);

  lines.push('*By Page Type*');
  for (const pt of report.byPageType) {
    const arrow = pt.trend === 'up' ? '^' : pt.trend === 'down' ? 'v' : '-';
    lines.push(
      `${arrow} ${pt.pageType}: ${pt.clicks.toLocaleString()} clicks (${pt.clicksChangeWoW >= 0 ? '+' : ''}${pt.clicksChangeWoW}) | Pos: ${pt.position.toFixed(1)}`
    );
  }

  if (report.alerts.length > 0) {
    lines.push('\n*Alerts*');
    for (const alert of report.alerts) {
      lines.push(`- ${alert}`);
    }
  }

  return lines.join('\n');
}

export { generateWeeklyReport, formatReportForSlack };
```

---

## 9. Core Web Vitals Monitoring via GSC

### CWV Metrics in GSC

The Core Web Vitals report in GSC shows field data (real user measurements) for three metrics:

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | <= 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | <= 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | <= 0.1 | 0.1 - 0.25 | > 0.25 |

### Field Data vs Lab Data

- **Field data** (GSC, CrUX): Real user measurements from Chrome users. This is what Google uses for ranking. Requires sufficient traffic — pages with < ~1,000 monthly pageviews may not have field data.
- **Lab data** (Lighthouse, PageSpeed Insights): Simulated measurements. Useful for debugging but not used for ranking signals.

**Challenge for programmatic SEO**: Many service+location combo pages will have low traffic individually and won't have field data. Google groups them by URL pattern for CWV assessment.

### CWV Monitoring with CrUX API

```typescript
// scripts/gsc/cwv-monitor.ts
// Monitors Core Web Vitals using the Chrome UX Report (CrUX) API
// The GSC CWV report doesn't have an API — use CrUX directly

import { createClient } from '@supabase/supabase-js';

interface CWVResult {
  url: string;
  formFactor: 'DESKTOP' | 'PHONE' | 'TABLET';
  lcp: { p75: number; category: string } | null;
  inp: { p75: number; category: string } | null;
  cls: { p75: number; category: string } | null;
  overallCategory: 'FAST' | 'AVERAGE' | 'SLOW' | 'NO_DATA';
}

async function checkCWV(
  url: string,
  cruxApiKey: string,
  formFactor: 'DESKTOP' | 'PHONE' = 'PHONE'
): Promise<CWVResult> {
  const response = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${cruxApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formFactor,
        metrics: [
          'largest_contentful_paint',
          'interaction_to_next_paint',
          'cumulative_layout_shift',
        ],
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      // No data available for this URL
      return {
        url,
        formFactor,
        lcp: null,
        inp: null,
        cls: null,
        overallCategory: 'NO_DATA',
      };
    }
    throw new Error(`CrUX API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const metrics = data.record?.metrics || {};

  const getMetric = (key: string) => {
    const metric = metrics[key];
    if (!metric) return null;
    const p75 = metric.percentiles?.p75;
    const good = metric.histogram?.[0]?.density || 0;
    const ni = metric.histogram?.[1]?.density || 0;
    const poor = metric.histogram?.[2]?.density || 0;
    const category = good >= 0.75 ? 'GOOD' : poor >= 0.25 ? 'POOR' : 'NEEDS_IMPROVEMENT';
    return { p75, category };
  };

  const lcp = getMetric('largest_contentful_paint');
  const inp = getMetric('interaction_to_next_paint');
  const cls = getMetric('cumulative_layout_shift');

  // Overall: all must be GOOD for FAST
  const categories = [lcp?.category, inp?.category, cls?.category].filter(Boolean);
  let overall: CWVResult['overallCategory'] = 'NO_DATA';
  if (categories.length > 0) {
    if (categories.every(c => c === 'GOOD')) overall = 'FAST';
    else if (categories.some(c => c === 'POOR')) overall = 'SLOW';
    else overall = 'AVERAGE';
  }

  return { url, formFactor, lcp, inp, cls, overallCategory: overall };
}

// Check CWV for origin (entire domain) — useful when individual pages lack data
async function checkOriginCWV(
  origin: string,
  cruxApiKey: string
): Promise<CWVResult> {
  const response = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${cruxApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        formFactor: 'PHONE',
        metrics: [
          'largest_contentful_paint',
          'interaction_to_next_paint',
          'cumulative_layout_shift',
        ],
      }),
    }
  );

  if (!response.ok) {
    return {
      url: origin,
      formFactor: 'PHONE',
      lcp: null,
      inp: null,
      cls: null,
      overallCategory: 'NO_DATA',
    };
  }

  const data = await response.json();
  const metrics = data.record?.metrics || {};

  const getMetric = (key: string) => {
    const metric = metrics[key];
    if (!metric) return null;
    return {
      p75: metric.percentiles?.p75,
      category: (metric.histogram?.[0]?.density || 0) >= 0.75
        ? 'GOOD'
        : (metric.histogram?.[2]?.density || 0) >= 0.25
          ? 'POOR'
          : 'NEEDS_IMPROVEMENT',
    };
  };

  const lcp = getMetric('largest_contentful_paint');
  const inp = getMetric('interaction_to_next_paint');
  const cls = getMetric('cumulative_layout_shift');

  const categories = [lcp?.category, inp?.category, cls?.category].filter(Boolean);
  let overall: CWVResult['overallCategory'] = 'NO_DATA';
  if (categories.length > 0) {
    if (categories.every(c => c === 'GOOD')) overall = 'FAST';
    else if (categories.some(c => c === 'POOR')) overall = 'SLOW';
    else overall = 'AVERAGE';
  }

  return { url: origin, formFactor: 'PHONE', lcp, inp, cls, overallCategory: overall };
}

// Batch CWV check for representative pages from each template type
async function batchCWVCheck(
  urls: string[],
  cruxApiKey: string,
  delayMs: number = 200
): Promise<CWVResult[]> {
  const results: CWVResult[] = [];

  for (const url of urls) {
    try {
      const result = await checkCWV(url, cruxApiKey, 'PHONE');
      results.push(result);
    } catch (error: any) {
      console.error(`CWV check failed for ${url}: ${error.message}`);
      results.push({
        url,
        formFactor: 'PHONE',
        lcp: null,
        inp: null,
        cls: null,
        overallCategory: 'NO_DATA',
      });
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}

export { checkCWV, checkOriginCWV, batchCWVCheck, CWVResult };
```

### CWV Optimization Checklist for Programmatic Pages

| Issue | Impact | Fix for Astro/Next.js |
|---|---|---|
| Large hero images | LCP | Use `<Image>` component with `width`/`height`, `loading="eager"` for above-fold, WebP/AVIF format, CDN with resizing |
| Web fonts | LCP/CLS | `font-display: swap`, preload critical fonts, use system font stack as fallback with matching metrics |
| Third-party scripts | INP/LCP | Defer all non-critical scripts, use `<script defer>` or dynamic import, load analytics after interaction |
| Layout shifts from ads | CLS | Reserve space with explicit dimensions, use `min-height` on ad containers |
| Dynamic content injection | CLS | Set explicit dimensions on all dynamic containers (maps, reviews, forms) |
| Unoptimized SSR | LCP | For Next.js: use `generateStaticParams` for programmatic pages. For Astro: static generation by default |
| Large JavaScript bundles | INP | Code-split by route, lazy-load below-fold components, use Astro islands for interactive elements |

### Payload CMS Collection for CWV Data

```typescript
// payload/collections/GSCCoreWebVitals.ts
import type { CollectionConfig } from 'payload';

export const GSCCoreWebVitals: CollectionConfig = {
  slug: 'gsc-core-web-vitals',
  admin: {
    group: 'SEO Monitoring',
    useAsTitle: 'url',
    defaultColumns: ['url', 'formFactor', 'overallCategory', 'lcpMs', 'inpMs', 'cls'],
  },
  fields: [
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'pageType',
      type: 'select',
      options: [
        { label: 'Service', value: 'service' },
        { label: 'Location', value: 'location' },
        { label: 'Service + Location', value: 'combo' },
        { label: 'Blog', value: 'blog' },
        { label: 'Static', value: 'static' },
        { label: 'Origin (entire site)', value: 'origin' },
      ],
    },
    {
      name: 'formFactor',
      type: 'select',
      required: true,
      options: [
        { label: 'Mobile', value: 'PHONE' },
        { label: 'Desktop', value: 'DESKTOP' },
        { label: 'Tablet', value: 'TABLET' },
      ],
    },
    {
      name: 'overallCategory',
      type: 'select',
      options: [
        { label: 'Fast (Good)', value: 'FAST' },
        { label: 'Average (Needs Improvement)', value: 'AVERAGE' },
        { label: 'Slow (Poor)', value: 'SLOW' },
        { label: 'No Data', value: 'NO_DATA' },
      ],
    },
    {
      name: 'lcpMs',
      type: 'number',
      admin: { description: 'Largest Contentful Paint p75 in milliseconds' },
    },
    {
      name: 'lcpCategory',
      type: 'select',
      options: [
        { label: 'Good', value: 'GOOD' },
        { label: 'Needs Improvement', value: 'NEEDS_IMPROVEMENT' },
        { label: 'Poor', value: 'POOR' },
      ],
    },
    {
      name: 'inpMs',
      type: 'number',
      admin: { description: 'Interaction to Next Paint p75 in milliseconds' },
    },
    {
      name: 'inpCategory',
      type: 'select',
      options: [
        { label: 'Good', value: 'GOOD' },
        { label: 'Needs Improvement', value: 'NEEDS_IMPROVEMENT' },
        { label: 'Poor', value: 'POOR' },
      ],
    },
    {
      name: 'cls',
      type: 'number',
      admin: { description: 'Cumulative Layout Shift p75 score' },
    },
    {
      name: 'clsCategory',
      type: 'select',
      options: [
        { label: 'Good', value: 'GOOD' },
        { label: 'Needs Improvement', value: 'NEEDS_IMPROVEMENT' },
        { label: 'Poor', value: 'POOR' },
      ],
    },
    {
      name: 'checkedAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
};
```

---

## 10. Identifying and Fixing Indexing Issues at Scale

### Common Indexing Issues for Programmatic SEO

#### 10.1 Soft 404s

**What**: Google returns a 200 status but the page content is so thin that Google treats it as a 404.

**Why this happens with programmatic pages**:
- Template renders but the data source has no content for that city/service combo
- Placeholder text like "We provide [service] in [city]" with no additional unique content
- Pages with only boilerplate (header, footer, sidebar) and no meaningful body content

**Detection**:
```typescript
// scripts/gsc/detect-soft-404s.ts
import { inspectUrl } from './url-inspection';

async function detectSoft404s(
  siteUrl: string,
  urls: string[],
  serviceAccountKeyPath: string
): Promise<Array<{ url: string; fetchState: string }>> {
  const soft404s: Array<{ url: string; fetchState: string }> = [];

  for (const url of urls) {
    const result = await inspectUrl(siteUrl, url, serviceAccountKeyPath);

    if (result.pageFetchState === 'SOFT_404') {
      soft404s.push({ url, fetchState: result.pageFetchState });
    }

    // Also check for "Crawled - currently not indexed" which often indicates soft 404
    if (result.coverageState === 'Crawled - currently not indexed') {
      // Fetch the page and check content length
      try {
        const response = await fetch(url);
        const html = await response.text();
        const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

        if (textContent.length < 500) {
          soft404s.push({
            url,
            fetchState: `LIKELY_SOFT_404 (content length: ${textContent.length} chars)`,
          });
        }
      } catch {
        // ignore fetch errors
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  return soft404s;
}

export { detectSoft404s };
```

**Fixes**:
1. **Add minimum content thresholds** — Don't publish a page unless it has at least 300 words of unique content
2. **Enrich thin pages** — Add local data: population, nearby landmarks, weather, local regulations
3. **Return actual 404** — If you have no data for a combo, return a 404 instead of rendering a thin page
4. **Consolidate** — If 50 cities in a state have identical service content, use one state-level page instead

#### 10.2 Redirect Errors

**Common causes**:
- Redirect chains (A -> B -> C -> D) — Google follows a limited number of redirects
- Redirect loops (A -> B -> A)
- HTTP to HTTPS redirects combined with www/non-www redirects creating chains

**Detection and fix**:
```typescript
// scripts/gsc/check-redirects.ts

interface RedirectResult {
  originalUrl: string;
  finalUrl: string;
  chain: string[];
  chainLength: number;
  isLoop: boolean;
  status: 'ok' | 'chain' | 'loop' | 'error';
}

async function checkRedirectChain(url: string, maxHops: number = 10): Promise<RedirectResult> {
  const chain: string[] = [url];
  let currentUrl = url;
  let isLoop = false;

  for (let i = 0; i < maxHops; i++) {
    try {
      const response = await fetch(currentUrl, { redirect: 'manual' });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;

        const nextUrl = new URL(location, currentUrl).toString();

        if (chain.includes(nextUrl)) {
          isLoop = true;
          chain.push(nextUrl);
          break;
        }

        chain.push(nextUrl);
        currentUrl = nextUrl;
      } else {
        // Final destination reached
        break;
      }
    } catch (error) {
      chain.push(`ERROR: ${error}`);
      break;
    }
  }

  return {
    originalUrl: url,
    finalUrl: currentUrl,
    chain,
    chainLength: chain.length - 1,
    isLoop,
    status: isLoop ? 'loop' : chain.length > 2 ? 'chain' : 'ok',
  };
}

async function auditRedirects(urls: string[]): Promise<RedirectResult[]> {
  const results: RedirectResult[] = [];

  for (const url of urls) {
    const result = await checkRedirectChain(url);
    if (result.status !== 'ok') {
      results.push(result);
      console.log(
        `${result.status.toUpperCase()}: ${result.originalUrl} -> ${result.chain.join(' -> ')}`
      );
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

export { checkRedirectChain, auditRedirects };
```

#### 10.3 Server Errors (5xx)

**At scale, even 0.1% 5xx rate = 100 error pages on a 100k site.**

**Common causes for the stack**:
- Supabase connection pool exhaustion during heavy crawling
- Astro build timeout on pages with complex data queries
- Next.js ISR revalidation failures when the database is under load
- CDN origin timeout when the build server is busy

**Monitoring**:
```typescript
// scripts/gsc/server-error-monitor.ts
// Monitors server access logs for 5xx responses to Googlebot

import { createClient } from '@supabase/supabase-js';

interface ServerErrorAlert {
  timestamp: string;
  url: string;
  statusCode: number;
  responseTimeMs: number;
  userAgent: string;
}

async function checkServerHealthForGooglebot(
  accessLogPath: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  total5xx: number;
  errorRate: number;
  errors: ServerErrorAlert[];
}> {
  const fs = await import('fs');
  const readline = await import('readline');

  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileStream = fs.createReadStream(accessLogPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let totalGooglebotRequests = 0;
  let total5xx = 0;
  const errors: ServerErrorAlert[] = [];

  for await (const line of rl) {
    if (!line.includes('Googlebot')) continue;
    totalGooglebotRequests++;

    const statusMatch = line.match(/"\s+(\d{3})\s+/);
    if (!statusMatch) continue;

    const statusCode = parseInt(statusMatch[1]);
    if (statusCode >= 500) {
      total5xx++;
      errors.push({
        timestamp: new Date().toISOString(),
        url: extractUrlFromLog(line),
        statusCode,
        responseTimeMs: extractResponseTime(line),
        userAgent: 'Googlebot',
      });
    }
  }

  const errorRate = totalGooglebotRequests > 0
    ? total5xx / totalGooglebotRequests
    : 0;

  // Store errors in Supabase for tracking
  if (errors.length > 0) {
    await supabase.from('gsc_server_errors').insert(
      errors.map(e => ({
        ...e,
        detected_at: new Date().toISOString(),
      }))
    );
  }

  // Alert if error rate exceeds threshold
  if (errorRate > 0.001) { // > 0.1%
    console.error(
      `ALERT: Googlebot 5xx error rate is ${(errorRate * 100).toFixed(2)}% ` +
      `(${total5xx}/${totalGooglebotRequests} requests)`
    );
  }

  return { total5xx, errorRate, errors };
}

function extractUrlFromLog(line: string): string {
  const match = line.match(/"(?:GET|POST|HEAD)\s+(\S+)/);
  return match ? match[1] : 'unknown';
}

function extractResponseTime(line: string): number {
  const match = line.match(/(\d+)$/);
  return match ? parseInt(match[1]) / 1000 : 0;
}

export { checkServerHealthForGooglebot };
```

#### 10.4 Duplicate Content Flags

**The #1 risk for programmatic SEO.** When you generate 100k pages from templates, Google may see many of them as duplicates.

**Types of duplication**:
1. **Cross-city duplication**: "Plumbing repair in Austin" vs "Plumbing repair in Round Rock" with identical content except the city name
2. **Cross-service duplication**: "Emergency plumbing in Austin" vs "24/7 plumbing in Austin" — different slugs, same content
3. **Canonical conflicts**: Google chooses a different canonical than the one you specified

**Prevention strategies**:
- **Unique content per page**: Each service+city combo must have genuinely unique content — local regulations, pricing, service area details, local landmarks/neighborhoods
- **Canonical tags**: Every page must have a self-referencing canonical tag
- **Content similarity threshold**: Before publishing, compute text similarity between pages. If > 80% similar, don't publish or enhance the thinner page
- **Consolidate thin pages**: Better to have 10k high-quality pages than 100k thin duplicates

```typescript
// scripts/seo/duplicate-content-checker.ts
// Checks content similarity between programmatic pages

import { createHash } from 'crypto';

interface DuplicateReport {
  url1: string;
  url2: string;
  similarity: number;
  sharedShingles: number;
  totalShingles: number;
}

// Compute similarity using shingling (w-gram) approach
function computeSimilarity(text1: string, text2: string, shingleSize: number = 5): number {
  const shingles1 = getShingles(text1, shingleSize);
  const shingles2 = getShingles(text2, shingleSize);

  const intersection = new Set([...shingles1].filter(s => shingles2.has(s)));
  const union = new Set([...shingles1, ...shingles2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size; // Jaccard similarity
}

function getShingles(text: string, size: number): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const shingles = new Set<string>();

  for (let i = 0; i <= words.length - size; i++) {
    const shingle = words.slice(i, i + size).join(' ');
    shingles.add(createHash('md5').update(shingle).digest('hex').substring(0, 8));
  }

  return shingles;
}

// Check a batch of pages for cross-duplicates
async function checkBatchForDuplicates(
  pages: Array<{ url: string; content: string }>,
  threshold: number = 0.8
): Promise<DuplicateReport[]> {
  const duplicates: DuplicateReport[] = [];

  // Pre-compute shingles
  const pageShingles = pages.map(p => ({
    url: p.url,
    shingles: getShingles(p.content, 5),
  }));

  // Compare all pairs (O(n^2) — for large sets, use MinHash/LSH)
  for (let i = 0; i < pageShingles.length; i++) {
    for (let j = i + 1; j < pageShingles.length; j++) {
      const a = pageShingles[i];
      const b = pageShingles[j];

      const intersection = new Set([...a.shingles].filter(s => b.shingles.has(s)));
      const union = new Set([...a.shingles, ...b.shingles]);
      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      if (similarity >= threshold) {
        duplicates.push({
          url1: a.url,
          url2: b.url,
          similarity: Math.round(similarity * 1000) / 1000,
          sharedShingles: intersection.size,
          totalShingles: union.size,
        });
      }
    }
  }

  return duplicates;
}

export { computeSimilarity, checkBatchForDuplicates };
```

#### 10.5 Crawl Anomaly Detection

```typescript
// scripts/gsc/anomaly-detection.ts
// Detects anomalies in crawl patterns that may indicate issues

interface AnomalyAlert {
  type: 'crawl_drop' | 'crawl_spike' | 'error_spike' | 'response_time_spike' | 'index_drop';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
}

function detectAnomalies(
  dailyData: Array<{
    date: string;
    crawlRequests: number;
    avgResponseTimeMs: number;
    errorRate: number;
    indexedPages: number;
  }>
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  if (dailyData.length < 14) return alerts; // Need at least 2 weeks of data

  // Calculate rolling averages and standard deviations
  const recentData = dailyData.slice(-7);  // Last 7 days
  const baselineData = dailyData.slice(-30, -7);  // Previous 23 days

  const metrics = ['crawlRequests', 'avgResponseTimeMs', 'errorRate', 'indexedPages'] as const;

  for (const metric of metrics) {
    const baselineValues = baselineData.map(d => d[metric]);
    const recentValues = recentData.map(d => d[metric]);

    const baselineMean = mean(baselineValues);
    const baselineStd = standardDeviation(baselineValues);
    const recentMean = mean(recentValues);

    const zScore = baselineStd > 0 ? (recentMean - baselineMean) / baselineStd : 0;

    // Alert thresholds
    if (metric === 'crawlRequests' && zScore < -2) {
      alerts.push({
        type: 'crawl_drop',
        severity: zScore < -3 ? 'critical' : 'warning',
        message: `Crawl requests dropped significantly: ${recentMean.toFixed(0)}/day vs baseline ${baselineMean.toFixed(0)}/day`,
        metric,
        currentValue: recentMean,
        expectedValue: baselineMean,
        deviation: zScore,
      });
    }

    if (metric === 'crawlRequests' && zScore > 3) {
      alerts.push({
        type: 'crawl_spike',
        severity: 'info',
        message: `Unusual crawl spike: ${recentMean.toFixed(0)}/day vs baseline ${baselineMean.toFixed(0)}/day`,
        metric,
        currentValue: recentMean,
        expectedValue: baselineMean,
        deviation: zScore,
      });
    }

    if (metric === 'avgResponseTimeMs' && zScore > 2) {
      alerts.push({
        type: 'response_time_spike',
        severity: zScore > 3 ? 'critical' : 'warning',
        message: `Response times increasing: ${recentMean.toFixed(0)}ms vs baseline ${baselineMean.toFixed(0)}ms`,
        metric,
        currentValue: recentMean,
        expectedValue: baselineMean,
        deviation: zScore,
      });
    }

    if (metric === 'errorRate' && recentMean > 0.01 && zScore > 2) {
      alerts.push({
        type: 'error_spike',
        severity: recentMean > 0.05 ? 'critical' : 'warning',
        message: `Error rate spike: ${(recentMean * 100).toFixed(2)}% vs baseline ${(baselineMean * 100).toFixed(2)}%`,
        metric,
        currentValue: recentMean,
        expectedValue: baselineMean,
        deviation: zScore,
      });
    }

    if (metric === 'indexedPages' && zScore < -2) {
      alerts.push({
        type: 'index_drop',
        severity: zScore < -3 ? 'critical' : 'warning',
        message: `Indexed pages declining: ${recentMean.toFixed(0)} vs baseline ${baselineMean.toFixed(0)}`,
        metric,
        currentValue: recentMean,
        expectedValue: baselineMean,
        deviation: zScore,
      });
    }
  }

  return alerts;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  const avg = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squaredDiffs));
}

export { detectAnomalies, AnomalyAlert };
```

---

## 11. Automated GSC Monitoring Pipeline

### Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────┐
│  Cron Scheduler  │────>│  GSC Scripts  │────>│   Supabase     │
│  (GitHub Actions │     │  (TypeScript) │     │   (Storage)    │
│   or Vercel Cron)│     └──────┬───────┘     └────────┬───────┘
└─────────────────┘            │                       │
                               │                       │
                    ┌──────────▼──────────┐  ┌────────▼────────┐
                    │  Anomaly Detection  │  │  Payload CMS    │
                    │  Engine             │  │  Dashboard      │
                    └──────────┬──────────┘  └─────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Alert Dispatcher   │
                    │  (Slack / Email)    │
                    └─────────────────────┘
```

### Complete Monitoring Pipeline

```typescript
// scripts/gsc/monitoring-pipeline.ts
// Main orchestrator that runs all monitoring tasks on a schedule

import { runBatchInspection, SamplingConfig } from './batch-inspection';
import { fetchPerformanceByPageType, storePerformanceSnapshot } from './performance-tracker';
import { generateWeeklyReport, formatReportForSlack } from './weekly-report';
import { batchCWVCheck } from './cwv-monitor';
import { detectAnomalies, AnomalyAlert } from './anomaly-detection';
import { submitSitemaps, listAllSitemaps } from './submit-sitemaps';
import { createClient } from '@supabase/supabase-js';

interface PipelineConfig {
  sites: Array<{
    siteUrl: string;
    domain: string;
    sitemapIndexUrl: string;
    monitoringConfig?: {
      dailyInspectionQuota?: number;  // Per-site quota override (default: 2000)
    };
  }>;
  serviceAccountKeyPath: string;
  supabaseUrl: string;
  supabaseKey: string;
  cruxApiKey: string;
  slackWebhookUrl?: string;
  emailRecipients?: string[];
}

// Task definitions with schedules
type TaskName =
  | 'daily-performance-sync'
  | 'daily-url-inspection'
  | 'daily-sitemap-check'
  | 'daily-anomaly-detection'
  | 'weekly-cwv-check'
  | 'weekly-report';

interface TaskResult {
  task: TaskName;
  site: string;
  success: boolean;
  duration: number;
  alerts: AnomalyAlert[];
  summary: string;
}

async function runDailyPipeline(config: PipelineConfig): Promise<TaskResult[]> {
  const results: TaskResult[] = [];

  for (const site of config.sites) {
    console.log(`\n=== Processing ${site.domain} ===\n`);

    // Task 1: Sync performance data
    const perfStart = Date.now();
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3); // 3-day delay for final data
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1); // Sync 1 day at a time

      const perfData = await fetchPerformanceByPageType(
        {
          siteUrl: site.siteUrl,
          serviceAccountKeyPath: config.serviceAccountKeyPath,
          supabaseUrl: config.supabaseUrl,
          supabaseKey: config.supabaseKey,
        },
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      await storePerformanceSnapshot(
        {
          siteUrl: site.siteUrl,
          serviceAccountKeyPath: config.serviceAccountKeyPath,
          supabaseUrl: config.supabaseUrl,
          supabaseKey: config.supabaseKey,
        },
        endDate.toISOString().split('T')[0],
        perfData
      );

      const totalClicks = perfData.reduce((sum, p) => sum + p.clicks, 0);
      results.push({
        task: 'daily-performance-sync',
        site: site.domain,
        success: true,
        duration: Date.now() - perfStart,
        alerts: [],
        summary: `Synced ${perfData.length} page types, ${totalClicks} total clicks`,
      });
    } catch (error: any) {
      results.push({
        task: 'daily-performance-sync',
        site: site.domain,
        success: false,
        duration: Date.now() - perfStart,
        alerts: [{
          type: 'error_spike',
          severity: 'warning',
          message: `Performance sync failed: ${error.message}`,
          metric: 'pipeline',
          currentValue: 0,
          expectedValue: 1,
          deviation: 0,
        }],
        summary: `Failed: ${error.message}`,
      });
    }

    // Task 2: URL Inspection sampling
    const inspStart = Date.now();
    try {
      // Use per-site quota from monitoringConfig, default to 2000
      const dailyQuota = site.monitoringConfig?.dailyInspectionQuota ?? 2000;
      // Distribute quota proportionally across page types
      const inspectionConfig: SamplingConfig = {
        siteUrl: site.siteUrl,
        serviceAccountKeyPath: config.serviceAccountKeyPath,
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
        quotaAllocation: {
          service: Math.round(dailyQuota * 0.05),
          location: Math.round(dailyQuota * 0.10),
          combo: Math.round(dailyQuota * 0.60),
          blog: Math.round(dailyQuota * 0.15),
          static: Math.round(dailyQuota * 0.025),
          recheck: Math.round(dailyQuota * 0.075),
        },
      };

      const inspectionReport = await runBatchInspection(inspectionConfig);

      const indexRate = inspectionReport.totalInspected > 0
        ? (inspectionReport.totalIndexed / inspectionReport.totalInspected * 100).toFixed(1)
        : '0';

      const inspAlerts: AnomalyAlert[] = [];
      if (parseFloat(indexRate) < 70) {
        inspAlerts.push({
          type: 'index_drop',
          severity: 'critical',
          message: `Index rate is only ${indexRate}% from sample of ${inspectionReport.totalInspected} URLs`,
          metric: 'indexRate',
          currentValue: parseFloat(indexRate),
          expectedValue: 90,
          deviation: -2,
        });
      }

      results.push({
        task: 'daily-url-inspection',
        site: site.domain,
        success: true,
        duration: Date.now() - inspStart,
        alerts: inspAlerts,
        summary: `Inspected ${inspectionReport.totalInspected} URLs, ${indexRate}% indexed`,
      });
    } catch (error: any) {
      results.push({
        task: 'daily-url-inspection',
        site: site.domain,
        success: false,
        duration: Date.now() - inspStart,
        alerts: [],
        summary: `Failed: ${error.message}`,
      });
    }

    // Task 3: Sitemap health check
    const smStart = Date.now();
    try {
      const sitemaps = await listAllSitemaps(site.siteUrl, config.serviceAccountKeyPath);
      const smAlerts: AnomalyAlert[] = [];

      for (const sm of sitemaps) {
        if (sm.errors && sm.errors > 0) {
          smAlerts.push({
            type: 'error_spike',
            severity: 'warning',
            message: `Sitemap ${sm.path} has ${sm.errors} errors`,
            metric: 'sitemapErrors',
            currentValue: sm.errors,
            expectedValue: 0,
            deviation: 0,
          });
        }

        // Check for large gap between submitted and indexed
        for (const content of sm.contents || []) {
          if (content.submitted && content.indexed) {
            const indexRate = (parseInt(content.indexed) / parseInt(content.submitted)) * 100;
            if (indexRate < 50) {
              smAlerts.push({
                type: 'index_drop',
                severity: 'warning',
                message: `Sitemap ${sm.path}: only ${indexRate.toFixed(0)}% indexed (${content.indexed}/${content.submitted})`,
                metric: 'sitemapIndexRate',
                currentValue: indexRate,
                expectedValue: 90,
                deviation: -2,
              });
            }
          }
        }
      }

      results.push({
        task: 'daily-sitemap-check',
        site: site.domain,
        success: true,
        duration: Date.now() - smStart,
        alerts: smAlerts,
        summary: `Checked ${sitemaps.length} sitemaps`,
      });
    } catch (error: any) {
      results.push({
        task: 'daily-sitemap-check',
        site: site.domain,
        success: false,
        duration: Date.now() - smStart,
        alerts: [],
        summary: `Failed: ${error.message}`,
      });
    }
  }

  // Dispatch alerts
  const allAlerts = results.flatMap(r =>
    r.alerts.map(a => ({ ...a, site: r.site, task: r.task }))
  );

  if (allAlerts.length > 0 && config.slackWebhookUrl) {
    await sendSlackAlerts(config.slackWebhookUrl, allAlerts);
  }

  return results;
}

async function runWeeklyPipeline(config: PipelineConfig): Promise<TaskResult[]> {
  const results: TaskResult[] = [];

  for (const site of config.sites) {
    // Task 1: CWV check
    const cwvStart = Date.now();
    try {
      // Sample representative pages from each template type
      const supabase = createClient(config.supabaseUrl, config.supabaseKey);

      const { data: samplePages } = await supabase
        .from('pages')
        .select('url, page_type')
        .eq('site_domain', site.domain)
        .eq('status', 'published')
        .limit(50); // Check 50 representative pages

      const urls = (samplePages || []).map(p => p.url);
      const cwvResults = await batchCWVCheck(urls, config.cruxApiKey);

      const failing = cwvResults.filter(r => r.overallCategory === 'SLOW');
      const cwvAlerts: AnomalyAlert[] = [];

      if (failing.length > urls.length * 0.2) {
        cwvAlerts.push({
          type: 'response_time_spike',
          severity: 'warning',
          message: `${failing.length}/${urls.length} sampled pages failing CWV`,
          metric: 'cwv',
          currentValue: failing.length,
          expectedValue: 0,
          deviation: 0,
        });
      }

      results.push({
        task: 'weekly-cwv-check',
        site: site.domain,
        success: true,
        duration: Date.now() - cwvStart,
        alerts: cwvAlerts,
        summary: `${cwvResults.filter(r => r.overallCategory === 'FAST').length}/${urls.length} pages passing CWV`,
      });
    } catch (error: any) {
      results.push({
        task: 'weekly-cwv-check',
        site: site.domain,
        success: false,
        duration: Date.now() - cwvStart,
        alerts: [],
        summary: `Failed: ${error.message}`,
      });
    }

    // Task 2: Weekly performance report
    const reportStart = Date.now();
    try {
      const report = await generateWeeklyReport({
        siteUrl: site.siteUrl,
        serviceAccountKeyPath: config.serviceAccountKeyPath,
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
      });

      if (config.slackWebhookUrl) {
        await sendSlackMessage(config.slackWebhookUrl, formatReportForSlack(report));
      }

      results.push({
        task: 'weekly-report',
        site: site.domain,
        success: true,
        duration: Date.now() - reportStart,
        alerts: report.alerts.map(a => ({
          type: 'index_drop' as const,
          severity: 'warning' as const,
          message: a,
          metric: 'performance',
          currentValue: 0,
          expectedValue: 0,
          deviation: 0,
        })),
        summary: `Report generated: ${report.summary.totalClicks} clicks, ${report.alerts.length} alerts`,
      });
    } catch (error: any) {
      results.push({
        task: 'weekly-report',
        site: site.domain,
        success: false,
        duration: Date.now() - reportStart,
        alerts: [],
        summary: `Failed: ${error.message}`,
      });
    }
  }

  return results;
}

// Slack integration
async function sendSlackAlerts(
  webhookUrl: string,
  alerts: Array<AnomalyAlert & { site: string; task: string }>
) {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  const blocks = [];

  if (criticalAlerts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*CRITICAL ALERTS (${criticalAlerts.length})*`,
      },
    });
    for (const alert of criticalAlerts) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `[${alert.site}] ${alert.message}`,
        },
      });
    }
  }

  if (warningAlerts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Warnings (${warningAlerts.length})*`,
      },
    });
    for (const alert of warningAlerts) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `[${alert.site}] ${alert.message}`,
        },
      });
    }
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

async function sendSlackMessage(webhookUrl: string, text: string) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export { runDailyPipeline, runWeeklyPipeline, PipelineConfig };
```

### GitHub Actions Cron Schedule

```yaml
# .github/workflows/gsc-monitoring.yml
name: GSC Monitoring Pipeline

on:
  schedule:
    # Daily pipeline at 6 AM UTC
    - cron: '0 6 * * *'
    # Weekly pipeline on Mondays at 8 AM UTC
    - cron: '0 8 * * 1'
  workflow_dispatch:
    inputs:
      pipeline:
        description: 'Pipeline to run'
        required: true
        default: 'daily'
        type: choice
        options:
          - daily
          - weekly

jobs:
  daily-monitoring:
    if: github.event.schedule == '0 6 * * *' || github.event.inputs.pipeline == 'daily'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Write service account key
        run: echo '${{ secrets.GSC_SERVICE_ACCOUNT_KEY }}' > /tmp/gsc-key.json

      - name: Run daily pipeline
        env:
          GSC_SERVICE_ACCOUNT_KEY_PATH: /tmp/gsc-key.json
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: npx tsx scripts/gsc/run-daily.ts

      - name: Cleanup
        if: always()
        run: rm -f /tmp/gsc-key.json

  weekly-reporting:
    if: github.event.schedule == '0 8 * * 1' || github.event.inputs.pipeline == 'weekly'
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Write service account key
        run: echo '${{ secrets.GSC_SERVICE_ACCOUNT_KEY }}' > /tmp/gsc-key.json

      - name: Run weekly pipeline
        env:
          GSC_SERVICE_ACCOUNT_KEY_PATH: /tmp/gsc-key.json
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          CRUX_API_KEY: ${{ secrets.CRUX_API_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: npx tsx scripts/gsc/run-weekly.ts

      - name: Cleanup
        if: always()
        run: rm -f /tmp/gsc-key.json
```

### Pipeline Entry Point Scripts

```typescript
// scripts/gsc/run-daily.ts
import { runDailyPipeline, PipelineConfig } from './monitoring-pipeline';

const config: PipelineConfig = {
  sites: JSON.parse(process.env.GSC_SITES || '[]'),
  serviceAccountKeyPath: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_KEY!,
  cruxApiKey: process.env.CRUX_API_KEY || '',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
};

// If no sites configured via env, use defaults
if (config.sites.length === 0) {
  // Load from Supabase or config file
  console.error('No sites configured. Set GSC_SITES env variable.');
  process.exit(1);
}

runDailyPipeline(config)
  .then(results => {
    console.log('\n=== Pipeline Complete ===\n');
    for (const r of results) {
      const status = r.success ? 'OK' : 'FAIL';
      console.log(`[${status}] ${r.site} / ${r.task}: ${r.summary} (${r.duration}ms)`);
    }

    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Pipeline failed:', error);
    process.exit(1);
  });
```

---

## 12. Multi-Site GSC Management for Agencies

### The Challenge

An agency managing 10-50+ client sites needs:
- Centralized visibility across all properties
- Per-client access controls
- Aggregated reporting for agency dashboards
- Efficient use of API quotas across all sites

### Service Account Strategy

**Option A: One service account per agency** (recommended for < 20 sites)
- Single service account added as owner to all client GSC properties
- Simpler credential management
- Shared API quota across all sites

**Option B: One service account per client** (recommended for 20+ sites or for billing isolation)
- Each client gets their own Google Cloud project and service account
- Separate API quotas per client
- More complex but better isolation

### Multi-Site Configuration

```typescript
// config/gsc-sites.ts
// Central configuration for all managed GSC properties

export interface GSCSiteConfig {
  id: string;               // Internal identifier
  clientName: string;
  domain: string;
  gscPropertyUrl: string;   // "sc-domain:example.com" or "https://www.example.com/"
  propertyType: 'DOMAIN' | 'URL_PREFIX';
  industry: string;         // "plumbing", "hvac", "electrical", etc.
  totalPages: number;       // Approximate total programmatic pages
  sitemapIndexUrl: string;
  serviceAccountKeyPath: string;  // Path to the service account JSON key
  notificationChannels: {
    slack?: string;          // Slack channel webhook URL
    email?: string[];        // Email recipients
  };
  // Page classification rules (regex patterns to URL path)
  pageTypeRules: Array<{
    type: string;
    pattern: string;       // Regex pattern
  }>;
  // Monitoring config overrides
  monitoring: {
    dailyInspectionQuota: number;  // How many URLs to inspect per day
    cwvCheckFrequency: 'daily' | 'weekly' | 'monthly';
    performanceSyncEnabled: boolean;
    alertThresholds: {
      indexRateWarning: number;    // e.g., 80
      indexRateCritical: number;   // e.g., 60
      clicksDropWarning: number;   // e.g., 20 (percent)
      clicksDropCritical: number;  // e.g., 50 (percent)
    };
  };
}

export const gscSites: GSCSiteConfig[] = [
  {
    id: 'client-ace-plumbing',
    clientName: 'Ace Plumbing',
    domain: 'aceplumbing.com',
    gscPropertyUrl: 'sc-domain:aceplumbing.com',
    propertyType: 'DOMAIN',
    industry: 'plumbing',
    totalPages: 150000,
    sitemapIndexUrl: 'https://www.aceplumbing.com/sitemap-index.xml',
    serviceAccountKeyPath: './secrets/gsc-agency-sa.json',
    notificationChannels: {
      slack: 'https://hooks.slack.com/services/xxx/yyy/zzz',
      email: ['seo@agency.com', 'client@aceplumbing.com'],
    },
    pageTypeRules: [
      { type: 'service', pattern: '/services/[^/]+/$' },
      { type: 'location', pattern: '/[a-z-]+/[a-z-]+/$' },
      { type: 'combo', pattern: '/[a-z-]+/[a-z-]+/[a-z-]+/$' },
      { type: 'blog', pattern: '/blog/' },
    ],
    monitoring: {
      dailyInspectionQuota: 1500,
      cwvCheckFrequency: 'weekly',
      performanceSyncEnabled: true,
      alertThresholds: {
        indexRateWarning: 80,
        indexRateCritical: 60,
        clicksDropWarning: 20,
        clicksDropCritical: 50,
      },
    },
  },
  // ... more client configs
];
```

### Aggregated Agency Dashboard Queries

```sql
-- Supabase SQL for agency-wide dashboard

-- 1. Cross-site performance comparison (last 7 days)
SELECT
  gs.site_url,
  SUM(gs.clicks) AS total_clicks,
  SUM(gs.impressions) AS total_impressions,
  ROUND(AVG(gs.ctr) * 100, 2) AS avg_ctr_pct,
  ROUND(AVG(gs.position), 1) AS avg_position
FROM gsc_performance_snapshots gs
WHERE gs.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY gs.site_url
ORDER BY total_clicks DESC;

-- 2. Index health across all sites
SELECT
  site_url,
  MAX(date) AS last_checked,
  MAX(CASE WHEN date = (SELECT MAX(date) FROM gsc_coverage_snapshots s2 WHERE s2.site_url = gsc_coverage_snapshots.site_url) THEN index_rate END) AS current_index_rate,
  MAX(CASE WHEN date = (SELECT MAX(date) FROM gsc_coverage_snapshots s2 WHERE s2.site_url = gsc_coverage_snapshots.site_url) THEN total_indexed END) AS current_indexed,
  MAX(CASE WHEN date = (SELECT MAX(date) FROM gsc_coverage_snapshots s2 WHERE s2.site_url = gsc_coverage_snapshots.site_url) THEN total_errors END) AS current_errors
FROM gsc_coverage_snapshots
GROUP BY site_url
ORDER BY current_index_rate ASC;  -- Worst performers first

-- 3. Sites with active alerts
SELECT
  site_url,
  alert_type,
  severity,
  message,
  created_at
FROM gsc_alerts
WHERE resolved_at IS NULL
  AND severity IN ('critical', 'warning')
ORDER BY
  CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
  created_at DESC;
```

### Payload CMS Collection for Multi-Site Management

```typescript
// payload/collections/GSCSites.ts
import type { CollectionConfig } from 'payload';

export const GSCSites: CollectionConfig = {
  slug: 'gsc-sites',
  admin: {
    group: 'SEO Monitoring',
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'domain', 'industry', 'status', 'lastSynced'],
  },
  access: {
    // Agency admins can see all sites
    // Client users can only see their own sites
    read: ({ req: { user } }) => {
      if (user?.role === 'agency-admin') return true;
      return {
        'clientUsers.user': { equals: user?.id },
      };
    },
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'gscPropertyUrl',
      type: 'text',
      required: true,
      admin: { description: 'e.g., sc-domain:example.com' },
    },
    {
      name: 'propertyType',
      type: 'select',
      required: true,
      options: [
        { label: 'Domain Property', value: 'DOMAIN' },
        { label: 'URL-Prefix Property', value: 'URL_PREFIX' },
      ],
    },
    {
      name: 'industry',
      type: 'select',
      options: [
        { label: 'Plumbing', value: 'plumbing' },
        { label: 'HVAC', value: 'hvac' },
        { label: 'Electrical', value: 'electrical' },
        { label: 'Roofing', value: 'roofing' },
        { label: 'Pest Control', value: 'pest-control' },
        { label: 'Landscaping', value: 'landscaping' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'totalPages',
      type: 'number',
      admin: { description: 'Approximate total programmatic pages' },
    },
    {
      name: 'sitemapIndexUrl',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Setup', value: 'setup' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'lastSynced',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'clientUsers',
      type: 'array',
      admin: { description: 'Users who can access this site data' },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Viewer', value: 'viewer' },
            { label: 'Editor', value: 'editor' },
          ],
        },
      ],
    },
    {
      name: 'monitoringConfig',
      type: 'group',
      fields: [
        {
          name: 'dailyInspectionQuota',
          type: 'number',
          defaultValue: 1500,
        },
        {
          name: 'cwvCheckFrequency',
          type: 'select',
          defaultValue: 'weekly',
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
        },
        {
          name: 'alertThresholds',
          type: 'group',
          fields: [
            { name: 'indexRateWarning', type: 'number', defaultValue: 80 },
            { name: 'indexRateCritical', type: 'number', defaultValue: 60 },
            { name: 'clicksDropWarning', type: 'number', defaultValue: 20 },
            { name: 'clicksDropCritical', type: 'number', defaultValue: 50 },
          ],
        },
      ],
    },
    {
      name: 'notificationChannels',
      type: 'group',
      fields: [
        { name: 'slackWebhookUrl', type: 'text' },
        {
          name: 'emailRecipients',
          type: 'array',
          fields: [{ name: 'email', type: 'email' }],
        },
      ],
    },
    // Quick stats (updated by monitoring pipeline)
    {
      name: 'latestStats',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'totalIndexed', type: 'number' },
        { name: 'indexRate', type: 'number' },
        { name: 'weeklyClicks', type: 'number' },
        { name: 'weeklyImpressions', type: 'number' },
        { name: 'avgPosition', type: 'number' },
        { name: 'cwvStatus', type: 'select', options: ['FAST', 'AVERAGE', 'SLOW', 'NO_DATA'] },
        { name: 'activeAlerts', type: 'number' },
      ],
    },
  ],
  timestamps: true,
};
```

### User Permissions Model

```typescript
// payload/access/gsc-permissions.ts

// Agency roles:
// - agency-admin: Full access to all sites, can manage users
// - agency-seo: Can view all sites, edit SEO settings
// - client-owner: Can view their own site(s) only
// - client-viewer: Read-only access to their own site(s)

export const gscAccessControl = {
  // Can the user view GSC data for a specific site?
  canViewSiteData: (user: any, siteId: string): boolean => {
    if (!user) return false;
    if (['agency-admin', 'agency-seo'].includes(user.role)) return true;
    // Check if user is assigned to this site
    return user.assignedSites?.includes(siteId) || false;
  },

  // Can the user modify GSC settings for a site?
  canEditSiteSettings: (user: any, siteId: string): boolean => {
    if (!user) return false;
    if (user.role === 'agency-admin') return true;
    return false;
  },

  // Can the user trigger manual actions (resubmit sitemaps, etc.)?
  canTriggerActions: (user: any): boolean => {
    if (!user) return false;
    return ['agency-admin', 'agency-seo'].includes(user.role);
  },
};
```

---

## 13. IndexNow Integration Alongside GSC

### What is IndexNow?

IndexNow is a protocol that allows websites to instantly notify search engines about URL changes. Unlike waiting for crawlers to discover changes, IndexNow pushes notifications proactively.

**Supported engines**: Bing, Yandex, Seznam, Naver (NOT Google — Google uses its own Indexing API for limited use cases)

**Why use it alongside GSC**: IndexNow handles Bing/Yandex/others, while GSC sitemap submission and the Indexing API handle Google. Together, they cover all major engines.

### IndexNow Implementation

```typescript
// scripts/indexnow/submit.ts
import { createHash, randomBytes } from 'crypto';

interface IndexNowConfig {
  host: string;              // e.g., "www.example.com"
  apiKey: string;            // Your IndexNow API key
  keyLocation?: string;      // URL where the key file is hosted
}

// Generate an IndexNow API key
function generateIndexNowKey(): string {
  return randomBytes(16).toString('hex');
}

// Submit a single URL
async function submitUrl(config: IndexNowConfig, url: string): Promise<boolean> {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: config.host,
      key: config.apiKey,
      keyLocation: config.keyLocation || `https://${config.host}/${config.apiKey}.txt`,
      urlList: [url],
    }),
  });

  // 200 = URL received AND validated against the key
  // 202 = URL received but key validation is still pending
  if (response.status === 202) {
    console.warn(`IndexNow: 202 response for ${url} — key validation pending, submission may not be processed`);
  }
  return response.status === 200 || response.status === 202;
}

// Submit URLs in batch (max 10,000 per request)
async function submitBatch(
  config: IndexNowConfig,
  urls: string[]
): Promise<{ submitted: number; failed: number; batches: number }> {
  const BATCH_SIZE = 10000;
  let submitted = 0;
  let failed = 0;
  let batches = 0;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    batches++;

    try {
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.host,
          key: config.apiKey,
          keyLocation: config.keyLocation || `https://${config.host}/${config.apiKey}.txt`,
          urlList: batch,
        }),
      });

      if (response.status === 200 || response.status === 202) {
        submitted += batch.length;
      } else {
        failed += batch.length;
        console.error(
          `IndexNow batch ${batches} failed: ${response.status} ${await response.text()}`
        );
      }
    } catch (error) {
      failed += batch.length;
      console.error(`IndexNow batch ${batches} error:`, error);
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { submitted, failed, batches };
}

export { generateIndexNowKey, submitUrl, submitBatch, IndexNowConfig };
```

### Payload CMS Hook for Automatic IndexNow Submission

```typescript
// payload/hooks/indexnow-on-publish.ts
// Automatically submits URLs to IndexNow when content is published or updated

import type { CollectionAfterChangeHook } from 'payload';
import { submitUrl, IndexNowConfig } from '../../scripts/indexnow/submit';

const indexNowConfig: IndexNowConfig = {
  host: process.env.SITE_DOMAIN || 'www.example.com',
  apiKey: process.env.INDEXNOW_API_KEY || '',
};

export const indexNowOnPublish: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  collection,
}) => {
  // Only submit on publish (not draft saves)
  if (doc.status !== 'published') return doc;

  // Only submit if this is a new publish or content changed
  if (operation === 'update' && previousDoc?.status === 'published') {
    // Check if content actually changed
    const contentChanged = doc.updatedAt !== previousDoc.updatedAt;
    if (!contentChanged) return doc;
  }

  // Build the URL based on collection slug and doc data
  const url = buildUrlForDoc(collection.slug, doc);
  if (!url) return doc;

  try {
    const success = await submitUrl(indexNowConfig, url);
    if (success) {
      console.log(`IndexNow: Submitted ${url}`);
    } else {
      console.warn(`IndexNow: Failed to submit ${url}`);
    }
  } catch (error) {
    // Don't block publish on IndexNow failure
    console.error(`IndexNow: Error submitting ${url}:`, error);
  }

  return doc;
};

function buildUrlForDoc(collectionSlug: string, doc: any): string | null {
  const baseUrl = `https://${process.env.SITE_DOMAIN || 'www.example.com'}`;

  switch (collectionSlug) {
    case 'services':
      return `${baseUrl}/services/${doc.slug}/`;
    case 'locations':
      return `${baseUrl}/${doc.stateSlug}/${doc.citySlug}/`;
    case 'service-locations':
      return `${baseUrl}/${doc.stateSlug}/${doc.citySlug}/${doc.serviceSlug}/`;
    case 'blog-posts':
      return `${baseUrl}/blog/${doc.slug}/`;
    default:
      return null;
  }
}
```

### Google Indexing API (Complementary to IndexNow)

The Google Indexing API is separate from IndexNow and works specifically with Google. However, it's officially only supported for `JobPosting` and `BroadcastEvent` structured data types. In practice, many SEO practitioners use it for general pages — Google will accept the request but doesn't guarantee faster indexing for non-supported types.

```typescript
// scripts/google-indexing/submit.ts
import { google } from 'googleapis';

async function submitToGoogleIndexingAPI(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED',
  serviceAccountKeyPath: string
): Promise<boolean> {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const indexing = google.indexing({ version: 'v3', auth });

  try {
    await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type,
      },
    });
    return true;
  } catch (error: any) {
    console.error(`Google Indexing API error for ${url}: ${error.message}`);
    return false;
  }
}

// Batch submit with rate limiting (API quota: 200 requests/day)
async function batchSubmitToGoogle(
  urls: string[],
  serviceAccountKeyPath: string
): Promise<{ submitted: number; failed: number }> {
  let submitted = 0;
  let failed = 0;

  // Respect 200/day quota
  const urlsToSubmit = urls.slice(0, 200);

  for (const url of urlsToSubmit) {
    const success = await submitToGoogleIndexingAPI(
      url,
      'URL_UPDATED',
      serviceAccountKeyPath
    );
    if (success) submitted++;
    else failed++;

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { submitted, failed };
}

export { submitToGoogleIndexingAPI, batchSubmitToGoogle };
```

### Combined Notification Strategy

```
┌──────────────────────────────────────────────────────┐
│                 Content Published                     │
│              (Payload CMS afterChange)                │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
  ┌──────────┐ ┌────────┐ ┌──────────────────┐
  │ IndexNow │ │ Google │ │ GSC Sitemap      │
  │ (Bing,   │ │ Index  │ │ Re-submission    │
  │  Yandex) │ │ API    │ │ (ping)           │
  └──────────┘ └────────┘ └──────────────────┘
       │            │              │
       ▼            ▼              ▼
  Bing indexes  Google may    Google re-crawls
  within hours  prioritize    sitemap within
                crawl         hours/days
```

### IndexNow Key File Setup

The IndexNow key file must be hosted at your site root. For Astro:

```
public/{your-api-key}.txt
```

Content of the file is just the key itself:
```
your-api-key-here
```

For Astro, this file goes in `public/` and is served as-is. For Next.js, place it in `public/` as well.

---

## 14. Search Analytics API

### API Overview

The Search Analytics API (part of the Search Console API) lets you query performance data programmatically. It's the API behind the Performance report in the GSC UI.

**Base endpoint**: `https://searchconsole.googleapis.com/v1/`

**Key limits**:
- **25,000 rows per request** — Use pagination (`startRow`) for larger datasets
- **Dimensions**: `date`, `query`, `page`, `country`, `device`, `searchAppearance`
- **Date range**: Up to 16 months of historical data
- **Data freshness**: ~3 days behind real-time
- **Rate limit**: Varies; typically 1,200 queries per minute per project

### Complete Search Analytics Client

```typescript
// scripts/gsc/search-analytics-client.ts
import { google, searchconsole_v1 } from 'googleapis';

type Dimension = 'date' | 'query' | 'page' | 'country' | 'device' | 'searchAppearance';
type SearchType = 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews';

interface QueryParams {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: Dimension[];
  searchType?: SearchType;
  dimensionFilterGroups?: Array<{
    groupType?: 'and';
    filters: Array<{
      dimension: Dimension;
      operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'includingRegex' | 'excludingRegex';
      expression: string;
    }>;
  }>;
  aggregationType?: 'auto' | 'byPage' | 'byProperty';
  rowLimit?: number;
  startRow?: number;
  dataState?: 'all' | 'final';
}

interface AnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

class SearchAnalyticsClient {
  private searchconsole: searchconsole_v1.Searchconsole;

  constructor(serviceAccountKeyPath: string) {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountKeyPath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    this.searchconsole = google.searchconsole({ version: 'v1', auth });
  }

  // Core query method with automatic pagination
  async query(params: QueryParams): Promise<AnalyticsRow[]> {
    const allRows: AnalyticsRow[] = [];
    const rowLimit = params.rowLimit || 25000;
    let startRow = params.startRow || 0;

    while (true) {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl: params.siteUrl,
        requestBody: {
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: params.dimensions,
          searchType: params.searchType || 'web',
          dimensionFilterGroups: params.dimensionFilterGroups,
          aggregationType: params.aggregationType || 'auto',
          rowLimit: Math.min(rowLimit, 25000),
          startRow,
          dataState: params.dataState || 'final',
        },
      });

      const rows = (response.data.rows || []).map(row => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      allRows.push(...rows);

      // If we got fewer than 25k rows or reached our limit, stop
      if (rows.length < 25000 || allRows.length >= rowLimit) break;

      startRow += 25000;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allRows;
  }

  // Convenience: Get top queries for a specific page type
  async getTopQueriesByPageType(
    siteUrl: string,
    startDate: string,
    endDate: string,
    urlPattern: string,  // Regex pattern for page type
    limit: number = 1000
  ): Promise<AnalyticsRow[]> {
    return this.query({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator: 'includingRegex',
          expression: urlPattern,
        }],
      }],
    });
  }

  // Convenience: Get daily performance trend
  async getDailyTrend(
    siteUrl: string,
    startDate: string,
    endDate: string,
    urlPattern?: string
  ): Promise<AnalyticsRow[]> {
    const params: QueryParams = {
      siteUrl,
      startDate,
      endDate,
      dimensions: ['date'],
    };

    if (urlPattern) {
      params.dimensionFilterGroups = [{
        filters: [{
          dimension: 'page',
          operator: 'includingRegex',
          expression: urlPattern,
        }],
      }];
    }

    return this.query(params);
  }

  // Convenience: Get performance by country
  async getPerformanceByCountry(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsRow[]> {
    return this.query({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['country'],
    });
  }

  // Convenience: Get performance by device
  async getPerformanceByDevice(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsRow[]> {
    return this.query({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['device'],
    });
  }

  // Find keyword opportunities: queries with high impressions but low CTR
  async findKeywordOpportunities(
    siteUrl: string,
    startDate: string,
    endDate: string,
    minImpressions: number = 100,
    maxPosition: number = 20
  ): Promise<Array<AnalyticsRow & { opportunity: string }>> {
    const rows = await this.query({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 25000,
    });

    return rows
      .filter(r => r.impressions >= minImpressions && r.position <= maxPosition && r.ctr < 0.05)
      .map(r => ({
        ...r,
        opportunity: r.position <= 3
          ? 'Low CTR despite top-3 position — improve title/description'
          : r.position <= 10
            ? 'Page 1 with low CTR — optimize meta tags'
            : 'Page 2 with impressions — push to page 1 with content improvements',
      }))
      .sort((a, b) => b.impressions - a.impressions);
  }

  // Detect query cannibalization: multiple pages ranking for the same query
  async detectCannibalization(
    siteUrl: string,
    startDate: string,
    endDate: string,
    minImpressions: number = 50
  ): Promise<Array<{
    query: string;
    pages: Array<{ url: string; clicks: number; impressions: number; position: number }>;
    recommendation: string;
  }>> {
    const rows = await this.query({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 25000,
    });

    // Group by query
    const queryGroups = new Map<string, typeof rows>();
    for (const row of rows) {
      const query = row.keys[0];
      if (!queryGroups.has(query)) queryGroups.set(query, []);
      queryGroups.get(query)!.push(row);
    }

    const cannibalized = [];
    for (const [query, pages] of queryGroups) {
      if (pages.length < 2) continue;

      const totalImpressions = pages.reduce((sum, p) => sum + p.impressions, 0);
      if (totalImpressions < minImpressions) continue;

      // Check if pages are from different templates (genuine cannibalization)
      const urls = pages.map(p => p.keys[1]);
      const uniqueTypes = new Set(urls.map(u => classifyUrl(u)));

      if (uniqueTypes.size > 1 || pages.length >= 3) {
        cannibalized.push({
          query,
          pages: pages
            .map(p => ({
              url: p.keys[1],
              clicks: p.clicks,
              impressions: p.impressions,
              position: p.position,
            }))
            .sort((a, b) => b.clicks - a.clicks),
          recommendation: uniqueTypes.size > 1
            ? 'Different page types ranking for same query — consolidate or differentiate content'
            : 'Multiple pages of same type competing — consider canonical consolidation',
        });
      }
    }

    return cannibalized.sort((a, b) =>
      b.pages.reduce((s, p) => s + p.impressions, 0) -
      a.pages.reduce((s, p) => s + p.impressions, 0)
    );
  }

  // List all managed sites
  async listSites(): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
    const response = await this.searchconsole.sites.list();
    return (response.data.siteEntry || []).map(site => ({
      siteUrl: site.siteUrl || '',
      permissionLevel: site.permissionLevel || 'unknown',
    }));
  }
}

function classifyUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    if (path.includes('/blog/')) return 'blog';
    if (/\/[a-z-]+\/[a-z-]+\/[a-z-]+\/$/.test(path)) return 'combo';
    if (/\/[a-z-]+\/[a-z-]+\/$/.test(path)) return 'location';
    if (path.includes('/services/')) return 'service';
    return 'static';
  } catch {
    return 'unknown';
  }
}

export { SearchAnalyticsClient, QueryParams, AnalyticsRow, Dimension, SearchType };
```

### Building a Custom Dashboard API

```typescript
// pages/api/gsc-dashboard.ts (Next.js API route for the agency dashboard)
import type { NextApiRequest, NextApiResponse } from 'next';
import { SearchAnalyticsClient } from '../../scripts/gsc/search-analytics-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action, siteUrl, startDate, endDate, pageType } = req.query;

  // Auth check (middleware handles this in production)
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const client = new SearchAnalyticsClient(process.env.GSC_SERVICE_ACCOUNT_KEY_PATH!);

  try {
    switch (action) {
      case 'overview': {
        // Get aggregate performance for all page types
        const [performance, coverage, cwv] = await Promise.all([
          supabase
            .from('gsc_performance_snapshots')
            .select('*')
            .eq('site_url', siteUrl)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false }),
          supabase
            .from('gsc_coverage_snapshots')
            .select('*')
            .eq('siteUrl', siteUrl)
            .order('date', { ascending: false })
            .limit(1),
          supabase
            .from('gsc-core-web-vitals')
            .select('*')
            .eq('siteUrl', siteUrl)
            .order('checkedAt', { ascending: false })
            .limit(10),
        ]);

        return res.json({
          performance: performance.data,
          coverage: coverage.data?.[0],
          cwv: cwv.data,
        });
      }

      case 'top-queries': {
        const urlPattern = getUrlPatternForPageType(pageType as string);
        const queries = await client.getTopQueriesByPageType(
          siteUrl as string,
          startDate as string,
          endDate as string,
          urlPattern
        );
        return res.json({ queries });
      }

      case 'trend': {
        const urlPattern = pageType
          ? getUrlPatternForPageType(pageType as string)
          : undefined;
        const trend = await client.getDailyTrend(
          siteUrl as string,
          startDate as string,
          endDate as string,
          urlPattern
        );
        return res.json({ trend });
      }

      case 'opportunities': {
        const opportunities = await client.findKeywordOpportunities(
          siteUrl as string,
          startDate as string,
          endDate as string
        );
        return res.json({ opportunities: opportunities.slice(0, 50) });
      }

      case 'cannibalization': {
        const cannibalized = await client.detectCannibalization(
          siteUrl as string,
          startDate as string,
          endDate as string
        );
        return res.json({ cannibalized: cannibalized.slice(0, 30) });
      }

      case 'sites': {
        const sites = await client.listSites();
        return res.json({ sites });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function getUrlPatternForPageType(pageType: string): string {
  switch (pageType) {
    case 'service': return '/services/[a-z-]+/$';
    case 'location': return '/[a-z-]+/[a-z-]+/$';
    case 'combo': return '/[a-z-]+/[a-z-]+/[a-z-]+/$';
    case 'blog': return '/blog/';
    default: return '.*';
  }
}
```

### Environment Variables Summary

```bash
# .env.local — Complete list of required environment variables

# Google Cloud Service Account
GSC_SERVICE_ACCOUNT_KEY_PATH=./secrets/gsc-service-account.json
GSC_SERVICE_ACCOUNT_EMAIL=gsc-bot@project.iam.gserviceaccount.com

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbG...  # anon key for client-side
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # service role key for server-side

# Chrome UX Report (CrUX) API
CRUX_API_KEY=AIza...

# IndexNow
INDEXNOW_API_KEY=your-hex-key-here
SITE_DOMAIN=www.example.com

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# BigQuery (if using custom export instead of native bulk export)
GCP_PROJECT_ID=your-project-id
BIGQUERY_DATASET=gsc_data
BIGQUERY_TABLE=search_analytics

# Multi-site configuration (JSON array)
GSC_SITES='[{"siteUrl":"sc-domain:example.com","domain":"example.com","sitemapIndexUrl":"https://www.example.com/sitemap-index.xml"}]'
```

### Package Dependencies

```json
{
  "dependencies": {
    "googleapis": "^134.0.0",
    "@google-cloud/bigquery": "^7.5.0",
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0"
  }
}
```

---

## Appendix A: Complete Supabase Migration File

```sql
-- supabase/migrations/20260409_gsc_complete_schema.sql
-- Complete schema for GSC monitoring system

-- URL Inspections
CREATE TABLE IF NOT EXISTS gsc_url_inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  url TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'unknown',
  verdict TEXT NOT NULL,
  coverage_state TEXT,
  indexing_state TEXT,
  last_crawl_time TIMESTAMPTZ,
  page_fetch_state TEXT,
  robots_txt_state TEXT,
  crawled_as TEXT,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_url, url)
);

CREATE INDEX IF NOT EXISTS idx_inspections_site_verdict ON gsc_url_inspections(site_url, verdict);
CREATE INDEX IF NOT EXISTS idx_inspections_page_type ON gsc_url_inspections(site_url, page_type);
CREATE INDEX IF NOT EXISTS idx_inspections_inspected_at ON gsc_url_inspections(inspected_at);

-- Performance Snapshots
CREATE TABLE IF NOT EXISTS gsc_performance_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  date DATE NOT NULL,
  page_type TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr DOUBLE PRECISION NOT NULL DEFAULT 0,
  position DOUBLE PRECISION NOT NULL DEFAULT 0,
  top_pages JSONB,
  top_queries JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_url, date, page_type)
);

CREATE INDEX IF NOT EXISTS idx_perf_site_date ON gsc_performance_snapshots(site_url, date DESC);

-- Server Errors
CREATE TABLE IF NOT EXISTS gsc_server_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT,
  url TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  user_agent TEXT,
  timestamp TIMESTAMPTZ,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_errors_site ON gsc_server_errors(site_url, detected_at DESC);

-- Alerts
CREATE TABLE IF NOT EXISTS gsc_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metric TEXT,
  current_value DOUBLE PRECISION,
  expected_value DOUBLE PRECISION,
  deviation DOUBLE PRECISION,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON gsc_alerts(site_url, severity) WHERE resolved_at IS NULL;

-- Coverage Summary View
CREATE OR REPLACE VIEW gsc_coverage_summary AS
SELECT
  site_url,
  page_type,
  COUNT(*) AS total_inspected,
  COUNT(*) FILTER (WHERE verdict = 'PASS') AS indexed,
  COUNT(*) FILTER (WHERE verdict = 'NEUTRAL') AS not_indexed,
  COUNT(*) FILTER (WHERE verdict = 'FAIL') AS errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE verdict = 'PASS') / NULLIF(COUNT(*), 0), 1) AS index_rate_pct,
  MAX(inspected_at) AS last_inspected
FROM gsc_url_inspections
GROUP BY site_url, page_type;

-- Weekly Performance Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS gsc_weekly_performance AS
SELECT
  site_url,
  page_type,
  date_trunc('week', date) AS week,
  SUM(clicks) AS total_clicks,
  SUM(impressions) AS total_impressions,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) AS avg_ctr_pct,
  ROUND(AVG(position)::NUMERIC, 1) AS avg_position
FROM gsc_performance_snapshots
GROUP BY site_url, page_type, date_trunc('week', date)
ORDER BY week DESC;

-- RLS Policies
ALTER TABLE gsc_url_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_server_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_alerts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (scoped to service_role only — not anon or authenticated)
CREATE POLICY "Service role full access" ON gsc_url_inspections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON gsc_performance_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON gsc_server_errors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON gsc_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## Appendix B: Quick Reference — GSC API Quotas

| API | Daily Quota | Per-Minute Limit | Notes |
|---|---|---|---|
| Search Analytics API | No hard daily limit | ~1,200 queries/min | 25,000 rows per query |
| URL Inspection API | 2,000 inspections/day/property | 600/min | Most restrictive quota |
| Sitemaps API | No hard limit | ~120 requests/min | Submit, list, delete sitemaps |
| Sites API | No hard limit | ~120 requests/min | Add, remove, list properties |
| Google Indexing API | 200 publish requests/day | ~600/min | Only for JobPosting/BroadcastEvent officially |
| CrUX API | 150 queries/min (free tier) | 150/min | Can request quota increase |
| BigQuery Bulk Export | Continuous (once enabled) | N/A | Data lands automatically |

---

## Appendix C: Monitoring Checklist

### Daily Checks (Automated)

- [ ] Sync yesterday's performance data from Search Analytics API
- [ ] Run URL inspection sampling (2,000 URLs across page types)
- [ ] Check sitemap status for errors/warnings
- [ ] Run anomaly detection on crawl and performance data
- [ ] Alert on any critical issues (>20% traffic drop, >0.1% 5xx rate, index rate <70%)
- [ ] Store all data in Supabase for trending

### Weekly Checks (Automated + Manual Review)

- [ ] Generate weekly performance report per site
- [ ] Run CWV check on representative pages
- [ ] Review cannibalization report
- [ ] Review keyword opportunity report
- [ ] Check for new soft 404s in URL inspection data
- [ ] Verify sitemap submitted-vs-indexed gap
- [ ] Review and resolve open alerts

### Monthly Checks (Manual)

- [ ] Review overall index coverage trend — is it growing?
- [ ] Audit robots.txt — are the right things blocked?
- [ ] Check for redirect chains across all programmatic page types
- [ ] Review BigQuery data for long-term traffic trends
- [ ] Audit content quality of lowest-performing page types
- [ ] Review CWV trends — are they stable or degrading?
- [ ] Clean up GSC properties (remove old staging/preview properties)
- [ ] Verify service account permissions are still valid

### Quarterly Checks (Strategic)

- [ ] Compare index rate trends across all client sites
- [ ] Benchmark programmatic page types against each other — which generate the most value?
- [ ] Review the page generation strategy — should you expand or contract the number of combos?
- [ ] Evaluate whether thin page types should be pruned
- [ ] Audit the monitoring pipeline itself — is it catching issues before they become problems?
