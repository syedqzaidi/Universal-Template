# URL Structure Best Practices — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers URL structure rules, slugification, location URL patterns, trailing slash policy, URL depth, redirect tracking, multilingual URLs, and Payload CMS implementation for programmatic SEO at scale.

---

# URL Structure Best Practices for Programmatic SEO

## 1. Foundational URL Structure Rules

### Character Rules

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Always lowercase | `/plumbing/austin-tx` | `/Plumbing/Austin-TX` |
| Hyphens as word separators | `/drain-cleaning` | `/drain_cleaning`, `/draincleaning` |
| No special characters | `/plumbing-and-drain` | `/plumbing-&-drain`, `/plumbing+drain` |
| No double hyphens | `/air-conditioning` | `/air--conditioning` |
| No trailing hyphens | `/drain-cleaning` | `/drain-cleaning-` |
| No leading hyphens in segments | `/drain-cleaning` | `/-drain-cleaning` |
| ASCII only in path segments | `/plumbing/san-jose` | `/plumbing/san-josé` |
| No file extensions for pages | `/about` | `/about.html` |
| No uppercase encodings | `/water-heater` | `/Water%20Heater` |
| No spaces (ever) | `/water-heater` | `/water heater` or `/water%20heater` |

### Why Hyphens Over Underscores

Google treats hyphens as word separators but treats underscores as word joiners. The URL `/drain_cleaning` is interpreted as a single token "drain_cleaning," while `/drain-cleaning` is interpreted as two words "drain" and "cleaning." This has been confirmed by Google multiple times, most recently in 2024, and remains the standard in 2026. There is zero reason to use underscores in public-facing URLs.

---

## 2. Maximum URL Length Recommendations (2026)

### Hard Limits

- **Browser limit**: Most modern browsers support URLs up to ~2,083 characters (IE legacy limit that became a de facto standard), though Chrome and Firefox handle up to 32,767+ characters.
- **Googlebot**: Google can crawl and index URLs well beyond 2,000 characters, but there is diminishing value.
- **CDN/Edge**: Cloudflare enforces a 16KB limit on the entire URL including query strings. Vercel and Netlify have similar practical limits.

### SEO Recommendations

| Metric | Recommendation |
|--------|---------------|
| **Ideal total URL length** | Under 75 characters (path portion) |
| **Maximum recommended** | Under 200 characters total |
| **Path segments** | Each slug segment should be 3-60 characters |
| **Keywords in URL** | First 3-5 words carry the most weight |

### Practical Guidance for Programmatic SEO

For a service-area business site generating 100k+ pages, URL length is governed by the template pattern. Calculate your worst-case scenarios:

```
/{service}/{sub-service}/{city}-{state-abbr}
/emergency-plumbing/sewer-line-replacement/west-palm-beach-fl
```

That example is 62 characters in the path — well within limits. The longest realistic URL on a service-area site should rarely exceed 80 path characters. If it does, shorten the slug, not the hierarchy.

---

## 3. Stop Words in URLs

### What Are Stop Words

Stop words are common words like "in," "the," "and," "of," "for," "a," "an," "to," "is," "at," "on," "with," "your," "our," etc.

### The Ruling: Exclude Them

**Remove stop words from programmatic URL slugs.** This is the consensus among technical SEO practitioners and is supported by Google's own documentation examples.

| With Stop Words | Without Stop Words | Winner |
|----------------|-------------------|--------|
| `/plumbing-services-in-austin-tx` | `/plumbing-services/austin-tx` | Without (shorter, cleaner, uses hierarchy) |
| `/how-to-fix-a-leaky-faucet` | `/fix-leaky-faucet` | Without for service pages; either for blog |
| `/best-plumber-in-the-austin-area` | `/best-plumber/austin-tx` | Without |

### Exceptions

- **Blog posts**: Keep natural-sounding stop words if the title demands it for readability. `/how-to-unclog-a-drain` is fine for a blog post. Even here, trim aggressively: `/unclog-drain-guide` is better for a utility page.
- **Never** include stop words in programmatically generated location or service slugs. The template should not produce them.

### Implementation Rule

When auto-generating slugs, strip the following words (at minimum):

```typescript
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'your', 'our', 'my', 'his', 'her', 'its',
  'their', 'this', 'that', 'these', 'those', 'near', 'area',
]);
```

For **service slugs** and **location slugs**, always strip. For **blog post slugs**, strip only if the result remains readable — otherwise, keep minimal stop words.

---

## 4. URL Depth and Hierarchy

### How Many Levels Is Too Many?

| Depth | Example | Verdict |
|-------|---------|---------|
| 1 | `/plumbing` | Ideal for top-level service or location index pages |
| 2 | `/plumbing/austin-tx` | Ideal for service+location combo pages |
| 3 | `/plumbing/drain-cleaning/austin-tx` | Acceptable for sub-service+location |
| 4 | `/services/plumbing/drain-cleaning/austin-tx` | Maximum — avoid if possible |
| 5+ | `/services/plumbing/residential/drain-cleaning/austin-tx` | Too deep — flatten |

### Rules

1. **Maximum recommended depth: 3 path segments** (excluding domain). Four is acceptable in rare cases but should be the hard ceiling.
2. **Every level must represent a real, indexable page.** If `/plumbing/drain-cleaning/` does not have its own page, do not use it as a path prefix. Flat is better than fake hierarchy.
3. **Hierarchy must be logical for breadcrumbs.** The URL `/plumbing/drain-cleaning/austin-tx` implies a breadcrumb of Home > Plumbing > Drain Cleaning > Austin, TX. If that breadcrumb makes no sense, the URL structure is wrong.
4. **Do not nest locations under locations.** Never do `/texas/austin/plumbing`. A city is the terminal location unit for service-area businesses.

### Recommended Hierarchy for Service-Area Businesses

```
/                                          # Homepage
/services/                                 # Service index (optional — see note)
/{service}/                                # Service landing page
/{service}/{sub-service}/                  # Sub-service page
/locations/                                # Location index
/{city}-{state}/                           # City landing page
/{service}/{city}-{state}/                 # Service + Location combo (money page)
/{service}/{sub-service}/{city}-{state}/   # Sub-service + Location combo
/blog/                                     # Blog index
/blog/{slug}/                              # Blog post
```

**Note on `/services/` prefix**: Omitting the `/services/` prefix keeps money pages one level shallower. The service slug itself (e.g., `/plumbing/`) is sufficiently descriptive. Only add `/services/` if there are slug collisions with other top-level pages.

---

## 5. Trailing Slash Consistency

### Pick One and Enforce Globally

| Option | URL | When to Use |
|--------|-----|-------------|
| **With trailing slash** | `/plumbing/austin-tx/` | If using Astro with `trailingSlash: 'always'` (default for static builds) |
| **Without trailing slash** | `/plumbing/austin-tx` | If using Next.js (default behavior) |

### The Critical Rule

**Every URL must resolve at exactly one canonical location.** If both `/plumbing/austin-tx` and `/plumbing/austin-tx/` return 200, you have duplicate content. One must 301 redirect to the other.

### Implementation

**Astro** (`astro.config.mjs`):

```javascript
export default defineConfig({
  trailingSlash: 'always', // or 'never' — pick one
});
```

**Next.js** (`next.config.js`):

```javascript
module.exports = {
  trailingSlash: false, // default; set to true if you want trailing slashes
};
```

**Payload CMS**: Slug fields should never store trailing slashes. The rendering framework appends or strips them at build/serve time.

**Sitemap and internal links**: Every `<loc>` in the sitemap and every `<a href>` in the HTML must use the chosen format. Inconsistency causes crawl budget waste on 301 chains.

### Recommendation for This Stack

Use **no trailing slash** if Next.js is the primary renderer. Use **trailing slash** if Astro static builds are the primary output. Do not mix conventions across the site. If both Astro and Next.js serve different sections, enforce the same convention in both configs.

---

## 6. Query Parameters vs. Path Segments

### Rule: Path Segments for All Indexable Content

Every page that should appear in Google must use path segments, never query parameters.

| Use Case | Correct | Incorrect |
|----------|---------|-----------|
| Service + Location page | `/plumbing/austin-tx` | `/services?type=plumbing&city=austin&state=tx` |
| Filtered service list | `/plumbing/residential` | `/plumbing?segment=residential` |
| Blog post | `/blog/fix-leaky-faucet` | `/blog?post=fix-leaky-faucet` |
| Paginated listing | `/blog/page/2` | `/blog?page=2` (acceptable but not preferred) |

### When Query Parameters Are Acceptable

- **Tracking parameters**: `?utm_source=google` — use `rel="canonical"` pointing to the clean URL
- **Session/user state**: `?ref=partner123` — not for indexing
- **Sorting/filtering on listing pages**: `?sort=rating&filter=emergency` — set `<meta name="robots" content="noindex">` on these, or use `rel="canonical"` to the unfiltered page
- **Pagination** (as a fallback): `?page=2` — but `/page/2/` is preferred for SEO

### Google Search Console Configuration

In Google Search Console, configure URL parameters to tell Google which parameters do not change page content. This prevents crawl budget waste on parameterized duplicates.

---

## 7. URL Slugification Rules

### Conversion Specification

Transform any human-readable string into a URL-safe slug. Here is the full specification:

**Input**: `"Plumbing & Drain Services"`
**Output**: `"plumbing-drain-services"` (stop words removed) or `"plumbing-and-drain-services"` (stop words kept for blog context)

### Slugification Algorithm (Step by Step)

1. Convert to lowercase
2. Normalize Unicode characters (NFD decomposition, strip diacritics)
3. Replace `&` with `and`
4. Replace `/` with a hyphen (for compound terms like "heating/cooling")
5. Strip all characters that are not `[a-z0-9\s-]`
6. Replace whitespace and consecutive hyphens with a single hyphen
7. Remove stop words (for service/location slugs — not blog slugs)
8. Trim leading and trailing hyphens
9. Validate: result must be 1-60 characters, must contain at least one letter

### Reference Implementation

```typescript
/**
 * Comprehensive slug generation for programmatic SEO.
 *
 * @param input - Human-readable string (e.g., "Plumbing & Drain Services")
 * @param options - Configuration for slug behavior
 * @returns URL-safe slug string
 */

interface SlugOptions {
  /** Remove common stop words. Default: true for services/locations, false for blog. */
  removeStopWords?: boolean;
  /** Maximum slug length. Default: 60. */
  maxLength?: number;
  /** Custom stop words to append to the default list. */
  additionalStopWords?: string[];
}

const DEFAULT_STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'your', 'our', 'my', 'his', 'her', 'its',
  'their', 'this', 'that', 'these', 'those', 'near', 'area',
]);

export function generateSlug(input: string, options: SlugOptions = {}): string {
  const {
    removeStopWords = true,
    maxLength = 60,
    additionalStopWords = [],
  } = options;

  // Build stop words set
  const stopWords = new Set([...DEFAULT_STOP_WORDS, ...additionalStopWords]);

  let slug = input
    // Step 1: Lowercase
    .toLowerCase()
    // Step 2: Normalize Unicode — decompose then strip combining marks
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Step 3: Replace & with 'and'
    .replace(/&/g, 'and')
    // Step 4: Replace / with hyphen
    .replace(/\//g, '-')
    // Step 5: Strip non-alphanumeric, non-space, non-hyphen characters
    .replace(/[^a-z0-9\s-]/g, '')
    // Step 6: Replace whitespace and consecutive hyphens with single hyphen
    .replace(/[\s-]+/g, '-')
    // Step 7: Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Step 8: Remove stop words (if enabled)
  if (removeStopWords) {
    slug = slug
      .split('-')
      .filter((word) => !stopWords.has(word))
      .join('-');

    // NOTE: A second trim pass is needed after stop word removal, because
    // removing stop words at the start or end of the slug can leave leading
    // or trailing hyphens (e.g., "the-plumber" → "-plumber" after removing "the").
    slug = slug.replace(/^-+|-+$/g, '');
  }

  // Handle edge case: if all words were stop words, fall back to original without stop word removal
  if (!slug || !/[a-z]/.test(slug)) {
    slug = input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'and')
      .replace(/\//g, '-')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Guard against all-numeric inputs (e.g., "12345") that produce slugs with no letters.
  // A valid slug must contain at least one letter to be meaningful for SEO and routing.
  if (!/[a-z]/.test(slug)) {
    throw new Error(
      `Invalid slug: "${slug}" (derived from "${input}"). Slug must contain at least one letter.`
    );
  }

  // Enforce max length — truncate at word boundary
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > maxLength * 0.5) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  // Final cleanup
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}
```

### Slugification Test Cases

| Input | Stop Words Removed | Output |
|-------|-------------------|--------|
| `"Plumbing & Drain Services"` | Yes | `plumbing-drain-services` |
| `"Plumbing & Drain Services"` | No | `plumbing-and-drain-services` |
| `"24/7 Emergency Plumbing"` | Yes | `24-7-emergency-plumbing` |
| `"Heating & Cooling"` | Yes | `heating-cooling` |
| `"Water Heater Installation & Repair"` | Yes | `water-heater-installation-repair` |
| `"The Best Plumber in Your Area"` | Yes | `best-plumber` |
| `"AC / HVAC Services"` | Yes | `ac-hvac-services` |
| `"Chateau d'Eau Plumbing"` | Yes | `chateau-deau-plumbing` |

---

## 8. Location URL Patterns

### City-State Format: Use `{city}-{state-abbreviation}`

| Format | Example | Verdict |
|--------|---------|---------|
| `austin-tx` | `/plumbing/austin-tx` | **Recommended** — short, unambiguous, standard |
| `austin-texas` | `/plumbing/austin-texas` | Acceptable but longer than necessary |
| `austin` | `/plumbing/austin` | **Ambiguous** — Austin, TX vs Austin, MN vs Austin, IN |
| `austin-tx-78701` | `/plumbing/austin-tx-78701` | Only if targeting zip-code-level pages |
| `tx/austin` | `/tx/austin/plumbing` | Adds unnecessary depth — avoid |

### Why `{city}-{state-abbr}` Wins

1. **Disambiguation**: There are 30+ cities named "Springfield" in the US. The state abbreviation is mandatory.
2. **Brevity**: "tx" vs "texas" saves 3 characters per URL across 100k+ pages; it also matches how users naturally abbreviate.
3. **Search behavior**: Users search "plumber austin tx" far more often than "plumber austin texas" — matching the URL to search query patterns helps.
4. **Consistency with Google Business Profile**: GBP listings use state abbreviations.

### Location Slug Generation

```typescript
/**
 * Generate a location slug from city name and state.
 * Handles multi-word cities, special characters, and edge cases.
 */
export function generateLocationSlug(
  city: string,
  stateAbbr: string
): string {
  const citySlug = generateSlug(city, { removeStopWords: false, maxLength: 40 });
  const state = stateAbbr.toLowerCase().trim();

  if (!/^[a-z]{2}$/.test(state)) {
    throw new Error(`Invalid state abbreviation: "${stateAbbr}". Must be exactly 2 letters.`);
  }

  return `${citySlug}-${state}`;
}
```

### Location Slug Test Cases

| City | State | Output |
|------|-------|--------|
| `"Austin"` | `"TX"` | `austin-tx` |
| `"West Palm Beach"` | `"FL"` | `west-palm-beach-fl` |
| `"O'Fallon"` | `"MO"` | `ofallon-mo` |
| `"St. Louis"` | `"MO"` | `st-louis-mo` |
| `"Coeur d'Alene"` | `"ID"` | `coeur-dalene-id` |
| `"San Jose"` | `"CA"` | `san-jose-ca` |
| `"Winston-Salem"` | `"NC"` | `winston-salem-nc` |
| `"Truth or Consequences"` | `"NM"` | `truth-or-consequences-nm` |

**Note**: Stop word removal is disabled for location slugs. "Truth or Consequences" must keep "or" because it is part of the proper noun.

---

## 9. URL Patterns by Page Type

### Complete URL Map

```
HOMEPAGE
/

SERVICE INDEX (optional)
/services/

SERVICE PAGES (top-level services)
/{service-slug}/
  Examples:
    /plumbing/
    /electrical/
    /hvac/
    /roofing/

SUB-SERVICE PAGES
/{service-slug}/{sub-service-slug}/
  Examples:
    /plumbing/drain-cleaning/
    /plumbing/water-heater-installation/
    /electrical/panel-upgrades/
    /hvac/ac-repair/

LOCATION INDEX
/locations/
/locations/{state-abbr}/           (optional state index pages)

LOCATION PAGES (city landing pages)
/{city-state}/
  Examples:
    /austin-tx/
    /west-palm-beach-fl/

SERVICE + LOCATION COMBO PAGES (primary money pages)
/{service-slug}/{city-state}/
  Examples:
    /plumbing/austin-tx/
    /electrical/west-palm-beach-fl/
    /hvac/san-jose-ca/

SUB-SERVICE + LOCATION COMBO PAGES
/{service-slug}/{sub-service-slug}/{city-state}/
  Examples:
    /plumbing/drain-cleaning/austin-tx/
    /hvac/ac-repair/west-palm-beach-fl/

BLOG
/blog/
/blog/{post-slug}/
  Examples:
    /blog/when-to-replace-water-heater/
    /blog/signs-of-electrical-problems/

BLOG CATEGORY / TAG (optional)
/blog/category/{category-slug}/
/blog/tag/{tag-slug}/

ABOUT / STATIC PAGES
/about/
/contact/
/privacy-policy/
/terms-of-service/
```

### Page Count Estimation

For a service-area business with 15 services, 60 sub-services, and 500 cities:

| Page Type | Formula | Count |
|-----------|---------|-------|
| Service pages | 15 | 15 |
| Sub-service pages | 60 | 60 |
| City pages | 500 | 500 |
| Service + City | 15 x 500 | 7,500 |
| Sub-service + City | 60 x 500 | 30,000 |
| Blog posts | Variable | 500+ |
| **Total** | | **~38,575+** |

To reach 100k+ pages, scale cities to 1,500+ or add more sub-services/neighborhoods.

---

## 10. URL Migration Strategy (301 Redirects)

### When Slugs Change

Slugs will change. Services get renamed, cities get added or corrected, sub-services get reorganized. This is inevitable on a 100k+ page site.

### Redirect Architecture

#### Payload CMS: Store Previous Slugs

```typescript
// In every collection that generates URLs, add a previousSlugs field:
{
  name: 'previousSlugs',
  type: 'array',
  admin: {
    readOnly: true,
    description: 'Automatically populated when the slug changes. Used for 301 redirects.',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
    {
      name: 'changedAt',
      type: 'date',
      required: true,
    },
  ],
}
```

#### Payload CMS: Slug Change Detection Hook

```typescript
import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Before-change hook that detects slug modifications and archives the old slug.
 * Attach this to any collection with a slug field that generates public URLs.
 */
export const trackSlugChanges: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
}) => {
  if (operation !== 'update' || !originalDoc) return data;

  const oldSlug = originalDoc.slug;
  const newSlug = data.slug;

  if (oldSlug && newSlug && oldSlug !== newSlug) {
    const previousSlugs = Array.isArray(data.previousSlugs)
      ? [...data.previousSlugs]
      : Array.isArray(originalDoc.previousSlugs)
        ? [...originalDoc.previousSlugs]
        : [];

    // Avoid duplicates
    if (!previousSlugs.some((entry: { slug: string }) => entry.slug === oldSlug)) {
      previousSlugs.push({
        slug: oldSlug,
        changedAt: new Date().toISOString(),
      });
    }

    data.previousSlugs = previousSlugs;
  }

  return data;
};
```

#### Redirect Map Generation

At build time (or via an API route), generate a redirect map from all `previousSlugs` entries:

```typescript
import type { Payload } from 'payload';

interface RedirectEntry {
  source: string;
  destination: string;
  permanent: boolean; // true = 301
}

/**
 * Generate a redirect map from all collections that have previousSlugs.
 * Call this at build time to produce the redirect config for Astro/Next.js.
 */
export async function generateRedirectMap(
  payload: Payload
): Promise<RedirectEntry[]> {
  const redirects: RedirectEntry[] = [];

  // Fetch all services with previous slugs
  const services = await payload.find({
    collection: 'services',
    where: {
      'previousSlugs.slug': { exists: true },
    },
    limit: 0, // Fetch all
    depth: 0,
  });

  for (const service of services.docs) {
    if (!service.previousSlugs || !Array.isArray(service.previousSlugs)) continue;
    for (const prev of service.previousSlugs) {
      // Redirect old service URL to new
      redirects.push({
        source: `/${prev.slug}`,
        destination: `/${service.slug}`,
        permanent: true,
      });

      // Also redirect all old service+location combo URLs
      // This requires fetching all locations and creating cross-product redirects
      // For 100k+ pages, this is better handled by a middleware pattern match
    }
  }

  // Repeat for locations, sub-services, etc.
  // ...

  return redirects;
}
```

#### Middleware-Based Redirect (for Scale)

At 100k+ pages, a static redirect map becomes unwieldy. Use middleware instead:

```typescript
// middleware.ts (Next.js) or middleware handler (Astro)
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware that checks incoming URL slugs against a redirect lookup
 * (backed by a KV store, database query, or in-memory cache).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this path matches any known old slug
  const redirect = await lookupRedirect(pathname);

  if (redirect) {
    return NextResponse.redirect(
      new URL(redirect.destination, request.url),
      301
    );
  }

  return NextResponse.next();
}

async function lookupRedirect(
  pathname: string
): Promise<{ destination: string } | null> {
  // Option 1: Query Payload CMS API
  // Option 2: Query a Redis/KV store populated at build time
  // Option 3: Query a lightweight SQLite database at the edge
  // The choice depends on infrastructure. KV store is recommended for Vercel Edge.
  return null; // Placeholder
}
```

### Redirect Rules

1. **Always 301 (permanent), never 302**, for slug changes. The old URL is gone forever.
2. **Redirect chains must never exceed 1 hop.** If slug A changed to B, then B changed to C, update A's redirect to point directly to C.
3. **Keep redirects active for a minimum of 1 year.** Google can take months to fully process redirect signals, especially for pages with little authority.
4. **Validate redirects in the sitemap.** No URL in the sitemap should be a redirect source. Sitemap must contain only final destination URLs.
5. **Monitor via Google Search Console.** Check the "Page indexing" report for redirect errors and crawl anomalies.

---

## 11. International / Multilingual URL Structure

### Subdirectory Pattern (Recommended)

Use language subdirectories, not subdomains or separate domains.

```
ENGLISH (default)
/plumbing/austin-tx/

SPANISH
/es/plomeria/austin-tx/

FRENCH (if needed)
/fr/plomberie/austin-tx/
```

### Why Subdirectories Over Subdomains

| Approach | Example | Pros | Cons |
|----------|---------|------|------|
| Subdirectories | `/es/plomeria/` | Inherits domain authority, simple infra, single sitemap | URL is longer |
| Subdomains | `es.example.com/plomeria/` | Clean separation | Treated as separate site by Google, authority starts from zero |
| ccTLDs | `example.es/plomeria/` | Strong geo signal | Expensive, complex, authority isolation |

**For service-area businesses operating in the US with Spanish-speaking customers, subdirectories are the only sensible choice.**

### Implementation Details

1. **Translate service slugs, not location slugs.** "Austin, TX" is "Austin, TX" in every language. Do not translate city names.
2. **Use `hreflang` tags** on every page to link language variants:
   ```html
   <link rel="alternate" hreflang="en" href="https://example.com/plumbing/austin-tx/" />
   <link rel="alternate" hreflang="es" href="https://example.com/es/plomeria/austin-tx/" />
   <link rel="alternate" hreflang="x-default" href="https://example.com/plumbing/austin-tx/" />
   ```
3. **Separate sitemaps per language** (or a single sitemap index referencing language-specific sitemaps).
4. **Slug mapping table in Payload CMS**: Each service/sub-service document should have a `localizedSlugs` field:
   ```typescript
   {
     name: 'localizedSlugs',
     type: 'group',
     fields: [
       { name: 'en', type: 'text', required: true },
       { name: 'es', type: 'text' },
       { name: 'fr', type: 'text' },
     ],
   }
   ```

### Full URL Pattern (Multilingual)

```
ENGLISH
/{service}/{city-state}/                           → /plumbing/austin-tx/
/{service}/{sub-service}/{city-state}/             → /plumbing/drain-cleaning/austin-tx/

SPANISH
/es/{servicio}/{city-state}/                       → /es/plomeria/austin-tx/
/es/{servicio}/{sub-servicio}/{city-state}/         → /es/plomeria/limpieza-de-drenaje/austin-tx/
```

---

## 12. Payload CMS Implementation

### Slug Field Configuration

```typescript
import type { Field } from 'payload';
import { generateSlug } from '../utils/slugify'; // The function from Section 7

/**
 * Reusable slug field configuration for any Payload CMS collection.
 * Includes validation, auto-generation, and uniqueness enforcement.
 */
export function slugField(options: {
  /** Source field name to auto-generate slug from. Default: 'title' */
  sourceField?: string;
  /** Remove stop words from auto-generated slug. Default: true */
  removeStopWords?: boolean;
  /** Maximum slug length. Default: 60 */
  maxLength?: number;
  /** Additional slugs to consider unique against (for cross-collection uniqueness). */
  uniqueAcrossCollections?: string[];
} = {}): Field {
  const {
    sourceField = 'title',
    removeStopWords = true,
    maxLength = 60,
  } = options;

  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'URL-safe identifier. Auto-generated from title if left blank.',
    },
    validate: (value: string | null | undefined) => {
      if (!value) return 'Slug is required.';

      if (value !== value.toLowerCase()) {
        return 'Slug must be lowercase.';
      }

      if (/[^a-z0-9-]/.test(value)) {
        return 'Slug may only contain lowercase letters, numbers, and hyphens.';
      }

      if (/--/.test(value)) {
        return 'Slug must not contain consecutive hyphens.';
      }

      if (/^-|-$/.test(value)) {
        return 'Slug must not start or end with a hyphen.';
      }

      if (value.length > maxLength) {
        return `Slug must be ${maxLength} characters or fewer. Currently ${value.length}.`;
      }

      if (value.length < 2) {
        return 'Slug must be at least 2 characters.';
      }

      if (!/[a-z]/.test(value)) {
        return 'Slug must contain at least one letter.';
      }

      return true;
    },
  };
}
```

### Auto-Slugification Hook

```typescript
import type { CollectionBeforeValidateHook } from 'payload';
import { generateSlug } from '../utils/slugify';

/**
 * Before-validate hook that auto-generates a slug from a source field
 * if the slug is empty. Runs on both create and update.
 */
export function autoSlugify(options: {
  sourceField?: string;
  removeStopWords?: boolean;
} = {}): CollectionBeforeValidateHook {
  const { sourceField = 'title', removeStopWords = true } = options;

  return async ({ data, operation }) => {
    if (!data) return data;

    // Only auto-generate if slug is empty or missing
    if (!data.slug && data[sourceField]) {
      data.slug = generateSlug(data[sourceField] as string, {
        removeStopWords,
      });
    }

    // Normalize existing slugs only on create, or if the slug fails basic validation.
    // On update, an already-valid slug should not be re-normalized — doing so can
    // trigger unnecessary slug change tracking and redirect generation.
    const isValidSlug = (s: string) =>
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && /[a-z]/.test(s);

    if (data.slug && (operation === 'create' || !isValidSlug(data.slug))) {
      data.slug = data.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return data;
  };
}
```

### Complete Service Collection Example

```typescript
import type { CollectionConfig } from 'payload';
import { slugField } from '../fields/slug';
import { autoSlugify } from '../hooks/autoSlugify';
import { trackSlugChanges } from '../hooks/trackSlugChanges';

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [autoSlugify({ sourceField: 'title', removeStopWords: true })],
    beforeChange: [trackSlugChanges],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({ removeStopWords: true }),
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'services',
      hasMany: false,
      admin: {
        description: 'Parent service (if this is a sub-service).',
      },
    },
    {
      name: 'localizedSlugs',
      type: 'group',
      admin: {
        description: 'Translated slugs for multilingual URL generation.',
      },
      fields: [
        { name: 'es', type: 'text', label: 'Spanish Slug' },
        { name: 'fr', type: 'text', label: 'French Slug' },
      ],
    },
    {
      name: 'previousSlugs',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'History of previous slugs for 301 redirect generation.',
      },
      fields: [
        { name: 'slug', type: 'text', required: true },
        { name: 'changedAt', type: 'date', required: true },
      ],
    },
    // ... other fields (description, content, SEO metadata, etc.)
  ],
};
```

### Complete Location Collection Example

```typescript
import type { CollectionConfig } from 'payload';
import { generateLocationSlug } from '../utils/slugify';
import { trackSlugChanges } from '../hooks/trackSlugChanges';

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'slug', 'state', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        if (!data) return data;

        // Auto-generate display name
        if (data.city && data.state && !data.displayName) {
          data.displayName = `${data.city}, ${data.state.toUpperCase()}`;
        }

        // Auto-generate slug from city + state
        if (!data.slug && data.city && data.state) {
          data.slug = generateLocationSlug(data.city, data.state);
        }

        return data;
      },
    ],
    beforeChange: [trackSlugChanges],
  },
  fields: [
    {
      name: 'city',
      type: 'text',
      required: true,
    },
    {
      name: 'state',
      type: 'text',
      required: true,
      maxLength: 2,
      admin: {
        description: 'Two-letter state abbreviation (e.g., TX, CA, FL).',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'State is required.';
        if (!/^[A-Za-z]{2}$/.test(value)) {
          return 'State must be a two-letter abbreviation.';
        }
        return true;
      },
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description: 'Auto-generated. E.g., "Austin, TX".',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from city + state. E.g., "austin-tx".',
      },
      // LIMITATION: This regex only checks that the slug ends with any two-letter
      // string, not that it is a valid US state code. For example, "austin-zz" would
      // pass validation. In production, consider maintaining a whitelist of valid
      // state abbreviations (e.g., a US_STATES Set) and checking the trailing segment
      // against it for stricter validation.
      validate: (value: string | null | undefined) => {
        if (!value) return 'Slug is required.';
        if (!/^[a-z0-9]+(-[a-z0-9]+)*-[a-z]{2}$/.test(value)) {
          return 'Location slug must end with a two-letter state abbreviation (e.g., "austin-tx").';
        }
        return true;
      },
    },
    {
      name: 'county',
      type: 'text',
    },
    {
      name: 'population',
      type: 'number',
    },
    {
      name: 'latitude',
      type: 'number',
    },
    {
      name: 'longitude',
      type: 'number',
    },
    {
      name: 'neighborhoods',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
      ],
    },
    {
      name: 'previousSlugs',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'slug', type: 'text', required: true },
        { name: 'changedAt', type: 'date', required: true },
      ],
    },
  ],
};
```

### URL Builder Utility

```typescript
/**
 * Build canonical URLs for every page type from Payload CMS documents.
 * This is the single source of truth for URL patterns across Astro and Next.js.
 */

interface ServiceDoc {
  slug: string;
  parent?: { slug: string; localizedSlugs?: { es?: string; fr?: string } } | null;
  localizedSlugs?: { es?: string; fr?: string };
}

interface LocationDoc {
  slug: string;
}

type Locale = 'en' | 'es' | 'fr';

const LOCALE_PREFIXES: Record<Locale, string> = {
  en: '',
  es: '/es',
  fr: '/fr',
};

export function buildServiceUrl(service: ServiceDoc, locale: Locale = 'en'): string {
  const prefix = LOCALE_PREFIXES[locale];
  const slug =
    locale !== 'en' && service.localizedSlugs?.[locale]
      ? service.localizedSlugs[locale]
      : service.slug;

  if (service.parent) {
    const parentSlug =
      locale !== 'en' && service.parent.localizedSlugs?.[locale]
        ? service.parent.localizedSlugs[locale]
        : service.parent.slug;
    return `${prefix}/${parentSlug}/${slug}`;
  }

  return `${prefix}/${slug}`;
}

export function buildLocationUrl(location: LocationDoc, locale: Locale = 'en'): string {
  const prefix = LOCALE_PREFIXES[locale];
  return `${prefix}/${location.slug}`;
}

export function buildServiceLocationUrl(
  service: ServiceDoc,
  location: LocationDoc,
  locale: Locale = 'en'
): string {
  const prefix = LOCALE_PREFIXES[locale];
  const serviceSlug =
    locale !== 'en' && service.localizedSlugs?.[locale]
      ? service.localizedSlugs[locale]
      : service.slug;

  if (service.parent) {
    const parentSlug =
      locale !== 'en' && service.parent.localizedSlugs?.[locale]
        ? service.parent.localizedSlugs[locale]
        : service.parent.slug;
    return `${prefix}/${parentSlug}/${serviceSlug}/${location.slug}`;
  }

  return `${prefix}/${serviceSlug}/${location.slug}`;
}

export function buildBlogUrl(postSlug: string, locale: Locale = 'en'): string {
  const prefix = LOCALE_PREFIXES[locale];
  return `${prefix}/blog/${postSlug}`;
}
```

---

## Quick Reference: URL Rules Checklist

Use this checklist during implementation and code review:

- [ ] All URLs lowercase
- [ ] Hyphens only (no underscores, no spaces, no special characters)
- [ ] No consecutive hyphens
- [ ] No leading or trailing hyphens in any segment
- [ ] Stop words removed from service and location slugs
- [ ] Location slugs end with two-letter state abbreviation
- [ ] Maximum URL depth of 3 segments (4 absolute max)
- [ ] Trailing slash policy is consistent and enforced (pick one)
- [ ] All indexable pages use path segments, not query parameters
- [ ] Slug validation runs on every save in Payload CMS
- [ ] Previous slugs are tracked for 301 redirect generation
- [ ] No redirect chains (max 1 hop)
- [ ] Sitemap contains only canonical, non-redirected URLs
- [ ] `hreflang` tags present on all multilingual pages
- [ ] International pages use subdirectory pattern (`/es/`, `/fr/`)
- [ ] URL builder utility is the single source of truth for all URL generation
