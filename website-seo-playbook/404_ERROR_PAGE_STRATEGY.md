# 404 / Error Page Strategy — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers custom error pages, soft 404 prevention, URL change management, broken link detection, and error monitoring for programmatic SEO sites with 100k+ pages.

# 404 / Error Page Strategy for Large-Scale Programmatic SEO

---

## Table of Contents

1. [Custom 404 Page Design](#1-custom-404-page-design)
2. [Soft 404 Detection and Prevention](#2-soft-404-detection-and-prevention)
3. [Hard 404 vs 410 Gone](#3-hard-404-vs-410-gone)
4. [Handling Removed Services](#4-handling-removed-services)
5. [Handling Removed Locations](#5-handling-removed-locations)
6. [URL Change Management](#6-url-change-management)
7. [Broken Link Detection at Scale](#7-broken-link-detection-at-scale)
8. [Error Monitoring](#8-error-monitoring)
9. [Redirect Chain Prevention](#9-redirect-chain-prevention)
10. [Custom Error Pages in Astro and Next.js](#10-custom-error-pages-in-astro-and-nextjs)
11. [Payload CMS Integration](#11-payload-cms-integration)
12. [Google's Handling of 404s at Scale](#12-googles-handling-of-404s-at-scale)

---

## 1. Custom 404 Page Design

### Why the 404 Page Matters

For a programmatic SEO site with 100k+ pages, the 404 page is not an afterthought — it is a retention tool. At scale, users will encounter 404s. Old bookmarks, shared links on social media, cached search results from deindexed pages, and typos all drive traffic to URLs that no longer exist. A well-designed 404 page converts a dead end into a navigation opportunity.

From an SEO perspective, a custom 404 page does not directly affect rankings, but it indirectly affects engagement signals. A user who hits a 404, finds a search bar, and navigates to the correct page generates a session with multiple pageviews instead of bouncing. Google uses Chrome UX data and engagement patterns as quality signals. A site where users consistently bounce from 404s looks worse than one where users recover.

### What to Include on Every 404 Page

#### Required Elements

| Element | Purpose | Implementation Notes |
|---------|---------|---------------------|
| **Brand header/logo** | Reassures the user they are on the right site | Same header as all other pages — never a blank page |
| **Clear "page not found" message** | Honest communication — do not pretend the page exists | Use natural language: "We could not find that page" |
| **Search bar** | Primary recovery mechanism — lets users find what they wanted | Autofocus the search input; search should cover services, locations, and blog |
| **Popular/suggested links** | Guides users to high-value pages | Show top services, top locations, recent blog posts |
| **Primary CTA** | Converts the visit into a lead | "Call us" button, "Get a Free Quote" form, or "Book Online" |
| **Contact information** | For service-area businesses, always show the phone number | Click-to-call on mobile |
| **Navigation** | Full site navigation so users can self-serve | Same nav as every other page |
| **Footer** | Consistency and additional navigation | Same footer as every other page |

#### Recommended Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Intelligent suggestions** | Parse the requested URL to guess what the user wanted. If the URL contains "plumbing" and "austin," suggest `/plumbing/austin-tx` |
| **Recently visited pages** | If you track sessions, show pages the user visited before hitting the 404 |
| **Nearby locations** | For service-area sites, detect the user's approximate location via IP and suggest the nearest service area page |
| **Service category links** | Group suggestions by service category for easier scanning |

### SEO Requirements for the 404 Page

- **Must return HTTP 404 status code** — never return 200 on a 404 page. This is the single most important technical requirement. A 200 status on a "page not found" page is a soft 404 (covered in Section 2).
- **Must include `<meta name="robots" content="noindex">` tag** — the 404 page itself should never be indexed.
- **Must not be in the XML sitemap** — never include `/404` or `/404.html` in any sitemap.
- **Should NOT include a canonical tag** — a page returning a 404 status code should not have a canonical tag. The `noindex` meta tag is sufficient to prevent indexing. Adding a canonical tag to a 404 page sends conflicting signals to search engines (canonical implies the page is valid, while 404 says it does not exist).
- **Should use the same template/layout as the rest of the site** — consistency builds trust and keeps the user oriented.

### User Retention Strategies

**URL Parsing for Smart Suggestions**

When a user hits a 404, parse the requested URL to extract potential intent signals:

```typescript
// src/utils/parse-404-intent.ts

interface SuggestionContext {
  possibleService: string | null;
  possibleLocation: string | null;
  possibleState: string | null;
  suggestedUrls: string[];
}

export function parse404Intent(requestedPath: string): SuggestionContext {
  const segments = requestedPath.split('/').filter(Boolean);
  const context: SuggestionContext = {
    possibleService: null,
    possibleLocation: null,
    possibleState: null,
    suggestedUrls: [],
  };

  // Common US state abbreviations
  const stateAbbreviations = new Set([
    'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in',
    'ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv',
    'nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn',
    'tx','ut','vt','va','wa','wv','wi','wy',
  ]);

  for (const segment of segments) {
    // Check if segment ends with a state abbreviation (e.g., "austin-tx")
    const parts = segment.split('-');
    const lastPart = parts[parts.length - 1]?.toLowerCase();

    if (lastPart && stateAbbreviations.has(lastPart) && parts.length > 1) {
      context.possibleLocation = parts.slice(0, -1).join('-');
      context.possibleState = lastPart;
    } else if (!context.possibleService) {
      // First non-location segment is likely the service
      context.possibleService = segment;
    }
  }

  // Build suggested URLs based on extracted intent
  if (context.possibleService && context.possibleLocation && context.possibleState) {
    context.suggestedUrls.push(
      `/${context.possibleService}/${context.possibleLocation}-${context.possibleState}`
    );
  }
  if (context.possibleService) {
    context.suggestedUrls.push(`/${context.possibleService}`);
  }
  if (context.possibleLocation && context.possibleState) {
    context.suggestedUrls.push(
      `/locations/${context.possibleLocation}-${context.possibleState}`
    );
  }

  return context;
}
```

**Fuzzy URL Matching**

For large sites, maintain a list of all valid URLs and perform fuzzy matching against the requested path:

```typescript
// src/utils/fuzzy-url-match.ts

import { distance as levenshtein } from 'fastest-levenshtein';

interface FuzzyMatch {
  url: string;
  score: number;
}

export function findClosestUrls(
  requestedPath: string,
  validUrls: string[],
  maxResults: number = 5,
  maxDistance: number = 5
): FuzzyMatch[] {
  const normalizedRequest = requestedPath.toLowerCase().replace(/\/$/, '');

  const matches: FuzzyMatch[] = validUrls
    .map((url) => ({
      url,
      score: levenshtein(normalizedRequest, url.toLowerCase()),
    }))
    .filter((match) => match.score <= maxDistance)
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);

  return matches;
}
```

> **Performance note**: For sites with 100k+ URLs, do not run fuzzy matching on every 404 request in real time. Pre-compute a search index at build time or use a search service (Algolia, Meilisearch, or even a simple prefix trie). The fuzzy matching utility above is suitable for sites under 10k URLs or for build-time precomputation.

---

## 2. Soft 404 Detection and Prevention

### What Google Considers a Soft 404

A soft 404 occurs when a page that should return a 404 (or 410) HTTP status code instead returns a 200 OK status. Google identifies soft 404s using multiple signals:

1. **Content analysis**: The page says "not found," "page doesn't exist," "no results," or similar phrases but returns 200.
2. **Thin content**: The page has almost no unique content — just a header, footer, and a sentence or two.
3. **Empty search results**: A search results page or listing page with zero results returns 200.
4. **Template-only pages**: A page renders the template/layout but has no substantive content in the main content area.
5. **Redirect to homepage**: The URL redirects (via JS or meta refresh) to the homepage instead of returning 404. Google treats this as a soft 404.
6. **Duplicate "not found" content**: Multiple URLs return identical "page not found" content with 200 status.

### Why Soft 404s Are Dangerous at Scale

For a programmatic SEO site with 100k+ pages, soft 404s are one of the most damaging technical SEO issues:

- **Crawl budget waste**: Google spends resources crawling and re-crawling pages that return 200 but have no value. At 100k pages, this directly competes with real pages for crawl bandwidth.
- **Index bloat**: Soft 404 pages can get indexed, polluting search results with empty or broken pages.
- **Quality signals**: A site with thousands of soft 404s signals low quality to Google's site-wide quality algorithms.
- **GSC inflation**: Soft 404s appear as "Valid" pages in Google Search Console's indexing report, masking the true number of indexed pages.

### Common Causes in Programmatic SEO Sites

| Cause | Example | Fix |
|-------|---------|-----|
| **Empty service-location pages** | `/plumbing/small-town-mt` renders the template but has no content because the CMS has no data for that combination | Return 404 if no data exists for the service-location pair |
| **Deleted CMS entries still generating pages** | Service "duct-cleaning" was deleted but the route still builds a page with empty content | Check if the entry exists before rendering; return 404 if not |
| **Query parameter variations** | `/plumbing/austin-tx?page=999` returns an empty pagination page with 200 | Return 404 for pagination pages beyond the last page |
| **Draft/unpublished content** | CMS entry is set to "draft" but the frontend still renders the URL with partial content | Filter by `status: 'published'` in all data fetches |
| **Case sensitivity** | `/Plumbing/Austin-TX` renders a template with no data because slug lookup is case-sensitive | Normalize slugs to lowercase; redirect uppercase variants to lowercase |
| **Trailing content after valid slugs** | `/plumbing/austin-tx/fake-subpage` matches a catch-all route and renders empty | Validate the full URL path, not just the first segment |

### Prevention Implementation

#### Rule 1: Always Validate Data Before Rendering

Every dynamic route must check that the data exists and is substantive before rendering:

```astro
---
// src/pages/[service]/[location].astro
import { getServiceBySlug, getLocationBySlug } from '@/lib/api';

const { service: serviceSlug, location: locationSlug } = Astro.params;

const service = await getServiceBySlug(serviceSlug);
const location = await getLocationBySlug(locationSlug);

// Hard requirement: both must exist and be published
if (!service || !location) {
  return new Response(null, { status: 404, statusText: 'Not Found' });
}

// Additional check: does this service-location combination have content?
if (!service.description || service.description.trim().length < 100) {
  // Thin content — do not render, return 404
  return new Response(null, { status: 404, statusText: 'Not Found' });
}
---
<!-- Only reaches here if data is valid and substantive -->
<Layout title={`${service.name} in ${location.name}`}>
  <ServiceLocationPage service={service} location={location} />
</Layout>
```

#### Rule 2: Validate at Build Time for Static Sites

For Astro sites using static generation (the default and recommended mode for programmatic SEO), `getStaticPaths()` controls which pages get built. Only return paths for valid, published, content-rich entries:

```typescript
// src/pages/[service]/[location].astro — getStaticPaths
export async function getStaticPaths() {
  const services = await fetchAllPublishedServices();
  const locations = await fetchAllPublishedLocations();

  const paths = [];

  for (const service of services) {
    for (const location of locations) {
      // Only build pages where we have real content
      const hasContent = service.description && service.description.length >= 100;
      const isActiveLocation = location.status === 'active';

      if (hasContent && isActiveLocation) {
        paths.push({
          params: {
            service: service.slug,
            location: location.slug,
          },
          props: { service, location },
        });
      }
    }
  }

  return paths;
}
```

Any URL not returned by `getStaticPaths()` will automatically receive a 404 response. This is the primary defense against soft 404s in static Astro builds.

#### Rule 3: Minimum Content Thresholds

Define minimum content requirements for each page type and enforce them:

```typescript
// src/lib/content-validation.ts

interface ContentThresholds {
  minDescriptionLength: number;
  requiredFields: string[];
  minSections: number;
}

const PAGE_TYPE_THRESHOLDS: Record<string, ContentThresholds> = {
  'service-location': {
    minDescriptionLength: 100,
    requiredFields: ['description', 'title', 'metaDescription'],
    minSections: 2,
  },
  'service-pillar': {
    minDescriptionLength: 300,
    requiredFields: ['description', 'title', 'metaDescription', 'faqs'],
    minSections: 4,
  },
  'location-pillar': {
    minDescriptionLength: 200,
    requiredFields: ['description', 'title', 'metaDescription'],
    minSections: 3,
  },
  'blog-post': {
    minDescriptionLength: 500,
    requiredFields: ['content', 'title', 'metaDescription', 'author'],
    minSections: 1,
  },
};

export function isContentSufficient(
  pageType: string,
  data: Record<string, unknown>
): boolean {
  const thresholds = PAGE_TYPE_THRESHOLDS[pageType];
  if (!thresholds) return false;

  // Check required fields
  for (const field of thresholds.requiredFields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return false;
    }
  }

  // Check minimum description length
  const description = data.description as string | undefined;
  if (!description || description.trim().length < thresholds.minDescriptionLength) {
    return false;
  }

  return true;
}
```

#### Rule 4: Build-Time Soft 404 Audit

Run an automated check after every build that scans rendered HTML files for soft 404 indicators:

```typescript
// scripts/audit-soft-404s.ts

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const SOFT_404_INDICATORS = [
  /page\s*(not|can.?t be)\s*found/i,
  /404/,
  /no\s*results?\s*found/i,
  /this\s*page\s*does\s*not\s*exist/i,
  /nothing\s*here/i,
  /oops/i,
  /sorry.*could\s*not\s*find/i,
];

const MIN_CONTENT_LENGTH = 500; // Minimum characters of text content (excluding HTML tags)

interface SoftAuditResult {
  file: string;
  issues: string[];
}

async function auditBuildOutput(distDir: string): Promise<SoftAuditResult[]> {
  const results: SoftAuditResult[] = [];

  async function walkDir(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        const html = await readFile(fullPath, 'utf-8');
        const issues: string[] = [];

        // Check for soft 404 phrases
        for (const pattern of SOFT_404_INDICATORS) {
          if (pattern.test(html)) {
            // Exclude the actual 404 page itself
            if (!fullPath.includes('/404')) {
              issues.push(`Contains soft 404 indicator: ${pattern.source}`);
            }
          }
        }

        // Check for thin content
        const textContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (textContent.length < MIN_CONTENT_LENGTH && !fullPath.includes('/404')) {
          issues.push(
            `Thin content: only ${textContent.length} characters (minimum: ${MIN_CONTENT_LENGTH})`
          );
        }

        if (issues.length > 0) {
          results.push({ file: fullPath.replace(distDir, ''), issues });
        }
      }
    }
  }

  await walkDir(distDir);
  return results;
}

// Run the audit
const distDir = process.argv[2] || './dist';
auditBuildOutput(distDir).then((results) => {
  if (results.length === 0) {
    console.log('No soft 404 issues detected.');
    process.exit(0);
  }

  console.error(`Found ${results.length} potential soft 404 pages:\n`);
  for (const result of results) {
    console.error(`  ${result.file}`);
    for (const issue of result.issues) {
      console.error(`    - ${issue}`);
    }
  }
  process.exit(1);
});
```

---

## 3. Hard 404 vs 410 Gone

### Status Code Definitions

| Code | Name | Meaning | Cacheability |
|------|------|---------|-------------|
| **404** | Not Found | The server cannot find the requested resource. The resource may or may not have existed previously. The condition may be temporary. | Short-lived — Google will re-crawl periodically |
| **410** | Gone | The resource existed previously but has been intentionally and permanently removed. No forwarding address is provided. | Long-lived — Google deindexes faster and stops re-crawling sooner |

### When to Use Each

| Scenario | Status Code | Rationale |
|----------|-------------|-----------|
| URL was never valid (typo, scan attempt, random path) | **404** | The resource never existed. 404 is the correct semantic response |
| Service was discontinued permanently | **410** | Tells Google to deindex faster and stop wasting crawl budget |
| Location removed from service area permanently | **410** | Same as above — the page existed and is now permanently gone |
| CMS entry was deleted by accident | **404** | Temporary — may be restored. 404 gives Google reason to check back |
| Page is temporarily down for maintenance | **503** | Not a 404 scenario — use 503 Service Unavailable with Retry-After header |
| Page moved to a new URL | **301** | Not a 404 scenario — redirect, do not show error |
| Seasonal service page (e.g., snow removal in summer) | **200** (keep live) | Do not 404 seasonal pages. Keep them live with modified content |

### Impact on Crawl Budget and Deindexing Speed

**404 Behavior**:
- Google will continue to re-crawl 404 URLs periodically (decreasing frequency over time).
- Typically takes 2-6 weeks for Google to fully deindex a 404 page.
- Google may keep the URL in its crawl queue for months, checking back occasionally.
- At 100k pages, if you have 5,000 URLs returning 404, Google is spending crawl budget re-checking all of them.

**410 Behavior**:
- Google treats 410 as a stronger signal that the page is permanently gone.
- Deindexing is typically faster — often within 1-2 weeks.
- Google drops the URL from its crawl queue sooner, freeing crawl budget.
- For large-scale deletions (removing an entire service category or an entire state's worth of locations), 410 is the correct choice.

**Google's Official Position** (from Google Search Central documentation, confirmed through 2025):
> "In practice, Google treats 404 and 410 the same way in the long run. Both will eventually be removed from the index. However, 410 may cause the URL to be removed slightly faster."

The "slightly faster" qualification is important at scale. When you remove 10,000 pages simultaneously (e.g., dropping a service line), the difference between "slightly faster" and "normal speed" translates to weeks of crawl budget savings.

### Implementation

```typescript
// src/lib/error-responses.ts

/**
 * Return a 410 Gone response for permanently removed content.
 * Use when a CMS entry was deliberately deleted and will not return.
 */
export function goneResponse(): Response {
  return new Response(null, {
    status: 410,
    statusText: 'Gone',
    headers: {
      'X-Robots-Tag': 'noindex',
    },
  });
}

/**
 * Return a 404 Not Found response for missing content.
 * Use when content was never valid or may be temporarily missing.
 */
export function notFoundResponse(): Response {
  return new Response(null, {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'X-Robots-Tag': 'noindex',
    },
  });
}
```

---

## 4. Handling Removed Services

When a service-area business discontinues a service, every page related to that service must be handled correctly. For a site with 500 locations and 20 services, removing one service means handling 500+ URLs (the service pillar page plus all service-location pages).

### Decision Tree

```
Service "duct-cleaning" is being removed. What to do?

1. Is there a replacement service?
   |-- YES -> 301 redirect all duct-cleaning URLs to the replacement service
   |          Example: /duct-cleaning/austin-tx -> /hvac-cleaning/austin-tx
   |
   +-- NO -> Is the service related to another existing service?
             |-- YES -> 301 redirect to the parent/related service
             |          Example: /duct-cleaning/austin-tx -> /hvac/austin-tx
             |
             +-- NO -> 410 Gone for all URLs
                       No redirect target exists. Signal permanent removal.
```

### Implementation in Payload CMS

#### Step 1: Add a "Removal Status" Field to the Services Collection

```typescript
// collections/Services.ts — additional fields for removal handling

{
  name: 'removalStatus',
  type: 'select',
  defaultValue: 'active',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Redirected', value: 'redirected' },
    { label: 'Gone (410)', value: 'gone' },
  ],
  admin: {
    description: 'Set to "Redirected" or "Gone" when discontinuing this service.',
    position: 'sidebar',
  },
},
{
  name: 'redirectTo',
  type: 'relationship',
  relationTo: 'services',
  admin: {
    description: 'If status is "Redirected," which service should this redirect to?',
    condition: (data) => data.removalStatus === 'redirected',
  },
},
{
  name: 'removedAt',
  type: 'date',
  admin: {
    readOnly: true,
    description: 'Automatically set when the service is marked as removed.',
    condition: (data) => data.removalStatus !== 'active',
  },
},
```

#### Step 2: Hook to Set Removal Date

```typescript
// collections/Services.ts — beforeChange hook

const setRemovalDate: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
}) => {
  if (operation === 'update') {
    const wasActive = originalDoc?.removalStatus === 'active';
    const isNowRemoved = data.removalStatus && data.removalStatus !== 'active';

    if (wasActive && isNowRemoved) {
      data.removedAt = new Date().toISOString();
    }

    // If reactivated, clear the removal date
    if (!wasActive && data.removalStatus === 'active') {
      data.removedAt = null;
    }
  }

  return data;
};
```

#### Step 3: Generate Redirects at Build Time

```typescript
// src/lib/generate-service-redirects.ts

import type { Payload } from 'payload';

interface Redirect {
  source: string;
  destination: string;
  status: 301 | 410;
}

export async function generateServiceRedirects(
  payload: Payload
): Promise<Redirect[]> {
  const redirects: Redirect[] = [];

  // Fetch all removed/redirected services
  const removedServices = await payload.find({
    collection: 'services',
    where: {
      removalStatus: { not_equals: 'active' },
    },
    limit: 0,
    depth: 1,
  });

  // Fetch all active locations for building URL combinations
  const locations = await payload.find({
    collection: 'locations',
    where: { status: { equals: 'active' } },
    limit: 0,
    depth: 0,
  });

  for (const service of removedServices.docs) {
    if (service.removalStatus === 'redirected' && service.redirectTo) {
      const targetService =
        typeof service.redirectTo === 'string'
          ? (await payload.findByID({ collection: 'services', id: service.redirectTo }))
          : service.redirectTo;

      // Redirect the pillar page
      redirects.push({
        source: `/${service.slug}`,
        destination: `/${targetService.slug}`,
        status: 301,
      });

      // Redirect every service-location combination
      for (const location of locations.docs) {
        redirects.push({
          source: `/${service.slug}/${location.slug}`,
          destination: `/${targetService.slug}/${location.slug}`,
          status: 301,
        });
      }
    } else if (service.removalStatus === 'gone') {
      // 410 Gone — no redirect target
      redirects.push({
        source: `/${service.slug}`,
        destination: '',
        status: 410,
      });

      for (const location of locations.docs) {
        redirects.push({
          source: `/${service.slug}/${location.slug}`,
          destination: '',
          status: 410,
        });
      }
    }
  }

  return redirects;
}
```

### Content Archival

Before removing a service, archive the content for potential future use:

1. **Export the CMS data**: Use Payload's REST API to export the full document as JSON.
2. **Store in a `removed-content` collection** (see Section 11) with the original slug, content, and removal date.
3. **Keep for at least 12 months**: Content may need to be restored if the service is reinstated.
4. **Do not delete the CMS entry** — instead, mark it with `removalStatus: 'gone'` or `'redirected'`. This preserves the data and the `previousSlugs` history.

---

## 5. Handling Removed Locations

When a business stops serving a city or region, the approach differs from service removal because the geographic dimension has unique implications for nearby locations.

### Decision Tree

```
Business stops serving "small-town-mt." What to do?

1. Is there a nearby location still served?
   |-- YES -> 301 redirect to the nearest active location
   |          Example: /plumbing/small-town-mt -> /plumbing/nearby-city-mt
   |          Include a note on the target page: "We also serve Small Town, MT"
   |
   +-- NO -> Is the entire state/region being dropped?
             |-- YES -> 410 Gone for all location pages in that state
             |          Also remove from XML sitemap immediately
             |
             +-- NO -> 301 redirect to the state/region pillar page
                       Example: /plumbing/small-town-mt -> /plumbing/montana
```

### Redirect vs 410 for Locations

| Scenario | Action | Reason |
|----------|--------|--------|
| Dropping one city, neighboring cities still active | 301 to nearest city | Preserves link equity; user intent is still serviceable |
| Dropping all cities in a metro area | 301 to state pillar | Broader redirect target preserves some relevance |
| Dropping an entire state | 410 Gone | No relevant redirect target in that geography |
| Temporarily pausing service in a city | Keep page live, update content | Do not 404 temporary pauses |
| Franchise territory change | 301 to new franchise's URL | Coordinate with the new operator |

### Content Consolidation

When removing locations, consolidate link equity rather than destroying it:

1. **Identify inbound links**: Check Google Search Console, Ahrefs, or similar tools for external links pointing to the removed location pages.
2. **Prioritize 301s for pages with backlinks**: Even if the location is being permanently dropped, if `/plumbing/small-town-mt` has 15 backlinks, redirect it to the nearest city page rather than returning 410.
3. **Update internal links**: After removing locations, run the broken link scanner (Section 7) to find and fix all internal links pointing to removed location URLs.
4. **Update the XML sitemap**: Remove the location URLs from the sitemap in the same deployment that adds the redirects.

### Implementation for Location Removal

```typescript
// collections/Locations.ts — additional fields

{
  name: 'removalStatus',
  type: 'select',
  defaultValue: 'active',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Redirected to Nearby', value: 'redirected' },
    { label: 'Gone (410)', value: 'gone' },
  ],
},
{
  name: 'redirectToLocation',
  type: 'relationship',
  relationTo: 'locations',
  admin: {
    condition: (data) => data.removalStatus === 'redirected',
    description: 'Redirect all service pages for this location to the corresponding pages for this target location.',
  },
},
```

```typescript
// src/lib/generate-location-redirects.ts

import type { Payload } from 'payload';

export async function generateLocationRedirects(payload: Payload) {
  const redirects: Array<{ source: string; destination: string; status: 301 | 410 }> = [];

  const removedLocations = await payload.find({
    collection: 'locations',
    where: { removalStatus: { not_equals: 'active' } },
    limit: 0,
    depth: 1,
  });

  const activeServices = await payload.find({
    collection: 'services',
    where: { removalStatus: { equals: 'active' } },
    limit: 0,
    depth: 0,
  });

  for (const location of removedLocations.docs) {
    if (location.removalStatus === 'redirected' && location.redirectToLocation) {
      const targetLocation =
        typeof location.redirectToLocation === 'string'
          ? await payload.findByID({ collection: 'locations', id: location.redirectToLocation })
          : location.redirectToLocation;

      // Redirect the location pillar page
      redirects.push({
        source: `/locations/${location.slug}`,
        destination: `/locations/${targetLocation.slug}`,
        status: 301,
      });

      // Redirect every service-location combination
      for (const service of activeServices.docs) {
        redirects.push({
          source: `/${service.slug}/${location.slug}`,
          destination: `/${service.slug}/${targetLocation.slug}`,
          status: 301,
        });
      }
    } else if (location.removalStatus === 'gone') {
      redirects.push({
        source: `/locations/${location.slug}`,
        destination: '',
        status: 410,
      });

      for (const service of activeServices.docs) {
        redirects.push({
          source: `/${service.slug}/${location.slug}`,
          destination: '',
          status: 410,
        });
      }
    }
  }

  return redirects;
}
```

---

## 6. URL Change Management

### The Problem at Scale

When a slug changes in Payload CMS — whether a service name update, a location rename, or a blog post title edit — every URL that previously existed under the old slug becomes a broken link. For a service with 500 location pages, changing the service slug from `ac-repair` to `air-conditioning-repair` breaks 501 URLs (1 pillar + 500 location pages).

The [URL Structure Rules](./URL_STRUCTURE_RULES.md) document defines the `previousSlugs` field and the `beforeChange` hook that automatically tracks slug history. This section builds on that foundation with the complete redirect generation pipeline.

### Automatic Redirect Generation from previousSlugs

The `previousSlugs` field (defined in URL_STRUCTURE_RULES.md) stores an array of `{ slug, changedAt }` objects. At build time, this array is used to generate 301 redirects.

#### Complete Redirect Map Generator

```typescript
// src/lib/generate-all-redirects.ts

import type { Payload } from 'payload';

interface RedirectEntry {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * Generates the complete redirect map from:
 * 1. previousSlugs on all collections
 * 2. Removed services (redirect or 410)
 * 3. Removed locations (redirect or 410)
 *
 * This function is called at build time.
 */
export async function generateAllRedirects(
  payload: Payload
): Promise<RedirectEntry[]> {
  const redirects: RedirectEntry[] = [];

  // --- 1. Service slug changes ---
  const services = await payload.find({
    collection: 'services',
    limit: 0,
    depth: 0,
  });

  const activeLocations = await payload.find({
    collection: 'locations',
    where: { removalStatus: { equals: 'active' } },
    limit: 0,
    depth: 0,
  });

  for (const service of services.docs) {
    if (!service.previousSlugs || !Array.isArray(service.previousSlugs)) continue;

    for (const prev of service.previousSlugs) {
      // Redirect old service pillar URL
      redirects.push({
        source: `/${prev.slug}`,
        destination: `/${service.slug}`,
        permanent: true,
      });

      // Redirect old service-location combinations
      for (const location of activeLocations.docs) {
        redirects.push({
          source: `/${prev.slug}/${location.slug}`,
          destination: `/${service.slug}/${location.slug}`,
          permanent: true,
        });
      }
    }
  }

  // --- 2. Location slug changes ---
  const locations = await payload.find({
    collection: 'locations',
    limit: 0,
    depth: 0,
  });

  const activeServices = services.docs.filter(
    (s) => !s.removalStatus || s.removalStatus === 'active'
  );

  for (const location of locations.docs) {
    if (!location.previousSlugs || !Array.isArray(location.previousSlugs)) continue;

    for (const prev of location.previousSlugs) {
      // Redirect old location pillar URL
      redirects.push({
        source: `/locations/${prev.slug}`,
        destination: `/locations/${location.slug}`,
        permanent: true,
      });

      // Redirect old service-location combinations
      for (const service of activeServices) {
        redirects.push({
          source: `/${service.slug}/${prev.slug}`,
          destination: `/${service.slug}/${location.slug}`,
          permanent: true,
        });
      }
    }
  }

  // --- 3. Blog post slug changes ---
  const posts = await payload.find({
    collection: 'posts',
    limit: 0,
    depth: 0,
  });

  for (const post of posts.docs) {
    if (!post.previousSlugs || !Array.isArray(post.previousSlugs)) continue;

    for (const prev of post.previousSlugs) {
      redirects.push({
        source: `/blog/${prev.slug}`,
        destination: `/blog/${post.slug}`,
        permanent: true,
      });
    }
  }

  // --- Deduplicate ---
  const seen = new Set<string>();
  const deduped: RedirectEntry[] = [];

  for (const redirect of redirects) {
    if (!seen.has(redirect.source)) {
      seen.add(redirect.source);
      deduped.push(redirect);
    }
  }

  return deduped;
}
```

#### Astro Integration — Redirect Config

```typescript
// astro.config.mjs — using the redirect map

import { defineConfig } from 'astro/config';
import { generateAllRedirects } from './src/lib/generate-all-redirects';
import { getPayloadClient } from './src/lib/payload-client';

export default defineConfig({
  redirects: await buildRedirectMap(),
  // ... other config
});

async function buildRedirectMap() {
  const payload = await getPayloadClient();
  const redirects = await generateAllRedirects(payload);

  const redirectMap: Record<string, string> = {};

  for (const redirect of redirects) {
    if (redirect.permanent && redirect.destination) {
      redirectMap[redirect.source] = redirect.destination;
    }
  }

  return redirectMap;
}
```

> **Important**: Astro's built-in `redirects` config only supports 301/302 redirects, not 410 responses. For 410 handling, use middleware (SSR mode) or a platform-specific mechanism like Vercel's `vercel.json`, Netlify's `_redirects`, or Cloudflare's `_redirects`.

#### Vercel Configuration for 410 Responses

> **Note**: Vercel's `rewrites` in `vercel.json` do not support a `statusCode` property. The rewrite silently ignores it and serves the response with a 200 status. Use one of the following approaches instead.

**Option 1: Vercel Middleware (recommended)**

Create a `middleware.ts` at the project root to intercept matched paths and return a 410 directly:

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const gonePaths = [
  /^\/duct-cleaning(\/.*)?$/,
  /^\/locations\/small-town-mt$/,
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (gonePaths.some((pattern) => pattern.test(pathname))) {
    return new Response(null, {
      status: 410,
      statusText: 'Gone',
      headers: { 'X-Robots-Tag': 'noindex' },
    });
  }

  return NextResponse.next();
}
```

**Option 2: API route returning 410**

If using a rewrite to `/api/gone`, ensure the API route itself returns 410:

```typescript
// pages/api/gone.ts (or app/api/gone/route.ts)

export function GET() {
  return new Response(null, { status: 410, statusText: 'Gone' });
}
```

#### Netlify Configuration for 410 Responses

> **Note**: Netlify's `_redirects` file does not natively support 410 status codes. The `_redirects` syntax only supports 3xx redirect status codes and 200 for rewrites. The following will not work as expected:

```
# _redirects file — THIS DOES NOT WORK for 410 responses

/duct-cleaning/*  /410.html  410
/locations/small-town-mt  /410.html  410
```

**Use Netlify Edge Functions instead:**

```typescript
// netlify/edge-functions/gone.ts

import type { Context } from '@netlify/edge-functions';

const gonePaths = [
  /^\/duct-cleaning(\/.*)?$/,
  /^\/locations\/small-town-mt$/,
];

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  if (gonePaths.some((pattern) => pattern.test(url.pathname))) {
    return new Response(null, {
      status: 410,
      statusText: 'Gone',
      headers: { 'X-Robots-Tag': 'noindex' },
    });
  }

  return context.next();
};

export const config = { path: ['/*'] };
```

---

## 7. Broken Link Detection at Scale

### Why Automated Scanning Is Non-Negotiable

At 100k+ pages, manual link checking is impossible. A single template change can break thousands of internal links. A CMS editor renaming a service can orphan 500 location pages. Broken internal links waste crawl budget, degrade user experience, and leak link equity into 404s.

### Pre-Build Link Validation

Before deploying, validate that every internal link in the content will resolve to a real page:

```typescript
// scripts/validate-internal-links.ts

import type { Payload } from 'payload';

interface BrokenLink {
  sourceCollection: string;
  sourceId: string;
  sourceSlug: string;
  brokenUrl: string;
  field: string;
}

/**
 * Scans all rich text and link fields in the CMS for internal links
 * that point to URLs which do not correspond to any published page.
 */
export async function validateInternalLinks(
  payload: Payload
): Promise<BrokenLink[]> {
  const brokenLinks: BrokenLink[] = [];

  // Build the set of all valid URLs
  const validUrls = new Set<string>();

  const services = await payload.find({
    collection: 'services',
    where: { removalStatus: { equals: 'active' } },
    limit: 0,
    depth: 0,
  });

  const locations = await payload.find({
    collection: 'locations',
    where: { removalStatus: { equals: 'active' } },
    limit: 0,
    depth: 0,
  });

  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  });

  // Register all valid URLs
  for (const service of services.docs) {
    validUrls.add(`/${service.slug}`);
    for (const location of locations.docs) {
      validUrls.add(`/${service.slug}/${location.slug}`);
    }
  }
  for (const location of locations.docs) {
    validUrls.add(`/locations/${location.slug}`);
  }
  for (const post of posts.docs) {
    validUrls.add(`/blog/${post.slug}`);
  }
  validUrls.add('/');
  validUrls.add('/about');
  validUrls.add('/contact');
  validUrls.add('/blog');

  // Scan all collections for internal links
  const collectionsToScan = [
    { slug: 'services', docs: services.docs },
    { slug: 'locations', docs: locations.docs },
    { slug: 'posts', docs: posts.docs },
  ];

  for (const collection of collectionsToScan) {
    for (const doc of collection.docs) {
      const jsonString = JSON.stringify(doc);
      // Regex with /g flag must be declared inside the inner loop (or
      // re-created per iteration). A /g regex declared outside retains
      // its lastIndex across iterations, causing it to skip matches or
      // resume mid-string on the next document.
      const internalLinkPattern = /href=["'](\/[^"']*?)["']/g;
      let match: RegExpExecArray | null;

      while ((match = internalLinkPattern.exec(jsonString)) !== null) {
        const url = match[1];
        // Normalize: remove trailing slash, query params, and hash
        const normalizedUrl = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';

        if (!validUrls.has(normalizedUrl)) {
          brokenLinks.push({
            sourceCollection: collection.slug,
            sourceId: doc.id,
            sourceSlug: doc.slug,
            brokenUrl: normalizedUrl,
            field: 'unknown (found in serialized document)',
          });
        }
      }
    }
  }

  return brokenLinks;
}
```

### Post-Build HTML Link Scanning

After the build completes, crawl the generated HTML files to find broken internal links:

```typescript
// scripts/scan-build-links.ts

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import * as cheerio from 'cheerio';

interface BrokenBuildLink {
  sourcePage: string;
  brokenHref: string;
  anchorText: string;
}

async function getAllHtmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllHtmlFiles(fullPath)));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function htmlPathToUrl(htmlPath: string, distDir: string): string {
  let url = '/' + relative(distDir, htmlPath).replace(/\\/g, '/');
  url = url.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  return url || '/';
}

export async function scanBuildForBrokenLinks(
  distDir: string
): Promise<BrokenBuildLink[]> {
  const htmlFiles = await getAllHtmlFiles(distDir);
  const brokenLinks: BrokenBuildLink[] = [];

  // Build the set of all pages that exist in the build output
  const existingPages = new Set<string>();
  for (const file of htmlFiles) {
    existingPages.add(htmlPathToUrl(file, distDir));
  }

  // Scan each HTML file for internal links
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf-8');
    const $ = cheerio.load(html);
    const sourcePage = htmlPathToUrl(file, distDir);

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      // Only check internal links
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (href.startsWith('#')) return;

      // Normalize the URL
      const normalizedHref = href.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';

      // Skip assets
      if (/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|pdf)$/i.test(normalizedHref)) {
        return;
      }

      if (!existingPages.has(normalizedHref)) {
        brokenLinks.push({
          sourcePage,
          brokenHref: normalizedHref,
          anchorText: $(element).text().trim().substring(0, 100),
        });
      }
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  return brokenLinks.filter((link) => {
    const key = `${link.sourcePage}::${link.brokenHref}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// CLI runner
const distDir = process.argv[2] || './dist';
scanBuildForBrokenLinks(distDir).then((brokenLinks) => {
  if (brokenLinks.length === 0) {
    console.log('No broken internal links found.');
    process.exit(0);
  }

  console.error(`Found ${brokenLinks.length} broken internal links:\n`);

  // Group by source page
  const grouped = new Map<string, BrokenBuildLink[]>();
  for (const link of brokenLinks) {
    const existing = grouped.get(link.sourcePage) || [];
    existing.push(link);
    grouped.set(link.sourcePage, existing);
  }

  for (const [page, links] of grouped) {
    console.error(`  ${page}`);
    for (const link of links) {
      console.error(`    -> ${link.brokenHref} (text: "${link.anchorText}")`);
    }
  }

  process.exit(1);
});
```

### CI Integration

Add link validation to your CI/CD pipeline so broken links fail the build:

```yaml
# .github/workflows/build-and-validate.yml

name: Build and Validate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build the site
        run: pnpm build
        env:
          PAYLOAD_API_URL: ${{ secrets.PAYLOAD_API_URL }}

      - name: Validate internal links (pre-build CMS scan)
        run: pnpm tsx scripts/validate-internal-links.ts

      - name: Scan build output for broken links
        run: pnpm tsx scripts/scan-build-links.ts ./dist

      - name: Audit for soft 404s
        run: pnpm tsx scripts/audit-soft-404s.ts ./dist

      - name: Check redirect chains
        run: pnpm tsx scripts/detect-redirect-chains.ts
```

```json
// package.json — scripts

{
  "scripts": {
    "validate:links": "tsx scripts/validate-internal-links.ts",
    "validate:build-links": "tsx scripts/scan-build-links.ts ./dist",
    "validate:soft-404s": "tsx scripts/audit-soft-404s.ts ./dist",
    "validate:redirect-chains": "tsx scripts/detect-redirect-chains.ts",
    "validate:all": "pnpm validate:links && pnpm build && pnpm validate:build-links && pnpm validate:soft-404s && pnpm validate:redirect-chains"
  }
}
```

---

## 8. Error Monitoring

### What to Track

| Metric | Source | Action Threshold |
|--------|--------|-----------------|
| **Total 404 hits per day** | Server logs / analytics | Investigate if > 1% of total traffic |
| **Unique 404 URLs per day** | Server logs | Investigate if > 50 new unique 404s in a day |
| **404 URLs crawled by Googlebot** | Server logs (filter by user agent) | Any Googlebot 404 is worth investigating |
| **Crawled-but-not-indexed pages** | Google Search Console > Pages > "Crawled - currently not indexed" | May indicate soft 404 detection |
| **404 pages in GSC** | Google Search Console > Pages > "Not found (404)" | Normal to have some; investigate spikes |
| **Referrer of 404 hits** | Server logs | Internal referrers = broken links to fix |
| **Redirect chain depth** | Redirect audit script | Any chain > 2 hops needs flattening |

### Server Log Analysis

For sites deployed on Vercel, Netlify, or Cloudflare, access logs via their respective APIs or dashboards. For self-hosted deployments, parse access logs directly:

```typescript
// scripts/analyze-404-logs.ts

import { readFile } from 'fs/promises';

interface Log404Entry {
  url: string;
  count: number;
  lastSeen: string;
  userAgents: Set<string>;
  referrers: Set<string>;
  isGooglebot: boolean;
}

/**
 * Parse a standard access log (Common Log Format or Combined Log Format)
 * and extract all 404 entries.
 */
export async function analyze404Logs(logFilePath: string): Promise<Log404Entry[]> {
  const logContent = await readFile(logFilePath, 'utf-8');
  const lines = logContent.split('\n').filter(Boolean);

  const entries = new Map<string, Log404Entry>();

  // Combined Log Format regex
  const logPattern =
    /^(\S+) \S+ \S+ \[([^\]]+)\] "(?:GET|POST|HEAD) (\S+) HTTP\/\S+" (404) \d+ "([^"]*)" "([^"]*)"/;

  for (const line of lines) {
    const match = logPattern.exec(line);
    if (!match) continue;

    const [, , timestamp, url, statusCode, referrer, userAgent] = match;

    if (statusCode !== '404') continue;

    const existing = entries.get(url);
    if (existing) {
      existing.count++;
      existing.lastSeen = timestamp;
      existing.userAgents.add(userAgent);
      if (referrer !== '-') existing.referrers.add(referrer);
      if (/googlebot/i.test(userAgent)) existing.isGooglebot = true;
    } else {
      entries.set(url, {
        url,
        count: 1,
        lastSeen: timestamp,
        userAgents: new Set([userAgent]),
        referrers: new Set(referrer !== '-' ? [referrer] : []),
        isGooglebot: /googlebot/i.test(userAgent),
      });
    }
  }

  // Sort by count descending
  return Array.from(entries.values()).sort((a, b) => b.count - a.count);
}

// CLI runner
const logFile = process.argv[2];
if (!logFile) {
  console.error('Usage: tsx scripts/analyze-404-logs.ts <path-to-access-log>');
  process.exit(1);
}

analyze404Logs(logFile).then((entries) => {
  console.log(`\nTotal unique 404 URLs: ${entries.length}`);
  console.log(`Total 404 hits: ${entries.reduce((sum, e) => sum + e.count, 0)}`);
  console.log(
    `Googlebot 404s: ${entries.filter((e) => e.isGooglebot).length} unique URLs\n`
  );

  console.log('Top 50 most-hit 404 URLs:');
  console.log('-'.repeat(80));

  for (const entry of entries.slice(0, 50)) {
    console.log(`  ${entry.count.toString().padStart(6)} hits  ${entry.url}`);
    if (entry.isGooglebot) console.log(`          * Crawled by Googlebot`);
    if (entry.referrers.size > 0) {
      for (const ref of Array.from(entry.referrers).slice(0, 3)) {
        console.log(`          <- Referrer: ${ref}`);
      }
    }
  }
});
```

### Google Search Console Integration

Use the GSC API to programmatically fetch crawl and indexing data:

```typescript
// scripts/fetch-gsc-404s.ts

import { google } from 'googleapis';

interface GSC404Report {
  url: string;
  lastCrawled: string;
  category: string;
}

export async function fetchGSC404s(
  siteUrl: string,
  authKeyFile: string
): Promise<GSC404Report[]> {
  const auth = new google.auth.GoogleAuth({
    keyFile: authKeyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // The URL Inspection API inspects one URL at a time.
  // For bulk analysis, use the Search Analytics API to find
  // pages with zero impressions (potential deindexed pages)
  // or use the GSC "Pages" export from the web UI.

  // Bulk approach: fetch pages with zero clicks/impressions
  // that were previously performing
  const report = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: getDateNDaysAgo(30),
      endDate: getDateNDaysAgo(1),
      dimensions: ['page'],
      rowLimit: 25000,
      dataState: 'all',
    },
  });

  return (report.data.rows || []).map((row) => ({
    url: row.keys?.[0] || '',
    lastCrawled: '',
    category: 'indexed',
  }));
}

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}
```

### Automated Alerting

Set up automated alerts for 404 spikes. This can integrate with Slack, email, or any notification system:

```typescript
// scripts/alert-404-spike.ts

interface AlertConfig {
  maxUnique404sPerDay: number;
  maxTotal404HitsPerDay: number;
  maxGooglebot404sPerDay: number;
  webhookUrl: string; // Slack webhook, Discord webhook, etc.
}

const DEFAULT_CONFIG: AlertConfig = {
  maxUnique404sPerDay: 50,
  maxTotal404HitsPerDay: 500,
  maxGooglebot404sPerDay: 10,
  webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
};

interface DailySummary {
  date: string;
  unique404Count: number;
  total404Hits: number;
  googlebot404Count: number;
  topUrls: Array<{ url: string; count: number }>;
}

export async function checkAndAlert(
  summary: DailySummary,
  config: AlertConfig = DEFAULT_CONFIG
): Promise<void> {
  const alerts: string[] = [];

  if (summary.unique404Count > config.maxUnique404sPerDay) {
    alerts.push(
      `Unique 404 URLs (${summary.unique404Count}) exceeded threshold (${config.maxUnique404sPerDay})`
    );
  }

  if (summary.total404Hits > config.maxTotal404HitsPerDay) {
    alerts.push(
      `Total 404 hits (${summary.total404Hits}) exceeded threshold (${config.maxTotal404HitsPerDay})`
    );
  }

  if (summary.googlebot404Count > config.maxGooglebot404sPerDay) {
    alerts.push(
      `Googlebot 404 crawls (${summary.googlebot404Count}) exceeded threshold (${config.maxGooglebot404sPerDay})`
    );
  }

  if (alerts.length === 0) return;

  const message = {
    text: `*404 Alert for ${summary.date}*\n\n${alerts.join('\n')}\n\nTop 404 URLs:\n${summary.topUrls
      .slice(0, 10)
      .map((u) => `- ${u.url} (${u.count} hits)`)
      .join('\n')}`,
  };

  if (config.webhookUrl) {
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } else {
    console.warn('No webhook URL configured. Alert message:');
    console.warn(message.text);
  }
}
```

---

## 9. Redirect Chain Prevention

### What Is a Redirect Chain

A redirect chain occurs when URL A redirects to URL B, which redirects to URL C (and potentially further). Each hop in the chain:

1. **Adds latency**: Every redirect adds 50-300ms of round-trip time.
2. **Loses link equity**: Google passes most (but not all) PageRank through 301 redirects. Each hop loses a small amount. Three hops can lose 10-15% of the original link equity.
3. **Wastes crawl budget**: Googlebot follows redirect chains but may abandon chains longer than 5 hops. Every hop is a wasted crawl.
4. **Risks timeout**: Browsers follow redirect chains up to a limit (typically 20 hops for Chrome, 20 for Firefox). Beyond that, the user sees an error.

### How Chains Form in Programmatic SEO

Chains form when slugs change multiple times:

```
1. Original URL: /ac-repair/austin-tx
2. Slug changes to: /air-conditioning-repair/austin-tx
   Redirect: /ac-repair/austin-tx -> /air-conditioning-repair/austin-tx (1 hop)
3. Slug changes again to: /ac-service/austin-tx
   New redirect: /air-conditioning-repair/austin-tx -> /ac-service/austin-tx
   Chain: /ac-repair/austin-tx -> /air-conditioning-repair/austin-tx -> /ac-service/austin-tx (2 hops)
```

### Maximum Acceptable Redirect Hops

| Hops | Verdict | Action |
|------|---------|--------|
| 1 | Ideal | No action needed |
| 2 | Acceptable | Monitor but do not fix unless at scale |
| 3 | Fix needed | Flatten to 1 hop |
| 4+ | Critical | Fix immediately — link equity loss is significant |

### Redirect Chain Detection Script

```typescript
// scripts/detect-redirect-chains.ts

import { generateAllRedirects } from '../src/lib/generate-all-redirects';
import { getPayloadClient } from '../src/lib/payload-client';

interface RedirectChain {
  originalSource: string;
  chain: string[];
  depth: number;
}

export async function detectRedirectChains(): Promise<RedirectChain[]> {
  const payload = await getPayloadClient();
  const redirects = await generateAllRedirects(payload);

  // Build a lookup map: source -> destination
  const redirectMap = new Map<string, string>();
  for (const redirect of redirects) {
    if (redirect.destination) {
      redirectMap.set(redirect.source, redirect.destination);
    }
  }

  const chains: RedirectChain[] = [];

  // NOTE: This detection algorithm is O(n^2) in the worst case because each
  // source traces its full chain independently, potentially re-visiting the
  // same nodes. For large redirect maps (10k+ entries), pre-build a Map of
  // each source to its resolved final destination in a single O(n) pass
  // (following each chain once and memoizing results) instead of re-tracing
  // from every starting node.
  for (const [source] of redirectMap) {
    const chain: string[] = [source];
    let current = source;
    const visited = new Set<string>();

    while (redirectMap.has(current)) {
      const next = redirectMap.get(current)!;

      // Detect infinite loops
      if (visited.has(next)) {
        chain.push(`${next} (LOOP DETECTED)`);
        break;
      }

      visited.add(current);
      chain.push(next);
      current = next;
    }

    if (chain.length > 2) {
      // Chain depth is number of redirects, not number of URLs
      chains.push({
        originalSource: source,
        chain,
        depth: chain.length - 1,
      });
    }
  }

  return chains.sort((a, b) => b.depth - a.depth);
}

// CLI runner
detectRedirectChains().then((chains) => {
  if (chains.length === 0) {
    console.log('No redirect chains detected.');
    process.exit(0);
  }

  console.error(`Found ${chains.length} redirect chains:\n`);

  for (const chain of chains) {
    const severity = chain.depth >= 4 ? 'CRITICAL' : chain.depth >= 3 ? 'WARNING' : 'INFO';
    console.error(`  [${severity}] Depth ${chain.depth}: ${chain.chain.join(' -> ')}`);
  }

  // Fail CI if any chain is 3+ hops
  const criticalChains = chains.filter((c) => c.depth >= 3);
  if (criticalChains.length > 0) {
    console.error(`\n${criticalChains.length} chains with 3+ hops need flattening.`);
    process.exit(1);
  }

  process.exit(0);
});
```

### Automatic Chain Flattening

When generating redirects, automatically flatten chains so that every source points directly to the final destination:

```typescript
// src/lib/flatten-redirects.ts

import type { RedirectEntry } from './generate-all-redirects';

/**
 * Takes a list of redirects and flattens any chains so that
 * every source points directly to the final destination.
 *
 * Example:
 *   Input:  A -> B, B -> C, C -> D
 *   Output: A -> D, B -> D, C -> D
 */
export function flattenRedirects(redirects: RedirectEntry[]): RedirectEntry[] {
  const redirectMap = new Map<string, string>();

  for (const redirect of redirects) {
    if (redirect.destination) {
      redirectMap.set(redirect.source, redirect.destination);
    }
  }

  // Resolve each redirect to its final destination
  function resolveFinalDestination(source: string): string {
    const visited = new Set<string>();
    let current = source;

    while (redirectMap.has(current)) {
      if (visited.has(current)) {
        // Loop detected — break and return current
        console.warn(`Redirect loop detected involving: ${current}`);
        return current;
      }
      visited.add(current);
      current = redirectMap.get(current)!;
    }

    return current;
  }

  // Rebuild the redirect list with flattened destinations
  return redirects.map((redirect) => {
    if (!redirect.destination) return redirect; // 410 entries have no destination

    const finalDestination = resolveFinalDestination(redirect.source);

    return {
      ...redirect,
      destination: finalDestination,
    };
  });
}
```

Integrate this into the build pipeline by calling `flattenRedirects()` after `generateAllRedirects()`:

```typescript
const rawRedirects = await generateAllRedirects(payload);
const flatRedirects = flattenRedirects(rawRedirects);
```

---

## 10. Custom Error Pages in Astro and Next.js

### Astro: Custom 404 Page

Create a `404.astro` file in `src/pages/`. Astro automatically uses this for all unmatched routes and serves it with a 404 HTTP status code.

```astro
---
// src/pages/404.astro

import BaseLayout from '@/layouts/BaseLayout.astro';
import SearchBar from '@/components/SearchBar.astro';
import PopularLinks from '@/components/PopularLinks.astro';
import CTABanner from '@/components/CTABanner.astro';
import { parse404Intent } from '@/utils/parse-404-intent';

// Ensure the 404 status is set here, in the page that owns the response.
// Setting status before Astro.rewrite() in the calling route has no effect
// because rewrite() replaces the response. This page must set its own status.
Astro.response.status = 404;

// Get the requested URL for intelligent suggestions
const requestedUrl = Astro.url.pathname;
const intentContext = parse404Intent(requestedUrl);

// Fetch popular pages for suggestions
const popularServices = await fetch(
  `${import.meta.env.PAYLOAD_API_URL}/api/services?limit=6&sort=-priority&where[removalStatus][equals]=active`
).then((r) => r.json());

const popularLocations = await fetch(
  `${import.meta.env.PAYLOAD_API_URL}/api/locations?limit=6&sort=-population&where[removalStatus][equals]=active`
).then((r) => r.json());
---

<BaseLayout
  title="Page Not Found"
  description="The page you are looking for does not exist or has been moved."
  noindex={true}
>
  <main class="max-w-4xl mx-auto px-4 py-16">
    <!-- Clear error message -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        We could not find that page
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        The page at <code class="bg-gray-100 px-2 py-1 rounded text-sm">{requestedUrl}</code> does
        not exist or has been moved.
      </p>

      <!-- Search bar — primary recovery mechanism -->
      <SearchBar
        placeholder="Search for a service or location..."
        autofocus={true}
        class="max-w-xl mx-auto"
      />
    </div>

    <!-- Intelligent suggestions based on URL parsing -->
    {intentContext.suggestedUrls.length > 0 && (
      <div class="mb-12 p-6 bg-blue-50 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Did you mean?</h2>
        <ul class="space-y-2">
          {intentContext.suggestedUrls.map((url) => (
            <li>
              <a href={url} class="text-blue-600 hover:underline text-lg">
                {url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}

    <!-- Popular services -->
    <div class="grid md:grid-cols-2 gap-8 mb-12">
      <div>
        <h2 class="text-xl font-semibold mb-4">Popular Services</h2>
        <ul class="space-y-2">
          {popularServices.docs?.map((service: { slug: string; name: string }) => (
            <li>
              <a href={`/${service.slug}`} class="text-blue-600 hover:underline">
                {service.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">Service Areas</h2>
        <ul class="space-y-2">
          {popularLocations.docs?.map((location: { slug: string; name: string; state: string }) => (
            <li>
              <a href={`/locations/${location.slug}`} class="text-blue-600 hover:underline">
                {location.name}, {location.state}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <!-- CTA -->
    <CTABanner
      headline="Can't find what you're looking for?"
      description="Give us a call and we'll help you directly."
      phoneNumber={import.meta.env.PUBLIC_PHONE_NUMBER}
      ctaText="Get a Free Quote"
      ctaLink="/contact"
    />
  </main>
</BaseLayout>
```

### Astro: Dynamic 404 Handling in SSR Mode

When using Astro with an SSR adapter (for on-demand rendering), return proper 404 responses from dynamic routes:

```astro
---
// src/pages/[service]/[location].astro — SSR mode

import BaseLayout from '@/layouts/BaseLayout.astro';
import { getServiceBySlug, getLocationBySlug } from '@/lib/api';

const { service: serviceSlug, location: locationSlug } = Astro.params;

const service = await getServiceBySlug(serviceSlug);
const location = await getLocationBySlug(locationSlug);

if (!service || !location) {
  // Return a new 404 Response directly. Setting Astro.response.status
  // before calling Astro.rewrite() has no effect because rewrite()
  // replaces the response entirely. Instead, the 404.astro page itself
  // sets the status in its own frontmatter (see below).
  return Astro.rewrite('/404');
}
---

<BaseLayout title={`${service.name} in ${location.name}`}>
  <!-- Page content -->
</BaseLayout>
```

### Astro: 410 Gone Page

For permanently removed content, create a 410 page:

```astro
---
// src/pages/410.astro

// This page is rendered via Astro.rewrite('/410') from routes
// that detect permanently removed content.

import BaseLayout from '@/layouts/BaseLayout.astro';

Astro.response.status = 410;
Astro.response.headers.set('X-Robots-Tag', 'noindex');
---

<BaseLayout title="Page Removed" noindex={true}>
  <main class="max-w-4xl mx-auto px-4 py-16 text-center">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">
      This page has been permanently removed
    </h1>
    <p class="text-lg text-gray-600 mb-8">
      The service or location you were looking for is no longer available.
    </p>
    <a
      href="/"
      class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
    >
      View Our Current Services
    </a>
  </main>
</BaseLayout>
```

### Next.js: Custom Not Found Page (App Router)

In Next.js App Router, create `not-found.tsx` in the `app` directory. This renders when `notFound()` is called from any server component.

```tsx
// app/not-found.tsx

import Link from 'next/link';
import type { Metadata } from 'next';
import { SearchBar } from '@/components/SearchBar';
import { CTABanner } from '@/components/CTABanner';
import { getPopularServices, getPopularLocations } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist or has been moved.',
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const popularServices = await getPopularServices(6);
  const popularLocations = await getPopularLocations(6);

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      {/* Clear error message */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          We could not find that page
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          The page you requested does not exist or has been moved.
        </p>

        {/* Search bar */}
        <SearchBar
          placeholder="Search for a service or location..."
          autoFocus
          className="max-w-xl mx-auto"
        />
      </div>

      {/* Popular links */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-xl font-semibold mb-4">Popular Services</h2>
          <ul className="space-y-2">
            {popularServices.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/${service.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Service Areas</h2>
          <ul className="space-y-2">
            {popularLocations.map((location) => (
              <li key={location.slug}>
                <Link
                  href={`/locations/${location.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {location.name}, {location.state}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <CTABanner
        headline="Can't find what you're looking for?"
        description="Give us a call and we'll help you directly."
        ctaText="Get a Free Quote"
        ctaLink="/contact"
      />
    </main>
  );
}
```

### Next.js: Error Boundary Page

For runtime errors (500-level), create `error.tsx`:

```tsx
// app/error.tsx

'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to your error tracking service
    console.error('Runtime error:', error);
  }, [error]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-lg text-gray-600 mb-8">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="space-x-4">
        <button
          onClick={reset}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
        <a
          href="/"
          className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
        >
          Go to Homepage
        </a>
      </div>
    </main>
  );
}
```

### Next.js: Triggering 404 from Dynamic Routes

```tsx
// app/[service]/[location]/page.tsx

import { notFound } from 'next/navigation';
import { getServiceBySlug, getLocationBySlug } from '@/lib/api';

interface PageProps {
  params: Promise<{ service: string; location: string }>;
}

export default async function ServiceLocationPage({ params }: PageProps) {
  const { service: serviceSlug, location: locationSlug } = await params;

  const service = await getServiceBySlug(serviceSlug);
  if (!service || service.removalStatus !== 'active') {
    notFound();
  }

  const location = await getLocationBySlug(locationSlug);
  if (!location || location.removalStatus !== 'active') {
    notFound();
  }

  return (
    <main>
      {/* Page content */}
    </main>
  );
}

// Force static 404 for unknown params (prevents soft 404s)
export const dynamicParams = false;

export async function generateStaticParams() {
  const services = await getActiveServices();
  const locations = await getActiveLocations();

  return services.flatMap((service) =>
    locations.map((location) => ({
      service: service.slug,
      location: location.slug,
    }))
  );
}
```

> **Important Next.js behavior note**: Next.js returns a 200 status code for streamed responses that call `notFound()`. For non-streamed (static/ISR) responses, it correctly returns 404. This is documented behavior. For programmatic SEO pages, use `dynamicParams = false` in the route segment config to force static 404s for unknown params, ensuring Googlebot sees proper 404 status codes.

---

## 11. Payload CMS Integration

### Removed Pages Collection

Create a dedicated collection for tracking removed and archived pages. This serves as a historical record and powers the redirect system:

```typescript
// collections/RemovedPages.ts

import type { CollectionConfig } from 'payload';

export const RemovedPages: CollectionConfig = {
  slug: 'removed-pages',
  admin: {
    useAsTitle: 'originalUrl',
    description:
      'Tracks pages that have been removed or archived. Used for redirect generation and content recovery.',
    defaultColumns: ['originalUrl', 'action', 'redirectUrl', 'removedAt'],
    group: 'SEO',
  },
  fields: [
    {
      name: 'originalUrl',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The full URL path that was removed (e.g., /duct-cleaning/austin-tx)',
      },
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: '301 Redirect', value: 'redirect' },
        { label: '410 Gone', value: 'gone' },
      ],
    },
    {
      name: 'redirectUrl',
      type: 'text',
      admin: {
        condition: (data) => data.action === 'redirect',
        description: 'The URL to redirect to (e.g., /hvac-cleaning/austin-tx)',
      },
    },
    {
      name: 'sourceCollection',
      type: 'select',
      options: [
        { label: 'Services', value: 'services' },
        { label: 'Locations', value: 'locations' },
        { label: 'Posts', value: 'posts' },
        { label: 'Pages', value: 'pages' },
      ],
    },
    {
      name: 'sourceDocumentId',
      type: 'text',
      admin: {
        description: 'The ID of the original document in its collection (for potential recovery).',
      },
    },
    {
      name: 'archivedContent',
      type: 'json',
      admin: {
        description: 'A JSON snapshot of the original document at the time of removal.',
      },
    },
    {
      name: 'removedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'removedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      admin: {
        description:
          'Why was this page removed? (e.g., "Service discontinued," "Location no longer served")',
      },
    },
  ],
};
```

### Automated Redirect Creation on Page Deletion

Use Payload hooks to automatically create redirect entries when documents are deleted:

```typescript
// hooks/auto-redirect-on-delete.ts

import type {
  CollectionBeforeDeleteHook,
  CollectionAfterDeleteHook,
} from 'payload';

// Store the document data before deletion so we can archive it
const deletionCache = new Map<
  string,
  { doc: Record<string, unknown>; collection: string }
>();

/**
 * beforeDelete hook — captures the document before it is deleted.
 * Attach to any collection that generates public URLs.
 */
export const captureBeforeDelete = (
  collectionSlug: string,
  urlBuilder: (doc: Record<string, unknown>) => string[]
): CollectionBeforeDeleteHook => {
  return async ({ req, id }) => {
    // NOTE: `as any` bypasses Payload's type safety for collection slugs.
    // For a type-safe approach, define a union of your collection slugs:
    //   type PublicCollectionSlug = 'services' | 'locations' | 'posts';
    // Then type `collectionSlug` as `PublicCollectionSlug` instead of `string`.
    const doc = await req.payload.findByID({
      collection: collectionSlug as any,
      id,
      depth: 0,
    });

    if (doc) {
      deletionCache.set(`${collectionSlug}:${id}`, {
        doc: doc as Record<string, unknown>,
        collection: collectionSlug,
      });
    }
  };
};

/**
 * afterDelete hook — creates entries in the removed-pages collection.
 * Attach to any collection that generates public URLs.
 */
export const createRedirectAfterDelete = (
  collectionSlug: string,
  urlBuilder: (doc: Record<string, unknown>) => string[],
  defaultRedirectUrl?: string
): CollectionAfterDeleteHook => {
  return async ({ req, id }) => {
    const cacheKey = `${collectionSlug}:${id}`;
    const cached = deletionCache.get(cacheKey);
    deletionCache.delete(cacheKey);

    if (!cached) return;

    const urls = urlBuilder(cached.doc);

    for (const url of urls) {
      // Check if a redirect already exists for this URL
      const existing = await req.payload.find({
        collection: 'removed-pages',
        where: { originalUrl: { equals: url } },
        limit: 1,
      });

      if (existing.docs.length > 0) continue;

      await req.payload.create({
        collection: 'removed-pages',
        data: {
          originalUrl: url,
          action: defaultRedirectUrl ? 'redirect' : 'gone',
          redirectUrl: defaultRedirectUrl || undefined,
          sourceCollection: collectionSlug,
          sourceDocumentId: String(id),
          archivedContent: cached.doc,
          removedAt: new Date().toISOString(),
          removedBy: req.user?.id,
        },
        req, // Preserve the request context for transactions
      });
    }
  };
};
```

### Attaching Hooks to Collections

```typescript
// collections/Services.ts

import type { CollectionConfig } from 'payload';
import {
  captureBeforeDelete,
  createRedirectAfterDelete,
} from '@/hooks/auto-redirect-on-delete';
import { trackPreviousSlugs } from '@/hooks/track-previous-slugs';

// Define how to build URLs from a service document
function buildServiceUrls(doc: Record<string, unknown>): string[] {
  const slug = doc.slug as string;
  if (!slug) return [];

  // The service pillar page
  const urls = [`/${slug}`];

  // Note: service-location combination URLs are handled by the
  // location deletion hooks or the removal status system.
  // We only track the pillar page URL here.

  return urls;
}

export const Services: CollectionConfig = {
  slug: 'services',
  hooks: {
    beforeChange: [trackPreviousSlugs],
    beforeDelete: [captureBeforeDelete('services', buildServiceUrls)],
    afterDelete: [createRedirectAfterDelete('services', buildServiceUrls)],
  },
  fields: [
    // ... all service fields
  ],
};
```

```typescript
// collections/Locations.ts

import type { CollectionConfig } from 'payload';
import {
  captureBeforeDelete,
  createRedirectAfterDelete,
} from '@/hooks/auto-redirect-on-delete';
import { trackPreviousSlugs } from '@/hooks/track-previous-slugs';

function buildLocationUrls(doc: Record<string, unknown>): string[] {
  const slug = doc.slug as string;
  if (!slug) return [];
  return [`/locations/${slug}`];
}

export const Locations: CollectionConfig = {
  slug: 'locations',
  hooks: {
    beforeChange: [trackPreviousSlugs],
    beforeDelete: [captureBeforeDelete('locations', buildLocationUrls)],
    afterDelete: [createRedirectAfterDelete('locations', buildLocationUrls)],
  },
  fields: [
    // ... all location fields
  ],
};
```

### Redirect Map from Removed Pages

At build time, combine redirects from `previousSlugs` (slug changes) and `removed-pages` (deletions) into a single redirect map:

```typescript
// src/lib/generate-complete-redirect-map.ts

import type { Payload } from 'payload';
import { generateAllRedirects } from './generate-all-redirects';
import { flattenRedirects } from './flatten-redirects';

interface FinalRedirect {
  source: string;
  destination: string;
  status: 301 | 410;
}

export async function generateCompleteRedirectMap(
  payload: Payload
): Promise<FinalRedirect[]> {
  // 1. Get redirects from previousSlugs (slug changes)
  const slugRedirects = await generateAllRedirects(payload);

  // 2. Get redirects from removed-pages collection (deletions)
  const removedPages = await payload.find({
    collection: 'removed-pages',
    limit: 0,
    depth: 0,
  });

  const deletionRedirects = removedPages.docs
    .filter((page) => {
      // Guard: skip entries where action is 'redirect' but redirectUrl is empty
      if (page.action === 'redirect' && !page.redirectUrl) {
        console.warn(
          `[redirect-map] Skipping "${page.originalUrl}": action is "redirect" but redirectUrl is empty.`
        );
        return false;
      }
      return true;
    })
    .map((page) => ({
      source: page.originalUrl as string,
      destination: (page.redirectUrl as string) || '',
      permanent: page.action === 'redirect',
    }));

  // 3. Merge (deletion redirects take priority over slug redirects)
  const mergedMap = new Map<string, FinalRedirect>();

  for (const redirect of slugRedirects) {
    mergedMap.set(redirect.source, {
      source: redirect.source,
      destination: redirect.destination,
      status: 301,
    });
  }

  for (const redirect of deletionRedirects) {
    mergedMap.set(redirect.source, {
      source: redirect.source,
      destination: redirect.destination,
      status: redirect.permanent ? 301 : 410,
    });
  }

  // 4. Flatten chains
  const allRedirects = Array.from(mergedMap.values());
  const redirectEntries = allRedirects
    .filter((r) => r.status === 301)
    .map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: true,
    }));

  const flattened = flattenRedirects(redirectEntries);

  // Rebuild the final list: flattened 301s + original 410s
  const flattenedMap = new Map(flattened.map((r) => [r.source, r.destination]));

  return allRedirects.map((r) => ({
    source: r.source,
    destination: r.status === 301 ? (flattenedMap.get(r.source) || r.destination) : '',
    status: r.status,
  }));
}
```

### Admin UI: Redirect Dashboard

Add a custom admin view in Payload to show redirect health:

```tsx
// admin/views/RedirectDashboard.tsx

'use client';

import { useEffect, useState } from 'react';
import { Gutter } from '@payloadcms/ui';

interface RedirectStats {
  totalRedirects: number;
  total410s: number;
  chainsDetected: number;
  recentRemovals: Array<{
    originalUrl: string;
    action: string;
    removedAt: string;
  }>;
}

export default function RedirectDashboard() {
  const [stats, setStats] = useState<RedirectStats | null>(null);

  useEffect(() => {
    fetch('/api/redirect-stats')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <div>Loading redirect statistics...</div>;

  return (
    <Gutter>
      <h1>Redirect Dashboard</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Active 301 Redirects</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalRedirects}</p>
        </div>
        <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>410 Gone Pages</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total410s}</p>
        </div>
        <div
          style={{
            padding: '1rem',
            background: stats.chainsDetected > 0 ? '#fee' : '#f0f0f0',
            borderRadius: '8px',
          }}
        >
          <h3>Redirect Chains</h3>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: stats.chainsDetected > 0 ? 'red' : 'inherit',
            }}
          >
            {stats.chainsDetected}
          </p>
        </div>
      </div>

      <h2>Recent Removals</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '0.5rem',
                borderBottom: '1px solid #ddd',
              }}
            >
              URL
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '0.5rem',
                borderBottom: '1px solid #ddd',
              }}
            >
              Action
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '0.5rem',
                borderBottom: '1px solid #ddd',
              }}
            >
              Removed At
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.recentRemovals.map((removal, i) => (
            <tr key={i}>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                {removal.originalUrl}
              </td>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                {removal.action}
              </td>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                {new Date(removal.removedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Gutter>
  );
}
```

---

## 12. Google's Handling of 404s at Scale

### How Google Processes 404s

Google's crawler (Googlebot) processes 404 and 410 responses through the following pipeline:

1. **Discovery**: Googlebot encounters the URL (from sitemaps, internal links, external links, or its existing crawl queue).
2. **Crawl**: Googlebot requests the URL and receives a 404 or 410 response.
3. **Processing**: The response is added to Google's index processing queue.
4. **Deindexing**: If the URL was previously indexed, Google begins the process of removing it from the index.
5. **Recrawl scheduling**: For 404s, Google schedules a recrawl at decreasing frequency. For 410s, Google may drop the URL from the crawl queue entirely.

### How Many 404s Are "Too Many"?

There is no absolute number. Google has consistently stated that 404s are a normal part of the web and do not, by themselves, harm a site's ranking. However, the following guidelines apply at scale:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| **404 rate (% of total crawled URLs)** | < 2% | 2-10% | > 10% |
| **404 rate relative to indexed pages** | < 1% | 1-5% | > 5% |
| **New 404s per day** | < 50 | 50-500 | > 500 |
| **404s linked from sitemap** | 0 | 1-10 | > 10 |
| **404s with inbound backlinks** | Redirected | Some not redirected | Many not redirected |
| **Googlebot-specific 404 rate** | < 1% of crawl | 1-5% of crawl | > 5% of crawl |

### The Real Danger: Crawl Budget Impact

For a 100k-page site, Google allocates a finite crawl budget. This budget is determined by:

1. **Crawl rate limit**: How fast Google can crawl without overloading the server.
2. **Crawl demand**: How much Google "wants" to crawl based on perceived value.

When a significant percentage of the crawl budget is spent on 404s, fewer real pages get crawled. This manifests as:

- **Slower indexing of new pages**: New service-location pages take longer to appear in search.
- **Stale content in the index**: Updated content takes longer to be re-crawled and reflected in search results.
- **Discovery gaps**: Deep pages (3+ levels deep) may never be crawled if the budget is consumed by 404s.

### Recovery Strategies

#### Scenario 1: Mass URL Removal (Dropping a Service Line)

When removing a service that generates 5,000+ pages:

1. **Before removal**: Set up 301 redirects to the nearest relevant service or 410 responses.
2. **Update the sitemap**: Remove all affected URLs from the XML sitemap.
3. **Deploy redirects/410s and sitemap simultaneously**: Do not leave a gap where URLs return 404 without redirects.
4. **Submit the updated sitemap in GSC**: Use the "Submit Sitemap" button to prompt Google to re-process.
5. **Use the URL Removal Tool**: For time-sensitive removals, use GSC's URL Removal Tool to request temporary removal of the old URLs from search results. This hides them from search for ~6 months while the 301/410 signals propagate.
6. **Monitor**: Check GSC's "Pages" report weekly for 4-6 weeks to confirm deindexing progress.

#### Scenario 2: Large-Scale URL Migration (Changing URL Structure)

When changing the URL pattern from `/service/city-state` to `/services/service/city-state`:

1. **Generate the full redirect map**: Every old URL must have a corresponding 301 to the new URL.
2. **Deploy redirects before the new URL structure**: The old URLs should redirect to the new ones from day one.
3. **Update all internal links**: Do not rely on redirects for internal linking — update the templates and CMS content to use the new URLs directly.
4. **Update the sitemap**: Replace old URLs with new URLs.
5. **Submit updated sitemap and use the Change of Address tool** (if the domain is also changing).
6. **Keep redirects active for at least 12 months**: Google recommends keeping 301 redirects in place for at least one year.

#### Scenario 3: Recovering from Accidental Mass 404s

If a deployment error causes thousands of pages to return 404:

1. **Fix immediately**: Revert the deployment or fix the issue.
2. **Verify with a spot check**: Manually check 10-20 URLs across different page types to confirm they return 200.
3. **Re-submit the sitemap**: Prompt Google to re-crawl the affected URLs.
4. **Request re-indexing**: For high-priority pages, use GSC's URL Inspection tool to request individual re-indexing (limited to a few hundred URLs per day).
5. **Monitor crawl stats**: Check GSC's "Crawl Stats" report to see if crawl rate recovers.
6. **Expected recovery time**: If the 404s were live for less than 24 hours, recovery is typically fast (days). If live for more than a week, recovery can take 2-4 weeks as Google re-discovers and re-indexes the pages.

### Best Practices Summary for 100k+ Page Sites

1. **Never let the sitemap contain 404 URLs** — validate the sitemap against real pages at build time.
2. **Use 410 for permanent removals** — it frees crawl budget faster than 404.
3. **Always redirect when possible** — 301 preserves link equity; 410/404 destroys it.
4. **Flatten redirect chains** — every hop leaks equity and wastes crawl budget.
5. **Monitor Googlebot-specific 404s** — filter server logs by user agent to see what Google is hitting.
6. **Batch large removals** — if removing 10,000 pages, deploy all redirects at once with an updated sitemap rather than trickling them out.
7. **Keep redirects active for 12+ months** — do not prematurely remove 301 redirects.
8. **Automate everything** — at 100k pages, manual redirect management is impossible. Use the Payload CMS hooks and build-time scripts described in this document.
9. **Run broken link checks in CI** — catch issues before they reach production.
10. **Set up alerting** — get notified when 404 rates spike so you can respond within hours, not weeks.

---

## Quick Reference: Status Code Decision Matrix

| Situation | Status Code | Redirect Target | Sitemap Action |
|-----------|-------------|-----------------|----------------|
| Page never existed | 404 | None | N/A |
| Service permanently discontinued, replacement exists | 301 | Replacement service | Remove old, add new |
| Service permanently discontinued, no replacement | 410 | None | Remove |
| Location permanently removed, nearby location active | 301 | Nearest location | Remove old |
| Location permanently removed, no nearby alternative | 410 | None | Remove |
| Slug changed (service, location, or blog post) | 301 | New slug URL | Update to new URL |
| Page temporarily unavailable | 503 | None (Retry-After header) | Keep |
| Seasonal page (off-season) | 200 | N/A (keep live) | Keep |
| Draft/unpublished CMS entry | 404 | None | Do not include |
| Pagination beyond last page | 404 | None | Do not include |
| Duplicate URL (case variation, trailing slash) | 301 | Canonical URL | Include only canonical |
| Accidental deletion (may be restored) | 404 | None (temporary) | Remove temporarily |

---

## Related Documents

- [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md) — Master reference
- [URL Structure Rules](./URL_STRUCTURE_RULES.md) — Slug conventions, `previousSlugs` field, redirect architecture
- [Canonical Tags Strategy](./CANONICAL_TAGS_STRATEGY.md) — Preventing duplicate indexing
- [Content Freshness Strategy](./CONTENT_FRESHNESS_STRATEGY.md) — Keeping content updated to avoid thin pages
