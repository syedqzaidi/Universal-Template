# Local SEO & Google Business Profile — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers Local SEO strategy, Google Business Profile optimization, NAP consistency, citations, review management, and Schema.org LocalBusiness markup for service-area businesses.

## 1. Google Business Profile Optimization for Service-Area Businesses (2026)

### Overview

Google Business Profile remains the single most important local ranking factor in 2026. For service-area businesses (SABs) — plumbing, HVAC, electrical, and similar trades — GBP operates differently than for storefront businesses. SABs hide their physical address and instead define service areas by city, county, or radius.

### GBP Profile Completeness Checklist

| Field | Guidance | Priority |
|---|---|---|
| **Business Name** | Exact legal name. No keyword stuffing (e.g., "Apex Plumbing" not "Apex Plumbing - Best Plumber in Dallas TX") | Critical |
| **Primary Category** | Most specific category available (e.g., "Plumber" not "Home Services") | Critical |
| **Secondary Categories** | Add all genuinely relevant categories (up to 9 additional). E.g., "Water Heater Installation Service", "Drain Cleaning Service" | High |
| **Service Areas** | Up to 20 service areas. Use cities/municipalities, not zip codes. Google recommends a ~2-hour drive radius max | Critical |
| **Phone Number** | Local number preferred over toll-free. Must match website and citations exactly | Critical |
| **Website URL** | Link to the homepage or a dedicated landing page per location | Critical |
| **Business Description** | 750 characters max. Front-load primary services and primary city. Natural language, not keyword lists | High |
| **Services / Menu** | Add every service with descriptions and optional prices. Google uses these for keyword matching | High |
| **Attributes** | All applicable (veteran-owned, women-owned, licensed, insured, languages spoken, payment methods, etc.) | Medium |
| **Business Hours** | Accurate hours. Use "Open 24 hours" or special hours for holidays. SABs should still set hours (indicates when you take calls) | High |
| **Photos & Videos** | Minimum 10 photos at setup. Add 1–3 per week ongoing. Show trucks, team, completed jobs, before/after. Geotagged when possible | High |
| **Products** | Use the Products section to showcase specific services with images, descriptions, and CTAs | Medium |
| **Q&A** | Pre-seed 10–15 common questions with answers. Monitor and respond to all user questions | Medium |
| **GBP Posts** | Weekly minimum. Types: Update, Offer, Event. Include CTA buttons | High |
| **Messaging** | Enable if client can respond within minutes. Otherwise disable to avoid penalty signals | Low |

### 2026-Specific Ranking Considerations

- **AI Overview Integration**: Google's AI Overviews now pull from GBP data, reviews, and structured website content. Complete GBP profiles with rich service descriptions are more likely to be referenced in AI-generated answers.
- **Review Velocity & Sentiment**: Google's review analysis has become significantly more sophisticated. Keyword-rich reviews mentioning specific services and locations carry more weight. Response quality (not just response rate) is now a confirmed factor.
- **GBP Performance Metrics**: Google tracks call-to-action engagement (calls, direction requests, website clicks, booking actions). Higher engagement rates correlate with improved rankings.
- **Photo AI Analysis**: Google now uses vision models to analyze photos for relevance, quality, and content. Stock photos are deprioritized. Authentic job-site photos with visible branding rank better.
- **Service Area Precision**: Google has tightened service-area relevance. Businesses that demonstrate actual service delivery in claimed areas (through reviews mentioning those cities, localized content, and check-in signals) rank better than those that simply list areas.

---

## 2. NAP Consistency — Why It Matters and How to Maintain It

### What NAP Consistency Means

NAP stands for **Name, Address, Phone number**. Every mention of your business across the web — directories, social profiles, your own website, data aggregators — must use the **exact same formatting**.

### Why It Matters

Google cross-references business information across hundreds of sources. Inconsistencies create ambiguity and erode trust signals:

- Inconsistent NAP reduces Google's confidence in your business legitimacy
- It fragments link equity and citation value across multiple perceived "entities"
- It can cause duplicate GBP listings, which dilute rankings
- Data aggregators propagate errors downstream to dozens of directories

### Common Inconsistency Problems

| Problem | Example |
|---|---|
| Name variations | "ABC Plumbing" vs "ABC Plumbing LLC" vs "ABC Plumbing Co." |
| Address format | "123 Main St" vs "123 Main Street" vs "123 Main St." |
| Suite/Unit | "Suite 100" vs "Ste 100" vs "#100" vs omitted entirely |
| Phone format | "(214) 555-1234" vs "214-555-1234" vs "2145551234" |
| Tracking numbers | Using different call tracking numbers on different directories |

### Canonical NAP Standard

Define ONE canonical format and use it everywhere:

```
Business Name: Apex Plumbing Services
Address: 1234 Commerce Dr, Suite 200, Dallas, TX 75201
Phone: (214) 555-1234
Website: https://apexplumbing.com
```

### Payload CMS Implementation — NAP as Single Source of Truth

Create a `business-info` global in Payload that serves as the canonical NAP source for the entire system:

```typescript
// collections/globals/BusinessInfo.ts
import { GlobalConfig } from 'payload/types';

const BusinessInfo: GlobalConfig = {
  slug: 'business-info',
  label: 'Business Information',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'businessName',
      type: 'text',
      required: true,
      admin: {
        description: 'Exact legal business name. Used everywhere — GBP, citations, schema markup, footer.',
      },
    },
    {
      name: 'legalName',
      type: 'text',
      admin: {
        description: 'Full legal name if different (e.g., "Apex Plumbing Services LLC")',
      },
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: {
        description: 'Primary phone in exact format: (XXX) XXX-XXXX',
      },
      validate: (val: string) => {
        if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(val)) {
          return 'Phone must be in format (XXX) XXX-XXXX';
        }
        return true;
      },
    },
    {
      name: 'phoneE164',
      type: 'text',
      admin: {
        description: 'Phone in E.164 format for schema.org (e.g., +12145551234). Auto-derived.',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const digits = siblingData.phone?.replace(/\D/g, '');
            return digits ? `+1${digits}` : undefined;
          },
        ],
      },
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text', required: true },
        { name: 'suite', type: 'text' },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true, maxLength: 2 },
        { name: 'zip', type: 'text', required: true },
      ],
    },
    {
      name: 'hideAddress',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Service-area businesses should hide their address on GBP. Check this to suppress address from public pages while keeping it in schema markup.',
      },
    },
    {
      name: 'website',
      type: 'text',
      required: true,
      admin: {
        description: 'Canonical website URL with https:// and no trailing slash',
      },
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'foundingYear',
      type: 'number',
      admin: {
        description: 'Year the business was founded. Used in schema markup and trust signals.',
      },
    },
    {
      name: 'ownerName',
      type: 'text',
      admin: {
        description: 'Business owner name for schema.org founder field.',
      },
    },
    {
      name: 'licenses',
      type: 'array',
      fields: [
        { name: 'type', type: 'text' },       // e.g., "Master Plumber"
        { name: 'number', type: 'text' },      // License number
        { name: 'state', type: 'text' },       // Issuing state
        { name: 'issuingBody', type: 'text' }, // e.g., "Texas State Board of Plumbing Examiners"
      ],
    },
    {
      name: 'insuranceInfo',
      type: 'group',
      fields: [
        { name: 'generalLiability', type: 'checkbox', defaultValue: true },
        { name: 'workersComp', type: 'checkbox', defaultValue: true },
        { name: 'bonded', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'socialProfiles',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'nextdoor', type: 'text' },
        { name: 'yelp', type: 'text' },
        { name: 'bbb', type: 'text' },
      ],
    },
    {
      name: 'gbpUrl',
      type: 'text',
      admin: {
        description: 'Direct URL to the Google Business Profile listing',
      },
    },
    {
      name: 'gbpCid',
      type: 'text',
      admin: {
        description: 'Google CID (Customer ID) for direct map embed links',
      },
    },
    {
      name: 'gbpPlaceId',
      type: 'text',
      admin: {
        description: 'Google Place ID for API integrations and review links',
      },
    },
    {
      name: 'industryType',
      type: 'select',
      required: true,
      options: [
        { label: 'Plumbing', value: 'plumbing' },
        { label: 'HVAC', value: 'hvac' },
        { label: 'Electrical', value: 'electrical' },
        { label: 'Roofing', value: 'roofing' },
        { label: 'Landscaping', value: 'landscaping' },
        { label: 'Handyman', value: 'handyman' },
        { label: 'Cleaning', value: 'cleaning' },
        { label: 'Pest Control', value: 'pest_control' },
        { label: 'Locksmith', value: 'locksmith' },
        { label: 'Moving', value: 'moving' },
        { label: 'Painting', value: 'painting' },
        { label: 'General Contractor', value: 'general_contractor' },
      ],
      admin: {
        description: 'Primary industry type. Used for schema.org @type mapping and category logic.',
      },
    },
    {
      name: 'industrySlug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly industry prefix used in service-area page routes (e.g., "plumber" for /plumber-in-dallas)',
      },
    },
  ],
};

export default BusinessInfo;
```

### NAP Sync Strategy

```
┌─────────────────────────┐
│   Payload CMS Global    │ ← Single source of truth
│   "business-info"       │
└────────┬────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Astro  │ │ Next.js  │   ← Website renders canonical NAP
│ Footer │ │ API      │     in footer, contact page, schema
└────────┘ └──────────┘
    │
    ▼
┌────────────────────────────┐
│  Schema.org JSON-LD        │ ← Structured data uses same source
│  (every page)              │
└────────────────────────────┘
    │
    ▼
┌────────────────────────────┐
│  Citation Management       │ ← Manual or via aggregator
│  (BrightLocal / Yext)      │   services, always matching
└────────────────────────────┘
```

### Monitoring NAP Consistency

Use these tools/approaches to audit:

1. **BrightLocal Citation Tracker** — scans 80+ directories for inconsistencies
2. **Moz Local** — checks and corrects listings across major aggregators
3. **Manual quarterly audit** — spot-check top 20 directories against canonical NAP
4. **Supabase audit log** — track every change to business-info global, alert if NAP fields change (triggering a citation update workflow)

---

## 3. Multi-Location GBP Management

### The SAB Multi-Location Challenge

A plumbing company based in Dallas that serves 30 surrounding cities does NOT create 30 GBP listings. Google's guidelines are clear:

- **One GBP per physical location** where employees are stationed
- SABs without a staffed location in a city cannot create a GBP for that city
- Violating this leads to suspensions

### Legitimate Multi-Location Strategies

| Scenario | GBP Strategy |
|---|---|
| One office, serves 20 cities | One GBP with 20 service areas listed |
| Two offices in different cities | Two GBPs, each with their own service areas (no overlap) |
| Owner's home + rented office | Two GBPs only if both are staffed during business hours |
| Virtual offices / PO boxes | NOT eligible. Google will suspend these |
| Franchise with physical locations | One GBP per franchisee location |

### Payload CMS — Locations Collection

```typescript
// collections/Locations.ts
import { CollectionConfig } from 'payload/types';

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'isPrimary', 'status'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'e.g., "Dallas Office" or "Fort Worth Branch"' },
    },
    {
      name: 'isPrimary',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Is this the primary / headquarters location?' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Coming Soon', value: 'coming-soon' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    // --- Physical Address (for GBP, not necessarily shown on website for SABs) ---
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text', required: true },
        { name: 'suite', type: 'text' },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true, maxLength: 2 },
        { name: 'zip', type: 'text', required: true },
        {
          name: 'coordinates',
          type: 'group',
          fields: [
            { name: 'lat', type: 'number' },
            { name: 'lng', type: 'number' },
          ],
        },
      ],
    },
    {
      name: 'hideAddress',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Hide physical address on public pages (typical for SABs)',
      },
    },
    // --- Contact ---
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: { description: 'Location-specific phone number in (XXX) XXX-XXXX format' },
    },
    {
      name: 'email',
      type: 'email',
    },
    // --- GBP Integration ---
    {
      name: 'gbp',
      type: 'group',
      label: 'Google Business Profile',
      fields: [
        { name: 'profileUrl', type: 'text' },
        { name: 'placeId', type: 'text' },
        { name: 'cid', type: 'text' },
        {
          name: 'primaryCategory',
          type: 'text',
          admin: { description: 'e.g., "Plumber"' },
        },
        {
          name: 'secondaryCategories',
          type: 'array',
          fields: [{ name: 'category', type: 'text' }],
        },
        {
          name: 'reviewUrl',
          type: 'text',
          admin: {
            description: 'Direct review link. Format: https://search.google.com/local/writereview?placeid=PLACE_ID',
          },
        },
      ],
    },
    // --- Service Areas ---
    {
      name: 'serviceAreas',
      type: 'relationship',
      relationTo: 'service-areas',
      hasMany: true,
      admin: {
        description: 'Cities/areas this location serves. Used for GBP service areas and programmatic page generation.',
      },
    },
    // --- Hours ---
    {
      name: 'hours',
      type: 'group',
      fields: [
        { name: 'is24_7', type: 'checkbox', defaultValue: false },
        {
          name: 'regular',
          type: 'array',
          admin: { condition: (data) => !data?.hours?.is24_7 },
          fields: [
            {
              name: 'day',
              type: 'select',
              options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
            },
            { name: 'open', type: 'text', admin: { description: 'e.g., 07:00' } },
            { name: 'close', type: 'text', admin: { description: 'e.g., 18:00' } },
            { name: 'closed', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
    // --- Landing Page ---
    {
      name: 'landingPageSlug',
      type: 'text',
      admin: {
        description: 'URL slug for this location\'s landing page (e.g., "dallas" → /locations/dallas)',
      },
    },
  ],
};

export default Locations;
```

### Service Areas Collection

```typescript
// collections/ServiceAreas.ts
import { CollectionConfig } from 'payload/types';

const ServiceAreas: CollectionConfig = {
  slug: 'service-areas',
  admin: {
    useAsTitle: 'cityName',
    defaultColumns: ['cityName', 'state', 'county', 'tier'],
  },
  fields: [
    {
      name: 'cityName',
      type: 'text',
      required: true,
    },
    {
      name: 'state',
      type: 'text',
      required: true,
      maxLength: 2,
    },
    {
      name: 'county',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL slug: "fort-worth" → /plumber-in-fort-worth' },
    },
    {
      name: 'tier',
      type: 'select',
      required: true,
      options: [
        { label: 'Tier 1 — Primary (HQ city)', value: 'tier1' },
        { label: 'Tier 2 — High Priority', value: 'tier2' },
        { label: 'Tier 3 — Secondary', value: 'tier3' },
      ],
      admin: {
        description: 'Determines content depth. Tier 1 gets unique content, Tier 3 gets templatized.',
      },
    },
    {
      name: 'population',
      type: 'number',
      admin: { description: 'Approximate population. Used for prioritization.' },
    },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number', required: true },
        { name: 'lng', type: 'number', required: true },
      ],
    },
    {
      name: 'nearbyAreas',
      type: 'relationship',
      relationTo: 'service-areas',
      hasMany: true,
      admin: { description: 'Neighboring cities for internal linking.' },
    },
    {
      name: 'localInfo',
      type: 'group',
      label: 'Local Context',
      admin: { description: 'Local details for unique content generation.' },
      fields: [
        { name: 'knownFor', type: 'textarea' },          // "Historic Stockyards district"
        { name: 'commonIssues', type: 'textarea' },       // "Hard water, cast iron pipes in older homes"
        { name: 'waterSource', type: 'text' },             // "Lake Worth"
        { name: 'averageHomeAge', type: 'text' },          // "1960s–1980s"
        { name: 'climateConsiderations', type: 'textarea' }, // "Freeze risk in January–February"
      ],
    },
    {
      name: 'parentLocation',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'Which physical office location serves this area.' },
    },
    {
      name: 'seoOverrides',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'h1', type: 'text' },
      ],
    },
  ],
};

export default ServiceAreas;
```

---

## 4. CMS Data Connection to GBP Listings

### Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                  PAYLOAD CMS                     │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Services │ │Locations │ │  Testimonials  │   │
│  └────┬─────┘ └────┬─────┘ └──────┬────────┘   │
│       │             │              │             │
│  ┌────┴─────────────┴──────────────┴──────────┐ │
│  │          Payload REST / GraphQL API         │ │
│  └─────────────────┬──────────────────────────┘ │
└────────────────────┼────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        ▼            ▼                ▼
   ┌─────────┐ ┌──────────┐  ┌──────────────┐
   │  Astro  │ │ Next.js  │  │  Supabase    │
   │  SSG    │ │  API /   │  │  (reviews,   │
   │  Pages  │ │  Dynamic │  │   leads,     │
   │         │ │  Routes  │  │   analytics) │
   └────┬────┘ └────┬─────┘  └──────────────┘
        │           │
        ▼           ▼
   ┌─────────────────────┐
   │   Website Output    │
   │   • Schema.org      │ ──── Reinforces GBP data
   │   • City pages      │ ──── Supports local relevance
   │   • Service pages   │ ──── Matches GBP services
   │   • Review widgets  │ ──── Social proof + engagement
   │   • NAP footer      │ ──── Citation consistency
   └─────────────────────┘
```

### How Each CMS Data Type Supports GBP

**Services Collection → GBP Services Section**

The services defined in Payload should mirror (ideally verbatim) the services listed in GBP:

```typescript
// collections/Services.ts — key fields for GBP alignment
{
  name: 'gbpServiceName',
  type: 'text',
  admin: {
    description: 'Exact service name as it appears in GBP. Must match verbatim.',
  },
},
{
  name: 'gbpCategoryAlignment',
  type: 'text',
  admin: {
    description: 'Which GBP category this service falls under (e.g., "Plumber", "Water Heater Installation Service")',
  },
},
```

**Testimonials → GBP Review Response Strategy**

Reviews collected in Payload can inform GBP management:
- Reviews mentioning specific cities → highlight in that city's page → reinforces GBP relevance for that area
- Reviews mentioning specific services → display on that service page → supports topical relevance
- First-party reviews on the website supplement (but do not replace) Google Reviews

**Locations → GBP Profile Accuracy**

Location data in Payload must be the canonical source. Any GBP update should first be reflected in Payload, then pushed to GBP.

---

## 5. Local Pack / Map Pack Ranking Factors (2026)

### Ranking Factor Breakdown

Based on aggregated local SEO research (BrightLocal, Whitespark, Sterling Sky — 2025/2026 studies):

| Factor Category | Weight (approx.) | Key Signals |
|---|---|---|
| **GBP Signals** | 32% | Primary category, categories, completeness, photos, GBP posts, Q&A |
| **On-Page Signals** | 19% | NAP on page, city+service in title tags, localized content, schema markup |
| **Review Signals** | 16% | Review count, velocity, diversity, sentiment, keywords in reviews, owner responses |
| **Link Signals** | 11% | Domain authority, local/relevant inbound links, anchor text diversity |
| **Citation Signals** | 7% | NAP consistency, citation volume, quality of citation sources |
| **Behavioral Signals** | 8% | CTR from SERPs, mobile clicks-to-call, driving directions, dwell time |
| **Personalization** | 7% | Searcher proximity to business, search history, device |

### Proximity — The Unbeatable Factor

For SABs, proximity is complicated. Since you hide your address, Google uses the centroid of your service area or your registered address to calculate distance. This means:

1. **You will rank best near your physical address**, even though it's hidden
2. **In outlying service areas**, you're at a disadvantage against locally-based competitors
3. **Mitigation**: Strong reviews mentioning those distant cities, dedicated city pages with unique content, local citations mentioning those areas

### Actionable Optimization Priorities

1. **GBP completeness** — fill every single field, no exceptions
2. **Review acquisition** — systematic post-job review requests (see Section 9)
3. **On-page local signals** — city+service pages with schema markup
4. **Local link building** — Chamber of Commerce, local sponsorships, supplier links
5. **Content freshness** — regular GBP posts, blog content, seasonal campaigns
6. **Photo/video** — weekly additions of real job photos to GBP

---

## 6. Local Citations

### What Citations Are

A citation is any online mention of your business's NAP (Name, Address, Phone). They can be:
- **Structured**: Full business listing on a directory (Yelp, BBB, Angi)
- **Unstructured**: A mention on a blog, news article, or social post

### Top Citation Sources for Home Services (2026)

#### Tier 1 — Essential (do first)

| Directory | Domain Authority | Notes |
|---|---|---|
| Google Business Profile | 100 | Foundation of local SEO |
| Apple Maps / Apple Business Connect | 98 | Growing importance with iOS market share |
| Bing Places | 95 | Powers Cortana, Edge, Bing Maps |
| Yelp | 93 | Major review platform, often ranks for service queries |
| Facebook Business | 96 | Social signals, local community groups |
| Better Business Bureau (BBB) | 90 | Trust signal, often ranks organically |
| Angi (formerly Angie's List) | 88 | Home services dominant platform |
| HomeAdvisor / Angi Leads | 87 | Lead gen but also citation value |
| Nextdoor | 82 | Hyperlocal community trust |
| Thumbtack | 80 | Growing home services directory |

#### Tier 2 — Important

| Directory | Notes |
|---|---|
| Yellowpages.com | Legacy authority |
| MapQuest | Navigation/maps |
| Superpages | Legacy authority |
| CitySearch | Local directory |
| Manta | Business directory |
| Merchant Circle | Local business network |
| Chamber of Commerce (local) | High local relevance, trusted |
| Local newspaper/media directories | City-specific trust signals |
| Houzz | Design/home improvement |
| Porch | Home services |

#### Tier 3 — Industry-Specific

| Directory | Industry |
|---|---|
| PHCC (Plumbing-Heating-Cooling Contractors Association) | Plumbing, HVAC |
| ACCA (Air Conditioning Contractors of America) | HVAC |
| NECA (National Electrical Contractors Association) | Electrical |
| State licensing board directories | All trades |
| Local trade association directories | All trades |

### Data Aggregators

These four aggregators distribute your NAP to hundreds of downstream directories. Submitting to these is the most efficient way to build citations:

1. **Data Axle (formerly Infogroup)** — powers 100+ directories
2. **Neustar Localeze** — powers GPS systems, directories
3. **Foursquare** — powers Apple Maps, Uber, hundreds of apps
4. **Factual (now part of Foursquare)** — merged but still referenced separately

### Payload CMS — Citation Tracking Collection

```typescript
// collections/Citations.ts
import { CollectionConfig } from 'payload/types';

const Citations: CollectionConfig = {
  slug: 'citations',
  admin: {
    useAsTitle: 'directoryName',
    defaultColumns: ['directoryName', 'status', 'napAccurate', 'lastVerified'],
  },
  fields: [
    { name: 'directoryName', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
    { name: 'tier', type: 'select', options: [
      { label: 'Tier 1', value: 'tier1' },
      { label: 'Tier 2', value: 'tier2' },
      { label: 'Tier 3', value: 'tier3' },
    ]},
    { name: 'status', type: 'select', options: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Needs Update', value: 'needs-update' },
      { label: 'Not Submitted', value: 'not-submitted' },
    ]},
    { name: 'napAccurate', type: 'checkbox', defaultValue: false },
    { name: 'lastVerified', type: 'date' },
    { name: 'loginEmail', type: 'text', admin: { description: 'Account email for this directory' } },
    { name: 'notes', type: 'textarea' },
    { name: 'location', type: 'relationship', relationTo: 'locations' },
  ],
};

export default Citations;
```

---

## 7. Service-Area Business (SAB) vs Storefront GBP Setup

### Key Differences

| Aspect | SAB (e.g., Plumber) | Storefront (e.g., Restaurant) |
|---|---|---|
| **Address visibility** | Hidden from public | Shown on GBP and Maps |
| **Service areas** | Defined (up to 20 cities) | Optional, usually not set |
| **Map pin** | Approximate area, no exact pin visible to public | Exact pin on map |
| **Direction requests** | Not a primary action | Primary action |
| **Ranking radius** | Centered on hidden address | Centered on visible address |
| **Multiple listings** | Only per staffed physical location | Per location |

### SAB-Specific GBP Configuration Steps

1. **During setup**: Select "I deliver goods and services to my customers" → "Yes"
2. **Do NOT enter an address** if you have no customer-facing location. If you have an office customers don't visit, enter it but check "I serve customers at their location" and clear the address display
3. **Define service areas**: List all cities. Use the city name, not zip codes. Be realistic — Google verifies with various signals
4. **Verify**: SABs typically verify via postcard to the hidden address, phone, or video verification

### Website Implementation for SABs

For SABs, the website should NOT prominently display the physical address but should include the service-area information:

```astro
---
// src/components/Footer.astro
const businessInfo = await fetch(`${CMS_URL}/api/globals/business-info`).then(r => r.json());
const serviceAreas = await fetch(`${CMS_URL}/api/service-areas?limit=100&sort=cityName`).then(r => r.json());
---

<footer>
  <div class="business-info">
    <h3>{businessInfo.businessName}</h3>
    <p>
      <a href={`tel:${businessInfo.phoneE164}`}>{businessInfo.phone}</a>
    </p>
    {!businessInfo.hideAddress && (
      <address>
        {businessInfo.address.street}
        {businessInfo.address.suite && `, ${businessInfo.address.suite}`}<br />
        {businessInfo.address.city}, {businessInfo.address.state} {businessInfo.address.zip}
      </address>
    )}
    {businessInfo.hideAddress && (
      <p>Proudly serving {businessInfo.address.city} and surrounding areas</p>
    )}
  </div>

  <div class="service-areas">
    <h4>Service Areas</h4>
    <ul>
      {serviceAreas.docs.map(area => (
        <li>
          <a href={`/${businessInfo.industrySlug}-in-${area.slug}`}>
            {area.cityName}, {area.state}
          </a>
        </li>
      ))}
    </ul>
  </div>
</footer>
```

---

## 8. GBP Categories, Attributes, and Posts

### Categories Strategy

**Primary Category** — This is the single most impactful GBP field. Choose the most specific category that describes the core business:

| Business Type | Recommended Primary | Common Mistake |
|---|---|---|
| Plumbing | Plumber | Home Service Contractor |
| HVAC | HVAC Contractor | Heating Contractor |
| Electrical | Electrician | Electrical Installation Service |
| General Handyman | Handyman | Home Improvement |
| Roofing | Roofing Contractor | Contractor |

**Secondary Categories** — Add all that genuinely apply. Examples for a plumber:

```
Primary:    Plumber
Secondary:  Water Heater Installation Service
            Drain Cleaning Service
            Septic System Service
            Water Purification Company (if offered)
            Gas Installation Service (if offered)
            Bathroom Remodeler (if offered)
            Water Damage Restoration Service (if offered)
```

### Attributes

Google regularly adds new attributes. As of 2026, key ones for home services:

| Attribute Type | Examples |
|---|---|
| **Highlights** | Veteran-owned, Women-owned, Family-owned, LGBTQ+ friendly |
| **Offerings** | Free estimates, Emergency service, Same-day service |
| **Payments** | Credit cards, Checks, Financing available |
| **Accessibility** | (Less applicable to SABs but set if relevant) |
| **Health & Safety** | Licensed, Insured, Bonded, Background-checked |
| **Service Options** | Online estimates, On-site services |

### GBP Posts

GBP Posts have varying display durations depending on type: Update posts lose prominence after approximately 7 days, Offer posts run until their expiry date, and Event posts run until the event date. Types:

| Post Type | Use Case | Best Practices |
|---|---|---|
| **Update** | General news, tips, seasonal info | Include a photo, 150–300 words, CTA button |
| **Offer** | Discounts, seasonal promotions | Include coupon code or "mention this ad", set expiry date |
| **Event** | Open houses, community events | Set start/end date, include event details |

**Implementation — Automated GBP Post Content from Payload CMS:**

```typescript
// collections/GBPPosts.ts
const GBPPosts: CollectionConfig = {
  slug: 'gbp-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'publishDate', 'location'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Update', value: 'update' },
        { label: 'Offer', value: 'offer' },
        { label: 'Event', value: 'event' },
      ],
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 1500,
      admin: { description: '150–300 words recommended. Include target city and service keywords naturally.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'cta',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Learn More', value: 'LEARN_MORE' },
            { label: 'Book', value: 'BOOK' },
            { label: 'Order Online', value: 'ORDER' },
            { label: 'Call Now', value: 'CALL' },
            { label: 'Sign Up', value: 'SIGN_UP' },
          ],
        },
        { name: 'url', type: 'text' },
      ],
    },
    // Offer-specific
    {
      name: 'offerDetails',
      type: 'group',
      admin: { condition: (data) => data?.type === 'offer' },
      fields: [
        { name: 'couponCode', type: 'text' },
        { name: 'termsConditions', type: 'textarea' },
        { name: 'redeemUrl', type: 'text' },
      ],
    },
    // Event-specific
    {
      name: 'eventDetails',
      type: 'group',
      admin: { condition: (data) => data?.type === 'event' },
      fields: [
        { name: 'startDate', type: 'date' },
        { name: 'endDate', type: 'date' },
        { name: 'startTime', type: 'text' },
        { name: 'endTime', type: 'text' },
      ],
    },
    { name: 'publishDate', type: 'date', required: true },
    { name: 'status', type: 'select', options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Scheduled', value: 'scheduled' },
      { label: 'Published to GBP', value: 'published' },
    ]},
    { name: 'location', type: 'relationship', relationTo: 'locations' },
  ],
};
```

### GBP Post Content Calendar Template

```
Week 1: Service highlight + seasonal tip (Update)
Week 2: Before/after project showcase (Update)
Week 3: Promotion / coupon (Offer)
Week 4: Community involvement / team spotlight (Update)

Seasonal overlays:
- January–February: Freeze prevention, pipe winterization
- March–April: Spring AC tune-up, plumbing inspection
- May–June: AC installation, summer prep
- July–August: Emergency heat service, water heater maintenance
- September–October: Heating system tune-up, fall prep
- November–December: Holiday specials, emergency service availability
```

---

## 9. Review Management Strategy

### The Review Funnel

```
Job Completed
    │
    ▼
Technician confirms satisfaction on-site
    │
    ▼
SMS/Email sent within 2 hours (via Supabase trigger)
    │
    ▼
Customer clicks link → Sentiment gate page
    │
    ├── Happy (4-5 stars) → Redirect to Google Review URL
    │
    └── Unhappy (1-3 stars) → Internal feedback form
                                (saves to Supabase, alerts owner)
```

### Supabase — Review Request Tracking

```sql
-- supabase/migrations/review_requests.sql

CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  technician_name TEXT,
  service_performed TEXT,
  service_area TEXT,
  location_id UUID,

  -- Tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT CHECK (channel IN ('sms', 'email', 'both')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  review_submitted BOOLEAN DEFAULT FALSE,
  review_platform TEXT, -- 'google', 'yelp', 'facebook', 'internal'
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),

  -- Sentiment gate
  sentiment_response TEXT CHECK (sentiment_response IN ('positive', 'negative')),
  negative_feedback TEXT,
  follow_up_status TEXT DEFAULT 'none'
    CHECK (follow_up_status IN ('none', 'contacted', 'resolved', 'escalated')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX idx_review_requests_service_area ON review_requests(service_area);
CREATE INDEX idx_review_requests_sent ON review_requests(sent_at);

-- View for review velocity tracking
CREATE VIEW review_velocity AS
SELECT
  DATE_TRUNC('week', sent_at) AS week,
  service_area,
  COUNT(*) AS requests_sent,
  COUNT(*) FILTER (WHERE review_submitted) AS reviews_received,
  ROUND(
    COUNT(*) FILTER (WHERE review_submitted)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS conversion_rate,
  ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 2) AS avg_rating
FROM review_requests
GROUP BY 1, 2
ORDER BY 1 DESC;
```

### Payload CMS — Testimonials Collection

```typescript
// collections/Testimonials.ts
const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'rating', 'serviceArea', 'service', 'source', 'featured'],
  },
  fields: [
    { name: 'customerName', type: 'text', required: true },
    { name: 'customerInitials', type: 'text', admin: { description: 'For anonymous display: "J.S."' } },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    { name: 'text', type: 'textarea', required: true },
    { name: 'date', type: 'date', required: true },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Yelp', value: 'yelp' },
        { label: 'Facebook', value: 'facebook' },
        { label: 'Website Form', value: 'website' },
        { label: 'Angi', value: 'angi' },
        { label: 'BBB', value: 'bbb' },
        { label: 'Nextdoor', value: 'nextdoor' },
      ],
    },
    { name: 'sourceUrl', type: 'text', admin: { description: 'Link to the original review' } },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: { description: 'Which service was this review about?' },
    },
    {
      name: 'serviceArea',
      type: 'relationship',
      relationTo: 'service-areas',
      admin: { description: 'Which city/area was this job in?' },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Has this review been verified against the source?' },
    },
    {
      name: 'ownerResponse',
      type: 'textarea',
      admin: { description: 'Store the owner response here for reference and potential reuse.' },
    },
    {
      name: 'keywords',
      type: 'array',
      admin: { description: 'Keywords mentioned in this review (for filtering and display).' },
      fields: [{ name: 'keyword', type: 'text' }],
    },
  ],
};
```

### Displaying Reviews on City + Service Pages (Astro)

```astro
---
// src/components/CityReviews.astro
interface Props {
  serviceAreaSlug: string;
  serviceSlug?: string;
  limit?: number;
}

const { serviceAreaSlug, serviceSlug, limit = 5 } = Astro.props;

let apiUrl = `${CMS_URL}/api/testimonials?where[serviceArea.slug][equals]=${serviceAreaSlug}&where[rating][greater_than_equal]=4&where[verified][equals]=true&sort=-date&limit=${limit}`;

if (serviceSlug) {
  apiUrl += `&where[service.slug][equals]=${serviceSlug}`;
}

const { docs: reviews } = await fetch(apiUrl).then(r => r.json());

const avgRating = reviews.length
  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  : null;
---

{reviews.length > 0 && (
  <section class="reviews" itemscope itemtype="https://schema.org/AggregateRating">
    <h2>What Our {serviceAreaSlug.replace(/-/g, ' ')} Customers Say</h2>

    <div class="aggregate">
      <span itemprop="ratingValue">{avgRating}</span> / 5 stars from
      <span itemprop="reviewCount">{reviews.length}</span> reviews
    </div>

    {reviews.map(review => (
      <blockquote class="review" itemscope itemtype="https://schema.org/Review">
        <div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
          <meta itemprop="ratingValue" content={String(review.rating)} />
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        </div>
        <p itemprop="reviewBody">{review.text}</p>
        <cite>
          <span itemprop="author">{review.customerName}</span>
          {review.serviceArea?.cityName && (
            <span class="location">, {review.serviceArea.cityName}</span>
          )}
        </cite>
        {review.source !== 'website' && (
          <span class="review-source">via {review.source}</span>
        )}
      </blockquote>
    ))}
  </section>
)}
```

### Review Response Templates (Store in Payload Global)

```typescript
// globals/ReviewTemplates.ts
{
  slug: 'review-templates',
  fields: [
    {
      name: 'positive',
      type: 'array',
      fields: [
        { name: 'template', type: 'textarea' },
        // Template variables: {{customerName}}, {{service}}, {{city}}, {{technicianName}}
      ],
    },
    {
      name: 'negative',
      type: 'array',
      fields: [
        { name: 'template', type: 'textarea' },
      ],
    },
  ],
}
```

Example positive response template:
```
Thank you so much, {{customerName}}! We're glad our team could help with your {{service}} needs in {{city}}. It's always a pleasure serving our {{city}} neighbors. Don't hesitate to call if you need anything in the future!
```

Key rules for review responses:
- Respond to ALL reviews within 24 hours
- Mention the city name and service in responses (keyword signals)
- Personalize — never copy-paste identical responses
- For negative reviews: acknowledge, apologize, take offline ("Please call us at...")
- Never be defensive or argumentative

---

## 10. Schema.org LocalBusiness Markup

### Why Schema Markup Reinforces GBP

Schema.org structured data on your website provides a machine-readable confirmation of the data in your GBP. Google uses it to:

- Validate GBP information against your website
- Resolve conflicts between your listing and third-party data
- Understand the relationship between your business, services, and service areas
- Power rich results and AI Overview citations

### Complete LocalBusiness Schema Implementation

```typescript
// src/lib/schema.ts — Schema generation utilities

interface BusinessInfo {
  businessName: string;
  legalName?: string;
  phone: string;
  phoneE164: string;
  address: {
    street: string;
    suite?: string;
    city: string;
    state: string;
    zip: string;
  };
  hideAddress: boolean;
  website: string;
  email?: string;
  foundingYear?: number;
  ownerName?: string;
  socialProfiles: Record<string, string>;
  gbpUrl?: string;
  gbpPlaceId?: string;
  licenses?: Array<{
    type: string;
    number: string;
    state: string;
    issuingBody: string;
  }>;
  insuranceInfo?: {
    generalLiability: boolean;
    workersComp: boolean;
    bonded: boolean;
  };
}

interface ServiceArea {
  cityName: string;
  state: string;
  coordinates: { lat: number; lng: number };
}

interface LocationData {
  name: string;
  phone: string;
  address: BusinessInfo['address'];
  hideAddress: boolean;
  coordinates?: { lat: number; lng: number };
  hours?: {
    is24_7: boolean;
    regular?: Array<{
      day: string;
      open: string;
      close: string;
      closed: boolean;
    }>;
  };
  serviceAreas: ServiceArea[];
  gbp?: {
    placeId?: string;
    reviewUrl?: string;
  };
}

interface ReviewData {
  customerName: string;
  rating: number;
  text: string;
  date: string;
}

// --- Primary business type mapping ---
const INDUSTRY_SCHEMA_TYPES: Record<string, string> = {
  plumbing: 'Plumber',
  hvac: 'HVACBusiness',
  electrical: 'Electrician',
  roofing: 'RoofingContractor',
  landscaping: 'HomeAndConstructionBusiness',
  handyman: 'HomeAndConstructionBusiness',
  cleaning: 'HomeAndConstructionBusiness',
  pest_control: 'LocalBusiness',
  locksmith: 'Locksmith',
  moving: 'MovingCompany',
  painting: 'HousePainter',
  general_contractor: 'GeneralContractor',
};

export function generateLocalBusinessSchema(
  business: BusinessInfo,
  location: LocationData,
  industryType: string,
  reviews?: ReviewData[],
): Record<string, unknown> {
  const schemaType = INDUSTRY_SCHEMA_TYPES[industryType] || 'HomeAndConstructionBusiness';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${business.website}/#organization`,
    name: business.businessName,
    url: business.website,
    telephone: business.phoneE164,
    ...(business.email && { email: business.email }),
    ...(business.legalName && { legalName: business.legalName }),
    ...(business.foundingYear && {
      foundingDate: String(business.foundingYear),
    }),
    ...(business.ownerName && {
      founder: {
        '@type': 'Person',
        name: business.ownerName,
      },
    }),

    // Address — include even for SABs (Google uses it for verification)
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address.suite
        ? `${location.address.street}, ${location.address.suite}`
        : location.address.street,
      addressLocality: location.address.city,
      addressRegion: location.address.state,
      postalCode: location.address.zip,
      addressCountry: 'US',
    },

    // Geo coordinates
    ...(location.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng,
      },
    }),

    // Service areas
    areaServed: location.serviceAreas.map((area) => ({
      '@type': 'City',
      name: area.cityName,
      '@id': `https://en.wikipedia.org/wiki/${encodeURIComponent(area.cityName.replace(/ /g, '_'))},_${area.state}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: area.coordinates.lat,
        longitude: area.coordinates.lng,
      },
    })),

    // Hours
    ...(location.hours && {
      openingHoursSpecification: location.hours.is24_7
        ? {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
              'Monday', 'Tuesday', 'Wednesday', 'Thursday',
              'Friday', 'Saturday', 'Sunday',
            ],
            opens: '00:00',
            closes: '00:00',
          }
        : location.hours.regular
            ?.filter((h) => !h.closed)
            .map((h) => ({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: h.day,
              opens: h.open,
              closes: h.close,
            })),
    }),

    // Social profiles
    sameAs: Object.values(business.socialProfiles).filter(Boolean),

    // Images
    image: `${business.website}/images/logo.png`,
    logo: {
      '@type': 'ImageObject',
      url: `${business.website}/images/logo.png`,
    },

    // Certifications / qualifications
    ...(business.licenses?.length && {
      hasCredential: business.licenses.map((lic) => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: lic.type,
        recognizedBy: {
          '@type': 'Organization',
          name: lic.issuingBody,
        },
      })),
    }),

    // Insurance & bonding
    ...(business.insuranceInfo && {
      additionalProperty: [
        business.insuranceInfo.generalLiability && {
          '@type': 'PropertyValue',
          name: 'General Liability Insurance',
          value: 'Yes',
        },
        business.insuranceInfo.workersComp && {
          '@type': 'PropertyValue',
          name: 'Workers Compensation Insurance',
          value: 'Yes',
        },
        business.insuranceInfo.bonded && {
          '@type': 'PropertyValue',
          name: 'Bonded',
          value: 'Yes',
        },
      ].filter(Boolean),
    }),

    // Payment accepted
    paymentAccepted: 'Cash, Credit Card, Check, Financing',
    priceRange: '$$',
  };

  // Aggregate rating from reviews
  if (reviews && reviews.length > 0) {
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: '5',
      worstRating: '1',
    };

    schema.review = reviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.customerName,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(r.rating),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: r.text,
      datePublished: r.date,
    }));
  }

  return schema;
}
```

### Service Schema (Per Service Page)

```typescript
export function generateServiceSchema(
  business: BusinessInfo,
  service: {
    name: string;
    description: string;
    slug: string;
    priceRange?: string;
    estimatedDuration?: string;
  },
  serviceAreas: ServiceArea[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${business.website}/services/${service.slug}/#service`,
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${business.website}/#organization`,
      name: business.businessName,
    },
    areaServed: serviceAreas.map((area) => ({
      '@type': 'City',
      name: area.cityName,
    })),
    ...(service.priceRange && {
      offers: {
        '@type': 'Offer',
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'USD',
          price: service.priceRange,
        },
      },
    }),
    ...(service.estimatedDuration && {
      estimatedDuration: service.estimatedDuration,
    }),
    serviceType: service.name,
  };
}
```

### BreadcrumbList Schema (Every Page)

```typescript
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

### Payload CMS — FAQs Collection

```typescript
// collections/FAQs.ts
import { CollectionConfig } from 'payload/types';

const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'service', 'serviceArea', 'location'],
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
    },
    {
      name: 'serviceArea',
      type: 'relationship',
      relationTo: 'service-areas',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        description: 'URL-friendly identifier for this FAQ',
      },
    },
  ],
};

export default FAQs;
```

### FAQ Schema (For City + Service Pages)

```typescript
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
```

### Injecting Schema into Astro Pages

```astro
---
// src/layouts/BaseLayout.astro
import { generateLocalBusinessSchema, generateBreadcrumbSchema } from '../lib/schema';

interface Props {
  title: string;
  description: string;
  schemas?: Record<string, unknown>[];
  canonicalUrl?: string;
}

const { title, description, schemas = [], canonicalUrl } = Astro.props;

// Always include the organization schema on every page
const businessInfo = await fetch(`${CMS_URL}/api/globals/business-info`).then(r => r.json());
const primaryLocation = await fetch(`${CMS_URL}/api/locations?where[isPrimary][equals]=true&limit=1&depth=2`).then(r => r.json());

const orgSchema = generateLocalBusinessSchema(
  businessInfo,
  primaryLocation.docs[0],
  businessInfo.industryType,
);

const allSchemas = [orgSchema, ...schemas];
---

<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

  {allSchemas.map(schema => (
    <script type="application/ld+json" set:html={JSON.stringify(schema)} />
  ))}
</head>
<body>
  <slot />
</body>
</html>
```

### City + Service Page — Full Schema Example

```astro
---
// src/pages/[service]-in-[city].astro
import BaseLayout from '../layouts/BaseLayout.astro';
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateFAQSchema
} from '../lib/schema';

const { service: serviceSlug, city: citySlug } = Astro.params;

// Fetch all data
const [businessInfo, locationRes, serviceRes, areaRes, reviewsRes, faqsRes] = await Promise.all([
  fetch(`${CMS_URL}/api/globals/business-info`).then(r => r.json()),
  fetch(`${CMS_URL}/api/locations?where[isPrimary][equals]=true&limit=1&depth=2`).then(r => r.json()),
  fetch(`${CMS_URL}/api/services?where[slug][equals]=${serviceSlug}&limit=1`).then(r => r.json()),
  fetch(`${CMS_URL}/api/service-areas?where[slug][equals]=${citySlug}&limit=1&depth=1`).then(r => r.json()),
  fetch(`${CMS_URL}/api/testimonials?where[serviceArea.slug][equals]=${citySlug}&where[service.slug][equals]=${serviceSlug}&where[verified][equals]=true&sort=-date&limit=10`).then(r => r.json()),
  fetch(`${CMS_URL}/api/faqs?where[service.slug][equals]=${serviceSlug}&where[serviceArea.slug][equals]=${citySlug}&limit=10`).then(r => r.json()),
]);

const location = locationRes.docs[0];
const service = serviceRes.docs[0];
const area = areaRes.docs[0];
const reviews = reviewsRes.docs;
const faqs = faqsRes.docs;

const pageTitle = `${service.name} in ${area.cityName}, ${area.state} | ${businessInfo.businessName}`;
const pageUrl = `${businessInfo.website}/${serviceSlug}-in-${citySlug}`;

// Build all schemas for this page
const schemas = [
  generateServiceSchema(businessInfo, service, [area]),
  generateBreadcrumbSchema([
    { name: 'Home', url: businessInfo.website },
    { name: service.name, url: `${businessInfo.website}/services/${serviceSlug}` },
    { name: `${area.cityName}, ${area.state}`, url: pageUrl },
  ]),
  ...(faqs.length > 0 ? [generateFAQSchema(faqs)] : []),
];
---

<BaseLayout
  title={pageTitle}
  description={`Professional ${service.name.toLowerCase()} in ${area.cityName}, ${area.state}. Licensed, insured, same-day service. Call ${businessInfo.phone}.`}
  schemas={schemas}
  canonicalUrl={pageUrl}
>
  <!-- Page content here -->
</BaseLayout>
```

---

## Implementation Summary — What to Build

### Payload CMS Collections & Globals

| Type | Slug | Purpose |
|---|---|---|
| **Global** | `business-info` | Canonical NAP, GBP IDs, social profiles, licenses |
| **Global** | `review-templates` | Owner response templates for reviews |
| **Collection** | `locations` | Physical office locations with GBP data |
| **Collection** | `service-areas` | Cities served, with local context for content generation |
| **Collection** | `services` | Service definitions aligned to GBP categories |
| **Collection** | `testimonials` | Reviews from all sources, tagged by service + city |
| **Collection** | `citations` | Citation/directory tracking |
| **Collection** | `gbp-posts` | GBP post content management |
| **Collection** | `faqs` | FAQs per service and/or city (for schema + content) |

### Astro / Next.js Pages

| Page Pattern | Schema Types | Data Sources |
|---|---|---|
| Homepage | `LocalBusiness`, `BreadcrumbList` | business-info, primary location, top reviews |
| `/services/[slug]` | `Service`, `BreadcrumbList`, `FAQPage` | services, service-areas, reviews, FAQs |
| `/[service]-in-[city]` | `Service`, `LocalBusiness`, `BreadcrumbList`, `FAQPage`, `AggregateRating` | All collections |
| `/locations/[slug]` | `LocalBusiness`, `BreadcrumbList` | locations, service-areas |
| `/reviews` | `LocalBusiness`, `AggregateRating` | testimonials |
| `/contact` | `LocalBusiness` | business-info, locations |

### Supabase Tables

| Table | Purpose |
|---|---|
| `review_requests` | Track review solicitation workflow |
| `review_velocity` (view) | Monitor review acquisition metrics |
| `citation_audit_log` | Track NAP changes for citation update triggers |
| `gbp_performance` | Store GBP Insights API data for reporting |

### Key Integration Points

1. **Payload `afterChange` hook on `business-info`** → Log NAP changes to Supabase `citation_audit_log` → Alert team to update citations
2. **Payload `afterChange` hook on `testimonials`** → Sync verified reviews to Supabase for analytics
3. **Supabase Edge Function** → Send review request SMS/email 2 hours after job completion
4. **Astro build-time** → Fetch all data from Payload API, generate static pages with schema markup
5. **Next.js API routes** → Handle dynamic review submission, lead forms, GBP post scheduling

### Validation Checklist (Pre-Launch)

- [ ] NAP is identical across: website footer, contact page, schema markup, GBP listing
- [ ] Schema markup validates at https://validator.schema.org
- [ ] Google Rich Results Test passes for all page types
- [ ] Every city page has unique `<title>`, `<meta description>`, `<h1>`, and body content
- [ ] GBP primary category matches the website's primary service focus
- [ ] GBP services list matches the services collection in Payload
- [ ] Review link generates correctly: `https://search.google.com/local/writereview?placeid=PLACE_ID`
- [ ] All social profile URLs in schema match actual profiles
- [ ] Phone number `tel:` links use E.164 format
- [ ] `areaServed` in schema matches GBP service areas exactly
- [ ] Photos on GBP are authentic (not stock), geotagged, and branded
- [ ] GBP Q&A has been pre-seeded with 10+ questions
- [ ] Citation submissions to all 4 data aggregators are confirmed
- [ ] Tier 1 directory listings are live and NAP-accurate
