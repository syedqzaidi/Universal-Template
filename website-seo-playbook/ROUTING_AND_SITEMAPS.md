# Routing, Sitemaps & Schema Markup — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document contains Astro dynamic route implementations, Payload CMS API helpers, sitemap/robots.txt generation, Schema.org structured data generators, and the SEO layout component.
>
> **Usage**: Copy these files into your project's `templates/astro-site/src/` directory. Update API URLs and site configuration per client.

---

## 1. Routing — Dynamic Page Generation

### Astro Dynamic Routes

Astro generates static pages at build time by fetching from Payload's REST API. Each dynamic route defines `getStaticPaths()` to enumerate all pages.

```typescript
// templates/astro-site/src/lib/payload.ts
// Helper for fetching from Payload CMS API

const PAYLOAD_API = import.meta.env.PAYLOAD_API_URL || "http://localhost:3158/api";

export async function fetchFromPayload<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${PAYLOAD_API}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Payload API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getAllServices() {
  return fetchFromPayload("services", {
    "where[status][equals]": "published",
    limit: "1000",
    depth: "1",
  });
}

export async function getAllLocations() {
  return fetchFromPayload("locations", {
    "where[status][equals]": "published",
    limit: "10000",
    depth: "1",
  });
}

export async function getAllServicePages() {
  return fetchFromPayload("service-pages", {
    "where[status][equals]": "published",
    limit: "100000",
    depth: "2",
  });
}

export async function getServiceBySlug(slug: string) {
  const result = await fetchFromPayload("services", {
    "where[slug][equals]": slug,
    "where[status][equals]": "published",
    depth: "2",
  });
  return result.docs?.[0] || null;
}

export async function getLocationBySlug(slug: string) {
  const result = await fetchFromPayload("locations", {
    "where[slug][equals]": slug,
    "where[status][equals]": "published",
    depth: "2",
  });
  return result.docs?.[0] || null;
}

export async function getServicePage(serviceSlug: string, locationSlug: string) {
  const result = await fetchFromPayload("service-pages", {
    "where[slug][equals]": `${serviceSlug}-in-${locationSlug}`,
    "where[status][equals]": "published",
    depth: "2",
  });
  return result.docs?.[0] || null;
}
```

```astro
---
// templates/astro-site/src/pages/services/[slug].astro
import SEOLayout from "../../layouts/SEOLayout.astro";
import BlockRenderer from "../../components/blocks/BlockRenderer";
import { getAllServices, getServiceBySlug } from "../../lib/payload";

export async function getStaticPaths() {
  const { docs: services } = await getAllServices();
  return services.map((service) => ({
    params: { slug: service.slug },
  }));
}

const { slug } = Astro.params;
const service = await getServiceBySlug(slug);

if (!service) return Astro.redirect("/404");
---

<SEOLayout
  title={service.meta?.title || service.name}
  description={service.meta?.description || service.shortDescription}
  ogImage={service.meta?.image?.url}
  canonicalUrl={`https://example.com/services/${service.slug}`}
  schemaType={service.schemaType}
>
  <BlockRenderer blocks={service.layout} context={{ service }} client:load />
</SEOLayout>
```

```astro
---
// templates/astro-site/src/pages/locations/[city].astro
// Dynamic route for individual location pages
import SEOLayout from "../../layouts/SEOLayout.astro";
import BlockRenderer from "../../components/blocks/BlockRenderer";
import { getAllLocations, getLocationBySlug } from "../../lib/payload";

export async function getStaticPaths() {
  const { docs: locations } = await getAllLocations();
  return locations.map((location) => ({
    params: { city: location.slug },
  }));
}

const { city } = Astro.params;
const location = await getLocationBySlug(city);

if (!location) return Astro.redirect("/404");
---

<SEOLayout
  title={location.meta?.title || location.displayName}
  description={location.meta?.description || `Services available in ${location.displayName}`}
  ogImage={location.meta?.image?.url || location.featuredImage?.url}
  canonicalUrl={`https://example.com/locations/${location.slug}`}
>
  <BlockRenderer blocks={location.layout} context={{ location }} client:load />
</SEOLayout>
```

```astro
---
// templates/astro-site/src/pages/[service]/[city].astro
// Cross-product: Service + Location combo pages
import SEOLayout from "../../layouts/SEOLayout.astro";
import BlockRenderer from "../../components/blocks/BlockRenderer";
import { getAllServicePages, getServicePage } from "../../lib/payload";

export async function getStaticPaths() {
  const { docs: servicePages } = await getAllServicePages();
  return servicePages.map((page) => ({
    params: {
      service: page.service?.slug,
      city: page.location?.slug,
    },
  }));
}

const { service: serviceSlug, city: citySlug } = Astro.params;
const page = await getServicePage(serviceSlug, citySlug);

if (!page) return Astro.redirect("/404");
---

<SEOLayout
  title={page.meta?.title || page.title}
  description={page.meta?.description || `${page.service.name} services in ${page.location.displayName}`}
  ogImage={page.meta?.image?.url || page.service.featuredImage?.url}
  canonicalUrl={`https://example.com/${serviceSlug}/${citySlug}`}
>
  <BlockRenderer blocks={page.layout} context={{ service: page.service, location: page.location }} client:load />
</SEOLayout>
```

### Sitemap Generation

For sites with thousands of pages, generate sitemaps dynamically:

```typescript
// templates/astro-site/src/pages/sitemap.xml.ts
import type { APIRoute } from "astro";
import { getAllServices, getAllLocations, getAllServicePages } from "../lib/payload";

export const GET: APIRoute = async () => {
  const [
    { docs: services },
    { docs: locations },
    { docs: servicePages },
  ] = await Promise.all([
    getAllServices(),
    getAllLocations(),
    getAllServicePages(),
  ]);

  const baseUrl = import.meta.env.SITE_URL || "https://example.com";

  // For very large sites (>50,000 URLs), split into sitemap index + multiple sitemaps
  const urls = [
    // Homepage
    { loc: baseUrl, changefreq: "weekly", priority: 1.0 },

    // Service pages
    ...services.map((s) => ({
      loc: `${baseUrl}/services/${s.slug}`,
      lastmod: s.updatedAt,
      changefreq: "monthly",
      priority: 0.8,
    })),

    // Location pages
    ...locations.map((l) => ({
      loc: `${baseUrl}/locations/${l.slug}`,
      lastmod: l.updatedAt,
      changefreq: "monthly",
      priority: 0.7,
    })),

    // Service + Location combo pages
    ...servicePages.map((sp) => ({
      loc: `${baseUrl}/${sp.service?.slug}/${sp.location?.slug}`,
      lastmod: sp.updatedAt,
      changefreq: "monthly",
      priority: 0.6,
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
};
```

```typescript
// templates/astro-site/src/pages/robots.txt.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.SITE_URL || "https://example.com";
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /admin
Disallow: /api/
`;

  return new Response(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  });
};
```

---

## 2. Schema.org Structured Data (Critical for Rich Snippets)

Schema markup is what tells Google exactly what a page is about in a machine-readable format. Proper schema implementation directly controls whether your pages get rich snippets (star ratings, FAQ dropdowns, business info panels, breadcrumbs) in search results. Pages with rich snippets get significantly higher click-through rates.

**Every page type must have the appropriate schema.** Missing schema = missed rich snippet opportunities.

#### Required Schema Types by Page

| Page Type | Required Schemas | Rich Snippet Result |
|---|---|---|
| Service page | `Service`, `BreadcrumbList`, `Organization` | Service description in knowledge panel |
| Location page | `LocalBusiness`, `BreadcrumbList`, `GeoCoordinates`, `AreaServed` | Google Maps integration, business panel |
| Service + Location page | `LocalBusiness`, `Service`, `BreadcrumbList`, `AreaServed` | Local pack listing, business info |
| Service + Location page (with reviews) | Above + `AggregateRating`, `Review` | Star ratings in search results |
| Any page with FAQ block | Above + `FAQPage` | FAQ dropdown accordion in SERP |
| Blog post | `Article`, `BreadcrumbList`, `Author` | Article rich result with date/author |
| Pricing page | Above + `Offer`, `PriceSpecification` | Price display in search results |
| Team page | `Person`, `Organization` | People info in knowledge graph |
| Contact/form page | `ContactPoint`, `Organization` | Contact info in business panel |
| Homepage | `Organization`, `WebSite`, `SearchAction` | Sitelinks search box |

#### Additional High-Value Schema Properties

Beyond the basic types, include these properties for maximum rich snippet coverage:

```typescript
// Organization schema (include on every page, usually in the layout)
{
  "@type": "Organization",
  "name": "CLIENT_NAME",
  "url": "https://clientsite.com",
  "logo": "https://clientsite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service",
    "areaServed": "US",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://facebook.com/clientname",
    "https://twitter.com/clientname",
    "https://instagram.com/clientname",
    "https://linkedin.com/company/clientname",
    "https://yelp.com/biz/clientname"
  ]
}

// WebSite schema with SearchAction (homepage only — enables sitelinks search box)
{
  "@type": "WebSite",
  "url": "https://clientsite.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://clientsite.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

Generate JSON-LD structured data for every page type. This is what powers rich snippets in Google search results.

```typescript
// templates/astro-site/src/lib/seo.ts

export function generateServiceSchema(service: any, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": service.schemaType || "Service",
    name: service.name,
    description: service.shortDescription,
    url: `${baseUrl}/services/${service.slug}`,
    image: service.featuredImage?.url,
    provider: {
      "@type": "LocalBusiness",
      name: "CLIENT_BUSINESS_NAME",
      url: baseUrl,
      // Add business-specific fields:
      // telephone: "+1-555-123-4567",
      // address: { "@type": "PostalAddress", ... },
    },
    ...(service.pricing?.showPricing && {
      offers: {
        "@type": "Offer",
        priceRange: service.pricing.priceRange,
      },
    }),
  };
}

export function generateLocalBusinessSchema(location: any, service: any, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `CLIENT_BUSINESS_NAME - ${location.displayName}`,
    url: `${baseUrl}/${service.slug}/${location.slug}`,
    description: `${service.name} services in ${location.displayName}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: location.city,
      addressRegion: location.stateCode,
    },
    ...(location.coordinates && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      },
    }),
    areaServed: {
      "@type": "City",
      name: location.city,
    },
  };
}

export function generateFAQSchema(faqs: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: typeof faq.answer === "string" ? faq.answer : extractTextFromRichText(faq.answer),
      },
    })),
  };
}

export function generateReviewSchema(testimonials: any[]) {
  const ratings = testimonials.map((t) => t.rating);
  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "CLIENT_BUSINESS_NAME",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: testimonials.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: testimonials.map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.clientName },
      reviewRating: { "@type": "Rating", ratingValue: t.rating },
      reviewBody: t.review,
      datePublished: t.date,
    })),
  };
}

export function generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

function extractTextFromRichText(richText: any): string {
  // Payload uses Lexical rich text — extract plain text from the tree
  if (!richText?.root?.children) return "";
  return richText.root.children
    .map((node: any) => {
      if (node.type === "paragraph") {
        return node.children?.map((child: any) => child.text || "").join("") || "";
      }
      return "";
    })
    .join(" ")
    .trim();
}
```

### SEO Layout Component

```astro
---
// templates/astro-site/src/layouts/SEOLayout.astro
import "../styles/global.css";

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schemaType?: string;
  schemas?: object[];
  noindex?: boolean;
}

const {
  title,
  description = "",
  ogImage,
  canonicalUrl,
  schemas = [],
  noindex = false,
} = Astro.props;

const siteUrl = import.meta.env.SITE_URL || "https://example.com";
const fullOgImage = ogImage?.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />

    <!-- Primary Meta Tags -->
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    {noindex && <meta name="robots" content="noindex, nofollow" />}

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    {fullOgImage && <meta property="og:image" content={fullOgImage} />}
    {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    {description && <meta name="twitter:description" content={description} />}
    {fullOgImage && <meta name="twitter:image" content={fullOgImage} />}

    <!-- Schema.org JSON-LD -->
    {schemas.map((schema) => (
      <script type="application/ld+json" set:html={JSON.stringify(schema)} />
    ))}
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased">
    <slot />
  </body>
</html>
```
