# Canonical Tags Strategy — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers canonical tag implementation for programmatic SEO sites with 100k+ pages, including self-referencing canonicals, near-duplicate handling, pagination, hreflang interaction, and build-time validation.

# Canonical Tags Strategy for Programmatic SEO

## 1. What Canonical Tags Are and Why They Matter at Scale

A canonical tag (`<link rel="canonical" href="..." />`) is an HTML element placed in the `<head>` of a page that tells search engines which URL is the "preferred" or "authoritative" version of that page. When Google encounters multiple URLs with identical or very similar content, the canonical tag signals which one should be indexed and receive link equity.

For a service-area business site generating 100,000+ pages programmatically, canonical tags are not optional — they are structural infrastructure. Here is why:

**The Scale Problem**

When you generate pages from a matrix of `{service} x {city} x {state}`, you inevitably produce URL variations that search engines may treat as duplicates:

- `/plumbing/austin-tx` and `/plumbing/austin-tx/` (trailing slash)
- `/plumbing/austin-tx` and `/plumbing/austin-tx?ref=gmb` (query parameters)
- `/plumbing/austin-tx` and `/PLUMBING/Austin-TX` (case variations)
- `http://` vs `https://`, `www` vs non-`www`

At 100k pages, even a 1% duplication rate means 1,000 wasted crawl budget slots. At scale, crawl budget becomes a real constraint — Google will not crawl all 100k pages in a single pass. Every duplicate URL that Google crawls instead of a real page is a lost opportunity.

**Specific Risks Without Canonical Tags**

- **Crawl budget waste**: Googlebot spends finite resources crawling duplicate URLs instead of discovering new content.
- **Index bloat**: Google may index the wrong URL variant, leading to inconsistent SERP appearances.
- **Link equity dilution**: Backlinks split across multiple URL variants instead of consolidating to one.
- **Ranking signal confusion**: Google must guess which page to rank, often guessing wrong.
- **Soft 404 / quality penalties**: Large-scale thin or duplicate content can trigger sitewide quality demotion.

---

## 2. Self-Referencing Canonical Tags

Every single page on the site must include a canonical tag pointing to itself. This is non-negotiable.

**Why self-referencing canonicals matter:**

- They explicitly declare "this URL is the correct version of this page."
- They protect against scrapers, syndication, and URL parameter injection.
- They prevent Google from selecting a different URL variant as canonical on its own.
- Google's own documentation recommends self-referencing canonicals as a best practice.

**The rule is absolute**: if a page is meant to be indexed, it gets a self-referencing canonical. No exceptions.

**Critical implementation detail**: the canonical URL must be the fully-qualified, absolute URL — not a relative path.

```
<!-- CORRECT -->
<link rel="canonical" href="https://example.com/plumbing/austin-tx" />

<!-- WRONG — relative path -->
<link rel="canonical" href="/plumbing/austin-tx" />

<!-- WRONG — missing protocol -->
<link rel="canonical" href="//example.com/plumbing/austin-tx" />
```

The canonical URL must match the site's canonical domain format exactly:
- Consistent protocol (`https://`)
- Consistent `www` or non-`www`
- Consistent trailing slash policy (pick one, enforce it everywhere)
- Lowercase only

---

## 3. Near-Duplicate Pages: Service-Area Variations

This is the most nuanced topic for programmatic SEO. Pages like `/plumbing/austin-tx` and `/plumbing/round-rock-tx` are **not duplicates** — they are distinct pages targeting different geographic markets. However, they share substantial template structure and may have similar boilerplate content.

**These pages must NOT canonicalize to each other.** Each city page is a unique landing page targeting a unique keyword (`plumbing austin tx` vs `plumbing round rock tx`). Canonicalizing them together would kill geographic coverage.

**How to prevent Google from flagging them as duplicates:**

### 3.1 Content Differentiation Strategy

Each programmatically generated page must contain enough unique, location-specific content to pass Google's duplicate content threshold. Target a minimum of 40–60% unique content per page.

Differentiation signals include:

| Content Element | Example |
|---|---|
| City/region name in title, H1, meta description | "Plumbing Services in Round Rock, TX" |
| Local service area details | Neighborhoods served, zip codes, service radius |
| Local testimonials/reviews | Reviews from customers in that specific city |
| Locally relevant FAQ | "How much does a plumber cost in Round Rock?" |
| Local business information | Address, phone number, service hours for that area |
| Geographic entity mentions | Nearby landmarks, county name, regional references |
| Unique structured data | LocalBusiness schema with city-specific data |
| Dynamic stats or data | Population, number of homes, local water quality data |

### 3.2 Template Variation

Avoid using a single identical template for all 100k pages. Implement template variation at the service-category level at minimum:

- Plumbing pages use template A (with plumbing-specific sections)
- HVAC pages use template B (with HVAC-specific sections)
- Roofing pages use template C (with roofing-specific sections)

Within each template, paragraph order, section headings, and content blocks should vary based on location data inputs.

### 3.3 Self-Referencing Canonicals (Reiterated)

Every city page gets its own self-referencing canonical. Never point `/plumbing/round-rock-tx` canonical to `/plumbing/austin-tx`.

```
<!-- On /plumbing/round-rock-tx -->
<link rel="canonical" href="https://example.com/plumbing/round-rock-tx" />

<!-- On /plumbing/austin-tx -->
<link rel="canonical" href="https://example.com/plumbing/austin-tx" />
```

---

## 4. Cross-Domain Canonicals for Multi-Client Deployments

When the agency deploys the same template system across multiple client domains (e.g., `austinplumber.com` and `roundrockplumber.com`), and both sites may generate pages for overlapping service areas, cross-domain canonical strategy becomes critical.

### 4.1 When Cross-Domain Canonicals Apply

- **Same owner, multiple domains**: A single plumbing company owns `acmeplumbing.com` and `acmeplumbingaustin.com`. Content is substantially identical. Use cross-domain canonicals pointing to the primary domain.
- **Different clients, similar content**: Two different plumbing companies in Austin, both using the agency's system. These are **not** duplicates — they are different businesses. **Do NOT use cross-domain canonicals.** Each site's content must be sufficiently differentiated through business-specific information (reviews, staff, history, pricing).

### 4.2 Implementation for Same-Owner Multi-Domain

```html
<!-- On secondary domain: acmeplumbingaustin.com/drain-cleaning -->
<link rel="canonical" href="https://acmeplumbing.com/drain-cleaning/austin-tx" />
```

This tells Google to consolidate all ranking signals to the primary domain.

### 4.3 Risks

- Cross-domain canonicals are treated as a **hint**, not a directive. Google may ignore them.
- If the content on the secondary domain is substantially different (different branding, layout, additional content), Google will likely ignore the cross-domain canonical.
- Cross-domain canonicals require the secondary domain to essentially sacrifice its own indexing for those pages.

### 4.4 Agency Recommendation

For multi-client deployments where clients are different businesses:
- **Do NOT use cross-domain canonicals.**
- Instead, ensure each client site has differentiated content: unique business name, address, phone, reviews, team bios, service descriptions, and imagery.
- Use unique meta titles and descriptions per client even for the same `{service} x {city}` combination.
- The programmatic content engine should accept per-client content overrides at every level.

---

## 5. Canonical vs. Noindex — When to Use Which

These are two different tools for two different problems. Using the wrong one causes ranking loss.

| Scenario | Use Canonical | Use Noindex |
|---|---|---|
| Same content accessible at multiple URLs (trailing slash, query param variants) | **Yes** — point all variants to the preferred URL | No |
| Paginated listing pages (page 2, 3, etc.) | Self-referencing canonical on each page | No — Google should crawl these to discover linked content |
| Thin/low-quality pages that add no search value | No | **Yes** — prevent indexing entirely |
| Internal search results pages | No | **Yes** |
| Filter/sort variations of listing pages | **Yes** — canonical to the unfiltered version | Alternative: noindex if filter pages have no SEO value |
| Staging/preview URLs | No | **Yes** — plus `Disallow` in robots.txt |
| Near-duplicate city pages you want indexed | Self-referencing canonical on each | No |
| Orphan pages with no internal links | No | **Yes** — or remove them entirely |

**Critical rule**: Never combine `rel="canonical"` pointing to a different URL with `noindex` on the same page. This sends conflicting signals. If you noindex a page, its canonical should be self-referencing (or omitted). If you canonical to another page, do not noindex.

```html
<!-- WRONG: Conflicting signals -->
<meta name="robots" content="noindex" />
<link rel="canonical" href="https://example.com/some-other-page" />

<!-- CORRECT: Noindex with self-referencing canonical -->
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="https://example.com/this-page" />

<!-- CORRECT: Canonical to preferred version (no noindex) -->
<link rel="canonical" href="https://example.com/preferred-page" />
```

---

## 6. Common Canonical Tag Mistakes with Programmatic Pages

### 6.1 Canonical Points to a Non-Existent or Redirecting URL

When pages are generated or removed from the CMS, canonical tags can end up pointing to 404s or redirect chains. At 100k pages, this is almost guaranteed to happen during content updates.

**Prevention**: Validate canonical URLs against the live sitemap during build time. If a canonical target returns non-200, flag it as a build error.

### 6.2 Canonical Chains

Page A canonicals to Page B, which canonicals to Page C. Google may give up and ignore the chain entirely.

**Rule**: Canonical tags must always point directly to the final, preferred URL. Never chain.

### 6.3 Canonical to a Paginated Page

If `/services?page=3` canonicals to `/services`, Google loses all the content unique to page 3. Each paginated page should have a self-referencing canonical.

### 6.4 All Pages Canonical to Homepage

A catastrophic misconfiguration. Sometimes caused by a CMS bug or template error where the canonical URL variable is empty and falls back to `/`. This effectively tells Google to deindex your entire site except the homepage.

**Prevention**: Build-time validation that no canonical URL equals the site root unless the page IS the homepage.

### 6.5 Canonical URL Doesn't Match Sitemap URL

If your sitemap lists `https://example.com/plumbing/austin-tx` but the page's canonical tag says `https://example.com/plumbing/austin-tx/` (with trailing slash), Google receives conflicting signals.

**Rule**: Sitemap URLs and canonical URLs must be identical, character for character.

### 6.6 Multiple Canonical Tags on One Page

If your Astro layout and a CMS-injected head block both add a canonical tag, the page ends up with two. Google's behavior with multiple canonicals is undefined — it may pick either one or ignore both.

**Prevention**: Audit rendered HTML output for duplicate `<link rel="canonical">` tags as part of the build process.

### 6.7 Canonical Tag in Body Instead of Head

The canonical tag must be in `<head>`. If JavaScript or a component rendering issue places it in `<body>`, Google may ignore it.

### 6.8 Dynamic Canonical URLs with JavaScript

If the canonical tag is rendered client-side (e.g., via React hydration), Googlebot may not see it during initial HTML parse. For Astro SSG/SSR pages, this is rarely an issue since canonicals are in the static HTML, but be cautious with any client-side head manipulation.

---

## 7. Trailing Slashes, Query Parameters, and URL Variations

### 7.1 Trailing Slash Policy

Pick one. Enforce it everywhere. There is no SEO advantage to either choice, but inconsistency creates duplicates.

**Recommended for this stack**: No trailing slash. This aligns with Astro's default `trailingSlash: 'never'` configuration.

```js
// astro.config.mjs
export default defineConfig({
  trailingSlash: 'never',
  // ...
});
```

Enforce via redirect: if a user or crawler requests `/plumbing/austin-tx/`, the server returns a 301 redirect to `/plumbing/austin-tx`.

In the canonical tag, always output the non-trailing-slash version:

```
<link rel="canonical" href="https://example.com/plumbing/austin-tx" />
```

### 7.2 Query Parameter Handling

Query parameters are the most common source of unintentional duplicate content at scale. Common offenders:

- Tracking parameters: `?utm_source=google&utm_medium=cpc`
- Session IDs: `?sid=abc123`
- Sort/filter parameters: `?sort=price&order=asc`
- Referral parameters: `?ref=gmb`
- Pagination: `?page=2` (handled separately)

**Strategy**: The canonical tag must always strip non-semantic query parameters.

```typescript
function getCanonicalUrl(url: URL, allowedParams: string[] = []): string {
  const canonical = new URL(url.pathname, url.origin);

  // Only preserve explicitly allowed query parameters
  for (const param of allowedParams) {
    if (url.searchParams.has(param)) {
      canonical.searchParams.set(param, url.searchParams.get(param)!);
    }
  }

  // Sort remaining params for consistency
  canonical.searchParams.sort();

  // Enforce lowercase path
  canonical.pathname = canonical.pathname.toLowerCase();

  // Remove trailing slash (except root)
  if (canonical.pathname.length > 1 && canonical.pathname.endsWith('/')) {
    canonical.pathname = canonical.pathname.slice(0, -1);
  }

  return canonical.toString();
}
```

### 7.3 URL Case Normalization

All URLs must be lowercase. The canonical tag must always output lowercase.

`/Plumbing/Austin-TX` must redirect to `/plumbing/austin-tx`, and the canonical must reference the lowercase version.

### 7.4 Protocol and WWW Normalization

- Always use `https://`.
- Pick `www` or non-`www` and enforce via redirect + canonical.
- Configure at the hosting/CDN level (Cloudflare, Vercel, etc.) to 301 redirect the non-preferred variant.

---

## 8. Canonical Tags in Astro — Implementation

### 8.1 The SEO Head Component

This is the central component responsible for generating all SEO-related `<head>` tags, including the canonical. It must be used in every layout and page.

```astro
---
// src/components/SEOHead.astro
// This component generates all SEO meta tags including canonical.
// It MUST be included in every layout's <head>.

interface Props {
  title: string;
  description: string;
  canonicalUrl?: string;  // Override canonical if needed; otherwise auto-generated
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  hreflangAlternates?: Array<{ lang: string; url: string }>;
  paginationPrev?: string;
  paginationNext?: string;
}

const {
  title,
  description,
  canonicalUrl,
  noindex = false,
  ogImage,
  ogType = 'website',
  jsonLd,
  hreflangAlternates,
  paginationPrev,
  paginationNext,
} = Astro.props;

// --- Canonical URL Resolution ---
function resolveCanonical(requestUrl: URL, override?: string): string {
  if (override) {
    // If an override is provided, ensure it's absolute
    try {
      const parsed = new URL(override);
      return normalizeUrl(parsed);
    } catch {
      // If override is a relative path, resolve against site origin
      const absolute = new URL(override, Astro.site);
      return normalizeUrl(absolute);
    }
  }
  return normalizeUrl(requestUrl);
}

function normalizeUrl(url: URL): string {
  const normalized = new URL(url.href);

  // 1. Force HTTPS
  normalized.protocol = 'https:';

  // 2. Lowercase the pathname
  normalized.pathname = normalized.pathname.toLowerCase();

  // 3. Remove trailing slash (except root "/")
  if (normalized.pathname.length > 1 && normalized.pathname.endsWith('/')) {
    normalized.pathname = normalized.pathname.slice(0, -1);
  }

  // 4. Strip ALL query parameters for canonical purposes
  //    (pagination and filters are handled by separate canonical overrides)
  normalized.search = '';

  // 5. Remove hash fragments
  normalized.hash = '';

  // 6. Remove default HTTPS port
  if (normalized.port === '443') normalized.port = '';

  return normalized.toString();
}

const canonical = resolveCanonical(Astro.url, canonicalUrl);

// Determine robots directive
const robotsContent = noindex ? 'noindex, follow' : 'index, follow';
---

<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="description" content={description} />
<meta name="robots" content={robotsContent} />

<!-- Canonical Tag — EXACTLY ONE per page -->
<link rel="canonical" href={canonical} />

<!-- Pagination Links (if applicable) -->
{paginationPrev && <link rel="prev" href={paginationPrev} />}
{paginationNext && <link rel="next" href={paginationNext} />}

<!-- Hreflang Alternates (if applicable) -->
{hreflangAlternates && hreflangAlternates.map((alt) => (
  <link rel="alternate" hreflang={alt.lang} href={alt.url} />
))}
{hreflangAlternates && (
  <link rel="alternate" hreflang="x-default" href={canonical} />
)}

<!-- Open Graph -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:type" content={ogType} />
{ogImage && <meta property="og:image" content={ogImage} />}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{ogImage && <meta name="twitter:image" content={ogImage} />}

<!-- Structured Data -->
{jsonLd && (
  <script
    type="application/ld+json"
    set:html={JSON.stringify(
      jsonLd,
      null,
      0
    )}
  />
)}
```

### 8.2 Base Layout Using the SEO Component

```astro
---
// src/layouts/BaseLayout.astro
import SEOHead from '../components/SEOHead.astro';

interface Props {
  title: string;
  description: string;
  canonicalUrl?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  hreflangAlternates?: Array<{ lang: string; url: string }>;
  paginationPrev?: string;
  paginationNext?: string;
}

const props = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <SEOHead {...props} />

    <!-- DO NOT add any other canonical tags here or in child components -->
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 8.3 Service-City Page Using the Layout

```astro
---
// src/pages/[service]/[city]-[state].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getServiceCityData } from '../../lib/data';

export async function getStaticPaths() {
  const pages = await getServiceCityData();
  return pages.map((page) => ({
    params: {
      service: page.serviceSlug,
      city: page.citySlug,
      state: page.stateAbbr,
    },
    props: { page },
  }));
}

const { page } = Astro.props;

// Build the canonical URL explicitly — do not rely on auto-detection during
// static builds, because Astro.url may contain the build-time URL.
const siteOrigin = Astro.site?.origin;
if (!siteOrigin) {
  throw new Error('Astro.site is not defined. Set the "site" option in astro.config.mjs.');
}
const canonicalPath = `/${page.serviceSlug}/${page.citySlug}-${page.stateAbbr}`;
const canonicalUrl = `${siteOrigin}${canonicalPath}`;

const title = `${page.serviceName} in ${page.cityName}, ${page.stateAbbr.toUpperCase()} | Business Name`;
const description = `Professional ${page.serviceName.toLowerCase()} services in ${page.cityName}, ${page.stateAbbr.toUpperCase()}. Licensed, insured, and locally trusted. Call for a free estimate.`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": page.businessName,
  "description": description,
  "url": canonicalUrl,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": page.cityName,
    "addressRegion": page.stateAbbr.toUpperCase(),
  },
  "areaServed": {
    "@type": "City",
    "name": page.cityName,
  },
};
---

<BaseLayout
  title={title}
  description={description}
  canonicalUrl={canonicalUrl}
  jsonLd={jsonLd}
>
  <main>
    <h1>{page.serviceName} in {page.cityName}, {page.stateAbbr.toUpperCase()}</h1>
    <!-- Page content -->
  </main>
</BaseLayout>
```

### 8.4 Build-Time Canonical Validation Script

Run this as a post-build step to catch canonical issues before deployment.

```typescript
// scripts/validate-canonicals.ts
// Run with: npx tsx scripts/validate-canonicals.ts

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { JSDOM } from 'jsdom';

const DIST_DIR = './dist';
const SITE_ORIGIN = process.env.SITE_URL || 'https://example.com';

interface CanonicalIssue {
  file: string;
  issue: string;
  value?: string;
}

async function getHtmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getHtmlFiles(fullPath)));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function validateCanonicals(): Promise<void> {
  const issues: CanonicalIssue[] = [];
  const htmlFiles = await getHtmlFiles(DIST_DIR);
  const canonicalSet = new Set<string>();

  console.log(`Validating canonicals for ${htmlFiles.length} pages...`);

  for (const file of htmlFiles) {
    const content = await readFile(file, 'utf-8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;

    // Check for canonical tags
    const canonicals = doc.querySelectorAll('link[rel="canonical"]');

    if (canonicals.length === 0) {
      issues.push({ file, issue: 'MISSING canonical tag' });
      continue;
    }

    if (canonicals.length > 1) {
      issues.push({
        file,
        issue: `DUPLICATE canonical tags (found ${canonicals.length})`,
      });
      continue;
    }

    const href = canonicals[0].getAttribute('href');

    if (!href) {
      issues.push({ file, issue: 'EMPTY canonical href' });
      continue;
    }

    // Must be absolute URL
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      issues.push({ file, issue: 'RELATIVE canonical URL', value: href });
    }

    // Must use HTTPS
    if (href.startsWith('http://')) {
      issues.push({ file, issue: 'HTTP canonical (must be HTTPS)', value: href });
    }

    // Must not have trailing slash (except root)
    const urlPath = new URL(href).pathname;
    if (urlPath.length > 1 && urlPath.endsWith('/')) {
      issues.push({ file, issue: 'TRAILING SLASH in canonical', value: href });
    }

    // Must be lowercase
    if (href !== href.toLowerCase()) {
      issues.push({ file, issue: 'UPPERCASE in canonical URL', value: href });
    }

    // Must not have query parameters
    if (href.includes('?')) {
      issues.push({ file, issue: 'QUERY PARAMS in canonical', value: href });
    }

    // Must not point to homepage (unless it IS the homepage)
    const isHomepage = file === join(DIST_DIR, 'index.html');
    if (!isHomepage && new URL(href).pathname === '/') {
      issues.push({
        file,
        issue: 'CANONICAL POINTS TO HOMEPAGE (likely a bug)',
        value: href,
      });
    }

    // Check for canonical in <body> instead of <head>
    const bodyCanonical = doc.querySelector('body link[rel="canonical"]');
    if (bodyCanonical) {
      issues.push({ file, issue: 'Canonical tag found in <body> (must be in <head>)' });
    }

    // Track for cross-page duplicate detection
    if (canonicalSet.has(href)) {
      issues.push({
        file,
        issue: 'DUPLICATE canonical — another page shares this canonical URL',
        value: href,
      });
    }
    canonicalSet.add(href);

    // Check noindex + cross-page canonical conflict
    const robotsMeta = doc.querySelector('meta[name="robots"]');
    const robotsContent = robotsMeta?.getAttribute('content') || '';
    if (robotsContent.includes('noindex')) {
      // If noindex, canonical should be self-referencing (or absent)
      const pagePath = '/' + file
        .replace(DIST_DIR, '')
        .replace(/\/index\.html$/, '')
        .replace(/\.html$/, '')
        .replace(/^\//, '');
      const expectedSelfCanonical = `${SITE_ORIGIN}${pagePath === '/' ? '' : pagePath}`;

      if (href !== expectedSelfCanonical && href !== `${expectedSelfCanonical}/`) {
        issues.push({
          file,
          issue: 'NOINDEX page has canonical pointing to different URL (conflicting signals)',
          value: href,
        });
      }
    }
  }

  // Report
  if (issues.length === 0) {
    console.log('All canonical tags valid.');
  } else {
    console.error(`\nFound ${issues.length} canonical issue(s):\n`);
    for (const issue of issues) {
      console.error(`  [${issue.issue}]`);
      console.error(`    File: ${issue.file}`);
      if (issue.value) console.error(`    Value: ${issue.value}`);
      console.error('');
    }
    process.exit(1);
  }
}

validateCanonicals();
```

### 8.5 Astro Configuration for Canonical Consistency

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',  // REQUIRED — used by Astro.site for absolute URLs
  trailingSlash: 'never',       // Enforce no trailing slashes sitewide
  build: {
    format: 'directory',        // /plumbing/austin-tx → /plumbing/austin-tx/index.html
  },
});
```

---

## 9. Pagination Canonicals

For service listing pages that paginate (e.g., `/services/plumbing`, `/services/plumbing?page=2`), the canonical strategy depends on implementation approach.

### 9.1 Approach A: Query-Parameter Pagination (Recommended Against)

If pagination uses query parameters (`?page=2`), each paginated page should have a self-referencing canonical **including** the page parameter:

```html
<!-- /services/plumbing?page=2 -->
<link rel="canonical" href="https://example.com/services/plumbing?page=2" />
```

This is the exception to the "strip all query parameters" rule — the `page` parameter is semantic and changes the content.

However, query-parameter pagination is discouraged for programmatic SEO because Google may not treat these as distinct pages.

### 9.2 Approach B: Path-Based Pagination (Recommended)

Use path segments for pagination:

```
/services/plumbing          ← page 1
/services/plumbing/page/2   ← page 2
/services/plumbing/page/3   ← page 3
```

Each page gets a self-referencing canonical:

```html
<!-- /services/plumbing/page/2 -->
<link rel="canonical" href="https://example.com/services/plumbing/page/2" />
```

### 9.3 Pagination Link Elements

Google officially dropped all support for rel="prev" / rel="next" in 2019 and no longer uses them. Bing still supports them. Include them only if Bing traffic is a priority; they provide no benefit for Google.

```astro
---
// In SEOHead.astro or pagination component
const { currentPage, totalPages, basePath } = Astro.props;

const prevUrl = currentPage > 1
  ? currentPage === 2
    ? `${basePath}`  // Page 1 is the base path (no /page/1)
    : `${basePath}/page/${currentPage - 1}`
  : null;

const nextUrl = currentPage < totalPages
  ? `${basePath}/page/${currentPage + 1}`
  : null;
---

{prevUrl && <link rel="prev" href={prevUrl} />}
{nextUrl && <link rel="next" href={nextUrl} />}
```

### 9.4 Page 1 Canonical

Page 1 should always canonical to the base path without `/page/1`:

```html
<!-- CORRECT: /services/plumbing is the canonical for page 1 -->
<link rel="canonical" href="https://example.com/services/plumbing" />

<!-- If someone hits /services/plumbing/page/1, 301 redirect to /services/plumbing -->
```

Implement a redirect rule:

```typescript
// In middleware or redirect config
if (url.pathname.endsWith('/page/1')) {
  return Response.redirect(
    url.pathname.replace('/page/1', ''),
    301
  );
}
```

---

## 10. Google's Current Canonical Best Practices (2025–2026)

Based on Google's documentation and recent guidance:

### 10.1 Canonicals Are Hints, Not Directives

Google treats `rel="canonical"` as a strong signal but reserves the right to choose a different canonical. Factors that can cause Google to override your canonical:

- The declared canonical returns a 4xx/5xx error
- The declared canonical redirects to a different URL
- The declared canonical has a `noindex` directive
- Internal links predominantly point to a different URL variant
- The sitemap lists a different URL
- HTTPS/HTTP, www/non-www signals conflict with the declared canonical
- Hreflang annotations point to a different URL

**Takeaway**: Canonical tags must be consistent with all other URL signals (internal links, sitemap, redirects, hreflang).

### 10.2 Google's Consolidation Signals (Ranked by Strength)

1. **301 Redirect** — strongest signal; Google almost always respects these
2. **rel="canonical" tag** — strong hint
3. **Sitemap inclusion** — moderate signal
4. **Internal linking patterns** — moderate signal
5. **HTTPS over HTTP** — preference signal
6. **URL cleanliness** — Google prefers shorter, cleaner URLs

### 10.3 Google Search Console Canonical Reporting

Google Search Console reports on canonical status in the **Pages** (formerly "Coverage") report. Key statuses:

- **"Duplicate without user-selected canonical"** — Google found duplicates but you didn't specify a canonical. Google chose one for you.
- **"Duplicate, Google chose different canonical than user"** — You specified a canonical, but Google disagreed and picked a different URL. This is a critical issue to investigate.
- **"Alternate page with proper canonical tag"** — You correctly canonicalized a duplicate to another page. Working as intended.

### 10.4 Rendering and Canonical Discovery

Google's rendering pipeline first parses raw HTML, then renders JavaScript. Canonical tags must be present in the initial HTML response. For Astro SSG/SSR, this is inherently the case. Never rely on client-side JavaScript to inject canonical tags.

---

## 11. Canonical Tags and Hreflang Interaction

If the site supports multiple languages (e.g., English and Spanish for Texas service areas), canonical and hreflang must work together precisely.

### 11.1 Rules of Interaction

1. **Each language version gets its own self-referencing canonical.**
2. **Hreflang annotations point between language versions, and each hreflang URL must match that page's canonical.**
3. **Never canonical a Spanish page to the English version (or vice versa).** They are different pages for different audiences.

```html
<!-- English page: /plumbing/austin-tx -->
<link rel="canonical" href="https://example.com/plumbing/austin-tx" />
<link rel="alternate" hreflang="en" href="https://example.com/plumbing/austin-tx" />
<link rel="alternate" hreflang="es" href="https://example.com/es/plomeria/austin-tx" />
<link rel="alternate" hreflang="x-default" href="https://example.com/plumbing/austin-tx" />

<!-- Spanish page: /es/plomeria/austin-tx -->
<link rel="canonical" href="https://example.com/es/plomeria/austin-tx" />
<link rel="alternate" hreflang="en" href="https://example.com/plumbing/austin-tx" />
<link rel="alternate" hreflang="es" href="https://example.com/es/plomeria/austin-tx" />
<link rel="alternate" hreflang="x-default" href="https://example.com/plumbing/austin-tx" />
```

### 11.2 Implementation in the SEO Component

The `SEOHead.astro` component shown in Section 8.1 already includes hreflang support. Usage:

```astro
<SEOHead
  title={title}
  description={description}
  canonicalUrl={canonicalUrl}
  hreflangAlternates={[
    { lang: 'en', url: 'https://example.com/plumbing/austin-tx' },
    { lang: 'es', url: 'https://example.com/es/plomeria/austin-tx' },
  ]}
/>
```

### 11.3 Common Hreflang + Canonical Mistakes

- **Hreflang URL does not match the target page's canonical**: If page B's canonical is URL-C, but page A's hreflang points to URL-B, Google sees a conflict.
- **Missing reciprocal hreflang**: If the English page declares `hreflang="es"` pointing to the Spanish page, the Spanish page must declare `hreflang="en"` pointing back to the English page.
- **Non-canonical URLs in hreflang**: Hreflang URLs must be the canonical version (no trailing slash variants, no HTTP, etc.).

---

## 12. Monitoring Canonical Issues in Google Search Console

### 12.1 Key Reports to Monitor

**Pages Report (Index → Pages)**

Filter by the following statuses, which indicate canonical problems:

| Status | Meaning | Action |
|---|---|---|
| "Duplicate, Google chose different canonical than user" | Google ignored your canonical tag | Investigate why. Check for conflicting signals. |
| "Duplicate without user-selected canonical" | No canonical tag was found, Google guessed | Add explicit canonical tags. |
| "Duplicate, submitted URL not selected as canonical" | URL is in sitemap but Google picked a different canonical | Remove non-canonical URLs from sitemap, or fix canonical tags. |
| "Page with redirect" | URL redirects; check that the target has correct canonical | Verify redirect chain ends at canonical URL. |
| "Crawled - currently not indexed" | Google crawled but chose not to index | May indicate thin/duplicate content; check canonical signals. |

**URL Inspection Tool**

For any specific URL, the inspection tool shows:
- **"User-declared canonical"**: What your `<link rel="canonical">` says.
- **"Google-selected canonical"**: What Google actually chose as canonical.
- If these two differ, you have a problem.

### 12.2 Automated Monitoring Strategy

At 100k pages, manual GSC checking is not feasible. Implement programmatic monitoring:

```typescript
// Example: GSC API monitoring script (runs daily via cron)
// Uses the Google Search Console API to detect canonical mismatches.

import { google } from 'googleapis';

interface CanonicalMismatch {
  inspectedUrl: string;
  userCanonical: string;
  googleCanonical: string;
}

async function checkCanonicals(
  siteUrl: string,
  urlsToCheck: string[]
): Promise<CanonicalMismatch[]> {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const mismatches: CanonicalMismatch[] = [];
  const MAX_REQUESTS = 2000;

  if (urlsToCheck.length > MAX_REQUESTS) {
    console.warn(
      `WARNING: ${urlsToCheck.length} URLs exceed the hard cap of ${MAX_REQUESTS}. ` +
      `Only the first ${MAX_REQUESTS} will be checked.`
    );
    urlsToCheck = urlsToCheck.slice(0, MAX_REQUESTS);
  }

  for (const url of urlsToCheck) {
    // Rate limit: 1 request per second to avoid API quota exhaustion
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const result = await searchconsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: siteUrl,
        },
      });

      const inspection = result.data.inspectionResult?.indexStatusResult;
      const userCanonical = inspection?.userCanonical || '';
      const googleCanonical = inspection?.googleCanonical || '';

      if (userCanonical && googleCanonical && userCanonical !== googleCanonical) {
        mismatches.push({
          inspectedUrl: url,
          userCanonical,
          googleCanonical,
        });
      }
    } catch (err) {
      console.error(`Failed to inspect ${url}:`, err);
    }
  }

  return mismatches;
}
```

### 12.3 Monitoring Checklist (Weekly/Monthly)

- [ ] Check GSC "Pages" report for new "Duplicate, Google chose different canonical" entries
- [ ] Run URL Inspection on a random sample of 50–100 programmatic pages
- [ ] Verify sitemap URLs match canonical URLs (automated comparison)
- [ ] Check for new crawl errors that might indicate broken canonical targets
- [ ] Review any pages where Google's selected canonical differs from declared canonical
- [ ] Monitor "Crawled - currently not indexed" count — rising numbers may indicate canonical/quality issues
- [ ] Validate that robots.txt is not blocking any canonical target URLs
- [ ] Audit for pages accidentally set to noindex that should be indexed

---

## Implementation Checklist Summary

For the agency's Payload CMS + Astro + Next.js stack, the following must be true at launch:

1. **Every indexable page** has exactly one `<link rel="canonical">` tag in `<head>`, self-referencing with a fully-qualified HTTPS URL.
2. **Astro's `trailingSlash`** is set to `'never'` and enforced with server-side 301 redirects.
3. **The `SEOHead.astro` component** is the single source of truth for canonical tags — no other component or layout may inject a canonical.
4. **The `normalizeUrl()` function** enforces lowercase, strips query parameters, removes trailing slashes, and forces HTTPS.
5. **Sitemap generation** uses the same `normalizeUrl()` function so sitemap URLs and canonical URLs are identical.
6. **Build-time validation** (`validate-canonicals.ts`) runs in CI and blocks deployment if any canonical issue is detected.
7. **Query parameters** (UTM, session, referral) are stripped from canonical URLs. Only semantic parameters (like pagination) are preserved when using query-param pagination.
8. **Paginated pages** have self-referencing canonicals. Page 1 canonicals to the base path. `/page/1` 301 redirects to the base path.
9. **Cross-domain canonicals** are only used for same-owner multi-domain consolidation, never between different client sites.
10. **Hreflang annotations** (if applicable) reference only canonical URLs, with reciprocal declarations on all language versions.
11. **GSC monitoring** is configured with automated canonical mismatch detection running on a weekly schedule.
12. **No page** combines `noindex` with a cross-page canonical — these signals conflict.
