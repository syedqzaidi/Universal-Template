# CMS Collections & Block Definitions — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document contains all Payload CMS plugin configuration, collection definitions (data models), and block type definitions (page template system) for the programmatic SEO stack.
>
> **Usage**: Copy these TypeScript definitions into your project's `templates/next-app/src/` directory. Customize fields per client requirements.

---

## 1. Payload CMS Plugins — Installation and Configuration

### Required Plugins for Programmatic SEO

Install all recommended plugins in the Next.js template:

```bash
cd templates/next-app

pnpm add @payloadcms/plugin-seo \
  @payloadcms/plugin-form-builder \
  @payloadcms/plugin-redirects \
  @payloadcms/plugin-nested-docs \
  @payloadcms/plugin-search \
  @payloadcms/plugin-import-export \
  @payloadcms/storage-s3
```

### Plugin Configuration in payload.config.ts

```typescript
import path from "path";
import { fileURLToPath } from "url";
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { searchPlugin } from "@payloadcms/plugin-search";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { s3Storage } from "@payloadcms/storage-s3";

// Import collections (defined in separate files)
import { Services } from "./collections/Services";
import { Locations } from "./collections/Locations";
import { ServicePages } from "./collections/ServicePages";
import { BlogPosts } from "./collections/BlogPosts";
import { FAQs } from "./collections/FAQs";
import { Testimonials } from "./collections/Testimonials";
import { TeamMembers } from "./collections/TeamMembers";
import { Media } from "./collections/Media";

export default buildConfig({
  admin: {
    importMap: { baseDir: path.resolve(dirname) },
    // White-label customization (see Section 13)
    meta: {
      titleSuffix: " — Client Portal",
      // icons: [{ url: "/custom-favicon.ico" }],
    },
    // Live preview configuration
    livePreview: {
      url: ({ data, collectionConfig }) => {
        if (collectionConfig?.slug === "services") {
          return `http://localhost:4458/services/${data?.slug}`;
        }
        if (collectionConfig?.slug === "service-pages") {
          return `http://localhost:4458/${data?.service?.slug}/${data?.location?.slug}`;
        }
        return `http://localhost:4458`;
      },
      collections: ["services", "locations", "service-pages", "blog-posts"],
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },

  collections: [
    Services,
    Locations,
    ServicePages,
    BlogPosts,
    FAQs,
    Testimonials,
    TeamMembers,
    Media,
  ],

  plugins: [
    // SEO: Adds meta title, description, OG image to specified collections
    seoPlugin({
      collections: ["services", "locations", "service-pages", "blog-posts"],
      uploadsCollection: "media",
      generateTitle: ({ doc }) => {
        if (doc?.seoTitle) return doc.seoTitle;
        return `${doc?.title || doc?.name} | Client Name`;
      },
      generateDescription: ({ doc }) => {
        if (doc?.seoDescription) return doc.seoDescription;
        return doc?.excerpt || doc?.description || "";
      },
      generateURL: ({ doc, collectionConfig }) => {
        const base = process.env.SITE_URL || "https://example.com";
        if (collectionConfig?.slug === "services") return `${base}/services/${doc?.slug}`;
        if (collectionConfig?.slug === "blog-posts") return `${base}/blog/${doc?.slug}`;
        return `${base}/${doc?.slug || ""}`;
      },
    }),

    // Form Builder: Dynamic forms for contact, lead capture, etc.
    formBuilderPlugin({
      fields: {
        text: true,
        textarea: true,
        select: true,
        email: true,
        state: true,
        country: true,
        checkbox: true,
        number: true,
        message: true,
        payment: false, // Enable if using Stripe
      },
      // Optional: send email on form submission
      // formOverrides: { ... },
      // formSubmissionOverrides: { ... },
    }),

    // Redirects: Manage URL redirects in the CMS
    redirectsPlugin({
      collections: ["services", "locations", "service-pages", "blog-posts"],
      overrides: {
        admin: {
          group: "SEO Tools",
        },
      },
    }),

    // Nested Docs: Parent/child page hierarchies with breadcrumbs
    nestedDocsPlugin({
      collections: ["services"],
      generateLabel: (_, doc) => String(doc.title || doc.name),
      generateURL: (docs) =>
        docs.reduce((url, doc) => `${url}/${String(doc.slug)}`, ""),
    }),

    // Search: Full-text search across collections
    searchPlugin({
      collections: ["services", "locations", "service-pages", "blog-posts"],
      defaultPriorities: {
        "service-pages": 10,
        services: 20,
        locations: 30,
        "blog-posts": 40,
      },
    }),

    // Import/Export: Bulk CSV/JSON import and export
    importExportPlugin({}),

    // S3 Storage: Media uploads to Supabase Storage (required for production)
    // Uncomment and configure when deploying
    // s3Storage({
    //   collections: { media: true },
    //   bucket: process.env.S3_BUCKET || "media",
    //   config: {
    //     endpoint: process.env.S3_ENDPOINT, // Supabase Storage endpoint
    //     credentials: {
    //       accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    //       secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    //     },
    //     region: process.env.S3_REGION || "us-east-1",
    //   },
    // }),
  ],

  // Localization (enable when needed for multi-language sites)
  // localization: {
  //   locales: [
  //     { label: "English", code: "en" },
  //     { label: "Spanish", code: "es" },
  //     { label: "French", code: "fr" },
  //   ],
  //   defaultLocale: "en",
  //   fallback: true,
  // },

  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "dev-secret-do-not-use-in-production",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || (() => {
        throw new Error("DATABASE_URL is not set.");
      })(),
    },
  }),
});
```

### Plugin Descriptions and What Each Does

**@payloadcms/plugin-seo**
- Adds `meta` group field to specified collections containing: `title`, `description`, `image` (OG image), and `preview` (Google SERP preview)
- Auto-generates SEO fields from document data using the `generateTitle`, `generateDescription`, and `generateURL` callbacks
- Clients can override auto-generated values for any page
- The `preview` field shows a live Google search result preview in the admin panel

**@payloadcms/plugin-form-builder**
- Creates two collections: `forms` (form definitions) and `form-submissions` (submitted data)
- Forms are built in the admin panel — clients can create contact forms, lead capture, surveys without code
- Each form defines its fields, confirmation message, and optional email notification
- Submissions are stored in the database and viewable in the admin panel
- Can trigger hooks (email via Resend, CRM sync via Twenty) on form submission

**@payloadcms/plugin-redirects**
- Creates a `redirects` collection for managing URL redirects
- Supports 301 (permanent) and 302 (temporary) redirects
- Integrates with Next.js middleware for automatic redirect handling
- Essential when restructuring sites or changing URL patterns without losing SEO equity

**@payloadcms/plugin-nested-docs**
- Adds `parent` relationship field and `breadcrumbs` array to specified collections
- Automatically generates breadcrumb trails based on parent/child hierarchy
- Generates URL paths from the hierarchy (e.g., `/services/plumbing/drain-cleaning`)
- Useful for service categories with sub-services

**@payloadcms/plugin-search**
- Creates a `search` collection that indexes documents from specified collections
- Supports priority weighting — more important collections rank higher
- Can integrate with Algolia for production-grade search
- Provides full-text search API endpoint

**@payloadcms/plugin-import-export**
- Adds import/export buttons to collection list views in the admin panel
- Supports CSV and JSON formats
- Useful for bulk content migration from WordPress or other CMSs
- Clients can export their data at any time

**@payloadcms/storage-s3**
- Replaces local disk storage for media uploads
- Required for serverless deployment (Vercel, Netlify) where there's no persistent filesystem
- Compatible with any S3-compatible storage: AWS S3, Supabase Storage, Cloudflare R2, MinIO
- Configure using Supabase Storage for zero new services (already in the stack)

---

## 2. Collection Definitions — Data Models

Each collection is defined in its own file for maintainability. Collections represent the data models — the structured content that powers every page.

### Services Collection

The core service offerings. Each service is a standalone page and a building block for cross-product pages.

```typescript
// collections/Services.ts
import type { CollectionConfig } from "payload";
import { autoGenerateSlug } from "../hooks/auto-generate-slug";

export const Services: CollectionConfig = {
  slug: "services",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "category", "status", "updatedAt"],
    group: "Content",
    description: "Service offerings — each service generates a page at /services/[slug]",
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { _status: { equals: "published" } };
      return true;
    },
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
  },
  fields: [
    // ── Core Fields ──
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: "Service name displayed as the page title" },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
        description: "URL-safe identifier — auto-generated from name",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Residential", value: "residential" },
        { label: "Commercial", value: "commercial" },
        { label: "Emergency", value: "emergency" },
        { label: "Maintenance", value: "maintenance" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      admin: { position: "sidebar" },
    },

    // ── Description & Content ──
    {
      name: "shortDescription",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: { description: "Brief description for cards, listings, and meta descriptions" },
    },
    {
      name: "description",
      type: "richText",
      admin: { description: "Full service description for the main content area" },
    },

    // ── Media ──
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: { description: "Primary image for this service (used in cards and hero)" },
    },
    {
      name: "gallery",
      type: "array",
      admin: { description: "Additional images for the service gallery" },
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "caption", type: "text" },
      ],
    },
    {
      name: "icon",
      type: "text",
      admin: { description: "Lucide icon name (e.g., 'wrench', 'zap', 'home')" },
    },

    // ── Features & Benefits ──
    {
      name: "features",
      type: "array",
      admin: { description: "Key features or selling points" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "icon", type: "text" },
      ],
    },

    // ── Pricing ──
    {
      name: "pricing",
      type: "group",
      admin: { description: "Pricing information (optional)" },
      fields: [
        { name: "startingAt", type: "number", admin: { description: "Starting price in dollars" } },
        { name: "priceRange", type: "text", admin: { description: "e.g., '$150 - $500'" } },
        { name: "unit", type: "text", admin: { description: "e.g., 'per visit', 'per hour', 'per project'" } },
        { name: "showPricing", type: "checkbox", defaultValue: false },
      ],
    },

    // ── Page Layout (Blocks) ──
    {
      name: "layout",
      type: "blocks",
      admin: { description: "Page layout — add and reorder content sections" },
      blocks: [
        // Block definitions imported from blocks/ directory
        // See Section 5 for full block definitions
      ],
    },

    // ── Relationships ──
    {
      name: "relatedServices",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
      admin: { description: "Cross-link to related services for internal linking" },
    },
    {
      name: "faqs",
      type: "relationship",
      relationTo: "faqs",
      hasMany: true,
      admin: { description: "FAQs specific to this service" },
    },

    // ── SEO Override Fields ──
    // (The SEO plugin adds meta.title, meta.description, meta.image automatically)
    // These fields provide additional SEO data:
    {
      name: "seoTitle",
      type: "text",
      admin: {
        description: "Custom SEO title (overrides auto-generated). Use for keyword targeting.",
        position: "sidebar",
      },
    },
    {
      name: "seoDescription",
      type: "textarea",
      maxLength: 160,
      admin: {
        description: "Custom meta description (overrides auto-generated). Max 160 chars.",
        position: "sidebar",
      },
    },

    // ── Schema.org Structured Data ──
    {
      name: "schemaType",
      type: "select",
      defaultValue: "Service",
      options: [
        { label: "Service", value: "Service" },
        { label: "ProfessionalService", value: "ProfessionalService" },
        { label: "HomeAndConstructionBusiness", value: "HomeAndConstructionBusiness" },
        { label: "FinancialService", value: "FinancialService" },
        { label: "HealthAndBeautyBusiness", value: "HealthAndBeautyBusiness" },
        { label: "LegalService", value: "LegalService" },
      ],
      admin: {
        position: "sidebar",
        description: "Schema.org type for structured data (affects rich snippets in Google)",
      },
    },
  ],
};
```

### Locations Collection

Geographic areas the business serves. Each location can generate its own page and combine with services for cross-product pages.

```typescript
// collections/Locations.ts
import type { CollectionConfig } from "payload";
import { autoGenerateSlug } from "../hooks/auto-generate-slug";

export const Locations: CollectionConfig = {
  slug: "locations",
  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "city", "state", "type", "status"],
    group: "Content",
    description: "Service areas — cities, neighborhoods, zip codes",
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 25,
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { _status: { equals: "published" } };
      return true;
    },
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
  },
  fields: [
    // ── Core Fields ──
    {
      name: "displayName",
      type: "text",
      required: true,
      admin: { description: "Display name (e.g., 'Austin, TX' or 'Downtown Austin')" },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar" },
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "City", value: "city" },
        { label: "Neighborhood", value: "neighborhood" },
        { label: "County", value: "county" },
        { label: "Region", value: "region" },
        { label: "Zip Code", value: "zip" },
        { label: "State", value: "state" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: { position: "sidebar" },
    },

    // ── Geographic Data ──
    {
      name: "city",
      type: "text",
      required: true,
    },
    {
      name: "state",
      type: "text",
      required: true,
      admin: { description: "Full state name (e.g., 'Texas')" },
    },
    {
      name: "stateCode",
      type: "text",
      required: true,
      maxLength: 2,
      admin: { description: "Two-letter state code (e.g., 'TX')" },
    },
    {
      name: "zipCodes",
      type: "text",
      admin: { description: "Comma-separated zip codes served in this area" },
    },
    {
      name: "coordinates",
      type: "point",
      admin: { description: "Latitude/longitude for map embeds" },
    },
    {
      name: "population",
      type: "number",
      admin: { description: "Population (for content generation and prioritization)" },
    },
    {
      name: "timezone",
      type: "text",
      admin: { description: "e.g., 'America/Chicago'" },
    },

    // ── Content ──
    {
      name: "description",
      type: "richText",
      admin: { description: "About this location — local information, service area details" },
    },
    {
      name: "areaInfo",
      type: "textarea",
      admin: { description: "Brief area description for use in cross-product pages" },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: { description: "Representative image of this area" },
    },

    // ── Relationships ──
    {
      name: "parentLocation",
      type: "relationship",
      relationTo: "locations",
      admin: { description: "Parent location (e.g., city is parent of neighborhood)" },
    },
    {
      name: "nearbyLocations",
      type: "relationship",
      relationTo: "locations",
      hasMany: true,
      admin: { description: "Nearby areas for cross-linking" },
    },
  ],
};
```

### Service Pages Collection (Cross-Product)

This is the core of programmatic SEO. Each document represents a unique service + location combination, generating pages like "Plumbing in Austin TX".

```typescript
// collections/ServicePages.ts
import type { CollectionConfig } from "payload";

export const ServicePages: CollectionConfig = {
  slug: "service-pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "service", "location", "status", "updatedAt"],
    group: "Content",
    description: "Service + Location combination pages — the core of programmatic SEO",
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 10,
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { _status: { equals: "published" } };
      return true;
    },
  },
  hooks: {
    beforeChange: [
      // Auto-generate slug from service + location relationship
      // Pattern: [service-slug]-in-[location-slug]
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.slug && data.service && data.location) {
          const serviceDoc = await req.payload.findByID({ collection: 'services', id: data.service });
          const locationDoc = await req.payload.findByID({ collection: 'locations', id: data.location });
          if (serviceDoc?.slug && locationDoc?.slug) {
            data.slug = `${serviceDoc.slug}-in-${locationDoc.slug}`;
          }
        }
        return data;
      },
    ],
  },
  fields: [
    // ── Auto-generated Title ──
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "Page title — auto-generated as '[Service] in [Location]' but can be customized",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "URL slug — auto-generated as '[service-slug]-in-[location-slug]'" },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: { position: "sidebar" },
    },

    // ── Relationships (the cross-product) ──
    {
      name: "service",
      type: "relationship",
      relationTo: "services",
      required: true,
      admin: { description: "Which service this page is about" },
    },
    {
      name: "location",
      type: "relationship",
      relationTo: "locations",
      required: true,
      admin: { description: "Which location this page targets" },
    },

    // ── Unique Content per Combination ──
    {
      name: "headline",
      type: "text",
      admin: {
        description: "Custom headline (e.g., 'Expert Plumbing Services in Austin, TX')",
      },
    },
    {
      name: "introduction",
      type: "richText",
      admin: {
        description: "Unique intro paragraph for this service+location combo. AI-generated or manually written.",
      },
    },
    {
      name: "localContent",
      type: "richText",
      admin: {
        description: "Location-specific content — local regulations, area-specific tips, etc.",
      },
    },

    // ── Page Layout (Blocks) ──
    {
      name: "layout",
      type: "blocks",
      admin: { description: "Page content sections" },
      blocks: [
        // Same blocks as Services, reused
      ],
    },

    // ── SEO Overrides ──
    {
      name: "seoTitle",
      type: "text",
      admin: { description: "Custom SEO title for this specific combination" },
    },
    {
      name: "seoDescription",
      type: "textarea",
      maxLength: 160,
    },

    // ── Internal Linking ──
    {
      name: "relatedServicePages",
      type: "relationship",
      relationTo: "service-pages",
      hasMany: true,
      admin: { description: "Related service+location pages for cross-linking" },
    },

    // ── Content Flags ──
    {
      name: "contentSource",
      type: "select",
      defaultValue: "template",
      options: [
        { label: "Template Generated", value: "template" },
        { label: "AI Generated", value: "ai" },
        { label: "Manually Written", value: "manual" },
        { label: "Enriched", value: "enriched" },
      ],
      admin: {
        position: "sidebar",
        description: "Track how this page's content was created",
      },
    },
    {
      name: "contentQualityScore",
      type: "number",
      min: 0,
      max: 100,
      admin: {
        position: "sidebar",
        description: "Content quality score (0-100) — used for prioritizing manual review",
      },
    },
  ],
};
```

### Blog Posts Collection

```typescript
// collections/BlogPosts.ts
import type { CollectionConfig } from "payload";
import { autoGenerateSlug } from "../hooks/auto-generate-slug";

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "category", "status", "publishedAt"],
    group: "Content",
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 50,
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { _status: { equals: "published" } };
      return true;
    },
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "excerpt", type: "textarea", maxLength: 300 },
    { name: "content", type: "richText", required: true },
    { name: "featuredImage", type: "upload", relationTo: "media" },
    { name: "author", type: "text" },
    { name: "publishedAt", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
    {
      name: "category",
      type: "select",
      options: [
        { label: "Tips & Guides", value: "tips" },
        { label: "Industry News", value: "news" },
        { label: "Case Studies", value: "case-studies" },
        { label: "Company Updates", value: "updates" },
      ],
    },
    {
      name: "tags",
      type: "array",
      fields: [{ name: "tag", type: "text" }],
    },
    {
      name: "relatedServices",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
    },
    {
      name: "relatedLocations",
      type: "relationship",
      relationTo: "locations",
      hasMany: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: { position: "sidebar" },
    },
  ],
};
```

### FAQs Collection

```typescript
// collections/FAQs.ts
import type { CollectionConfig } from "payload";

export const FAQs: CollectionConfig = {
  slug: "faqs",
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "service", "location", "updatedAt"],
    group: "Content",
    description: "Frequently asked questions — used in FAQ blocks and FAQ schema markup",
  },
  fields: [
    { name: "question", type: "text", required: true },
    { name: "answer", type: "richText", required: true },
    {
      name: "service",
      type: "relationship",
      relationTo: "services",
      admin: { description: "Service this FAQ applies to (leave empty for global)" },
    },
    {
      name: "location",
      type: "relationship",
      relationTo: "locations",
      admin: { description: "Location this FAQ applies to (leave empty for global)" },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: { description: "Sort order within a FAQ block (lower = first)" },
    },
  ],
};
```

### Testimonials Collection

```typescript
// collections/Testimonials.ts
import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: {
    useAsTitle: "clientName",
    defaultColumns: ["clientName", "rating", "service", "location", "updatedAt"],
    group: "Content",
  },
  fields: [
    { name: "clientName", type: "text", required: true },
    { name: "clientTitle", type: "text", admin: { description: "e.g., 'Homeowner' or 'Business Owner'" } },
    { name: "review", type: "textarea", required: true },
    { name: "rating", type: "number", min: 1, max: 5, required: true },
    { name: "date", type: "date" },
    { name: "avatar", type: "upload", relationTo: "media" },
    { name: "service", type: "relationship", relationTo: "services" },
    { name: "location", type: "relationship", relationTo: "locations" },
    { name: "featured", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
    {
      name: "source",
      type: "select",
      options: [
        { label: "Google", value: "google" },
        { label: "Yelp", value: "yelp" },
        { label: "Direct", value: "direct" },
        { label: "Facebook", value: "facebook" },
      ],
    },
  ],
};
```

### Team Members Collection

```typescript
// collections/TeamMembers.ts
import type { CollectionConfig } from "payload";

export const TeamMembers: CollectionConfig = {
  slug: "team-members",
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "role", type: "text", required: true },
    { name: "bio", type: "richText" },
    { name: "photo", type: "upload", relationTo: "media" },
    { name: "email", type: "email" },
    { name: "phone", type: "text" },
    {
      name: "locations",
      type: "relationship",
      relationTo: "locations",
      hasMany: true,
      admin: { description: "Locations this team member serves" },
    },
    {
      name: "specialties",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
    },
    {
      name: "certifications",
      type: "array",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "issuer", type: "text" },
        { name: "year", type: "number" },
      ],
    },
    { name: "sortOrder", type: "number", defaultValue: 0 },
  ],
};
```

### Media Collection (Enhanced)

```typescript
// collections/Media.ts
import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif", "application/pdf"],
    imageSizes: [
      { name: "thumbnail", width: 300, height: 300, fit: "cover" },
      { name: "card", width: 600, height: 400, fit: "cover" },
      { name: "hero", width: 1920, height: 1080, fit: "cover" },
      { name: "og", width: 1200, height: 630, fit: "cover" },
    ],
  },
  admin: {
    group: "Media",
    description: "Images, documents, and other files",
  },
  fields: [
    { name: "alt", type: "text", required: true, admin: { description: "Alt text for accessibility and SEO" } },
    { name: "caption", type: "text" },
  ],
};
```

---

## 3. Block Definitions — Page Template System

Blocks are the building blocks of page layouts. Each block type defines a reusable content section. Clients stack blocks in any order to compose pages.

### Block Type Definitions

Each block is defined in `templates/next-app/src/blocks/` and registered in the `layout` field of collections.

```typescript
// blocks/Hero.ts
import type { Block } from "payload";

export const HeroBlock: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  labels: { singular: "Hero Section", plural: "Hero Sections" },
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "subheading", type: "text" },
    { name: "backgroundImage", type: "upload", relationTo: "media" },
    {
      name: "cta",
      type: "group",
      fields: [
        { name: "text", type: "text", defaultValue: "Get a Free Quote" },
        { name: "link", type: "text" },
        { name: "phone", type: "text", admin: { description: "Phone number for click-to-call" } },
      ],
    },
    {
      name: "style",
      type: "select",
      defaultValue: "centered",
      options: [
        { label: "Centered", value: "centered" },
        { label: "Left-aligned", value: "left" },
        { label: "Split (image + text)", value: "split" },
        { label: "Full-bleed background", value: "fullbleed" },
      ],
    },
    {
      name: "overlayOpacity",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 40,
      admin: { description: "Dark overlay percentage on background image" },
    },
  ],
};
```

```typescript
// blocks/ServiceDetail.ts
import type { Block } from "payload";

export const ServiceDetailBlock: Block = {
  slug: "serviceDetail",
  interfaceName: "ServiceDetailBlock",
  labels: { singular: "Service Detail", plural: "Service Details" },
  fields: [
    { name: "heading", type: "text" },
    { name: "content", type: "richText", required: true },
    {
      name: "features",
      type: "array",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "icon", type: "text" },
      ],
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "list",
      options: [
        { label: "Feature List", value: "list" },
        { label: "Grid Cards", value: "grid" },
        { label: "Alternating Rows", value: "alternating" },
      ],
    },
  ],
};
```

```typescript
// blocks/FAQ.ts
import type { Block } from "payload";

export const FAQBlock: Block = {
  slug: "faq",
  interfaceName: "FAQBlock",
  labels: { singular: "FAQ Section", plural: "FAQ Sections" },
  fields: [
    { name: "heading", type: "text", defaultValue: "Frequently Asked Questions" },
    {
      name: "source",
      type: "select",
      defaultValue: "manual",
      options: [
        { label: "Manual (pick FAQs below)", value: "manual" },
        { label: "Auto (pull from FAQ collection by service/location)", value: "auto" },
      ],
    },
    {
      name: "faqs",
      type: "relationship",
      relationTo: "faqs",
      hasMany: true,
      admin: {
        description: "Select specific FAQs (only used when source is 'manual')",
        condition: (_, siblingData) => siblingData?.source === "manual",
      },
    },
    { name: "maxItems", type: "number", defaultValue: 8, admin: { description: "Maximum FAQs to show" } },
    { name: "generateSchema", type: "checkbox", defaultValue: true, admin: { description: "Generate FAQPage schema.org markup" } },
  ],
};
```

```typescript
// blocks/Testimonials.ts
import type { Block } from "payload";

export const TestimonialsBlock: Block = {
  slug: "testimonials",
  interfaceName: "TestimonialsBlock",
  labels: { singular: "Testimonials", plural: "Testimonials" },
  fields: [
    { name: "heading", type: "text", defaultValue: "What Our Customers Say" },
    {
      name: "source",
      type: "select",
      defaultValue: "featured",
      options: [
        { label: "Featured Only", value: "featured" },
        { label: "By Service", value: "service" },
        { label: "By Location", value: "location" },
        { label: "Manual Selection", value: "manual" },
      ],
    },
    {
      name: "testimonials",
      type: "relationship",
      relationTo: "testimonials",
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === "manual" },
    },
    { name: "maxItems", type: "number", defaultValue: 6 },
    {
      name: "layout",
      type: "select",
      defaultValue: "carousel",
      options: [
        { label: "Carousel", value: "carousel" },
        { label: "Grid", value: "grid" },
        { label: "Stack", value: "stack" },
      ],
    },
    { name: "generateSchema", type: "checkbox", defaultValue: true, admin: { description: "Generate Review schema.org markup" } },
  ],
};
```

```typescript
// blocks/CTA.ts
import type { Block } from "payload";

export const CTABlock: Block = {
  slug: "cta",
  interfaceName: "CTABlock",
  labels: { singular: "Call to Action", plural: "Calls to Action" },
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "subheading", type: "text" },
    { name: "buttonText", type: "text", defaultValue: "Contact Us" },
    { name: "buttonLink", type: "text" },
    { name: "phone", type: "text", admin: { description: "Phone number for click-to-call CTA" } },
    { name: "showForm", type: "checkbox", defaultValue: false, admin: { description: "Show inline contact form instead of/alongside button" } },
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      admin: { condition: (_, siblingData) => siblingData?.showForm },
    },
    {
      name: "style",
      type: "select",
      defaultValue: "banner",
      options: [
        { label: "Banner", value: "banner" },
        { label: "Card", value: "card" },
        { label: "Minimal", value: "minimal" },
        { label: "Full-width", value: "fullwidth" },
      ],
    },
    { name: "backgroundImage", type: "upload", relationTo: "media" },
  ],
};
```

```typescript
// blocks/LocationMap.ts
import type { Block } from "payload";

export const LocationMapBlock: Block = {
  slug: "locationMap",
  interfaceName: "LocationMapBlock",
  labels: { singular: "Location Map", plural: "Location Maps" },
  fields: [
    { name: "heading", type: "text", defaultValue: "Our Service Area" },
    { name: "embedUrl", type: "text", admin: { description: "Google Maps embed URL" } },
    { name: "address", type: "textarea", admin: { description: "Physical address displayed alongside map" } },
    { name: "serviceRadius", type: "text", admin: { description: "e.g., '25 miles from downtown'" } },
    { name: "showNearbyLocations", type: "checkbox", defaultValue: true },
  ],
};
```

```typescript
// blocks/Content.ts
import type { Block } from "payload";

export const ContentBlock: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
  labels: { singular: "Content Section", plural: "Content Sections" },
  fields: [
    { name: "heading", type: "text" },
    { name: "content", type: "richText", required: true },
    { name: "image", type: "upload", relationTo: "media" },
    {
      name: "imagePosition",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "No Image", value: "none" },
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
        { label: "Above", value: "above" },
        { label: "Below", value: "below" },
      ],
    },
  ],
};
```

```typescript
// blocks/Stats.ts
import type { Block } from "payload";

export const StatsBlock: Block = {
  slug: "stats",
  interfaceName: "StatsBlock",
  labels: { singular: "Stats / Counters", plural: "Stats / Counters" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "stats",
      type: "array",
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: "value", type: "text", required: true, admin: { description: "e.g., '500+', '24/7', '98%'" } },
        { name: "label", type: "text", required: true, admin: { description: "e.g., 'Happy Customers', 'Availability', 'Satisfaction'" } },
        { name: "icon", type: "text" },
      ],
    },
  ],
};
```

```typescript
// blocks/Gallery.ts
import type { Block } from "payload";

export const GalleryBlock: Block = {
  slug: "gallery",
  interfaceName: "GalleryBlock",
  labels: { singular: "Image Gallery", plural: "Image Galleries" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "images",
      type: "array",
      minRows: 2,
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "caption", type: "text" },
      ],
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "grid",
      options: [
        { label: "Grid", value: "grid" },
        { label: "Masonry", value: "masonry" },
        { label: "Carousel", value: "carousel" },
      ],
    },
    { name: "columns", type: "number", defaultValue: 3, min: 2, max: 4 },
  ],
};
```

```typescript
// blocks/Pricing.ts
import type { Block } from "payload";

export const PricingBlock: Block = {
  slug: "pricing",
  interfaceName: "PricingBlock",
  labels: { singular: "Pricing Table", plural: "Pricing Tables" },
  fields: [
    { name: "heading", type: "text", defaultValue: "Our Pricing" },
    { name: "subheading", type: "text" },
    {
      name: "tiers",
      type: "array",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "price", type: "text", required: true, admin: { description: "e.g., '$150', 'From $99', 'Custom'" } },
        { name: "unit", type: "text", admin: { description: "e.g., '/visit', '/hour', '/month'" } },
        { name: "description", type: "textarea" },
        {
          name: "features",
          type: "array",
          fields: [
            { name: "feature", type: "text", required: true },
            { name: "included", type: "checkbox", defaultValue: true },
          ],
        },
        { name: "highlighted", type: "checkbox", defaultValue: false },
        { name: "ctaText", type: "text", defaultValue: "Get Started" },
        { name: "ctaLink", type: "text" },
      ],
    },
    { name: "disclaimer", type: "text", admin: { description: "e.g., 'Prices may vary by location'" } },
  ],
};
```

```typescript
// blocks/Team.ts
import type { Block } from "payload";

export const TeamBlock: Block = {
  slug: "team",
  interfaceName: "TeamBlock",
  labels: { singular: "Team Section", plural: "Team Sections" },
  fields: [
    { name: "heading", type: "text", defaultValue: "Meet Our Team" },
    {
      name: "source",
      type: "select",
      defaultValue: "all",
      options: [
        { label: "All Team Members", value: "all" },
        { label: "By Location", value: "location" },
        { label: "Manual Selection", value: "manual" },
      ],
    },
    {
      name: "members",
      type: "relationship",
      relationTo: "team-members",
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === "manual" },
    },
    { name: "maxItems", type: "number", defaultValue: 8 },
    { name: "showContact", type: "checkbox", defaultValue: false },
  ],
};
```

```typescript
// blocks/RelatedLinks.ts
import type { Block } from "payload";

export const RelatedLinksBlock: Block = {
  slug: "relatedLinks",
  interfaceName: "RelatedLinksBlock",
  labels: { singular: "Related Links", plural: "Related Links" },
  fields: [
    { name: "heading", type: "text", defaultValue: "Related Services" },
    {
      name: "source",
      type: "select",
      defaultValue: "auto",
      options: [
        { label: "Auto (related services/locations)", value: "auto" },
        { label: "Manual", value: "manual" },
      ],
    },
    {
      name: "links",
      type: "array",
      admin: { condition: (_, siblingData) => siblingData?.source === "manual" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "url", type: "text", required: true },
        { name: "description", type: "textarea" },
      ],
    },
    { name: "maxItems", type: "number", defaultValue: 6 },
  ],
};
```

### Registering Blocks in Collections

Import all blocks and add them to the `layout` field in any collection that uses page templates:

```typescript
// In collections/Services.ts, collections/ServicePages.ts, etc.
import { HeroBlock } from "../blocks/Hero";
import { ServiceDetailBlock } from "../blocks/ServiceDetail";
import { FAQBlock } from "../blocks/FAQ";
import { TestimonialsBlock } from "../blocks/Testimonials";
import { CTABlock } from "../blocks/CTA";
import { LocationMapBlock } from "../blocks/LocationMap";
import { ContentBlock } from "../blocks/Content";
import { StatsBlock } from "../blocks/Stats";
import { GalleryBlock } from "../blocks/Gallery";
import { PricingBlock } from "../blocks/Pricing";
import { TeamBlock } from "../blocks/Team";
import { RelatedLinksBlock } from "../blocks/RelatedLinks";

// In the fields array:
{
  name: "layout",
  type: "blocks",
  blocks: [
    HeroBlock,
    ServiceDetailBlock,
    FAQBlock,
    TestimonialsBlock,
    CTABlock,
    LocationMapBlock,
    ContentBlock,
    StatsBlock,
    GalleryBlock,
    PricingBlock,
    TeamBlock,
    RelatedLinksBlock,
  ],
}
```
