# Content Pruning Strategy — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers identifying underperforming pages, pruning decision frameworks, automated analysis scripts, content consolidation, and measuring pruning impact for programmatic SEO sites with 100k+ pages.

---

## Table of Contents

1. [Why Content Pruning Matters](#1-why-content-pruning-matters)
2. [Identifying Underperforming Pages](#2-identifying-underperforming-pages)
3. [The Pruning Decision Framework](#3-the-pruning-decision-framework)
4. [Data Sources for Pruning Analysis](#4-data-sources-for-pruning-analysis)
5. [Automated Pruning Analysis Scripts](#5-automated-pruning-analysis-scripts)
6. [Content Consolidation Strategy](#6-content-consolidation-strategy)
7. [Noindex vs Delete vs Redirect](#7-noindex-vs-delete-vs-redirect)
8. [Pruning Cadence](#8-pruning-cadence)
9. [Protecting New Pages from Premature Pruning](#9-protecting-new-pages-from-premature-pruning)
10. [Measuring Pruning Impact](#10-measuring-pruning-impact)
11. [Content Quality Scoring System](#11-content-quality-scoring-system)
12. [Payload CMS Implementation](#12-payload-cms-implementation)
13. [Bulk Operations](#13-bulk-operations)
14. [Recovery from Over-Pruning](#14-recovery-from-over-pruning)

---

## 1. Why Content Pruning Matters

### The Problem with Unchecked Scale

Programmatic SEO sites generate pages at massive scale — 100k+ pages from structured data templates. But volume is not a ranking factor. Quality is. Every page on your domain contributes to Google's overall assessment of your site. When a significant percentage of those pages are thin, duplicate, or underperforming, they drag down the entire domain's authority.

This is not theoretical. Google's documentation explicitly states:

> "Any content — not just unhelpful content — on sites determined to have relatively high amounts of unhelpful content overall is less likely to perform well in Search."

For a service-area business site with 50,000 location pages, if 15,000 of those pages are thin (boilerplate content with only the city name swapped), Google may suppress rankings for the entire domain — including your high-quality pillar pages and genuinely useful location pages.

### Google's Helpful Content System (HCS)

Google's Helpful Content System is a **site-wide signal**. It is not a page-level penalty — it is a classifier that evaluates the proportion of helpful vs. unhelpful content across the entire domain.

**How HCS evaluates programmatic content:**

| Signal | What Google Looks For | Risk for Programmatic Sites |
|---|---|---|
| Content uniqueness | Substantially different content per page | High — template-based pages often share 80%+ identical text |
| First-hand expertise | Evidence the creator has direct experience | Medium — generated location pages lack genuine local knowledge |
| Satisfying search intent | Does the page fully answer the query? | High — thin location pages often fail to satisfy the user |
| Content depth | Comprehensive coverage of the topic | High — templated pages tend to be shallow |
| Added value vs. existing results | Does this page add something new to the SERP? | Critical — if 500 competitors have identical content, yours adds nothing |

**The HCS classification cascade:**

```
Site launches with 100k pages
  ├── 70k pages are high quality (unique, deep, useful)
  ├── 20k pages are mediocre (thin but not terrible)
  └── 10k pages are unhelpful (boilerplate, near-duplicate)
        │
        ▼
Google's HCS classifier flags site as "partially unhelpful"
        │
        ▼
ALL pages suppressed in rankings (including the 70k good ones)
        │
        ▼
Organic traffic drops 30–60% across the board
        │
        ▼
Without pruning: rankings continue to deteriorate
With pruning: remove/improve the 10k, recovery begins in 2–8 weeks
```

### Crawl Budget Waste

Google allocates a finite crawl budget to each domain. For a 100k-page site, Googlebot may crawl 5,000–20,000 pages per day. Every crawl spent on a thin or unhelpful page is a crawl not spent on your best content.

**Crawl budget math for a 100k-page site:**

- Average crawl rate: 10,000 pages/day
- Total pages: 100,000
- Full crawl cycle: ~10 days
- If 30% of pages are low quality: 3,000 crawls/day wasted
- That means your best pages get re-crawled every 14 days instead of every 10

After pruning 30,000 low-quality pages:
- Total pages: 70,000
- Full crawl cycle: ~7 days
- Your best pages are re-crawled more frequently
- Updates are discovered faster
- New content is indexed sooner

### Index Bloat and Soft Deindexation

When Google deems pages unhelpful, it does not immediately remove them from the index. Instead, it stops showing them in search results — a phenomenon called "soft deindexation." These pages still consume crawl budget, still dilute site quality signals, but generate zero traffic.

Check for index bloat:
- **GSC Coverage report**: Compare "Valid" pages to pages that actually receive traffic
- **site: search**: `site:example.com` — compare the count to your known page count
- **GSC Performance report**: Count unique pages with at least 1 impression in 90 days

If fewer than 60% of your indexed pages receive any impressions in 90 days, you have an index bloat problem that pruning will solve.

---

## 2. Identifying Underperforming Pages

### Metrics to Evaluate

Not every metric tells the full story alone. Combine multiple signals to build a composite picture of page performance.

#### Primary Metrics (Traffic and Visibility)

| Metric | Source | Underperforming Threshold | Notes |
|---|---|---|---|
| Organic clicks (90 days) | GSC | < 5 clicks | Pages that exist but generate no traffic |
| Organic impressions (90 days) | GSC | < 50 impressions | Google shows the page but almost nobody sees it |
| Click-through rate (CTR) | GSC | < 1.5% | Page appears in results but title/description fail to attract clicks |
| Average position | GSC | > 50 | Pages ranking beyond page 5 have near-zero traffic potential |

#### Secondary Metrics (Engagement)

| Metric | Source | Underperforming Threshold | Notes |
|---|---|---|---|
| Bounce rate | PostHog | > 85% | Users arrive and immediately leave |
| Time on page | PostHog | < 15 seconds | Users are not engaging with the content |
| Scroll depth | PostHog | < 25% | Users are not reading past the first fold |
| Pages per session (from this page) | PostHog | < 1.2 | Users do not navigate deeper into the site |
| Conversion events | PostHog | 0 in 90 days | Page generates no business value |

#### Authority Metrics (Backlinks)

| Metric | Source | Threshold | Notes |
|---|---|---|---|
| Referring domains | Ahrefs/SEMrush | 0 | No external sites link to this page |
| Internal links pointing to page | Payload CMS / crawler | < 3 | Page is orphaned or poorly linked |
| Page authority / URL rating | Ahrefs | < 10 | Page has no accumulated authority |

#### Content Quality Metrics (Automated)

| Metric | Source | Threshold | Notes |
|---|---|---|---|
| Word count (unique text) | Payload CMS + crawler | < 300 words | Thin content |
| Content similarity to other pages | Custom script | > 85% similarity | Near-duplicate |
| Keyword coverage score | Custom script | < 40% | Missing target keywords |
| Structured data completeness | Custom script | < 50% of fields populated | Incomplete schema markup |

### Page Type Segmentation

Different page types have different performance baselines. Never evaluate a location page against the same thresholds as a pillar page.

```
Page Type Baseline Expectations (90-day period):

Pillar Pages (/services/hvac-repair/)
  ├── Expected clicks: 500+
  ├── Expected impressions: 5,000+
  └── Prune threshold: < 50 clicks

Service + Location (/services/hvac-repair/phoenix-az/)
  ├── Expected clicks: 20+
  ├── Expected impressions: 200+
  └── Prune threshold: < 3 clicks

Deep Location Pages (/services/drain-cleaning/phoenix-az/arcadia/)
  ├── Expected clicks: 5+
  ├── Expected impressions: 50+
  └── Prune threshold: < 1 click, < 10 impressions

Blog Posts (/blog/how-to-unclog-a-drain/)
  ├── Expected clicks: 100+
  ├── Expected impressions: 1,000+
  └── Prune threshold: < 10 clicks

FAQ Pages (/faq/service/hvac/)
  ├── Expected clicks: 10+
  ├── Expected impressions: 100+
  └── Prune threshold: < 2 clicks
```

---

## 3. The Pruning Decision Framework

### Decision Tree (ASCII Flowchart)

```
                    ┌─────────────────────────────┐
                    │    Page Under Evaluation     │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Is the page < 6 months old? │
                    └──────────────┬──────────────┘
                           YES ┌───┴───┐ NO
                               │       │
                    ┌──────────▼─┐  ┌──▼──────────────────┐
                    │  PROTECT   │  │  Does page have > 0  │
                    │  (grace    │  │  referring domains?   │
                    │  period)   │  └──────────┬───────────┘
                    └────────────┘      YES ┌──┴──┐ NO
                                            │     │
                              ┌─────────────▼─┐ ┌─▼──────────────────────┐
                              │ Does page get  │ │ Does page get any      │
                              │ > 10 clicks    │ │ organic impressions    │
                              │ /90 days?      │ │ (> 50 in 90 days)?     │
                              └───────┬────────┘ └───────────┬────────────┘
                              YES ┌───┴───┐ NO       YES ┌───┴───┐ NO
                                  │       │              │       │
                           ┌──────▼──┐ ┌──▼─────┐ ┌─────▼───┐ ┌─▼────────────────┐
                           │  KEEP   │ │REFRESH │ │ REFRESH │ │ Is there a        │
                           │  as-is  │ │ content│ │ or      │ │ stronger page on  │
                           └─────────┘ │ + keep │ │ NOINDEX │ │ the same topic?   │
                                       │ links  │ └─────────┘ └────────┬──────────┘
                                       └────────┘          YES ┌───────┴──────┐ NO
                                                               │              │
                                                        ┌──────▼──────┐ ┌─────▼──────┐
                                                        │ CONSOLIDATE │ │  REMOVE     │
                                                        │ (301 → the  │ │  (410 Gone) │
                                                        │ stronger    │ │  or NOINDEX │
                                                        │ page)       │ └─────────────┘
                                                        └─────────────┘
```

### Decision Definitions

#### KEEP
The page performs adequately. No action needed this cycle. Re-evaluate next pruning cycle.

**Criteria:**
- Receives meaningful organic traffic (above page-type threshold)
- Has referring domains
- Engagement metrics are acceptable
- Content quality score is above 60%

#### REFRESH
The page has potential but is underperforming. Update the content to improve quality and rankings.

**Actions:**
- Rewrite thin content sections to add depth
- Update outdated information (pricing, regulations, stats)
- Improve title tag and meta description for better CTR
- Add structured data if missing
- Improve internal linking to/from this page
- Add unique local content (for location pages)

**Criteria:**
- Some impressions but low clicks (CTR problem)
- Has backlinks but traffic has declined
- Content quality score between 40–60%
- The topic/keyword has search volume worth targeting

#### CONSOLIDATE
Multiple pages compete for the same keyword or serve the same intent. Merge them into one stronger page.

**Actions:**
- Identify the strongest page (most traffic, links, best content)
- Merge unique content from weaker pages into the strong page
- Set up 301 redirects from weaker pages to the strong page
- Update internal links to point to the consolidated page
- Mark source pages as "pruned-consolidated" in Payload CMS

**Criteria:**
- Two or more pages target the same primary keyword
- Pages cannibalize each other (both rank position 15–30 for the same query)
- Neither page is strong enough alone but combined content would be comprehensive

#### NOINDEX
Keep the page accessible for users (internal navigation, direct links) but remove it from Google's index.

**Actions:**
- Add `<meta name="robots" content="noindex, follow">` to the page
- Keep the page in the sitemap temporarily (Google needs to recrawl to see the noindex)
- Remove from sitemap after Google has processed the noindex (typically 2–4 weeks)
- Mark as "noindexed" in Payload CMS

**Criteria:**
- Page serves an internal purpose but has no search value
- Thin page that cannot be meaningfully improved
- Utility pages (thank you pages, form confirmations, filtered views)
- Pages with zero impressions that still need to exist for navigation

#### REMOVE (410 Gone)
Delete the page entirely and return a 410 status code.

**Actions:**
- Confirm no valuable backlinks point to this page
- Confirm no significant internal links depend on this page
- Set up 410 (Gone) response — preferable to 404 because it tells Google the removal is intentional
- If any backlinks exist, 301 redirect to the most relevant existing page instead
- Mark as "removed" in Payload CMS with the removal date
- Log the removal for potential recovery

**Criteria:**
- Page is truly unhelpful with no redeeming qualities
- Zero traffic, zero impressions, zero backlinks
- Content is outdated/incorrect and not worth updating
- Duplicate of another page with no unique content

---

## 4. Data Sources for Pruning Analysis

### GSC Search Analytics API

The Google Search Console API provides the most authoritative data on how Google perceives and serves your pages.

**Key endpoints:**

```
POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query

Request body:
{
  "startDate": "2026-01-01",
  "endDate": "2026-03-31",
  "dimensions": ["page"],
  "rowLimit": 25000,
  "startRow": 0,
  "dimensionFilterGroups": [],
  "type": "web"
}

Response fields per page:
- clicks: total organic clicks
- impressions: total times shown in search results
- ctr: click-through rate
- position: average ranking position
```

**Important limitations:**
- API returns a maximum of 25,000 rows per request — for 100k+ page sites, you must paginate using `startRow`
- Data has a 2-day lag
- Only returns pages that had at least 1 impression — pages with zero impressions will not appear (those are your worst performers, identifiable only by comparing GSC data to your full URL list)
- Anonymous query data is aggregated — you cannot see every query, only those above a privacy threshold

### PostHog Analytics

PostHog provides engagement data that GSC does not: bounce rate, time on page, scroll depth, conversion events.

**PostHog HogQL queries for pruning analysis:**

```sql
-- Pages with high bounce rate (using sessions table for accurate bounce measurement)
SELECT
  $entry_current_url AS page_url,
  count(*) AS total_sessions,
  countIf($session_duration < 10) AS bounces,
  round(bounces / total_sessions * 100, 2) AS bounce_rate
FROM sessions
WHERE min_timestamp > now() - INTERVAL 90 DAY
GROUP BY page_url
HAVING total_sessions > 10
ORDER BY bounce_rate DESC
LIMIT 1000
```

```sql
-- Average time on page and scroll depth per URL pattern
SELECT
  replaceRegexpAll(properties.$current_url, '/[a-z]+-[a-z]{2}/', '/{location}/') AS url_pattern,
  count(*) AS pageviews,
  avg(properties.time_on_page) AS avg_time_on_page,
  avg(properties.scroll_depth) AS avg_scroll_depth
FROM events
WHERE event = '$pageview'
  AND timestamp > now() - INTERVAL 90 DAY
GROUP BY url_pattern
ORDER BY pageviews DESC
```

```sql
-- Pages with zero conversion events in 90 days
SELECT
  properties.$current_url AS page_url,
  count(*) AS pageviews,
  countIf(event = 'form_submitted' OR event = 'phone_click' OR event = 'chat_started') AS conversions
FROM events
WHERE timestamp > now() - INTERVAL 90 DAY
GROUP BY page_url
HAVING pageviews > 20 AND conversions = 0
ORDER BY pageviews DESC
```

**PostHog API for programmatic access:**

```typescript
// PostHog API query
const response = await fetch('https://app.posthog.com/api/projects/{project_id}/query/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${POSTHOG_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: {
      kind: 'HogQLQuery',
      query: `SELECT properties.$current_url AS url, count(*) AS views,
              avg(properties.time_on_page) AS avg_time
              FROM events WHERE event = '$pageview'
              AND timestamp > now() - INTERVAL 90 DAY
              GROUP BY url`,
    },
  }),
});
```

### Payload CMS Content Metadata

Payload CMS stores content metadata that is essential for pruning decisions: creation date, last modified date, word count, content fields, and custom quality scores.

**Querying Payload CMS for content metadata:**

```typescript
// Payload Local API — get all pages with metadata
const pages = await payload.find({
  collection: 'pages',
  limit: 0, // return all
  depth: 0, // no relation population for speed
  select: {
    slug: true,
    title: true,
    createdAt: true,
    updatedAt: true,
    pruningStatus: true,
    contentQualityScore: true,
    wordCount: true,
    pageType: true,
    location: true,
    service: true,
  },
});
```

### Ahrefs / SEMrush Backlink Data

Backlink data determines whether a page has accumulated SEO equity worth preserving.

**Ahrefs API example:**

```typescript
const response = await fetch(
  `https://apiv2.ahrefs.com?token=${AHREFS_API_KEY}` +
  `&from=backlinks&target=${encodeURIComponent(pageUrl)}` +
  `&mode=exact&output=json&limit=0`,
);
const data = await response.json();
// data.stats.refdomains — number of referring domains
// data.stats.backlinks — total backlink count
```

**When Ahrefs/SEMrush is not available**, use GSC's Links report as a fallback:
- External links: GSC > Links > Top linked pages
- Internal links: GSC > Links > Top internally linked pages

---

## 5. Automated Pruning Analysis Scripts

### Complete Pruning Analysis Pipeline

This TypeScript script pulls data from GSC, PostHog, and Payload CMS, computes a composite score, and generates pruning recommendations.

```typescript
// scripts/pruning-analysis.ts

import { google } from 'googleapis';
import { getPayload } from 'payload';
import config from '../payload.config';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GSCPageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PostHogPageData {
  url: string;
  pageviews: number;
  bounceRate: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  conversions: number;
}

interface PayloadPageData {
  id: string;
  slug: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  contentQualityScore: number;
  pageType: string;
  pruningStatus: string;
  referringDomains: number;
}

interface PruningRecommendation {
  url: string;
  pageId: string;
  pageType: string;
  compositeScore: number;
  recommendation: 'keep' | 'refresh' | 'consolidate' | 'noindex' | 'remove';
  reasons: string[];
  metrics: {
    clicks90d: number;
    impressions90d: number;
    ctr: number;
    position: number;
    bounceRate: number;
    avgTimeOnPage: number;
    wordCount: number;
    contentQualityScore: number;
    referringDomains: number;
    pageAgeDays: number;
  };
  consolidateTarget?: string; // URL to merge into, if applicable
}

// ─── Configuration ───────────────────────────────────────────────────────────

const PRUNING_CONFIG = {
  // Minimum page age before eligible for pruning (days)
  minPageAgeDays: 180,

  // Thresholds by page type
  thresholds: {
    pillar: {
      minClicks: 50,
      minImpressions: 500,
      minWordCount: 800,
      minQualityScore: 60,
    },
    'service-location': {
      minClicks: 3,
      minImpressions: 30,
      minWordCount: 400,
      minQualityScore: 50,
    },
    'deep-location': {
      minClicks: 1,
      minImpressions: 10,
      minWordCount: 300,
      minQualityScore: 40,
    },
    blog: {
      minClicks: 10,
      minImpressions: 100,
      minWordCount: 600,
      minQualityScore: 55,
    },
    faq: {
      minClicks: 2,
      minImpressions: 20,
      minWordCount: 200,
      minQualityScore: 40,
    },
  },

  // Weights for composite score calculation (sum to 1.0)
  weights: {
    organicTraffic: 0.30,
    engagement: 0.20,
    contentQuality: 0.25,
    authority: 0.15,
    freshness: 0.10,
  },

  // Analysis period
  analysisPeriodDays: 90,
};

// ─── GSC Data Fetcher ────────────────────────────────────────────────────────

async function fetchGSCData(siteUrl: string): Promise<GSCPageData[]> {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - PRUNING_CONFIG.analysisPeriodDays);

  const allRows: GSCPageData[] = [];
  let startRow = 0;
  const rowLimit = 25000;

  while (true) {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit,
        startRow,
        type: 'web',
      },
    });

    const rows = response.data.rows || [];
    if (rows.length === 0) break;

    for (const row of rows) {
      allRows.push({
        page: row.keys![0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      });
    }

    if (rows.length < rowLimit) break;
    startRow += rowLimit;
  }

  return allRows;
}

// ─── PostHog Data Fetcher ────────────────────────────────────────────────────

async function fetchPostHogData(): Promise<PostHogPageData[]> {
  const response = await fetch(
    `https://app.posthog.com/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POSTHOG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: `
            SELECT
              pv.url AS url,
              pv.pageviews AS pageviews,
              pv.bounce_rate AS bounce_rate,
              pv.avg_time_on_page AS avg_time_on_page,
              pv.avg_scroll_depth AS avg_scroll_depth,
              COALESCE(cv.conversions, 0) AS conversions
            FROM (
              SELECT
                properties.$current_url AS url,
                count(*) AS pageviews,
                round(countIf(properties.session_duration < 10) / count(*) * 100, 2) AS bounce_rate,
                avg(properties.time_on_page) AS avg_time_on_page,
                avg(properties.scroll_depth) AS avg_scroll_depth
              FROM events
              WHERE event = '$pageview'
                AND timestamp > now() - INTERVAL ${PRUNING_CONFIG.analysisPeriodDays} DAY
              GROUP BY url
              HAVING pageviews >= 1
            ) AS pv
            LEFT JOIN (
              SELECT
                properties.$current_url AS url,
                count(*) AS conversions
              FROM events
              WHERE event IN ('form_submitted', 'phone_click', 'chat_started')
                AND timestamp > now() - INTERVAL ${PRUNING_CONFIG.analysisPeriodDays} DAY
              GROUP BY url
            ) AS cv ON pv.url = cv.url
          `,
        },
      }),
    },
  );

  const data = await response.json();
  return data.results.map((row: any[]) => ({
    url: row[0],
    pageviews: row[1],
    bounceRate: row[2],
    avgTimeOnPage: row[3],
    avgScrollDepth: row[4],
    conversions: row[5],
  }));
}

// ─── Payload CMS Data Fetcher ────────────────────────────────────────────────

async function fetchPayloadData(): Promise<PayloadPageData[]> {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: 'pages',
    limit: 0,
    depth: 0,
    select: {
      slug: true,
      createdAt: true,
      updatedAt: true,
      wordCount: true,
      contentQualityScore: true,
      pageType: true,
      pruningStatus: true,
      fullUrl: true,
    },
  });

  return result.docs.map((doc: any) => ({
    id: doc.id,
    slug: doc.slug,
    url: doc.fullUrl || `/${doc.slug}`,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    wordCount: doc.wordCount || 0,
    contentQualityScore: doc.contentQualityScore || 0,
    pageType: doc.pageType || 'unknown',
    pruningStatus: doc.pruningStatus || 'published',
    referringDomains: 0, // populated from Ahrefs data if available
  }));
}

// ─── Composite Score Calculator ──────────────────────────────────────────────

function calculateCompositeScore(
  gsc: GSCPageData | undefined,
  posthog: PostHogPageData | undefined,
  cms: PayloadPageData,
): number {
  const weights = PRUNING_CONFIG.weights;

  // Organic traffic score (0-100)
  const clicks = gsc?.clicks || 0;
  const impressions = gsc?.impressions || 0;
  const trafficScore = Math.min(100, (clicks / 50) * 100);
  const impressionBonus = Math.min(20, (impressions / 500) * 20);
  const organicScore = Math.min(100, trafficScore + impressionBonus);

  // Engagement score (0-100)
  // Neutral defaults for new pages with no PostHog data: 50% bounce, 30s time, 50% scroll.
  // These produce a ~50/100 engagement score, matching the quality scorer's 10/20 (also 50%).
  // This avoids penalizing or rewarding pages before real data is available.
  const bounceRate = posthog?.bounceRate ?? 50;
  const timeOnPage = posthog?.avgTimeOnPage ?? 30;
  const scrollDepth = posthog?.avgScrollDepth ?? 50;
  const engagementScore = Math.min(100,
    ((100 - bounceRate) / 100 * 40) +
    (Math.min(timeOnPage, 120) / 120 * 30) +
    (scrollDepth / 100 * 30),
  );

  // Content quality score (0-100) — from Payload CMS
  const qualityScore = cms.contentQualityScore || 0;

  // Authority score (0-100)
  const authorityScore = Math.min(100, cms.referringDomains * 25);

  // Freshness score (0-100)
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(cms.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const freshnessScore = Math.max(0, 100 - (daysSinceUpdate / 365 * 100));

  return (
    organicScore * weights.organicTraffic +
    engagementScore * weights.engagement +
    qualityScore * weights.contentQuality +
    authorityScore * weights.authority +
    freshnessScore * weights.freshness
  );
}

// ─── Pruning Decision Engine ─────────────────────────────────────────────────

function makePruningDecision(
  gsc: GSCPageData | undefined,
  posthog: PostHogPageData | undefined,
  cms: PayloadPageData,
  compositeScore: number,
  urlIndex: Map<string, PayloadPageData>,
): PruningRecommendation {
  const reasons: string[] = [];
  const pageAgeDays = Math.floor(
    (Date.now() - new Date(cms.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  const threshold = PRUNING_CONFIG.thresholds[
    cms.pageType as keyof typeof PRUNING_CONFIG.thresholds
  ] || PRUNING_CONFIG.thresholds['service-location'];

  const clicks = gsc?.clicks || 0;
  const impressions = gsc?.impressions || 0;
  const ctr = gsc?.ctr || 0;
  const position = gsc?.position || 100;

  // ── Grace period check ──
  if (pageAgeDays < PRUNING_CONFIG.minPageAgeDays) {
    return {
      url: cms.url,
      pageId: cms.id,
      pageType: cms.pageType,
      compositeScore,
      recommendation: 'keep',
      reasons: [`Page is only ${pageAgeDays} days old (grace period: ${PRUNING_CONFIG.minPageAgeDays} days)`],
      metrics: {
        clicks90d: clicks,
        impressions90d: impressions,
        ctr,
        position,
        bounceRate: posthog?.bounceRate || 0,
        avgTimeOnPage: posthog?.avgTimeOnPage || 0,
        wordCount: cms.wordCount,
        contentQualityScore: cms.contentQualityScore,
        referringDomains: cms.referringDomains,
        pageAgeDays,
      },
    };
  }

  // ── Decision logic ──
  let recommendation: PruningRecommendation['recommendation'] = 'keep';

  // Has backlinks — never remove, only refresh or keep
  if (cms.referringDomains > 0) {
    if (clicks >= threshold.minClicks) {
      recommendation = 'keep';
      reasons.push(`Has ${cms.referringDomains} referring domains and ${clicks} clicks — performing well`);
    } else {
      recommendation = 'refresh';
      reasons.push(`Has ${cms.referringDomains} referring domains but only ${clicks} clicks — refresh to capitalize on link equity`);
    }
  }
  // No backlinks
  else {
    // Has some visibility
    if (impressions >= threshold.minImpressions) {
      if (clicks >= threshold.minClicks) {
        recommendation = 'keep';
        reasons.push(`Meets traffic thresholds: ${clicks} clicks, ${impressions} impressions`);
      } else {
        recommendation = 'refresh';
        reasons.push(`Has ${impressions} impressions but only ${clicks} clicks — CTR improvement needed`);
      }
    }
    // Minimal visibility
    else if (impressions > 0) {
      // Check for cannibalization — is there a stronger page for the same topic?
      const potentialConsolidationTarget = findConsolidationTarget(cms, urlIndex);
      if (potentialConsolidationTarget) {
        recommendation = 'consolidate';
        reasons.push(`Low visibility (${impressions} impressions) and stronger page exists: ${potentialConsolidationTarget}`);
      } else {
        recommendation = 'noindex';
        reasons.push(`Low visibility (${impressions} impressions), no backlinks, no consolidation target`);
      }
    }
    // Zero visibility
    else {
      const potentialConsolidationTarget = findConsolidationTarget(cms, urlIndex);
      if (potentialConsolidationTarget) {
        recommendation = 'consolidate';
        reasons.push(`Zero impressions — consolidate into ${potentialConsolidationTarget}`);
      } else {
        recommendation = 'remove';
        reasons.push('Zero impressions, zero backlinks, no consolidation target — remove');
      }
    }
  }

  // ── Additional quality checks ──
  if (cms.wordCount < threshold.minWordCount && recommendation === 'keep') {
    recommendation = 'refresh';
    reasons.push(`Thin content: ${cms.wordCount} words (minimum: ${threshold.minWordCount})`);
  }

  if (cms.contentQualityScore < threshold.minQualityScore && recommendation === 'keep') {
    recommendation = 'refresh';
    reasons.push(`Low quality score: ${cms.contentQualityScore} (minimum: ${threshold.minQualityScore})`);
  }

  if (posthog && posthog.bounceRate > 90 && recommendation === 'keep') {
    recommendation = 'refresh';
    reasons.push(`Very high bounce rate: ${posthog.bounceRate}%`);
  }

  return {
    url: cms.url,
    pageId: cms.id,
    pageType: cms.pageType,
    compositeScore,
    recommendation,
    reasons,
    metrics: {
      clicks90d: clicks,
      impressions90d: impressions,
      ctr,
      position,
      bounceRate: posthog?.bounceRate || 0,
      avgTimeOnPage: posthog?.avgTimeOnPage || 0,
      wordCount: cms.wordCount,
      contentQualityScore: cms.contentQualityScore,
      referringDomains: cms.referringDomains,
      pageAgeDays,
    },
    consolidateTarget: recommendation === 'consolidate'
      ? findConsolidationTarget(cms, urlIndex) || undefined
      : undefined,
  };
}

// ─── Consolidation Target Finder ─────────────────────────────────────────────

function findConsolidationTarget(
  page: PayloadPageData,
  urlIndex: Map<string, PayloadPageData>,
): string | null {
  // For location pages, the consolidation target is the parent service page
  // e.g., /services/hvac-repair/phoenix-az/arcadia/ → /services/hvac-repair/phoenix-az/
  const urlParts = page.url.replace(/\/$/, '').split('/');
  if (urlParts.length > 3) {
    const parentUrl = urlParts.slice(0, -1).join('/') + '/';
    const parentPage = urlIndex.get(parentUrl);
    if (parentPage && parentPage.pruningStatus === 'published') {
      return parentUrl;
    }
  }

  // For service pages, look for a sibling with better performance
  // (this would need GSC data passed in for a full implementation)
  return null;
}

// ─── Main Execution ──────────────────────────────────────────────────────────

async function runPruningAnalysis() {
  console.log('Starting pruning analysis...');
  console.log(`Analysis period: ${PRUNING_CONFIG.analysisPeriodDays} days`);
  console.log(`Minimum page age: ${PRUNING_CONFIG.minPageAgeDays} days`);

  // Fetch data from all sources in parallel
  const [gscData, posthogData, payloadData] = await Promise.all([
    fetchGSCData(process.env.GSC_SITE_URL!),
    fetchPostHogData(),
    fetchPayloadData(),
  ]);

  console.log(`GSC pages: ${gscData.length}`);
  console.log(`PostHog pages: ${posthogData.length}`);
  console.log(`Payload CMS pages: ${payloadData.length}`);

  // Index data by URL for fast lookup
  const gscByUrl = new Map(gscData.map((d) => [d.page, d]));
  const posthogByUrl = new Map(posthogData.map((d) => [d.url, d]));
  // Pre-build URL index for O(1) consolidation target lookups (avoids O(n²) with Array.find)
  const urlIndex = new Map(payloadData.map((d) => [d.url, d]));

  // Generate recommendations for each page
  const recommendations: PruningRecommendation[] = [];

  for (const page of payloadData) {
    if (page.pruningStatus === 'removed' || page.pruningStatus === 'archived') {
      continue; // Skip already-pruned pages
    }

    const fullUrl = `${process.env.SITE_BASE_URL}${page.url}`;
    const gsc = gscByUrl.get(fullUrl);
    const posthog = posthogByUrl.get(fullUrl) || posthogByUrl.get(page.url);

    const compositeScore = calculateCompositeScore(gsc, posthog, page);
    const recommendation = makePruningDecision(gsc, posthog, page, compositeScore, urlIndex);
    recommendations.push(recommendation);
  }

  // ── Summary Report ──
  const summary = {
    totalPagesAnalyzed: recommendations.length,
    keep: recommendations.filter((r) => r.recommendation === 'keep').length,
    refresh: recommendations.filter((r) => r.recommendation === 'refresh').length,
    consolidate: recommendations.filter((r) => r.recommendation === 'consolidate').length,
    noindex: recommendations.filter((r) => r.recommendation === 'noindex').length,
    remove: recommendations.filter((r) => r.recommendation === 'remove').length,
    avgCompositeScore: recommendations.reduce((sum, r) => sum + r.compositeScore, 0) / recommendations.length,
  };

  console.log('\n═══════════════════════════════════════');
  console.log('  PRUNING ANALYSIS SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total pages analyzed: ${summary.totalPagesAnalyzed}`);
  console.log(`  KEEP:        ${summary.keep} (${(summary.keep / summary.totalPagesAnalyzed * 100).toFixed(1)}%)`);
  console.log(`  REFRESH:     ${summary.refresh} (${(summary.refresh / summary.totalPagesAnalyzed * 100).toFixed(1)}%)`);
  console.log(`  CONSOLIDATE: ${summary.consolidate} (${(summary.consolidate / summary.totalPagesAnalyzed * 100).toFixed(1)}%)`);
  console.log(`  NOINDEX:     ${summary.noindex} (${(summary.noindex / summary.totalPagesAnalyzed * 100).toFixed(1)}%)`);
  console.log(`  REMOVE:      ${summary.remove} (${(summary.remove / summary.totalPagesAnalyzed * 100).toFixed(1)}%)`);
  console.log(`Average composite score: ${summary.avgCompositeScore.toFixed(1)}/100`);
  console.log('═══════════════════════════════════════\n');

  // ── Write results to JSON for Payload CMS import ──
  const outputPath = `./pruning-report-${new Date().toISOString().split('T')[0]}.json`;
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, JSON.stringify({ summary, recommendations }, null, 2));
  console.log(`Full report written to: ${outputPath}`);

  // ── Write CSV for human review ──
  const csvHeader = 'URL,Page Type,Composite Score,Recommendation,Clicks (90d),Impressions (90d),CTR,Position,Bounce Rate,Word Count,Quality Score,Referring Domains,Page Age (days),Reasons\n';
  const csvRows = recommendations
    .sort((a, b) => a.compositeScore - b.compositeScore)
    .map((r) =>
      `"${r.url}","${r.pageType}",${r.compositeScore.toFixed(1)},"${r.recommendation}",${r.metrics.clicks90d},${r.metrics.impressions90d},${(r.metrics.ctr * 100).toFixed(2)}%,${r.metrics.position.toFixed(1)},${r.metrics.bounceRate}%,${r.metrics.wordCount},${r.metrics.contentQualityScore},${r.metrics.referringDomains},${r.metrics.pageAgeDays},"${r.reasons.join('; ')}"`,
    )
    .join('\n');

  const csvPath = `./pruning-report-${new Date().toISOString().split('T')[0]}.csv`;
  await fs.writeFile(csvPath, csvHeader + csvRows);
  console.log(`CSV report written to: ${csvPath}`);

  return { summary, recommendations };
}

// Run the analysis
runPruningAnalysis().catch(console.error);
```

### Environment Variables Required

```env
# .env for pruning analysis
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
GSC_SITE_URL=https://example.com
SITE_BASE_URL=https://example.com
POSTHOG_API_KEY=phx_xxxxxxxxxxxxxxxxxxxx
POSTHOG_PROJECT_ID=12345
DATABASE_URI=postgresql://user:pass@host:5432/db
PAYLOAD_SECRET=your-payload-secret
```

---

## 6. Content Consolidation Strategy

### When to Consolidate

Consolidation is the most SEO-valuable pruning action. Instead of destroying pages, you combine their value into a single, stronger page.

**Common consolidation scenarios for programmatic sites:**

| Scenario | Example | Action |
|---|---|---|
| Hyper-local pages with no search volume | `/services/hvac/phoenix/arcadia/` + `/services/hvac/phoenix/biltmore/` | Merge both into `/services/hvac/phoenix/` with neighborhood mentions |
| Service variants with identical intent | `/services/ac-repair/` + `/services/air-conditioning-repair/` | Merge into one, 301 the other |
| Blog posts on the same topic | `/blog/drain-cleaning-tips/` + `/blog/how-to-unclog-drain/` | Combine into a comprehensive guide |
| Seasonal pages from prior years | `/services/ac-tune-up-spring-2024/` + `/services/ac-tune-up-spring-2025/` | Merge into evergreen `/services/ac-tune-up/` |

### Consolidation Process

```
Step 1: Identify the "winner" page
  ├── Most organic traffic
  ├── Most backlinks
  ├── Best content quality score
  └── If tie: pick the one with the better URL structure

Step 2: Audit content from all pages being merged
  ├── Extract unique content sections from each page
  ├── Identify overlapping content (keep the best version)
  ├── List unique keywords each page targets
  └── Compile all structured data (reviews, FAQs, etc.)

Step 3: Enhance the winner page
  ├── Add unique content from merged pages
  ├── Expand keyword coverage (incorporate keywords from merged pages)
  ├── Add sections that merged pages covered but winner did not
  ├── Update structured data to include consolidated information
  └── Improve internal linking

Step 4: Set up 301 redirects
  ├── Each merged page → winner page
  ├── Implement at the server/middleware level (not client-side)
  ├── Update the sitemap (remove merged URLs, keep winner)
  └── Update all internal links pointing to merged pages

Step 5: Update Payload CMS records
  ├── Mark merged pages as "pruned-consolidated"
  ├── Store the redirect target URL
  ├── Record the consolidation date
  └── Preserve the original content in an archive field
```

### Consolidation Script

```typescript
// scripts/consolidate-pages.ts

import { getPayload } from 'payload';
import config from '../payload.config';

interface ConsolidationPlan {
  winnerPageId: string;
  mergedPageIds: string[];
  redirects: Array<{ from: string; to: string }>;
}

async function executeConsolidation(plan: ConsolidationPlan) {
  const payload = await getPayload({ config });

  // 1. Fetch all pages involved
  const winnerPage = await payload.findByID({
    collection: 'pages',
    id: plan.winnerPageId,
    depth: 2,
  });

  const mergedPages = await Promise.all(
    plan.mergedPageIds.map((id) =>
      payload.findByID({ collection: 'pages', id, depth: 2 }),
    ),
  );

  // 2. Update winner page with consolidated content
  // (Content merging logic depends on your specific block structure)
  console.log(`Enhancing winner page: ${winnerPage.slug}`);

  // 3. Mark merged pages as consolidated
  for (const mergedPage of mergedPages) {
    await payload.update({
      collection: 'pages',
      id: mergedPage.id,
      data: {
        pruningStatus: 'pruned-consolidated',
        pruningAction: 'consolidated',
        pruningDate: new Date().toISOString(),
        redirectTarget: winnerPage.fullUrl,
        archivedContent: JSON.stringify(mergedPage),
      },
    });
    console.log(`Marked as consolidated: ${mergedPage.slug} → ${winnerPage.slug}`);
  }

  // 4. Create redirect records
  for (const redirect of plan.redirects) {
    await payload.create({
      collection: 'redirects',
      data: {
        from: redirect.from,
        to: redirect.to,
        type: '301',
        reason: 'content-consolidation',
        createdByPruning: true,
        pruningDate: new Date().toISOString(),
      },
    });
    console.log(`Redirect created: ${redirect.from} → ${redirect.to}`);
  }

  // 5. Update sitemap
  console.log('Sitemap will be regenerated on next build.');

  return {
    winnerPage: winnerPage.slug,
    mergedCount: mergedPages.length,
    redirectsCreated: plan.redirects.length,
  };
}
```

### Preserving SEO Equity via 301 Redirects

301 redirects pass approximately 90–99% of link equity to the target page (Google has confirmed that 301s pass full PageRank). For consolidation to preserve SEO value:

**Rules for consolidation redirects:**

1. **Always use 301 (permanent)**, not 302 (temporary). A 302 tells Google the move is temporary and does not transfer full equity.
2. **Redirect to the most topically relevant page**. Redirecting a drain cleaning page to your homepage wastes the topical relevance signal.
3. **One hop maximum**. Never create redirect chains (A → B → C). If B is later pruned, update A to redirect directly to C.
4. **Keep redirects permanently**. Do not remove 301 redirects after a few months. Backlinks pointing to the old URL will exist indefinitely.
5. **Update internal links**. Do not rely on redirects for internal navigation — update all internal links to point directly to the new URL.

---

## 7. Noindex vs Delete vs Redirect

### Decision Matrix

| Approach | HTTP Status | Google's Behavior | SEO Equity | Use When |
|---|---|---|---|---|
| **Noindex** | 200 (page still loads) | Removes from index within 2–4 weeks; stops showing in SERPs | Lost — noindexed pages do not pass PageRank | Page must remain accessible but has no search value |
| **301 Redirect** | 301 | Transfers index signals to target; old URL drops from index | Preserved (~95%+ passes to target) | Page has backlinks or you are consolidating content |
| **410 Gone** | 410 | Faster deindexing than 404; signals intentional removal | Lost entirely | Page is truly worthless, no backlinks, no user need |
| **404 Not Found** | 404 | Google eventually deindexes; takes longer than 410 | Lost eventually | Avoid — use 410 for intentional removals |
| **Soft 404** | 200 (thin/empty content) | Google auto-classifies as soft 404; hurts quality signals | Negative — actively hurts site quality | NEVER do this — it is the worst option |

### When to Use Each

#### Use NOINDEX when:
- The page serves internal users (thank-you pages, account pages, filtered views)
- The page is required for site navigation but targets no search queries
- You want to keep the page accessible via direct links
- The page is part of a paginated series where only page 1 should be indexed
- Legal or compliance pages that must exist but have no search value

**Implementation in Astro:**

```astro
---
// src/pages/[...slug].astro
const { pruningStatus } = page;
const shouldNoindex = pruningStatus === 'noindexed';
---
<head>
  {shouldNoindex && <meta name="robots" content="noindex, follow" />}
</head>
```

**Implementation in Next.js (Metadata API):**

```typescript
// app/[...slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await getPage(params.slug);

  if (page.pruningStatus === 'noindexed') {
    return {
      robots: { index: false, follow: true },
    };
  }

  return {
    // normal metadata
  };
}
```

#### Use 301 REDIRECT when:
- The page has any referring domains (even 1 backlink justifies a redirect)
- You are consolidating multiple pages into one
- The URL structure is changing but the content lives on
- A service or location is being reorganized

**Implementation — Astro middleware:**

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Check redirect table (cached from Payload CMS)
  const redirect = await getRedirect(context.url.pathname);

  if (redirect) {
    return context.redirect(redirect.to, 301);
  }

  return next();
});
```

**Implementation — Next.js next.config.ts:**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    // For small sets of redirects — fetch from Payload at build time
    const redirects = await fetchRedirectsFromPayload();
    return redirects.map((r) => ({
      source: r.from,
      destination: r.to,
      permanent: true, // 301
    }));
  },
};

export default nextConfig;
```

For sites with thousands of redirects, use middleware instead of `next.config.ts` redirects (the config approach has a practical limit of ~1,000 redirects before build performance degrades):

```typescript
// middleware.ts (Next.js)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pre-loaded redirect map (from Payload CMS, cached in edge)
const redirectMap = new Map<string, string>();

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const target = redirectMap.get(path);

  if (target) {
    return NextResponse.redirect(new URL(target, request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### Use 410 GONE when:
- The page has zero backlinks (confirmed via Ahrefs/GSC)
- The page has zero impressions in the last 180 days
- No users access the page directly
- The content is outdated, incorrect, or harmful
- You want Google to deindex the URL faster than a natural 404

#### NEVER use soft 404:
A soft 404 is when a page returns a 200 status code but shows empty, near-empty, or "this page doesn't exist" content. Google detects these and treats them as a quality problem. They are worse than a real 404 because Google continues to crawl them, wasting crawl budget while counting them against your site quality.

---

## 8. Pruning Cadence

### Recommended Schedule

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANNUAL PRUNING CALENDAR                     │
├─────────────┬───────────────────────────────────────────────────┤
│ January     │ Q4 review: Full pruning analysis                  │
│             │ - Analyze holiday season performance              │
│             │ - Prune seasonal pages from Q4 that won't recur   │
├─────────────┼───────────────────────────────────────────────────┤
│ February    │ Monthly check: Process refresh queue               │
│             │ - Review pages flagged for refresh in Q4 analysis  │
├─────────────┼───────────────────────────────────────────────────┤
│ March       │ Pre-spring audit                                   │
│             │ - Prepare seasonal content for spring/summer       │
│             │ - DO NOT prune pages that may surge seasonally     │
├─────────────┼───────────────────────────────────────────────────┤
│ April       │ Q1 review: Full pruning analysis                   │
│             │ - Process all recommendations from Q1 data         │
│             │ - Consolidation batch for winter service pages     │
├─────────────┼───────────────────────────────────────────────────┤
│ May–June    │ Monthly checks only                                │
│             │ - Seasonal services ramping up — avoid major prunes│
├─────────────┼───────────────────────────────────────────────────┤
│ July        │ Q2 review: Full pruning analysis                   │
│             │ - Mid-year comprehensive review                    │
│             │ - Largest pruning batch of the year                │
├─────────────┼───────────────────────────────────────────────────┤
│ August–Sept │ Monthly checks only                                │
│             │ - Prepare for fall/winter seasonal content          │
├─────────────┼───────────────────────────────────────────────────┤
│ October     │ Q3 review: Full pruning analysis                   │
│             │ - Pre-holiday season cleanup                        │
│             │ - Consolidate underperforming summer-only pages     │
├─────────────┼───────────────────────────────────────────────────┤
│ Nov–Dec     │ Hands off during peak season                       │
│             │ - Monitor only, no pruning actions                  │
│             │ - Collect data for January analysis                 │
└─────────────┴───────────────────────────────────────────────────┘
```

### Monthly Quick Check (30 minutes)

Run the automated analysis script and review only pages that:
- Dropped from page 1 to page 3+ in the last 30 days
- Received a content quality score below 30
- Were flagged by Google in GSC coverage reports as "Crawled — currently not indexed"

### Quarterly Full Analysis (Half-day)

1. Run the full pruning analysis script
2. Review all recommendations in the CSV report
3. Approve/reject each recommendation in the Payload CMS admin
4. Execute approved consolidations
5. Create and deploy redirect batches
6. Update sitemap
7. Monitor GSC coverage report for 2 weeks post-pruning

### Seasonal Considerations for Service-Area Businesses

**CRITICAL**: Never prune seasonal pages right before their peak season.

| Service Type | Peak Season | DO NOT Prune Before |
|---|---|---|
| HVAC (heating) | November–February | September |
| HVAC (cooling) | June–September | April |
| Plumbing (emergency) | December–February (frozen pipes) | October |
| Roofing | March–October (construction season) | January |
| Landscaping | March–November | January |
| Snow removal | November–March | September |
| Pool services | May–September | March |
| Pest control | April–October | February |

**Seasonal pruning safeguard in the analysis script:**

```typescript
const SEASONAL_PAGE_PATTERNS: Record<string, { peakMonths: number[] }> = {
  'heating': { peakMonths: [10, 11, 0, 1] }, // Oct–Feb (0-indexed)
  'cooling': { peakMonths: [4, 5, 6, 7, 8] }, // May–Sep
  'ac-repair': { peakMonths: [4, 5, 6, 7, 8] },
  'furnace': { peakMonths: [9, 10, 11, 0, 1] },
  'snow-removal': { peakMonths: [10, 11, 0, 1, 2] },
  'pool': { peakMonths: [3, 4, 5, 6, 7, 8] },
  'pest-control': { peakMonths: [3, 4, 5, 6, 7, 8, 9] },
};

function isApproachingPeakSeason(pageUrl: string, currentMonth: number): boolean {
  for (const [pattern, config] of Object.entries(SEASONAL_PAGE_PATTERNS)) {
    if (pageUrl.toLowerCase().includes(pattern)) {
      // Protect pages 2 months before peak season starts
      const preSeasonMonth = (config.peakMonths[0] - 2 + 12) % 12;
      const protectedMonths = [
        preSeasonMonth,
        (preSeasonMonth + 1) % 12,
        ...config.peakMonths,
      ];
      return protectedMonths.includes(currentMonth);
    }
  }
  return false;
}
```

---

## 9. Protecting New Pages from Premature Pruning

### The Indexing Timeline Problem

New pages need time to be discovered, crawled, indexed, and evaluated by Google. Pruning a page before it has had a fair chance to perform produces false negatives — you remove pages that would have performed well given time.

**Typical timeline for a new programmatic page:**

```
Day 0:   Page published, sitemap updated
Day 1-3: Googlebot discovers the URL (via sitemap or internal links)
Day 3-7: Page is crawled and enters Google's rendering queue
Day 7-14: Page appears in Google's index (may show in "Discovered" first)
Day 14-30: Initial rankings assigned; "honeymoon period" boost may apply
Day 30-90: Rankings stabilize as Google collects engagement data
Day 90-180: Steady-state performance — this is when you can reliably evaluate
```

### Grace Period Configuration

```typescript
const GRACE_PERIODS: Record<string, number> = {
  // Page type → minimum days before pruning evaluation
  'pillar': 180,            // 6 months — pillar pages build authority slowly
  'service-location': 180,  // 6 months — need time to accumulate local signals
  'deep-location': 120,     // 4 months — less competitive, faster to evaluate
  'blog': 90,               // 3 months — blog posts peak faster
  'faq': 90,                // 3 months
  'landing-page': 60,       // 2 months — campaign pages have shorter lifecycles
};
```

### Graduated Evaluation for New Pages

Instead of a binary "too new / old enough" check, use a graduated approach:

```
Page Age 0–90 days:
  → NEVER prune
  → Track metrics but take no action
  → Flag only if content quality score < 20 (indicates a template/data error)

Page Age 90–180 days:
  → Evaluate but with relaxed thresholds (2x normal minimums)
  → Only recommend "refresh" or "keep"
  → Never recommend "remove" or "noindex"

Page Age 180–365 days:
  → Full evaluation with standard thresholds
  → All recommendations available except "remove"
  → "Remove" requires manual approval

Page Age 365+ days:
  → Full evaluation, all recommendations available
  → Automated execution for clear-cut cases (zero impressions, zero backlinks)
```

### Payload CMS Implementation for Grace Periods

```typescript
// In the Pages collection — computed field for pruning eligibility
{
  name: 'pruningEligibility',
  type: 'json',
  admin: {
    readOnly: true,
    description: 'Computed pruning eligibility status',
  },
  hooks: {
    afterRead: [
      ({ data }) => {
        if (!data?.createdAt) return { eligible: false, reason: 'No creation date' };

        const ageMs = Date.now() - new Date(data.createdAt).getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const pageType = data.pageType || 'service-location';
        const gracePeriod = GRACE_PERIODS[pageType] || 180;

        if (ageDays < 90) {
          return {
            eligible: false,
            reason: `Page is ${ageDays} days old. Minimum 90 days before any evaluation.`,
            evaluationDate: new Date(new Date(data.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }

        if (ageDays < gracePeriod) {
          return {
            eligible: 'partial',
            reason: `Page is ${ageDays} days old. Relaxed thresholds apply until day ${gracePeriod}.`,
            fullEvaluationDate: new Date(new Date(data.createdAt).getTime() + gracePeriod * 24 * 60 * 60 * 1000).toISOString(),
          };
        }

        return {
          eligible: true,
          reason: `Page is ${ageDays} days old. Full evaluation thresholds apply.`,
          ageDays,
        };
      },
    ],
  },
}
```

---

## 10. Measuring Pruning Impact

### Before/After Metrics Framework

Every pruning batch must be measured. Without measurement, you cannot distinguish good pruning from harmful pruning.

**Metrics to capture BEFORE pruning:**

```typescript
interface PrePruningSnapshot {
  snapshotDate: string;
  pruningBatchId: string;

  // Site-wide metrics
  siteWide: {
    totalIndexedPages: number;       // From GSC coverage report
    totalOrganicClicks30d: number;   // From GSC
    totalImpressions30d: number;     // From GSC
    averageCTR: number;              // From GSC
    averagePosition: number;         // From GSC
    crawlRequestsPerDay: number;     // From GSC crawl stats
    totalReferringDomains: number;   // From Ahrefs
  };

  // Per-page-type metrics
  byPageType: Record<string, {
    pageCount: number;
    totalClicks30d: number;
    totalImpressions30d: number;
    averagePosition: number;
    averageQualityScore: number;
  }>;

  // Pages being pruned
  prunedPages: Array<{
    url: string;
    action: string;    // 'remove' | 'noindex' | 'consolidate' | 'redirect'
    clicks30d: number;
    impressions30d: number;
    referringDomains: number;
  }>;
}
```

**Metrics to capture AFTER pruning (at intervals):**

| Interval | What to Check | Expected Changes |
|---|---|---|
| 1 week | GSC coverage (indexed page count) | Pruned pages beginning to drop from index |
| 2 weeks | GSC crawl stats | Crawl rate may increase for remaining pages |
| 4 weeks | Organic traffic (clicks + impressions) | Remaining pages may see slight increases |
| 8 weeks | Rankings for target keywords | Improvements should be visible |
| 12 weeks | Full comparison to pre-pruning snapshot | Definitive impact assessment |

### Attribution Model

Pruning impact is hard to isolate because other factors change simultaneously (algorithm updates, competitor activity, seasonal trends). Use these techniques to attribute changes to pruning:

**1. Year-over-Year Comparison (Best)**
Compare metrics from the same date range in the prior year. If you pruned in July 2026, compare August–October 2026 to August–October 2025. This controls for seasonality.

**2. Control Group (Advanced)**
If pruning a large batch, leave a random 10% of recommended-for-pruning pages untouched. After 90 days, compare:
- Did the pruned pages' parent/sibling pages improve more than the control group's siblings?
- Did the pruned pages (the control group of unpruned ones) improve on their own or continue to decline?

**3. Page-Type Segmented Analysis**
If you only pruned location pages, compare:
- Location page performance before/after
- Pillar page performance before/after (should improve if pruning reduced quality drag)
- Blog performance before/after (unrelated pages should show indirect lift)

### Automated Impact Tracking Script

```typescript
// scripts/measure-pruning-impact.ts

interface PruningImpactReport {
  batchId: string;
  pruningDate: string;
  measurementDate: string;
  daysSincePruning: number;

  siteWideChange: {
    indexedPages: { before: number; after: number; change: number; changePercent: number };
    organicClicks: { before: number; after: number; change: number; changePercent: number };
    impressions: { before: number; after: number; change: number; changePercent: number };
    averageCTR: { before: number; after: number; change: number };
    averagePosition: { before: number; after: number; change: number };
    crawlRate: { before: number; after: number; change: number; changePercent: number };
  };

  // Performance of pages that WERE NOT pruned (the ones we kept)
  survivingPagesChange: {
    totalClicks: { before: number; after: number; changePercent: number };
    averagePosition: { before: number; after: number; change: number };
  };

  verdict: 'positive' | 'neutral' | 'negative';
  verdictReason: string;
}

function assessPruningImpact(
  preSnapshot: PrePruningSnapshot,
  postMetrics: any,
): PruningImpactReport {
  const daysSincePruning = Math.floor(
    (new Date(postMetrics.date).getTime() - new Date(preSnapshot.snapshotDate).getTime()) /
    (1000 * 60 * 60 * 24),
  );

  const clickChange = postMetrics.totalClicks - preSnapshot.siteWide.totalOrganicClicks30d;
  const clickChangePercent = (clickChange / preSnapshot.siteWide.totalOrganicClicks30d) * 100;

  const impressionChange = postMetrics.totalImpressions - preSnapshot.siteWide.totalImpressions30d;

  let verdict: 'positive' | 'neutral' | 'negative';
  let verdictReason: string;

  if (clickChangePercent > 5) {
    verdict = 'positive';
    verdictReason = `Organic clicks increased ${clickChangePercent.toFixed(1)}% since pruning`;
  } else if (clickChangePercent < -10) {
    verdict = 'negative';
    verdictReason = `Organic clicks decreased ${Math.abs(clickChangePercent).toFixed(1)}% since pruning — investigate over-pruning`;
  } else {
    verdict = 'neutral';
    verdictReason = `Organic clicks changed ${clickChangePercent.toFixed(1)}% — within normal variation`;
  }

  return {
    batchId: preSnapshot.pruningBatchId,
    pruningDate: preSnapshot.snapshotDate,
    measurementDate: postMetrics.date,
    daysSincePruning,
    siteWideChange: {
      indexedPages: {
        before: preSnapshot.siteWide.totalIndexedPages,
        after: postMetrics.indexedPages,
        change: postMetrics.indexedPages - preSnapshot.siteWide.totalIndexedPages,
        changePercent: ((postMetrics.indexedPages - preSnapshot.siteWide.totalIndexedPages) / preSnapshot.siteWide.totalIndexedPages) * 100,
      },
      organicClicks: {
        before: preSnapshot.siteWide.totalOrganicClicks30d,
        after: postMetrics.totalClicks,
        change: clickChange,
        changePercent: clickChangePercent,
      },
      impressions: {
        before: preSnapshot.siteWide.totalImpressions30d,
        after: postMetrics.totalImpressions,
        change: impressionChange,
        changePercent: (impressionChange / preSnapshot.siteWide.totalImpressions30d) * 100,
      },
      averageCTR: {
        before: preSnapshot.siteWide.averageCTR,
        after: postMetrics.averageCTR,
        change: postMetrics.averageCTR - preSnapshot.siteWide.averageCTR,
      },
      averagePosition: {
        before: preSnapshot.siteWide.averagePosition,
        after: postMetrics.averagePosition,
        change: postMetrics.averagePosition - preSnapshot.siteWide.averagePosition,
      },
      crawlRate: {
        before: preSnapshot.siteWide.crawlRequestsPerDay,
        after: postMetrics.crawlRate,
        change: postMetrics.crawlRate - preSnapshot.siteWide.crawlRequestsPerDay,
        changePercent: ((postMetrics.crawlRate - preSnapshot.siteWide.crawlRequestsPerDay) / preSnapshot.siteWide.crawlRequestsPerDay) * 100,
      },
    },
    survivingPagesChange: {
      totalClicks: {
        before: preSnapshot.siteWide.totalOrganicClicks30d,
        after: postMetrics.survivingPagesClicks,
        changePercent: ((postMetrics.survivingPagesClicks - preSnapshot.siteWide.totalOrganicClicks30d) / preSnapshot.siteWide.totalOrganicClicks30d) * 100,
      },
      averagePosition: {
        before: preSnapshot.siteWide.averagePosition,
        after: postMetrics.survivingPagesPosition,
        change: postMetrics.survivingPagesPosition - preSnapshot.siteWide.averagePosition,
      },
    },
    verdict,
    verdictReason,
  };
}
```

---

## 11. Content Quality Scoring System

### Automated Quality Score Calculation

Every page in Payload CMS receives an automated content quality score (0–100). This score is computed on save and recalculated nightly via a cron job.

**Scoring Dimensions:**

```
Content Quality Score (0–100)
  │
  ├── Word Count Score (0–20 points)
  │     0 words → 0 points
  │     100 words → 5 points
  │     300 words → 10 points
  │     600 words → 15 points
  │     1000+ words → 20 points
  │
  ├── Uniqueness Score (0–25 points)
  │     How different is this page from other pages of the same type?
  │     Uses Jaccard similarity on the page's text content
  │     > 90% unique → 25 points
  │     70–90% unique → 15 points
  │     50–70% unique → 8 points
  │     < 50% unique → 0 points
  │
  ├── Keyword Coverage Score (0–20 points)
  │     Does the page include the target keyword and semantic variants?
  │     Primary keyword in H1 → 5 points
  │     Primary keyword in first 100 words → 5 points
  │     3+ semantic variants present → 5 points
  │     Keyword in meta title + description → 5 points
  │
  ├── Structured Data Completeness (0–15 points)
  │     LocalBusiness schema present → 5 points
  │     FAQ schema present (if FAQ block exists) → 3 points
  │     Review schema present (if reviews exist) → 3 points
  │     BreadcrumbList schema present → 2 points
  │     Service schema present → 2 points
  │
  └── Engagement Score (0–20 points)
        Based on PostHog data (updated nightly)
        Bounce rate < 50% → 8 points
        Avg time on page > 60s → 6 points
        Scroll depth > 50% → 6 points
        (New pages with no data get 10/20 default)
```

### Quality Score Implementation

```typescript
// lib/content-quality-scorer.ts

interface QualityScoreInput {
  // Content fields
  bodyText: string;           // Rendered text content (HTML stripped)
  title: string;
  metaTitle: string;
  metaDescription: string;
  headings: string[];         // All H1–H3 text
  primaryKeyword: string;
  semanticKeywords: string[];

  // Structured data
  hasLocalBusinessSchema: boolean;
  hasFAQSchema: boolean;
  hasReviewSchema: boolean;
  hasBreadcrumbSchema: boolean;
  hasServiceSchema: boolean;

  // Engagement (from PostHog, may be null for new pages)
  bounceRate: number | null;
  avgTimeOnPage: number | null;
  scrollDepth: number | null;

  // Uniqueness (computed externally)
  uniquenessPercent: number;  // 0–100
}

interface QualityScoreResult {
  totalScore: number;
  breakdown: {
    wordCount: { score: number; max: number; detail: string };
    uniqueness: { score: number; max: number; detail: string };
    keywordCoverage: { score: number; max: number; detail: string };
    structuredData: { score: number; max: number; detail: string };
    engagement: { score: number; max: number; detail: string };
  };
  issues: string[];
  suggestions: string[];
}

export function calculateQualityScore(input: QualityScoreInput): QualityScoreResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // ── Word Count Score (0–20) ──
  const wordCount = input.bodyText.split(/\s+/).filter(Boolean).length;
  let wordCountScore: number;
  if (wordCount >= 1000) wordCountScore = 20;
  else if (wordCount >= 600) wordCountScore = 15;
  else if (wordCount >= 300) wordCountScore = 10;
  else if (wordCount >= 100) wordCountScore = 5;
  else wordCountScore = 0;

  if (wordCount < 300) {
    issues.push(`Thin content: only ${wordCount} words (minimum recommended: 300)`);
    suggestions.push('Add unique local information, expand service descriptions, include customer FAQs');
  }

  // ── Uniqueness Score (0–25) ──
  let uniquenessScore: number;
  if (input.uniquenessPercent >= 90) uniquenessScore = 25;
  else if (input.uniquenessPercent >= 70) uniquenessScore = 15;
  else if (input.uniquenessPercent >= 50) uniquenessScore = 8;
  else uniquenessScore = 0;

  if (input.uniquenessPercent < 70) {
    issues.push(`Low uniqueness: ${input.uniquenessPercent.toFixed(0)}% unique content`);
    suggestions.push('Add location-specific details, local landmarks, unique service considerations for this area');
  }

  // ── Keyword Coverage Score (0–20) ──
  let keywordScore = 0;
  const bodyLower = input.bodyText.toLowerCase();
  const keywordLower = input.primaryKeyword.toLowerCase();

  // Primary keyword in H1
  const h1Match = input.headings.length > 0 &&
    input.headings[0].toLowerCase().includes(keywordLower);
  if (h1Match) keywordScore += 5;
  else issues.push('Primary keyword missing from H1');

  // Primary keyword in first 100 words
  const first100Words = input.bodyText.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  if (first100Words.includes(keywordLower)) keywordScore += 5;
  else suggestions.push('Add primary keyword to the first 100 words of content');

  // Semantic variants
  const semanticMatches = input.semanticKeywords.filter((kw) =>
    bodyLower.includes(kw.toLowerCase()),
  ).length;
  if (semanticMatches >= 3) keywordScore += 5;
  else suggestions.push(`Only ${semanticMatches} of ${input.semanticKeywords.length} semantic keywords found — add more variants`);

  // Keyword in meta title + description
  const metaTitleMatch = input.metaTitle.toLowerCase().includes(keywordLower);
  const metaDescMatch = input.metaDescription.toLowerCase().includes(keywordLower);
  if (metaTitleMatch && metaDescMatch) keywordScore += 5;
  else if (metaTitleMatch || metaDescMatch) keywordScore += 3;
  else issues.push('Primary keyword missing from meta title and description');

  // ── Structured Data Completeness (0–15) ──
  let structuredDataScore = 0;
  if (input.hasLocalBusinessSchema) structuredDataScore += 5;
  else suggestions.push('Add LocalBusiness schema markup');
  if (input.hasFAQSchema) structuredDataScore += 3;
  if (input.hasReviewSchema) structuredDataScore += 3;
  if (input.hasBreadcrumbSchema) structuredDataScore += 2;
  if (input.hasServiceSchema) structuredDataScore += 2;

  // ── Engagement Score (0–20) ──
  let engagementScore = 0;
  if (input.bounceRate !== null && input.avgTimeOnPage !== null && input.scrollDepth !== null) {
    if (input.bounceRate < 50) engagementScore += 8;
    else if (input.bounceRate < 70) engagementScore += 4;

    if (input.avgTimeOnPage > 60) engagementScore += 6;
    else if (input.avgTimeOnPage > 30) engagementScore += 3;

    if (input.scrollDepth > 50) engagementScore += 6;
    else if (input.scrollDepth > 25) engagementScore += 3;
  } else {
    // New page with no engagement data — give neutral middle score (10/20 = 50%).
    // This aligns with the composite scorer's neutral defaults (50% bounce, 30s time, 50% scroll)
    // so that new pages are neither penalized nor rewarded before real data is available.
    engagementScore = 10;
  }

  const totalScore = wordCountScore + uniquenessScore + keywordScore + structuredDataScore + engagementScore;

  return {
    totalScore,
    breakdown: {
      wordCount: { score: wordCountScore, max: 20, detail: `${wordCount} words` },
      uniqueness: { score: uniquenessScore, max: 25, detail: `${input.uniquenessPercent.toFixed(0)}% unique` },
      keywordCoverage: { score: keywordScore, max: 20, detail: `${semanticMatches} semantic keywords matched` },
      structuredData: { score: structuredDataScore, max: 15, detail: `${structuredDataScore}/15 schema types present` },
      engagement: { score: engagementScore, max: 20, detail: input.bounceRate !== null ? `${input.bounceRate}% bounce, ${input.avgTimeOnPage}s avg time` : 'No data yet' },
    },
    issues,
    suggestions,
  };
}
```

### Nightly Quality Score Recalculation Cron

```typescript
// scripts/recalculate-quality-scores.ts
// Run nightly via cron: 0 3 * * * npx tsx scripts/recalculate-quality-scores.ts

import { getPayload } from 'payload';
import config from '../payload.config';
import { calculateQualityScore } from '../lib/content-quality-scorer';

async function recalculateAllScores() {
  const payload = await getPayload({ config });

  // Fetch engagement data from PostHog in bulk
  const engagementData = await fetchPostHogEngagementBulk();

  let processed = 0;
  let updated = 0;
  const batchSize = 100;
  let page = 1;

  while (true) {
    const result = await payload.find({
      collection: 'pages',
      limit: batchSize,
      page,
      depth: 1,
      where: {
        pruningStatus: { not_equals: 'removed' },
      },
    });

    if (result.docs.length === 0) break;

    for (const doc of result.docs) {
      const engagement = engagementData.get(doc.fullUrl || `/${doc.slug}`);

      const scoreResult = calculateQualityScore({
        bodyText: extractBodyText(doc),
        title: doc.title,
        metaTitle: doc.meta?.title || doc.title,
        metaDescription: doc.meta?.description || '',
        headings: extractHeadings(doc),
        primaryKeyword: doc.primaryKeyword || '',
        semanticKeywords: doc.semanticKeywords || [],
        hasLocalBusinessSchema: Boolean(doc.schema?.localBusiness),
        hasFAQSchema: Boolean(doc.schema?.faq),
        hasReviewSchema: Boolean(doc.schema?.reviews),
        hasBreadcrumbSchema: true, // Assumed always present in our stack
        hasServiceSchema: Boolean(doc.schema?.service),
        bounceRate: engagement?.bounceRate ?? null,
        avgTimeOnPage: engagement?.avgTimeOnPage ?? null,
        scrollDepth: engagement?.scrollDepth ?? null,
        uniquenessPercent: doc.uniquenessPercent || 50,
      });

      // Only update if score changed
      if (scoreResult.totalScore !== doc.contentQualityScore) {
        await payload.update({
          collection: 'pages',
          id: doc.id,
          data: {
            contentQualityScore: scoreResult.totalScore,
            qualityScoreBreakdown: scoreResult.breakdown,
            qualityIssues: scoreResult.issues,
            qualitySuggestions: scoreResult.suggestions,
            qualityScoreUpdatedAt: new Date().toISOString(),
          },
        });
        updated++;
      }

      processed++;
    }

    console.log(`Processed ${processed} pages, updated ${updated} scores`);

    if (!result.hasNextPage) break;
    page++;
  }

  console.log(`\nComplete. Processed: ${processed}, Updated: ${updated}`);
}

recalculateAllScores().catch(console.error);
```

---

## 12. Payload CMS Implementation

### Pruning Status Fields — Collection Config

Add pruning-related fields to your Pages collection:

```typescript
// collections/Pages/pruning-fields.ts

import type { Field } from 'payload';

export const pruningFields: Field[] = [
  {
    name: 'pruningStatus',
    type: 'select',
    defaultValue: 'published',
    options: [
      { label: 'Published', value: 'published' },
      { label: 'Under Review', value: 'under-review' },
      { label: 'Flagged for Refresh', value: 'flagged-refresh' },
      { label: 'Flagged for Consolidation', value: 'flagged-consolidation' },
      { label: 'Flagged for Noindex', value: 'flagged-noindex' },
      { label: 'Flagged for Removal', value: 'flagged-removal' },
      { label: 'Noindexed', value: 'noindexed' },
      { label: 'Pruned — Consolidated', value: 'pruned-consolidated' },
      { label: 'Pruned — Removed', value: 'pruned-removed' },
      { label: 'Archived', value: 'archived' },
      { label: 'Protected (Grace Period)', value: 'protected' },
    ],
    admin: {
      position: 'sidebar',
      description: 'Current pruning workflow status',
    },
    index: true,
  },
  {
    name: 'pruningAction',
    type: 'select',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Refresh Content', value: 'refresh' },
      { label: 'Consolidate', value: 'consolidate' },
      { label: 'Noindex', value: 'noindex' },
      { label: 'Remove (410)', value: 'remove' },
      { label: 'Redirect (301)', value: 'redirect' },
    ],
    admin: {
      position: 'sidebar',
      description: 'Recommended pruning action',
      condition: (data) => data?.pruningStatus !== 'published',
    },
  },
  {
    name: 'pruningDate',
    type: 'date',
    required: false, // Explicitly not required — only set when a pruning action is executed
    admin: {
      position: 'sidebar',
      // Payload date fields accept ISO 8601 strings (e.g., new Date().toISOString())
      // and store them internally as date values.
      description: 'Date the pruning action was executed',
      condition: (data) =>
        data?.pruningStatus?.startsWith('pruned-') || data?.pruningStatus === 'noindexed',
    },
  },
  {
    name: 'pruningBatchId',
    type: 'text',
    admin: {
      position: 'sidebar',
      description: 'Batch identifier for this pruning cycle',
      condition: (data) => data?.pruningStatus !== 'published',
    },
    index: true,
  },
  {
    name: 'redirectTarget',
    type: 'text',
    admin: {
      position: 'sidebar',
      description: 'URL to redirect to (for consolidated/redirected pages)',
      condition: (data) =>
        data?.pruningAction === 'consolidate' || data?.pruningAction === 'redirect',
    },
  },
  {
    name: 'archivedContent',
    type: 'json',
    admin: {
      description: 'Full page content archived before pruning (for recovery)',
      condition: (data) => data?.pruningStatus?.startsWith('pruned-'),
    },
  },
  {
    name: 'contentQualityScore',
    type: 'number',
    min: 0,
    max: 100,
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Automated content quality score (0–100)',
    },
    index: true,
  },
  {
    name: 'qualityScoreBreakdown',
    type: 'json',
    admin: {
      readOnly: true,
      description: 'Detailed breakdown of quality score components',
    },
  },
  {
    name: 'qualityIssues',
    type: 'json',
    admin: {
      readOnly: true,
      description: 'List of content quality issues found',
    },
  },
  {
    name: 'qualitySuggestions',
    type: 'json',
    admin: {
      readOnly: true,
      description: 'Suggestions for improving content quality',
    },
  },
  {
    name: 'qualityScoreUpdatedAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Last time the quality score was recalculated',
    },
  },
  {
    name: 'wordCount',
    type: 'number',
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Computed word count of unique body text',
    },
  },
  {
    name: 'uniquenessPercent',
    type: 'number',
    min: 0,
    max: 100,
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Content uniqueness compared to other pages of the same type',
    },
  },
];
```

### Redirects Collection

```typescript
// collections/Redirects.ts

import type { CollectionConfig } from 'payload';

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'type', 'reason', 'createdAt'],
    group: 'SEO',
    description: 'URL redirects — managed automatically by pruning and manually for custom redirects',
    listSearchableFields: ['from', 'to'],
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Source URL path (e.g., /services/old-page/)',
      },
      validate: (value: string) => {
        if (!value?.startsWith('/')) return 'Path must start with /';
        return true;
      },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: {
        description: 'Destination URL path (e.g., /services/new-page/)',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 — Permanent', value: '301' },
        { label: '302 — Temporary', value: '302' },
        { label: '410 — Gone', value: '410' },
      ],
    },
    {
      name: 'reason',
      type: 'select',
      options: [
        { label: 'Content Consolidation', value: 'content-consolidation' },
        { label: 'URL Restructure', value: 'url-restructure' },
        { label: 'Page Removed', value: 'page-removed' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'createdByPruning',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Was this redirect created by the automated pruning system?',
      },
    },
    {
      name: 'pruningBatchId',
      type: 'text',
      admin: {
        condition: (data) => data?.createdByPruning,
      },
      index: true,
    },
  ],
  timestamps: true,
};
```

### Pruning Admin Dashboard — Custom View

```typescript
// components/PruningDashboard.tsx
// Custom admin view for reviewing and approving pruning recommendations

'use client';

import React, { useEffect, useState } from 'react';

interface PruningStats {
  totalPages: number;
  published: number;
  underReview: number;
  flaggedRefresh: number;
  flaggedConsolidation: number;
  flaggedNoindex: number;
  flaggedRemoval: number;
  noindexed: number;
  prunedConsolidated: number;
  prunedRemoved: number;
  archived: number;
  protected: number;
  avgQualityScore: number;
  lowQualityCount: number; // score < 40
}

export const PruningDashboard: React.FC = () => {
  const [stats, setStats] = useState<PruningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPruningStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading pruning dashboard...</div>;
  if (!stats) return <div>Error loading stats</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Content Pruning Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Pages" value={stats.totalPages} />
        <StatCard label="Published" value={stats.published} color="green" />
        <StatCard label="Under Review" value={stats.underReview} color="orange" />
        <StatCard label="Avg Quality Score" value={`${stats.avgQualityScore}/100`} />
      </div>

      <h2>Pruning Queue</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Flagged: Refresh" value={stats.flaggedRefresh} color="blue" />
        <StatCard label="Flagged: Consolidate" value={stats.flaggedConsolidation} color="purple" />
        <StatCard label="Flagged: Noindex" value={stats.flaggedNoindex} color="orange" />
        <StatCard label="Flagged: Remove" value={stats.flaggedRemoval} color="red" />
      </div>

      <h2>Completed Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Noindexed" value={stats.noindexed} />
        <StatCard label="Consolidated" value={stats.prunedConsolidated} />
        <StatCard label="Removed" value={stats.prunedRemoved} />
        <StatCard label="Archived" value={stats.archived} />
      </div>

      <h2>Quality Alerts</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <StatCard label="Low Quality Pages (Score < 40)" value={stats.lowQualityCount} color="red" />
        <StatCard label="Protected (Grace Period)" value={stats.protected} color="gray" />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => window.location.href = '/admin/collections/pages?where[pruningStatus][equals]=under-review'}>
            Review Flagged Pages
          </button>
          <button onClick={() => window.location.href = '/admin/collections/pages?where[contentQualityScore][less_than]=40&sort=contentQualityScore'}>
            View Low Quality Pages
          </button>
          <button onClick={() => window.location.href = '/admin/collections/redirects?where[createdByPruning][equals]=true&sort=-createdAt'}>
            View Pruning Redirects
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; color?: string }> = ({
  label, value, color,
}) => (
  <div style={{
    padding: '1.5rem',
    borderRadius: '8px',
    background: '#f5f5f5',
    borderLeft: color ? `4px solid ${color}` : 'none',
  }}>
    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{value}</div>
  </div>
);

async function fetchPruningStats(): Promise<PruningStats> {
  const response = await fetch('/api/pruning/stats');
  return response.json();
}
```

### Pruning Stats API Endpoint

```typescript
// app/api/pruning/stats/route.ts

import { getPayload } from 'payload';
import config from '../../../../payload.config';

export async function GET() {
  const payload = await getPayload({ config });

  const statusCounts = await Promise.all([
    payload.count({ collection: 'pages', where: {} }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'published' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'under-review' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'flagged-refresh' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'flagged-consolidation' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'flagged-noindex' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'flagged-removal' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'noindexed' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'pruned-consolidated' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'pruned-removed' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'archived' } } }),
    payload.count({ collection: 'pages', where: { pruningStatus: { equals: 'protected' } } }),
    payload.count({ collection: 'pages', where: { contentQualityScore: { less_than: 40 } } }),
  ]);

  // Calculate average quality score
  const qualityResult = await payload.find({
    collection: 'pages',
    limit: 0,
    where: {
      pruningStatus: { not_equals: 'pruned-removed' },
      contentQualityScore: { exists: true },
    },
    select: { contentQualityScore: true },
  });

  const avgScore = qualityResult.docs.length > 0
    ? qualityResult.docs.reduce((sum: number, doc: any) => sum + (doc.contentQualityScore || 0), 0) / qualityResult.docs.length
    : 0;

  return Response.json({
    totalPages: statusCounts[0].totalDocs,
    published: statusCounts[1].totalDocs,
    underReview: statusCounts[2].totalDocs,
    flaggedRefresh: statusCounts[3].totalDocs,
    flaggedConsolidation: statusCounts[4].totalDocs,
    flaggedNoindex: statusCounts[5].totalDocs,
    flaggedRemoval: statusCounts[6].totalDocs,
    noindexed: statusCounts[7].totalDocs,
    prunedConsolidated: statusCounts[8].totalDocs,
    prunedRemoved: statusCounts[9].totalDocs,
    archived: statusCounts[10].totalDocs,
    protected: statusCounts[11].totalDocs,
    avgQualityScore: Math.round(avgScore),
    lowQualityCount: statusCounts[12].totalDocs,
  });
}
```

---

## 13. Bulk Operations

### Handling Pruning Decisions at Scale

With 100k+ pages, you cannot review and act on pages individually. The workflow must support bulk review, bulk approval, and batch execution.

### Bulk Status Update Script

```typescript
// scripts/bulk-pruning-update.ts
// Applies pruning recommendations from the analysis report to Payload CMS

import { getPayload } from 'payload';
import config from '../payload.config';
import * as fs from 'fs/promises';

interface PruningReportEntry {
  url: string;
  pageId: string;
  recommendation: 'keep' | 'refresh' | 'consolidate' | 'noindex' | 'remove';
  consolidateTarget?: string;
}

async function applyPruningRecommendations(reportPath: string, dryRun = true) {
  const payload = await getPayload({ config });

  const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));
  const recommendations: PruningReportEntry[] = report.recommendations;

  const batchId = `prune-${new Date().toISOString().split('T')[0]}`;

  const statusMap: Record<string, string> = {
    keep: 'published',
    refresh: 'flagged-refresh',
    consolidate: 'flagged-consolidation',
    noindex: 'flagged-noindex',
    remove: 'flagged-removal',
  };

  let updated = 0;
  let errors = 0;

  // Count entries that will be skipped (kept as-is)
  const skipped = recommendations.filter((rec) => rec.recommendation === 'keep').length;

  // Process in batches of 50 to avoid overwhelming the database
  const batchSize = 50;

  for (let i = 0; i < recommendations.length; i += batchSize) {
    const batch = recommendations.slice(i, i + batchSize);

    const updatePromises = batch
      .filter((rec) => rec.recommendation !== 'keep')
      .map(async (rec) => {
        try {
          if (dryRun) {
            console.log(`[DRY RUN] Would update ${rec.pageId}: ${rec.recommendation}`);
            return;
          }

          await payload.update({
            collection: 'pages',
            id: rec.pageId,
            data: {
              pruningStatus: statusMap[rec.recommendation],
              pruningAction: rec.recommendation,
              pruningBatchId: batchId,
              ...(rec.consolidateTarget && { redirectTarget: rec.consolidateTarget }),
            },
          });

          updated++;
        } catch (err) {
          console.error(`Error updating ${rec.pageId}: ${err}`);
          errors++;
        }
      });

    await Promise.all(updatePromises);
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: processed ${batch.length} pages`);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  BULK UPDATE ${dryRun ? '(DRY RUN)' : 'COMPLETE'}`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Batch ID: ${batchId}`);
  console.log(`Total recommendations: ${recommendations.length}`);
  console.log(`  Keep (no change): ${skipped}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`═══════════════════════════════════════\n`);
}

// Usage:
// DRY RUN:  npx tsx scripts/bulk-pruning-update.ts ./pruning-report-2026-04-09.json --dry-run
// EXECUTE:  npx tsx scripts/bulk-pruning-update.ts ./pruning-report-2026-04-09.json

const [, , reportPath, dryRunFlag] = process.argv;
if (!reportPath) {
  console.error('Usage: npx tsx scripts/bulk-pruning-update.ts <report-path> [--dry-run]');
  process.exit(1);
}

applyPruningRecommendations(reportPath, dryRunFlag === '--dry-run').catch(console.error);
```

### Batch Redirect Creation

```typescript
// scripts/batch-create-redirects.ts

import { getPayload } from 'payload';
import config from '../payload.config';

async function createRedirectsForPrunedPages() {
  const payload = await getPayload({ config });

  // Find all pages flagged for consolidation or removal that have a redirect target
  const prunedPages = await payload.find({
    collection: 'pages',
    limit: 0,
    where: {
      and: [
        {
          or: [
            { pruningStatus: { equals: 'flagged-consolidation' } },
            { pruningStatus: { equals: 'flagged-removal' } },
          ],
        },
        { redirectTarget: { exists: true } },
      ],
    },
    select: {
      slug: true,
      fullUrl: true,
      redirectTarget: true,
      pruningAction: true,
      pruningBatchId: true,
    },
  });

  console.log(`Found ${prunedPages.docs.length} pages needing redirects`);

  let created = 0;
  let skipped = 0;

  for (const page of prunedPages.docs) {
    const fromUrl = (page as any).fullUrl || `/${(page as any).slug}`;
    const toUrl = (page as any).redirectTarget;

    if (!toUrl) {
      skipped++;
      continue;
    }

    // Check if redirect already exists
    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: fromUrl } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log(`Redirect already exists: ${fromUrl}`);
      skipped++;
      continue;
    }

    // Validate: no redirect chains
    const chainCheck = await payload.find({
      collection: 'redirects',
      where: { from: { equals: toUrl } },
      limit: 1,
    });

    let finalTarget = toUrl;
    if (chainCheck.docs.length > 0) {
      finalTarget = (chainCheck.docs[0] as any).to;
      console.log(`Avoiding chain: ${fromUrl} → ${toUrl} → ${finalTarget}. Using direct: ${fromUrl} → ${finalTarget}`);
    }

    await payload.create({
      collection: 'redirects',
      data: {
        from: fromUrl,
        to: finalTarget,
        type: '301',
        reason: 'content-consolidation',
        createdByPruning: true,
        pruningBatchId: (page as any).pruningBatchId,
      },
    });

    created++;
  }

  console.log(`\nRedirects created: ${created}, Skipped: ${skipped}`);
}

createRedirectsForPrunedPages().catch(console.error);
```

### Executing the Pruning Batch

After redirects are created and reviewed, execute the pruning actions:

```typescript
// scripts/execute-pruning-batch.ts

import { getPayload } from 'payload';
import config from '../payload.config';

async function executePruningBatch(batchId: string) {
  const payload = await getPayload({ config });

  // ── 1. Take pre-pruning snapshot ──
  console.log('Taking pre-pruning snapshot...');
  const snapshot = await takePrePruningSnapshot(payload, batchId);
  const snapshotPath = `./pruning-snapshots/${batchId}-pre.json`;
  const fs = await import('fs/promises');
  await fs.mkdir('./pruning-snapshots', { recursive: true });
  await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot saved: ${snapshotPath}`);

  // ── 2. Execute noindex actions ──
  const noindexPages = await payload.find({
    collection: 'pages',
    limit: 0,
    where: {
      pruningBatchId: { equals: batchId },
      pruningStatus: { equals: 'flagged-noindex' },
    },
  });

  for (const page of noindexPages.docs) {
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        pruningStatus: 'noindexed',
        pruningDate: new Date().toISOString(),
      },
    });
  }
  console.log(`Noindexed: ${noindexPages.docs.length} pages`);

  // ── 3. Execute consolidation actions ──
  const consolidatePages = await payload.find({
    collection: 'pages',
    limit: 0,
    where: {
      pruningBatchId: { equals: batchId },
      pruningStatus: { equals: 'flagged-consolidation' },
    },
    depth: 2,
  });

  for (const page of consolidatePages.docs) {
    // Archive the content before pruning
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        pruningStatus: 'pruned-consolidated',
        pruningDate: new Date().toISOString(),
        archivedContent: JSON.stringify(page),
      },
    });
  }
  console.log(`Consolidated: ${consolidatePages.docs.length} pages`);

  // ── 4. Execute removal actions ──
  const removePages = await payload.find({
    collection: 'pages',
    limit: 0,
    where: {
      pruningBatchId: { equals: batchId },
      pruningStatus: { equals: 'flagged-removal' },
    },
    depth: 2,
  });

  for (const page of removePages.docs) {
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        pruningStatus: 'pruned-removed',
        pruningDate: new Date().toISOString(),
        archivedContent: JSON.stringify(page),
      },
    });
  }
  console.log(`Removed: ${removePages.docs.length} pages`);

  // ── 5. Summary ──
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  PRUNING BATCH EXECUTED: ${batchId}`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Noindexed: ${noindexPages.docs.length}`);
  console.log(`Consolidated: ${consolidatePages.docs.length}`);
  console.log(`Removed: ${removePages.docs.length}`);
  console.log(`Total affected: ${noindexPages.docs.length + consolidatePages.docs.length + removePages.docs.length}`);
  console.log(`Pre-pruning snapshot: ${snapshotPath}`);
  console.log(`\nIMPORTANT: Rebuild site and deploy to apply noindex tags and redirects.`);
  console.log(`IMPORTANT: Monitor GSC coverage report daily for the next 2 weeks.`);
  console.log(`═══════════════════════════════════════\n`);
}

async function takePrePruningSnapshot(payload: any, batchId: string) {
  const allPages = await payload.find({
    collection: 'pages',
    limit: 0,
    where: { pruningStatus: { not_equals: 'pruned-removed' } },
    select: {
      slug: true,
      fullUrl: true,
      contentQualityScore: true,
      pageType: true,
      pruningStatus: true,
      pruningBatchId: true,
    },
  });

  return {
    snapshotDate: new Date().toISOString(),
    pruningBatchId: batchId,
    totalPages: allPages.docs.length,
    pagesByStatus: {
      published: allPages.docs.filter((d: any) => d.pruningStatus === 'published').length,
      flaggedRefresh: allPages.docs.filter((d: any) => d.pruningStatus === 'flagged-refresh').length,
      flaggedConsolidation: allPages.docs.filter((d: any) => d.pruningStatus === 'flagged-consolidation').length,
      flaggedNoindex: allPages.docs.filter((d: any) => d.pruningStatus === 'flagged-noindex').length,
      flaggedRemoval: allPages.docs.filter((d: any) => d.pruningStatus === 'flagged-removal').length,
    },
    pagesInBatch: allPages.docs
      .filter((d: any) => d.pruningBatchId === batchId)
      .map((d: any) => ({
        url: d.fullUrl || `/${d.slug}`,
        pageType: d.pageType,
        qualityScore: d.contentQualityScore,
        status: d.pruningStatus,
      })),
  };
}

// Usage: npx tsx scripts/execute-pruning-batch.ts prune-2026-04-09
const [, , batchId] = process.argv;
if (!batchId) {
  console.error('Usage: npx tsx scripts/execute-pruning-batch.ts <batch-id>');
  process.exit(1);
}

executePruningBatch(batchId).catch(console.error);
```

---

## 14. Recovery from Over-Pruning

### Detecting Over-Pruning

Over-pruning occurs when you remove or noindex pages that were actually contributing to your site's topical authority or serving user queries you did not realize existed. Signs of over-pruning:

**Immediate indicators (1–2 weeks):**
- Organic traffic drops more than 10% site-wide (compared to the same period last year)
- Rankings for non-pruned pages decline (collateral damage)
- GSC shows a significant increase in "Discovered — currently not indexed" for non-pruned pages
- Crawl rate decreases instead of the expected increase

**Delayed indicators (4–8 weeks):**
- Referring domains decline (external sites find broken links and remove them)
- Internal link equity flow disrupted (orphaned pages emerge)
- Competitor rankings improve for queries your pruned pages targeted
- Bounce rate increases on remaining pages (wrong pages serving the query)

### Recovery Playbook

```
Over-Pruning Detected
  │
  ├── Step 1: Assess the damage (1 day)
  │     ├── Compare current metrics to pre-pruning snapshot
  │     ├── Identify which pruned pages correlated with traffic loss
  │     ├── Check if the decline is in the pruned pages' topic area
  │     └── Rule out other causes (algorithm update, seasonal shift, competitor)
  │
  ├── Step 2: Prioritize recovery candidates (1 day)
  │     ├── Pages that had backlinks → highest priority
  │     ├── Pages in topic clusters that saw ranking drops → high priority
  │     ├── Pages that had impressions but were below threshold → medium priority
  │     └── Pages with zero metrics in all categories → do not restore
  │
  ├── Step 3: Restore from archive (same day)
  │     ├── Retrieve archived content from Payload CMS
  │     ├── Republish pages at the same URL
  │     ├── Remove noindex tags
  │     ├── Remove 301 redirects (redirect target keeps its content)
  │     └── Submit restored URLs to GSC for immediate reindexing
  │
  ├── Step 4: Rebuild internal links (1–2 days)
  │     ├── Ensure restored pages have proper internal linking
  │     ├── Re-add to sitemap
  │     └── Trigger a rebuild/redeploy
  │
  └── Step 5: Monitor recovery (4–8 weeks)
        ├── Track daily: impressions, clicks, average position
        ├── Compare week-over-week for upward trend
        ├── Full recovery typically takes 4–8 weeks
        └── Document lessons learned for future pruning
```

### Automated Recovery Script

```typescript
// scripts/recover-pruned-pages.ts

import { getPayload } from 'payload';
import config from '../payload.config';

export async function recoverPrunedPages(pageIds: string[]) {
  const payload = await getPayload({ config });

  let recovered = 0;
  let redirectsRemoved = 0;
  const errors: string[] = [];

  for (const pageId of pageIds) {
    try {
      // 1. Fetch the archived page
      const page = await payload.findByID({
        collection: 'pages',
        id: pageId,
      });

      if (!page) {
        errors.push(`Page not found: ${pageId}`);
        continue;
      }

      const archivedContent = (page as any).archivedContent;
      if (!archivedContent) {
        errors.push(`No archived content for page: ${pageId}`);
        continue;
      }

      const originalData = typeof archivedContent === 'string'
        ? JSON.parse(archivedContent)
        : archivedContent;

      // 2. Restore the page to published status
      await payload.update({
        collection: 'pages',
        id: pageId,
        data: {
          pruningStatus: 'published',
          pruningAction: 'none' as any,
          pruningDate: null,
          pruningBatchId: null,
          // Restore content fields from archive if they were cleared
          ...(originalData.content && { content: originalData.content }),
          ...(originalData.meta && { meta: originalData.meta }),
        },
      });

      // 3. Remove any redirects FROM this page's URL
      const pageUrl = (page as any).fullUrl || `/${(page as any).slug}`;
      const redirects = await payload.find({
        collection: 'redirects',
        where: { from: { equals: pageUrl } },
      });

      for (const redirect of redirects.docs) {
        await payload.delete({
          collection: 'redirects',
          id: redirect.id,
        });
        redirectsRemoved++;
      }

      recovered++;
      console.log(`Recovered: ${pageUrl}`);

    } catch (err) {
      errors.push(`Error recovering ${pageId}: ${err}`);
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  RECOVERY COMPLETE`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Pages recovered: ${recovered}`);
  console.log(`Redirects removed: ${redirectsRemoved}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`\nError details:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log(`\nNEXT STEPS:`);
  console.log(`1. Rebuild and deploy the site`);
  console.log(`2. Submit recovered URLs to GSC URL Inspection for reindexing`);
  console.log(`3. Update the sitemap`);
  console.log(`4. Monitor recovered pages for 4–8 weeks`);
  console.log(`═══════════════════════════════════════\n`);
}

// Usage: npx tsx scripts/recover-pruned-pages.ts page-id-1 page-id-2 page-id-3
const pageIds = process.argv.slice(2);
if (pageIds.length === 0) {
  console.error('Usage: npx tsx scripts/recover-pruned-pages.ts <page-id-1> [page-id-2] ...');
  process.exit(1);
}

recoverPrunedPages(pageIds).catch(console.error);
```

### Batch Recovery from a Pruning Batch

```typescript
// scripts/recover-pruning-batch.ts

import { getPayload } from 'payload';
import config from '../payload.config';

async function recoverEntireBatch(batchId: string) {
  const payload = await getPayload({ config });

  // Find all pages from this batch
  const batchPages = await payload.find({
    collection: 'pages',
    limit: 0,
    where: {
      pruningBatchId: { equals: batchId },
      pruningStatus: {
        in: ['pruned-consolidated', 'pruned-removed', 'noindexed'],
      },
    },
    select: { id: true },
  });

  const pageIds = batchPages.docs.map((d) => d.id);
  console.log(`Found ${pageIds.length} pages from batch ${batchId} to recover`);

  if (pageIds.length === 0) {
    console.log('No pages to recover.');
    return;
  }

  // Import and call the single-page recovery function
  const { recoverPrunedPages } = await import('./recover-pruned-pages');
  await recoverPrunedPages(pageIds);
}

const [, , batchId] = process.argv;
if (!batchId) {
  console.error('Usage: npx tsx scripts/recover-pruning-batch.ts <batch-id>');
  process.exit(1);
}

recoverEntireBatch(batchId).catch(console.error);
```

### Preventing Over-Pruning in Future Batches

1. **Maximum pruning percentage per batch**: Never prune more than 15% of total pages in a single batch. If the analysis recommends pruning 30%, split into two batches 4–6 weeks apart.

2. **Mandatory control group**: Leave 10% of recommended-for-pruning pages untouched as a control group. Evaluate after 8 weeks before proceeding with the remaining 10%.

3. **Backlink safety net**: Never remove or noindex any page with referring domains > 0 without manual review. Automated pruning should only affect pages with zero backlinks.

4. **Topic cluster protection**: If more than 50% of pages in a single topic cluster are flagged for pruning, flag the entire cluster for manual review. Removing too many pages from a cluster can destroy topical authority.

5. **Always archive before pruning**: Every page must have its full content stored in `archivedContent` before any status change. This is non-negotiable.

```typescript
// Payload CMS hook to enforce archive-before-prune
{
  name: 'pages',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        if (operation !== 'update') return data;

        const pruneStatuses = ['pruned-consolidated', 'pruned-removed', 'noindexed'];
        const isPruning = pruneStatuses.includes(data.pruningStatus);
        const wasPruned = originalDoc && pruneStatuses.includes(originalDoc.pruningStatus);

        if (isPruning && !wasPruned) {
          // Transitioning to a pruned state — archive is mandatory
          if (!data.archivedContent && !originalDoc?.archivedContent) {
            data.archivedContent = JSON.stringify(originalDoc);
          }
        }

        return data;
      },
    ],
  },
}
```

---

## Appendix A: Complete Pruning Workflow — Step by Step

```
1. ANALYZE (Automated — Monthly/Quarterly)
   └── Run: npx tsx scripts/pruning-analysis.ts
   └── Output: pruning-report-YYYY-MM-DD.json + .csv

2. REVIEW (Manual — Admin Dashboard)
   └── Open Payload CMS → Pruning Dashboard
   └── Review flagged pages by category
   └── Approve, reject, or modify recommendations
   └── Set priority for refresh queue

3. APPLY FLAGS (Automated)
   └── Run: npx tsx scripts/bulk-pruning-update.ts report.json
   └── (Use --dry-run first, then without flag)

4. CREATE REDIRECTS (Automated)
   └── Run: npx tsx scripts/batch-create-redirects.ts
   └── Verify in Payload CMS → Redirects collection

5. EXECUTE (Automated with manual trigger)
   └── Run: npx tsx scripts/execute-pruning-batch.ts prune-YYYY-MM-DD
   └── Pre-pruning snapshot is saved automatically

6. DEPLOY
   └── Rebuild site (Astro static build + Next.js)
   └── Verify redirects work (spot-check 10 URLs)
   └── Verify noindex tags are present on noindexed pages
   └── Submit updated sitemap to GSC

7. MONITOR (Automated — Daily for 2 weeks, then weekly)
   └── Track GSC coverage changes
   └── Track organic traffic trends
   └── Compare to pre-pruning snapshot
   └── Alert if traffic drops > 10%

8. MEASURE (Manual — 8–12 weeks post-pruning)
   └── Run: npx tsx scripts/measure-pruning-impact.ts prune-YYYY-MM-DD
   └── Compare to pre-pruning snapshot
   └── Document findings for next cycle

9. RECOVER (If needed)
   └── Run: npx tsx scripts/recover-pruning-batch.ts prune-YYYY-MM-DD
   └── Redeploy, resubmit to GSC
```

---

## Appendix B: Key Principles Summary

1. **Pruning is not deleting — it is quality control.** The goal is to raise the average quality of your indexed pages, not to reduce page count.

2. **Site-wide quality signals mean every page matters.** One thousand thin pages can suppress rankings for your entire domain.

3. **Always preserve SEO equity.** If a page has backlinks, use 301 redirects, never 410/404.

4. **Protect new pages.** A 6-month grace period prevents false negatives from immature pages.

5. **Measure everything.** Take pre-pruning snapshots, track post-pruning impact, maintain a control group.

6. **Archive before acting.** Every pruned page must have its content preserved for potential recovery.

7. **Prune in batches, not all at once.** Maximum 15% of total pages per batch, with 4–6 weeks between batches.

8. **Seasonal awareness is critical.** Never prune seasonal service pages before their peak season.

9. **Automate analysis, not decisions.** Scripts generate recommendations; humans approve them.

10. **Recovery is always possible.** The system is designed so any pruning action can be reversed.
