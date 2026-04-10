# Client Onboarding Guide — Agency Web Stack

> **Purpose**: This guide provides the complete, repeatable process for onboarding a new client into the Agency Web Stack. It covers everything from the initial discovery call through 90 days of post-launch monitoring.
>
> **Audience**: Agency team members, Claude Code instances, and new team members implementing client projects.
>
> **Companion Document**: This guide is Section 18 of [PROGRAMMATIC_SEO_BLUEPRINT.md](./PROGRAMMATIC_SEO_BLUEPRINT.md). For architecture, data models, SEO strategy, and technical implementation details, see the main blueprint.

---

## Document Structure

This guide is organized into phases matching a typical client project timeline:

| Phase | Sections | Timeline | Focus |
|---|---|---|---|
| **Intake & Discovery** | 18.1–18.3 | Days 1–3 | Gather client information, select industry config |
| **Infrastructure & Branding** | 18.4–18.5, 18.8 | Days 3–5 | Brand assets, CMS white-label, environment setup |
| **Content & SEO** | 18.6–18.7 | Days 5–15 | Content loading, SEO baseline, analytics |
| **Training & Handoff** | 18.9–18.10 | Days 15–22 | Client training, handoff checklist |
| **Post-Launch** | 18.11–18.12 | Days 22–90 | Monitoring, reporting, client CLAUDE.md |
| **Complete Workflow** | 18.13 | — | End-to-end timeline with all phases |

**Total estimated time: 15–22 business days from kickoff to launch, plus 90 days of post-launch monitoring.**

## Quick Navigation

- **First-time setup?** Follow sections 18.1 → 18.13 in order
- **Need the complete timeline?** Jump to [18.13 Complete Onboarding Workflow Summary](#1813-complete-onboarding-workflow-summary)
- **Setting up a specific industry?** See [18.3 Industry-Specific Collection Configuration](#183-industry-specific-collection-configuration)
- **Pre-launch verification?** See [18.10 Handoff Checklist](#1810-handoff-checklist)

## Related Blueprint Sections

This guide references the following sections in [PROGRAMMATIC_SEO_BLUEPRINT.md](./PROGRAMMATIC_SEO_BLUEPRINT.md):

- **[Section 4: Collection Definitions](./PROGRAMMATIC_SEO_BLUEPRINT.md#4-collection-definitions---data-models)**: base data models that 18.3 extends per industry
- **[Section 9: Seed Scripts](./PROGRAMMATIC_SEO_BLUEPRINT.md#9-seed-scripts-and-data-import)**: imports the CSV templates defined in 18.2
- **[Section 10: Pillar Pages & Linking](./PROGRAMMATIC_SEO_BLUEPRINT.md#10-pillar-pages-topic-clusters-and-linking-architecture)**: linking rules referenced in 18.7 and 18.10
- **[Section 13: CMS White-Labeling](./PROGRAMMATIC_SEO_BLUEPRINT.md#13-cms-white-labeling)**: technical details complementing 18.5's implementation steps
- **[Section 17: Pre-Launch Checklist](./PROGRAMMATIC_SEO_BLUEPRINT.md#17-checklist---before-launching-a-client-site)**: the comprehensive internal checklist that 18.10 builds on

---

## Table of Contents

- [18.1 Client Discovery Questionnaire](#181-client-discovery-questionnaire)
- [18.2 Data Collection Templates](#182-data-collection-templates)
- [18.3 Industry-Specific Collection Configuration](#183-industry-specific-collection-configuration)
- [18.4 Brand Configuration Checklist](#184-brand-configuration-checklist)
- [18.5 CMS White-Label Setup Steps Per Client](#185-cms-white-label-setup-steps-per-client)
- [18.6 Initial Content Requirements](#186-initial-content-requirements)
- [18.7 SEO Baseline Setup](#187-seo-baseline-setup)
- [18.8 Environment / Deployment Setup Per Client](#188-environment--deployment-setup-per-client)
- [18.9 Client Training Plan](#189-client-training-plan)
- [18.10 Handoff Checklist](#1810-handoff-checklist)
- [18.11 Post-Launch Monitoring Setup](#1811-post-launch-monitoring-setup)
- [18.12 Template for Client-Specific CLAUDE.md](#1812-template-for-client-specific-claudemd)
- [18.13 Complete Onboarding Workflow Summary](#1813-complete-onboarding-workflow-summary)

---

## 18. Client Onboarding Process

> **Purpose**: This section defines the complete process for onboarding a new client into the Agency Web Stack. It covers everything from initial discovery through post-launch monitoring. Every step is designed to be repeatable, so any team member or Claude Code instance can onboard a client without guesswork.

### 18.1 Client Discovery Questionnaire

Before any code is written, collect the following information. This questionnaire should be completed during a kickoff call or sent as a structured form. Every field marked **(required)** must be filled before the project begins.

#### Business Fundamentals

| Field | Type | Required | Notes |
|---|---|---|---|
| Business legal name | text | yes | As registered — used in schema.org and legal footer |
| Business DBA / display name | text | yes | What customers see — used in H1s, titles, nav |
| Business type | select | yes | Sole proprietor, LLC, Corporation, Partnership |
| Industry / vertical | select | yes | Plumbing, Legal, Healthcare, Real Estate, HVAC, Electrical, Roofing, Landscaping, Cleaning, Other |
| Year established | number | yes | Used in trust signals ("Serving since 2005") |
| License numbers | text | no | State license, contractor license, bar number, medical license — displayed in footer and trust sections |
| Insurance info | text | no | Bonded & insured details for trust signals |
| Certifications | array | no | Each: name, issuing body, year obtained — e.g., "EPA 608 Certified", "Board Certified Dermatologist" |
| Awards / recognition | array | no | Each: name, year — e.g., "Best of Austin 2024" |
| BBB rating | text | no | e.g., "A+" — used in trust badges |

#### Services & Service Areas

| Field | Type | Required | Notes |
|---|---|---|---|
| Primary services offered | array of text | yes | Top-level categories — these become pillar pages (e.g., "Plumbing", "Drain Cleaning", "Water Heater") |
| Sub-services per primary service | nested array | yes | Cluster pages — e.g., under "Plumbing": "Leak Repair", "Pipe Replacement", "Sewer Line Repair" |
| Primary service area (city/metro) | text | yes | The main city or metro — determines homepage geo-targeting |
| All cities served | array | yes | Every city that gets a dedicated location page |
| Neighborhoods / sub-areas | array | no | Specific neighborhoods within cities for deeper geo pages |
| States served | array | yes | For state-level location hub pages |
| Service radius | text | no | e.g., "50 miles from downtown Austin" |
| Emergency / 24-7 availability | boolean | yes | Affects CTAs and schema markup |

#### Competitors & Positioning

| Field | Type | Required | Notes |
|---|---|---|---|
| Top 3-5 competitors | array | yes | Each: business name, website URL — used for competitive keyword research |
| What differentiates you from competitors? | textarea | yes | USPs — these become trust signals and CTA copy |
| Target customer profile | textarea | yes | Who is the ideal customer? Homeowners, businesses, specific demographics |
| Pricing model | select | yes | Fixed price, hourly, free estimates, quote-based — affects CTA language |
| Average job value | text | no | Helps prioritize high-value service pages |

#### Brand & Design

| Field | Type | Required | Notes |
|---|---|---|---|
| Logo (SVG + PNG) | file upload | yes | SVG preferred for scalability; PNG as fallback |
| Favicon (ICO or PNG, 32x32 and 180x180) | file upload | yes | Browser tab and mobile bookmark icon |
| Primary brand color (hex) | text | yes | e.g., "#1E40AF" — used for buttons, links, accents |
| Secondary brand color (hex) | text | yes | e.g., "#F59E0B" — used for highlights, hover states |
| Accent / tertiary color (hex) | text | no | Optional third color |
| Background color preference | text | no | Default white, but some brands prefer off-white or dark |
| Font preference | text | no | Google Fonts name or "use default" — e.g., "Inter", "Montserrat" |
| Tone of voice | select | yes | Professional, Friendly, Authoritative, Casual, Technical — guides all content generation |
| Brand tagline / slogan | text | no | e.g., "Your Trusted Austin Plumber Since 1998" |
| Existing brand guidelines document | file upload | no | If they have a PDF brand guide, import it |

#### Contact Information

| Field | Type | Required | Notes |
|---|---|---|---|
| Primary phone number | text | yes | Click-to-call CTAs — format: (512) 555-1234 |
| Secondary phone number | text | no | After-hours or department-specific |
| Primary email | email | yes | Contact form submissions sent here |
| Physical address | text | yes | Required for LocalBusiness schema — full street address |
| Mailing address (if different) | text | no | PO Box or different address |
| Business hours | structured | yes | Each day: open time, close time, or "closed" — used in schema.org |
| Google Business Profile URL | url | no | If they already have one — critical for local SEO |
| Social media profiles | array of url | no | Facebook, Instagram, LinkedIn, Twitter/X, YouTube, Nextdoor, TikTok |

#### Team Information

| Field | Type | Required | Notes |
|---|---|---|---|
| Owner / principal name | text | yes | Featured on About page and schema |
| Owner photo | file upload | yes | Builds trust — used in About section and schema |
| Owner bio (2-3 sentences) | textarea | yes | Professional background |
| Team member list | array | no | Each: name, title, bio, photo, specialties, certifications |
| Number of employees | number | no | Used in trust signals ("Team of 25+ licensed plumbers") |

#### Content Assets

| Field | Type | Required | Notes |
|---|---|---|---|
| Existing website URL | url | no | If migrating — used for content audit and 301 redirects |
| Existing testimonials / reviews | array or CSV | no | Each: client name, review text, rating, date, source |
| Project photos / gallery images | file upload (batch) | no | Before/after photos, job site photos — with descriptions |
| Existing blog content | url or docs | no | Content to migrate |
| Video content | url array | no | YouTube embeds, project walkthroughs |
| Common customer questions | array | no | Seed FAQ content — "What do customers always ask you?" |

#### Technical / Accounts

| Field | Type | Required | Notes |
|---|---|---|---|
| Domain name (owned or to purchase) | text | yes | e.g., "austinplumbingpros.com" |
| Domain registrar | text | yes | Where DNS is managed — GoDaddy, Namecheap, Cloudflare, etc. |
| DNS access credentials or delegation | text | yes | Need to point domain to hosting |
| Google account for Search Console | email | yes | Must be a Google account the client controls |
| Existing Google Analytics property | text | no | GA4 measurement ID if they have one |
| Existing Google Search Console property | text | no | If already verified |
| Preferred CMS login email | email | yes | Email address for their Payload admin account |

---

### 18.2 Data Collection Templates

After the discovery questionnaire, provide the client with CSV templates to fill in their structured data. These CSVs are imported via seed scripts (see [Section 9: Seed Scripts and Data Import](./PROGRAMMATIC_SEO_BLUEPRINT.md#9-seed-scripts-and-data-import) of this blueprint).

#### services.csv

```csv
name,slug,category,parentService,shortDescription,longDescription,icon,priceRange,duration,emergency,sortOrder
Plumbing,plumbing,residential,,Full-service residential plumbing — repairs leaks and installs fixtures,"We provide comprehensive plumbing services including leak detection, pipe repair, fixture installation, and more. Our licensed plumbers serve the greater Austin area with same-day service available.",wrench,$75-$500/job,1-4 hours,true,1
Drain Cleaning,drain-cleaning,residential,Plumbing,Professional drain cleaning to prevent backups and flooding,"Clogged drains can cause serious damage to your home. Our drain cleaning services use professional-grade equipment to clear blockages and prevent future problems.",droplets,$99-$350/job,1-2 hours,true,2
Water Heater,water-heater,residential,Plumbing,Water heater installation repair and replacement — tank and tankless,"Whether you need a new water heater installed or your current unit repaired, our team handles both traditional tank and modern tankless systems.",flame,$150-$3000/job,2-6 hours,true,3
```

**Column definitions:**
- `name` — Display name (becomes H1 and page title)
- `slug` — URL-safe identifier (auto-generated if blank)
- `category` — Service category grouping: residential, commercial, emergency
- `parentService` — Name of parent service for sub-services (leave empty for top-level pillar services)
- `shortDescription` — 1-2 sentences for cards and meta descriptions (max 160 chars)
- `longDescription` — Full intro paragraph for the service page (150-300 words)
- `icon` — Lucide icon name (wrench, droplets, flame, thermometer, zap, home, etc.)
- `priceRange` — Approximate pricing for trust/transparency
- `duration` — Typical job duration
- `emergency` — Whether emergency service is available (true/false)
- `sortOrder` — Display order in navigation and listings

#### locations.csv

```csv
displayName,city,state,stateCode,county,type,zipCodes,lat,lng,population,timezone,areaCode,nearbyLocations,serviceRadius,localNotes
"Austin, TX",Austin,Texas,TX,Travis,city,"78701,78702,78703,78704,78705,78721,78722,78723,78724,78725",30.2672,-97.7431,964254,America/Chicago,512,"Round Rock,Cedar Park,Georgetown,Pflugerville,San Marcos",25 miles,"State capital with hot summers — high demand for HVAC and plumbing"
"Round Rock, TX",Round Rock,Texas,TX,Williamson,city,"78664,78665,78681",30.5083,-97.6789,119468,America/Chicago,512,"Austin,Cedar Park,Georgetown,Pflugerville",15 miles,"Fast-growing suburb north of Austin — lots of new construction"
"Cedar Park, TX",Cedar Park,Texas,TX,Williamson,city,"78613",30.5052,-97.8203,79462,America/Chicago,512,"Austin,Round Rock,Leander,Lago Vista",10 miles,"Family-friendly suburb — residential service focus"
```

**Column definitions:**
- `displayName` — How the location appears in titles and headings: "Austin, TX"
- `city` — City name only
- `state` — Full state name
- `stateCode` — Two-letter abbreviation
- `county` — County name (used in schema.org and local content)
- `type` — city, neighborhood, suburb, region
- `zipCodes` — Comma-separated ZIP codes served (quoted because commas)
- `lat`, `lng` — Coordinates for maps and geo-schema
- `population` — Used for prioritizing which locations get the most content investment
- `timezone` — IANA timezone string
- `areaCode` — Phone area code (useful for local numbers)
- `nearbyLocations` — Comma-separated names of nearby locations (for cross-linking)
- `serviceRadius` — How far from this location you serve
- `localNotes` — Local context for AI content generation (climate, demographics, common issues)

#### faqs.csv

```csv
question,answer,serviceName,locationName,sortOrder,source
How much does a plumber cost in Austin?,Most plumbing jobs in Austin range from $75 to $500 depending on the complexity. Emergency calls may cost more. We offer free estimates for all jobs.,Plumbing,"Austin, TX",1,manual
Do you offer emergency plumbing?,Yes — we offer 24/7 emergency plumbing service across the Austin metro area. Call us anytime and a licensed plumber will be dispatched to your location.,Plumbing,,2,manual
How long does a water heater installation take?,A standard water heater installation takes 2-4 hours. Tankless conversions may take 4-6 hours due to additional venting and gas line work.,Water Heater,,1,manual
What brands of water heaters do you install?,"We install all major brands including Rheem, AO Smith, Bradford White, Rinnai, and Navien. We can recommend the best option for your home and budget.",Water Heater,,2,manual
```

**Column definitions:**
- `question` — The FAQ question (becomes H3 and schema.org question)
- `answer` — The answer (plain text or markdown — converted to richText on import)
- `serviceName` — Name of the related service (leave empty for global FAQs)
- `locationName` — Name of the related location (leave empty for non-location-specific FAQs)
- `sortOrder` — Display order within FAQ blocks
- `source` — Where this FAQ came from: manual, ai, google-paa (People Also Ask)

#### testimonials.csv

```csv
clientName,clientTitle,review,rating,date,serviceName,locationName,source,featured
John D.,Homeowner,"Called at 10pm with a burst pipe. They were at my door within 45 minutes and had everything fixed in under two hours. Incredible service and very fair pricing.",5,2025-11-15,Plumbing,"Austin, TX",google,true
Sarah M.,Business Owner,"They installed a new tankless water heater in my restaurant. Professional, clean, and finished ahead of schedule. Highly recommend for commercial work.",5,2025-09-22,Water Heater,"Round Rock, TX",direct,true
Mike R.,Homeowner,"Great drain cleaning service. The technician explained everything and even showed me camera footage of the pipe. No surprises on the bill.",4,2025-10-03,Drain Cleaning,"Cedar Park, TX",yelp,false
```

**Column definitions:**
- `clientName` — Customer name (first name + last initial for privacy)
- `clientTitle` — Customer descriptor: Homeowner, Business Owner, Property Manager
- `review` — Full review text
- `rating` — 1-5 star rating
- `date` — Date of review (YYYY-MM-DD)
- `serviceName` — Related service name
- `locationName` — Related location name
- `source` — Review platform: google, yelp, direct, facebook, bbb
- `featured` — Whether to show in featured testimonial sections (true/false)

#### team-members.csv

```csv
name,role,bio,email,phone,specialties,certifications,locations,sortOrder
Mike Johnson,Owner / Master Plumber,"Mike founded Austin Plumbing Pros in 2005 with a mission to provide honest, reliable plumbing services. With over 20 years of experience, he personally oversees every major project.",mike@austinplumbingpros.com,(512) 555-1234,"Plumbing,Water Heater,Drain Cleaning","Master Plumber License #12345,EPA 608 Certified","Austin TX,Round Rock TX,Cedar Park TX",1
Sarah Chen,Lead Technician,"Sarah specializes in tankless water heater systems and complex repiping jobs. She's been with the team since 2018 and holds multiple manufacturer certifications.",sarah@austinplumbingpros.com,(512) 555-1235,"Water Heater,Plumbing","Rinnai Certified Installer,Navien Certified","Austin TX,Georgetown TX",2
Carlos Rivera,Service Technician,"Carlos handles emergency calls and drain cleaning. Known for his quick response times and thorough explanations, he's a customer favorite.",carlos@austinplumbingpros.com,(512) 555-1236,"Drain Cleaning,Plumbing","Journeyman Plumber License #67890","Austin TX,Pflugerville TX,Round Rock TX",3
```

**Column definitions:**
- `name` — Full name
- `role` — Job title
- `bio` — 2-3 sentence professional bio
- `email` — Work email
- `phone` — Work phone
- `specialties` — Comma-separated service names they specialize in
- `certifications` — Comma-separated: "Cert Name,Cert Name" (each parsed as name only; issuer/year added in CMS)
- `locations` — Comma-separated location displayNames they serve
- `sortOrder` — Display order on team page

---

### 18.3 Industry-Specific Collection Configuration

The base collections (Services, Locations, ServicePages, FAQs, Testimonials, TeamMembers, BlogPosts, Media) work for all industries. What changes per industry is the **field configuration, category options, and terminology**. This section documents how to adapt the CMS for different verticals.

#### Adaptation Strategy

Do NOT create separate collection schemas per industry. Instead, use these adaptation points:

1. **Category options** in the Services collection — change the `category` select options
2. **Custom fields** added via Payload's `fields` array — add industry-specific fields
3. **Admin labels and descriptions** — change help text to match industry terminology
4. **Blog post categories** — change the `category` select options
5. **Schema.org types** — change the structured data type per industry

#### Plumbing / HVAC / Electrical / Roofing (Home Services)

```typescript
// Services collection category options:
options: [
  { label: "Residential", value: "residential" },
  { label: "Commercial", value: "commercial" },
  { label: "Emergency", value: "emergency" },
  { label: "Maintenance", value: "maintenance" },
]

// Additional service fields:
{ name: "licenseRequired", type: "checkbox", defaultValue: true },
{ name: "permitRequired", type: "checkbox", defaultValue: false },
{ name: "estimateType", type: "select", options: [
  { label: "Free Estimate", value: "free" },
  { label: "Paid Diagnostic", value: "paid" },
  { label: "Flat Rate", value: "flat" },
]},
{ name: "warrantyInfo", type: "textarea" },

// Schema.org type: HomeAndConstructionBusiness, Plumber, HVACBusiness, Electrician, RoofingContractor
// Blog categories: Tips & Guides, Seasonal Maintenance, DIY vs Professional, Cost Guides, Emergency Prep
```

#### Legal (Law Firms)

```typescript
// Rename "Services" to "Practice Areas" in admin labels:
admin: {
  useAsTitle: "name",
  group: "Practice Areas",
  description: "Areas of law your firm practices",
}

// Services collection category options:
options: [
  { label: "Personal Injury", value: "personal-injury" },
  { label: "Family Law", value: "family-law" },
  { label: "Criminal Defense", value: "criminal-defense" },
  { label: "Business Law", value: "business-law" },
  { label: "Estate Planning", value: "estate-planning" },
  { label: "Immigration", value: "immigration" },
]

// Additional service fields:
{ name: "caseTypes", type: "array", fields: [
  { name: "name", type: "text", required: true },  // "Car Accidents", "Slip and Fall"
  { name: "slug", type: "text" },
]},
{ name: "statueOfLimitations", type: "text", admin: { description: "e.g., '2 years in Texas'" } },
{ name: "freeConsultation", type: "checkbox", defaultValue: true },
{ name: "contingencyFee", type: "checkbox", defaultValue: false },
{ name: "averageSettlement", type: "text" },

// Team member additional fields:
{ name: "barNumber", type: "text", required: true },
{ name: "barAdmissions", type: "array", fields: [
  { name: "state", type: "text" },
  { name: "year", type: "number" },
]},
{ name: "education", type: "array", fields: [
  { name: "school", type: "text" },
  { name: "degree", type: "text" },
  { name: "year", type: "number" },
]},
{ name: "superLawyersProfile", type: "text" },
{ name: "avvoRating", type: "number" },

// Schema.org type: LegalService, Attorney
// Blog categories: Legal Guides, Case Results, Law Changes, Know Your Rights
// Testimonial note: Must comply with state bar advertising rules — add disclaimer field
```

#### Healthcare (Medical Practices, Dental, Chiropractic)

```typescript
// Rename "Services" to "Services & Treatments" in admin labels
admin: {
  useAsTitle: "name",
  group: "Medical Services",
}

// Services collection category options:
options: [
  { label: "Primary Care", value: "primary-care" },
  { label: "Specialty", value: "specialty" },
  { label: "Diagnostic", value: "diagnostic" },
  { label: "Surgical", value: "surgical" },
  { label: "Preventive", value: "preventive" },
  { label: "Cosmetic", value: "cosmetic" },
]

// Additional service fields:
{ name: "conditions", type: "array", fields: [
  { name: "name", type: "text", required: true },  // "Acne", "Back Pain"
  { name: "slug", type: "text" },
], admin: { description: "Conditions this service treats — each becomes a page" } },
{ name: "insuranceAccepted", type: "array", fields: [
  { name: "provider", type: "text" },  // "Blue Cross", "Aetna"
]},
{ name: "preparationInstructions", type: "richText" },
{ name: "recoveryTime", type: "text" },
{ name: "fdaApproved", type: "checkbox" },

// Team member additional fields:
{ name: "npiNumber", type: "text" },
{ name: "medicalLicense", type: "text" },
{ name: "boardCertifications", type: "array", fields: [
  { name: "board", type: "text" },
  { name: "specialty", type: "text" },
  { name: "year", type: "number" },
]},
{ name: "hospitalAffiliations", type: "array", fields: [
  { name: "hospital", type: "text" },
]},
{ name: "acceptingNewPatients", type: "checkbox", defaultValue: true },

// Schema.org type: MedicalBusiness, Physician, Dentist, MedicalClinic
// Blog categories: Health Tips, Conditions, Treatments, Patient Resources, Wellness
// HIPAA note: Never include patient identifiable info in testimonials — add consent field
// Add disclaimer: "Results may vary" on testimonials
```

#### Real Estate (Agents, Brokerages, Property Management)

```typescript
// Rename "Services" to "Services" (keep as-is, but change categories)
admin: {
  useAsTitle: "name",
  group: "Real Estate Services",
}

// Services collection category options:
options: [
  { label: "Buying", value: "buying" },
  { label: "Selling", value: "selling" },
  { label: "Renting", value: "renting" },
  { label: "Property Management", value: "property-management" },
  { label: "Commercial", value: "commercial" },
  { label: "Investment", value: "investment" },
]

// Additional collections (beyond base):
// Neighborhoods collection — extends Locations with real estate data:
{ name: "medianHomePrice", type: "number" },
{ name: "medianRent", type: "number" },
{ name: "schoolDistrict", type: "text" },
{ name: "schoolRating", type: "number", min: 1, max: 10 },
{ name: "walkScore", type: "number" },
{ name: "transitScore", type: "number" },
{ name: "bikeScore", type: "number" },
{ name: "crimeRate", type: "select", options: [
  { label: "Very Low", value: "very-low" },
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
]},
{ name: "amenities", type: "array", fields: [
  { name: "name", type: "text" },
  { name: "type", type: "select", options: [
    { label: "Parks", value: "parks" },
    { label: "Restaurants", value: "restaurants" },
    { label: "Shopping", value: "shopping" },
    { label: "Entertainment", value: "entertainment" },
    { label: "Healthcare", value: "healthcare" },
  ]},
]},

// Team member additional fields:
{ name: "licenseNumber", type: "text", required: true },
{ name: "licenseState", type: "text" },
{ name: "brokerage", type: "text" },
{ name: "mlsId", type: "text" },
{ name: "zillowProfile", type: "text" },
{ name: "realtorComProfile", type: "text" },
{ name: "closedTransactions", type: "number" },
{ name: "totalSalesVolume", type: "text" },

// Schema.org type: RealEstateAgent, LocalBusiness
// Blog categories: Market Reports, Buyer Guides, Seller Guides, Neighborhood Spotlights, Investment Tips
// Page types: /neighborhoods/[slug], /[service]/[city] (e.g., /buying-agent/austin-tx)
```

#### Configuration Application Process

When setting up a new client project, apply industry adaptations in this order:

1. Copy the base collection files from the blueprint ([Section 4: Collection Definitions - Data Models](./PROGRAMMATIC_SEO_BLUEPRINT.md#4-collection-definitions---data-models))
2. Identify the client's industry from the discovery questionnaire
3. Add the industry-specific fields to the relevant collections
4. Update category `options` arrays
5. Update admin `group` labels and `description` text
6. Update `blog-posts` category options
7. Update the SEO auto-generation hook to use the correct schema.org type
8. Update the seed script CSV column mappings if new fields were added
9. Document any custom fields in the client's CLAUDE.md ([Section 18.12](#1812-template-for-client-specific-claudemd))

---

### 18.4 Brand Configuration Checklist

This checklist covers every brand touchpoint that must be configured per client. Complete all items before building any pages.

#### Files to Create / Modify

```text
templates/next-app/
  src/
    components/admin/
      Logo.tsx           ← Client logo for CMS admin sidebar
      Icon.tsx           ← Client icon for CMS admin browser tab
    app/(payload)/
      custom.css         ← Client brand colors in CSS custom properties
  public/
    logo.svg             ← Client logo (SVG)
    logo.png             ← Client logo (PNG fallback)
    favicon.ico          ← Client favicon (32x32 ICO)
    apple-touch-icon.png ← Client icon (180x180 PNG)
    og-default.png       ← Default Open Graph image (1200x630)

templates/astro-site/
  public/
    logo.svg             ← Same logo for frontend
    logo.png             ← Same PNG fallback
    favicon.ico          ← Same favicon
    apple-touch-icon.png ← Same touch icon
    og-default.png       ← Same OG image
  src/
    styles/
      global.css         ← Brand colors as CSS custom properties
    config/
      site.ts            ← Site-wide configuration constants
```

#### site.ts Configuration Template

```typescript
// templates/astro-site/src/config/site.ts
export const siteConfig = {
  // ── Business Identity ──
  name: "CLIENT_BUSINESS_NAME",
  legalName: "CLIENT_LEGAL_NAME_LLC",
  tagline: "CLIENT_TAGLINE",
  description: "CLIENT_META_DESCRIPTION — 150-160 characters describing the business",
  yearEstablished: 2005,

  // ── URLs ──
  url: "https://clientdomain.com",
  cmsUrl: "https://cms.clientdomain.com",

  // ── Contact ──
  phone: "(512) 555-1234",
  phoneRaw: "+15125551234",       // For tel: links
  email: "info@clientdomain.com",
  address: {
    street: "123 Main Street",
    suite: "Suite 100",
    city: "Austin",
    state: "Texas",
    stateCode: "TX",
    zip: "78701",
    country: "US",
  },
  businessHours: {
    monday: { open: "08:00", close: "18:00" },
    tuesday: { open: "08:00", close: "18:00" },
    wednesday: { open: "08:00", close: "18:00" },
    thursday: { open: "08:00", close: "18:00" },
    friday: { open: "08:00", close: "18:00" },
    saturday: { open: "09:00", close: "14:00" },
    sunday: null, // closed
  },
  emergencyAvailable: true,

  // ── Social ──
  social: {
    facebook: "https://facebook.com/clientpage",
    instagram: "https://instagram.com/clienthandle",
    linkedin: "https://linkedin.com/company/clientcompany",
    twitter: "https://x.com/clienthandle",
    youtube: "",
    nextdoor: "",
    yelp: "https://yelp.com/biz/client-business",
    bbb: "https://bbb.org/us/tx/austin/profile/plumbing/client-0825-1234567",
    googleBusiness: "https://g.page/client-business",
  },

  // ── Brand ──
  brand: {
    primaryColor: "#1E40AF",
    secondaryColor: "#F59E0B",
    accentColor: "#10B981",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    font: "Inter",
    fontHeading: "Inter",
  },

  // ── SEO Defaults ──
  seo: {
    titleTemplate: "%s | CLIENT_BUSINESS_NAME",
    defaultTitle: "CLIENT_BUSINESS_NAME — Tagline Here",
    defaultDescription: "Default meta description for pages that don't have a custom one.",
    defaultOgImage: "/og-default.png",
    googleSiteVerification: "",  // From Google Search Console
    locale: "en_US",
  },

  // ── Schema.org ──
  schema: {
    type: "Plumber",                      // Or: LegalService, MedicalBusiness, RealEstateAgent, etc.
    additionalTypes: ["HomeAndConstructionBusiness"],
    priceRange: "$$",
    paymentAccepted: ["Cash", "Credit Card", "Check", "Financing Available"],
    areaServed: ["Austin, TX", "Round Rock, TX", "Cedar Park, TX"],
    sameAs: [],                           // Auto-populated from social profiles above
  },

  // ── Analytics ──
  analytics: {
    posthogKey: "",
    googleAnalyticsId: "",
    sentryDsn: "",
  },

  // ── CMS ──
  cms: {
    adminTitle: "CLIENT_NAME Portal",
    adminFavicon: "/favicon.ico",
  },
};
```

#### CSS Custom Properties Template

```css
/* templates/astro-site/src/styles/brand.css — imported in global.css */
:root {
  /* Brand colors — sourced from site.ts / client questionnaire */
  --color-primary: #1E40AF;
  --color-primary-light: #3B82F6;
  --color-primary-dark: #1E3A8A;
  --color-secondary: #F59E0B;
  --color-secondary-light: #FBBF24;
  --color-secondary-dark: #D97706;
  --color-accent: #10B981;
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;

  /* Typography */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-heading: 'Inter', system-ui, sans-serif;

  /* Spacing scale — consistent across all clients */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
}
```

#### Brand Configuration Checklist

- [ ] Logo SVG uploaded to both `templates/next-app/public/` and `templates/astro-site/public/`
- [ ] Logo PNG fallback uploaded to both public directories
- [ ] Favicon.ico (32x32) created and uploaded
- [ ] Apple touch icon (180x180 PNG) created and uploaded
- [ ] Default OG image (1200x630) created with client branding
- [ ] `site.ts` created with all business information populated
- [ ] CSS custom properties updated with client brand colors
- [ ] Payload admin CSS (`custom.css`) updated with client brand colors
- [ ] Admin `Logo.tsx` component created rendering client logo
- [ ] Admin `Icon.tsx` component created rendering client icon
- [ ] Google Fonts loaded for client's font choice (if not system font)
- [ ] Tailwind config updated to reference CSS custom properties
- [ ] All color values tested for WCAG AA contrast compliance (4.5:1 ratio minimum)

---

### 18.5 CMS White-Label Setup Steps Per Client

Every client gets a branded Payload CMS admin panel. This is their content management interface and should feel like their own product, not a generic tool.

#### Step 1: Admin Branding

```typescript
// In payload.config.ts → admin section:
admin: {
  meta: {
    titleSuffix: ` — ${siteConfig.cms.adminTitle}`,
    icons: [
      { url: siteConfig.cms.adminFavicon, type: "image/x-icon" },
    ],
  },
  components: {
    graphics: {
      Logo: "/src/components/admin/Logo",
      Icon: "/src/components/admin/Icon",
    },
    afterDashboard: ["/src/components/admin/WelcomeDashboard"],
  },
}
```

#### Step 2: Welcome Dashboard Component

Create a custom dashboard that greets the client and provides quick links:

```typescript
// src/components/admin/WelcomeDashboard.tsx
import React from "react";

const WelcomeDashboard: React.FC = () => (
  <div style={{ padding: "2rem", maxWidth: "800px" }}>
    <h2>Welcome to Your Content Portal</h2>
    <p>Use the sidebar to manage your website content. Here are common tasks:</p>
    <ul>
      <li><strong>Add a blog post</strong> — Blog Posts → Create New</li>
      <li><strong>Update a service description</strong> — Services → click the service</li>
      <li><strong>Add a testimonial</strong> — Testimonials → Create New</li>
      <li><strong>Upload images</strong> — Media → Create New</li>
    </ul>
    <p><em>Need help? Contact your web team at agency@email.com</em></p>
  </div>
);

export default WelcomeDashboard;
```

#### Step 3: Access Control Configuration

Define three user roles: **Agency Admin** (full access), **Client Admin** (content management), and **Client Editor** (content editing only).

```typescript
// In payload.config.ts → admin.auth or Users collection:
const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  fields: [
    { name: "email", type: "email", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        { label: "Agency Admin", value: "agency-admin" },
        { label: "Client Admin", value: "client-admin" },
        { label: "Editor", value: "editor" },
      ],
      access: {
        // Only agency admins can change roles
        update: ({ req: { user } }) => user?.role === "agency-admin",
      },
    },
  ],
  access: {
    // Agency admins see everything; client admins see all users; editors see only themselves
    read: ({ req: { user } }) => {
      if (user?.role === "agency-admin") return true;
      if (user?.role === "client-admin") return true;
      return { id: { equals: user?.id } };
    },
    create: ({ req: { user } }) => ["agency-admin", "client-admin"].includes(user?.role || ""),
    delete: ({ req: { user } }) => user?.role === "agency-admin",
  },
};
```

#### Step 4: Collection-Level Access Control

```typescript
// Apply to every content collection (Services, Locations, BlogPosts, etc.):
access: {
  // Public read (for API consumers like Astro):
  read: () => true,

  // Agency admins and client admins can create:
  create: ({ req: { user } }) => ["agency-admin", "client-admin"].includes(user?.role || ""),

  // All authenticated users can update (editors can edit content):
  update: ({ req: { user } }) => !!user,

  // Only agency admins can delete (prevents accidental data loss):
  delete: ({ req: { user } }) => user?.role === "agency-admin",
}
```

#### Step 5: Hide Technical Collections from Clients

Some collections should only be visible to agency admins:

```typescript
// For collections like Redirects, Forms configuration:
admin: {
  hidden: ({ user }) => user?.role !== "agency-admin",
}
```

#### Step 6: Lock Down Sensitive Fields

```typescript
// On fields clients should see but not edit (e.g., slug, schema type, technical SEO):
{
  name: "slug",
  type: "text",
  access: {
    update: ({ req: { user } }) => user?.role === "agency-admin",
  },
  admin: {
    readOnly: true, // Visual indicator that this field is locked
    description: "URL slug — managed by your web team",
  },
}
```

#### White-Label Setup Checklist

- [ ] Admin `meta.titleSuffix` set to client name
- [ ] Admin favicon set to client favicon
- [ ] Logo component created and registered
- [ ] Icon component created and registered
- [ ] Welcome dashboard component created with client-specific quick links
- [ ] Admin CSS (`custom.css`) updated with client brand colors
- [ ] Agency admin user created (agency team's login)
- [ ] Client admin user created (client's primary login)
- [ ] Client editor user(s) created if needed
- [ ] Collection access control configured for all three roles
- [ ] Technical collections hidden from client roles
- [ ] Slug and technical fields locked from client editing
- [ ] Live preview URL configured to point at client's frontend domain
- [ ] Test login as each role to verify permissions work correctly

---

### 18.6 Initial Content Requirements

Every client site must have minimum content before launch. Launching with too little content signals a thin or low-quality site to Google. These are non-negotiable minimums.

#### Minimum Content Thresholds

| Content Type | Minimum Before Launch | Ideal Before Launch | Notes |
|---|---|---|---|
| **Services (pillar pages)** | 3 | 5-8 | Each with 1,500-3,000 words of unique content |
| **Sub-services per pillar** | 2 per service | 3-5 per service | Each with 800-1,500 words |
| **Locations** | 5 | 10-20 | Primary city + surrounding suburbs/neighborhoods |
| **Service+Location pages** | 15 (3 services x 5 locations) | 50-100 | Each must have unique intro (150-250 words) + localized content |
| **Blog posts** | 5 | 10-15 | Mix of guides, tips, and local content — minimum 1,000 words each |
| **FAQs** | 5 per service + 5 global | 8-10 per service | Must be genuine questions, not filler |
| **Testimonials** | 5 total, 1 per service minimum | 10-20 total, 3+ per service | Must be real reviews with proper attribution |
| **Team members** | 1 (owner minimum) | Full team | Photo + bio required for each |
| **Media / images** | 10 | 30+ | Service photos, team photos, location photos, branded graphics |
| **Contact form** | 1 | 1-2 | Primary contact form; optional service-specific forms |
| **About page content** | 1 | 1 | Company story, mission, team — minimum 500 words |
| **Privacy Policy** | 1 | 1 | Required by law — use a generator or attorney-reviewed template |
| **Terms of Service** | 1 | 1 | Optional but recommended |

#### Content Quality Standards

Every piece of content must meet these standards before the site goes live:

- [ ] No placeholder text ("Lorem ipsum", "[CITY_NAME]", "TODO", template variables)
- [ ] No duplicate content — every service+location page has a unique intro paragraph
- [ ] All images have descriptive alt text (not "image1.jpg" or empty)
- [ ] All FAQs have substantive answers (minimum 2 sentences, ideally 3-5 sentences)
- [ ] All testimonials have a real name, rating, and service association
- [ ] Blog posts have proper headings (H1, H2, H3 hierarchy), images, and internal links
- [ ] Service descriptions are accurate and reviewed by the client
- [ ] Phone numbers, email addresses, and business hours are correct
- [ ] All links work — no 404s from internal links
- [ ] Content quality score >= 60 on every published service+location page (validated by script)

#### Content Collection Timeline

| Week | Agency Tasks | Client Tasks |
|---|---|---|
| Week 1 | Set up CMS, import CSV data, generate base pages | Complete discovery questionnaire, provide logos/photos |
| Week 2 | AI-generate service+location content, set up blog templates | Review and approve service descriptions, provide testimonials CSV |
| Week 3 | Enrich AI content, add local details, set up forms | Review service+location pages, provide team member info and photos |
| Week 4 | Write/generate blog posts, internal linking, SEO validation | Final review of all content, provide any missing assets |
| Week 5 | Launch prep — performance audit, analytics setup, pre-launch checklist | Review staging site, sign off on launch |

---

### 18.7 SEO Baseline Setup

These steps establish the foundational SEO infrastructure before launch. All must be completed before the site goes live.

#### Google Search Console Setup

1. **Create property**: Go to [search.google.com/search-console](https://search.google.com/search-console)
2. **Add property**: Use "Domain" type verification for `clientdomain.com`
3. **Verify ownership**: Add the TXT record to DNS: `google-site-verification=XXXX`
4. **Alternative verification**: If DNS is not accessible, use HTML meta tag in `<head>`:
   ```html
   <meta name="google-site-verification" content="VERIFICATION_CODE" />
   ```
   Add to `site.ts` as `seo.googleSiteVerification` and render in the base layout
5. **Submit sitemap**: Go to Sitemaps section → Submit `https://clientdomain.com/sitemap.xml`
6. **Request indexing**: After sitemap submission, manually request indexing for the homepage and top pillar pages via URL Inspection tool
7. **Set target country**: Settings → International Targeting → select country
8. **Add users**: Add `agency-team@email.com` as Full user

#### Google Business Profile Setup

1. **Create or claim listing**: [business.google.com](https://business.google.com)
2. **Business name**: Must match exactly what's on the website (NAP consistency)
3. **Category**: Set primary category (e.g., "Plumber") and up to 9 additional categories
4. **Service area**: Define all cities served (matches `locations.csv`)
5. **Hours**: Must match `siteConfig.businessHours` exactly
6. **Phone**: Must match `siteConfig.phone` exactly
7. **Website**: Link to `https://clientdomain.com`
8. **Description**: 750-character business description with primary keywords
9. **Photos**: Upload logo, cover photo, at minimum 5 business photos
10. **Services**: Add all services with descriptions (mirrors CMS services)
11. **Products**: Add key services as "products" with pricing if applicable
12. **Enable messaging**: Turn on Google Business Messages
13. **Enable booking**: If applicable, set up appointment booking
14. **Add posts**: Schedule a "Welcome" post and 2-3 offer/update posts

**NAP Consistency Rule**: Name, Address, and Phone must be IDENTICAL across the website, Google Business Profile, and all directories. Even minor differences (e.g., "St." vs "Street") can hurt local rankings.

#### Analytics Setup

1. **PostHog**: Create project → Get project API key → Add to `site.ts` as `analytics.posthogKey`
2. **Google Analytics (optional)**: Create GA4 property → Get measurement ID → Add to `site.ts` as `analytics.googleAnalyticsId`
3. **Sentry**: Create project → Get DSN → Already configured in both Astro and Next.js templates
4. **Tracking verification**: After deployment, verify all analytics fire correctly on every page type

#### Sitemap Configuration

The Astro site generates the sitemap automatically at `/sitemap.xml` (see [Routing, Sitemaps & Schema Markup](./ROUTING_AND_SITEMAPS.md)). Verify:

- [ ] Sitemap is accessible at `https://clientdomain.com/sitemap.xml`
- [ ] Sitemap includes all published service pages
- [ ] Sitemap includes all published location pages
- [ ] Sitemap includes all published service+location pages
- [ ] Sitemap includes all published blog posts
- [ ] Sitemap does NOT include draft/unpublished pages
- [ ] Sitemap does NOT include admin pages or API endpoints
- [ ] `robots.txt` at `https://clientdomain.com/robots.txt` references the sitemap
- [ ] Sitemap submitted to Google Search Console

#### robots.txt Verification

```text
User-agent: *
Allow: /

Sitemap: https://clientdomain.com/sitemap.xml

# Block admin and API routes
Disallow: /admin
Disallow: /api
Disallow: /_next
```

#### SEO Baseline Checklist

- [ ] Google Search Console property created and verified
- [ ] Sitemap submitted to Google Search Console
- [ ] Homepage manually submitted for indexing via URL Inspection
- [ ] Top 5 pillar pages manually submitted for indexing
- [ ] Google Business Profile created/claimed and fully populated
- [ ] NAP consistency verified across website, GBP, and directories
- [ ] PostHog (or GA4) tracking verified on all page types
- [ ] Sentry error tracking verified
- [ ] robots.txt blocking admin/API routes, allowing all public routes
- [ ] XML sitemap generated correctly with all published URLs
- [ ] Schema.org JSON-LD rendering correctly (test with [schema.org validator](https://validator.schema.org/))
- [ ] Open Graph tags rendering correctly (test with [Facebook Debugger](https://developers.facebook.com/tools/debug/))
- [ ] Canonical URLs set correctly on every page
- [ ] No `noindex` tags on pages that should be indexed
- [ ] SSL certificate active and all pages served over HTTPS
- [ ] HTTP → HTTPS redirect working
- [ ] www → non-www (or vice versa) redirect configured consistently

---

### 18.8 Environment / Deployment Setup Per Client

Every client gets their own isolated infrastructure. Nothing is shared between clients except the codebase template.

#### Per-Client Infrastructure

| Component | Instance | Why Separate |
|---|---|---|
| **Supabase project** | 1 per client | Isolated database, storage, and auth — prevents data leaks between clients |
| **Vercel project (Next.js)** | 1 per client | CMS admin panel + API — separate deployment, separate domain |
| **Vercel project (Astro)** | 1 per client | Public-facing website — separate deployment, custom domain |
| **Domain** | 1 per client | Client's custom domain |
| **Sentry project** | 1 per client | Isolated error tracking |
| **PostHog project** | 1 per client (or shared with property) | Analytics — can use one project with property filters, or separate projects |

#### Step-by-Step Setup

**1. Create Supabase Project**

```bash
# Via Supabase Dashboard (dashboard.supabase.com):
# 1. Create new organization (or use existing agency org)
# 2. Create new project: "Client Name Website"
# 3. Select region closest to client's audience
# 4. Generate and save the database password securely

# Record these values for .env:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres.[project-ref]:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**2. Configure Supabase Storage**

```bash
# In Supabase Dashboard → Storage:
# 1. Create bucket: "media" (public)
# 2. Set CORS policy to allow client domain
# 3. Record S3-compatible credentials:

S3_BUCKET=media
S3_ENDPOINT=https://xxxx.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=xxxx       # From Supabase Dashboard → Settings → API
S3_SECRET_ACCESS_KEY=xxxx
S3_REGION=us-east-1          # Or appropriate region
```

**3. Clone and Configure Repository**

```bash
# Option A: Use create-site CLI
npx @agency/create-site client-project-name

# Option B: Manual clone
git clone https://github.com/agency/website-template.git client-project-name
cd client-project-name
pnpm install

# Configure environment
cp templates/next-app/.env.example templates/next-app/.env
cp templates/astro-site/.env.example templates/astro-site/.env
# Fill in all environment variables from steps above
```

**4. Run Database Migrations**

```bash
# Push Payload CMS schema to Supabase:
cd templates/next-app
pnpm payload migrate
```

**5. Create Initial Admin User**

```bash
# Start the dev server and create the first admin user:
pnpm dev
# Navigate to http://localhost:3158/admin
# Create the agency admin account
```

**6. Deploy to Vercel**

```bash
# Next.js (CMS + API):
# 1. Import repository in Vercel Dashboard
# 2. Set root directory: templates/next-app
# 3. Set framework preset: Next.js
# 4. Add all environment variables
# 5. Set custom domain: cms.clientdomain.com

# Astro (Public site):
# 1. Create second Vercel project from same repo
# 2. Set root directory: templates/astro-site
# 3. Set framework preset: Astro
# 4. Add environment variables (PAYLOAD_API_URL, SITE_URL)
# 5. Set custom domain: clientdomain.com
```

**7. Configure Domain DNS**

```text
# For the public site (clientdomain.com):
Type: CNAME
Name: @
Value: cname.vercel-dns.com

# For the CMS (cms.clientdomain.com):
Type: CNAME
Name: cms
Value: cname.vercel-dns.com

# For email (if applicable):
Type: MX
# ... standard email records
```

**8. Generate Secrets**

```bash
# Payload secret (used for JWT signing):
openssl rand -hex 32
# → Set as PAYLOAD_SECRET in Vercel env vars

# Webhook secret (for CRM sync):
openssl rand -hex 16
# → Set as WEBHOOK_SECRET in Vercel env vars
```

#### Environment Variables Inventory

All environment variables needed per client, with source:

```bash
# ── Database (from Supabase Dashboard) ──
DATABASE_URL=                          # Connection string → Supabase → Settings → Database
NEXT_PUBLIC_SUPABASE_URL=              # Project URL → Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Anon key → Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=             # Service role key → Supabase → Settings → API

# ── Application Secrets (generate per client) ──
PAYLOAD_SECRET=                        # openssl rand -hex 32
WEBHOOK_SECRET=                        # openssl rand -hex 16

# ── Site Configuration ──
SITE_URL=https://clientdomain.com      # Client's public domain
PAYLOAD_API_URL=https://cms.clientdomain.com/api   # CMS API endpoint

# ── Media Storage (from Supabase Dashboard) ──
S3_BUCKET=media
S3_ENDPOINT=                           # Supabase → Settings → API → S3 endpoint
S3_ACCESS_KEY_ID=                      # Supabase → Settings → API
S3_SECRET_ACCESS_KEY=                  # Supabase → Settings → API
S3_REGION=us-east-1

# ── Monitoring (from respective dashboards) ──
SENTRY_DSN=                            # Sentry → Project → Settings → Client Keys
SENTRY_AUTH_TOKEN=                     # Sentry → Settings → Auth Tokens
NEXT_PUBLIC_POSTHOG_KEY=               # PostHog → Project → Settings

# ── Email (from Resend dashboard) ──
RESEND_API_KEY=                        # Resend → API Keys

# ── CRM (from Twenty CRM) ──
TWENTY_API_URL=                        # Twenty CRM instance URL
TWENTY_API_KEY=                        # Twenty CRM → Settings → API Keys

# ── SEO Verification ──
GOOGLE_SITE_VERIFICATION=             # Google Search Console → Settings
```

#### Deployment Setup Checklist

- [ ] Supabase project created with unique database
- [ ] Supabase storage bucket "media" created (public access)
- [ ] Repository cloned and configured for client
- [ ] All environment variables set in `.env` for local development
- [ ] Database migrations run successfully
- [ ] Initial agency admin user created in CMS
- [ ] Vercel project created for Next.js (CMS)
- [ ] Vercel project created for Astro (public site)
- [ ] All environment variables set in Vercel for both projects
- [ ] Custom domain configured for public site (clientdomain.com)
- [ ] Custom domain configured for CMS (cms.clientdomain.com)
- [ ] SSL certificates active on both domains
- [ ] DNS records configured correctly
- [ ] PAYLOAD_SECRET generated and set
- [ ] S3 storage working (test media upload in CMS)
- [ ] Sentry project created and DSN configured
- [ ] PostHog project created (or property configured in shared project)
- [ ] Build and deploy both projects successfully
- [ ] Verify CMS accessible at cms.clientdomain.com/admin
- [ ] Verify public site accessible at clientdomain.com

---

### 18.9 Client Training Plan

The goal of client training is to make clients self-sufficient for day-to-day content management while keeping them from breaking anything. Training should happen after content is loaded but before handoff.

#### What Clients CAN Do (Train On These)

| Task | How | Time to Train |
|---|---|---|
| **Add/edit blog posts** | Blog Posts → Create New → fill fields → Save Draft → Publish | 15 min |
| **Upload images** | Media → Create New → drag image → fill alt text → Save | 5 min |
| **Edit service descriptions** | Services → click service → edit text → Save | 10 min |
| **Add testimonials** | Testimonials → Create New → fill fields → Save | 5 min |
| **Add FAQs** | FAQs → Create New → fill question + answer → link to service → Save | 5 min |
| **Update team members** | Team Members → click member → update info → Save | 5 min |
| **Update business hours** | Global Settings → Business Hours → update → Save | 5 min |
| **View form submissions** | Form Submissions → browse/filter/export | 5 min |
| **Preview changes** | Click "Live Preview" button to see changes before publishing | 5 min |
| **Schedule blog posts** | Set publish date in the future → status remains "draft" until then | 5 min |
| **Export data** | Use Import/Export plugin to download CSV backups | 5 min |

#### What Clients Should NOT Do (Lock Down or Warn)

| Action | Risk | Prevention |
|---|---|---|
| **Delete services or locations** | Breaks page generation, creates 404s | Delete access restricted to agency-admin role |
| **Change URL slugs** | Breaks existing links, SEO rankings, and internal linking | Slug field locked to agency-admin role |
| **Edit SEO fields directly** | Can introduce errors, duplicate titles, or keyword stuffing | SEO fields auto-generated; manual override visible but marked "Advanced" |
| **Modify page layouts/blocks** | Can break page structure | Block editing restricted to agency-admin role (or provide limited block options) |
| **Delete media that's in use** | Breaks images on published pages | Payload prevents deleting media referenced by other documents |
| **Create new collections** | CMS misconfiguration | Admin UI hidden; requires code changes anyway |
| **Change user roles** | Security risk | Role field update restricted to agency-admin |

#### Training Delivery Format

1. **Live walkthrough** (60 minutes): Screen-share session covering all "CAN do" tasks
2. **Recorded video** (30 minutes): Screen recording of the live walkthrough for future reference
3. **Quick-reference guide** (1 page PDF): Task → Steps → Screenshot format for the most common tasks
4. **Support channel**: Slack channel or email for questions during the first 30 days

#### Training Session Agenda

```text
1. Introduction to Your Content Portal (5 min)
   - Log in at cms.clientdomain.com/admin
   - Tour the dashboard and sidebar navigation
   - Explain the Save / Draft / Publish workflow

2. Managing Blog Posts (15 min)
   - Create a new blog post from scratch
   - Upload and insert images
   - Add internal links to service pages
   - Set categories and tags
   - Save as draft, preview, and publish
   - Schedule a post for future publication

3. Managing Testimonials & FAQs (10 min)
   - Add a new testimonial with all fields
   - Add a new FAQ linked to a specific service
   - Explain sort order

4. Editing Service Content (10 min)
   - Find and open a service page
   - Edit the description text
   - Note: slug and technical fields are locked — contact agency to change
   - Save and preview

5. Uploading Media (5 min)
   - Upload images (JPG, PNG, WebP)
   - Always fill in alt text (explain why for accessibility + SEO)
   - Where uploaded images appear on the site

6. Viewing Form Submissions (5 min)
   - Where form submissions appear
   - How to filter and export

7. What NOT to Do (5 min)
   - Don't delete services or locations
   - Don't change URLs/slugs
   - If something looks wrong, contact agency — don't try to fix it

8. Q&A (5 min)
```

---

### 18.10 Handoff Checklist

This is the final verification before giving the client access to their live site. Every item must be checked by the agency team member performing the handoff.

#### Pre-Handoff Technical Verification

- [ ] **DNS propagation complete** — `dig clientdomain.com` returns correct Vercel CNAME
- [ ] **SSL active** — `https://clientdomain.com` loads with valid certificate, no mixed content warnings
- [ ] **HTTP redirects** — `http://clientdomain.com` redirects to `https://clientdomain.com`
- [ ] **www redirect** — `www.clientdomain.com` redirects to `clientdomain.com` (or vice versa, consistently)
- [ ] **CMS accessible** — `cms.clientdomain.com/admin` loads login page
- [ ] **CMS login works** — Agency admin can log in and access all collections
- [ ] **Client login works** — Client admin can log in and sees appropriate collections
- [ ] **Media uploads work** — Upload an image, verify it displays on the frontend
- [ ] **Contact form works** — Submit a test form, verify it appears in Form Submissions and email notification is sent
- [ ] **CRM sync works** — Form submission creates a record in Twenty CRM (if configured)

#### Pre-Handoff Content Verification

- [ ] **All services listed correctly** — Names, descriptions, pricing, images
- [ ] **All locations listed correctly** — City names, addresses, phone numbers
- [ ] **Service+location pages rendering** — Spot-check 5 random pages for correct content
- [ ] **No placeholder content visible** — Search frontend for "[", "TODO", "Lorem", "REPLACE", "CLIENT"
- [ ] **All images loading** — No broken image icons on any page
- [ ] **All internal links working** — Run a link checker (e.g., `npx broken-link-checker https://clientdomain.com`)
- [ ] **Phone numbers correct** — Click-to-call links work, correct number on all pages
- [ ] **Email addresses correct** — Contact email correct in footer, schema, and forms
- [ ] **Business hours correct** — Match what client provided in questionnaire
- [ ] **Privacy policy published** — Accessible from footer link
- [ ] **Client has reviewed and approved all content** — Written sign-off from client

#### Pre-Handoff SEO Verification

- [ ] **Google Search Console verified** — Property showing "verified" status
- [ ] **Sitemap submitted** — Shows as "submitted" in GSC with pages discovered
- [ ] **Google Business Profile live** — Listing shows in Google Maps search
- [ ] **Schema.org validates** — Test homepage + 1 service page + 1 location page with schema validator
- [ ] **Open Graph validates** — Test homepage + 1 blog post with Facebook Debugger
- [ ] **Robots.txt correct** — Verify at `clientdomain.com/robots.txt`
- [ ] **Canonical URLs correct** — View source on 3 pages, verify canonical tag
- [ ] **No accidental noindex** — Check meta robots tag on 5 random pages
- [ ] **Page titles unique** — Spot-check 5 service+location pages for unique titles
- [ ] **Meta descriptions unique** — Spot-check 5 service+location pages for unique descriptions

#### Pre-Handoff Performance Verification

- [ ] **Lighthouse audit** — Run on homepage, 1 service page, 1 blog post — all scores > 90
- [ ] **Mobile responsive** — Check homepage + 3 pages on mobile viewport
- [ ] **Core Web Vitals passing** — LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] **Page load time** — Homepage loads in < 3 seconds on 3G connection
- [ ] **Images optimized** — WebP/AVIF format, lazy loading on below-fold images

#### Pre-Handoff Analytics Verification

- [ ] **PostHog (or GA4) recording events** — Load a page, verify event appears in dashboard
- [ ] **Sentry capturing errors** — Check Sentry project for any unresolved errors from build/deploy
- [ ] **Form conversion tracking** — Submit form, verify conversion event fires
- [ ] **Page type metadata** — Verify analytics events include `page_type`, `service_name`, `location_city`

#### Handoff Communication

- [ ] **Send login credentials** to client admin (email with CMS URL + temporary password, require change on first login)
- [ ] **Send training recording** link
- [ ] **Send quick-reference PDF**
- [ ] **Introduce support channel** (Slack or email)
- [ ] **Schedule 2-week check-in call** to answer questions after they've used the CMS
- [ ] **Document the project** in agency's internal project tracker with all credentials, domains, and configuration notes

---

### 18.11 Post-Launch Monitoring Setup

After launch, the agency monitors the site's health and SEO performance. This is divided into three phases.

#### First 30 Days — Establish Baseline

**Weekly tasks:**

- [ ] Check Google Search Console for crawl errors → fix any 404s or server errors
- [ ] Check Google Search Console → Coverage report → ensure pages are being indexed
- [ ] Review Sentry for any runtime errors → fix or suppress known non-issues
- [ ] Check PostHog/GA4 for traffic patterns → establish baseline numbers
- [ ] Monitor form submissions → verify CRM sync is working
- [ ] Check Core Web Vitals in GSC → flag any pages failing thresholds
- [ ] Respond to any client support questions

**End-of-month report (deliver to client):**

| Metric | Value | Status |
|---|---|---|
| Pages indexed (GSC) | XX / XX total | On track / Needs attention |
| Total impressions (GSC) | XX | Baseline established |
| Total clicks (GSC) | XX | Baseline established |
| Average position (GSC) | XX | Baseline established |
| Top 5 queries | list | Informational |
| Core Web Vitals | Pass / Fail | Fix if failing |
| Crawl errors | XX | Fix all |
| Uptime | XX% | Target: 99.9% |
| Form submissions | XX | Baseline |
| Analytics events firing | Yes / No | Must be Yes |

#### Days 31-60 — Growth Phase

**Weekly tasks:**

- [ ] Compare GSC metrics to previous week — look for indexing progress
- [ ] Identify top-performing pages by impressions and clicks
- [ ] Identify underperforming pages (indexed but zero clicks) — flag for content improvement
- [ ] Check for manual actions or security issues in GSC
- [ ] Publish 1-2 new blog posts (agency or client)
- [ ] Review and respond to new Google Business Profile reviews
- [ ] Check competitor rankings for shared keywords

**Actions based on data:**

| Signal | Action |
|---|---|
| Pages not getting indexed | Check for thin content, improve uniqueness, request reindexing |
| High impressions, low clicks | Improve meta titles and descriptions (CTR optimization) |
| Keywords ranking 5-15 | Target these with content improvements — they're close to page 1 |
| 404 errors increasing | Check for broken links, implement redirects |
| Core Web Vitals degrading | Audit recent changes, optimize images, reduce JS |

#### Days 61-90 — Optimization Phase

**Bi-weekly tasks:**

- [ ] Full content audit — which pages are performing, which need improvement
- [ ] Keyword gap analysis — what competitors rank for that client doesn't
- [ ] Backlink profile check — monitor new backlinks, disavow toxic links if needed
- [ ] Content refresh — update top pages with new information, additional FAQs
- [ ] Internal linking audit — verify no orphan pages, all link rules followed
- [ ] Technical SEO audit — run Screaming Frog or similar crawler

**90-Day Report (deliver to client):**

| Metric | Day 1 | Day 30 | Day 60 | Day 90 | Trend |
|---|---|---|---|---|---|
| Pages indexed | 0 | XX | XX | XX | direction |
| Total impressions | 0 | XX | XX | XX | direction |
| Total clicks | 0 | XX | XX | XX | direction |
| Average position | - | XX | XX | XX | direction |
| Keywords on page 1 | 0 | XX | XX | XX | direction |
| Keywords on page 2 | 0 | XX | XX | XX | direction |
| Organic traffic | 0 | XX | XX | XX | direction |
| Form submissions | 0 | XX | XX | XX | direction |
| Google Business reviews | XX | XX | XX | XX | direction |
| Core Web Vitals | - | Pass/Fail | Pass/Fail | Pass/Fail | - |

#### Ongoing Monitoring (After 90 Days)

After the initial 90-day period, shift to monthly monitoring:

- Monthly GSC performance review
- Monthly content publication (1-2 blog posts minimum)
- Quarterly full technical SEO audit
- Quarterly content refresh of top-performing pages
- Annual site-wide audit and strategy review
- Continuous uptime monitoring (use Vercel's built-in or UptimeRobot)

#### Monitoring Tools Setup Checklist

- [ ] Google Search Console — verified and monitored
- [ ] Google Business Profile — monitored for reviews and questions
- [ ] PostHog / GA4 — dashboard created with key metrics
- [ ] Sentry — alert rules configured for critical errors
- [ ] UptimeRobot (or similar) — monitoring both clientdomain.com and cms.clientdomain.com
- [ ] Monthly report template created (Google Sheets or similar)
- [ ] Calendar reminders set for weekly/monthly review tasks

---

### 18.12 Template for Client-Specific CLAUDE.md

Every client project needs a `CLAUDE.md` file at the repository root so that any Claude Code instance can immediately understand the project context and work effectively. This is a template — fill in the bracketed values per client.

````markdown
# [CLIENT_NAME] — Website Project

## Project Overview
- **Client**: [CLIENT_BUSINESS_NAME] ([clientdomain.com])
- **Industry**: [plumbing / legal / healthcare / real estate / etc.]
- **Stack**: Payload CMS + Astro + Next.js + Supabase (Agency Web Stack)
- **CMS Admin**: [cms.clientdomain.com/admin]
- **Public Site**: [clientdomain.com]

## Architecture
- `templates/next-app/` — Payload CMS admin panel + REST API (Next.js)
- `templates/astro-site/` — Public-facing website (Astro, static generation)
- `packages/shared/` — Shared utilities and types
- `supabase/` — Database migrations and configuration

## Key Configuration Files
- `templates/astro-site/src/config/site.ts` — All site-wide configuration (brand, contact, SEO)
- `templates/next-app/src/payload.config.ts` — CMS configuration, plugins, collections
- `templates/next-app/src/collections/` — Payload collection definitions
- `templates/next-app/src/blocks/` — Payload block definitions
- `templates/astro-site/src/pages/` — Astro page routes

## Industry-Specific Notes
- Schema.org type: [Plumber / LegalService / MedicalBusiness / RealEstateAgent]
- [Any industry-specific fields added to collections]
- [Any compliance requirements: HIPAA, bar association rules, etc.]
- [Special terminology: "services" vs "practice areas" vs "treatments"]

## Collections Reference
| Collection | Slug | Current Count | Notes |
|---|---|---|---|
| Services | services | [XX] | [Pillar pages — do not delete] |
| Locations | locations | [XX] | [Service areas — do not delete] |
| Service Pages | service-pages | [XX] | [Service+location combos — auto-generated] |
| Blog Posts | blog-posts | [XX] | [Client manages these] |
| FAQs | faqs | [XX] | [Linked to services and locations] |
| Testimonials | testimonials | [XX] | [From Google, Yelp, direct] |
| Team Members | team-members | [XX] | [Client team] |
| Media | media | [XX] | [Images and documents] |

## API Access
- **Local**: `http://localhost:3158/api`
- **Production**: `https://cms.clientdomain.com/api`
- **Auth**: API key or JWT token from Payload auth
- **Common queries**:
  - All published services: `GET /api/services?where[status][equals]=published&depth=1`
  - Service by slug: `GET /api/services?where[slug][equals]=SLUG`
  - Service pages for a location: `GET /api/service-pages?where[location][equals]=LOCATION_ID&depth=2`

## Environment Variables
Required env vars are documented in `.env.example` files in both template directories.
- **Supabase project**: [project-ref].supabase.co
- **Vercel projects**: [next-app-project-name], [astro-site-project-name]
- **Sentry project**: [sentry-project-slug]

## Development Commands
```bash
# Start everything locally:
pnpm dev:supabase           # Start local Supabase
pnpm dev:next               # Start CMS at localhost:3158
pnpm dev:astro              # Start public site at localhost:4458

# Database:
cd templates/next-app && pnpm payload migrate    # Run migrations

# Build:
pnpm build:next             # Build CMS
pnpm build:astro            # Build public site (fetches from CMS API)

# Seed data:
pnpm tsx scripts/seed-services.ts
pnpm tsx scripts/seed-locations.ts
pnpm tsx scripts/seed-service-pages.ts
```

## Content Generation Rules
- All service+location pages must have a **unique intro paragraph** (150-250 words)
- Content quality score must be >= 60 before publishing
- Every page must have exactly one H1 tag
- Blog posts must link to at least 1 pillar page and 1-2 cluster pages
- FAQ answers must be substantive (minimum 2 sentences)
- All images must have descriptive alt text

## SEO Requirements
- Title pattern: "[Service] in [City], [State] | [CLIENT_NAME]"
- Schema.org types: [List all types used]
- Sitemap: Auto-generated at /sitemap.xml
- Internal linking rules: See PROGRAMMATIC_SEO_BLUEPRINT.md [Section 10: Pillar Pages, Topic Clusters and Linking Architecture](./PROGRAMMATIC_SEO_BLUEPRINT.md#10-pillar-pages-topic-clusters-and-linking-architecture)

## Client-Specific Customizations
- [Document any deviations from the standard template]
- [Custom blocks added for this client]
- [Custom fields added to collections]
- [Third-party integrations specific to this client]
- [Redirects from old site: list or reference redirect file]

## Access & Credentials
- **Supabase Dashboard**: dashboard.supabase.com → [org-name] → [project-name]
- **Vercel Dashboard**: vercel.com → [team-name] → [project-name]
- **Google Search Console**: search.google.com → [clientdomain.com]
- **Google Business Profile**: business.google.com → [listing-name]
- **Sentry**: [org].sentry.io → [project]
- **PostHog**: app.posthog.com → [project]
- **Domain Registrar**: [registrar] → [clientdomain.com]

## Important Warnings
- DO NOT delete Services or Locations — this breaks page generation and SEO
- DO NOT change URL slugs without setting up 301 redirects first
- DO NOT deploy Astro without ensuring the CMS API is accessible (build will fail)
- DO NOT modify payload.config.ts without running `pnpm payload migrate` afterward
- All content changes should go through the CMS admin panel, not direct database edits
````

---

### 18.13 Complete Onboarding Workflow Summary

For quick reference, here is the entire onboarding process as a sequential checklist with time estimates:

#### Phase 1: Discovery & Planning (Days 1-3)

- [ ] Send client discovery questionnaire ([Section 18.1](#181-client-discovery-questionnaire))
- [ ] Receive completed questionnaire
- [ ] Send CSV data templates ([Section 18.2](#182-data-collection-templates))
- [ ] Identify industry vertical and plan collection adaptations ([Section 18.3](#183-industry-specific-collection-configuration))
- [ ] Receive client assets: logo, photos, brand colors, content CSVs
- [ ] Review competitor websites (3-5 competitors)
- [ ] Draft keyword strategy for top services + locations

#### Phase 2: Infrastructure Setup (Days 3-5)

- [ ] Create Supabase project ([Section 18.8](#188-environment--deployment-setup-per-client))
- [ ] Clone repository and configure environment
- [ ] Apply industry-specific collection configuration ([Section 18.3](#183-industry-specific-collection-configuration))
- [ ] Configure brand assets and site.ts ([Section 18.4](#184-brand-configuration-checklist))
- [ ] Set up CMS white-labeling ([Section 18.5](#185-cms-white-label-setup-steps-per-client))
- [ ] Deploy to Vercel (staging environment)
- [ ] Run database migrations
- [ ] Create admin user accounts
- [ ] Write client-specific CLAUDE.md ([Section 18.12](#1812-template-for-client-specific-claudemd))

#### Phase 3: Content Loading (Days 5-12)

- [ ] Import services CSV via seed script
- [ ] Import locations CSV via seed script
- [ ] Generate service+location pages via seed script
- [ ] Import FAQs via seed script
- [ ] Import testimonials via seed script
- [ ] Import team members via seed script
- [ ] Upload media assets (logos, photos, gallery)
- [ ] AI-generate unique content for service+location pages
- [ ] Enrich content with local details
- [ ] Create initial blog posts (5 minimum)
- [ ] Run content quality validation script
- [ ] Client reviews and approves all content

#### Phase 4: SEO & Analytics Setup (Days 12-15)

- [ ] Set up Google Search Console ([Section 18.7](#187-seo-baseline-setup))
- [ ] Set up Google Business Profile ([Section 18.7](#187-seo-baseline-setup))
- [ ] Configure PostHog/GA4 analytics ([Section 18.7](#187-seo-baseline-setup))
- [ ] Configure Sentry error tracking
- [ ] Verify sitemap generation
- [ ] Verify robots.txt
- [ ] Verify schema.org on all page types
- [ ] Run full SEO validation script

#### Phase 5: Quality Assurance (Days 15-18)

- [ ] Run complete handoff checklist ([Section 18.10](#1810-handoff-checklist))
- [ ] Lighthouse audit on all page types
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Broken link check
- [ ] Form submission test (end-to-end: form → email → CRM)
- [ ] Performance audit (Core Web Vitals)

#### Phase 6: Launch (Day 18-20)

- [ ] Configure production domain DNS
- [ ] Deploy production builds
- [ ] Verify SSL and redirects
- [ ] Submit sitemap to Google Search Console
- [ ] Request indexing for homepage and pillar pages
- [ ] Publish Google Business Profile posts
- [ ] Notify client of launch

#### Phase 7: Training & Handoff (Days 20-22)

- [ ] Conduct live training session with client ([Section 18.9](#189-client-training-plan))
- [ ] Record training session for future reference
- [ ] Send login credentials
- [ ] Send quick-reference guide PDF
- [ ] Set up support channel (Slack or email)
- [ ] Schedule 2-week check-in call

#### Phase 8: Post-Launch Monitoring (Days 22-90)

- [ ] Set up monitoring tools ([Section 18.11](#1811-post-launch-monitoring-setup))
- [ ] Week 1-4: Weekly GSC and analytics review
- [ ] Day 30: Deliver first monthly report to client
- [ ] Day 31-60: Growth phase monitoring and content additions
- [ ] Day 60: Deliver second monthly report
- [ ] Day 61-90: Optimization phase based on data
- [ ] Day 90: Deliver comprehensive 90-day report with strategy recommendations

**Total estimated time per client: 15-22 business days from kickoff to launch, plus 90 days of post-launch monitoring.**

---
