# Seed Scripts & Automation — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document contains all seed scripts for bulk data import, content template systems, AI content enrichment, Payload CMS lifecycle hooks, and CSV data format examples.
>
> **Usage**: Run seed scripts with `npx tsx scripts/seed-*.ts` after setting up Payload CMS. Copy hooks into `templates/next-app/src/hooks/`.

---

## Content Template System

For thousands of pages, you need a system that generates unique-enough content from templates with variable interpolation. **Templates alone are not sufficient for the 50-60% uniqueness requirement** — they must be combined with AI enrichment, dynamic data, and structural variation as described above.

```typescript
// scripts/content-templates.ts
// Content templates with variable slots for programmatic generation

export const servicePageTemplates = {
  headline: [
    "Professional {service} in {city}, {state}",
    "Expert {service} Services in {city}, {stateCode}",
    "Trusted {service} in {city} — Licensed & Insured",
    "{service} in {city}: Fast, Reliable, Affordable",
    "Top-Rated {service} Services in {city}, {state}",
  ],

  introduction: [
    "Looking for reliable {service} in {city}, {state}? Our team of licensed professionals provides top-quality {service} services to homes and businesses throughout the {city} area. With {yearsInBusiness}+ years of experience, we've built a reputation for excellence in {city} and surrounding communities.",
    "When you need {service} in {city}, trust the local experts. We've been serving {city}, {stateCode} and the surrounding {county} County area for over {yearsInBusiness} years. Our certified technicians handle everything from routine maintenance to emergency repairs.",
    "Welcome to {city}'s most trusted {service} provider. We serve residential and commercial customers across {city}, {stateCode}, including {neighborhoods}. Whether you need scheduled maintenance or urgent repairs, our team is ready 24/7.",
  ],

  localContent: [
    "Serving the greater {city} area, including {neighborhoods}. We understand the unique {service} needs of {city} residents, from {localChallenge1} to {localChallenge2}.",
    "As a {city}-based {service} company, we know the local {challengeType} challenges that homeowners face. {city}'s {weatherPattern} means your {systemType} needs regular professional attention.",
  ],

  ctaText: [
    "Ready for professional {service} in {city}? Call us today for a free estimate.",
    "Get a free {service} quote for your {city} property. Same-day service available.",
    "Schedule your {service} appointment in {city} today. Licensed, insured, and locally trusted.",
  ],
};

// Variable replacement function
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

// Pick a random template for variety
export function pickTemplate(templates: string[], seed: string): string {
  // Use a deterministic hash for consistent results across builds
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return templates[Math.abs(hash) % templates.length];
}
```

---

## AI Content Enrichment Script

For higher-quality unique content at scale, use the Payload AI plugin or an external AI API to generate unique paragraphs per page.

```typescript
// scripts/enrich-content.ts
// Run after seeding to enrich service pages with AI-generated unique content.
//
// Usage: npx tsx scripts/enrich-content.ts
//
// This script:
// 1. Fetches all service-pages where contentSource = "template"
// 2. For each page, calls an AI API to generate unique intro + local content
// 3. Updates the page via Payload REST API
// 4. Marks contentSource as "enriched"
//
// Rate limiting and error handling included.
// Requires ANTHROPIC_API_KEY or OPENAI_API_KEY in environment.

const PAYLOAD_API = process.env.PAYLOAD_API_URL || "http://localhost:3158/api";
const BATCH_SIZE = 10;
const DELAY_MS = 1000; // Delay between batches to respect rate limits

async function enrichPage(page: any) {
  const service = page.service;
  const location = page.location;

  const prompt = `Write a unique, SEO-optimized introduction paragraph (150-200 words) for a page about "${service.name}" services in "${location.displayName}, ${location.stateCode}".

Include:
- Why this service is important in this specific area
- A mention of the local area to make it geographically unique
- A call to action
- Natural keyword usage for "${service.name} in ${location.city}"

Do not use generic filler. Make it sound human-written and locally relevant.`;

  // Call your AI API of choice here
  // const response = await callAI(prompt);

  // Update the page via Payload API
  // await fetch(`${PAYLOAD_API}/service-pages/${page.id}`, {
  //   method: "PATCH",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     introduction: response.content,
  //     contentSource: "enriched",
  //     contentQualityScore: 75,
  //   }),
  // });
}

// Main execution
async function main() {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${PAYLOAD_API}/service-pages?where[contentSource][equals]=template&limit=${BATCH_SIZE}&page=${page}&depth=2`
    );
    const data = await response.json();

    for (const doc of data.docs) {
      await enrichPage(doc);
      console.log(`Enriched: ${doc.title}`);
    }

    hasMore = data.hasNextPage;
    page++;

    if (hasMore) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  console.log("Content enrichment complete.");
}

main().catch(console.error);
```

---

## Seed Scripts and Data Import

### Seed Services

```typescript
// scripts/seed-services.ts
// Bulk import services from CSV or inline data.
//
// Usage: npx tsx scripts/seed-services.ts
//
// CSV format: name,category,shortDescription,icon

import fs from "fs";
import path from "path";

const PAYLOAD_API = process.env.PAYLOAD_API_URL || "http://localhost:3158/api";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function createService(data: {
  name: string;
  category: string;
  shortDescription: string;
  icon?: string;
}) {
  const response = await fetch(`${PAYLOAD_API}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      slug: slugify(data.name),
      status: "published",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create service "${data.name}": ${error}`);
    return null;
  }

  return response.json();
}

async function seedFromCSV(csvPath: string) {
  const csv = fs.readFileSync(csvPath, "utf-8");
  const lines = csv.trim().split("\n").slice(1); // Skip header

  for (const line of lines) {
    const [name, category, shortDescription, icon] = line.split(",").map((s) => s.trim());
    const result = await createService({ name, category, shortDescription, icon });
    if (result) console.log(`Created service: ${name}`);
  }
}

// Run
const csvPath = path.resolve(__dirname, "../data/services.csv");
if (fs.existsSync(csvPath)) {
  seedFromCSV(csvPath);
} else {
  console.log("No services.csv found. Create data/services.csv with columns: name,category,shortDescription,icon");
}
```

### Seed Locations

```typescript
// scripts/seed-locations.ts
// Bulk import locations from CSV.
//
// Usage: npx tsx scripts/seed-locations.ts
//
// CSV format: displayName,city,state,stateCode,type,zipCodes,lat,lng,population

import fs from "fs";
import path from "path";

const PAYLOAD_API = process.env.PAYLOAD_API_URL || "http://localhost:3158/api";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function createLocation(data: any) {
  const response = await fetch(`${PAYLOAD_API}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      slug: slugify(`${data.city}-${data.stateCode}`),
      status: "published",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create location "${data.displayName}": ${error}`);
    return null;
  }

  return response.json();
}

async function seedFromCSV(csvPath: string) {
  const csv = fs.readFileSync(csvPath, "utf-8");
  const lines = csv.trim().split("\n").slice(1);

  for (const line of lines) {
    const [displayName, city, state, stateCode, type, zipCodes, lat, lng, population] = line.split(",").map((s) => s.trim());
    const result = await createLocation({
      displayName,
      city,
      state,
      stateCode,
      type: type || "city",
      zipCodes,
      coordinates: lat && lng ? [parseFloat(lng), parseFloat(lat)] : undefined,
      population: population ? parseInt(population) : undefined,
    });
    if (result) console.log(`Created location: ${displayName}`);
  }
}

const csvPath = path.resolve(__dirname, "../data/locations.csv");
if (fs.existsSync(csvPath)) {
  seedFromCSV(csvPath);
} else {
  console.log("No locations.csv found. Create data/locations.csv with columns: displayName,city,state,stateCode,type,zipCodes,lat,lng,population");
}
```

### Seed Cross-Product Service Pages

```typescript
// scripts/seed-service-pages.ts
// Generate service + location combination pages.
//
// Usage: npx tsx scripts/seed-service-pages.ts
//
// This creates one page for every service × location combination.
// For 50 services × 500 locations = 25,000 pages.

import { interpolate, pickTemplate, servicePageTemplates } from "./content-templates";

const PAYLOAD_API = process.env.PAYLOAD_API_URL || "http://localhost:3158/api";
const BATCH_SIZE = 50;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function fetchAll(collection: string) {
  const docs: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${PAYLOAD_API}/${collection}?where[status][equals]=published&limit=100&page=${page}`
    );
    const data = await response.json();
    docs.push(...data.docs);
    hasMore = data.hasNextPage;
    page++;
  }

  return docs;
}

async function createServicePage(service: any, location: any) {
  const seed = `${service.slug}-${location.slug}`;
  const vars = {
    service: service.name,
    city: location.city,
    state: location.state,
    stateCode: location.stateCode,
    yearsInBusiness: "15", // Customize per client
    neighborhoods: location.zipCodes || "surrounding areas",
  };

  const title = interpolate(
    pickTemplate(servicePageTemplates.headline, seed),
    vars
  );
  const introduction = interpolate(
    pickTemplate(servicePageTemplates.introduction, seed + "-intro"),
    vars
  );

  const response = await fetch(`${PAYLOAD_API}/service-pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      slug: `${service.slug}-in-${location.slug}`,
      service: service.id,
      location: location.id,
      headline: title,
      // Store introduction as plain text initially; convert to rich text if needed
      status: "published",
      contentSource: "template",
      contentQualityScore: 50,
      seoTitle: `${service.name} in ${location.city}, ${location.stateCode} | CLIENT_NAME`,
      seoDescription: `Professional ${service.name.toLowerCase()} services in ${location.city}, ${location.stateCode}. Licensed & insured. Free estimates. Call today!`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed: ${service.slug} × ${location.slug}: ${error}`);
    return false;
  }

  return true;
}

async function main() {
  console.log("Fetching services and locations...");
  const [services, locations] = await Promise.all([
    fetchAll("services"),
    fetchAll("locations"),
  ]);

  console.log(`Found ${services.length} services × ${locations.length} locations = ${services.length * locations.length} pages to create`);

  let created = 0;
  let failed = 0;

  for (const service of services) {
    for (const location of locations) {
      const success = await createServicePage(service, location);
      if (success) created++;
      else failed++;

      // Progress logging
      if ((created + failed) % 100 === 0) {
        console.log(`Progress: ${created + failed}/${services.length * locations.length} (${created} created, ${failed} failed)`);
      }
    }
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
}

main().catch(console.error);
```

---

## Automation Workflows

### Payload Hooks for Automation

```typescript
// hooks/auto-generate-slug.ts
// Automatically generates URL slug from the name/title field

import type { CollectionBeforeChangeHook } from "payload";

export const autoGenerateSlug: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === "create" || (operation === "update" && data.name && !data.slug)) {
    const source = data.name || data.title || "";
    data.slug = source
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  return data;
};
```

```typescript
// hooks/auto-generate-seo.ts
// Auto-generates SEO fields when they're empty

import type { CollectionBeforeChangeHook } from "payload";

export const autoGenerateSEO: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data.seoTitle && data.name) {
    data.seoTitle = `${data.name} | CLIENT_NAME`;
  }
  if (!data.seoDescription && data.shortDescription) {
    data.seoDescription = data.shortDescription.slice(0, 160);
  }
  return data;
};
```

```typescript
// hooks/sync-to-crm.ts
// Syncs form submissions to Twenty CRM as leads

import type { CollectionAfterChangeHook } from "payload";

export const syncToCRM: CollectionAfterChangeHook = async ({ doc, operation }) => {
  if (operation !== "create") return doc;

  const TWENTY_API = process.env.TWENTY_API_URL || "http://localhost:3258";
  const TWENTY_KEY = process.env.TWENTY_API_KEY;

  if (!TWENTY_KEY) return doc; // CRM not configured

  try {
    await fetch(`${TWENTY_API}/api/v1/people`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TWENTY_KEY}`,
      },
      body: JSON.stringify({
        name: { firstName: doc.name || "", lastName: "" },
        emails: { primaryEmail: doc.email || "" },
        phones: { primaryPhone: doc.phone || "" },
        // Map form fields to CRM fields
      }),
    });
  } catch (error) {
    console.error("CRM sync failed:", error);
    // Don't throw — form submission should still succeed even if CRM sync fails
  }

  return doc;
};
```

```typescript
// hooks/send-notification.ts
// Sends email notification on form submission or content publish

import type { CollectionAfterChangeHook } from "payload";

export const sendNotification: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== "create") return doc;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return doc;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "notifications@yourdomain.com",
      to: ["team@yourdomain.com"],
      subject: `New form submission: ${doc.form?.title || "Contact Form"}`,
      html: `<p>New submission received.</p><pre>${JSON.stringify(doc, null, 2)}</pre>`,
    });
  } catch (error) {
    console.error("Email notification failed:", error);
  }

  return doc;
};
```

---

## Appendix: CSV Data Format Examples

### data/services.csv
```csv
name,category,shortDescription,icon
Plumbing,residential,Full-service plumbing for homes — repairs leaks and clogs and installs fixtures,wrench
HVAC,residential,Heating and cooling installation repair and maintenance for year-round comfort,thermometer
Electrical,residential,Licensed electricians for wiring panel upgrades and electrical repairs,zap
Roofing,residential,Roof inspection repair and replacement for all roof types,home
Drain Cleaning,residential,Professional drain and sewer cleaning to prevent backups,droplets
Water Heater,residential,Water heater installation repair and replacement — tank and tankless,flame
```

### data/locations.csv
```csv
displayName,city,state,stateCode,type,zipCodes,lat,lng,population
Austin TX,Austin,Texas,TX,city,"78701,78702,78703,78704,78705",30.2672,-97.7431,964254
Dallas TX,Dallas,Texas,TX,city,"75201,75202,75203,75204,75205",32.7767,-96.7970,1304379
Houston TX,Houston,Texas,TX,city,"77001,77002,77003,77004,77005",29.7604,-95.3698,2304580
San Antonio TX,San Antonio,Texas,TX,city,"78201,78202,78203,78204,78205",29.4241,-98.4936,1547253
```
