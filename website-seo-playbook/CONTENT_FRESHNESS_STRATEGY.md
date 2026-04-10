# Content Freshness & Update Strategy — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers Google's freshness ranking factor, automated content refresh strategies, seasonal content engine, content pruning, search engine notification (IndexNow/GSC), and freshness monitoring for programmatic SEO sites with 100k+ pages.

## 1. Google's Freshness Ranking Factor in 2026

### How Query Deserves Freshness (QDF) Works

Google's freshness algorithm determines whether a query benefits from recent results. Not all queries are freshness-sensitive — Google classifies queries along a spectrum:

**Freshness-sensitive query types:**
- **Breaking/trending queries**: "emergency plumber near me" during a cold snap — Google boosts recently published or updated pages during demand surges
- **Recurring events**: "AC tune-up spring 2026" — seasonal service queries where users expect current-year information
- **Frequently updated information**: pricing pages, service availability, business hours — Google expects these to reflect current reality
- **Recent event queries**: "new building codes 2026" — regulatory or industry changes that affect service businesses

**Freshness-insensitive query types (evergreen):**
- "how does a tankless water heater work" — informational content where the answer rarely changes
- "what is HVAC" — definitional queries
- Generic service descriptions without temporal qualifiers

### How Google Measures Freshness

Google uses multiple signals, weighted differently depending on query type:

1. **Document inception date**: When Google first indexed the page. Net-new pages get a temporary freshness boost (the "honeymoon period," typically 2–4 weeks).
2. **Content change magnitude**: Google compares cached versions. Changing a single date in the footer does not count. Substantial changes to body content, headings, and structured data carry more weight.
3. **Change frequency over time**: Pages updated regularly build a "living document" reputation. Google crawls them more often as a result.
4. **Rate of new inbound links**: A page suddenly earning links signals relevance and freshness to Google.
5. **User engagement shifts**: Changes in click-through rate, pogo-sticking, and dwell time after an update signal whether the refresh was meaningful.
6. **Structured data timestamps**: `dateModified` in JSON-LD schema tells Google explicitly when content was last updated.
7. **Sitemap `lastmod`**: A supplementary signal (see Section 5 for caveats).

### Freshness for Local/Service-Area Businesses Specifically

For service-area businesses (SABs), freshness matters most in these contexts:
- **Google Business Profile activity** influences local pack rankings — regular posts, photo uploads, and review responses signal an active business
- **Service pages with pricing or availability** — stale prices erode trust and trigger bounces
- **Location pages** — Google expects these to reflect current service areas, hours, and contact information
- **Blog/resource content** — demonstrates ongoing expertise and topical authority

---

## 2. Preventing 100k+ Programmatic Pages from Going Stale

### The Stale Content Death Spiral

When programmatic pages go stale, the following cascade occurs:
1. Google reduces crawl frequency for pages that never change
2. Reduced crawl frequency means updates take longer to register
3. Competitors with fresher content outrank stale pages
4. Traffic drops, reducing engagement signals
5. Google further deprioritizes the pages
6. Pages eventually drop from the index entirely ("soft deindexation")

### Architecture for Continuous Freshness at Scale

The key insight: **you cannot manually update 100k+ pages**. Freshness must be built into the data architecture itself.

**Strategy: Separate static content from dynamic data layers**

```
┌─────────────────────────────────────────────┐
│              Page Template                   │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Static Core  │  │  Dynamic Data Layer  │  │
│  │ (rarely      │  │  (auto-refreshed)    │  │
│  │  changes)    │  │                      │  │
│  │ - Service    │  │  - Current pricing   │  │
│  │   description│  │  - Latest reviews    │  │
│  │ - Process    │  │  - Weather data      │  │
│  │   explanation│  │  - Seasonal tips     │  │
│  │ - FAQ core   │  │  - Stats/numbers     │  │
│  │   answers    │  │  - "Last updated"    │  │
│  └──────────────┘  │  - Recent blog links │  │
│                    └─────────────────────────┘│
└─────────────────────────────────────────────┘
```

**Dynamic data sources that auto-refresh pages:**

| Data Source | Update Frequency | Pages Affected |
|---|---|---|
| Google/Yelp reviews (via API) | Daily | All location pages |
| Weather/climate data | Daily during season | HVAC, roofing, plumbing pages |
| Bureau of Labor Statistics / pricing indices | Monthly | All pricing sections |
| Local permit/regulation databases | Monthly | Service pages with compliance info |
| Internal testimonials collection | Weekly | All service+location pages |
| Seasonal content blocks | Quarterly | All pages (conditional rendering) |
| Blog cross-links (latest posts) | Per publish | All related service pages |
| Census / demographic data | Annually | Location pages |

---

## 3. Content Update Cadence by Page Type

### Pillar Pages (e.g., `/services/hvac-repair/`)
- **Full content review**: Every 90 days
- **Dynamic data refresh**: Weekly (pricing, stats, linked blog posts)
- **Structural changes**: Every 6 months (add new sections, update H2s based on new keyword research)
- **Target**: Pillar pages should show a `dateModified` no older than 30 days

### Cluster/Location Pages (e.g., `/hvac-repair/phoenix-az/`)
- **Template-level updates**: Quarterly (new sections, layout changes)
- **Dynamic data refresh**: Daily to weekly (reviews, weather, seasonal blocks)
- **Location-specific data**: Monthly (population stats, local regulations)
- **Target**: No page should go more than 60 days without some meaningful data change

### Blog/Resource Pages
- **New posts**: 2–4 per week minimum for a site targeting 100k+ pages (see Section 8)
- **Existing post refresh**: Top 20% by traffic reviewed every 90 days; bottom 20% evaluated for pruning every 180 days
- **Evergreen posts**: Annual review with updated year references, stats, and links
- **Target**: Top-performing posts updated within 60 days; all posts reviewed within 12 months

### Landing Pages (e.g., `/hvac-repair-near-me/`)
- **Full rewrite**: Every 6 months
- **CTA and offer updates**: Monthly
- **Testimonial rotation**: Weekly
- **Target**: `dateModified` no older than 14 days due to commercial intent freshness sensitivity

---

## 4. Freshness Signals Google Uses — And How to Trigger Them

### Signal 1: Last Modified Date (HTTP Header + Schema)

Google reads the `Last-Modified` HTTP header and `dateModified` in JSON-LD. These must reflect **actual content changes**, not deployment timestamps.

```typescript
// JSON-LD structured data for a service page
const generatePageSchema = (page: ServicePage) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": page.title,
  "description": page.metaDescription,
  "datePublished": page.createdAt,
  "dateModified": page.contentLastModified, // NOT the deploy date
  "provider": {
    "@type": "LocalBusiness",
    "name": page.businessName,
    "areaServed": page.serviceArea,
  },
});
```

### Signal 2: Substantive Content Changes

Google diffs pages between crawls. Meaningful changes include:
- New paragraphs or sections (100+ words of new body content)
- Updated statistics with new numbers
- New testimonials or case studies
- Revised headings reflecting current search intent
- New internal links to recently published content

**What does NOT count as meaningful:**
- Changing only the copyright year in the footer
- Updating only the `dateModified` without changing content
- Swapping synonyms or minor word changes
- Changing CSS/layout without content changes

### Signal 3: New Content Added to the Domain

Publishing new blog posts, adding new service pages, or expanding location coverage signals an active, growing site. Google increases crawl budget for domains that consistently add content.

### Signal 4: Freshness of Linked Content

When your service pages link to recently published blog posts, the linking page inherits a weak freshness signal. This is why auto-updating "Related Articles" sections matters.

### Signal 5: User Engagement Metrics Post-Update

After updating a page, if click-through rate improves (because you updated the meta title with "2026" or "Updated April 2026"), Google interprets this as validation that the update was valuable.

---

## 5. Sitemap `lastmod` Field — Proper Usage

### How Google Actually Uses `lastmod`

Google's official documentation and public statements from Search Relations team members (2024–2025) clarify:

- **Google uses `lastmod` as a hint, not a directive.** If Google discovers that your `lastmod` dates are unreliable (e.g., every page shows today's date), it ignores the field entirely for your domain.
- **Accurate `lastmod` values improve crawl efficiency.** Google prioritizes re-crawling pages with recent `lastmod` dates, which is critical when you have 100k+ pages competing for crawl budget.
- **`lastmod` should only change when page content meaningfully changes.** Template-only changes, CSS updates, or deployment timestamps should NOT update `lastmod`.

### Implementation Rules

```typescript
// CORRECT: Update lastmod only on meaningful content change
const shouldUpdateLastmod = (oldContent: PageContent, newContent: PageContent): boolean => {
  // Compare body text, stripping HTML tags
  const oldText = stripHtml(oldContent.body).trim();
  const newText = stripHtml(newContent.body).trim();

  // Calculate change magnitude
  const similarity = calculateCosineSimilarity(oldText, newText);

  // Only flag as updated if more than 5% of content changed
  if (similarity < 0.95) return true;

  // Check if structured data changed (pricing, stats)
  if (JSON.stringify(oldContent.structuredData) !== JSON.stringify(newContent.structuredData)) {
    return true;
  }

  // Check if key fields changed
  if (oldContent.title !== newContent.title) return true;
  if (oldContent.metaDescription !== newContent.metaDescription) return true;

  return false;
};
```

### Sitemap Generation for 100k+ Pages

With 100k+ pages, you must use a sitemap index file pointing to multiple sitemap files (max 50,000 URLs per sitemap, max 50MB uncompressed per file).

```typescript
// Sitemap index generation strategy
interface SitemapConfig {
  maxUrlsPerSitemap: number;       // 50,000 max per spec, use 40,000 for safety
  sitemapGroups: {
    prefix: string;                 // e.g., "services", "locations", "blog"
    changefreq: string;
    priority: number;
    urlPattern: string;
  }[];
}

const sitemapConfig: SitemapConfig = {
  maxUrlsPerSitemap: 40000,
  sitemapGroups: [
    {
      prefix: "pillar-services",
      changefreq: "weekly",
      priority: 0.9,
      urlPattern: "/services/*",
    },
    {
      prefix: "location-pages",
      changefreq: "weekly",
      priority: 0.8,
      urlPattern: "/*/city-state/",
    },
    {
      prefix: "blog",
      changefreq: "monthly",
      priority: 0.6,
      urlPattern: "/blog/*",
    },
  ],
};
```

### Critical Mistake to Avoid

**Never set all 100k+ pages to `lastmod: today`.** This signals to Google that your sitemap is unreliable, and Google will stop trusting your `lastmod` values entirely — the exact opposite of what you want. Only pages with genuine content changes should have their `lastmod` updated.

---

## 6. Automated Freshness Strategies — Programmatic Updates

### Strategy 1: Dynamic Data Injection

Automatically update pages with fresh data from external sources without human intervention.

```typescript
// /src/jobs/dynamic-data-refresh.ts
import { Payload } from "payload";
import { fetchWeatherData } from "../integrations/weather";
import { fetchReviewAggregates } from "../integrations/reviews";
import { fetchPricingIndex } from "../integrations/bls";

interface RefreshResult {
  pageId: string;
  fieldsUpdated: string[];
  contentChanged: boolean;
}

export async function refreshDynamicData(
  payload: Payload,
  batchSize: number = 500
): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];

  // Process pages in batches to avoid memory issues
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pages = await payload.find({
      collection: "location-pages",
      limit: batchSize,
      page,
      sort: "dynamicDataLastRefreshed", // Oldest first
      where: {
        // Only refresh pages not updated in the last 24 hours
        dynamicDataLastRefreshed: {
          less_than: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });

    for (const locationPage of pages.docs) {
      const fieldsUpdated: string[] = [];
      const updateData: Record<string, unknown> = {};

      // 1. Refresh weather/climate data for the location
      try {
        const weather = await fetchWeatherData(
          locationPage.latitude,
          locationPage.longitude
        );
        if (weather && weather.currentTemp !== locationPage.weatherTemp) {
          updateData.weatherTemp = weather.currentTemp;
          updateData.weatherCondition = weather.condition;
          updateData.weatherSeasonalTip = generateSeasonalTip(
            weather,
            locationPage.serviceType
          );
          fieldsUpdated.push("weather");
        }
      } catch (e) {
        console.error(`Weather fetch failed for ${locationPage.city}: ${e}`);
      }

      // 2. Refresh review aggregates
      try {
        const reviews = await fetchReviewAggregates(locationPage.businessGBPId);
        if (reviews && reviews.totalCount !== locationPage.reviewCount) {
          updateData.reviewCount = reviews.totalCount;
          updateData.averageRating = reviews.averageRating;
          updateData.latestReviewSnippet = reviews.mostRecent.snippet;
          updateData.latestReviewDate = reviews.mostRecent.date;
          fieldsUpdated.push("reviews");
        }
      } catch (e) {
        console.error(`Review fetch failed for ${locationPage.city}: ${e}`);
      }

      // 3. Refresh pricing data (monthly source)
      try {
        const pricing = await fetchPricingIndex(
          locationPage.serviceType,
          locationPage.stateCode
        );
        if (pricing && pricing.averageCost !== locationPage.averageCost) {
          updateData.averageCost = pricing.averageCost;
          updateData.costRangeLow = pricing.rangeLow;
          updateData.costRangeHigh = pricing.rangeHigh;
          updateData.costLastVerified = new Date().toISOString();
          fieldsUpdated.push("pricing");
        }
      } catch (e) {
        console.error(`Pricing fetch failed: ${e}`);
      }

      // Only update if something actually changed
      if (fieldsUpdated.length > 0) {
        updateData.dynamicDataLastRefreshed = new Date().toISOString();

        // Only update contentLastModified if substantive content changed
        const substantiveFields = ["reviews", "pricing"];
        const hasSubstantiveChange = fieldsUpdated.some((f) =>
          substantiveFields.includes(f)
        );

        if (hasSubstantiveChange) {
          updateData.contentLastModified = new Date().toISOString();
        }

        await payload.update({
          collection: "location-pages",
          id: locationPage.id,
          data: updateData,
        });

        results.push({
          pageId: locationPage.id,
          fieldsUpdated,
          contentChanged: hasSubstantiveChange,
        });
      }
    }

    hasMore = pages.hasNextPage;
    page++;
  }

  return results;
}

function generateSeasonalTip(
  weather: WeatherData,
  serviceType: string
): string {
  // Generate contextual tip based on current conditions
  if (serviceType === "hvac") {
    if (weather.currentTemp > 90)
      return `With temperatures reaching ${weather.currentTemp}°F in your area, now is the time to ensure your AC is running efficiently. Our technicians are available for same-day service.`;
    if (weather.currentTemp < 32)
      return `Temperatures have dropped to ${weather.currentTemp}°F. Protect your heating system with a professional inspection before the cold worsens.`;
  }
  if (serviceType === "plumbing") {
    if (weather.currentTemp < 28)
      return `Freeze warning: At ${weather.currentTemp}°F, exposed pipes are at risk of bursting. Call us for emergency pipe insulation and freeze prevention.`;
  }
  // ... more conditions
  return "";
}
```

### Strategy 2: Testimonial Rotation

Rotate displayed testimonials so pages show different social proof on each refresh:

```typescript
// /src/hooks/rotate-testimonials.ts
import { CollectionAfterReadHook } from "payload/types";

/**
 * Selects testimonials to display based on a rotation schedule.
 * Each page shows a different subset of testimonials each week,
 * creating natural content variation that Google detects as updates.
 */
export const rotateTestimonials: CollectionAfterReadHook = async ({
  doc,
  req,
}) => {
  if (!doc.allTestimonials || doc.allTestimonials.length === 0) return doc;

  const weekNumber = getISOWeekNumber(new Date());
  const pageHash = simpleHash(doc.id);

  // Deterministic but rotating selection — 3 testimonials per page
  const displayCount = 3;
  const startIndex = (weekNumber + pageHash) % doc.allTestimonials.length;

  const rotatedTestimonials: typeof doc.allTestimonials = [];
  for (let i = 0; i < displayCount; i++) {
    const index = (startIndex + i) % doc.allTestimonials.length;
    rotatedTestimonials.push(doc.allTestimonials[index]);
  }

  return {
    ...doc,
    displayedTestimonials: rotatedTestimonials,
  };
};

function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
```

### Strategy 3: "Last Verified" Timestamps

Display a visible "Information verified as of [date]" badge on service pages. This serves dual purpose — it tells users the info is current AND gives you a legitimate reason to update the page timestamp when you re-verify data.

```typescript
// /src/jobs/verify-page-data.ts

/**
 * Re-verifies page data accuracy and updates the "verified" timestamp.
 * This is NOT a fake freshness signal — it actually checks that
 * phone numbers, addresses, service areas, and pricing are correct.
 */
export async function verifyPageData(payload: Payload): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const pagesToVerify = await payload.find({
    collection: "location-pages",
    where: {
      and: [
        {
          lastVerifiedAt: {
            less_than: thirtyDaysAgo.toISOString(),
          },
        },
        {
          // Exclude pruned and consolidated pages — only verify published pages
          status: { equals: "published" },
        },
      ],
    },
    limit: 1000,
    sort: "lastVerifiedAt",
  });

  for (const page of pagesToVerify.docs) {
    const issues: string[] = [];

    // Verify phone number is still active
    const phoneValid = await verifyPhoneNumber(page.phoneNumber);
    if (!phoneValid) issues.push("phone_invalid");

    // Verify service area hasn't changed
    const areaValid = await verifyServiceArea(
      page.businessId,
      page.serviceArea
    );
    if (!areaValid) issues.push("area_changed");

    // Verify pricing is within expected range
    const pricingValid = await verifyPricingRange(
      page.serviceType,
      page.stateCode,
      page.averageCost
    );
    if (!pricingValid) issues.push("pricing_outdated");

    if (issues.length === 0) {
      // Data is verified — update the timestamp
      await payload.update({
        collection: "location-pages",
        id: page.id,
        data: {
          lastVerifiedAt: new Date().toISOString(),
          verificationStatus: "verified",
        },
      });
    } else {
      // Flag for manual review
      await payload.update({
        collection: "location-pages",
        id: page.id,
        data: {
          verificationStatus: "needs_review",
          verificationIssues: issues,
        },
      });
    }
  }
}
```

---

## 7. Seasonal Content Updates for Service Businesses

### Seasonal Content Calendar

Build a seasonal content engine that automatically swaps content blocks based on time of year and geographic location.

```typescript
// /src/collections/SeasonalContent.ts
import { CollectionConfig } from "payload/types";

export const SeasonalContent: CollectionConfig = {
  slug: "seasonal-content",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "serviceType", type: "select", options: [
      { label: "HVAC", value: "hvac" },
      { label: "Plumbing", value: "plumbing" },
      { label: "Roofing", value: "roofing" },
      { label: "Electrical", value: "electrical" },
      { label: "Pest Control", value: "pest-control" },
      { label: "Landscaping", value: "landscaping" },
    ]},
    { name: "climateZone", type: "select", options: [
      { label: "Northern (Cold Winters)", value: "northern" },
      { label: "Southern (Hot Summers)", value: "southern" },
      { label: "Coastal (Mild)", value: "coastal" },
      { label: "Desert (Arid)", value: "desert" },
      { label: "All Zones", value: "all" },
    ]},
    {
      name: "seasons",
      type: "array",
      fields: [
        { name: "season", type: "select", options: [
          { label: "Spring (Mar-May)", value: "spring" },
          { label: "Summer (Jun-Aug)", value: "summer" },
          { label: "Fall (Sep-Nov)", value: "fall" },
          { label: "Winter (Dec-Feb)", value: "winter" },
        ]},
        { name: "heroHeadline", type: "text" },
        { name: "heroSubheadline", type: "text" },
        { name: "urgencyMessage", type: "textarea" },
        { name: "seasonalTips", type: "richText" },
        { name: "seasonalFAQs", type: "array", fields: [
          { name: "question", type: "text" },
          { name: "answer", type: "richText" },
        ]},
        { name: "ctaText", type: "text" },
        { name: "ctaUrgency", type: "select", options: [
          { label: "Normal", value: "normal" },
          { label: "Urgent", value: "urgent" },
          { label: "Emergency", value: "emergency" },
        ]},
      ],
    },
  ],
};
```

### Seasonal Content Matrix

| Service | Spring | Summer | Fall | Winter |
|---|---|---|---|---|
| **HVAC** | AC tune-up season, filter replacement | Emergency AC repair, efficiency tips | Heating system prep, furnace inspection | Emergency heating, heat pump issues |
| **Plumbing** | Sump pump checks, outdoor faucet repair | Sprinkler system, water heater efficiency | Winterization prep, drain cleaning | Frozen pipe prevention, water heater demand |
| **Roofing** | Storm damage inspection, gutter cleaning | Heat damage, attic ventilation | Pre-winter inspection, leaf removal | Ice dam prevention, emergency leak repair |
| **Electrical** | Outdoor lighting, storm surge protection | Pool/spa wiring, ceiling fan installation | Generator prep, holiday lighting | Generator service, heating system electrical |
| **Pest Control** | Ant/termite season, spring emergence | Mosquitoes, wasps, outdoor pests | Rodent entry prevention, fall invaders | Indoor pest pressure, rodent control |

### Automated Season Switching

```typescript
// /src/utils/seasonal-content-resolver.ts

interface SeasonConfig {
  season: "spring" | "summer" | "fall" | "winter";
  startMonth: number;  // 0-indexed
  endMonth: number;
}

// Months are 0-indexed to match JavaScript's Date.getMonth()
// (0 = January, 1 = February, ..., 11 = December)
const CLIMATE_ZONE_SEASONS: Record<string, SeasonConfig[]> = {
  northern: [
    { season: "spring", startMonth: 2, endMonth: 4 },   // Mar(2)–Apr(3)
    { season: "summer", startMonth: 4, endMonth: 7 },   // May(4)–Jul(7)
    { season: "fall", startMonth: 7, endMonth: 9 },     // Aug(7)–Sep(9)
    { season: "winter", startMonth: 9, endMonth: 2 },   // Oct(9)–Feb(1)
  ],
  southern: [
    { season: "spring", startMonth: 1, endMonth: 3 },   // Feb(1)–Mar(3)
    { season: "summer", startMonth: 3, endMonth: 8 },   // Apr(3)–Aug(8), longer summer
    { season: "fall", startMonth: 8, endMonth: 10 },    // Sep(8)–Oct(10)
    { season: "winter", startMonth: 10, endMonth: 1 },  // Nov(10)–Jan(0), shorter winter
  ],
  desert: [
    { season: "spring", startMonth: 1, endMonth: 3 },   // Feb(1)–Mar(3)
    { season: "summer", startMonth: 3, endMonth: 8 },   // Apr(3)–Aug(8), extended heat season
    { season: "fall", startMonth: 8, endMonth: 10 },    // Sep(8)–Oct(10)
    { season: "winter", startMonth: 10, endMonth: 1 },  // Nov(10)–Jan(0)
  ],
  coastal: [
    { season: "spring", startMonth: 2, endMonth: 4 },   // Mar(2)–Apr(4)
    { season: "summer", startMonth: 4, endMonth: 8 },   // May(4)–Aug(8)
    { season: "fall", startMonth: 8, endMonth: 10 },    // Sep(8)–Oct(10)
    { season: "winter", startMonth: 10, endMonth: 2 },  // Nov(10)–Feb(1)
  ],
};

export function getCurrentSeason(climateZone: string): string {
  const now = new Date();
  const month = now.getMonth();
  const zones = CLIMATE_ZONE_SEASONS[climateZone] || CLIMATE_ZONE_SEASONS.northern;

  for (const zone of zones) {
    if (zone.startMonth <= zone.endMonth) {
      if (month >= zone.startMonth && month < zone.endMonth) return zone.season;
    } else {
      // Wraps around year boundary (e.g., winter: Nov-Mar)
      if (month >= zone.startMonth || month < zone.endMonth) return zone.season;
    }
  }

  return "summer"; // fallback
}

export async function resolveSeasonalContent(
  payload: Payload,
  serviceType: string,
  climateZone: string
): Promise<SeasonalContentBlock | null> {
  const season = getCurrentSeason(climateZone);

  const result = await payload.find({
    collection: "seasonal-content",
    where: {
      and: [
        { serviceType: { equals: serviceType } },
        {
          or: [
            { climateZone: { equals: climateZone } },
            { climateZone: { equals: "all" } },
          ],
        },
      ],
    },
    limit: 1,
  });

  if (result.docs.length === 0) return null;

  const doc = result.docs[0];
  const seasonalBlock = doc.seasons?.find((s) => s.season === season);

  return seasonalBlock || null;
}
```

---

## 8. Blog Publishing Cadence for Supporting Content

### Recommended Cadence for 100k+ Page Sites

**Minimum viable cadence**: 3 posts per week
**Recommended cadence**: 5–7 posts per week (1 per business day)
**Aggressive growth cadence**: 10–15 posts per week

### Content Categories and Ratios

| Category | % of Output | Example Topics | Purpose |
|---|---|---|---|
| **Seasonal/timely** | 30% | "Spring AC Maintenance Checklist 2026" | Freshness signals, topical relevance |
| **Location-specific** | 25% | "Common Plumbing Issues in Phoenix Homes" | Internal linking to location pages |
| **How-to/educational** | 20% | "How to Tell if Your Water Heater Needs Replacing" | Topical authority, featured snippets |
| **Industry news** | 10% | "New EPA Refrigerant Regulations 2026" | E-E-A-T, freshness |
| **Case studies** | 10% | "Emergency Pipe Repair in [City]: A Case Study" | Trust, internal linking |
| **Comparison/buyer guides** | 5% | "Tank vs. Tankless Water Heaters" | Commercial intent capture |

### Blog-to-Service Page Linking Strategy

Every blog post should link to 3–5 relevant service/location pages. This creates two freshness benefits:
1. The blog post itself is fresh content
2. When the blog post links to existing service pages, those pages gain a weak freshness signal from the new inbound internal link

```typescript
// /src/hooks/auto-link-blog-to-services.ts

/**
 * After a blog post is published, automatically update the
 * "recentBlogPosts" field on related service/location pages.
 * This triggers a content change on those pages.
 */
export const linkBlogToServicePages = async ({
  doc,
  operation,
  req,
}: {
  doc: BlogPost;
  operation: "create" | "update";
  req: PayloadRequest;
}): Promise<void> => {
  if (operation !== "create") return;
  if (doc.status !== "published") return;

  const payload = req.payload;

  // Find service pages that match the blog's service type
  const relatedPages = await payload.find({
    collection: "location-pages",
    where: {
      serviceType: { equals: doc.primaryServiceType },
    },
    limit: 0, // Get count only first
  });

  // Update related pages in batches
  const batchSize = 200;
  let page = 1;

  while (true) {
    const batch = await payload.find({
      collection: "location-pages",
      where: {
        serviceType: { equals: doc.primaryServiceType },
      },
      limit: batchSize,
      page,
    });

    for (const locationPage of batch.docs) {
      // Get existing recent posts, keep last 4, add new one
      const existingPosts = locationPage.recentBlogPosts || [];
      const updatedPosts = [
        { blogPost: doc.id, addedAt: new Date().toISOString() },
        ...existingPosts.slice(0, 4),
      ];

      await payload.update({
        collection: "location-pages",
        id: locationPage.id,
        data: {
          recentBlogPosts: updatedPosts,
          // Use a dedicated timestamp for blog-link updates instead of
          // contentLastModified. Updating contentLastModified here would
          // trigger the onContentChange hook and flood the indexing queue
          // with thousands of pages every time a blog post is published.
          recentBlogPostsLastUpdated: new Date().toISOString(),
        },
      });
    }

    if (!batch.hasNextPage) break;
    page++;
  }
};
```

---

## 9. Content Pruning — Identifying and Handling Underperforming Pages

### Why Pruning Matters at Scale

With 100k+ pages, a percentage will inevitably underperform. Google's "Helpful Content System" evaluates site-wide quality. A large volume of thin, unhelpful, or duplicate pages drags down the entire domain's rankings.

### The Pruning Decision Framework

```
                    ┌──────────────────┐
                    │   Evaluate Page   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Has organic      │
                    │  traffic > 10/mo? │
                    └────────┬─────────┘
                        Yes  │  No
                    ┌────────┘  └────────┐
                    ▼                    ▼
              ┌──────────┐      ┌──────────────┐
              │  KEEP &  │      │  Has backlinks│
              │  OPTIMIZE│      │  or rankings? │
              └──────────┘      └──────┬───────┘
                                  Yes  │  No
                              ┌────────┘  └────────┐
                              ▼                    ▼
                        ┌──────────┐      ┌──────────────┐
                        │ REFRESH &│      │ Word count    │
                        │ MONITOR  │      │ > 300 unique? │
                        └──────────┘      └──────┬───────┘
                                            Yes  │  No
                                        ┌────────┘  └────────┐
                                        ▼                    ▼
                                  ┌──────────┐      ┌──────────────┐
                                  │ CONSOLIDATE│    │   REMOVE &   │
                                  │ into parent│    │   301 REDIRECT│
                                  └──────────┘      └──────────────┘
```

### Automated Pruning Analysis

```typescript
// /src/jobs/content-pruning-analysis.ts
import { Payload } from "payload";

interface PruningRecommendation {
  pageId: string;
  url: string;
  action: "keep" | "refresh" | "consolidate" | "remove";
  reason: string;
  targetRedirect?: string; // For removed pages
  metrics: {
    organicTraffic30d: number;
    backlinks: number;
    wordCount: number;
    avgPosition: number | null;
    impressions30d: number;
    contentAge: number; // days since last meaningful update
  };
}

export async function analyzePagesForPruning(
  payload: Payload,
  gscClient: GoogleSearchConsoleClient,
  ahrefsClient: AhrefsClient
): Promise<PruningRecommendation[]> {
  const recommendations: PruningRecommendation[] = [];
  const batchSize = 500;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pages = await payload.find({
      collection: "location-pages",
      limit: batchSize,
      page,
    });

    // PERFORMANCE NOTE: The per-page API calls below (gscClient.getPagePerformance
    // and ahrefsClient.getBacklinks) result in N×2 individual API calls per page,
    // which is extremely slow and may hit rate limits for large sites.
    //
    // Recommended: Use the bulk GSC Search Analytics API with dimensions: ["page"]
    // to fetch all page performance data in a single request, then build a local
    // lookup map before the loop:
    //
    //   const gscBulkData = await gscClient.searchAnalytics.query({
    //     siteUrl: "sc-domain:example.com",
    //     requestBody: {
    //       startDate: thirtyDaysAgo,
    //       endDate: today,
    //       dimensions: ["page"],
    //       rowLimit: 25000,
    //     },
    //   });
    //   const gscDataMap = new Map(
    //     gscBulkData.rows?.map((row) => [row.keys![0], row]) || []
    //   );
    //
    // Then inside the loop: const gscData = gscDataMap.get(locationPage.fullUrl);
    // Same approach applies for backlink data if the API supports bulk queries.

    for (const locationPage of pages.docs) {
      // Fetch performance data from GSC
      const gscData = await gscClient.getPagePerformance(
        locationPage.fullUrl,
        30 // last 30 days
      );

      // Fetch backlink data
      const backlinkData = await ahrefsClient.getBacklinks(
        locationPage.fullUrl
      );

      const metrics = {
        organicTraffic30d: gscData?.clicks || 0,
        backlinks: backlinkData?.total || 0,
        wordCount: countWords(locationPage.bodyContent),
        avgPosition: gscData?.avgPosition || null,
        impressions30d: gscData?.impressions || 0,
        contentAge: daysSince(locationPage.contentLastModified),
      };

      let action: PruningRecommendation["action"];
      let reason: string;
      let targetRedirect: string | undefined;

      if (metrics.organicTraffic30d >= 10) {
        action = "keep";
        reason = "Generating organic traffic";
      } else if (metrics.backlinks > 0 || (metrics.avgPosition && metrics.avgPosition <= 50)) {
        action = "refresh";
        reason = `Has ${metrics.backlinks} backlinks and/or ranking position ${metrics.avgPosition}. Worth refreshing.`;
      } else if (metrics.wordCount >= 300) {
        action = "consolidate";
        reason = `Low traffic, no backlinks, but has ${metrics.wordCount} words of content. Consolidate into parent service page.`;
        // Find the parent service page to consolidate into
        targetRedirect = await findParentServicePage(payload, locationPage);
      } else {
        action = "remove";
        reason = `Thin content (${metrics.wordCount} words), no traffic, no backlinks. Remove and redirect.`;
        targetRedirect = await findParentServicePage(payload, locationPage);
      }

      recommendations.push({
        pageId: locationPage.id,
        url: locationPage.fullUrl,
        action,
        reason,
        targetRedirect,
        metrics,
      });
    }

    hasMore = pages.hasNextPage;
    page++;
  }

  return recommendations;
}

async function findParentServicePage(
  payload: Payload,
  locationPage: any
): Promise<string> {
  // Find the state-level or service-level parent page
  const parent = await payload.find({
    collection: "service-pages",
    where: {
      serviceType: { equals: locationPage.serviceType },
    },
    limit: 1,
  });

  return parent.docs[0]?.fullUrl || "/";
}

function countWords(html: string): number {
  const text = html?.replace(/<[^>]*>/g, " ") || "";
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}
```

### Executing Pruning Decisions

```typescript
// /src/jobs/execute-pruning.ts

export async function executePruning(
  payload: Payload,
  recommendations: PruningRecommendation[]
): Promise<void> {
  const removals = recommendations.filter((r) => r.action === "remove");
  const consolidations = recommendations.filter((r) => r.action === "consolidate");

  // 1. Create 301 redirects for removed pages
  for (const removal of removals) {
    await payload.create({
      collection: "redirects",
      data: {
        from: new URL(removal.url).pathname,
        to: removal.targetRedirect || "/",
        type: "301",
        reason: removal.reason,
        createdBy: "automated-pruning",
        originalPageId: removal.pageId,
      },
    });

    // Mark page as pruned (soft delete — never hard delete for audit trail)
    await payload.update({
      collection: "location-pages",
      id: removal.pageId,
      data: {
        status: "pruned",
        prunedAt: new Date().toISOString(),
        pruneReason: removal.reason,
        redirectTarget: removal.targetRedirect,
      },
    });
  }

  // 2. For consolidations, merge content into parent before redirecting
  for (const consolidation of consolidations) {
    const page = await payload.findByID({
      collection: "location-pages",
      id: consolidation.pageId,
    });

    // Append unique content to the parent page as a section
    if (consolidation.targetRedirect) {
      const parentPage = await payload.find({
        collection: "service-pages",
        where: { fullUrl: { equals: consolidation.targetRedirect } },
        limit: 1,
      });

      if (parentPage.docs[0]) {
        const existingContent = parentPage.docs[0].bodyContent || "";
        const locationSection = `\n\n<h3>${page.city}, ${page.stateCode}</h3>\n${page.bodyContent}`;

        await payload.update({
          collection: "service-pages",
          id: parentPage.docs[0].id,
          data: {
            bodyContent: existingContent + locationSection,
            contentLastModified: new Date().toISOString(),
          },
        });
      }
    }

    // Create redirect and mark as pruned
    await payload.create({
      collection: "redirects",
      data: {
        from: new URL(consolidation.url).pathname,
        to: consolidation.targetRedirect || "/",
        type: "301",
        reason: consolidation.reason,
        createdBy: "automated-pruning",
      },
    });

    await payload.update({
      collection: "location-pages",
      id: consolidation.pageId,
      data: {
        status: "consolidated",
        prunedAt: new Date().toISOString(),
        pruneReason: consolidation.reason,
        redirectTarget: consolidation.targetRedirect,
      },
    });
  }
}
```

---

## 10. Re-Crawl Requests — Google Search Console & IndexNow

### Google Search Console URL Inspection API

Use the GSC API to request re-indexing of updated pages. There are daily quotas (typically 200 URL inspections per day per property, and re-index requests are more limited), so prioritize strategically.

```typescript
// /src/integrations/google-search-console.ts
import { google } from "googleapis";

interface IndexingRequest {
  url: string;
  type: "URL_UPDATED" | "URL_DELETED";
}

export class GSCIndexingClient {
  private indexing;
  private readonly DAILY_LIMIT = 200;

  // WARNING: dailyRequestCount resets to 0 on every process restart.
  // In production, this MUST be persisted in a database or Redis to
  // survive restarts and be shared across multiple instances.
  //
  // Example with Redis:
  //   private async getDailyRequestCount(): Promise<number> {
  //     const key = `gsc:daily_count:${new Date().toISOString().slice(0, 10)}`;
  //     return parseInt(await redis.get(key) || "0", 10);
  //   }
  //   private async incrementDailyRequestCount(): Promise<void> {
  //     const key = `gsc:daily_count:${new Date().toISOString().slice(0, 10)}`;
  //     await redis.incr(key);
  //     await redis.expire(key, 86400); // TTL: 24 hours
  //   }
  private dailyRequestCount = 0;

  constructor(private auth: any) {
    this.indexing = google.indexing({ version: "v3", auth });
  }

  /**
   * Request re-indexing for a batch of URLs.
   *
   * IMPORTANT: The Indexing API is officially restricted to JobPosting and
   * BroadcastEvent schema types only. For all other page types, fall back
   * to sitemap-based signaling + IndexNow. Using the Indexing API for
   * unsupported types may result in quota errors or silent failures.
   *
   * For pages not eligible for the Indexing API, fall back to
   * sitemap-based signaling + IndexNow.
   */
  async requestIndexing(urls: string[]): Promise<{
    submitted: string[];
    skipped: string[];
    errors: Array<{ url: string; error: string }>;
  }> {
    const submitted: string[] = [];
    const skipped: string[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (const url of urls) {
      if (this.dailyRequestCount >= this.DAILY_LIMIT) {
        skipped.push(url);
        continue;
      }

      try {
        await this.indexing.urlNotifications.publish({
          requestBody: {
            url,
            type: "URL_UPDATED",
          },
        });
        submitted.push(url);
        this.dailyRequestCount++;
      } catch (error: any) {
        errors.push({
          url,
          error: error.message || "Unknown error",
        });
      }

      // Rate limiting: 1 request per second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return { submitted, skipped, errors };
  }
}
```

### IndexNow Protocol Implementation

IndexNow is supported by Bing, Yandex, Seznam, and Naver. While Google does not officially support IndexNow as of 2026, implementing it covers the other major search engines and may be adopted by Google in the future.

```typescript
// /src/integrations/indexnow.ts

export class IndexNowClient {
  private readonly endpoint = "https://api.indexnow.org/indexnow";
  private readonly host: string;
  private readonly key: string;
  private readonly keyLocation: string;

  constructor(config: { host: string; key: string }) {
    this.host = config.host;
    this.key = config.key;
    this.keyLocation = `https://${config.host}/${config.key}.txt`;
  }

  /**
   * Submit up to 10,000 URLs per request to IndexNow.
   * IndexNow supports batch submissions, making it ideal for
   * large-scale programmatic sites.
   */
  async submitUrls(urls: string[]): Promise<{ success: boolean; statusCode: number }> {
    // IndexNow allows up to 10,000 URLs per batch
    const batchSize = 10000;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: this.host,
          key: this.key,
          keyLocation: this.keyLocation,
          urlList: batch,
        }),
      });

      if (response.status !== 200 && response.status !== 202) {
        console.error(
          `IndexNow submission failed: ${response.status} ${response.statusText}`
        );
        return { success: false, statusCode: response.status };
      }
    }

    return { success: true, statusCode: 200 };
  }
}

// Key file that must be hosted at the root of your domain
// /public/{your-key}.txt — contains only the key string
```

### Orchestrating Re-Crawl Requests After Updates

```typescript
// /src/jobs/notify-search-engines.ts

/**
 * After dynamic data refresh or content updates, notify search engines
 * about changed URLs. Prioritize high-value pages.
 */
export async function notifySearchEnginesOfUpdates(
  payload: Payload,
  gscClient: GSCIndexingClient,
  indexNowClient: IndexNowClient,
  updatedPages: RefreshResult[]
): Promise<void> {
  // Only notify for pages with substantive content changes
  const substantiveUpdates = updatedPages.filter((p) => p.contentChanged);

  if (substantiveUpdates.length === 0) return;

  // Fetch full page data to get URLs and prioritize
  const pageIds = substantiveUpdates.map((p) => p.pageId);
  const pages = await payload.find({
    collection: "location-pages",
    where: { id: { in: pageIds } },
    limit: pageIds.length,
  });

  // Sort by traffic (highest traffic pages get GSC quota)
  const sortedByTraffic = pages.docs.sort(
    (a, b) => (b.organicTraffic30d || 0) - (a.organicTraffic30d || 0)
  );

  // Top 200 pages get GSC indexing requests (daily quota)
  const gscUrls = sortedByTraffic.slice(0, 200).map((p) => p.fullUrl);
  await gscClient.requestIndexing(gscUrls);

  // All pages get IndexNow notification (no meaningful quota limit)
  const allUrls = sortedByTraffic.map((p) => p.fullUrl);
  await indexNowClient.submitUrls(allUrls);

  console.log(
    `Notified search engines: ${gscUrls.length} via GSC, ${allUrls.length} via IndexNow`
  );
}
```

---

## 11. Implementation — Payload CMS Hooks and Scheduled Jobs

### Payload CMS Collection Schema with Freshness Fields

```typescript
// /src/collections/LocationPages.ts
import { CollectionConfig } from "payload/types";

export const LocationPages: CollectionConfig = {
  slug: "location-pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "city", "serviceType", "contentLastModified", "verificationStatus"],
  },
  hooks: {
    beforeChange: [trackContentChanges],
    afterChange: [onContentChange],
  },
  fields: [
    // --- Core content fields ---
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "fullUrl", type: "text", required: true },
    { name: "serviceType", type: "text", required: true },
    { name: "city", type: "text", required: true },
    { name: "stateCode", type: "text", required: true },
    { name: "bodyContent", type: "richText" },
    { name: "metaDescription", type: "text" },

    // --- Location data ---
    { name: "latitude", type: "number" },
    { name: "longitude", type: "number" },
    { name: "climateZone", type: "text" },
    { name: "businessGBPId", type: "text" },
    { name: "businessId", type: "text" },
    { name: "phoneNumber", type: "text" },

    // --- Dynamic data fields (auto-refreshed) ---
    {
      name: "dynamicData",
      type: "group",
      admin: { description: "Auto-refreshed by scheduled jobs. Do not edit manually." },
      fields: [
        { name: "weatherTemp", type: "number" },
        { name: "weatherCondition", type: "text" },
        { name: "weatherSeasonalTip", type: "textarea" },
        { name: "reviewCount", type: "number" },
        { name: "averageRating", type: "number" },
        { name: "latestReviewSnippet", type: "textarea" },
        { name: "latestReviewDate", type: "date" },
        { name: "averageCost", type: "number" },
        { name: "costRangeLow", type: "number" },
        { name: "costRangeHigh", type: "number" },
        { name: "costLastVerified", type: "date" },
      ],
    },

    // --- Freshness tracking fields ---
    {
      name: "freshness",
      type: "group",
      fields: [
        {
          name: "contentLastModified",
          type: "date",
          admin: { description: "Updated only when substantive content changes occur" },
        },
        {
          name: "dynamicDataLastRefreshed",
          type: "date",
          admin: { description: "Updated whenever any dynamic data field changes" },
        },
        {
          name: "lastVerifiedAt",
          type: "date",
          admin: { description: "When page data was last verified for accuracy" },
        },
        {
          name: "verificationStatus",
          type: "select",
          options: [
            { label: "Verified", value: "verified" },
            { label: "Needs Review", value: "needs_review" },
            { label: "Unverified", value: "unverified" },
          ],
          defaultValue: "unverified",
        },
        {
          name: "verificationIssues",
          type: "json",
        },
        {
          name: "contentChangeHistory",
          type: "array",
          maxRows: 20, // Keep last 20 changes
          fields: [
            { name: "changedAt", type: "date" },
            { name: "changeType", type: "text" }, // "manual", "dynamic", "seasonal", "blog-link"
            { name: "fieldsChanged", type: "json" },
          ],
        },
      ],
    },

    // --- Blog cross-links ---
    {
      name: "recentBlogPosts",
      type: "array",
      maxRows: 5,
      fields: [
        { name: "blogPost", type: "relationship", relationTo: "blog-posts" },
        { name: "addedAt", type: "date" },
      ],
    },

    // --- Testimonials ---
    {
      name: "allTestimonials",
      type: "relationship",
      relationTo: "testimonials",
      hasMany: true,
    },

    // --- Pruning/status fields ---
    {
      name: "status",
      type: "select",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Pruned", value: "pruned" },
        { label: "Consolidated", value: "consolidated" },
      ],
      defaultValue: "published",
    },
    { name: "organicTraffic30d", type: "number", defaultValue: 0 },
    { name: "prunedAt", type: "date" },
    { name: "pruneReason", type: "text" },
    { name: "redirectTarget", type: "text" },
  ],
};
```

### beforeChange Hook — Track Content Changes

```typescript
// /src/hooks/track-content-changes.ts
import { CollectionBeforeChangeHook } from "payload/types";

/**
 * Compares incoming data to existing document to determine
 * if a substantive content change occurred. Only updates
 * contentLastModified when real content changed — never for
 * cosmetic or dynamic-only updates.
 */
export const trackContentChanges: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
}) => {
  if (operation === "create") {
    // New document — set initial freshness timestamps
    data.freshness = {
      ...data.freshness,
      contentLastModified: new Date().toISOString(),
      dynamicDataLastRefreshed: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      verificationStatus: "verified",
    };
    return data;
  }

  if (operation !== "update" || !originalDoc) return data;

  // Fields that constitute a "substantive" content change
  const substantiveFields = [
    "title",
    "bodyContent",
    "metaDescription",
    "serviceType",
  ];

  let hasSubstantiveChange = false;

  for (const field of substantiveFields) {
    if (data[field] !== undefined && data[field] !== originalDoc[field]) {
      // For richText, do a deeper comparison
      if (field === "bodyContent") {
        const oldText = extractTextFromRichText(originalDoc[field]);
        const newText = extractTextFromRichText(data[field]);
        if (oldText !== newText) {
          hasSubstantiveChange = true;
          break;
        }
      } else {
        hasSubstantiveChange = true;
        break;
      }
    }
  }

  if (hasSubstantiveChange) {
    const freshness = data.freshness || originalDoc.freshness || {};
    const history = freshness.contentChangeHistory || [];

    data.freshness = {
      ...freshness,
      contentLastModified: new Date().toISOString(),
      contentChangeHistory: [
        {
          changedAt: new Date().toISOString(),
          changeType: "manual",
          fieldsChanged: substantiveFields.filter(
            (f) => data[f] !== undefined && data[f] !== originalDoc[f]
          ),
        },
        ...history.slice(0, 19), // Keep last 20
      ],
    };
  }

  return data;
};

function extractTextFromRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;

  // Handle Payload's Lexical/Slate rich text format
  const extractText = (node: any): string => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (node.text) return node.text;
    if (node.children) {
      return node.children.map(extractText).join(" ");
    }
    return "";
  };

  if (Array.isArray(richText)) {
    return richText.map(extractText).join(" ");
  }

  return extractText(richText);
}
```

### afterChange Hook — Trigger Search Engine Notifications

```typescript
// /src/hooks/on-content-change.ts
import { CollectionAfterChangeHook } from "payload/types";

/**
 * After a substantive content change, queue the page for
 * search engine notification. Uses a queue to batch notifications
 * rather than making API calls inline.
 */
export const onContentChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== "update") return doc;

  const contentModifiedChanged =
    doc.freshness?.contentLastModified !==
    previousDoc?.freshness?.contentLastModified;

  if (contentModifiedChanged && doc.status === "published") {
    // Add to notification queue (processed by scheduled job)
    await req.payload.create({
      collection: "indexing-queue",
      data: {
        url: doc.fullUrl,
        pageId: doc.id,
        collection: "location-pages",
        changeType: "content_updated",
        queuedAt: new Date().toISOString(),
        status: "pending",
      },
    });
  }

  return doc;
};
```

### Scheduled Jobs — Cron Configuration

```typescript
// /src/jobs/scheduler.ts
import cron from "node-cron";
import { getPayload } from "payload";
import { refreshDynamicData } from "./dynamic-data-refresh";
import { verifyPageData } from "./verify-page-data";
import { analyzePagesForPruning } from "./content-pruning-analysis";
import { processIndexingQueue } from "./process-indexing-queue";
import { syncGSCPerformanceData } from "./sync-gsc-data";
import { runSeasonalContentSwitch } from "./seasonal-content-switch";

export function initializeScheduledJobs(): void {
  // Dynamic data refresh — runs every 6 hours
  // Refreshes weather, reviews, pricing for pages not updated in 24h
  cron.schedule("0 */6 * * *", async () => {
    console.log("[CRON] Starting dynamic data refresh...");
    const payload = await getPayload({ config: payloadConfig });
    const results = await refreshDynamicData(payload);
    console.log(
      `[CRON] Dynamic data refresh complete. ${results.length} pages updated.`
    );
  });

  // Page data verification — runs daily at 2 AM
  // Checks phone numbers, service areas, pricing accuracy
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting page data verification...");
    const payload = await getPayload({ config: payloadConfig });
    await verifyPageData(payload);
    console.log("[CRON] Page data verification complete.");
  });

  // Process indexing queue — runs every 30 minutes
  // Batches up changed URLs and sends to GSC + IndexNow
  cron.schedule("*/30 * * * *", async () => {
    const payload = await getPayload({ config: payloadConfig });
    await processIndexingQueue(payload, gscClient, indexNowClient);
  });

  // Sync GSC performance data — runs daily at 4 AM
  // Pulls click/impression data for pruning analysis
  cron.schedule("0 4 * * *", async () => {
    const payload = await getPayload({ config: payloadConfig });
    await syncGSCPerformanceData(payload);
  });

  // Content pruning analysis — runs weekly on Sunday at 3 AM
  cron.schedule("0 3 * * 0", async () => {
    console.log("[CRON] Starting weekly content pruning analysis...");
    const payload = await getPayload({ config: payloadConfig });
    const recommendations = await analyzePagesForPruning(payload, gscClient, ahrefsClient);

    // Store recommendations for admin review
    await payload.create({
      collection: "pruning-reports",
      data: {
        runDate: new Date().toISOString(),
        totalAnalyzed: recommendations.length,
        keepCount: recommendations.filter((r) => r.action === "keep").length,
        refreshCount: recommendations.filter((r) => r.action === "refresh").length,
        consolidateCount: recommendations.filter((r) => r.action === "consolidate").length,
        removeCount: recommendations.filter((r) => r.action === "remove").length,
        recommendations: JSON.stringify(recommendations),
      },
    });

    console.log("[CRON] Pruning analysis complete. Report saved.");
  });

  // Seasonal content switch — runs on the 1st of each month at midnight
  cron.schedule("0 0 1 * *", async () => {
    console.log("[CRON] Checking for seasonal content switches...");
    const payload = await getPayload({ config: payloadConfig });
    await runSeasonalContentSwitch(payload);
  });
}
```

### Indexing Queue Processor

```typescript
// /src/jobs/process-indexing-queue.ts
import { Payload } from "payload";

export async function processIndexingQueue(
  payload: Payload,
  gscClient: GSCIndexingClient,
  indexNowClient: IndexNowClient
): Promise<void> {
  // Fetch pending items from the queue
  const queue = await payload.find({
    collection: "indexing-queue",
    where: {
      status: { equals: "pending" },
    },
    limit: 500,
    sort: "queuedAt",
  });

  if (queue.docs.length === 0) return;

  const urls = queue.docs.map((item) => item.url);

  // Track which URLs succeeded so we only mark those items as processed
  const indexNowSucceededUrls = new Set<string>();
  const gscSucceededUrls = new Set<string>();

  // Submit to IndexNow in batches (batch-friendly, no strict quota)
  const indexNowBatchSize = 10000;
  for (let i = 0; i < urls.length; i += indexNowBatchSize) {
    const batch = urls.slice(i, i + indexNowBatchSize);
    try {
      const indexNowResult = await indexNowClient.submitUrls(batch);
      if (indexNowResult.success) {
        batch.forEach((url) => indexNowSucceededUrls.add(url));
      }
      console.log(`IndexNow batch ${i / indexNowBatchSize}: ${indexNowResult.success ? "success" : "failed"}`);
    } catch (e) {
      console.error(`IndexNow batch ${i / indexNowBatchSize} error:`, e);
      // URLs in this batch are NOT marked as processed — they will be retried
    }
  }

  // Submit top URLs to GSC Indexing API (quota-limited)
  // Sort by page priority — higher traffic pages first
  const highPriorityUrls = urls.slice(0, 200);
  try {
    const gscResult = await gscClient.requestIndexing(highPriorityUrls);
    gscResult.submitted.forEach((url) => gscSucceededUrls.add(url));
    console.log(
      `GSC indexing: ${gscResult.submitted.length} submitted, ` +
      `${gscResult.skipped.length} skipped (quota), ` +
      `${gscResult.errors.length} errors`
    );
  } catch (e) {
    console.error("GSC indexing error:", e);
  }

  // Only mark queue items as processed if their URL was successfully submitted
  // to at least one search engine. Failed items remain "pending" for retry.
  for (const item of queue.docs) {
    const succeeded = indexNowSucceededUrls.has(item.url) || gscSucceededUrls.has(item.url);
    if (succeeded) {
      await payload.update({
        collection: "indexing-queue",
        id: item.id,
        data: {
          status: "processed",
          processedAt: new Date().toISOString(),
        },
      });
    }
  }
}
```

---

## 12. Monitoring — Tracking Content Age and Prioritizing Refreshes

### Content Freshness Dashboard Data

```typescript
// /src/api/freshness-dashboard.ts
import { Payload } from "payload";

interface FreshnessDashboard {
  overview: {
    totalPages: number;
    freshPages: number;        // Updated within 30 days
    stalePages: number;        // Updated 30-90 days ago
    criticalPages: number;     // Not updated in 90+ days
    averageContentAge: number; // Days
  };
  byServiceType: Array<{
    serviceType: string;
    totalPages: number;
    avgContentAge: number;
    oldestPage: { url: string; lastModified: string; ageDays: number };
  }>;
  byStatus: {
    verified: number;
    needsReview: number;
    unverified: number;
  };
  recentUpdates: Array<{
    url: string;
    updatedAt: string;
    changeType: string;
  }>;
  pruningOverview: {
    lastRunDate: string;
    pagesRecommendedForRemoval: number;
    pagesRecommendedForConsolidation: number;
    pagesRecommendedForRefresh: number;
  };
}

export async function generateFreshnessDashboard(
  payload: Payload
): Promise<FreshnessDashboard> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Count pages by freshness tier
  const [totalResult, freshResult, staleResult, criticalResult] =
    await Promise.all([
      payload.find({
        collection: "location-pages",
        where: { status: { equals: "published" } },
        limit: 0,
      }),
      payload.find({
        collection: "location-pages",
        where: {
          and: [
            { status: { equals: "published" } },
            {
              "freshness.contentLastModified": {
                greater_than: thirtyDaysAgo.toISOString(),
              },
            },
          ],
        },
        limit: 0,
      }),
      payload.find({
        collection: "location-pages",
        where: {
          and: [
            { status: { equals: "published" } },
            {
              "freshness.contentLastModified": {
                less_than: thirtyDaysAgo.toISOString(),
              },
            },
            {
              "freshness.contentLastModified": {
                greater_than: ninetyDaysAgo.toISOString(),
              },
            },
          ],
        },
        limit: 0,
      }),
      payload.find({
        collection: "location-pages",
        where: {
          and: [
            { status: { equals: "published" } },
            {
              "freshness.contentLastModified": {
                less_than: ninetyDaysAgo.toISOString(),
              },
            },
          ],
        },
        limit: 0,
      }),
    ]);

  // Verification status counts
  const [verifiedCount, needsReviewCount, unverifiedCount] = await Promise.all([
    payload.find({
      collection: "location-pages",
      where: { "freshness.verificationStatus": { equals: "verified" } },
      limit: 0,
    }),
    payload.find({
      collection: "location-pages",
      where: { "freshness.verificationStatus": { equals: "needs_review" } },
      limit: 0,
    }),
    payload.find({
      collection: "location-pages",
      where: { "freshness.verificationStatus": { equals: "unverified" } },
      limit: 0,
    }),
  ]);

  // Most recent updates
  const recentUpdates = await payload.find({
    collection: "location-pages",
    where: { status: { equals: "published" } },
    sort: "-freshness.contentLastModified",
    limit: 20,
  });

  // Latest pruning report
  const latestPruningReport = await payload.find({
    collection: "pruning-reports",
    sort: "-runDate",
    limit: 1,
  });

  return {
    overview: {
      totalPages: totalResult.totalDocs,
      freshPages: freshResult.totalDocs,
      stalePages: staleResult.totalDocs,
      criticalPages: criticalResult.totalDocs,
      // TODO: averageContentAge requires a raw SQL aggregation query because
      // Payload CMS does not support AVG/date-diff aggregations natively.
      // Use a raw query like:
      //
      //   SELECT AVG(
      //     EXTRACT(EPOCH FROM (NOW() - ("freshness"->>'contentLastModified')::timestamp))
      //     / 86400
      //   ) AS avg_content_age_days
      //   FROM location_pages
      //   WHERE status = 'published'
      //     AND "freshness"->>'contentLastModified' IS NOT NULL;
      //
      // Execute via: const result = await payload.db.drizzle.execute(sql`...`);
      averageContentAge: 0,
    },
    byServiceType: [], // Aggregate by serviceType
    byStatus: {
      verified: verifiedCount.totalDocs,
      needsReview: needsReviewCount.totalDocs,
      unverified: unverifiedCount.totalDocs,
    },
    recentUpdates: recentUpdates.docs.map((doc) => ({
      url: doc.fullUrl,
      updatedAt: doc.freshness?.contentLastModified || "",
      changeType:
        doc.freshness?.contentChangeHistory?.[0]?.changeType || "unknown",
    })),
    pruningOverview: latestPruningReport.docs[0]
      ? {
          lastRunDate: latestPruningReport.docs[0].runDate,
          pagesRecommendedForRemoval:
            latestPruningReport.docs[0].removeCount || 0,
          pagesRecommendedForConsolidation:
            latestPruningReport.docs[0].consolidateCount || 0,
          pagesRecommendedForRefresh:
            latestPruningReport.docs[0].refreshCount || 0,
        }
      : {
          lastRunDate: "never",
          pagesRecommendedForRemoval: 0,
          pagesRecommendedForConsolidation: 0,
          pagesRecommendedForRefresh: 0,
        },
  };
}
```

### Freshness Priority Score — Which Pages to Update First

```typescript
// /src/utils/freshness-priority.ts

/**
 * Calculates a priority score (0-100) for each page, determining
 * which pages should be refreshed first. Higher score = higher priority.
 */
export function calculateFreshnessPriority(page: LocationPage): number {
  let score = 0;

  // Factor 1: Content age (0-30 points)
  // Older content gets higher priority
  const contentAgeDays = daysSince(page.freshness.contentLastModified);
  if (contentAgeDays > 180) score += 30;
  else if (contentAgeDays > 90) score += 20;
  else if (contentAgeDays > 60) score += 10;
  else if (contentAgeDays > 30) score += 5;

  // Factor 2: Traffic value (0-25 points)
  // Higher traffic pages are more valuable to keep fresh
  const traffic = page.organicTraffic30d || 0;
  if (traffic > 100) score += 25;
  else if (traffic > 50) score += 20;
  else if (traffic > 20) score += 15;
  else if (traffic > 5) score += 10;
  else if (traffic > 0) score += 5;

  // Factor 3: Verification status (0-15 points)
  if (page.freshness.verificationStatus === "needs_review") score += 15;
  else if (page.freshness.verificationStatus === "unverified") score += 10;

  // Factor 4: Seasonal relevance (0-15 points)
  // Pages for services in their peak season get priority
  const season = getCurrentSeason(page.climateZone || "northern");
  const isHighSeason = checkHighSeason(page.serviceType, season);
  if (isHighSeason) score += 15;

  // Factor 5: Competitive pressure (0-15 points)
  // Pages ranking on page 2 (positions 11-20) benefit most from updates
  const avgPosition = page.avgSearchPosition || 100;
  if (avgPosition >= 11 && avgPosition <= 20) score += 15; // "striking distance"
  else if (avgPosition >= 4 && avgPosition <= 10) score += 10;
  else if (avgPosition >= 1 && avgPosition <= 3) score += 5;

  return Math.min(score, 100);
}

function checkHighSeason(serviceType: string, season: string): boolean {
  const highSeasons: Record<string, string[]> = {
    hvac: ["summer", "winter"],
    plumbing: ["winter", "spring"],
    roofing: ["spring", "fall"],
    "pest-control": ["spring", "summer"],
    landscaping: ["spring", "summer"],
    electrical: ["winter"],
  };
  return highSeasons[serviceType]?.includes(season) || false;
}
```

### Alerting on Freshness Degradation

```typescript
// /src/jobs/freshness-alerts.ts

/**
 * Runs daily to check for freshness issues and alert the team.
 */
export async function checkFreshnessAlerts(payload: Payload): Promise<void> {
  const dashboard = await generateFreshnessDashboard(payload);
  const alerts: string[] = [];

  // Alert 1: More than 10% of pages are critically stale
  const criticalPct =
    (dashboard.overview.criticalPages / dashboard.overview.totalPages) * 100;
  if (criticalPct > 10) {
    alerts.push(
      `CRITICAL: ${criticalPct.toFixed(1)}% of pages (${dashboard.overview.criticalPages}) ` +
      `have not been updated in 90+ days.`
    );
  }

  // Alert 2: Verification issues found
  if (dashboard.byStatus.needsReview > 50) {
    alerts.push(
      `WARNING: ${dashboard.byStatus.needsReview} pages have verification issues ` +
      `(invalid phone numbers, changed service areas, or outdated pricing).`
    );
  }

  // Alert 3: Dynamic data refresh is falling behind
  const staleDataPages = await payload.find({
    collection: "location-pages",
    where: {
      "freshness.dynamicDataLastRefreshed": {
        less_than: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    },
    limit: 0,
  });

  if (staleDataPages.totalDocs > 1000) {
    alerts.push(
      `WARNING: ${staleDataPages.totalDocs} pages have not had dynamic data ` +
      `refreshed in 48+ hours. Check the refresh cron job.`
    );
  }

  // Alert 4: Pruning recommendations pending
  if (
    dashboard.pruningOverview.pagesRecommendedForRemoval > 100 ||
    dashboard.pruningOverview.pagesRecommendedForConsolidation > 200
  ) {
    alerts.push(
      `ACTION NEEDED: ${dashboard.pruningOverview.pagesRecommendedForRemoval} pages ` +
      `recommended for removal, ${dashboard.pruningOverview.pagesRecommendedForConsolidation} ` +
      `for consolidation. Review the latest pruning report.`
    );
  }

  if (alerts.length > 0) {
    // Send via your preferred notification channel
    await sendSlackNotification({
      channel: "#seo-alerts",
      text: `Content Freshness Alert\n\n${alerts.join("\n\n")}`,
    });

    // Also store in Payload for dashboard visibility
    await payload.create({
      collection: "system-alerts",
      data: {
        type: "freshness",
        alerts,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      },
    });
  }
}
```

---

## Summary: Complete Freshness System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT FRESHNESS SYSTEM                  │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Scheduled   │  │  Payload CMS │  │  Search Engine    │  │
│  │  Cron Jobs   │  │  Hooks       │  │  Notification     │  │
│  │              │  │              │  │                   │  │
│  │ Every 6h:    │  │ beforeChange:│  │ IndexNow (batch)  │  │
│  │  Dynamic     │──│  Track       │──│ GSC Indexing API  │  │
│  │  data refresh│  │  changes     │  │ Sitemap lastmod   │  │
│  │              │  │              │  │                   │  │
│  │ Daily:       │  │ afterChange: │  └───────────────────┘  │
│  │  Verify data │  │  Queue for   │                         │
│  │  Sync GSC    │  │  indexing    │  ┌───────────────────┐  │
│  │              │  │              │  │  Monitoring &     │  │
│  │ Weekly:      │  └──────────────┘  │  Alerting         │  │
│  │  Pruning     │                    │                   │  │
│  │  analysis    │  ┌──────────────┐  │ Freshness dash    │  │
│  │              │  │  Seasonal    │  │ Priority scoring  │  │
│  │ Monthly:     │  │  Content     │  │ Slack alerts      │  │
│  │  Season      │──│  Engine      │  │ Pruning reports   │  │
│  │  switch      │  │              │  │                   │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                                                              │
│  DATA SOURCES:                                               │
│  Weather API │ Reviews API │ BLS Pricing │ GSC │ Ahrefs     │
└─────────────────────────────────────────────────────────────┘
```

### Key Implementation Rules

1. **Never fake freshness.** Only update `contentLastModified` and sitemap `lastmod` when content actually changes. Google penalizes unreliable timestamps.
2. **Separate dynamic from static.** Keep the page template stable; let data layers provide natural freshness through reviews, pricing, weather, and seasonal content.
3. **Prioritize by impact.** Use the freshness priority score to focus limited resources (GSC quota, manual review time) on pages that will benefit most.
4. **Prune relentlessly.** At 100k+ pages, a 5% tail of thin/unhelpful pages can drag down domain-wide quality scores. Run pruning analysis weekly and act on recommendations monthly.
5. **Monitor the system.** Freshness infrastructure can silently break (API keys expire, cron jobs fail, data sources change formats). Alerting prevents silent degradation.
6. **Batch everything.** Never make individual API calls for 100k pages. Batch database queries (500–1000 per batch), batch IndexNow submissions (up to 10k URLs), and batch GSC requests within daily quotas.
