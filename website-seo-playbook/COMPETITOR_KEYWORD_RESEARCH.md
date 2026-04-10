# Competitor Analysis & Keyword Research Process — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers competitor identification, keyword research workflows, search intent mapping, prioritization frameworks, and repeatable client onboarding processes for programmatic SEO targeting service-area businesses.

---

## Table of Contents

1. [The Research-First Approach](#1-the-research-first-approach)
2. [Competitor Identification](#2-competitor-identification)
3. [Competitor Analysis Framework](#3-competitor-analysis-framework)
4. [Keyword Research Process for Service Businesses](#4-keyword-research-process-for-service-businesses)
5. [Service Keyword Research](#5-service-keyword-research)
6. [Location Keyword Research](#6-location-keyword-research)
7. [Keyword Difficulty Assessment](#7-keyword-difficulty-assessment)
8. [Search Intent Classification](#8-search-intent-classification)
9. [Keyword-to-Page Mapping](#9-keyword-to-page-mapping)
10. [Prioritization Framework](#10-prioritization-framework)
11. [Content Gap Analysis](#11-content-gap-analysis)
12. [SERP Analysis](#12-serp-analysis)
13. [Keyword Research Tools Comparison](#13-keyword-research-tools-comparison)
14. [Storing and Managing Keyword Data](#14-storing-and-managing-keyword-data)
15. [Repeatable Client Onboarding Keyword Research Workflow](#15-repeatable-client-onboarding-keyword-research-workflow)

---

## 1. The Research-First Approach

### Why Research Before Building

Programmatic SEO for service-area businesses produces hundreds or thousands of pages through template-based generation. Every structural decision — URL patterns, page types, internal linking logic, content templates — gets multiplied across every combination of service and location. A mistake in the foundation does not affect one page. It affects every page the system generates.

Research before building means you understand:

- **Which keywords actually have search volume** — not every service variation people search for, and not every city has enough demand to justify a dedicated page.
- **What the competitive landscape looks like** — a plumber in a metro area of 4 million faces different competition than one in a town of 15,000. The strategy must reflect this.
- **What Google already rewards** — the sites ranking on page one for your target keywords reveal what content depth, page structure, and authority signals Google currently favors for that vertical and geography.
- **Where the gaps are** — competitors often miss entire service categories, underserve specific neighborhoods, or fail to address commercial-intent queries. These gaps are where programmatic pages gain traction fastest.

### What Happens When You Skip Keyword Research on Programmatic Sites

| Failure Mode | What Happens | Cost to Fix |
|---|---|---|
| **Thin content at scale** | You generate 500 pages for city+service combos nobody searches for. Google sees thin/duplicate content, depresses crawl rate across the entire domain. | Noindexing or deleting hundreds of pages, waiting 3-6 months for recovery. |
| **Keyword cannibalization** | Multiple page types target the same keyword (e.g., a blog post and a service page both targeting "emergency plumber Dallas"). Google splits authority between them, neither ranks. | Consolidating pages, setting up redirects, rebuilding internal link structure. |
| **Wrong page types for intent** | You build transactional service pages for informational queries, or blog posts for queries where Google shows local packs. Users bounce, rankings drop. | Restructuring entire page type taxonomy. |
| **Missing high-value keywords** | You never discover that "sewer line replacement" has 3x the volume and 5x the revenue of "drain cleaning" in the client's city. You optimize for the wrong terms. | Opportunity cost — months of traffic and leads lost. |
| **Over-building low-value pages** | You generate pages for 200 zip codes when only 30 have meaningful search volume. Google's crawl budget gets wasted on pages that will never rank. | Pruning content, managing redirects, crawl budget recovery. |
| **Structural lock-in** | Your URL structure doesn't accommodate the keyword patterns you later discover matter. Changing URLs after launch means redirect chains, lost link equity, and ranking volatility. | Full URL migration with all associated risks. |

### The Research-First Principle

**Never generate a single programmatic page until you have:**

1. Identified the top 5-10 organic competitors for the client's primary service+city combos
2. Mapped the full keyword universe for every service the client offers
3. Classified search intent for every target keyword cluster
4. Assigned primary and secondary keywords to each planned page type
5. Validated that every programmatic page template addresses a keyword cluster with proven search demand
6. Confirmed your planned URL structure accommodates the keyword hierarchy

Research is not a phase that ends. It is a recurring process. The initial research determines the site architecture. Ongoing research identifies new keyword opportunities, detects ranking changes, and informs content refresh cycles.

---

## 2. Competitor Identification

### Three Categories of Competitors

For any service-area business, you face three distinct types of competitors in search results. Each requires different analysis and different strategic responses.

#### 2.1 Direct Competitors (Same Service, Same City)

These are local businesses offering the same services in the same geographic area. They compete for the same customers and the same local pack positions.

**How to find them:**

1. **Google Search** — Search the client's top 5 service+city keywords (e.g., "plumber Austin TX", "AC repair Austin", "water heater installation Austin"). Record every local business appearing in:
   - Local Pack (Map Pack / 3-Pack)
   - Organic results (positions 1-20)
   - Local Service Ads (LSAs) if present
   - Google Ads (paid results)

2. **Google Maps** — Search directly in Google Maps for each service. Zoom to the client's service area. Note businesses with high review counts and ratings — these are the established players.

3. **Google Business Profile (GBP) Insights** — If the client already has a GBP, the "Competitors" or related business section shows who Google considers peers.

4. **Yelp, BBB, HomeAdvisor** — Search these directories for the service+city. Top-listed businesses with many reviews are direct competitors.

5. **Client Interview** — Ask the client: "Who do you lose jobs to? Who are the other trucks you see in your service area? Who do your customers mention they also got quotes from?"

**What to record for each direct competitor:**

```
Company Name:
Website URL:
GBP URL:
GBP Review Count:
GBP Average Rating:
Services Listed:
Cities/Areas Served:
Years in Business:
Estimated Company Size:
Domain Authority (DA/DR):
Estimated Organic Traffic:
```

Aim to identify **8-15 direct competitors** per client.

#### 2.2 Indirect Competitors (National Brands & Aggregators)

These are not local businesses but dominate search results for service keywords through domain authority, content volume, or paid placement.

**Common indirect competitors by vertical:**

| Vertical | Indirect Competitors |
|---|---|
| Plumbing | Angi (Angie's List), Thumbtack, HomeAdvisor, Roto-Rooter, Mr. Rooter, Benjamin Franklin Plumbing |
| HVAC | Angi, Thumbtack, Trane, Carrier, One Hour Heating & Air, This Old House |
| Electrical | Angi, Thumbtack, Mr. Electric, HomeAdvisor, Mister Sparky |
| Roofing | Angi, Thumbtack, HomeAdvisor, GAF, Angi Leads, Roofing Contractor Magazine |
| General | Yelp, Nextdoor, Bark, Porch, Houzz, TaskRabbit, Google Guaranteed/LSAs |

**How to find them:**

1. Search the client's target keywords and note any non-local-business result ranking on page one.
2. Look for results from directories, franchises, manufacturers, or content publishers.
3. Check who is bidding on the same keywords in Google Ads.

**Why they matter:**

- They reveal the realistic difficulty of ranking — if Angi, Yelp, and HomeAdvisor hold 3 of the top 10 organic positions, your organic ceiling is effectively position 4-10 in that SERP.
- They show what content formats Google rewards — aggregators often rank with comparison pages, cost guides, and "how to hire" content that local businesses rarely create.
- They expose keyword opportunities the aggregators miss — hyper-local terms, specific service variations, and emergency/urgency queries where local businesses have an advantage.

#### 2.3 Content Competitors (Blogs, Publications, Informational Sites)

These are websites that rank for informational and commercial-investigation keywords related to the client's services but do not provide the service themselves.

**Examples:**

- Bob Vila, This Old House, Family Handyman (home improvement publishers)
- Forbes Home, Bankrate, NerdWallet (cost/finance content)
- Reddit threads, Quora answers
- YouTube channels (video results appearing in SERPs)
- Local news sites with home improvement sections
- University extension service publications (for HVAC efficiency, etc.)

**How to find them:**

1. Search informational queries: "how much does [service] cost in [city]", "signs you need [service]", "DIY vs professional [service]"
2. Search "People Also Ask" queries related to the client's services
3. Use Ahrefs/SEMrush Content Explorer to find top-performing content for service-related topics

**Why they matter:**

- They define the content quality bar for informational keywords
- They reveal content formats that earn featured snippets and PAA boxes
- They show topical depth expectations — if a This Old House article covers 15 subtopics about water heater installation, your programmatic page template needs comparable depth
- Blog content strategy should specifically target keywords these publishers rank for, using local expertise as a differentiator

### Competitor Identification Template

Use the following template for each new client. Fill in during the onboarding research phase.

```markdown
## Competitor Identification — [Client Name]

### Direct Competitors
| # | Company | Website | DA/DR | GBP Reviews | GBP Rating | Est. Organic Traffic | Key Services |
|---|---------|---------|-------|-------------|------------|---------------------|--------------|
| 1 |         |         |       |             |            |                     |              |
| 2 |         |         |       |             |            |                     |              |
| 3 |         |         |       |             |            |                     |              |
| ... | | | | | | | |

### Indirect Competitors (National/Aggregators)
| # | Brand | URL | DA/DR | Est. Organic Traffic | Content Types | Keywords Overlap |
|---|-------|-----|-------|---------------------|---------------|-----------------|
| 1 |       |     |       |                     |               |                 |
| 2 |       |     |       |                     |               |                 |
| ... | | | | | | |

### Content Competitors
| # | Publication | URL | DA/DR | Top Content Types | Target Keywords |
|---|-------------|-----|-------|--------------------|-----------------|
| 1 |             |     |       |                    |                 |
| 2 |             |     |       |                    |                 |
| ... | | | | | |
```

---

## 3. Competitor Analysis Framework

Once competitors are identified, analyze them systematically. The goal is not to copy competitors but to understand the competitive floor (minimum viable content) and ceiling (best-in-class execution) for every ranking factor.

### 3.1 URL Structure Analysis

Examine how competitors organize their sites. This directly informs your programmatic URL architecture.

**What to analyze:**

```
Homepage: example.com
Service pages:  example.com/services/drain-cleaning
                example.com/plumbing/drain-cleaning
                example.com/drain-cleaning

Location pages: example.com/areas-served/austin-tx
                example.com/locations/austin
                example.com/austin-plumber

Service+Location: example.com/plumbing/austin-tx/drain-cleaning
                  example.com/drain-cleaning-austin-tx
                  example.com/services/drain-cleaning/austin

Blog:           example.com/blog/how-much-does-drain-cleaning-cost
                example.com/resources/drain-cleaning-guide
```

**Record for each competitor:**

- URL depth (how many directory levels)
- Whether services and locations are separate or combined
- Use of slugs vs. IDs in URLs
- Presence of trailing slashes
- Subdomain usage (blog.example.com vs. example.com/blog)
- Whether they have dedicated city pages, or just mention cities on service pages

**Pattern recognition:** If 7 of 10 top-ranking competitors use `/services/[service-slug]` for service pages and `/[service]-[city]` for service+location combos, that pattern is validated by Google's ranking behavior. Deviate only with good reason.

### 3.2 Page Count & Content Volume

**How to estimate competitor page count:**

1. **Site search** — `site:competitor.com` in Google. Note the estimated result count (rough approximation).
2. **Ahrefs/SEMrush Site Audit** — Shows indexed page count, crawled page count.
3. **Screaming Frog** — Crawl the competitor's site (free up to 500 URLs). Get exact page count by type.
4. **XML Sitemap** — Check `competitor.com/sitemap.xml` or `competitor.com/sitemap_index.xml`. Count URLs per sitemap.

**What to record:**

| Competitor | Total Pages | Service Pages | Location Pages | Service+Location Pages | Blog Posts | Other |
|---|---|---|---|---|---|---|
| Competitor A | 350 | 25 | 15 | 225 | 80 | 5 |
| Competitor B | 85 | 12 | 0 | 45 | 25 | 3 |

**What this tells you:**

- If the top-ranking competitor has 300 service+location pages and #2 has 40, there is a correlation between content volume and rankings. Your programmatic approach has an advantage here.
- If no competitor has service+location combo pages, this is a gap you can exploit — but verify there is search demand first.
- Blog post count indicates the content marketing maturity of the market. If competitors publish regularly, you need a content velocity plan.

### 3.3 Content Depth Analysis

For the top 3-5 competitors, pick 3 representative pages from each (one service page, one location page, one service+location page) and analyze content depth.

**Content depth scorecard:**

| Factor | Competitor A | Competitor B | Competitor C | Our Target |
|---|---|---|---|---|
| Word count | 800 | 350 | 1200 | 1000+ |
| H2 headings count | 6 | 2 | 8 | 7+ |
| H3 headings count | 4 | 0 | 12 | 8+ |
| Images | 3 | 1 | 5 | 4+ |
| Videos embedded | 0 | 0 | 1 | 1 |
| FAQ section | Yes (4 Q&A) | No | Yes (8 Q&A) | Yes (6+) |
| Price/cost info | No | No | Yes (range) | Yes |
| Process/steps | Yes (5 steps) | No | Yes (7 steps) | Yes |
| CTA count | 2 | 1 | 4 | 3 |
| Internal links | 5 | 2 | 12 | 8+ |
| External links | 0 | 0 | 2 | 1-2 |
| Unique local content | Generic | Generic | Area-specific | Area-specific |
| Customer testimonial | 0 | 0 | 2 | 2+ |
| Trust signals (licenses, etc.) | 1 | 0 | 3 | 3+ |
| Schema markup types | None | LocalBusiness | LocalBusiness, Service, FAQ | Full stack |

**Key insight for programmatic sites:** Your templates must match or exceed the content depth of the best-ranking competitor. If every ranking page has 1000+ words, 6+ headings, and an FAQ section, your template must produce that as a floor, not a ceiling.

### 3.4 Keyword Targeting Analysis

Use Ahrefs or SEMrush to pull the keywords each competitor ranks for.

**Process:**

1. Enter competitor domain in Ahrefs Site Explorer > Organic Keywords
2. Filter by keyword containing service terms (e.g., "plumb", "drain", "pipe", "water heater")
3. Export the full keyword list
4. Repeat for each competitor
5. Merge and deduplicate across competitors

**What to look for:**

- Keywords where competitors rank positions 4-20 (achievable targets)
- Keywords where multiple competitors rank but none dominate (competitive gap)
- Keywords with high volume where no local competitor ranks (opportunity)
- Long-tail variations competitors accidentally rank for (template opportunities)

### 3.5 Backlink Profile Analysis

**What to analyze:**

| Metric | Competitor A | Competitor B | Competitor C |
|---|---|---|---|
| Domain Rating (DR) | 35 | 22 | 48 |
| Total backlinks | 2,400 | 180 | 8,500 |
| Referring domains | 120 | 45 | 380 |
| .edu/.gov links | 2 | 0 | 5 |
| Local directory links | 35 | 12 | 60 |
| Chamber of Commerce | Yes | No | Yes |
| BBB link | Yes | Yes | Yes |
| Industry association | No | No | Yes |
| Link velocity (links/month) | 8 | 2 | 25 |

**What this tells you:**

- The DR/DA range of ranking competitors sets the authority benchmark. If competitors ranking in the top 5 have DR 30-50, and the client's domain is DR 5, you need a link building plan alongside programmatic content.
- Common backlink sources reveal where to build links (local directories, chambers of commerce, supplier links, sponsorships).
- If a competitor has significantly more links, your strategy should emphasize long-tail keywords where authority matters less.

### 3.6 Core Web Vitals (CWV) Scores

**How to check:**

1. **PageSpeed Insights** — Run the competitor's homepage, a service page, and a service+location page
2. **Chrome UX Report (CrUX)** — Field data for the domain (available via PageSpeed Insights or BigQuery)
3. **Bulk CWV check** — Use tools like Treo.sh, DebugBear, or Ahrefs Site Audit for batch testing

**What to record:**

| Competitor | LCP (sec) | INP (ms) | CLS | Mobile Score | Desktop Score |
|---|---|---|---|---|---|
| Competitor A | 3.8 | 280 | 0.15 | 42 | 78 |
| Competitor B | 2.1 | 120 | 0.05 | 85 | 95 |
| Competitor C | 4.5 | 350 | 0.22 | 35 | 65 |

**Why this matters for programmatic sites:**

- Astro's static generation and partial hydration give you a structural CWV advantage over competitors using WordPress or other heavy CMS platforms.
- If competitors universally score poorly on mobile CWV, you can differentiate on performance — Google uses CWV as a ranking signal, and in a close race, performance is the tiebreaker.
- Your programmatic templates should be tested for CWV before mass-generating pages. A slow template multiplied by 500 pages means 500 slow pages.

### 3.7 Schema Markup Analysis

**How to check:**

1. **Google Rich Results Test** — Paste competitor URLs
2. **Schema.org Validator** — Paste competitor page source
3. **Browser DevTools** — Search page source for `application/ld+json`

**Schema types to look for on service business sites:**

| Schema Type | Purpose | Competitor A | Competitor B | Competitor C |
|---|---|---|---|---|
| `LocalBusiness` | Business NAP, hours, area served | Yes | Partial | No |
| `Service` | Service descriptions, provider | No | No | No |
| `FAQ` | FAQ section markup | No | No | Yes |
| `Review` / `AggregateRating` | Star ratings | Yes | No | Yes |
| `HowTo` | Process/steps content | No | No | No |
| `BreadcrumbList` | Navigation path | Yes | Yes | No |
| `Organization` | Brand-level info | Yes | No | Yes |
| `WebPage` | Page-level metadata | No | No | No |
| `GeoCoordinates` | Location data | Yes | No | No |
| `AreaServed` | Service area definition | No | No | No |
| `Offer` | Pricing information | No | No | No |

**Key insight:** Most local service businesses implement little or no schema markup. This is a consistent competitive advantage for programmatic sites that bake schema generation into every template. If your templates automatically produce `LocalBusiness`, `Service`, `FAQ`, `BreadcrumbList`, and `AggregateRating` schema, you outclass 90%+ of competitors on structured data.

### Competitor Analysis Summary Template

```markdown
## Competitor Analysis Summary — [Client Name]
### Date: [Date]
### Analyst: [Name]

### Competitive Landscape Overview
- **Market saturation:** [Low / Medium / High]
- **Average competitor DA/DR:** [Number]
- **Content depth norm:** [Low (<500 words) / Medium (500-1000) / High (1000+)]
- **Schema adoption rate:** [X of Y competitors use structured data]
- **CWV performance norm:** [Poor / Average / Good]

### Strategic Opportunities
1. [Opportunity 1 — e.g., "No competitor has service+location pages for sub-services"]
2. [Opportunity 2 — e.g., "Only 1 competitor has FAQ schema, none have Service schema"]
3. [Opportunity 3 — e.g., "Competitor content averages 400 words — 1000+ word templates will outperform"]

### Strategic Threats
1. [Threat 1 — e.g., "Competitor C has DR 48 and 380 referring domains — will be hard to outrank for head terms"]
2. [Threat 2 — e.g., "Angi and HomeAdvisor dominate positions 1-3 for all primary keywords"]

### Recommended Approach
[Summary of how the programmatic site should be built to exploit opportunities and mitigate threats]
```

---

## 4. Keyword Research Process for Service Businesses

### Starting from Seed Keywords

Seed keywords are the broadest terms that describe the client's business. They are the starting point from which you expand into the full keyword universe.

**How to generate seed keywords:**

#### Step 1: Client Interview

Ask the client:

- "What are the top 5 services you offer?"
- "What do customers call these services when they call you?" (Their language often differs from industry terminology)
- "What are your highest-revenue services?"
- "What services do you want to grow?"
- "What emergency services do you provide?"
- "What seasonal services spike at certain times of year?"

#### Step 2: Industry Seed List

For each vertical, start with a standard seed list:

**Plumbing seeds:**
```
plumber, plumbing, drain cleaning, drain unclogging, sewer repair, sewer line,
water heater, water heater installation, water heater repair, tankless water heater,
pipe repair, pipe burst, repiping, leak detection, leak repair, water leak,
gas line, gas leak, gas pipe, faucet repair, faucet installation, toilet repair,
toilet installation, garbage disposal, sump pump, water softener, water filtration,
backflow prevention, hydro jetting, slab leak, trenchless sewer repair,
bathroom remodel, kitchen plumbing, commercial plumbing, emergency plumber
```

**HVAC seeds:**
```
hvac, air conditioning, ac repair, ac installation, ac replacement, ac tune-up,
heating, furnace repair, furnace installation, heat pump, ductless mini split,
duct cleaning, duct repair, ductwork, thermostat, indoor air quality, air filter,
refrigerant, refrigerant recharge, R-410A, R-454B, refrigerant leak, central air, window unit, commercial hvac, emergency hvac,
ac not cooling, furnace not heating, hvac maintenance, seasonal tune-up
```

> **Note:** "Freon" (R-22 refrigerant) was phased out under EPA regulations in 2020. It is only relevant as an informational content keyword targeting owners of older systems (e.g., "freon replacement alternatives", "R-22 phase out"). Use current refrigerant terms (R-410A, R-454B) for transactional and service page targeting.

**Electrical seeds:**
```
electrician, electrical, wiring, rewiring, panel upgrade, breaker box,
circuit breaker, outlet installation, outlet repair, light installation,
ceiling fan installation, generator, standby generator, surge protector,
ev charger, ev charger installation, smoke detector, carbon monoxide detector,
recessed lighting, landscape lighting, electrical inspection, knob and tube,
aluminum wiring, commercial electrical, emergency electrician, electrical repair
```

**Roofing seeds:**
```
roofing, roof repair, roof replacement, roof installation, roof inspection,
shingle, metal roof, flat roof, tile roof, slate roof, roof leak, roof damage,
storm damage, hail damage, wind damage, gutter, gutter installation,
gutter repair, downspout, soffit, fascia, flashing, skylight, chimney,
roof ventilation, attic insulation, commercial roofing, emergency roof repair,
roof estimate, roof quote
```

#### Step 3: Expand Seeds with Tools

Take each seed keyword and run it through expansion tools:

**Ahrefs Keywords Explorer:**
1. Enter seed keyword
2. Check "Matching terms" — shows all keywords containing the seed
3. Check "Related terms" — shows semantically related keywords
4. Check "Questions" — shows question-based queries
5. Export all results

**SEMrush Keyword Magic Tool:**
1. Enter seed keyword
2. Browse the keyword tree (auto-organized by modifier groups)
3. Filter by search volume > 10
4. Filter by keyword difficulty < 50 (for initial targets)
5. Export all results

**Google Keyword Planner:**
1. Enter seed keywords (up to 10 at a time)
2. Set location to client's service area
3. Review "Keyword ideas" tab
4. Sort by average monthly searches
5. Download full list

**Google Suggest (Autocomplete):**
1. Type seed keyword in Google search bar
2. Note all autocomplete suggestions
3. Type seed keyword + each letter of the alphabet (a, b, c...)
4. Note all suggestions (the "alphabet soup" technique)
5. Use tools like KeywordSurfer, Ubersuggest, or AnswerThePublic to automate this

**People Also Ask (PAA):**
1. Search each seed keyword in Google
2. Expand every PAA question
3. Note the new PAA questions that appear after expanding (they cascade)
4. Record all questions — these become FAQ content and blog topics

**Related Searches:**
1. Scroll to the bottom of Google search results
2. Record all "Related searches" suggestions
3. Click each one and record its related searches (snowball effect)

**Google Trends:**
1. Enter seed keywords to identify seasonal patterns
2. Compare related services to understand relative demand
3. Check "Related queries" for rising search terms
4. Use geographic breakdown to see demand by metro area

### Building the Master Keyword List

After running all expansion steps, you will have thousands of raw keywords. The next step is to clean, deduplicate, and organize them.

**Cleaning process:**

1. Merge all exported CSVs into one spreadsheet
2. Remove exact duplicates
3. Remove keywords with zero search volume (unless they represent important long-tail intent)
4. Remove irrelevant keywords (DIY-only, unrelated services, different industries)
5. Standardize capitalization and spacing
6. Tag each keyword with its source tool

**The result:** A master keyword list with 500-5,000+ keywords per client, depending on service breadth and geographic scope.

---

## 5. Service Keyword Research

### Identifying All Service Variations

For every core service the client offers, there are multiple ways people search for it. Your keyword research must capture all variations.

**Example: "Drain Cleaning" keyword family**

```
Core service:
  drain cleaning

Synonyms and variations:
  drain unclogging
  clogged drain
  blocked drain
  slow drain
  drain clearing
  drain snaking

Sub-services:
  kitchen drain cleaning
  bathroom drain cleaning
  shower drain cleaning
  bathtub drain cleaning
  floor drain cleaning
  main line cleaning
  sewer line cleaning
  storm drain cleaning

Method-specific:
  hydro jetting
  drain snaking
  drain augering
  mechanical drain cleaning
  camera inspection (drain)
  video pipe inspection

Problem-specific:
  clogged kitchen sink
  clogged toilet
  clogged shower drain
  sewer backup
  drain smell
  gurgling drain
  standing water in drain

Material/type-specific:
  PVC drain repair
  cast iron drain cleaning
  old drain pipes
  clay pipe drain cleaning
```

### Commercial Intent Modifiers

These modifiers signal that the searcher is ready to hire or is actively evaluating providers. They are highest-priority for service+location pages.

| Modifier Category | Examples |
|---|---|
| **Cost/Price** | cost, price, pricing, rates, how much does, quote, estimate, free estimate, affordable, cheap |
| **Near Me / Local** | near me, in [city], [city] [service], local, nearby, in my area |
| **Best / Top** | best, top, top-rated, highest-rated, #1, recommended |
| **Emergency / Urgency** | emergency, 24/7, 24 hour, same day, after hours, weekend, urgent, now, today |
| **Hire / Find** | hire, find, looking for, need, get, call |
| **Licensed / Qualified** | licensed, certified, insured, bonded, professional, experienced |
| **Reviews / Reputation** | reviews, ratings, testimonials, complaints |
| **Comparison** | vs, versus, or, comparison, difference between |

### Seasonal Modifiers

Service businesses have seasonal demand patterns. Your keyword research must account for these.

| Season | Modifier Examples | Affected Services |
|---|---|---|
| **Winter** | winter, cold weather, frozen, freeze, heating season | Furnace repair, pipe thaw, heating tune-up |
| **Spring** | spring, spring cleaning, annual, maintenance | AC tune-up, gutter cleaning, roof inspection |
| **Summer** | summer, hot weather, cooling, heat wave | AC repair, AC installation, hydration/irrigation |
| **Fall** | fall, pre-winter, winterize, seasonal | Furnace tune-up, insulation, weatherization |
| **Storm** | storm damage, hail, wind, flood, hurricane, tornado | Roof repair, emergency plumbing, water extraction |
| **Holiday** | holiday, Thanksgiving, Christmas | Emergency services (pipes freeze, overloaded circuits) |

### Service Keyword Matrix

Build a matrix that crosses services with modifier types. This becomes the foundation for programmatic page generation.

```
Service: Water Heater Installation

Base keywords:
  water heater installation
  water heater replacement
  new water heater
  install water heater

+ Cost modifiers:
  water heater installation cost
  how much to install a water heater
  water heater replacement cost
  new water heater price

+ Type modifiers:
  tankless water heater installation
  gas water heater installation
  electric water heater installation
  50 gallon water heater installation
  on demand water heater installation
  hybrid water heater installation
  heat pump water heater installation

+ Emergency modifiers:
  emergency water heater replacement
  same day water heater installation
  water heater burst
  no hot water emergency

+ Problem modifiers:
  water heater leaking
  water heater not heating
  water heater pilot light out
  rusty water from water heater
  water heater making noise

+ Location modifiers (see Section 6):
  water heater installation [city]
  water heater installation near me
  [city] water heater replacement

+ Brand modifiers:
  Rheem water heater installation
  AO Smith water heater installation
  Bradford White water heater installation
```

---

## 6. Location Keyword Research

### Identifying All Target Locations

For service-area businesses, the geographic component of keyword research is as important as the service component. Every location keyword represents a potential programmatic page.

#### 6.1 Primary Service Area

**Data sources for location identification:**

1. **Client interview** — "What cities/areas do you serve? How far will you travel?"
2. **GBP service area** — The areas already defined in the client's Google Business Profile
3. **Existing customer data** — Where do current customers live? (Zip code analysis of invoices/CRM data)
4. **Competitor service areas** — What cities do competitors list on their sites?

#### 6.2 Location Hierarchy

Build a hierarchy from broadest to most specific:

```
Level 1: Metro area / MSA
  Houston Metro Area

Level 2: Counties
  Harris County
  Fort Bend County
  Montgomery County

Level 3: Cities / Towns
  Houston
  Sugar Land
  Katy
  The Woodlands
  Pearland
  League City
  Spring
  Cypress
  Humble

Level 4: Neighborhoods / Communities
  Montrose
  The Heights
  River Oaks
  Midtown
  Memorial
  Galleria Area
  West University Place
  Bellaire

Level 5: Zip codes
  77002
  77004
  77006
  77007
  ...
```

#### 6.3 Location Data Sources

| Source | What It Provides | How to Access |
|---|---|---|
| US Census Bureau | Population by city/CDP/zip, demographics | data.census.gov |
| Google Maps | Neighborhood boundaries, suburb names | Manual research |
| Wikipedia | City/town lists by county, population data | Category pages |
| USPS | Zip code boundaries, city associations | tools.usps.com |
| Client's CRM/invoicing | Where actual customers are located | Client provides |
| Competitor websites | Cities competitors target (validated demand) | Manual review |
| Google Keyword Planner | Search volume by location | GKP geo-targeting |
| Ahrefs/SEMrush | Which location keywords competitors rank for | Competitor analysis |

#### 6.4 Geo-Modifier Patterns

People search for local services using several geographic patterns. Your keyword research must capture all of them.

```
Pattern 1: [service] [city]
  "plumber Austin"
  "drain cleaning Austin"

Pattern 2: [service] in [city]
  "plumber in Austin"
  "drain cleaning in Austin"

Pattern 3: [city] [service]
  "Austin plumber"
  "Austin drain cleaning"

Pattern 4: [service] near me
  "plumber near me"
  "drain cleaning near me"

Pattern 5: [service] [city] [state]
  "plumber Austin TX"
  "plumber Austin Texas"

Pattern 6: [service] near [landmark/neighborhood]
  "plumber near downtown Austin"
  "plumber near UT Austin"

Pattern 7: [service] [zip code]
  "plumber 78701"
  "drain cleaning 78704"

Pattern 8: [service] [county]
  "plumber Travis County"
  "drain cleaning Williamson County"

Pattern 9: [adjective] [service] [city]
  "best plumber Austin"
  "emergency plumber Austin"
  "affordable plumber Austin"
  "24 hour plumber Austin"
```

**Note:** Patterns 1 and 4 consistently have the highest search volume. Pattern 7 (zip code) has low search volume but extremely high intent. Pattern 6 (landmark/neighborhood) is valuable in dense urban markets.

#### 6.5 "Near Me" Considerations

"Near me" keywords deserve special treatment:

- **Volume:** "Plumber near me" often has 10-50x the volume of "plumber [city]" at the national level, but this volume is distributed across all locations.
- **Ranking:** Google interprets "near me" based on the searcher's location. You cannot rank nationally for "plumber near me." You rank locally based on proximity and relevance.
- **Page strategy:** You do NOT create a "/plumber-near-me" page. Instead, optimize your city-specific pages so they rank when someone in that city searches "near me."
- **Content:** Mention "near me" naturally in content, meta descriptions, and FAQ sections. But the primary target keyword for each page should be `[service] [city]`.

#### 6.6 Prioritizing Locations by Population and Competition

Not every location deserves a dedicated page. Prioritize based on:

| Factor | Weight | Scoring |
|---|---|---|
| Population | 30% | >100k = 5, 50-100k = 4, 25-50k = 3, 10-25k = 2, <10k = 1 |
| Search volume for service+city | 25% | Based on actual keyword data |
| Distance from client HQ | 15% | <15 mi = 5, 15-30 mi = 4, 30-50 mi = 3, >50 mi = 2 |
| Competition intensity | 15% | Fewer competitors = higher score |
| Client's existing customer base | 10% | Has customers there = 5, no customers = 2 |
| Revenue potential | 5% | Affluent area = higher score |

**Rule of thumb:**

- Cities with population > 25,000: Always create a dedicated page
- Cities with population 10,000-25,000: Create a page if within 30 miles of client HQ
- Cities with population 5,000-10,000: Create a page only if search volume data supports it
- Cities with population < 5,000: Generally do not create dedicated pages; mention in regional pages instead
- Neighborhoods: Create pages only in metro areas where neighborhood-level search volume exists

---

## 7. Keyword Difficulty Assessment

### Understanding KD Scores

Keyword Difficulty (KD) is an estimate of how hard it is to rank on the first page for a keyword. Different tools calculate it differently.

| Tool | KD Scale | What It Measures |
|---|---|---|
| Ahrefs KD | 0-100 | Estimated referring domains needed to rank in top 10 |
| SEMrush KD | 0-100 | Composite of authority, content, and SERP features |
| Moz KD | 0-100 | Based on Page Authority and Domain Authority of ranking pages |

**Important caveats:**

1. **KD scores are global/national.** A keyword with KD 60 nationally may be KD 20 in a specific city because the local competition is weaker.
2. **KD does not account for local intent.** "Plumber" has high KD nationally, but "plumber [small city]" can have very low effective difficulty even if tools show moderate KD.
3. **KD is backward-looking.** It reflects who currently ranks, not whether a new high-quality page could rank.
4. **Different tools give different scores.** Ahrefs and SEMrush can disagree by 20+ points on the same keyword. Use one tool consistently per project.

### Realistic Ranking Expectations

For a new service-area business website (DA/DR < 15):

| KD Range (Ahrefs) | Realistic Expectation | Timeline to Page 1 | Strategy |
|---|---|---|---|
| 0-10 | Can rank with good on-page SEO alone | 1-3 months | Prioritize these — quick wins |
| 11-25 | Can rank with good content + a few backlinks | 3-6 months | Second priority — build links alongside content |
| 26-40 | Needs strong content + 10-30 referring domains | 6-12 months | Build these pages now, invest in links over time |
| 41-60 | Needs authority + excellent content + links | 12-18 months | Build the page, but don't expect quick results |
| 61-80 | Very competitive, dominated by high-authority sites | 18-24+ months | Build for long-term, focus short-term on lower-KD variants |
| 81-100 | Dominated by Angi, Yelp, HomeAdvisor, major brands | May never rank organically | Target through long-tail variants, PAA, featured snippets |

### When to Target Hard Keywords vs. Long-Tail

**Target high-KD keywords when:**
- The client has an established domain (DR 30+)
- The keyword represents the client's core revenue service
- You have a link building budget and timeline
- The keyword is a pillar page that supports many cluster pages

**Target long-tail keywords when:**
- The site is new (DR < 15)
- You need early wins to demonstrate ROI to the client
- The long-tail keywords have clear commercial intent
- You can programmatically generate pages for long-tail patterns (this is your advantage)

**Example long-tail expansion:**

```
Head term (KD 55):     "plumber Houston"
Long-tail (KD 15):     "emergency plumber Houston Heights"
Long-tail (KD 8):      "water heater repair Houston TX 77008"
Long-tail (KD 5):      "tankless water heater installation cost Houston"
Long-tail (KD 3):      "plumber near me 77008 reviews"
```

Your programmatic system can generate pages for ALL of these patterns. The long-tail pages collectively drive more traffic than the head term, and they convert better because they match specific intent.

### Building a KD Tiering System

For each client, categorize all target keywords into tiers:

```
Tier 1 — Quick Wins (KD 0-15)
  Target immediately. These pages should rank within 1-3 months.
  Typically: service+location combos for smaller cities, sub-service + city combos.

Tier 2 — Medium Difficulty (KD 16-35)
  Build pages and content now. Support with internal links and initial link building.
  Typically: service+city for mid-size cities, service category pages.

Tier 3 — Competitive (KD 36-55)
  Build pillar pages with exceptional content. Plan link building campaigns.
  Typically: core service + major metro, "best [service] [city]" queries.

Tier 4 — Aspirational (KD 56+)
  Build the pages for topical completeness but expect long timelines.
  Focus on featured snippets, PAA, and supporting long-tail pages that pass authority upward.
  Typically: "[service] near me" (interpreted for major metros), head terms.
```

---

## 8. Search Intent Classification

### The Four Intent Types

Every keyword has a dominant search intent. Mapping intent to page type prevents mismatches that tank rankings.

#### 8.1 Informational Intent

**Signals:** "how to", "what is", "why", "guide", "tips", "signs of", "difference between"

**Examples:**
```
"how to unclog a drain"
"signs you need a new water heater"
"what causes pipes to burst"
"difference between tank and tankless water heater"
"how much does a new roof cost"
"how long does an AC unit last"
```

**Page type:** Blog posts, guides, resource pages

**Content format:** Educational content with headers, images, step-by-step instructions, expert advice. Answer the question directly (for featured snippet potential), then provide depth.

**Conversion path:** Soft CTA — "If you're experiencing this issue, our licensed plumbers can help. [Contact us for a free estimate]." The reader is not ready to buy yet; educate first.

#### 8.2 Commercial Investigation Intent

**Signals:** "best", "top", "reviews", "vs", "comparison", "cost", "prices", "how much"

**Examples:**
```
"best plumber in Austin"
"water heater installation cost Austin"
"Rheem vs AO Smith water heater"
"top-rated HVAC companies near me"
"how much does drain cleaning cost"
"roofing company reviews Houston"
```

**Page type:** Comparison pages, cost guides, service+location pages with pricing info

**Content format:** Pricing tables/ranges, brand comparisons, pros/cons lists, customer reviews, "what affects cost" sections. The searcher is evaluating options.

**Conversion path:** Medium CTA — "Get a free quote" with a prominently placed form. Include social proof (review counts, ratings, years in business).

#### 8.3 Transactional Intent

**Signals:** "hire", "call", "book", "schedule", "emergency", "24/7", "near me" (often), "free estimate"

**Examples:**
```
"hire plumber Austin TX"
"emergency AC repair near me"
"24 hour electrician Houston"
"schedule furnace repair"
"call roofer for free estimate"
"book drain cleaning appointment"
```

**Page type:** Service pages, service+location pages, landing pages

**Content format:** Strong CTAs above the fold, phone number prominent, booking form, service descriptions, trust signals (licenses, insurance, reviews). Minimal educational content — the searcher knows what they need.

**Conversion path:** Hard CTA — Click-to-call button, form submission, chat widget. Make it as easy as possible to take action.

#### 8.4 Navigational Intent

**Signals:** Brand name, company name, specific business + "phone number", "hours", "address"

**Examples:**
```
"ABC Plumbing Austin"
"Roto-Rooter phone number"
"[client company name] reviews"
"[client company name] hours"
```

**Page type:** Homepage, About page, Contact page, GBP listing

**Content format:** Business information (NAP, hours, service area map). These queries are for people who already know the brand.

**Conversion path:** Direct contact information. The searcher is already looking for this specific business.

### Intent-to-Page-Type Mapping Matrix

| Intent Type | Primary Page Types | Secondary Page Types |
|---|---|---|
| Informational | Blog posts, Guides | FAQ sections on service pages |
| Commercial Investigation | Cost guides, Comparison pages | Service+location pages with pricing |
| Transactional | Service pages, Service+location pages | Landing pages, Contact page |
| Navigational | Homepage, About, Contact | GBP listing |

### Intent Classification Process for Each Keyword

For every keyword in your master list:

1. **Search it in Google** — What does Google actually show? The SERP itself tells you what Google thinks the intent is.
2. **Look at the results:**
   - If Google shows local pack + service pages = Transactional
   - If Google shows blog posts + guides = Informational
   - If Google shows comparison/review pages + cost guides = Commercial Investigation
   - If Google shows a brand's homepage = Navigational
3. **Check SERP features:**
   - Featured snippet = Informational (usually)
   - People Also Ask = Informational or Commercial Investigation
   - Local Pack = Transactional with local intent
   - Shopping results = Transactional (product, not service — rare for service businesses)
   - Video results = Informational (how-to)
4. **Assign intent tag to the keyword in your spreadsheet**

### Mixed Intent Keywords

Some keywords have mixed intent. "Water heater installation" could be:
- Informational: "I want to learn about the process"
- Commercial: "I want to know the cost"
- Transactional: "I want to hire someone to install one"

**How to handle mixed intent:**

Google's SERP for mixed-intent keywords typically shows a mix of result types. Your strategy:

1. Create the page type that matches the dominant intent (the majority of page-one results)
2. Include content sections that address secondary intents (e.g., a transactional service page that includes a "Cost" section and a "Process" section)
3. Interlink between page types — the service page links to the blog post about cost, which links back to the service page's booking form

---

## 9. Keyword-to-Page Mapping

### Page Type Taxonomy for Service-Area Businesses

Before mapping keywords, define the page types your programmatic system will generate:

```
1. Homepage
   - Primary: [service type] [city] (e.g., "plumber Austin TX")
   - Secondary: brand name, top 3-5 services

2. Service Pillar Pages (one per core service category)
   - Primary: [service category] (e.g., "drain cleaning services")
   - Secondary: sub-service terms, related terms

3. Service Detail Pages (one per specific service)
   - Primary: [specific service] (e.g., "hydro jetting")
   - Secondary: related sub-services, method variations

4. Location Pages (one per target city)
   - Primary: [service type] [city] (e.g., "plumber Katy TX")
   - Secondary: neighborhoods within that city

5. Service+Location Pages (programmatic — one per service/city combo)
   - Primary: [service] [city] (e.g., "drain cleaning Katy TX")
   - Secondary: [service] in [city], [city] [service], near me

6. Blog Posts (one per informational keyword cluster)
   - Primary: [informational keyword] (e.g., "how much does drain cleaning cost")
   - Secondary: related questions, long-tail informational terms

7. Cost Guide Pages (one per service with pricing interest)
   - Primary: [service] cost [city] (e.g., "water heater installation cost Austin")
   - Secondary: pricing variations, factors affecting cost

8. Area Landing Pages (optional — for broader regions)
   - Primary: [service type] [region/county]
   - Secondary: city names within region
```

### Keyword Mapping Rules

**Rule 1: One primary keyword per page.** Every page has exactly one primary keyword. That keyword appears in the title tag, H1, URL slug, and meta description.

**Rule 2: 3-8 secondary keywords per page.** These are closely related terms that the page also targets. They appear in H2s, body content, and image alt text. They must share the same search intent as the primary keyword.

**Rule 3: No keyword cannibalization.** No two pages should target the same primary keyword. If two pages could logically target the same keyword, they must be consolidated or differentiated by intent.

**Rule 4: Pillar pages target head terms; cluster pages target long-tail.** The pillar page for "drain cleaning" targets the category-level keyword. Individual cluster pages target "kitchen drain cleaning", "shower drain cleaning", "drain cleaning cost", etc.

**Rule 5: Service+Location pages always use the pattern [service] [city] as primary.** Do not use "[city] [service]" as primary — it is a secondary keyword.

### Keyword Mapping Template

```csv
Page Type,URL Slug,Primary Keyword,Monthly Volume,KD,Intent,Secondary Keywords,Parent Page
Service Pillar,/services/drain-cleaning,drain cleaning services,2400,35,Commercial,drain unclogging; clogged drain repair; drain clearing,/services
Service Detail,/services/drain-cleaning/hydro-jetting,hydro jetting,1600,28,Commercial,hydro jetting drain cleaning; high pressure drain cleaning,/services/drain-cleaning
Service+Location,/services/drain-cleaning/austin-tx,drain cleaning Austin TX,320,18,Transactional,Austin drain cleaning; drain unclogging Austin; clogged drain Austin,/services/drain-cleaning
Service+Location,/services/drain-cleaning/round-rock-tx,drain cleaning Round Rock TX,90,12,Transactional,Round Rock drain cleaning; drain unclogging Round Rock,/services/drain-cleaning
Blog,/blog/how-much-does-drain-cleaning-cost,how much does drain cleaning cost,1200,22,Informational,drain cleaning price; drain cleaning rates; cost to unclog drain,/services/drain-cleaning
Cost Guide,/services/drain-cleaning/cost-austin,drain cleaning cost Austin,110,15,Commercial,drain cleaning price Austin; how much drain cleaning Austin,/services/drain-cleaning/austin-tx
Location,/areas/austin-tx,plumber Austin TX,3600,42,Transactional,Austin plumber; plumbing Austin TX; plumber near me Austin,/
```

### Avoiding Keyword Cannibalization

Cannibalization happens when multiple pages compete for the same keyword. It splits Google's signals and prevents either page from ranking well.

**Common cannibalization scenarios in service businesses:**

| Scenario | Problem | Solution |
|---|---|---|
| Blog post "How Much Does Drain Cleaning Cost" + Service page "Drain Cleaning" | Both target "drain cleaning cost" | Blog targets the informational query; service page mentions cost range but targets "drain cleaning services" |
| Service page "Drain Cleaning" + Service+Location page "Drain Cleaning Austin" | Both could rank for "drain cleaning Austin" | Service+Location page targets the geo-modified term; service page targets the unmodified term. Internal links from service page to city pages. |
| Two city pages "Plumber Austin" + "Plumber Round Rock" | If Round Rock is within Austin metro, some keywords overlap | Each page targets distinct city name. Content is sufficiently differentiated with local details. |
| Homepage "ABC Plumbing Austin" + Location page "Plumber Austin" | Both target "plumber Austin" | Homepage targets brand + city; location page targets unbranded "plumber Austin TX" OR: do not create a separate location page for the HQ city — let the homepage serve that role. |

**Cannibalization detection process:**

1. Search `site:clientdomain.com [keyword]` in Google
2. If multiple pages appear, check which one Google ranks higher
3. If the wrong page ranks (e.g., blog outranks service page for a transactional query), consolidate or use canonical/internal linking to signal the preferred page
4. In Ahrefs/SEMrush, use the "Cannibalization" report to identify keywords where multiple URLs rank

---

## 10. Prioritization Framework

### Which Service+Location Combos to Build First

With potentially hundreds of service+location combinations, you need a framework to prioritize which pages to create first.

### The Prioritization Matrix

Score each service+location combination on five factors:

| Factor | Weight | Score 1 (Low) | Score 3 (Medium) | Score 5 (High) |
|---|---|---|---|---|
| **Search Volume** | 25% | <50/mo | 50-200/mo | >200/mo |
| **Keyword Difficulty** | 20% | KD >40 (hard) | KD 20-40 | KD <20 (easy) |
| **Business Value** | 25% | Low-margin service | Medium margin | High-margin service |
| **Proximity to HQ** | 15% | >30 miles | 15-30 miles | <15 miles |
| **Competition Gap** | 15% | All competitors have pages | Some competitors | No competitor has a page |

**Priority Score = (Volume * 0.25) + (Inverse KD * 0.20) + (Business Value * 0.25) + (Proximity * 0.15) + (Gap * 0.15)**

### Prioritization Tiers

**Tier 1 — Launch Pages (Build before site launch)**

- Client's top 3-5 highest-revenue services
- Client's HQ city + 3-5 closest cities
- All combos of Tier 1 services x Tier 1 cities
- Estimated: 15-25 service+location pages
- These pages should be live on day one

**Tier 2 — Month 1 Expansion**

- All remaining services the client actively offers
- Next 5-10 cities by priority score
- All new combos of Tier 2 services x Tier 1+2 cities
- Estimated: 30-60 additional pages
- Build within the first 30 days after launch

**Tier 3 — Month 2-3 Build-Out**

- Sub-services and service variations
- Remaining cities in the service area
- Blog posts targeting top informational keywords
- Cost guide pages for high-volume cost queries
- Estimated: 50-200 additional pages

**Tier 4 — Ongoing Growth**

- Neighborhood-level pages (only in metro areas with demand)
- Seasonal content pages
- New services the client adds
- Content responding to new keyword opportunities found in ongoing research
- Estimated: Ongoing, 5-20 pages per month

### Prioritization Spreadsheet Format

```csv
Service,City,State,Search Volume,KD,Business Value (1-5),Proximity (1-5),Competition Gap (1-5),Priority Score,Tier,Status
Drain Cleaning,Austin,TX,320,18,4,5,3,4.45,1,Published
Water Heater Installation,Austin,TX,260,22,5,5,2,4.15,1,Published
AC Repair,Austin,TX,480,35,4,5,1,3.75,1,Published
Drain Cleaning,Round Rock,TX,90,12,4,4,4,3.95,1,Published
Drain Cleaning,Pflugerville,TX,50,8,4,4,5,4.10,2,In Progress
Water Heater Installation,Cedar Park,TX,40,10,5,3,4,3.55,2,In Progress
Hydro Jetting,Austin,TX,70,15,5,5,5,4.50,2,Planned
Sewer Line Repair,Austin,TX,110,20,5,5,4,3.95,2,Planned
Drain Cleaning,Georgetown,TX,30,6,4,2,5,3.30,3,Planned
```

### Business Value Assessment

Work with the client to score each service by business value:

| Score | Revenue per Job | Repeat Potential | Upsell Potential | Example Services |
|---|---|---|---|---|
| 5 | >$5,000 | Low (one-time) | High | Repiping, roof replacement, HVAC installation, panel upgrade |
| 4 | $1,000-5,000 | Medium | High | Water heater installation, AC repair, sewer line repair |
| 3 | $500-1,000 | Medium | Medium | Drain cleaning, electrical repair, furnace tune-up |
| 2 | $150-500 | High (recurring) | Low | Faucet repair, outlet installation, gutter cleaning |
| 1 | <$150 | Variable | Low | Toilet repair, smoke detector installation |

**Important nuance:** A $150 service with high repeat potential (e.g., seasonal HVAC maintenance) may warrant a higher effective business value because it leads to lifetime customer relationships and higher-value upsells.

---

## 11. Content Gap Analysis

### Finding What Competitors Rank For That You Don't

Content gap analysis identifies keywords where competitors rank but your site (or a new site) does not. This is one of the highest-ROI research activities because it reveals proven demand you are not capturing.

### Using Ahrefs Content Gap

1. Open Ahrefs > Site Explorer > Enter client's domain (or a placeholder if the site is new)
2. Go to "Content Gap" tool
3. Enter 3-5 competitor domains in the "Show keywords that the below targets rank for" fields
4. Set "But the following target doesn't rank for" to the client's domain
5. Filter:
   - Volume > 10
   - KD < 40 (for new sites) or KD < 60 (for established sites)
   - Exclude branded competitor terms
6. Export results

### Using SEMrush Keyword Gap

1. Open SEMrush > Keyword Gap
2. Enter client domain + up to 4 competitor domains
3. Select "Missing" keywords (competitors rank, client doesn't)
4. Filter by service-related terms
5. Export results

### Interpreting Content Gap Results

Content gap results fall into categories:

**Category 1: Service keywords you should be targeting**
- Competitor ranks for "slab leak detection Austin" but you have no page for it
- Action: Add to keyword map, create service+location page

**Category 2: Informational keywords for blog content**
- Competitor ranks for "how to tell if you have a slab leak"
- Action: Add to blog editorial calendar

**Category 3: Keywords for services the client doesn't offer**
- Competitor ranks for "pool plumbing repair" but client doesn't do pool work
- Action: Ignore, or discuss with client whether to add this service

**Category 4: Branded/irrelevant keywords**
- Competitor ranks for their own brand name, job postings, etc.
- Action: Ignore

### Identifying Underserved Topics

Beyond direct competitor gaps, look for topics where no competitor provides good content:

1. **Search Google for each target keyword.** If the top results are:
   - Thin pages (< 300 words)
   - Forum posts or Reddit threads
   - Outdated content (> 2 years old)
   - Off-topic results

   ...then the topic is underserved. A well-crafted programmatic page or blog post can rank quickly.

2. **Check PAA boxes.** If "People Also Ask" questions lack good answers among the top results, create content that directly answers those questions.

3. **Look for location gaps.** A competitor may rank for "plumber Austin" but have no page for "plumber Pflugerville" — even though Pflugerville has 75,000 residents. Location gaps are the most exploitable for programmatic SEO.

### Content Gap Tracking Template

```csv
Gap Keyword,Monthly Volume,KD,Intent,Competitors Ranking,Gap Type,Action,Assigned Page Type,Priority,Status
slab leak detection Austin,90,15,Transactional,"CompA(3), CompC(7)",Service Gap,Create service+location page,Service+Location,High,Planned
how to prevent frozen pipes,1600,28,Informational,"CompB(5)",Blog Gap,Create blog post,Blog,Medium,Planned
tankless water heater vs tank,2400,32,Commercial Investigation,"CompA(8), CompC(12)",Content Gap,Create comparison blog post,Blog,Medium,Planned
plumber Pflugerville TX,110,8,Transactional,None,Location Gap,Create city page,Service+Location,High,Planned
emergency plumber 78704,20,5,Transactional,None,Zip Code Gap,Cover in Austin page,Content Update,Low,Planned
```

---

## 12. SERP Analysis

### Why SERP Analysis Matters

Keyword research tells you what people search for. SERP analysis tells you what Google rewards for those searches. The gap between these two insights determines your content strategy.

### SERP Feature Inventory

For each target keyword cluster, search Google and record which SERP features appear:

| SERP Feature | What It Looks Like | Opportunity |
|---|---|---|
| **Local Pack (3-Pack)** | Map with 3 business listings | Requires GBP optimization (see Local SEO doc) |
| **Local Service Ads (LSAs)** | "Google Guaranteed" ads at top | Paid channel, not organic — but pushes organic down |
| **Paid Ads (Top)** | Ads above organic results | Indicates commercial value; organic click-through is lower |
| **Featured Snippet** | Answer box above position 1 | Structure content to win it (paragraph, list, or table format) |
| **People Also Ask (PAA)** | Expandable question boxes | Create FAQ sections targeting these questions |
| **Video Results** | YouTube/video thumbnails in results | Create video content or embed videos on pages |
| **Image Pack** | Row of images in results | Optimize image alt text and file names |
| **Knowledge Panel** | Right-side panel (for entities) | Ensure GBP is complete and schema is implemented |
| **Sitelinks** | Sub-links under a result | Good internal linking and site structure enables these |
| **Reviews/Stars** | Star ratings in organic results | Implement AggregateRating schema |
| **"Things to know"** | AI-generated topic sections | Topical depth and E-E-A-T signals |
| **AI Overview (SGE)** | AI-generated summary at top | Impacts click-through; focus on queries where AI Overview is absent or links to sources |

### SERP Analysis Process

For each primary keyword cluster (top 20-30 keywords):

**Step 1: Record the SERP layout**

```markdown
Keyword: "drain cleaning Austin TX"
Date Analyzed: 2026-04-09

SERP Features Present:
- [ ] AI Overview
- [x] Local Service Ads (2 ads)
- [x] Paid Ads (3 top, 2 bottom)
- [x] Local Pack (3-pack)
- [x] People Also Ask (4 questions)
- [ ] Featured Snippet
- [ ] Video Results
- [ ] Image Pack
- [x] Sitelinks (for position 1)
- [ ] Reviews/Stars in organic

First organic result position: ~position 5-6 visually (below ads + local pack)
```

**Step 2: Analyze organic results (positions 1-10)**

```markdown
Position 1: competitorA.com/drain-cleaning-austin
  - Title: "Drain Cleaning Austin TX | 24/7 Service | CompetitorA"
  - Content type: Service+Location page
  - Est. word count: 1200
  - Has FAQ: Yes
  - Has schema: LocalBusiness + FAQ
  - Has reviews on page: Yes (12 reviews)
  - DA/DR: 35

Position 2: angi.com/services/drain-cleaning/austin-tx
  - Title: "Best Drain Cleaning Services in Austin TX | Angi"
  - Content type: Aggregator listing
  - DA/DR: 91

Position 3: competitorB.com/services/drain-cleaning
  - Title: "Professional Drain Cleaning | CompetitorB"
  - Content type: Service page (not location-specific)
  - Est. word count: 600
  - Has FAQ: No
  - Has schema: None
  - DA/DR: 28

... [continue for all 10 positions]
```

**Step 3: Identify ranking patterns**

- **Content type distribution:** Are most results service pages, location pages, blog posts, or aggregator pages? Build the page type that dominates.
- **Content depth pattern:** What is the average word count? How many have FAQs? How many show schema markup?
- **Authority distribution:** What is the DA/DR range? Are there any low-authority sites ranking? Those represent realistic competitive positions.
- **Local vs. non-local:** How many results are local businesses vs. national brands/aggregators? This shows how much SERP real estate is available to local businesses.

**Step 4: Derive content requirements**

Based on the SERP analysis, define the minimum content requirements for each page type:

```markdown
Content Requirements for Service+Location Pages (derived from SERP analysis):

Minimum word count: 1000 (top 3 average: 1100)
Required sections:
  - Service description (what, why, when)
  - Service process (how it works, numbered steps)
  - Pricing/cost range
  - FAQ section (5+ questions)
  - Service area mention (city + neighborhoods)
  - Trust signals (license #, insurance, reviews)
  - CTA sections (phone, form) — at least 2 per page

Required schema:
  - LocalBusiness
  - Service
  - FAQ
  - BreadcrumbList
  - AggregateRating (if reviews available)

Required on-page elements:
  - Embedded map or service area map
  - Before/after images or service images
  - Customer testimonial/review
  - Click-to-call button (mobile)
```

### Tracking SERP Changes Over Time

Google's SERPs evolve. What ranks today may not rank in 6 months. Track SERP layouts quarterly for your top 20 keywords:

- Has an AI Overview appeared where there wasn't one before?
- Have new SERP features been added (e.g., video carousel)?
- Has the local pack expanded or contracted?
- Have new competitors entered the top 10?
- Has the content depth of top results increased?

---

## 13. Keyword Research Tools Comparison

### Free Tools

| Tool | Best For | Limitations |
|---|---|---|
| **Google Keyword Planner** | Exact search volume (requires Google Ads account), location-specific data | Groups keywords into ranges unless you're spending on ads; limited keyword suggestions |
| **Google Search Console** | Finding keywords you already rank for, impressions data, CTR | Only shows data for your own site; no competitor data |
| **Google Trends** | Seasonal patterns, relative demand, geographic interest | No absolute volume numbers; limited keyword discovery |
| **Google Autocomplete** | Real-time suggestion data, long-tail discovery | Manual process unless automated; no volume data |
| **AnswerThePublic** | Question-based keywords, preposition/comparison queries | Limited free searches per day; no difficulty or volume data |
| **Ubersuggest (free tier)** | Basic keyword suggestions, rough volume estimates | Severely limited free queries; data accuracy concerns |
| **AlsoAsked** | PAA question mapping, question clustering | Limited free searches; no volume data |
| **Keyword Surfer (Chrome ext.)** | See volume estimates in Google search results | Rough estimates; limited to Chrome browser |
| **Google Business Profile Insights** | What queries drove views/clicks to GBP listing | Only for existing GBP; limited historical data |

### Paid Tools

| Tool | Monthly Cost (2026) | Best For | Why Local Service Businesses Need It |
|---|---|---|---|
| **Ahrefs** | $129-449 | Backlink analysis, keyword difficulty, content gap, competitor analysis | Most accurate KD metric; best content gap tool; essential for competitor backlink analysis |
| **SEMrush** | $139-499 | Keyword magic tool, position tracking, site audit, local SEO toolkit | Best keyword expansion tool; includes local SEO features; broadest feature set |
| **Moz Pro** | $49-299 | Local SEO, DA metric, keyword tracking | Best local search features; GBP management integration; lower cost entry point |
| **BrightLocal** | $39-79 | Local rank tracking, citation management, GBP audit | Purpose-built for local SEO; tracks local pack rankings by zip code |
| **Screaming Frog** | $259/yr | Technical SEO audit, site crawling, competitor page analysis | Essential for analyzing competitor site structure; finds technical issues |
| **Surfer SEO** | $99-219 | Content optimization, NLP analysis, SERP comparison | Helps programmatic templates match SERP content expectations; content scoring |
| **SpyFu** | $39-79 | Competitor PPC and organic keyword history | Shows competitor keyword strategy over time; affordable competitor intel |

### Recommended Tool Stack for Agencies

**Minimum viable stack (small agency, <5 clients):**
- SEMrush or Ahrefs (pick one) — $139-149/mo
- BrightLocal — $39/mo
- Screaming Frog — $259/yr ($22/mo)
- Google tools (free: Keyword Planner, Search Console, Trends)
- **Total: ~$200/month**

**Full stack (growth agency, 5-20 clients):**
- Ahrefs (Standard) — $229/mo
- SEMrush (Guru) — $249/mo (for team access and historical data)
- BrightLocal — $59/mo
- Screaming Frog — $259/yr
- Surfer SEO — $99/mo
- **Total: ~$650/month**

**Enterprise stack (large agency, 20+ clients):**
- Ahrefs (Advanced) — $449/mo
- SEMrush (Business) — $499/mo
- BrightLocal — $79/mo
- Screaming Frog — $259/yr
- Surfer SEO — $219/mo
- Custom data pipeline with API access (Ahrefs API, SEMrush API, DataForSEO)
- **Total: ~$1,300/month + API costs**

### Local SEO-Specific Tool Considerations (2026)

- **AI Overview tracking:** In 2026, tracking whether AI Overviews appear for your keywords is critical. Ahrefs and SEMrush both show AI Overview presence in SERP feature tracking. BrightLocal tracks local pack presence alongside AI Overview.
- **GBP integration:** BrightLocal and Moz Pro offer the best GBP management features. SEMrush's Local toolkit is catching up.
- **Map Pack tracking:** BrightLocal remains the gold standard for tracking local pack rankings at specific locations (by zip code or coordinates).
- **API access for automation:** For agencies building programmatic systems, API access to keyword data is essential. Ahrefs API and SEMrush API both provide programmatic keyword lookup. DataForSEO offers a more affordable alternative for bulk queries.

---

## 14. Storing and Managing Keyword Data

### Payload CMS Keyword Fields

Your Payload CMS instance should have keyword data integrated into every content collection. This allows programmatic pages to pull keyword data dynamically and enables reporting on keyword coverage.

#### 14.1 Keywords Collection

A dedicated collection for storing the master keyword list:

```typescript
// collections/Keywords.ts
// Payload v3 imports — see https://payloadcms.com/docs/getting-started/installation
import type { CollectionConfig } from 'payload';

const Keywords: CollectionConfig = {
  slug: 'keywords',
  admin: {
    useAsTitle: 'keyword',
    defaultColumns: ['keyword', 'searchVolume', 'difficulty', 'intent', 'assignedPage', 'tier'],
    group: 'SEO',
  },
  fields: [
    {
      name: 'keyword',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The exact keyword phrase',
      },
    },
    {
      name: 'searchVolume',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Monthly search volume (from Ahrefs/SEMrush)',
      },
    },
    {
      name: 'difficulty',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Keyword difficulty score (0-100)',
      },
    },
    {
      name: 'difficultySource',
      type: 'select',
      options: [
        { label: 'Ahrefs', value: 'ahrefs' },
        { label: 'SEMrush', value: 'semrush' },
        { label: 'Moz', value: 'moz' },
        { label: 'Manual Estimate', value: 'manual' },
      ],
    },
    {
      name: 'intent',
      type: 'select',
      required: true,
      options: [
        { label: 'Informational', value: 'informational' },
        { label: 'Commercial Investigation', value: 'commercial' },
        { label: 'Transactional', value: 'transactional' },
        { label: 'Navigational', value: 'navigational' },
      ],
    },
    {
      name: 'keywordType',
      type: 'select',
      required: true,
      options: [
        { label: 'Service', value: 'service' },
        { label: 'Location', value: 'location' },
        { label: 'Service + Location', value: 'service_location' },
        { label: 'Informational', value: 'informational' },
        { label: 'Brand', value: 'brand' },
        { label: 'Competitor', value: 'competitor' },
      ],
    },
    {
      name: 'tier',
      type: 'select',
      required: true,
      options: [
        { label: 'Tier 1 — Quick Win', value: 'tier1' },
        { label: 'Tier 2 — Medium', value: 'tier2' },
        { label: 'Tier 3 — Competitive', value: 'tier3' },
        { label: 'Tier 4 — Aspirational', value: 'tier4' },
      ],
    },
    {
      name: 'isPrimary',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Is this a primary keyword for a page (vs. secondary)?',
      },
    },
    {
      name: 'assignedPage',
      type: 'relationship',
      relationTo: ['services', 'locations', 'service-locations', 'posts'],
      hasMany: false,
      // Restrict selectable collections based on keywordType value
      filterOptions: ({ siblingData }) => {
        const keywordType = siblingData?.keywordType;
        switch (keywordType) {
          case 'service':
            return { relationTo: { in: ['services'] } };
          case 'location':
            return { relationTo: { in: ['locations'] } };
          case 'service_location':
            return { relationTo: { in: ['service-locations'] } };
          case 'informational':
            return { relationTo: { in: ['posts'] } };
          default:
            return {};
        }
      },
      admin: {
        description: 'The page this keyword is assigned to (filtered by keywordType)',
      },
    },
    {
      name: 'relatedService',
      type: 'relationship',
      relationTo: 'services',
      hasMany: false,
    },
    {
      name: 'relatedLocation',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: false,
    },
    {
      name: 'geoModifier',
      type: 'text',
      admin: {
        description: 'The geographic portion of the keyword (city, zip, neighborhood)',
      },
    },
    {
      name: 'seasonality',
      type: 'select',
      options: [
        { label: 'Evergreen', value: 'evergreen' },
        { label: 'Winter Peak', value: 'winter' },
        { label: 'Spring Peak', value: 'spring' },
        { label: 'Summer Peak', value: 'summer' },
        { label: 'Fall Peak', value: 'fall' },
        { label: 'Storm/Emergency', value: 'storm' },
      ],
      defaultValue: 'evergreen',
    },
    {
      name: 'currentRank',
      type: 'number',
      min: 0,
      admin: {
        description: 'Current organic ranking position (0 = not ranking)',
      },
    },
    {
      name: 'targetRank',
      type: 'number',
      min: 1,
      max: 10,
      admin: {
        description: 'Target ranking position',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        description: 'Last time ranking/volume data was refreshed',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Research notes, SERP observations, strategy notes',
      },
    },
  ],
  timestamps: true,
};

export default Keywords;
```

#### 14.2 SEO Fields on Content Collections

Add SEO keyword fields to every content collection (services, locations, service-locations, posts):

```typescript
// fields/seoKeywordFields.ts
// Payload v3 imports — see https://payloadcms.com/docs/getting-started/installation
import type { Field } from 'payload';

export const seoKeywordFields: Field[] = [
  {
    name: 'seo',
    type: 'group',
    label: 'SEO & Keywords',
    admin: {
      description: 'Keyword targeting and SEO configuration for this page',
    },
    fields: [
      {
        name: 'primaryKeyword',
        type: 'relationship',
        relationTo: 'keywords',
        hasMany: false,
        admin: {
          description: 'The primary keyword this page targets (one per page)',
        },
      },
      {
        name: 'secondaryKeywords',
        type: 'relationship',
        relationTo: 'keywords',
        hasMany: true,
        admin: {
          description: 'Secondary keywords this page also targets (3-8 recommended)',
        },
      },
      {
        name: 'metaTitle',
        type: 'text',
        maxLength: 60,
        admin: {
          description: 'Title tag (max 60 chars). Include primary keyword.',
        },
      },
      {
        name: 'metaDescription',
        type: 'textarea',
        maxLength: 160,
        admin: {
          description: 'Meta description (max 160 chars). Include primary keyword and CTA.',
        },
      },
      {
        name: 'h1Override',
        type: 'text',
        admin: {
          description: 'Override the auto-generated H1 tag. Leave blank to use default.',
        },
      },
      {
        name: 'targetSearchIntent',
        type: 'select',
        options: [
          { label: 'Informational', value: 'informational' },
          { label: 'Commercial Investigation', value: 'commercial' },
          { label: 'Transactional', value: 'transactional' },
          { label: 'Navigational', value: 'navigational' },
        ],
      },
      {
        name: 'serpFeatures',
        type: 'select',
        hasMany: true,
        options: [
          { label: 'Local Pack', value: 'local_pack' },
          { label: 'Featured Snippet', value: 'featured_snippet' },
          { label: 'People Also Ask', value: 'paa' },
          { label: 'Video Results', value: 'video' },
          { label: 'AI Overview', value: 'ai_overview' },
          { label: 'Image Pack', value: 'image_pack' },
          { label: 'Reviews/Stars', value: 'reviews' },
        ],
        admin: {
          description: 'SERP features observed for the primary keyword',
        },
      },
      {
        name: 'contentRequirements',
        type: 'group',
        fields: [
          {
            name: 'targetWordCount',
            type: 'number',
            min: 300,
            defaultValue: 1000,
          },
          {
            name: 'requiredSections',
            type: 'select',
            hasMany: true,
            options: [
              { label: 'Service Description', value: 'service_desc' },
              { label: 'Process/Steps', value: 'process' },
              { label: 'Pricing/Cost', value: 'pricing' },
              { label: 'FAQ', value: 'faq' },
              { label: 'Testimonials', value: 'testimonials' },
              { label: 'Service Area', value: 'service_area' },
              { label: 'Trust Signals', value: 'trust' },
              { label: 'Before/After', value: 'before_after' },
            ],
          },
        ],
      },
    ],
  },
];
```

#### 14.3 Competitor Analysis Collection

Store competitor research data in Payload CMS for reference and tracking:

```typescript
// collections/Competitors.ts
// Payload v3 imports — see https://payloadcms.com/docs/getting-started/installation
import type { CollectionConfig } from 'payload';

const Competitors: CollectionConfig = {
  slug: 'competitors',
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['companyName', 'website', 'competitorType', 'domainRating', 'estimatedTraffic'],
    group: 'SEO',
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'website',
      type: 'text',
      required: true,
    },
    {
      name: 'competitorType',
      type: 'select',
      required: true,
      options: [
        { label: 'Direct (Local)', value: 'direct' },
        { label: 'Indirect (National/Aggregator)', value: 'indirect' },
        { label: 'Content Competitor', value: 'content' },
      ],
    },
    {
      name: 'domainRating',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'estimatedTraffic',
      type: 'number',
      admin: { description: 'Estimated monthly organic traffic' },
    },
    {
      name: 'totalPages',
      type: 'number',
    },
    {
      name: 'servicePages',
      type: 'number',
    },
    {
      name: 'locationPages',
      type: 'number',
    },
    {
      name: 'blogPosts',
      type: 'number',
    },
    {
      name: 'gbpReviewCount',
      type: 'number',
    },
    {
      name: 'gbpRating',
      type: 'number',
      min: 0,
      max: 5,
    },
    {
      name: 'referringDomains',
      type: 'number',
    },
    {
      name: 'urlStructure',
      type: 'textarea',
      admin: { description: 'Document their URL patterns' },
    },
    {
      name: 'schemaTypes',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'LocalBusiness', value: 'local_business' },
        { label: 'Service', value: 'service' },
        { label: 'FAQ', value: 'faq' },
        { label: 'AggregateRating', value: 'aggregate_rating' },
        { label: 'HowTo', value: 'howto' },
        { label: 'BreadcrumbList', value: 'breadcrumb' },
        { label: 'Organization', value: 'organization' },
      ],
    },
    {
      name: 'cwvScores',
      type: 'group',
      fields: [
        { name: 'lcp', type: 'number', admin: { description: 'LCP in seconds' } },
        { name: 'inp', type: 'number', admin: { description: 'INP in milliseconds' } },
        { name: 'cls', type: 'number', admin: { description: 'CLS score' } },
        { name: 'mobileScore', type: 'number', min: 0, max: 100 },
        { name: 'desktopScore', type: 'number', min: 0, max: 100 },
      ],
    },
    {
      name: 'strengths',
      type: 'textarea',
    },
    {
      name: 'weaknesses',
      type: 'textarea',
    },
    {
      name: 'lastAnalyzed',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
};

export default Competitors;
```

### CSV Import Format for Keyword Data

For bulk keyword import into Payload CMS, use this standardized CSV format:

```csv
keyword,searchVolume,difficulty,difficultySource,intent,keywordType,tier,isPrimary,geoModifier,seasonality,notes
drain cleaning Austin TX,320,18,ahrefs,transactional,service_location,tier1,true,Austin TX,evergreen,
drain cleaning Austin,280,18,ahrefs,transactional,service_location,tier1,false,Austin,evergreen,Variant of primary
Austin drain cleaning,200,17,ahrefs,transactional,service_location,tier1,false,Austin,evergreen,City-first variant
drain unclogging Austin TX,90,12,ahrefs,transactional,service_location,tier2,false,Austin TX,evergreen,Synonym
clogged drain Austin,70,10,ahrefs,transactional,service_location,tier2,false,Austin,evergreen,Problem keyword
emergency drain cleaning Austin,40,8,ahrefs,transactional,service_location,tier2,false,Austin,evergreen,Emergency modifier
how much does drain cleaning cost,1200,22,ahrefs,informational,informational,tier2,true,,evergreen,Blog target
drain cleaning cost Austin,110,15,ahrefs,commercial,service_location,tier2,true,Austin,evergreen,Cost guide target
hydro jetting Austin TX,70,15,ahrefs,transactional,service_location,tier2,true,Austin TX,evergreen,Sub-service
drain cleaning near me,8100,55,ahrefs,transactional,service,tier4,false,,evergreen,National - rank via local pages
plumber Austin TX,3600,42,ahrefs,transactional,service_location,tier1,true,Austin TX,evergreen,Homepage target
water heater installation Austin TX,260,22,ahrefs,transactional,service_location,tier1,true,Austin TX,evergreen,High business value
furnace repair Austin TX,320,20,ahrefs,transactional,service_location,tier1,true,Austin TX,winter,Seasonal - winter peak
AC repair Austin TX,480,35,ahrefs,transactional,service_location,tier1,true,Austin TX,summer,Seasonal - summer peak
```

### Payload CMS Import Script

```typescript
// scripts/importKeywords.ts
// Payload v3 imports — use getPayload() instead of the default import
import { getPayload } from 'payload';
import config from '@payload-config';
import fs from 'fs';
import csv from 'csv-parser';

interface KeywordRow {
  keyword: string;
  searchVolume: string;
  difficulty: string;
  difficultySource: string;
  intent: string;
  keywordType: string;
  tier: string;
  isPrimary: string;
  geoModifier: string;
  seasonality: string;
  notes: string;
}

async function importKeywords(csvPath: string) {
  const payload = await getPayload({ config });
  const rows: KeywordRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: KeywordRow) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Importing ${rows.length} keywords...`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      // Check if keyword already exists
      const existing = await payload.find({
        collection: 'keywords',
        where: { keyword: { equals: row.keyword } },
        limit: 1,
      });

      const data = {
        keyword: row.keyword,
        searchVolume: parseInt(row.searchVolume, 10),
        difficulty: parseInt(row.difficulty, 10),
        difficultySource: row.difficultySource || 'ahrefs',
        intent: row.intent,
        keywordType: row.keywordType,
        tier: row.tier,
        isPrimary: row.isPrimary === 'true',
        geoModifier: row.geoModifier || undefined,
        seasonality: row.seasonality || 'evergreen',
        notes: row.notes || undefined,
        lastUpdated: new Date().toISOString(),
      };

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'keywords',
          id: existing.docs[0].id,
          data,
        });
        updated++;
      } else {
        await payload.create({
          collection: 'keywords',
          data,
        });
        created++;
      }
    } catch (err) {
      console.error(`Error importing "${row.keyword}":`, err);
      errors++;
    }
  }

  console.log(`Import complete: ${created} created, ${updated} updated, ${errors} errors`);
}

// Usage: npx ts-node scripts/importKeywords.ts ./data/keywords.csv
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx ts-node scripts/importKeywords.ts <path-to-csv>');
  process.exit(1);
}

importKeywords(csvPath);
```

### Maintaining Keyword Maps Over Time

Keyword data decays. Search volumes shift, competitors enter and exit, new keywords emerge, and Google changes what it rewards. Keyword maintenance is an ongoing process.

**Monthly maintenance tasks:**

1. **Refresh ranking data** — Pull current rankings for all tracked keywords using Ahrefs, SEMrush, or BrightLocal rank tracker. Update `currentRank` in Payload CMS.
2. **Check for new keyword opportunities** — Run content gap analysis against competitors quarterly. Add new keywords to the master list.
3. **Review seasonal keywords** — Before each season, verify volume data for seasonal terms and ensure corresponding pages are updated/published.
4. **Prune low-performers** — If a keyword has shown zero impressions in Search Console for 6+ months, reassess whether the page targeting it should be maintained, consolidated, or noindexed.
5. **Update search volume data** — Re-pull search volumes from Ahrefs/SEMrush every 6 months. Volume trends change, especially in growing/shrinking markets.

**Quarterly maintenance tasks:**

1. **Re-run competitor analysis** — Check if new competitors have entered the market. Update competitor collection in Payload CMS.
2. **SERP feature audit** — Re-check SERP layouts for top 20 keywords. Have AI Overviews appeared? Has the local pack changed?
3. **Content gap refresh** — Run a new content gap analysis against updated competitor data.
4. **Keyword-to-page mapping audit** — Check for cannibalization. Verify that primary keywords are assigned to the correct pages.

---

## 15. Repeatable Client Onboarding Keyword Research Workflow

### Overview

This workflow is designed for an agency team member to follow for every new client. It is structured as a checklist with time estimates. Total estimated time: 12-20 hours per client.

---

### Phase 1: Client Discovery (2-3 hours)

```markdown
## Phase 1: Client Discovery

### 1.1 Client Intake Interview
- [ ] Schedule 60-minute intake call with client
- [ ] Record the call (with permission) for reference
- [ ] Cover the following questions:

**Business basics:**
- [ ] What services do you offer? (Get the full list)
- [ ] Which services generate the most revenue?
- [ ] Which services do you want to grow?
- [ ] What is your service area? (Cities, radius from HQ)
- [ ] How far are you willing to travel for a job?
- [ ] What sets you apart from competitors? (USP)
- [ ] Do you offer emergency/24-7 service?
- [ ] What are your business hours?

**Customer insights:**
- [ ] What do customers call your services? (Their language vs. your industry terms)
- [ ] Who are your typical customers? (Homeowners, property managers, commercial)
- [ ] What are the most common problems customers call about?
- [ ] What questions do customers ask most often?
- [ ] Who do you lose jobs to? (Competitor names)

**Digital presence:**
- [ ] Current website URL
- [ ] Google Business Profile URL
- [ ] Existing Google Ads account?
- [ ] Any existing SEO work or content?
- [ ] Social media accounts
- [ ] Review profiles (Yelp, BBB, etc.)

### 1.2 Gather Client Data
- [ ] Request customer zip code data (from invoicing/CRM) for last 12 months
- [ ] Request list of all services with descriptions and pricing ranges
- [ ] Request list of brands/products they work with (for brand keyword modifiers)
- [ ] Request any existing marketing materials (brochures, flyers — they contain service language)
- [ ] Get GBP access or screenshot of GBP insights (search queries driving impressions)
- [ ] Get Google Search Console access if site exists
- [ ] Get Google Analytics access if site exists
```

---

### Phase 2: Competitor Identification (2-3 hours)

```markdown
## Phase 2: Competitor Identification

### 2.1 Direct Competitor Research
- [ ] Search top 5 service+city keywords in Google (incognito, location set to client's city)
- [ ] Record all local businesses in Local Pack (positions 1-3) for each search
- [ ] Record all local businesses in organic results (positions 1-10) for each search
- [ ] Search Google Maps for each service in client's city
- [ ] Search Yelp, BBB, HomeAdvisor for client's services in their city
- [ ] Add competitors named by client during intake
- [ ] Deduplicate and compile final list of 8-15 direct competitors
- [ ] Fill in Competitor Identification Template (Section 2) for each

### 2.2 Indirect Competitor Research
- [ ] Note all non-local results on page 1 for each keyword search
- [ ] Record aggregator presence (Angi, Thumbtack, HomeAdvisor, Yelp)
- [ ] Record franchise presence (Roto-Rooter, Mr. Rooter, etc.)
- [ ] Record publisher presence (Forbes Home, This Old House, etc.)
- [ ] Document which SERP positions these indirect competitors hold

### 2.3 Content Competitor Research
- [ ] Search 3-5 informational queries related to client's services
- [ ] Record top-ranking content publishers
- [ ] Note content formats (blog posts, videos, tools/calculators)
- [ ] Fill in Content Competitor section of template

### 2.4 Enter Competitor Data into Payload CMS
- [ ] Create competitor records in Payload CMS Competitors collection
- [ ] Include website, DA/DR, GBP info, page counts
```

---

### Phase 3: Competitor Analysis (3-4 hours)

```markdown
## Phase 3: Competitor Analysis

### 3.1 Technical Analysis (per competitor, top 5)
- [ ] Run through Ahrefs/SEMrush Site Explorer — record DR, traffic, keywords, backlinks
- [ ] Check XML sitemap — count pages by type
- [ ] Analyze URL structure patterns — document in competitor record
- [ ] Run PageSpeed Insights on 3 pages — record CWV scores
- [ ] Check schema markup on 3 pages — record schema types used
- [ ] Note mobile responsiveness and UX quality

### 3.2 Content Depth Analysis (top 3 competitors)
- [ ] Select 1 service page, 1 location page, 1 service+location page per competitor
- [ ] Fill in Content Depth Scorecard (Section 3.3) for each page
- [ ] Calculate averages across competitors
- [ ] Define minimum content requirements for our templates

### 3.3 Keyword Analysis
- [ ] Export organic keyword lists from Ahrefs/SEMrush for top 5 competitors
- [ ] Merge and deduplicate keyword lists
- [ ] Identify keywords where 3+ competitors rank (validated demand)
- [ ] Run Content Gap analysis (Section 11)

### 3.4 Backlink Analysis (top 5 competitors)
- [ ] Pull referring domain reports from Ahrefs for each competitor
- [ ] Identify common backlink sources (directories, associations, suppliers)
- [ ] Calculate average DR and referring domain count for ranking competitors
- [ ] Create initial link building opportunity list

### 3.5 Compile Competitor Analysis Summary
- [ ] Write Competitor Analysis Summary (Section 3 template)
- [ ] Identify top 3 strategic opportunities
- [ ] Identify top 3 strategic threats
- [ ] Define recommended approach
- [ ] Share summary with team and client for review
```

---

### Phase 4: Keyword Research (3-5 hours)

```markdown
## Phase 4: Keyword Research

### 4.1 Service Keyword Research
- [ ] Start with industry seed list (Section 5) for client's vertical
- [ ] Customize seed list based on client's actual services
- [ ] Expand each seed through Ahrefs Keywords Explorer (Matching Terms + Related Terms)
- [ ] Expand each seed through SEMrush Keyword Magic Tool
- [ ] Run Google Keyword Planner with location set to client's service area
- [ ] Run Google Autocomplete alphabet expansion for top 10 seeds
- [ ] Collect People Also Ask questions for top 20 keywords
- [ ] Collect Related Searches for top 20 keywords
- [ ] Build Service Keyword Matrix (Section 5) with all modifier types:
  - [ ] Cost modifiers
  - [ ] Emergency modifiers
  - [ ] Type/brand modifiers
  - [ ] Problem modifiers
  - [ ] Commercial intent modifiers

### 4.2 Location Keyword Research
- [ ] Build Location Hierarchy (Section 6.2) for client's service area
- [ ] Pull population data for each city/town from Census data
- [ ] Cross-reference with client's customer zip code data
- [ ] Check search volume for [service] [city] combos for each location
- [ ] Score and prioritize locations using Location Prioritization Matrix (Section 6.6)
- [ ] Determine which locations warrant dedicated pages vs. regional mentions

### 4.3 Build Master Keyword List
- [ ] Merge all keyword data into single spreadsheet/CSV
- [ ] Remove duplicates
- [ ] Remove irrelevant keywords (DIY-only, different industry, wrong location)
- [ ] Remove zero-volume keywords (unless high commercial intent)
- [ ] Standardize formatting (lowercase, consistent spacing)
- [ ] Add search volume data for all keywords
- [ ] Add KD scores for all keywords
- [ ] Tag source tool for each keyword
- [ ] Final keyword count: [Number]
```

---

### Phase 5: Keyword Classification & Mapping (2-3 hours)

```markdown
## Phase 5: Keyword Classification & Mapping

### 5.1 Search Intent Classification
- [ ] Classify every keyword by intent (informational, commercial, transactional, navigational)
- [ ] For ambiguous keywords, search Google and check SERP to determine dominant intent
- [ ] Tag intent in master keyword spreadsheet

### 5.2 Keyword Difficulty Tiering
- [ ] Assign KD tier to every keyword (Tier 1-4 per Section 7)
- [ ] Identify all Tier 1 (quick win) keywords — these inform launch priorities
- [ ] Tag tier in master keyword spreadsheet

### 5.3 Keyword-to-Page Mapping
- [ ] Define page type taxonomy (Section 9)
- [ ] Assign primary keyword to each planned page
- [ ] Assign 3-8 secondary keywords to each planned page
- [ ] Verify no keyword cannibalization (no primary keyword assigned to 2+ pages)
- [ ] Fill in Keyword Mapping Template (Section 9 CSV format)
- [ ] Map informational keywords to planned blog posts

### 5.4 Prioritization
- [ ] Score every service+location combo using Prioritization Matrix (Section 10)
- [ ] Assign build tiers (Tier 1 launch, Tier 2 month 1, Tier 3 month 2-3, Tier 4 ongoing)
- [ ] Finalize launch page list (Tier 1 — typically 15-25 service+location pages)
- [ ] Create build timeline with page counts per month

### 5.5 SERP Analysis for Priority Keywords
- [ ] Perform SERP analysis (Section 12) for top 20 priority keywords
- [ ] Record SERP features for each keyword
- [ ] Define content requirements based on SERP analysis
- [ ] Document any AI Overview presence and impact on click-through expectations
```

---

### Phase 6: Data Import & Documentation (1-2 hours)

```markdown
## Phase 6: Data Import & Documentation

### 6.1 Prepare Data for Payload CMS
- [ ] Format master keyword list as CSV per import format (Section 14)
- [ ] Validate all required fields are populated
- [ ] Run import script to load keywords into Payload CMS Keywords collection
- [ ] Verify import — spot-check 10 random keywords in Payload admin

### 6.2 Link Keywords to Content
- [ ] Once service and location collections are populated, link keywords to pages
  - [ ] Set primaryKeyword relationship on each service page
  - [ ] Set primaryKeyword relationship on each location page
  - [ ] Set primaryKeyword relationship on each service+location page
  - [ ] Set secondaryKeywords relationships on each page
- [ ] Populate SEO fields (metaTitle, metaDescription) based on keyword assignments

### 6.3 Documentation
- [ ] Create client-specific keyword research summary document
- [ ] Include: total keywords found, keywords by tier, keywords by intent, top opportunities
- [ ] Include: prioritized build plan (which pages to create first)
- [ ] Include: competitive landscape summary (key findings)
- [ ] Store in project repository / shared drive
- [ ] Share summary with client for review/approval

### 6.4 Handoff to Build Team
- [ ] Brief the build team on:
  - [ ] URL structure (informed by competitor analysis and keyword patterns)
  - [ ] Content depth requirements (informed by SERP analysis)
  - [ ] Schema requirements
  - [ ] Priority page list and build order
  - [ ] Blog editorial calendar (informational keywords)
- [ ] Confirm template content sections match SERP-derived requirements
- [ ] Verify programmatic generation logic produces correct primary keywords in title/H1/URL
```

---

### Phase 7: Ongoing Monitoring (Recurring)

```markdown
## Phase 7: Ongoing Monitoring

### Monthly (30 minutes per client)
- [ ] Pull ranking report from Ahrefs/SEMrush/BrightLocal
- [ ] Update currentRank for tracked keywords in Payload CMS
- [ ] Flag keywords that moved significantly (up or down 5+ positions)
- [ ] Check Search Console for new queries driving impressions (potential new keywords)
- [ ] Check for new PAA questions appearing for target keywords

### Quarterly (2 hours per client)
- [ ] Re-run competitor analysis for top 3 competitors
- [ ] Update competitor records in Payload CMS
- [ ] Run new content gap analysis
- [ ] Add new keywords to master list
- [ ] Re-check SERP features for top 20 keywords
- [ ] Review and refresh seasonal keyword priorities
- [ ] Audit for keyword cannibalization
- [ ] Update keyword-to-page mapping as new pages are published

### Annually (4 hours per client)
- [ ] Full keyword research refresh (repeat Phase 4)
- [ ] Full competitor analysis refresh (repeat Phase 3)
- [ ] Re-evaluate location priorities (population changes, new developments)
- [ ] Audit all existing pages for keyword alignment
- [ ] Prune or consolidate underperforming pages
- [ ] Update content requirements based on evolving SERP standards
```

---

## Appendix A: Quick Reference — Keyword Research Checklist (One-Pager)

```
NEW CLIENT KEYWORD RESEARCH — QUICK CHECKLIST

□ Client intake interview completed
□ Client data gathered (service list, service area, customer zip codes)
□ 8-15 direct competitors identified
□ Top 5 competitors analyzed (DA, pages, content depth, schema, CWV, backlinks)
□ Competitor Analysis Summary written
□ Seed keywords generated (industry list + client customization)
□ Keywords expanded via Ahrefs/SEMrush/GKP/Google Suggest/PAA
□ Location hierarchy built and prioritized
□ Master keyword list cleaned and deduplicated
□ Every keyword classified by intent
□ Every keyword assigned a KD tier
□ Every keyword mapped to a page (primary or secondary)
□ No keyword cannibalization
□ Service+location combos prioritized (build order)
□ SERP analysis completed for top 20 keywords
□ Content requirements defined per page type
□ Keywords imported into Payload CMS
□ Keywords linked to content collections
□ Client summary document created
□ Build team briefed
□ Monthly monitoring schedule set
```

---

## Appendix B: Keyword Research CSV Template (Blank)

```csv
keyword,searchVolume,difficulty,difficultySource,intent,keywordType,tier,isPrimary,geoModifier,seasonality,notes
```

> **Note:** The columns `assignedPageSlug`, `currentRank`, and `targetRank` are not handled by the import script. These fields are managed post-import via the Payload CMS admin UI — use the `assignedPage` relationship field and rank tracking fields directly in the CMS.

**Field definitions:**

| Field | Type | Required | Description |
|---|---|---|---|
| keyword | string | Yes | The exact keyword phrase |
| searchVolume | integer | Yes | Monthly search volume |
| difficulty | integer | Yes | KD score (0-100) |
| difficultySource | enum | Yes | ahrefs, semrush, moz, manual |
| intent | enum | Yes | informational, commercial, transactional, navigational |
| keywordType | enum | Yes | service, location, service_location, informational, brand |
| tier | enum | Yes | tier1, tier2, tier3, tier4 |
| isPrimary | boolean | Yes | true if this is the primary keyword for a page |
| geoModifier | string | No | The geographic portion (city, zip, neighborhood) |
| seasonality | enum | No | evergreen, winter, spring, summer, fall, storm |
| notes | string | No | Research notes |

---

## Appendix C: Competitor Analysis Spreadsheet Template (Blank)

```csv
companyName,website,competitorType,domainRating,estimatedTraffic,totalPages,servicePages,locationPages,serviceLocationPages,blogPosts,gbpReviewCount,gbpRating,referringDomains,urlStructureNotes,schemaTypes,lcpSeconds,inpMs,cls,mobileScore,desktopScore,strengths,weaknesses,lastAnalyzed
```

---

## Appendix D: Service Keyword Seed Lists by Vertical

### Plumbing (65 seeds)
```
plumber, plumbing, drain cleaning, drain unclogging, clogged drain, slow drain,
sewer repair, sewer line repair, sewer line replacement, sewer backup, sewer camera inspection,
water heater, water heater installation, water heater repair, water heater replacement,
tankless water heater, tankless water heater installation, gas water heater, electric water heater,
pipe repair, pipe burst, burst pipe, repiping, whole house repiping, pipe leak, pipe replacement,
leak detection, leak repair, water leak, slab leak, slab leak detection, slab leak repair,
gas line, gas line repair, gas line installation, gas leak, gas pipe,
faucet repair, faucet installation, faucet replacement,
toilet repair, toilet installation, toilet replacement, running toilet, clogged toilet,
garbage disposal, garbage disposal installation, garbage disposal repair,
sump pump, sump pump installation, sump pump repair,
water softener, water softener installation, water filtration, water filtration system,
backflow prevention, backflow testing, backflow repair,
hydro jetting, trenchless sewer repair, trenchless pipe repair,
bathroom plumbing, kitchen plumbing, bathroom remodel plumbing,
commercial plumbing, emergency plumber, 24 hour plumber
```

### HVAC (60 seeds)
```
hvac, hvac repair, hvac installation, hvac maintenance, hvac service, hvac company,
air conditioning, air conditioning repair, air conditioning installation, ac repair, ac installation,
ac replacement, ac tune up, ac maintenance, ac not cooling, ac unit, central air,
heating, heating repair, heating installation, heater repair, heater installation,
furnace, furnace repair, furnace installation, furnace replacement, furnace tune up,
heat pump, heat pump repair, heat pump installation, heat pump replacement,
ductless mini split, mini split installation, mini split repair,
duct cleaning, duct repair, ductwork, ductwork installation, ductwork repair,
thermostat, thermostat installation, smart thermostat, programmable thermostat,
indoor air quality, air purifier, air filtration, uv light hvac, humidity control,
refrigerant, refrigerant recharge, R-410A, R-454B, refrigerant leak,
compressor, condenser, evaporator coil, blower motor,
commercial hvac, emergency hvac, 24 hour hvac,
hvac tune up, seasonal maintenance, winter heating, summer cooling
```

> **Note:** "Freon" (R-22 refrigerant) was phased out under EPA regulations in 2020. It is only relevant as an informational content keyword targeting owners of older systems (e.g., "freon replacement alternatives", "R-22 phase out"). Use current refrigerant terms (R-410A, R-454B) for transactional and service page targeting.

### Electrical (55 seeds)
```
electrician, electrical, electrical repair, electrical installation, electrical service,
wiring, rewiring, house rewiring, electrical wiring, wiring repair,
panel upgrade, electrical panel, breaker box, circuit breaker, breaker replacement,
outlet, outlet installation, outlet repair, gfci outlet, usb outlet,
light installation, light fixture, recessed lighting, can lights, led lighting,
ceiling fan, ceiling fan installation, ceiling fan repair,
generator, standby generator, generator installation, whole house generator, portable generator,
surge protector, whole house surge protector, surge protection,
ev charger, ev charger installation, electric vehicle charger, level 2 charger,
smoke detector, smoke detector installation, carbon monoxide detector,
landscape lighting, outdoor lighting, security lighting, motion sensor light,
electrical inspection, home electrical inspection, code compliance,
knob and tube wiring, aluminum wiring, aluminum wiring replacement,
commercial electrician, emergency electrician, 24 hour electrician,
hot tub wiring, pool wiring, spa electrical
```

### Roofing (50 seeds)
```
roofing, roofer, roofing company, roofing contractor,
roof repair, roof replacement, roof installation, new roof,
roof inspection, roof estimate, roof quote, free roof estimate,
shingle, shingle roof, asphalt shingle, architectural shingle, shingle repair, shingle replacement,
metal roof, metal roofing, standing seam metal roof, metal roof installation,
flat roof, flat roof repair, commercial flat roof, tpo roofing, epdm roofing,
tile roof, tile roof repair, clay tile roof, concrete tile roof,
slate roof, slate roof repair, slate roof installation,
roof leak, roof leak repair, leaking roof,
storm damage, hail damage, wind damage, storm damage repair, roof storm damage,
gutter, gutter installation, gutter repair, gutter cleaning, gutter guard, seamless gutter,
downspout, soffit, soffit repair, fascia, fascia repair, drip edge,
flashing, roof flashing, chimney flashing,
skylight, skylight installation, skylight repair,
roof ventilation, attic ventilation, ridge vent, attic fan,
commercial roofing, emergency roof repair
```

---

## Appendix E: Keyword Modifiers Master List

Use these modifiers crossed with service terms to expand keyword coverage:

```
COMMERCIAL INTENT:
cost, price, pricing, rates, how much, quote, estimate, free estimate, affordable,
cheap, cheapest, budget, discount, coupon, deal, financing, payment plan

URGENCY:
emergency, 24/7, 24 hour, same day, after hours, weekend, urgent, now, today,
immediate, fast, quick, asap

QUALITY:
best, top, top rated, highest rated, #1, recommended, trusted, reliable,
professional, experienced, certified, licensed, insured, bonded

LOCAL:
near me, nearby, in my area, local, close to me, around me,
in [city], [city], [city] [state], [zip code], [county], [neighborhood]

COMPARISON:
vs, versus, or, comparison, difference between, which is better,
pros and cons, advantages, disadvantages

INFORMATIONAL:
how to, what is, why, when, signs of, symptoms of, causes of,
guide, tips, advice, steps, process, explained, meaning,
should I, do I need, is it worth, how long does, how often

ACTION:
hire, find, call, book, schedule, get, contact, request, need

REVIEWS:
reviews, ratings, testimonials, complaints, reputation, bbb,
google reviews, yelp reviews

BRAND/PRODUCT:
[brand name], [model number], [product type], [material type]

SEASONAL:
winter, summer, spring, fall, seasonal, annual, yearly, monthly,
before winter, before summer, pre-season
```

---

*This document is part of the Programmatic SEO Blueprint. See also:*
- *[URL Structure Rules](./URL_STRUCTURE_RULES.md)*
- *[Local SEO & GBP](./LOCAL_SEO_AND_GBP.md)*
- *[Content Freshness Strategy](./CONTENT_FRESHNESS_STRATEGY.md)*
- *[Canonical Tags Strategy](./CANONICAL_TAGS_STRATEGY.md)*
- *[Conversion Optimization](./CONVERSION_OPTIMIZATION.md)*
- *[Image SEO Strategy](./IMAGE_SEO_STRATEGY.md)*
