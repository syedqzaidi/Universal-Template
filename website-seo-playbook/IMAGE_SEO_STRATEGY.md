# Image SEO Strategy for Programmatic SEO at Scale

> Technical blueprint for service-area business websites generating 100k+ pages programmatically using Payload CMS + Astro + Next.js.

---

## Table of Contents

1. [Image File Naming Conventions](#1-image-file-naming-conventions)
2. [Image Format Strategy](#2-image-format-strategy)
3. [Image Sizing per Context](#3-image-sizing-per-context)
4. [Alt Text Best Practices](#4-alt-text-best-practices)
5. [Lazy Loading and Fetch Priority](#5-lazy-loading-and-fetch-priority)
6. [Semantic Image Markup](#6-semantic-image-markup-figure-and-figcaption)
7. [Image Sitemaps](#7-image-sitemaps)
8. [Responsive Images](#8-responsive-images)
9. [Image Compression](#9-image-compression)
10. [OG Image Auto-Generation](#10-og-image-auto-generation)
11. [Payload CMS Implementation](#11-payload-cms-implementation)
12. [Astro Implementation](#12-astro-implementation)
13. [Google Image Search Optimization](#13-google-image-search-optimization)
14. [Decorative vs Informative Images](#14-decorative-vs-informative-images)

---

## 1. Image File Naming Conventions

### Rules

Google uses file names to understand image content. File names are a confirmed SEO ranking signal for Google Image Search. Search engines interpret hyphens as word separators.

**Pattern for service-area pages:**

```
{service-slug}-{city}-{state-abbr}-{descriptor}.{ext}
```

**Examples:**

```
# GOOD — descriptive, keyword-rich, hyphen-separated
plumber-austin-tx-kitchen-repair.webp
roof-replacement-denver-co-before-after.webp
hvac-installation-phoenix-az-residential.webp
emergency-plumbing-seattle-wa-burst-pipe.webp

# BAD — meaningless to search engines
IMG_4532.jpg
photo-1.png
hero.jpg
service-image-3.webp
```

### Naming Rules (Enforced Programmatically)

| Rule | Implementation |
|------|---------------|
| Use hyphens, never underscores or spaces | `slugify(name, { strict: true })` |
| Lowercase only | `.toLowerCase()` |
| Include primary keyword (service) | Validate presence |
| Include location when applicable | Append city-state |
| Max 60 characters (before extension) | Truncate intelligently |
| No special characters or accents | Strip via `slugify` |
| File extension matches actual format | Validate mime type vs extension |

### Auto-Rename Function

Used in Payload CMS `beforeChange` hook and in build scripts:

```typescript
import slugify from 'slugify';

interface RenameOptions {
  service: string;        // e.g., "Roof Replacement"
  city: string;           // e.g., "Denver"
  state: string;          // e.g., "CO"
  descriptor?: string;    // e.g., "before-after", "residential", "team"
  index?: number;         // for galleries: 1, 2, 3...
}

function generateImageFilename(
  options: RenameOptions,
  extension: string = 'webp'
): string {
  const parts = [
    options.service,
    options.city,
    options.state,
    options.descriptor,
    options.index ? String(options.index) : undefined,
  ].filter(Boolean);

  const slug = slugify(parts.join('-'), {
    lower: true,
    strict: true,    // strip special characters
    trim: true,
  });

  // Enforce max 60 chars before extension
  const truncated = slug.substring(0, 60).replace(/-+$/, '');

  return `${truncated}.${extension}`;
}

// Usage:
generateImageFilename({
  service: 'Emergency Plumbing',
  city: 'Seattle',
  state: 'WA',
  descriptor: 'burst-pipe',
}, 'webp');
// => "emergency-plumbing-seattle-wa-burst-pipe.webp"
```

---

## 2. Image Format Strategy

### Format Priority Matrix

| Format | Use Case | Browser Support | File Size vs JPEG |
|--------|----------|----------------|-------------------|
| **AVIF** | Progressive enhancement for all raster images | 96%+ (2026) | 50-70% smaller |
| **WebP** | Default/fallback for all raster images | 98%+ universal | 25-35% smaller |
| **JPEG** | Final fallback (legacy browsers) | 100% | Baseline |
| **PNG** | Screenshots, images requiring transparency with sharp edges | 100% | Larger (lossless) |
| **SVG** | Icons, logos, illustrations, simple graphics | 100% | Scales infinitely |

### Serving Strategy

Always serve the most efficient format the browser supports. Use the `<picture>` element for format negotiation:

```html
<picture>
  <source srcset="plumber-austin-tx.avif" type="image/avif" />
  <source srcset="plumber-austin-tx.webp" type="image/webp" />
  <img src="plumber-austin-tx.jpg" alt="Licensed plumber repairing kitchen sink in Austin, TX" />
</picture>
```

### Build Pipeline Format Generation

Generate all three formats at build time. The browser selects the best one automatically:

```typescript
// sharp-based format generation
import sharp from 'sharp';

async function generateFormats(inputPath: string, outputDir: string, baseName: string) {
  const pipeline = sharp(inputPath);

  await Promise.all([
    pipeline.clone().avif({ quality: 55, effort: 4 }).toFile(`${outputDir}/${baseName}.avif`),
    pipeline.clone().webp({ quality: 80, effort: 4 }).toFile(`${outputDir}/${baseName}.webp`),
    pipeline.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${outputDir}/${baseName}.jpg`),
  ]);
}
```

### SVG Policy

- Use SVG for: logos, icons, simple illustrations, map markers, rating stars
- Never use SVG for: photographs, complex scenes, user-uploaded content
- Always sanitize SVG uploads (strip scripts, event handlers) using `DOMPurify` or `svg-sanitize`
- Inline small SVGs (<2KB) directly in HTML; reference larger ones via `<img>` or `<use>`

---

## 3. Image Sizing per Context

### Exact Pixel Dimensions by Context

| Context | Width (px) | Height (px) | Aspect Ratio | Notes |
|---------|-----------|-------------|--------------|-------|
| **Hero image** | 1920 | 1080 | 16:9 | Full-width above the fold. Serve responsive srcset. |
| **Hero image (mobile)** | 768 | 1024 | 3:4 | Art-directed crop for mobile via `<picture>` |
| **Service card thumbnail** | 600 | 400 | 3:2 | Grid/card layouts |
| **Service card thumbnail (2x)** | 1200 | 800 | 3:2 | Retina displays |
| **Gallery image** | 1200 | 800 | 3:2 | Lightbox/gallery views |
| **Gallery thumbnail** | 300 | 200 | 3:2 | Gallery grid preview |
| **OG image** | 1200 | 630 | 1.91:1 | Open Graph / social sharing |
| **Twitter card** | 1200 | 628 | ~1.91:1 | Twitter/X large summary card |
| **Team/staff photo** | 400 | 400 | 1:1 | Square headshots |
| **Team/staff photo (2x)** | 800 | 800 | 1:1 | Retina headshots |
| **Logo** | 250 | 60 | Variable | Header logo, SVG preferred |
| **Favicon** | 32 | 32 | 1:1 | `.ico` or `.png` |
| **Apple touch icon** | 180 | 180 | 1:1 | iOS home screen |
| **Blog inline image** | 800 | undefined | Preserve ratio | Content width constrained |
| **Map/area image** | 600 | 400 | 3:2 | Service area map |
| **Before/after** | 600 | 400 | 3:2 | Side-by-side comparison |
| **Icon (inline)** | 24-48 | 24-48 | 1:1 | SVG preferred |

### Payload CMS `imageSizes` Config (Matching Above)

```typescript
imageSizes: [
  { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
  { name: 'thumbnailRetina', width: 800, height: 600, position: 'centre' },
  { name: 'card', width: 600, height: 400, position: 'centre' },
  { name: 'hero', width: 1920, height: 1080, position: 'centre' },
  { name: 'heroMobile', width: 768, height: 1024, position: 'centre' },
  { name: 'gallery', width: 1200, height: 800, position: 'centre' },
  { name: 'galleryThumb', width: 300, height: 200, position: 'centre' },
  { name: 'og', width: 1200, height: 630, position: 'centre' },
  { name: 'square', width: 400, height: 400, position: 'centre' },
  { name: 'squareRetina', width: 800, height: 800, position: 'centre' },
  { name: 'content', width: 800, height: undefined, position: 'centre' },
],
```

---

## 4. Alt Text Best Practices

### Core Rules

| Rule | Detail |
|------|--------|
| **Max length** | 125 characters (screen readers truncate beyond this) |
| **Be descriptive** | Describe what the image shows, not what it is ("a photo of...") |
| **Include keywords naturally** | Work in service + location when relevant, never keyword-stuff |
| **Unique per image** | Never duplicate alt text across images on the same page |
| **No "image of" or "photo of"** | Screen readers already announce it as an image |
| **Include location context** | For service-area pages, mention city/area when natural |
| **Describe action/context** | "Plumber replacing copper pipes under kitchen sink" not "plumber working" |
| **Empty alt for decorative** | Use `alt=""` for purely decorative images (dividers, backgrounds) |

### Alt Text Templates for Service-Area Pages

```
Hero image:
  "{Service} in {City}, {State} — {specific detail}"
  Example: "Emergency roof repair in Denver, CO after hail damage"

Service card:
  "{Descriptor} {service} for {audience} in {area}"
  Example: "Professional HVAC installation for homeowners in Phoenix, AZ"

Team photo:
  "{Name}, {title} at {Company} — serving {area}"
  Example: "Maria Garcia, licensed electrician at SparkPro — serving Austin, TX"

Before/after:
  "Before and after {service} at a {property type} in {city}"
  Example: "Before and after kitchen remodel at a ranch home in Scottsdale"

Gallery:
  "{Specific detail of work shown} — {service} project in {city}, {state}"
  Example: "New standing seam metal roof on colonial home — roofing project in Boulder, CO"
```

### Programmatic Alt Text Generation

For 100k+ pages, alt text must be generated programmatically from structured data:

```typescript
interface AltTextInput {
  service: string;
  city: string;
  state: string;
  imageType: 'hero' | 'card' | 'gallery' | 'team' | 'before-after';
  descriptor?: string;
  personName?: string;
  personTitle?: string;
}

function generateAltText(input: AltTextInput): string {
  const { service, city, state, imageType, descriptor, personName, personTitle } = input;

  const templates: Record<string, string> = {
    hero: `${service} services in ${city}, ${state}${descriptor ? ` — ${descriptor}` : ''}`,
    card: `Professional ${service.toLowerCase()} for homes and businesses in ${city}, ${state}`,
    gallery: `${descriptor || service} project completed in ${city}, ${state}`,
    team: personName
      ? `${personName}, ${personTitle || 'team member'} — serving ${city}, ${state}`
      : `${service} team serving ${city}, ${state}`,
    'before-after': `Before and after ${service.toLowerCase()} in ${city}, ${state}`,
  };

  const alt = templates[imageType] || `${service} in ${city}, ${state}`;

  // Enforce 125-character limit
  return alt.length > 125 ? alt.substring(0, 122) + '...' : alt;
}
```

### Validation Rules (Enforce at Upload and Build Time)

```typescript
function validateAltText(alt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!alt || alt.trim().length === 0) {
    errors.push('Alt text is empty — use alt="" only for decorative images');
  }
  if (alt.length > 125) {
    errors.push(`Alt text is ${alt.length} chars — max 125`);
  }
  if (/^(image of|photo of|picture of|img)/i.test(alt)) {
    errors.push('Alt text should not start with "image of", "photo of", etc.');
  }
  if ((alt.match(/,/g) || []).length > 4) {
    errors.push('Possible keyword stuffing — too many comma-separated terms');
  }
  if (/(.)\1{4,}/.test(alt)) {
    errors.push('Suspicious repeated characters detected');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 5. Lazy Loading and Fetch Priority

### Loading Strategy Matrix

| Image Position | `loading` | `fetchpriority` | `decoding` | Rationale |
|---------------|-----------|-----------------|------------|-----------|
| **Hero / LCP image** | `eager` | `high` | `async` | This is typically the Largest Contentful Paint element. Must load immediately. |
| **Above-the-fold secondary** | `eager` | `auto` | `async` | Visible on initial load but not LCP |
| **Below-the-fold content** | `lazy` | `auto` | `async` | Defer until near viewport |
| **Gallery thumbnails** | `lazy` | `low` | `async` | Many images, load on demand |
| **Footer images** | `lazy` | `low` | `async` | Rarely seen immediately |
| **OG images** | N/A | N/A | N/A | Not rendered in page; only in `<meta>` tags |
| **Background/decorative** | `lazy` | `low` | `async` | Non-essential visual |

### Implementation Rules

1. **Only ONE image per page should have `fetchpriority="high"`** — the LCP candidate (usually the hero image).
2. **Never lazy-load the LCP image.** This delays the largest paint and tanks Core Web Vitals.
3. **All images below the fold should use `loading="lazy"`.** The browser handles the intersection observer natively.
4. **Use `decoding="async"` on all images** to prevent blocking the main thread during decode.
5. **Preload the LCP image** in the `<head>` for maximum priority:

```html
<head>
  <link
    rel="preload"
    as="image"
    href="/images/plumber-austin-tx-hero.webp"
    type="image/webp"
    fetchpriority="high"
  />
</head>
```

### Astro Implementation

```astro
---
// Hero image — eager load, high priority
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- LCP image: eager + high priority -->
<Image
  src={heroImage}
  alt="Emergency plumbing services in Austin, TX"
  width={1920}
  height={1080}
  loading="eager"
  fetchpriority="high"
  decoding="async"
  format="webp"
/>

<!-- Below-the-fold image: lazy loaded -->
<Image
  src={cardImage}
  alt="Kitchen sink installation in Austin, TX"
  width={400}
  height={300}
  loading="lazy"
  decoding="async"
  format="webp"
/>
```

### Next.js Implementation

```tsx
import Image from 'next/image';

// LCP hero image — preload + eager
// Next.js 14/15: use priority={true}
// Next.js 16+: use preload={true} instead of priority={true}
<Image
  src="/images/plumber-austin-tx-hero.webp"
  alt="Emergency plumbing services in Austin, TX"
  width={1920}
  height={1080}
  priority={true}
  loading="eager"
  sizes="100vw"
/>

// Below-the-fold — default lazy loading
<Image
  src="/images/plumber-austin-tx-card.webp"
  alt="Kitchen sink installation in Austin, TX"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

---

## 6. Semantic Image Markup: `<figure>` and `<figcaption>`

### When to Use `<figure>`

- An image that is **referenced from the content** (not purely decorative)
- Images with **captions** that provide additional context
- **Before/after comparisons**, gallery items, diagrams, illustrations
- Any image that would benefit from a **visible text description** for users and search engines

### When NOT to Use `<figure>`

- Inline icons or decorative separators
- Background images applied via CSS
- Images that are part of a UI component (buttons, avatars in nav)

### Markup Pattern

```html
<figure class="service-image" itemscope itemtype="https://schema.org/ImageObject">
  <picture>
    <source srcset="/images/roof-repair-denver-co.avif" type="image/avif" />
    <source srcset="/images/roof-repair-denver-co.webp" type="image/webp" />
    <img
      src="/images/roof-repair-denver-co.jpg"
      alt="Completed roof repair on a Victorian home in Denver, CO"
      width="1200"
      height="800"
      loading="lazy"
      decoding="async"
      itemprop="contentUrl"
    />
  </picture>
  <figcaption itemprop="caption">
    Professional roof repair completed on a historic Victorian home in Denver's
    Capitol Hill neighborhood. Our team replaced damaged shingles and reinforced
    the flashing around all dormers.
  </figcaption>
  <meta itemprop="name" content="Roof repair in Denver, CO — Victorian home restoration" />
</figure>
```

### Astro Component

```astro
---
// components/ServiceImage.astro
interface Props {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  class?: string;
}

import { Image } from 'astro:assets';

const {
  src,
  alt,
  caption,
  width,
  height,
  loading = 'lazy',
  fetchpriority = 'auto',
  class: className,
} = Astro.props;
---

{caption ? (
  <figure class:list={['service-image', className]}>
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchpriority={fetchpriority}
      decoding="async"
      format="webp"
    />
    <figcaption>{caption}</figcaption>
  </figure>
) : (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    loading={loading}
    fetchpriority={fetchpriority}
    decoding="async"
    format="webp"
    class={className}
  />
)}
```

### `<figcaption>` Content Rules

| Rule | Detail |
|------|--------|
| Not a duplicate of `alt` | Caption adds context beyond what alt describes |
| Include location naturally | "...in Denver's Capitol Hill neighborhood" |
| Include service detail | "Our team replaced damaged shingles..." |
| 1-2 sentences max | Concise, useful context |
| Can include links | Link to the specific service page |
| Visible to all users | Not hidden — this is user-facing content |

---

## 7. Image Sitemaps

### When to Use Image Sitemaps

- Pages with images loaded via JavaScript (Google may not discover them during crawl)
- Images hosted on a CDN (different domain than your pages)
- Gallery pages with many images
- When you want to **maximize image indexing** for Google Image Search traffic
- For 100k+ page sites: always use image sitemaps — they ensure comprehensive image discovery

### XML Format

Google's current image sitemap specification uses namespace `http://www.google.com/schemas/sitemap-image/1.1`. The only required sub-element is `<image:loc>`. Tags like `<image:caption>`, `<image:title>`, and `<image:geo_location>` have been deprecated by Google.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://example.com/plumber/austin-tx</loc>
    <image:image>
      <image:loc>https://cdn.example.com/images/plumber-austin-tx-hero.webp</image:loc>
    </image:image>
    <image:image>
      <image:loc>https://cdn.example.com/images/plumber-austin-tx-gallery-1.webp</image:loc>
    </image:image>
    <image:image>
      <image:loc>https://cdn.example.com/images/plumber-austin-tx-gallery-2.webp</image:loc>
    </image:image>
  </url>
</urlset>
```

### Limits

- Max **1,000 `<image:image>` entries** per `<url>` element
- Max **50,000 URLs** per sitemap file
- Max **50MB** uncompressed per sitemap file
- Use a **sitemap index** to split across multiple files

### Generating Image Sitemaps for 100k+ Pages

#### Strategy: Batch Generation at Build Time

For a site with 100k+ service+location pages, you cannot generate a single sitemap. Split by geographic region or service category:

```
sitemap-index.xml
├── sitemap-images-plumbing-0001.xml    (URLs 1-50,000)
├── sitemap-images-plumbing-0002.xml    (URLs 50,001-100,000)
├── sitemap-images-hvac-0001.xml
├── sitemap-images-roofing-0001.xml
└── ...
```

#### Build Script: Image Sitemap Generator

```typescript
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface PageImage {
  pageUrl: string;
  imageUrls: string[];
}

const URLS_PER_SITEMAP = 45_000; // Stay under 50k limit with margin
const CDN_BASE = 'https://cdn.example.com';
const SITE_BASE = 'https://example.com';

function generateImageSitemapXml(pages: PageImage[]): string {
  const urlEntries = pages.map((page) => {
    const imageEntries = page.imageUrls
      .slice(0, 1000) // Max 1000 images per URL
      .map((img) => `      <image:image>\n        <image:loc>${escapeXml(img)}</image:loc>\n      </image:image>`)
      .join('\n');

    return `  <url>\n    <loc>${escapeXml(page.pageUrl)}</loc>\n${imageEntries}\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildImageSitemaps(allPages: PageImage[]) {
  const outputDir = join(process.cwd(), 'dist', 'sitemaps');
  mkdirSync(outputDir, { recursive: true });

  const chunks: PageImage[][] = [];
  for (let i = 0; i < allPages.length; i += URLS_PER_SITEMAP) {
    chunks.push(allPages.slice(i, i + URLS_PER_SITEMAP));
  }

  const sitemapFiles: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const filename = `sitemap-images-${String(i + 1).padStart(4, '0')}.xml`;
    const xml = generateImageSitemapXml(chunks[i]);
    writeFileSync(join(outputDir, filename), xml, 'utf-8');
    sitemapFiles.push(`${SITE_BASE}/sitemaps/${filename}`);
  }

  // Generate sitemap index
  const indexEntries = sitemapFiles
    .map((url) => `  <sitemap>\n    <loc>${url}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n  </sitemap>`)
    .join('\n');

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntries}
</sitemapindex>`;

  writeFileSync(join(outputDir, 'sitemap-images-index.xml'), sitemapIndex, 'utf-8');

  console.log(`Generated ${chunks.length} image sitemap(s) covering ${allPages.length} pages`);
}

// Usage: called during build with data from Payload CMS
// Each page gets its hero, card, gallery, and team images
function getImagesForPage(service: string, city: string, state: string): PageImage {
  const slug = `${service}/${city}-${state}`.toLowerCase().replace(/\s+/g, '-');
  return {
    pageUrl: `${SITE_BASE}/${slug}`,
    imageUrls: [
      `${CDN_BASE}/images/${service}-${city}-${state}-hero.webp`,
      `${CDN_BASE}/images/${service}-${city}-${state}-card.webp`,
      `${CDN_BASE}/images/${service}-${city}-${state}-gallery-1.webp`,
      `${CDN_BASE}/images/${service}-${city}-${state}-gallery-2.webp`,
      `${CDN_BASE}/images/${service}-${city}-${state}-gallery-3.webp`,
    ].map((url) => url.toLowerCase().replace(/\s+/g, '-')),
  };
}
```

### Integration with Existing Page Sitemaps

You can embed `<image:image>` tags directly into your page sitemaps instead of maintaining separate image sitemaps. This is simpler but produces larger files. For 100k+ page sites, separate image sitemaps are recommended for manageability.

---

## 8. Responsive Images

### `srcset` and `sizes` — Core Concepts

- **`srcset`**: Tells the browser which image files are available and their widths (e.g., `image-400w.webp 400w, image-800w.webp 800w`)
- **`sizes`**: Tells the browser how wide the image will be at each breakpoint so it can pick the right file from `srcset` before layout is computed

### Breakpoint Strategy

| Breakpoint | Viewport Width | Common Use |
|-----------|---------------|------------|
| Mobile | `<640px` | Single column |
| Tablet | `640px - 1024px` | 2-column grid |
| Desktop | `1024px - 1440px` | 3-4 column grid |
| Large desktop | `>1440px` | Max-width container |

### Standard `srcset` Widths

Generate images at these widths to cover common device scenarios:

```
320, 480, 640, 768, 1024, 1280, 1536, 1920
```

### Astro: `<Image />` with Responsive Layout

Astro 5+ supports automatic responsive image generation:

```astro
---
// astro.config.mjs — enable responsive images
// export default defineConfig({
//   image: { layout: 'responsive' },
//   image: { layout: 'responsive', responsiveStyles: true },
// });

import { Image } from 'astro:assets';
import heroSrc from '../assets/hero.jpg';
---

<!-- Automatic srcset and sizes via layout prop -->
<Image
  src={heroSrc}
  alt="Professional plumbing services in Austin, TX"
  width={1920}
  height={1080}
  layout="full-width"
  loading="eager"
  fetchpriority="high"
/>
<!--
  Astro auto-generates:
  srcset="...hero-640w.webp 640w, ...hero-750w.webp 750w, ...hero-1080w.webp 1080w, ...hero-1920w.webp 1920w"
  sizes="100vw"
-->

<!-- Constrained layout for content images -->
<Image
  src={contentImage}
  alt="Kitchen remodel project in Austin, TX"
  width={800}
  height={600}
  layout="constrained"
  loading="lazy"
/>
<!--
  Astro auto-generates:
  srcset="...content-640w.webp 640w, ...content-750w.webp 750w, ...content-800w.webp 800w"
  sizes="(min-width: 800px) 800px, 100vw"
-->
```

### Astro: `<Picture />` for Multi-Format + Responsive

```astro
---
import { Picture } from 'astro:assets';
import heroSrc from '../assets/hero.jpg';
---

<Picture
  src={heroSrc}
  formats={['avif', 'webp']}
  widths={[480, 768, 1024, 1920]}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
  alt="Licensed plumber installing water heater in Austin, TX"
  loading="eager"
  fetchpriority="high"
/>
<!--
  Generates:
  <picture>
    <source type="image/avif" srcset="hero-480w.avif 480w, hero-768w.avif 768w, ..." sizes="..." />
    <source type="image/webp" srcset="hero-480w.webp 480w, hero-768w.webp 768w, ..." sizes="..." />
    <img src="hero-1920w.jpg" alt="..." width="1920" height="1080" loading="eager" ... />
  </picture>
-->
```

### Next.js: `<Image />` Responsive Configuration

```tsx
// next.config.js — configure image optimization
module.exports = {
  images: {
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year — images are content-addressed
  },
};
```

```tsx
import Image from 'next/image';

// Full-width hero
// Next.js 14/15: use priority={true}
// Next.js 16+: use preload={true} instead of priority={true}
<Image
  src="/images/plumber-austin-tx-hero.webp"
  alt="Emergency plumbing services in Austin, TX"
  width={1920}
  height={1080}
  sizes="100vw"
  priority={true}
  loading="eager"
/>

// Card in a responsive grid
<Image
  src="/images/plumber-austin-tx-card.webp"
  alt="Kitchen sink installation in Austin, TX"
  width={400}
  height={300}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>

// Fill mode for unknown aspect ratios
<div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
  <Image
    src="/images/gallery-item.webp"
    alt="Bathroom renovation completed in Austin, TX"
    fill={true}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

### Art Direction with `<picture>` (Mobile-Specific Crops)

For hero images, serve a different crop on mobile (portrait) vs desktop (landscape):

```astro
---
import { getImage } from 'astro:assets';
import heroDesktop from '../assets/hero-landscape.jpg';
import heroMobile from '../assets/hero-portrait.jpg';

const desktopImg = await getImage({ src: heroDesktop, format: 'webp', width: 1920 });
const mobileImg = await getImage({ src: heroMobile, format: 'webp', width: 768 });
---

<picture>
  <source media="(min-width: 768px)" srcset={desktopImg.src} type="image/webp" />
  <source srcset={mobileImg.src} type="image/webp" />
  <img
    src={desktopImg.src}
    alt="Professional plumbing team serving Austin, TX"
    width="1920"
    height="1080"
    loading="eager"
    fetchpriority="high"
    decoding="async"
  />
</picture>
```

---

## 9. Image Compression

### Quality Targets by Format and Context

| Format | Hero/LCP | Cards/Content | Thumbnails | OG Images |
|--------|----------|--------------|------------|-----------|
| **AVIF** | 60 | 50 | 45 | 65 |
| **WebP** | 85 | 80 | 72 | 85 |
| **JPEG** | 85 | 80 | 72 | 85 |
| **PNG** | Lossless | Lossless | Lossless | N/A |

### File Size Budgets

| Image Type | Max File Size | Target File Size |
|-----------|---------------|-----------------|
| Hero (1920px WebP) | 200KB | 120-150KB |
| Card thumbnail (600px WebP) | 60KB | 30-40KB |
| Gallery image (1200px WebP) | 120KB | 60-80KB |
| OG image (1200px PNG) | 200KB | 100-150KB |
| Content image (800px WebP) | 80KB | 40-60KB |

### Sharp Compression Pipeline

```typescript
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';

interface CompressionConfig {
  webp: { quality: number; effort: number; smartSubsample: boolean };
  avif: { quality: number; effort: number; chromaSubsampling: string };
  jpeg: { quality: number; mozjpeg: boolean; chromaSubsampling: string };
}

const COMPRESSION_PROFILES: Record<string, CompressionConfig> = {
  hero: {
    webp: { quality: 85, effort: 6, smartSubsample: true },
    avif: { quality: 60, effort: 4, chromaSubsampling: '4:2:0' },
    jpeg: { quality: 85, mozjpeg: true, chromaSubsampling: '4:2:0' },
  },
  card: {
    webp: { quality: 80, effort: 6, smartSubsample: true },
    avif: { quality: 50, effort: 4, chromaSubsampling: '4:2:0' },
    jpeg: { quality: 80, mozjpeg: true, chromaSubsampling: '4:2:0' },
  },
  thumbnail: {
    webp: { quality: 72, effort: 6, smartSubsample: true },
    avif: { quality: 45, effort: 4, chromaSubsampling: '4:2:0' },
    jpeg: { quality: 72, mozjpeg: true, chromaSubsampling: '4:2:0' },
  },
  og: {
    webp: { quality: 85, effort: 6, smartSubsample: true },
    avif: { quality: 65, effort: 4, chromaSubsampling: '4:2:0' },
    jpeg: { quality: 85, mozjpeg: true, chromaSubsampling: '4:2:0' },
  },
};

interface ResizeTarget {
  name: string;
  width: number;
  height?: number;
  profile: keyof typeof COMPRESSION_PROFILES;
}

const RESIZE_TARGETS: ResizeTarget[] = [
  { name: 'hero', width: 1920, height: 1080, profile: 'hero' },
  { name: 'hero-mobile', width: 768, height: 1024, profile: 'hero' },
  { name: 'card', width: 600, height: 400, profile: 'card' },
  { name: 'card-retina', width: 1200, height: 800, profile: 'card' },
  { name: 'gallery', width: 1200, height: 800, profile: 'card' },
  { name: 'gallery-thumb', width: 300, height: 200, profile: 'thumbnail' },
  { name: 'og', width: 1200, height: 630, profile: 'og' },
  { name: 'content', width: 800, profile: 'card' },
  { name: 'square', width: 400, height: 400, profile: 'card' },
];

async function processImage(inputPath: string, outputDir: string, baseName: string) {
  const results: { path: string; format: string; size: number }[] = [];

  for (const target of RESIZE_TARGETS) {
    const config = COMPRESSION_PROFILES[target.profile];
    const resized = sharp(inputPath)
      .resize({
        width: target.width,
        height: target.height,
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true,
      })
      // Strip metadata but keep ICC profile for color accuracy — chain before cloning
      .withMetadata({ orientation: undefined });

    const outputBase = `${baseName}-${target.name}`;

    // Generate all formats in parallel
    const webpPath = join(outputDir, `${outputBase}.webp`);
    const avifPath = join(outputDir, `${outputBase}.avif`);
    const jpegPath = join(outputDir, `${outputBase}.jpg`);

    await Promise.all([
      resized.clone().webp(config.webp).toFile(webpPath),
      resized.clone().avif(config.avif).toFile(avifPath),
      resized.clone().jpeg(config.jpeg).toFile(jpegPath),
    ]);

    const [webpStat, avifStat, jpegStat] = await Promise.all([
      stat(webpPath),
      stat(avifPath),
      stat(jpegPath),
    ]);

    results.push({ path: webpPath, format: 'webp', size: webpStat.size });
    results.push({ path: avifPath, format: 'avif', size: avifStat.size });
    results.push({ path: jpegPath, format: 'jpeg', size: jpegStat.size });
  }

  return results;
}

// Batch processing for build pipeline
async function processAllImages(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir);
  const imageFiles = files.filter((f) =>
    /\.(jpg|jpeg|png|tiff|webp)$/i.test(f)
  );

  console.log(`Processing ${imageFiles.length} images...`);

  // Process in parallel batches of 4 to avoid memory exhaustion
  const BATCH_SIZE = 4;
  for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
    const batch = imageFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((file) => {
        const { name } = parse(file);
        return processImage(join(inputDir, file), outputDir, name);
      })
    );
    console.log(`  Processed ${Math.min(i + BATCH_SIZE, imageFiles.length)}/${imageFiles.length}`);
  }
}
```

### Build Pipeline Integration

Add to `package.json`:

```json
{
  "scripts": {
    "images:process": "tsx scripts/process-images.ts",
    "images:validate": "tsx scripts/validate-images.ts",
    "prebuild": "npm run images:process && npm run images:validate",
    "build": "astro build"
  }
}
```

### Validation Script

```typescript
// scripts/validate-images.ts
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const MAX_SIZES: Record<string, number> = {
  hero: 200 * 1024,       // 200KB
  card: 40 * 1024,         // 40KB
  thumbnail: 20 * 1024,    // 20KB
  gallery: 120 * 1024,     // 120KB
  og: 200 * 1024,          // 200KB
  content: 80 * 1024,      // 80KB
};

async function validateImages(dir: string) {
  const files = await readdir(dir);
  const violations: string[] = [];

  for (const file of files) {
    const fileStat = await stat(join(dir, file));
    const type = Object.keys(MAX_SIZES).find((key) => file.includes(key));
    if (type && fileStat.size > MAX_SIZES[type]) {
      violations.push(
        `OVERSIZED: ${file} is ${(fileStat.size / 1024).toFixed(0)}KB (max: ${MAX_SIZES[type] / 1024}KB)`
      );
    }
  }

  if (violations.length > 0) {
    console.error('Image size violations:');
    violations.forEach((v) => console.error(`  ${v}`));
    process.exit(1); // Fail the build
  }

  console.log(`All ${files.length} images pass size validation.`);
}
```

---

## 10. OG Image Auto-Generation

### Strategy for 100k+ Service+Location Pages

Pre-generating 100k+ static OG images is impractical. Use **on-demand generation with CDN caching**:

1. A dynamic endpoint generates the OG image when first requested
2. The CDN caches it indefinitely (images are deterministic — same input = same output)
3. Cache-Control headers prevent regeneration

### Next.js Dynamic OG Image Route

```
app/
  [service]/
    [location]/
      opengraph-image.tsx    ← Dynamic OG image for every service+location
      page.tsx
```

```tsx
// app/[service]/[location]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs'; // Use Node.js for font loading
export const revalidate = false; // Cache indefinitely

export const alt = 'Service area coverage';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ service: string; location: string }>;
}) {
  const { service, location } = await params;

  // Format for display
  const serviceName = service
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const locationName = location
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Load brand font
  const fontBold = await readFile(
    join(process.cwd(), 'assets/fonts/Inter-Bold.ttf')
  );
  const fontRegular = await readFile(
    join(process.cwd(), 'assets/fonts/Inter-Regular.ttf')
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)',
          color: 'white',
          fontFamily: 'Inter',
        }}
      >
        {/* Top: Company logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '24px',
            fontWeight: 400,
            opacity: 0.9,
          }}
        >
          {/* Replace with your logo SVG or text */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            ★
          </div>
          <span>Your Company Name</span>
        </div>

        {/* Center: Service + Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            {serviceName}
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 400,
              opacity: 0.85,
            }}
          >
            in {locationName}
          </div>
        </div>

        {/* Bottom: CTA and trust signals */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '20px',
            opacity: 0.8,
          }}
        >
          <span>Licensed & Insured • Free Estimates</span>
          <span>yourcompany.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ],
    }
  );
}
```

### Astro OG Image Generation (Build-Time with Satori)

For Astro (static builds), use `satori` + `@resvg/resvg-js` to generate at build time. For 100k+ pages, generate on-demand via an API endpoint:

```typescript
// src/pages/og/[service]/[location].png.ts
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const fontBold = readFileSync(join(process.cwd(), 'assets/fonts/Inter-Bold.ttf'));
const fontRegular = readFileSync(join(process.cwd(), 'assets/fonts/Inter-Regular.ttf'));

export const GET: APIRoute = async ({ params }) => {
  const { service, location } = params;

  const serviceName = (service || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const locationName = (location || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)',
          color: 'white',
          fontFamily: 'Inter',
          padding: '60px',
          gap: '20px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { fontSize: '64px', fontWeight: 700, textAlign: 'center' },
              children: serviceName,
            },
          },
          {
            type: 'div',
            props: {
              style: { fontSize: '36px', fontWeight: 400, opacity: 0.85 },
              children: `in ${locationName}`,
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

export function getStaticPaths() {
  // For SSG: return all service+location combinations
  // For SSR: omit this function entirely
  return [];
}
```

### OG Meta Tags in Page Templates

```astro
---
// In your service+location page layout
const ogImageUrl = `/og/${service}/${location}.png`;
---

<head>
  <meta property="og:image" content={`${Astro.site}${ogImageUrl}`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content={`${serviceName} in ${locationName}`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${Astro.site}${ogImageUrl}`} />
</head>
```

---

## 11. Payload CMS Implementation

### Complete Media Collection Configuration

```typescript
// collections/Media.ts
import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload';
import slugify from 'slugify';

// Hook: Auto-rename uploaded files to SEO-friendly filenames
const sanitizeFilename: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.file) {
    const originalName = req.file.name;
    const extension = originalName.split('.').pop()?.toLowerCase() || 'webp';

    // Build SEO filename from fields
    const parts = [
      data.service,
      data.city,
      data.state,
      data.descriptor,
    ].filter(Boolean);

    if (parts.length > 0) {
      const seoName = slugify(parts.join('-'), {
        lower: true,
        strict: true,
        trim: true,
      }).substring(0, 60).replace(/-+$/, '');

      req.file.name = `${seoName}.${extension}`;
    } else {
      // Fallback: slugify the original filename
      const nameWithoutExt = originalName.replace(/\.[^.]+$/, '');
      req.file.name = `${slugify(nameWithoutExt, { lower: true, strict: true })}.${extension}`;
    }
  }

  return data;
};

// Hook: Validate alt text on save
const validateAltText: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.alt) {
    if (data.alt.length > 125) {
      throw new Error(`Alt text is ${data.alt.length} characters. Maximum is 125.`);
    }
    if (/^(image of|photo of|picture of)/i.test(data.alt)) {
      throw new Error('Alt text should not start with "image of", "photo of", etc.');
    }
  }
  return data;
};

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [sanitizeFilename, validateAltText],
  },
  upload: {
    staticDir: 'media',

    // Restrict to image files only
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],

    // Auto-convert all uploads to WebP
    formatOptions: {
      format: 'webp',
      options: {
        quality: 82,
        effort: 6,
        smartSubsample: true,
      },
    },

    // Resize the original to a max dimension (prevent storing 8000px originals)
    resizeOptions: {
      width: 2400,
      height: 2400,
      fit: 'inside',
      withoutEnlargement: true,
    },

    // Generate all required image sizes
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 72 } },
      },
      {
        name: 'thumbnailRetina',
        width: 800,
        height: 600,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 72 } },
      },
      {
        name: 'card',
        width: 600,
        height: 400,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        name: 'heroMobile',
        width: 768,
        height: 1024,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        name: 'gallery',
        width: 1200,
        height: 800,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'galleryThumb',
        width: 300,
        height: 200,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 72 } },
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        name: 'square',
        width: 400,
        height: 400,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'squareRetina',
        width: 800,
        height: 800,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'content',
        width: 800,
        height: undefined, // Preserve aspect ratio
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],

    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,

    // Strip EXIF data (privacy + smaller files), keep ICC color profile
    withMetadata: { icc: true },
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      maxLength: 125,
      admin: {
        description: 'Descriptive alt text for accessibility and SEO. Max 125 characters. Do not start with "image of" or "photo of".',
      },
      validate: (value: string | undefined | null) => {
        if (!value) return 'Alt text is required.';
        if (value.length > 125) return `Alt text is ${value.length} chars — max 125.`;
        if (/^(image of|photo of|picture of)/i.test(value)) {
          return 'Do not start alt text with "image of", "photo of", etc.';
        }
        return true;
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional visible caption. Adds context beyond what alt text describes.',
      },
    },
    {
      name: 'isDecorative',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Check if this image is purely decorative (background, divider, etc.). Alt text will be set to empty.',
      },
    },
    // SEO context fields used for auto-rename
    {
      name: 'service',
      type: 'text',
      admin: {
        description: 'Service this image relates to (e.g., "Roof Repair"). Used for SEO file naming.',
      },
    },
    {
      name: 'city',
      type: 'text',
      admin: {
        description: 'City (e.g., "Austin"). Used for SEO file naming.',
      },
    },
    {
      name: 'state',
      type: 'text',
      admin: {
        description: 'State abbreviation (e.g., "TX"). Used for SEO file naming.',
      },
    },
    {
      name: 'descriptor',
      type: 'text',
      admin: {
        description: 'Additional descriptor (e.g., "before-after", "residential"). Used for SEO file naming.',
      },
    },
    {
      name: 'imageType',
      type: 'select',
      options: [
        { label: 'Hero', value: 'hero' },
        { label: 'Card', value: 'card' },
        { label: 'Gallery', value: 'gallery' },
        { label: 'Team Photo', value: 'team' },
        { label: 'Before/After', value: 'before-after' },
        { label: 'Content', value: 'content' },
        { label: 'Logo', value: 'logo' },
        { label: 'Icon', value: 'icon' },
        { label: 'Background', value: 'background' },
      ],
      admin: {
        description: 'How this image will be used. Affects compression and sizing.',
      },
    },
  ],
};
```

### Upload Validation Middleware

```typescript
// hooks/validateUpload.ts
import type { CollectionBeforeValidateHook } from 'payload';

export const validateUpload: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!req.file) return data;

  const file = req.file;

  // Enforce minimum dimensions for hero images
  // (Sharp metadata is available after processing)
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/svg+xml',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(
      `File type "${file.mimetype}" is not allowed. Accepted: ${allowedMimeTypes.join(', ')}`
    );
  }

  // Max file size: 10MB for originals
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(
      `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum upload size is 10MB.`
    );
  }

  return data;
};
```

---

## 12. Astro Implementation

### Astro Config for Images

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    // Default layout for all Image/Picture components
    layout: 'responsive',

    // Authorized remote image domains (your CDN and Payload)
    domains: ['cdn.example.com', 'cms.example.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.example.com' },
    ],
  },
  image: {
    layout: 'responsive',
    responsiveStyles: true,
  },
});
```

### Reusable SEO Image Component

```astro
---
// src/components/SEOImage.astro
// A single image component that handles all image SEO concerns:
// - Responsive srcset via layout
// - Format optimization via Picture
// - Semantic markup via figure/figcaption
// - Loading strategy via loading/fetchpriority
// - Alt text enforcement

import { Picture } from 'astro:assets';

interface Props {
  src: ImageMetadata | string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  isHero?: boolean;
  isDecorative?: boolean;
  sizes?: string;
  widths?: number[];
  class?: string;
  imgClass?: string;
  loading?: 'lazy' | 'eager';
}

const {
  src,
  alt,
  width,
  height,
  caption,
  isHero = false,
  isDecorative = false,
  sizes,
  widths,
  class: wrapperClass,
  imgClass,
  loading: loadingProp,
} = Astro.props;

// Determine loading strategy
const loading = loadingProp ?? (isHero ? 'eager' : 'lazy');
const fetchpriority = isHero ? 'high' : 'auto';
const effectiveAlt = isDecorative ? '' : alt;

// Default responsive widths based on context
const defaultWidths = isHero
  ? [480, 768, 1024, 1280, 1920]
  : [320, 480, 640, 800];

const defaultSizes = isHero
  ? '100vw'
  : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
---

{caption ? (
  <figure class:list={['seo-image', wrapperClass]}>
    <Picture
      src={src}
      alt={effectiveAlt}
      width={width}
      height={height}
      formats={['avif', 'webp']}
      widths={widths ?? defaultWidths}
      sizes={sizes ?? defaultSizes}
      loading={loading}
      fetchpriority={fetchpriority}
      decoding="async"
      class={imgClass}
    />
    <figcaption>{caption}</figcaption>
  </figure>
) : (
  <Picture
    src={src}
    alt={effectiveAlt}
    width={width}
    height={height}
    formats={['avif', 'webp']}
    widths={widths ?? defaultWidths}
    sizes={sizes ?? defaultSizes}
    loading={loading}
    fetchpriority={fetchpriority}
    decoding="async"
    class:list={[imgClass, wrapperClass]}
  />
)}

<style>
  figure.seo-image {
    margin: 0;
  }

  figure.seo-image figcaption {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-top: 0.5rem;
    line-height: 1.4;
  }

  figure.seo-image img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-md, 0.5rem);
  }
</style>
```

### Usage in Service+Location Page Template

```astro
---
// src/pages/[service]/[location].astro
import SEOImage from '@components/SEOImage.astro';
import Layout from '@layouts/ServiceLayout.astro';

const { service, location } = Astro.params;

// Fetch data from Payload CMS
const pageData = await fetch(`${CMS_URL}/api/pages?where[service][equals]=${service}&where[location][equals]=${location}`)
  .then(r => r.json());

const { heroImage, galleryImages, teamPhotos } = pageData;
---

<Layout>
  <!-- Hero: eager load, high priority, full-width -->
  <SEOImage
    src={heroImage.url}
    alt={heroImage.alt}
    width={1920}
    height={1080}
    isHero={true}
    sizes="100vw"
    widths={[480, 768, 1024, 1280, 1920]}
  />

  <!-- Service cards: lazy load, constrained -->
  {galleryImages.map((img, i) => (
    <SEOImage
      src={img.sizes.gallery.url}
      alt={img.alt}
      width={1200}
      height={800}
      caption={img.caption}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      widths={[300, 600, 900, 1200]}
    />
  ))}

  <!-- Team photos: lazy, square -->
  {teamPhotos.map((photo) => (
    <SEOImage
      src={photo.sizes.square.url}
      alt={photo.alt}
      width={400}
      height={400}
      sizes="(max-width: 640px) 50vw, 200px"
      widths={[200, 400]}
    />
  ))}
</Layout>
```

### Remote Image Authorization for Payload CMS

```typescript
// astro.config.mjs
export default defineConfig({
  image: {
    domains: ['cms.yourdomain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms.yourdomain.com',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net', // If using CloudFront CDN
      },
    ],
  },
});
```

---

## 13. Google Image Search Optimization

### How Service Page Images Rank in Image Search

Google Image Search is a significant traffic source for service-area businesses. Users search for things like "kitchen remodel Austin TX" and see image results. To capture this traffic:

### Technical Requirements

1. **Use standard `<img>` elements** — Google does not index CSS `background-image` or images loaded purely via JS without server-rendering
2. **Provide alt text with service + location** — Google uses alt text plus surrounding page context to understand the image
3. **Descriptive file names** — `kitchen-remodel-austin-tx-before-after.webp` directly signals content to Google
4. **Surrounding text context** — Place images near relevant headings and paragraphs that describe the work shown
5. **Unique images** — Stock photos used across many sites have low ranking potential. Original project photos rank higher.
6. **High resolution** — Google prefers images at least 1200px wide for Google Discover and featured snippets

### Structured Data for Images

Add `ImageObject` schema and `primaryImageOfPage` to service pages:

```astro
---
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Your Company',
  image: {
    '@type': 'ImageObject',
    url: `${siteUrl}${heroImage.url}`,
    width: 1920,
    height: 1080,
    caption: heroImage.alt,
  },
  // ... rest of LocalBusiness schema
};
---

<script type="application/ld+json" set:html={JSON.stringify(structuredData)} />
```

For individual project/gallery images:

```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "contentUrl": "https://example.com/images/kitchen-remodel-austin-tx.webp",
  "name": "Kitchen remodel in Austin, TX",
  "description": "Complete kitchen renovation including custom cabinetry and quartz countertops",
  "width": "1200",
  "height": "800",
  "encodingFormat": "image/webp",
  "creator": {
    "@type": "Organization",
    "name": "Your Company"
  }
}
```

### Image Search Ranking Checklist

| Factor | Action | Priority |
|--------|--------|----------|
| Alt text | Include service + city naturally | Critical |
| File name | Descriptive, hyphenated, keyword-aware | Critical |
| Surrounding context | Place image near relevant `<h2>`/`<h3>` and paragraph text | High |
| Image quality | Min 1200px wide, sharp, well-lit | High |
| Unique images | Use real project photos, not stock | High |
| Page authority | Ensure the page itself has strong on-page SEO | High |
| Image sitemap | Include all key images | Medium |
| Structured data | `ImageObject` schema | Medium |
| `<figure>` + `<figcaption>` | Semantic markup with visible caption | Medium |
| Page speed | Fast-loading images (WebP, proper sizing) | Medium |

### Content Strategy for Image SEO at Scale

For programmatic pages, you need a system for which images appear on which pages:

```
Tier 1 — Unique photos (highest ranking potential)
  → Real project photos shot by the business
  → Before/after comparisons
  → Team photos on-site
  → Assign to specific service+location pages based on where work was done

Tier 2 — Semi-unique images (moderate ranking potential)
  → Stock photos customized with text overlays, brand colors
  → AI-generated illustrations specific to the service
  → Assign by service category (all plumbing pages get plumbing images)

Tier 3 — Generic assets (low ranking potential, still needed)
  → Brand icons, logos, decorative elements
  → Map images (auto-generated per location)
  → Shared across all pages
```

---

## 14. Decorative vs Informative Images

### Decision Matrix

| Image Type | `alt` Value | `role` | Example |
|-----------|------------|--------|---------|
| **Informative** | Descriptive text (max 125 chars) | Default (none needed) | Project photo, team headshot, before/after |
| **Decorative** | `alt=""` (empty string) | `role="presentation"` | Background texture, divider line, abstract pattern |
| **Functional** | Describes the action | Default | Button icon ("Search"), linked logo ("Home") |
| **Complex** | Brief summary + `aria-describedby` | Default | Chart, diagram, infographic |
| **Redundant** | `alt=""` | `role="presentation"` | Icon next to text that says the same thing |

### Rules for Programmatic SEO Pages

**INFORMATIVE — provide alt text:**
- Hero images showing the service being performed
- Gallery/portfolio images of completed work
- Team/staff photos
- Before/after comparison images
- Service area maps
- Customer review/testimonial photos
- Product/equipment images

**DECORATIVE — use empty alt:**
- Background gradients/textures
- Horizontal rule/divider images
- Abstract patterns in card backgrounds
- Purely aesthetic flourishes
- Icons that appear next to text already describing the same concept (e.g., a phone icon next to "Call us at...")
- Star rating icons when the rating is already in text

### Implementation Pattern

```astro
---
// Decorative image — empty alt, presentational role
---
<img
  src="/images/section-divider.svg"
  alt=""
  role="presentation"
  loading="lazy"
  decoding="async"
  width="1200"
  height="2"
  aria-hidden="true"
/>

<!-- Informative image — descriptive alt -->
<img
  src="/images/plumber-austin-tx-kitchen-repair.webp"
  alt="Licensed plumber replacing copper pipes under a kitchen sink in Austin, TX"
  loading="lazy"
  decoding="async"
  width="800"
  height="600"
/>

<!-- Functional image (linked logo) — alt describes the link destination -->
<a href="/">
  <img
    src="/images/logo.svg"
    alt="Your Company — Home"
    width="250"
    height="60"
    loading="eager"
    decoding="async"
  />
</a>

<!-- Icon next to descriptive text — decorative (redundant) -->
<span>
  <img src="/icons/phone.svg" alt="" role="presentation" width="20" height="20" aria-hidden="true" />
  Call us: (555) 123-4567
</span>
```

### Payload CMS `isDecorative` Field Integration

When the `isDecorative` checkbox is checked in Payload CMS, the frontend template should:

1. Render `alt=""` regardless of what is in the alt text field
2. Add `role="presentation"` and `aria-hidden="true"`
3. Always use `loading="lazy"` (decorative images are never LCP candidates)

```astro
---
// Template logic
const effectiveAlt = image.isDecorative ? '' : image.alt;
const decorativeAttrs = image.isDecorative
  ? { role: 'presentation', 'aria-hidden': 'true' }
  : {};
---

<img
  src={image.url}
  alt={effectiveAlt}
  loading={image.isDecorative ? 'lazy' : loading}
  decoding="async"
  width={image.width}
  height={image.height}
  {...decorativeAttrs}
/>
```

---

## Quick Reference: Implementation Checklist

### Per-Image Checklist

- [ ] File named with `{service}-{city}-{state}-{descriptor}.webp` pattern
- [ ] WebP format served by default, AVIF as progressive enhancement
- [ ] Alt text is descriptive, under 125 characters, includes service+location naturally
- [ ] `width` and `height` attributes set (prevents CLS)
- [ ] `loading="lazy"` for below-fold, `loading="eager"` for LCP image
- [ ] `fetchpriority="high"` on LCP image only
- [ ] `decoding="async"` on all images
- [ ] `<figure>` + `<figcaption>` for images with visible captions
- [ ] Responsive `srcset` and `sizes` attributes present
- [ ] File size within budget for its type

### Per-Page Checklist

- [ ] Only ONE image has `fetchpriority="high"`
- [ ] LCP image is preloaded in `<head>`
- [ ] OG image meta tags present with correct dimensions
- [ ] Images are near relevant text content (headings, paragraphs)
- [ ] `ImageObject` structured data for key images
- [ ] Decorative images have `alt=""`
- [ ] No duplicate alt text across images on the page

### Build Pipeline Checklist

- [ ] Sharp processes all uploads into required sizes and formats
- [ ] Image validation script runs in CI (file size, alt text, dimensions)
- [ ] Image sitemaps generated and split into <50k URL files
- [ ] Sitemap index references all image sitemap files
- [ ] OG images generate on-demand with CDN caching
- [ ] `robots.txt` allows crawling of image directories and CDN

---

## Sources

- [Google Image SEO Best Practices (Official)](https://developers.google.com/search/docs/appearance/google-images)
- [Google Image Sitemaps (Official)](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
- [Image SEO: Alt Text, File Names & Optimization (2026)](https://seoscore.tools/blog/image-seo/)
- [Perfecting Image Alt Text for SEO (2026)](https://www.clickrank.ai/image-alt-text-for-seo/)
- [Astro Images Documentation](https://docs.astro.build/en/guides/images/)
- [Astro Experimental Responsive Images](https://5-0-0-beta.docs.astro.build/en/reference/experimental-flags/responsive-images/)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Payload CMS Uploads Documentation](https://payloadcms.com/docs/upload/overview)
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation)
- [Dynamic OG Images with Satori and Astro](https://nikuscs.com/blog/09-dynamic-seo-images-vercel-og-satori/)
- [WebP vs AVIF Comparison](https://elementor.com/blog/webp-vs-avif/)
- [Image Optimization: Automate WebP/AVIF Pipelines](https://maelstromwebservices.com/blog/ai-and-automation/automate-image-optimization/)
- [Best Image Sitemap Structure for Google Lens Indexing (2026)](https://www.clickrank.ai/image-sitemap-structure-google-lens/)
