# Page Experience Signals — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers Core Web Vitals optimization, mobile-first design, HTTPS enforcement, performance budgets, Lighthouse CI, and accessibility for Astro + Next.js programmatic SEO sites.

---

## Table of Contents

1. [Google's Page Experience Signals in 2026](#1-googles-page-experience-signals-in-2026)
2. [Core Web Vitals Deep Dive](#2-core-web-vitals-deep-dive)
3. [HTTPS Enforcement](#3-https-enforcement)
4. [Mobile-First Indexing](#4-mobile-first-indexing)
5. [No Intrusive Interstitials](#5-no-intrusive-interstitials)
6. [Safe Browsing Status](#6-safe-browsing-status)
7. [Viewport and Mobile Usability](#7-viewport-and-mobile-usability)
8. [Page Speed Optimization for Astro](#8-page-speed-optimization-for-astro)
9. [Page Speed Optimization for Next.js](#9-page-speed-optimization-for-nextjs)
10. [Lighthouse CI Integration](#10-lighthouse-ci-integration)
11. [Real User Monitoring (RUM)](#11-real-user-monitoring-rum)
12. [Performance Budgets](#12-performance-budgets)
13. [Font Loading Strategy](#13-font-loading-strategy)
14. [Third-Party Script Management](#14-third-party-script-management)
15. [Accessibility as a Ranking Factor](#15-accessibility-as-a-ranking-factor)

---

## 1. Google's Page Experience Signals in 2026

### What Are Page Experience Signals?

Page Experience is Google's umbrella term for a collection of signals that measure how users perceive the experience of interacting with a web page beyond its informational value. As of 2026, these signals are integrated directly into Google's ranking systems rather than existing as a standalone "Page Experience Update" — they function as tiebreakers and quality modifiers across the entire ranking pipeline.

### The Complete Signal Set

| Signal | Status in 2026 | Weight |
|--------|---------------|--------|
| **Core Web Vitals (LCP, INP, CLS)** | Active, field-data driven | Moderate — tiebreaker between otherwise equal content |
| **HTTPS** | Required baseline | Binary pass/fail — non-HTTPS pages are demoted significantly |
| **Mobile-friendly** | Required baseline | Binary — non-mobile-friendly pages excluded from mobile index |
| **No intrusive interstitials** | Active | Moderate — aggressive interstitials trigger demotion |
| **Safe Browsing** | Active | Binary — flagged sites are suppressed or warning-labeled |

### How Signals Are Weighted

Google has consistently stated that **content relevance remains the dominant ranking factor**. Page Experience signals function as:

1. **Tiebreakers**: When two pages have equivalent content quality and relevance, the one with better page experience wins.
2. **Quality modifiers**: Extremely poor page experience (e.g., 10+ second LCP) can actively harm rankings even for good content.
3. **Threshold-based**: Meeting "Good" thresholds matters more than exceeding them. Going from a 2.0s LCP to a 1.5s LCP provides diminishing returns compared to going from 3.5s to 2.4s.

### Field Data vs Lab Data

Google uses **field data** (real user metrics from the Chrome User Experience Report, CrUX) for ranking purposes. Lab data (Lighthouse, WebPageTest) is useful for debugging but does not directly influence rankings. The 75th percentile of field data over a 28-day rolling window determines your CWV scores.

### Impact on Programmatic SEO Sites

For service-area business (SAB) sites with hundreds or thousands of location pages, page experience is critical because:

- **Template consistency**: One template fix improves CWV across all pages simultaneously.
- **Thin content risk**: When content quality is similar across programmatic pages, page experience becomes the differentiator.
- **Crawl efficiency**: Faster pages get crawled more frequently, which matters for large programmatic sites.

---

## 2. Core Web Vitals Deep Dive

### 2.1 Largest Contentful Paint (LCP)

**What it measures**: The render time of the largest image or text block visible within the viewport, relative to when the page first started loading. LCP identifies when the main content of the page has finished rendering.

**Thresholds**:
| Rating | Time |
|--------|------|
| Good | ≤ 2.5 seconds |
| Needs Improvement | 2.5 – 4.0 seconds |
| Poor | > 4.0 seconds |

**Common LCP elements**:
- Hero images
- `<h1>` text blocks
- Background images rendered via CSS
- `<video>` poster images

**LCP Optimization for Astro**:

```astro
---
// src/components/HeroImage.astro
// Use Astro's built-in Image component for automatic optimization
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!--
  fetchpriority="high" tells the browser this is the LCP element.
  loading="eager" disables lazy loading for above-the-fold content.
  Astro automatically generates srcset, converts to WebP/AVIF, and sizes.
-->
<Image
  src={heroImage}
  alt="Professional plumbing service in {city}"
  width={1200}
  height={630}
  format="avif"
  quality={80}
  fetchpriority="high"
  loading="eager"
  class="w-full h-auto object-cover"
/>
```

```astro
---
// src/layouts/BaseLayout.astro
// Preload the LCP image in the <head> for fastest possible load
const lcpImageUrl = Astro.props.heroImage;
---
<html>
<head>
  <!-- Preload LCP image with high fetchpriority -->
  {lcpImageUrl && (
    <link
      rel="preload"
      as="image"
      href={lcpImageUrl}
      fetchpriority="high"
      type="image/avif"
    />
  )}

  <!-- Preconnect to image CDN if using external images -->
  <link rel="preconnect" href="https://images.yourdomain.com" />

  <!-- Inline critical CSS to avoid render-blocking stylesheets -->
  <style is:inline>
    /* Critical above-the-fold styles only */
    .hero-section {
      min-height: 60vh;
      display: flex;
      align-items: center;
    }
    .hero-image {
      width: 100%;
      height: auto;
      aspect-ratio: 1200 / 630;
    }
  </style>

  <!-- Defer non-critical CSS -->
  <link rel="stylesheet" href="/styles/below-fold.css" media="print" onload="this.media='all'" />
</head>
<body>
  <slot />
</body>
</html>
```

**LCP Optimization for Next.js**:

```tsx
// app/[city]/[service]/page.tsx
import Image from 'next/image';

export default async function ServicePage({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const data = await getServiceData(city, service);

  return (
    <section className="hero-section">
      {/*
        Next.js Image with priority prop:
        - Disables lazy loading
        - Adds preload link to <head> automatically
        - Generates srcset with multiple sizes
      */}
      <Image
        src={data.heroImage}
        alt={`${data.serviceName} in ${data.cityName}`}
        width={1200}
        height={630}
        priority // This is the LCP element — always set priority
        sizes="100vw"
        className="w-full h-auto object-cover"
        placeholder="blur"
        blurDataURL={data.heroBlurHash}
      />
      <h1 className="text-4xl font-bold mt-6">
        {data.serviceName} in {data.cityName}
      </h1>
    </section>
  );
}
```

```js
// next.config.js — Image optimization settings
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.yourdomain.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

**Server-side LCP optimizations**:

```json
// vercel.json — Caching for optimal TTFB (which directly impacts LCP)
{
  "headers": [
    {
      "source": "/:city/:service",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=3600, stale-while-revalidate=86400"
        }
      ]
    }
  ]
}
```

### 2.2 Interaction to Next Paint (INP)

**What it measures**: INP replaced First Input Delay (FID) in March 2024. While FID only measured the delay of the *first* interaction, INP measures the latency of *all* interactions throughout the page's lifecycle and reports the worst interaction (at the 98th percentile). This includes clicks, taps, and keyboard inputs — measuring the full cycle from input to the next frame paint.

**Thresholds**:
| Rating | Time |
|--------|------|
| Good | ≤ 200 milliseconds |
| Needs Improvement | 200 – 500 milliseconds |
| Poor | > 500 milliseconds |

**What INP captures**:
- **Input delay**: Time between user interaction and event handler starting (caused by main thread being busy)
- **Processing time**: Time spent executing event handlers
- **Presentation delay**: Time from event handlers completing to browser painting the next frame

**INP Optimization for Astro**:

```astro
---
// Astro's island architecture is INP's best friend.
// Static HTML = zero JavaScript on the main thread = near-zero input delay.
// Only hydrate interactive components.
---

<!-- This button is pure HTML — no JS, instant response -->
<a href="tel:+15551234567" class="btn-primary">
  Call Now
</a>

<!-- Only this component ships JavaScript, and only when visible -->
<ContactForm client:visible />

<!-- Review carousel loads JS only on idle — doesn't block interactions -->
<ReviewCarousel client:idle />

<!-- Map loads only when user explicitly interacts -->
<ServiceAreaMap client:only="react" />
```

```astro
---
// src/components/ContactForm.astro
// Use client:visible to defer hydration until the form scrolls into view
---
<contact-form-wrapper>
  <!-- Progressive enhancement: form works without JS -->
  <form action="/api/contact" method="POST" class="space-y-4">
    <input type="text" name="name" required class="input" placeholder="Your Name" />
    <input type="email" name="email" required class="input" placeholder="Email" />
    <textarea name="message" required class="input" placeholder="How can we help?"></textarea>
    <button type="submit" class="btn-primary">Send Message</button>
  </form>
</contact-form-wrapper>

<script>
  // This script is deferred by default in Astro
  // It enhances the form with client-side validation only after load
  class ContactFormWrapper extends HTMLElement {
    connectedCallback() {
      const form = this.querySelector('form');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Yield to main thread before validation to keep INP low
        await this.yieldToMain();
        this.validateAndSubmit(form);
      });
    }

    async validateAndSubmit(form) {
      const data = new FormData(form);
      // Yield to main thread between heavy operations
      await this.yieldToMain();
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: data,
      });
      await this.yieldToMain();
      // Handle response...
    }

    // Utility to yield to the main thread, preventing long tasks
    yieldToMain() {
      return new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }
  }

  customElements.define('contact-form-wrapper', ContactFormWrapper);
</script>
```

**INP Optimization for Next.js**:

```tsx
// app/components/ServiceFilter.tsx
'use client';

import { useTransition, useState, useCallback } from 'react';

export function ServiceFilter({ services }: { services: Service[] }) {
  const [filter, setFilter] = useState('');
  const [filteredServices, setFilteredServices] = useState(services);
  // useTransition marks the filtering as non-urgent,
  // keeping the input responsive (good INP)
  const [isPending, startTransition] = useTransition();

  const handleFilter = useCallback(
    (value: string) => {
      // The input update happens immediately (urgent)
      setFilter(value);

      // The list filtering is deferred (non-urgent)
      startTransition(() => {
        setFilteredServices(
          services.filter((s) =>
            s.name.toLowerCase().includes(value.toLowerCase())
          )
        );
      });
    },
    [services]
  );

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => handleFilter(e.target.value)}
        placeholder="Filter services..."
        className="input"
      />
      {isPending && <span className="text-sm text-gray-500">Updating...</span>}
      <ul>
        {filteredServices.map((service) => (
          <li key={service.id}>{service.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// Break up long tasks with yield patterns
// lib/yield-to-main.ts
export function yieldToMain(): Promise<void> {
  // scheduler.yield() is the modern API (2025+)
  if ('scheduler' in globalThis && 'yield' in (globalThis as any).scheduler) {
    return (globalThis as any).scheduler.yield();
  }
  // Fallback for older browsers
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// Usage in event handlers:
async function handleComplexInteraction() {
  doStepOne();
  await yieldToMain(); // Let browser paint between steps
  doStepTwo();
  await yieldToMain();
  doStepThree();
}
```

### 2.3 Cumulative Layout Shift (CLS)

**What it measures**: CLS quantifies how much the visible content of a page unexpectedly shifts during its lifetime. It sums up individual layout shift scores that occur without user input (e.g., not triggered by a click or tap). The score is calculated as `impact fraction x distance fraction` for each shift.

**Thresholds**:
| Rating | Score |
|--------|-------|
| Good | ≤ 0.1 |
| Needs Improvement | 0.1 – 0.25 |
| Poor | > 0.25 |

**Common CLS causes**:
- Images without explicit dimensions
- Ads, embeds, or iframes without reserved space
- Dynamically injected content above existing content
- Web fonts causing FOIT/FOUT (Flash of Invisible/Unstyled Text)
- Late-loading components pushing content down

**CLS Optimization for Astro**:

```astro
---
// src/components/OptimizedImage.astro
// ALWAYS set explicit width/height or use aspect-ratio
// This prevents layout shift when the image loads
interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  class?: string;
}

const { src, alt, width, height, class: className } = Astro.props;
---

<img
  src={src}
  alt={alt}
  width={width}
  height={height}
  loading="lazy"
  decoding="async"
  class:list={['block', className]}
  style={`aspect-ratio: ${width} / ${height};`}
/>
```

```astro
---
// src/components/AdSlot.astro
// Reserve space for ads/embeds to prevent CLS
interface Props {
  width: number;
  height: number;
  slotId: string;
}

const { width, height, slotId } = Astro.props;
---

<div
  class="ad-container bg-gray-100"
  style={`min-height: ${height}px; width: 100%; max-width: ${width}px; aspect-ratio: ${width} / ${height}; contain: layout;`}
  data-ad-slot={slotId}
>
  <!-- Ad loads here without shifting surrounding content -->
</div>
```

```css
/* Global CLS prevention styles */

/* Prevent font swap layout shift */
@font-face {
  font-family: 'Brand Font';
  src: url('/fonts/brand.woff2') format('woff2');
  font-display: optional; /* Prevents ANY layout shift from fonts */
  font-weight: 100 900;   /* Variable font — single file */
  size-adjust: 100%;       /* Match fallback metrics */
  ascent-override: 90%;
  descent-override: 20%;
  line-gap-override: 0%;
}

/* Reserve space for dynamic content */
.dynamic-content-slot {
  min-height: var(--slot-min-height, 200px);
  contain: layout style;
}

/* Prevent images from causing shifts */
img, video, iframe, embed, object {
  max-width: 100%;
  height: auto;
}
```

**CLS Optimization for Next.js**:

```tsx
// app/[city]/page.tsx
// Use Suspense with appropriately-sized fallbacks to prevent CLS
import { Suspense } from 'react';

function ReviewsSkeleton() {
  return (
    // Skeleton matches the exact dimensions of the loaded content
    <div
      className="animate-pulse space-y-4"
      style={{ minHeight: '320px' }} // Match real content height
      role="status"
      aria-label="Loading reviews"
    >
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );
}

export default function CityPage() {
  return (
    <main>
      {/* Static content renders immediately — no shifts */}
      <h1 className="text-4xl font-bold">Plumbing in Austin, TX</h1>
      <p className="mt-4">Professional plumbing services...</p>

      {/* Dynamic content has a skeleton that matches final size */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsList city="austin" />
      </Suspense>
    </main>
  );
}
```

```tsx
// components/DynamicEmbed.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

// Wrapper that prevents CLS for dynamically sized content
export function DynamicEmbed({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        minHeight: height ?? 200,
        contain: 'layout',
        contentVisibility: 'auto',
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}
```

### CWV Debugging Workflow

```bash
# 1. Check field data (what Google actually uses for ranking)
# Visit: https://pagespeed.web.dev/ and enter your URL
# Or use the CrUX API programmatically

# 2. Check lab data for debugging (not used for ranking)
npx lighthouse https://yourdomain.com/austin/plumbing \
  --output=json \
  --output-path=./lighthouse-report.json \
  --only-categories=performance

# 3. Web Vitals Chrome Extension for real-time monitoring
# Install: https://chrome.google.com/webstore/detail/web-vitals
```

---

## 3. HTTPS Enforcement

### Why HTTPS Is Required

Since 2014, HTTPS has been a ranking signal. By 2026, it is effectively a **binary requirement** — non-HTTPS pages face significant ranking penalties and browser warnings that destroy user trust. For service-area businesses, customers seeing "Not Secure" in the browser bar will immediately bounce.

### Vercel HTTPS Configuration

Vercel provides automatic HTTPS via Let's Encrypt for all deployments. However, you must ensure proper configuration:

```json
// vercel.json — Force HTTPS and configure security headers
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "0"  // Deprecated; CSP replaces this header. "1; mode=block" can introduce vulnerabilities.
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com; frame-src https://www.google.com https://www.youtube.com"
        }
      ]
    }
  ]
}
```

### Mixed Content Detection

Mixed content (loading HTTP resources on an HTTPS page) breaks the security chain and can cause browser warnings or blocked resources.

```ts
// scripts/check-mixed-content.ts
// Run this in CI to catch mixed content before deployment
import { JSDOM } from 'jsdom';
import { glob } from 'glob';
import { readFileSync } from 'fs';

async function checkMixedContent() {
  const htmlFiles = await glob('dist/**/*.html');
  const violations: string[] = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Check all resource-loading attributes
    const selectors = [
      'img[src^="http:"]',
      'script[src^="http:"]',
      'link[href^="http:"]',
      'iframe[src^="http:"]',
      'video[src^="http:"]',
      'audio[src^="http:"]',
      'source[src^="http:"]',
      'object[data^="http:"]',
      'embed[src^="http:"]',
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((el) => {
        const attr = selector.includes('[src')
          ? 'src'
          : selector.includes('[href')
            ? 'href'
            : 'data';
        violations.push(
          `${file}: <${el.tagName.toLowerCase()}> has insecure ${attr}="${el.getAttribute(attr)}"`
        );
      });
    }

    // Check inline styles for http:// URLs
    const styleElements = doc.querySelectorAll('[style]');
    styleElements.forEach((el) => {
      const style = el.getAttribute('style') || '';
      if (style.includes('http://')) {
        violations.push(`${file}: inline style contains http:// URL`);
      }
    });
  }

  if (violations.length > 0) {
    console.error('Mixed content violations found:');
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }

  console.log('No mixed content violations found.');
}

checkMixedContent();
```

### HSTS Preload

To be added to the HSTS preload list (hardcoded into browsers), your site must:

1. Serve a valid HTTPS certificate
2. Redirect all HTTP traffic to HTTPS
3. Serve the HSTS header with `max-age` of at least 1 year (31536000), `includeSubDomains`, and `preload`
4. Submit at https://hstspreload.org/

---

## 4. Mobile-First Indexing

### What Mobile-First Indexing Means in 2026

Since July 2024, Google has completed the migration to mobile-first indexing for all sites. This means:

- **Google's crawler (Googlebot) primarily uses the mobile user agent** to crawl and index your pages.
- The **mobile version** of your content is what Google evaluates for ranking.
- If content exists only on the desktop version and not on mobile, **Google will not see it**.
- The desktop version is still crawled occasionally but is secondary.

### How Google Crawls Mobile-First

Googlebot's mobile crawler identifies as:

```
Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36
(KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36
(compatible; Googlebot/2.1; +http://www.google.com/bot.html)
```

Key behaviors:
- **Viewport**: 412x823 CSS pixels (Nexus 5X equivalent)
- **JavaScript rendering**: Full Chromium-based rendering (WRS — Web Rendering Service)
- **Network**: Simulates a fast 4G connection
- **Caching**: Googlebot caches resources aggressively; stale resources can cause rendering issues

### Responsive Design Requirements

```astro
---
// src/layouts/BaseLayout.astro
---
<html lang="en">
<head>
  <!-- CRITICAL: Viewport meta tag — without this, Google treats your page as desktop-only -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!--
    Do NOT use any of these anti-patterns:
    - maximum-scale=1.0 (blocks pinch-to-zoom, accessibility violation)
    - user-scalable=no (same issue)
    - width=1024 (forces desktop width)
  -->

  <meta charset="UTF-8" />
  <meta name="theme-color" content="#1a56db" />
</head>
<body>
  <slot />
</body>
</html>
```

```css
/* Tailwind CSS responsive design patterns for SAB sites */

/* Base: mobile-first (all styles without breakpoint prefix are mobile) */
.service-grid {
  @apply grid grid-cols-1 gap-4;      /* Mobile: single column */
  @apply sm:grid-cols-2;               /* 640px+: two columns */
  @apply lg:grid-cols-3;               /* 1024px+: three columns */
}

/* Ensure content parity between mobile and desktop */
/* NEVER hide critical content on mobile with display:none */
.service-description {
  @apply text-base;                    /* Same content on all sizes */
  @apply lg:text-lg;                   /* Slightly larger on desktop */
}

/* Bad: This hides content from Googlebot's mobile crawler */
/* .desktop-only-content { @apply hidden lg:block; } */

/* Good: Show all content, adjust layout */
.sidebar-content {
  @apply mt-8;                         /* Below main content on mobile */
  @apply lg:mt-0 lg:ml-8;             /* Beside main content on desktop */
}
```

### Mobile-First Testing Tools

```bash
# 1. Google's Mobile-Friendly Test (still active in 2026)
# https://search.google.com/test/mobile-friendly

# 2. Lighthouse mobile audit
npx lighthouse https://yourdomain.com/austin/plumbing \
  --emulated-form-factor=mobile \
  --output=html \
  --output-path=./mobile-audit.html

# 3. Chrome DevTools Device Mode
# Open DevTools > Toggle Device Toolbar (Ctrl+Shift+M)
# Test with: Nexus 5X, iPhone 12 Pro, iPad

# 4. Verify Googlebot can render your page
# Google Search Console > URL Inspection > Live Test > View Tested Page
```

### Structured Data Parity

Ensure structured data is present in the mobile version:

```astro
---
// src/components/LocalBusinessSchema.astro
// This MUST be in the mobile-rendered HTML, not injected via desktop-only JS
const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": Astro.props.businessName,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": Astro.props.city,
    "addressRegion": Astro.props.state,
  },
  "telephone": Astro.props.phone,
  "url": Astro.props.url,
};
---

<!-- Inline script renders in both mobile and desktop — Googlebot sees it -->
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

---

## 5. No Intrusive Interstitials

### What Google Considers Intrusive

Google penalizes pages that show interstitials (popups, overlays, modals) that block the main content, especially on mobile. The penalty applies to the **page level**, not the site level.

**Intrusive (will trigger demotion)**:
- A popup covering the main content immediately after the user navigates from search
- A standalone interstitial the user must dismiss before accessing content
- A layout where the above-the-fold portion looks like an interstitial, but the original content has been inlined underneath
- Full-screen app install banners

**Not intrusive (acceptable)**:
- Cookie consent banners (required by law — GDPR, CCPA)
- Age verification dialogs (required by law)
- Login dialogs for paywalled content (if a reasonable amount of content is visible)
- Small banners that use a reasonable amount of screen space (e.g., app install banners from the browser itself)

### Implementation Guidelines

```astro
---
// src/components/CookieConsent.astro
// GOOD: Small bottom banner, doesn't block content
---

<div
  id="cookie-consent"
  class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-lg transform translate-y-full transition-transform duration-300"
  role="dialog"
  aria-label="Cookie consent"
  data-nosnippet
>
  <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
    <p class="text-sm text-gray-600">
      We use cookies to improve your experience. By continuing, you agree to our
      <a href="/privacy" class="text-blue-600 underline">Privacy Policy</a>.
    </p>
    <div class="flex gap-2 shrink-0">
      <button
        id="cookie-reject"
        class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
      >
        Reject
      </button>
      <button
        id="cookie-accept"
        class="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Accept
      </button>
    </div>
  </div>
</div>

<script>
  // Only show if consent hasn't been given
  const consent = localStorage.getItem('cookie-consent');
  if (!consent) {
    const banner = document.getElementById('cookie-consent');
    // Delay showing by 1 second to not interfere with initial page experience
    setTimeout(() => {
      banner?.classList.remove('translate-y-full');
    }, 1000);
  }

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    document.getElementById('cookie-consent')?.classList.add('translate-y-full');
  });

  document.getElementById('cookie-reject')?.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'rejected');
    document.getElementById('cookie-consent')?.classList.add('translate-y-full');
  });
</script>
```

**Bad vs Good popup patterns in Next.js**:

```tsx
// BAD: Full-screen popup on page load — will trigger Google's penalty
function BadPopup() {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-md">
        <h2>Get 20% Off!</h2>
        <p>Sign up for our newsletter...</p>
        <button>Close</button>
      </div>
    </div>
  );
}

// GOOD: Triggered by user scroll engagement, small non-blocking overlay
function GoodPromotion() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show after significant engagement (scroll past 50%)
    const handleScroll = () => {
      const scrollPercent =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.5) {
        setShow(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    // Small slide-up banner, not full-screen overlay
    <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-white border rounded-lg shadow-lg p-4">
      <button
        onClick={() => setShow(false)}
        className="absolute top-2 right-2"
        aria-label="Close"
      >
        x
      </button>
      <p className="text-sm">Get a free quote for your project!</p>
      <a href="/contact" className="text-blue-600 text-sm underline">
        Contact us
      </a>
    </div>
  );
}
```

---

## 6. Safe Browsing Status

### What Safe Browsing Is

Google Safe Browsing is a service that identifies unsafe websites — those hosting malware, phishing pages, unwanted software, or deceptive content. If your site is flagged:

- Google shows a **red warning interstitial** to Chrome users before they can visit your site
- Your site may be **suppressed or removed from search results**
- Google Search Console will show a **Security Issues** report

### How to Check Safe Browsing Status

1. **Google Safe Browsing Transparency Report**: https://transparencyreport.google.com/safe-browsing/search?url=yourdomain.com
2. **Google Search Console**: Security and Manual Actions > Security Issues
3. **Safe Browsing API**: Programmatic check against the threat database

```ts
// scripts/check-safe-browsing.ts
// Run weekly in CI or as a cron job
async function checkSafeBrowsing(domains: string[]) {
  const API_KEY = process.env.SAFE_BROWSING_API_KEY;
  const response = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'sab-monitor', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: domains.map((url) => ({ url })),
        },
      }),
    }
  );

  const data = await response.json();

  if (data.matches && data.matches.length > 0) {
    console.error('SAFE BROWSING ALERT: Threats detected!');
    data.matches.forEach((match: any) => {
      console.error(`  Threat: ${match.threatType} on ${match.threat.url}`);
    });
    // Send alert to team via Slack/email
    process.exit(1);
  }

  console.log('All domains clear of Safe Browsing threats.');
}

checkSafeBrowsing([
  'https://yourdomain.com',
  'https://yourdomain.com/austin/plumbing',
  'https://yourdomain.com/dallas/electrician',
]);
```

### How to Recover from a Flagged Site

1. **Identify the issue**: Check Google Search Console > Security Issues for specifics.
2. **Remove malicious content**: Clean all infected files, remove unauthorized scripts, update all passwords and API keys.
3. **Audit third-party scripts**: A compromised third-party script is the most common vector. Remove or update all external dependencies.
4. **Request a review**: In Search Console > Security Issues > "Request a Review". Google typically reviews within 72 hours.
5. **Prevent recurrence**: Implement Content Security Policy headers (see HTTPS section), use Subresource Integrity (SRI) for third-party scripts, and set up monitoring.

```html
<!-- Subresource Integrity for third-party scripts -->
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxA..."
  crossorigin="anonymous"
></script>
```

---

## 7. Viewport and Mobile Usability

### Viewport Meta Tag

The viewport meta tag is the single most critical mobile optimization. Without it, mobile browsers render the page at a desktop width (typically 980px) and scale down.

```html
<!-- The only viewport tag you should ever use -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Do not use**:
- `maximum-scale=1.0` — Blocks pinch-to-zoom, WCAG 2.2 failure
- `user-scalable=no` — Same issue, accessibility violation
- `width=1024` or any fixed width — Forces desktop rendering

### Tap Target Sizing

Google requires interactive elements to be at least **48x48 CSS pixels** with adequate spacing between them.

```js
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      minHeight: {
        tap: '48px',
      },
      minWidth: {
        tap: '48px',
      },
      spacing: {
        'tap-gap': '8px', /* Minimum 8px between tap targets */
      },
    },
  },
};
```

```astro
---
// src/components/MobileNav.astro
// All interactive elements meet 48x48px minimum
---
<nav class="lg:hidden">
  <ul class="flex flex-col gap-2">
    <li>
      <a
        href="/services"
        class="block min-h-tap px-4 py-3 text-base font-medium rounded-lg
               active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Services
      </a>
    </li>
    <li>
      <a
        href="/areas"
        class="block min-h-tap px-4 py-3 text-base font-medium rounded-lg
               active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Service Areas
      </a>
    </li>
    <li>
      <!-- Phone CTA: large, obvious tap target -->
      <a
        href="tel:+15551234567"
        class="flex items-center justify-center min-h-tap px-6 py-3
               bg-blue-600 text-white font-bold rounded-lg text-lg
               active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Call (555) 123-4567
      </a>
    </li>
  </ul>
</nav>
```

### Font Sizing

Google recommends a base font size of at least **16px** on mobile. Text smaller than 12px is flagged as a mobile usability issue.

```css
/* Base font sizing — Tailwind defaults are mobile-friendly */
html {
  font-size: 16px; /* 1rem = 16px — never go below this */
  -webkit-text-size-adjust: 100%; /* Prevent iOS from auto-adjusting */
  text-size-adjust: 100%;
}

body {
  @apply text-base leading-relaxed; /* 16px with 1.625 line height */
}

/* Minimum font sizes for readability */
.body-text { @apply text-base; }      /* 16px */
.small-text { @apply text-sm; }        /* 14px — minimum for secondary text */
.caption { @apply text-xs; }           /* 12px — absolute minimum, use sparingly */
```

### No Horizontal Scrolling

Horizontal scrolling is a mobile usability failure. Common causes and fixes:

```css
/* Prevent horizontal overflow at the root level */
html, body {
  overflow-x: hidden; /* Safety net — fix root causes instead */
  max-width: 100vw;
}

/* Common cause 1: Fixed-width elements */
/* Bad: */  .content { width: 960px; }
/* Good: */ .content { width: 100%; max-width: 960px; margin: 0 auto; }

/* Common cause 2: Tables */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}

/* Common cause 3: Code blocks */
pre, code {
  overflow-x: auto;
  max-width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Common cause 4: Images */
img {
  max-width: 100%;
  height: auto;
}
```

---

## 8. Page Speed Optimization for Astro

Astro is purpose-built for content-heavy sites and is the ideal framework for programmatic SEO pages due to its **zero-JavaScript-by-default** architecture.

### Zero JS by Default

Astro ships **zero client-side JavaScript** unless you explicitly opt in with `client:*` directives. This means:

- Static HTML renders instantly — no hydration delay
- Time to Interactive (TTI) equals First Contentful Paint (FCP)
- Main thread is free for user interactions (excellent INP)

```astro
---
// src/pages/[city]/[service].astro
// This entire page ships ZERO JavaScript to the browser
import Layout from '../../layouts/Layout.astro';
import ServiceHero from '../../components/ServiceHero.astro';
import ServiceDetails from '../../components/ServiceDetails.astro';
import ReviewList from '../../components/ReviewList.astro';
import CTASection from '../../components/CTASection.astro';
import FAQSection from '../../components/FAQSection.astro';
import LocalBusinessSchema from '../../components/LocalBusinessSchema.astro';

const { city, service } = Astro.params;
const data = await getPageData(city, service);
---

<Layout title={data.title} description={data.description}>
  <LocalBusinessSchema {...data.schema} />
  <ServiceHero
    title={data.h1}
    image={data.heroImage}
    phone={data.phone}
  />
  <ServiceDetails content={data.content} />
  <ReviewList reviews={data.reviews} />
  <FAQSection faqs={data.faqs} />
  <CTASection phone={data.phone} city={data.cityName} />
</Layout>
<!-- Total JS shipped: 0 bytes -->
```

### Island Architecture

When JavaScript is needed, Astro's island architecture loads it surgically:

```astro
---
// Islands: interactive components surrounded by static HTML
// Each island hydrates independently — one slow island doesn't block others
---

<!-- No JS needed — pure HTML/CSS -->
<header>
  <h1>{data.title}</h1>
  <p>{data.description}</p>
</header>

<!-- Island 1: Contact form hydrates only when scrolled into view -->
<ContactForm client:visible formId={data.formId} />

<!-- Island 2: Map loads only when browser is idle -->
<GoogleMap client:idle lat={data.lat} lng={data.lng} />

<!-- Island 3: Chat widget loads only on media query match (desktop only) -->
<LiveChat client:media="(min-width: 1024px)" />

<!-- Island 4: React component that never runs on server -->
<InteractiveCalculator client:only="react" />
```

**Client directive reference**:
| Directive | When JS loads | Use case |
|-----------|--------------|----------|
| `client:load` | Immediately on page load | Critical interactive elements (e.g., navigation menu) |
| `client:idle` | After page load, when browser is idle | Non-critical interactive elements (e.g., carousel) |
| `client:visible` | When component scrolls into viewport | Below-fold interactive elements (e.g., contact form) |
| `client:media="(query)"` | When media query matches | Responsive components (e.g., desktop-only widgets) |
| `client:only="framework"` | Client-side only, no SSR | Components that can't be server-rendered |
| (no directive) | Never | Static components (default — no JS shipped) |

### Image Optimization

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        avif: { quality: 70 },
        webp: { quality: 75 },
        jpeg: { quality: 80 },
      },
    },
    remotePatterns: [
      { protocol: 'https', hostname: '**.payloadcms.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  compressHTML: true,
});
```

```astro
---
// src/components/ResponsiveImage.astro
import { Image, getImage } from 'astro:assets';

interface Props {
  src: ImageMetadata | string;
  alt: string;
  widths?: number[];
  isLCP?: boolean;
}

const {
  src,
  alt,
  widths = [400, 800, 1200],
  isLCP = false,
} = Astro.props;

const optimized = await getImage({
  src,
  width: widths[widths.length - 1],
  format: 'avif',
  quality: 75,
});
---

<picture>
  <!-- AVIF: smallest file size, modern browsers -->
  <source
    type="image/avif"
    srcset={widths.map(w => `${optimized.src}?w=${w} ${w}w`).join(', ')}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  <!-- WebP fallback -->
  <source
    type="image/webp"
    srcset={widths.map(w => `${optimized.src}?w=${w}&f=webp ${w}w`).join(', ')}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  <!-- JPEG fallback for old browsers -->
  <img
    src={optimized.src}
    alt={alt}
    width={optimized.attributes.width}
    height={optimized.attributes.height}
    loading={isLCP ? 'eager' : 'lazy'}
    decoding={isLCP ? 'sync' : 'async'}
    fetchpriority={isLCP ? 'high' : 'auto'}
    class="w-full h-auto"
  />
</picture>
```

### Font Loading Strategy (Astro)

```astro
---
// src/layouts/Layout.astro
---
<html lang="en">
<head>
  <!-- Preload critical font files -->
  <link
    rel="preload"
    href="/fonts/inter-var-latin.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />

  <style is:inline>
    /* Inline critical @font-face to avoid extra network requests */
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-var-latin.woff2') format('woff2');
      font-weight: 100 900;
      font-style: normal;
      font-display: optional; /* Eliminates CLS from font swap */
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
        U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323,
        U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
        U+2212, U+2215, U+FEFF, U+FFFD;
    }
  </style>
</head>
<body class="font-sans">
  <slot />
</body>
</html>
```

---

## 9. Page Speed Optimization for Next.js

### Server Components (Default in App Router)

Next.js App Router makes all components server components by default. This is critical for performance:

```tsx
// app/[city]/[service]/page.tsx
// This is a Server Component — zero JS shipped for this component
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServicePage } from '@/lib/payload';

// Generate all city/service combinations at build time
export async function generateStaticParams() {
  const pages = await getAllServicePages();
  return pages.map((page) => ({
    city: page.city.slug,
    service: page.service.slug,
  }));
}

// Dynamic metadata — runs on server only
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}): Promise<Metadata> {
  const { city, service } = await params;
  const page = await getServicePage(city, service);
  if (!page) return {};

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: {
      title: page.ogTitle,
      description: page.ogDescription,
      images: [{ url: page.ogImage }],
    },
  };
}

// Note: For rendering CMS HTML content, use a sanitization library like
// DOMPurify to prevent XSS when using innerHTML/dangerouslySetInnerHTML.
// Example: sanitizedHtml = DOMPurify.sanitize(page.content)
export default async function ServicePage({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const page = await getServicePage(city, service);
  if (!page) notFound();

  return (
    <main>
      {/* All of this renders on the server — zero client JS */}
      <h1 className="text-4xl font-bold">{page.h1}</h1>
      <RichTextRenderer content={page.content} className="prose prose-lg mt-6" />
      {/* Only the interactive form is a Client Component */}
      <ContactForm serviceId={page.service.id} cityId={page.city.id} />
    </main>
  );
}
```

### Streaming with Suspense

```tsx
// app/[city]/page.tsx
import { Suspense } from 'react';
import { CityHero } from '@/components/CityHero';
import { ServiceList } from '@/components/ServiceList';
import { Reviews } from '@/components/Reviews';
import { NearbyAreas } from '@/components/NearbyAreas';

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  return (
    <main>
      {/* Critical content streams first — fast LCP */}
      <CityHero city={city} />

      {/* These stream in as they resolve — progressive rendering */}
      <Suspense fallback={<ServiceListSkeleton />}>
        <ServiceList city={city} />
      </Suspense>

      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews city={city} />
      </Suspense>

      {/* Low-priority content loads last */}
      <Suspense fallback={<NearbyAreasSkeleton />}>
        <NearbyAreas city={city} />
      </Suspense>
    </main>
  );
}
```

### Dynamic Imports

```tsx
// Only load heavy components when needed
import dynamic from 'next/dynamic';

// Map component — loaded only when user scrolls to it
const ServiceAreaMap = dynamic(
  () => import('@/components/ServiceAreaMap'),
  {
    loading: () => (
      <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
    ),
    ssr: false, // Map doesn't need server rendering
  }
);

// Before/after gallery — loaded on interaction
const BeforeAfterGallery = dynamic(
  () => import('@/components/BeforeAfterGallery'),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
    ),
  }
);

export default function ServicePage() {
  return (
    <main>
      <h1>Plumbing Services in Austin, TX</h1>
      {/* ... static content ... */}
      <ServiceAreaMap lat={30.2672} lng={-97.7431} />
      <BeforeAfterGallery projectId="austin-plumbing" />
    </main>
  );
}
```

### Bundle Analysis

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimize package imports — tree-shake heavy libraries
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'date-fns',
      'lodash-es',
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        lodash: 'lodash-es', // Tree-shakeable lodash
      };
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

```bash
# Run bundle analysis
ANALYZE=true npm run build

# Output: opens .next/analyze/client.html and .next/analyze/nodejs.html
# Look for:
# - Packages > 50KB (candidates for dynamic import)
# - Duplicated packages
# - Unused exports that aren't tree-shaken
```

### Font Optimization with next/font

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

// next/font automatically:
// - Self-hosts fonts (no external requests to Google Fonts)
// - Generates @font-face with font-display: swap (configurable)
// - Applies size-adjust to minimize CLS
// - Creates CSS variables for Tailwind integration

const inter = Inter({
  subsets: ['latin'],
  display: 'optional', // Use 'optional' to prevent ANY CLS from fonts
  variable: '--font-inter',
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap', // OK for headings — CLS impact is minimal
  variable: '--font-playfair',
  weight: ['400', '700'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

```js
// tailwind.config.js — Use the CSS variables from next/font
module.exports = {
  theme: {
    fontFamily: {
      sans: [
        'var(--font-inter)',
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif',
      ],
      heading: ['var(--font-playfair)', 'Georgia', 'serif'],
    },
  },
};
```

```tsx
// For local/custom fonts:
import localFont from 'next/font/local';

const brandFont = localFont({
  src: [
    {
      path: '../fonts/brand-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/brand-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'optional',
  variable: '--font-brand',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
```

---

## 10. Lighthouse CI Integration

Lighthouse CI automates performance audits in your CI/CD pipeline, catching regressions before they reach production.

### Setup

```bash
# Install Lighthouse CI
npm install -D @lhci/cli
```

### Configuration

```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      // URLs to audit — include representative programmatic pages
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/austin/plumbing',
        'http://localhost:3000/dallas/electrician',
        'http://localhost:3000/houston/hvac',
      ],
      // Run 3 times per URL for stable results
      numberOfRuns: 3,
      // Use the production build
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638,
          cpuSlowdownMultiplier: 4,
        },
        onlyCategories: ['performance', 'accessibility', 'seo'],
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        // Note: TTI ('interactive') was removed from Lighthouse 10 scoring.
        // TBT (total-blocking-time) is the correct lab proxy for INP.
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],

        // Category scores (0-1)
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Resource budgets
        'resource-summary:script:size': [
          'warn',
          { maxNumericValue: 150000 },
        ],
        'resource-summary:stylesheet:size': [
          'warn',
          { maxNumericValue: 50000 },
        ],
        'resource-summary:image:size': [
          'warn',
          { maxNumericValue: 500000 },
        ],
        'resource-summary:total:size': [
          'warn',
          { maxNumericValue: 800000 },
        ],
        'resource-summary:third-party:size': [
          'warn',
          { maxNumericValue: 100000 },
        ],

        // Individual audit assertions
        'uses-responsive-images': ['warn', { minScore: 0.9 }],
        'offscreen-images': ['warn', { minScore: 0.9 }],
        'unused-javascript': ['warn', { minScore: 0.9 }],
        'uses-text-compression': ['error', { minScore: 1 }],
        'render-blocking-resources': ['warn', { minScore: 0.9 }],
        'font-display': ['error', { minScore: 1 }],

        // SEO audits
        'document-title': ['error', { minScore: 1 }],
        'meta-description': ['error', { minScore: 1 }],
        'http-status-code': ['error', { minScore: 1 }],
        'is-crawlable': ['error', { minScore: 1 }],
        'hreflang': ['warn', { minScore: 1 }],

        // Accessibility audits
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'heading-order': ['warn', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### GitHub Actions Workflow

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          PAYLOAD_CMS_URL: ${{ secrets.PAYLOAD_CMS_URL }}

      - name: Run Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-reports
          path: .lighthouseci/
          retention-days: 30
```

### Blocking Deploys on Regression

```js
// scripts/check-lighthouse-gate.js
// Use execFileSync instead of exec to avoid shell injection
const { execFileSync } = require('child_process');

const MINIMUM_SCORES = {
  performance: 90,
  accessibility: 95,
  seo: 95,
};

function main() {
  const output = execFileSync('npx', ['lhci', 'autorun', '--output=json'], {
    encoding: 'utf-8',
  });

  const results = JSON.parse(output);
  let passed = true;

  for (const [category, minScore] of Object.entries(MINIMUM_SCORES)) {
    const score = Math.round(results.categories[category].score * 100);
    if (score < minScore) {
      console.error(
        `FAIL: ${category} score ${score} is below minimum ${minScore}`
      );
      passed = false;
    } else {
      console.log(`PASS: ${category} score ${score} >= ${minScore}`);
    }
  }

  if (!passed) {
    console.error('\nDeploy blocked due to Lighthouse score regression.');
    process.exit(1);
  }

  console.log('\nAll Lighthouse checks passed. Deploy can proceed.');
}

main();
```

---

## 11. Real User Monitoring (RUM)

Field data from real users is what Google uses for ranking. Lab data (Lighthouse) is only for debugging. You need RUM to understand your actual CWV performance.

### web-vitals Library Setup

```ts
// lib/web-vitals.ts
import {
  onLCP,
  onINP,
  onCLS,
  onFCP,
  onTTFB,
  type Metric,
} from 'web-vitals';

interface VitalsPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  city?: string;
  service?: string;
  template?: string;
}

function getPageDimensions(): {
  city?: string;
  service?: string;
  template?: string;
} {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (segments.length >= 2) {
    return {
      city: segments[0],
      service: segments[1],
      template: 'service-page',
    };
  }
  if (segments.length === 1) {
    return {
      city: segments[0],
      template: 'city-page',
    };
  }
  return { template: 'home' };
}

function sendToAnalytics(metric: Metric) {
  const dimensions = getPageDimensions();
  const payload: VitalsPayload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    ...dimensions,
  };

  // Use sendBeacon for reliable delivery (survives page unload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', JSON.stringify(payload));
  } else {
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }
}

export function initWebVitals() {
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### PostHog RUM Integration

```ts
// lib/posthog-vitals.ts
import posthog from 'posthog-js';
import {
  onLCP,
  onINP,
  onCLS,
  onFCP,
  onTTFB,
  type Metric,
} from 'web-vitals';

export function initPostHog() {
  if (typeof window === 'undefined') return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false, // We send manually for SPAs
    capture_pageleave: true,
    autocapture: false, // Disable to reduce JS overhead
    disable_session_recording: true,
    persistence: 'localStorage',
    loaded: () => {
      captureWebVitals();
    },
  });
}

function captureWebVitals() {
  function sendMetric(metric: Metric) {
    posthog.capture('web_vital', {
      vital_name: metric.name,
      vital_value: metric.value,
      vital_rating: metric.rating,
      vital_delta: metric.delta,
      vital_id: metric.id,
      vital_navigation_type: metric.navigationType,

      // Page context for programmatic SEO analysis
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_template: getTemplateType(),

      // Device context (important for CWV analysis)
      device_memory: (navigator as any).deviceMemory,
      hardware_concurrency: navigator.hardwareConcurrency,
      connection_type: (navigator as any).connection?.effectiveType,
      connection_downlink: (navigator as any).connection?.downlink,
    });
  }

  onLCP(sendMetric);
  onINP(sendMetric);
  onCLS(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}

function getTemplateType(): string {
  const path = window.location.pathname;
  if (path === '/') return 'home';
  if (/^\/[^/]+\/[^/]+$/.test(path)) return 'service-page';
  if (/^\/[^/]+$/.test(path)) return 'city-page';
  if (path.startsWith('/blog/')) return 'blog-post';
  return 'other';
}
```

```tsx
// app/providers.tsx (Next.js)
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { initPostHog } from '@/lib/posthog-vitals';

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_path: pathname,
    });
  }, [pathname]);

  return <>{children}</>;
}
```

```astro
---
// src/components/WebVitals.astro (Astro)
// Load web-vitals only after the page is interactive
---
<script>
  if (typeof window !== 'undefined') {
    requestIdleCallback(async () => {
      const { onLCP, onINP, onCLS, onFCP, onTTFB } =
        await import('web-vitals');

      function send(metric) {
        // Send to PostHog via their lightweight snippet
        if (window.posthog) {
          window.posthog.capture('web_vital', {
            vital_name: metric.name,
            vital_value: metric.value,
            vital_rating: metric.rating,
            page_path: window.location.pathname,
          });
        }

        // Also send to Vercel Analytics (free with Vercel deployment)
        if (window.va) {
          window.va('event', {
            name: metric.name,
            value: metric.value,
          });
        }
      }

      onLCP(send);
      onINP(send);
      onCLS(send);
      onFCP(send);
      onTTFB(send);
    });
  }
</script>
```

### Field vs Lab Data Comparison

| Aspect | Lab Data (Lighthouse) | Field Data (CrUX/RUM) |
|--------|----------------------|----------------------|
| **Source** | Simulated in controlled environment | Real users in real conditions |
| **Used by Google for ranking** | No | Yes (CrUX 75th percentile) |
| **Network conditions** | Fixed throttling | Varies by user (2G to fiber) |
| **Device** | Simulated Moto G4 (mobile) | Real devices (varies widely) |
| **Metrics available** | LCP, TBT (proxy for INP), CLS | LCP, INP, CLS, FCP, TTFB |
| **Sample size** | 1-3 runs | Thousands of page loads |
| **Best for** | Debugging, CI gating | Understanding real user experience |
| **Update frequency** | Immediate | 28-day rolling window |

### PostHog Dashboard Queries for CWV Monitoring

```sql
-- P75 LCP by template type (last 28 days)
SELECT
  properties.page_template as template,
  quantile(0.75)(toFloat64(properties.vital_value)) as p75_lcp,
  count() as page_loads
FROM events
WHERE event = 'web_vital'
  AND properties.vital_name = 'LCP'
  AND timestamp > now() - INTERVAL 28 DAY
GROUP BY template
ORDER BY p75_lcp DESC

-- Pages with Poor INP
SELECT
  properties.page_path as page,
  quantile(0.75)(toFloat64(properties.vital_value)) as p75_inp,
  countIf(properties.vital_rating = 'poor') as poor_count,
  count() as total_count,
  round(poor_count / total_count * 100, 1) as poor_percent
FROM events
WHERE event = 'web_vital'
  AND properties.vital_name = 'INP'
  AND timestamp > now() - INTERVAL 28 DAY
GROUP BY page
HAVING total_count > 100
ORDER BY p75_inp DESC
LIMIT 20

-- CWV by connection type
SELECT
  properties.connection_type as connection,
  quantile(0.75)(toFloat64(
    CASE WHEN properties.vital_name = 'LCP'
      THEN properties.vital_value END
  )) as p75_lcp,
  quantile(0.75)(toFloat64(
    CASE WHEN properties.vital_name = 'INP'
      THEN properties.vital_value END
  )) as p75_inp,
  quantile(0.75)(toFloat64(
    CASE WHEN properties.vital_name = 'CLS'
      THEN properties.vital_value END
  )) as p75_cls
FROM events
WHERE event = 'web_vital'
  AND timestamp > now() - INTERVAL 28 DAY
GROUP BY connection
```

---

## 12. Performance Budgets

Performance budgets set measurable limits on metrics that affect user experience. When a budget is exceeded, the build fails — preventing performance regressions from reaching production.

### Bundle Size Budgets

```js
// next.config.js — Webpack performance hints
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        hints: 'error',
        maxEntrypointSize: 200 * 1024, // 200KB max per entry point
        maxAssetSize: 150 * 1024,      // 150KB max per individual asset
      };
    }
    return config;
  },
};
```

### bundlesize Configuration

```json
{
  "bundlesize": [
    {
      "path": ".next/static/chunks/main-*.js",
      "maxSize": "80 kB",
      "compression": "gzip"
    },
    {
      "path": ".next/static/chunks/framework-*.js",
      "maxSize": "50 kB",
      "compression": "gzip"
    },
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "maxSize": "30 kB",
      "compression": "gzip"
    },
    {
      "path": ".next/static/css/**/*.css",
      "maxSize": "15 kB",
      "compression": "gzip"
    },
    {
      "path": "dist/**/*.js",
      "maxSize": "10 kB",
      "compression": "gzip"
    }
  ]
}
```

### Image Size Budgets

```ts
// scripts/check-image-budgets.ts
import { glob } from 'glob';
import { statSync } from 'fs';

interface ImageBudget {
  pattern: string;
  maxSizeKB: number;
  description: string;
}

const IMAGE_BUDGETS: ImageBudget[] = [
  {
    pattern: 'public/images/heroes/**/*.{jpg,jpeg,png,webp,avif}',
    maxSizeKB: 200,
    description: 'Hero images (above the fold)',
  },
  {
    pattern: 'public/images/thumbnails/**/*.{jpg,jpeg,png,webp,avif}',
    maxSizeKB: 50,
    description: 'Thumbnail images',
  },
  {
    pattern: 'public/images/icons/**/*.{svg,png}',
    maxSizeKB: 10,
    description: 'Icons',
  },
  {
    pattern: 'public/images/**/*.{jpg,jpeg,png,webp,avif}',
    maxSizeKB: 300,
    description: 'General images',
  },
];

async function checkImageBudgets() {
  let hasViolation = false;

  for (const budget of IMAGE_BUDGETS) {
    const files = await glob(budget.pattern);

    for (const file of files) {
      const stats = statSync(file);
      const sizeKB = stats.size / 1024;

      if (sizeKB > budget.maxSizeKB) {
        console.error(
          `OVER BUDGET: ${file} is ${Math.round(sizeKB)}KB ` +
            `(max: ${budget.maxSizeKB}KB for ${budget.description})`
        );
        hasViolation = true;
      }
    }
  }

  if (hasViolation) {
    console.error(
      '\nImage budget violations found. Optimize images before deploying.'
    );
    console.error('Tips:');
    console.error('  - Use AVIF format (40-50% smaller than WebP)');
    console.error('  - Resize to actual display dimensions');
    console.error('  - Use quality 70-80 for photographic images');
    console.error('  - Use SVG for icons and logos');
    process.exit(1);
  }

  console.log('All images within budget.');
}

checkImageBudgets();
```

### Total Page Weight Budget

```ts
// scripts/check-page-weight.ts
import puppeteer from 'puppeteer';

interface PageWeightBudget {
  url: string;
  maxTotalKB: number;
  maxJSKB: number;
  maxCSSKB: number;
  maxImageKB: number;
  maxFontKB: number;
  maxThirdPartyKB: number;
}

const BUDGETS: PageWeightBudget[] = [
  {
    url: 'http://localhost:3000/austin/plumbing',
    maxTotalKB: 800,
    maxJSKB: 150,
    maxCSSKB: 50,
    maxImageKB: 500,
    maxFontKB: 100,
    maxThirdPartyKB: 100,
  },
];

async function checkPageWeight() {
  const browser = await puppeteer.launch();
  let hasViolation = false;

  for (const budget of BUDGETS) {
    const page = await browser.newPage();
    const resources: {
      type: string;
      size: number;
      url: string;
    }[] = [];

    page.on('response', async (response) => {
      try {
        const buffer = await response.buffer();
        resources.push({
          type: response.request().resourceType(),
          size: buffer.length,
          url: response.url(),
        });
      } catch {
        // Ignore failed resources
      }
    });

    await page.goto(budget.url, { waitUntil: 'networkidle0' });

    const byType = (type: string) =>
      resources
        .filter((r) => r.type === type)
        .reduce((sum, r) => sum + r.size, 0) / 1024;

    const isThirdParty = (url: string) =>
      !url.includes('localhost') && !url.includes('yourdomain.com');

    const thirdPartyKB =
      resources
        .filter((r) => isThirdParty(r.url))
        .reduce((sum, r) => sum + r.size, 0) / 1024;

    const totalKB =
      resources.reduce((sum, r) => sum + r.size, 0) / 1024;
    const jsKB = byType('script');
    const cssKB = byType('stylesheet');
    const imageKB = byType('image');
    const fontKB = byType('font');

    console.log(`\n--- ${budget.url} ---`);
    console.log(
      `Total: ${Math.round(totalKB)}KB (max: ${budget.maxTotalKB}KB)`
    );
    console.log(
      `JS: ${Math.round(jsKB)}KB (max: ${budget.maxJSKB}KB)`
    );
    console.log(
      `CSS: ${Math.round(cssKB)}KB (max: ${budget.maxCSSKB}KB)`
    );
    console.log(
      `Images: ${Math.round(imageKB)}KB (max: ${budget.maxImageKB}KB)`
    );
    console.log(
      `Fonts: ${Math.round(fontKB)}KB (max: ${budget.maxFontKB}KB)`
    );
    console.log(
      `3rd Party: ${Math.round(thirdPartyKB)}KB (max: ${budget.maxThirdPartyKB}KB)`
    );

    const checks = [
      { name: 'Total', actual: totalKB, max: budget.maxTotalKB },
      { name: 'JS', actual: jsKB, max: budget.maxJSKB },
      { name: 'CSS', actual: cssKB, max: budget.maxCSSKB },
      { name: 'Images', actual: imageKB, max: budget.maxImageKB },
      { name: 'Fonts', actual: fontKB, max: budget.maxFontKB },
      {
        name: '3rd Party',
        actual: thirdPartyKB,
        max: budget.maxThirdPartyKB,
      },
    ];

    for (const check of checks) {
      if (check.actual > check.max) {
        console.error(
          `  OVER BUDGET: ${check.name} ` +
            `(${Math.round(check.actual)}KB > ${check.max}KB)`
        );
        hasViolation = true;
      }
    }

    await page.close();
  }

  await browser.close();

  if (hasViolation) {
    process.exit(1);
  }
}

checkPageWeight();
```

### Recommended Budgets for SAB Programmatic Pages

| Resource Type | Budget (gzipped) | Rationale |
|--------------|-----------------|-----------|
| **Total page weight** | < 800 KB | Loads in ~3s on 4G |
| **JavaScript** | < 150 KB | Keeps TBT/INP low |
| **CSS** | < 50 KB | Tailwind with purge should be ~10-15KB |
| **Images (above fold)** | < 200 KB | LCP target of 2.5s |
| **Images (total)** | < 500 KB | Lazy-loaded below fold |
| **Fonts** | < 100 KB | 1-2 variable fonts max |
| **Third-party scripts** | < 100 KB | Analytics + essential only |
| **HTML document** | < 50 KB | Compressed server response |

---

## 13. Font Loading Strategy

Fonts are one of the most common causes of both CLS (layout shift from font swap) and LCP delay (blocking render while fonts download). A proper font loading strategy is critical for CWV.

### font-display Values Explained

| Value | Behavior | CLS Impact | Use Case |
|-------|----------|-----------|----------|
| `swap` | Shows fallback immediately, swaps when font loads | **Causes CLS** | Acceptable for headings |
| `optional` | Shows fallback, uses custom font **only if already cached** | **Zero CLS** | Best for body text |
| `fallback` | Short block period (100ms), then fallback, swap window ~3s | **Minimal CLS** | Good compromise |
| `block` | Invisible text for up to 3s, then fallback | **No CLS but causes FOIT** | Icon fonts only |
| `auto` | Browser default (usually `block`) | **Unpredictable** | Never use |

### Recommended Strategy for SAB Sites

```css
/* Font strategy: Use 'optional' for body, 'swap' for headings */

/* Body font: optional prevents ANY layout shift */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var-latin.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: optional;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Heading font: swap is OK — headings cause less CLS than body text */
@font-face {
  font-family: 'Playfair';
  src: url('/fonts/playfair-display-var.woff2') format('woff2');
  font-weight: 400 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF;
}
```

### Preloading Critical Fonts

```html
<head>
  <!--
    Preload fonts that are used above the fold.
    Only preload 1-2 fonts — each preload competes with other critical
    resources. Use crossorigin even for same-origin fonts (required by spec).
  -->
  <link
    rel="preload"
    href="/fonts/inter-var-latin.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</head>
```

### Variable Fonts

Variable fonts contain all weights/styles in a single file, reducing the number of font requests from 4-8 down to 1-2.

```css
/* Before: 4 separate font files = 4 HTTP requests, ~120KB total */
/* @font-face { font-weight: 400; src: url(inter-regular.woff2); } */
/* @font-face { font-weight: 500; src: url(inter-medium.woff2); } */
/* @font-face { font-weight: 600; src: url(inter-semibold.woff2); } */
/* @font-face { font-weight: 700; src: url(inter-bold.woff2); } */

/* After: 1 variable font file = 1 HTTP request, ~90KB total */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var-latin.woff2') format('woff2');
  font-weight: 100 900; /* Full weight range in one file */
  font-style: normal;
  font-display: optional;
}
```

### System Font Stack as Fallback

```css
/* System font stack — matches Inter metrics closely */
:root {
  --font-fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  --font-body: 'Inter', var(--font-fallback);
  --font-heading: 'Playfair', Georgia, 'Times New Roman', serif;
}

/* Adjust fallback font metrics to match custom font */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 107%;       /* Adjust to match Inter's character width */
  ascent-override: 90%;    /* Match Inter's ascent */
  descent-override: 22%;   /* Match Inter's descent */
  line-gap-override: 0%;   /* Match Inter's line gap */
}

body {
  font-family: 'Inter', 'Inter-fallback', var(--font-fallback);
}
```

### Font Subsetting for Programmatic Pages

For SAB sites that only need English characters, subset fonts to reduce file size:

```bash
# Install pyftsubset (part of fonttools)
pip install fonttools brotli

# Subset to Latin characters only — reduces file size by ~60%
pyftsubset InterVariable.ttf \
  --output-file=inter-var-latin.woff2 \
  --flavor=woff2 \
  --layout-features="kern,liga,calt,ccmp,curs,mark,mkmk,rlig" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,\
U+02DA,U+02DC,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,\
U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,\
U+2212,U+2215,U+FEFF,U+FFFD"

# Result: ~45KB instead of ~120KB
```

---

## 14. Third-Party Script Management

Third-party scripts (analytics, chat widgets, ad pixels, review platforms) are the single largest threat to CWV on agency sites. They run on the main thread, compete for bandwidth, and are outside your control.

### Impact Assessment

```ts
// scripts/audit-third-party.ts
import puppeteer from 'puppeteer';

async function auditThirdParty(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const resources: Array<{
    url: string;
    domain: string;
    size: number;
    duration: number;
    type: string;
    isThirdParty: boolean;
  }> = [];

  const ownDomain = new URL(url).hostname;

  page.on('response', async (response) => {
    try {
      const reqUrl = new URL(response.url());
      const buffer = await response.buffer();
      const timing = response.timing();

      resources.push({
        url: response.url(),
        domain: reqUrl.hostname,
        size: buffer.length,
        duration: timing
          ? timing.receiveHeadersEnd - timing.sendStart
          : 0,
        type: response.request().resourceType(),
        isThirdParty: reqUrl.hostname !== ownDomain,
      });
    } catch {
      // Ignore
    }
  });

  await page.goto(url, { waitUntil: 'networkidle0' });

  const thirdParty = resources.filter((r) => r.isThirdParty);
  const byDomain = new Map<
    string,
    { count: number; totalSize: number }
  >();

  for (const r of thirdParty) {
    const existing = byDomain.get(r.domain) || {
      count: 0,
      totalSize: 0,
    };
    existing.count++;
    existing.totalSize += r.size;
    byDomain.set(r.domain, existing);
  }

  console.log('\n=== Third-Party Script Report ===\n');
  console.log(`Total 3P requests: ${thirdParty.length}`);
  console.log(
    `Total 3P size: ${Math.round(
      thirdParty.reduce((s, r) => s + r.size, 0) / 1024
    )}KB\n`
  );

  console.log('By domain:');
  const sorted = [...byDomain.entries()].sort(
    (a, b) => b[1].totalSize - a[1].totalSize
  );
  for (const [domain, stats] of sorted) {
    console.log(
      `  ${domain}: ${stats.count} requests, ` +
        `${Math.round(stats.totalSize / 1024)}KB`
    );
  }

  await browser.close();
}

auditThirdParty('https://yourdomain.com/austin/plumbing');
```

### defer vs async Loading

```html
<!--
  Script loading strategies:

  <script src="...">
    Blocks HTML parsing. NEVER use for third-party.

  <script async src="...">
    Downloads in parallel, executes as soon as ready.
    Use for: independent scripts (analytics).

  <script defer src="...">
    Downloads in parallel, executes after HTML parsing.
    Use for: scripts that need the DOM.

  <script type="module" src="...">
    Deferred by default + strict mode.
    Use for: modern application code.
-->

<!-- GTM: async (doesn't need DOM, should fire ASAP for data) -->
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX">
</script>

<!-- Review widget: defer (needs DOM to render reviews) -->
<script defer src="https://widgets.reviews.io/widget.js"></script>

<!-- Chat widget: load on user interaction -->
<script>
  let chatLoaded = false;
  function loadChat() {
    if (chatLoaded) return;
    chatLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://chat-widget.example.com/widget.js';
    document.head.appendChild(script);
  }
  // Trigger on scroll (user is engaged) or after 10 seconds
  window.addEventListener('scroll', loadChat, {
    once: true,
    passive: true,
  });
  setTimeout(loadChat, 10000);
</script>
```

### Partytown for Offloading to Web Workers

Partytown runs third-party scripts in a web worker, keeping the main thread free for user interactions. This dramatically improves INP.

```bash
npm install @builder.io/partytown
```

**Astro integration**:

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';

export default defineConfig({
  integrations: [
    partytown({
      config: {
        forward: ['dataLayer.push', 'fbq'],
        debug: import.meta.env.DEV,
      },
    }),
  ],
});
```

```astro
---
// src/layouts/Layout.astro
---
<html>
<head>
  <!-- Google Tag Manager runs in web worker instead of main thread -->
  <script
    type="text/partytown"
    src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  ></script>
  <script type="text/partytown">
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
<body>
  <slot />
</body>
</html>
```

**Next.js integration**:

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        {/*
          WARNING: strategy="worker" does NOT work with the App Router.
          For App Router, either use strategy="afterInteractive" (simpler) or
          manually integrate @builder.io/partytown with type="text/partytown"
          scripts in your root layout. See: https://partytown.builder.io/nextjs
        */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        />
        <Script id="gtm-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  );
}
```

### Measuring Third-Party Impact

```tsx
// components/ThirdPartyAudit.tsx (development-only component)
'use client';

import { useEffect } from 'react';

export function ThirdPartyAudit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Use PerformanceObserver to track long tasks from 3P scripts
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(
            `Long task detected: ${entry.duration.toFixed(0)}ms`,
            (entry as any).attribution?.[0]?.containerSrc ||
              'unknown source'
          );
        }
      }
    });

    observer.observe({ type: 'longtask', buffered: true });

    // Track third-party resource loading
    const resObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const url = new URL(entry.name);
        if (!url.hostname.includes('yourdomain.com')) {
          const resEntry = entry as PerformanceResourceTiming;
          console.log(
            `3P Resource: ${url.hostname}` +
              `${url.pathname.substring(0, 30)} ` +
              `- ${entry.duration.toFixed(0)}ms, ` +
              `${(resEntry.transferSize / 1024).toFixed(1)}KB`
          );
        }
      }
    });

    resObserver.observe({ type: 'resource', buffered: true });

    return () => {
      observer.disconnect();
      resObserver.disconnect();
    };
  }, []);

  return null;
}
```

### Third-Party Script Checklist for SAB Sites

| Script | Priority | Loading Strategy | Partytown? |
|--------|----------|-----------------|------------|
| Google Tag Manager | High | `async` | Yes |
| Google Analytics 4 | High | Via GTM or `async` | Yes |
| Google Maps Embed | Medium | `defer` or lazy load | No (needs DOM) |
| Facebook Pixel | Low | `type="text/partytown"` | Yes |
| LiveChat widget | Low | Load on scroll/idle | No (needs main thread) |
| Review widget | Medium | `defer` | Possible |
| Call tracking (CallRail) | High | `async` | Yes |
| Schema.org JSON-LD | Critical | Inline (no external script) | N/A |

---

## 15. Accessibility as a Ranking Factor

### The SEO-Accessibility Overlap

While Google has not explicitly confirmed accessibility as a direct ranking factor, there is substantial overlap between accessibility best practices and SEO signals:

1. **Semantic HTML** — What screen readers need is exactly what Googlebot needs to understand page structure.
2. **Image alt text** — Critical for both image SEO and screen readers.
3. **Heading hierarchy** — Proper `<h1>`-`<h6>` structure helps both SEO and navigation.
4. **Link text quality** — Descriptive link text helps both rankings and assistive technology.
5. **Mobile usability** — Tap targets, font sizing, and viewport configuration benefit both.
6. **Page speed** — Accessibility guidelines recommend fast-loading pages.

Additionally, the DOJ has affirmed that the ADA applies to websites, making WCAG 2.2 compliance a **legal requirement** for businesses in many jurisdictions — including the service-area businesses this stack serves.

### WCAG 2.2 Compliance Checklist for SAB Sites

```astro
---
// src/components/ServiceCard.astro
// Demonstrates multiple WCAG 2.2 requirements
interface Props {
  service: {
    name: string;
    slug: string;
    description: string;
    image: string;
  };
  city: string;
}

const { service, city } = Astro.props;
---

<!-- Semantic HTML: use <article> for self-contained content -->
<article class="rounded-lg border border-gray-200 overflow-hidden
               hover:shadow-lg transition-shadow">
  <!-- Alt text: descriptive, includes city for local SEO -->
  <img
    src={service.image}
    alt={`${service.name} service in ${city}`}
    width="400"
    height="300"
    loading="lazy"
    decoding="async"
    class="w-full h-48 object-cover"
  />

  <div class="p-6">
    <!-- Proper heading hierarchy: h3 within section that has h2 -->
    <h3 class="text-xl font-bold text-gray-900">
      {service.name}
    </h3>

    <p class="mt-2 text-gray-600">{service.description}</p>

    <!-- Descriptive link text (not "click here" or "read more") -->
    <a
      href={`/${city}/${service.slug}`}
      class="mt-4 inline-flex items-center text-blue-600
             hover:text-blue-800 font-medium underline
             underline-offset-2 focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:ring-offset-2
             min-h-tap min-w-tap"
      aria-label={`Learn more about ${service.name} in ${city}`}
    >
      Learn about {service.name}
      <!-- Decorative icon hidden from screen readers -->
      <svg
        class="w-4 h-4 ml-1"
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1
             1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293
             -4.293a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </a>
  </div>
</article>
```

### Semantic HTML for SEO

```astro
---
// src/pages/[city]/[service].astro — Full semantic HTML structure
---
<html lang="en">
<head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />
</head>
<body>
  <!-- Skip navigation link — WCAG 2.4.1 -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:top-4
           focus:left-4 focus:z-50 focus:bg-white focus:px-4
           focus:py-2 focus:rounded focus:shadow-lg focus:text-blue-600"
  >
    Skip to main content
  </a>

  <!-- Landmark: banner -->
  <header role="banner">
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/areas">Service Areas</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <!-- Breadcrumb navigation — SEO + accessibility -->
  <nav aria-label="Breadcrumb">
    <ol
      class="flex items-center space-x-2 text-sm text-gray-500"
      itemscope
      itemtype="https://schema.org/BreadcrumbList"
    >
      <li
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        <a href="/" itemprop="item">
          <span itemprop="name">Home</span>
        </a>
        <meta itemprop="position" content="1" />
      </li>
      <li aria-hidden="true">/</li>
      <li
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        <a href={`/${data.city.slug}`} itemprop="item">
          <span itemprop="name">{data.city.name}</span>
        </a>
        <meta itemprop="position" content="2" />
      </li>
      <li aria-hidden="true">/</li>
      <li
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
        aria-current="page"
      >
        <span itemprop="name">{data.service.name}</span>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
  </nav>

  <!-- Landmark: main -->
  <main id="main-content" role="main">
    <!-- Only ONE h1 per page — critical for both SEO and a11y -->
    <h1>{data.h1}</h1>

    <section aria-labelledby="services-heading">
      <h2 id="services-heading">
        Our {data.service.name} Services
      </h2>
      <!-- Content -->
    </section>

    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">Customer Reviews</h2>
      <!-- Reviews -->
    </section>

    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently Asked Questions</h2>
      <dl>
        {data.faqs.map((faq) => (
          <div class="border-b border-gray-200">
            <dt>
              <button
                class="w-full text-left py-4 flex justify-between
                       items-center min-h-tap"
                aria-expanded="false"
                aria-controls={`faq-${faq.id}`}
              >
                <span class="font-medium">{faq.question}</span>
                <svg
                  class="w-5 h-5 shrink-0"
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
            </dt>
            <dd
              id={`faq-${faq.id}`}
              class="pb-4 text-gray-600"
              hidden
            >
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  </main>

  <!-- Landmark: contentinfo -->
  <footer role="contentinfo">
    <nav aria-label="Footer navigation">
      <!-- Footer links -->
    </nav>
  </footer>
</body>
</html>
```

### Color Contrast Requirements

```js
// tailwind.config.js — Ensure all text colors meet WCAG AA
module.exports = {
  theme: {
    extend: {
      colors: {
        // All text colors tested against white (#FFFFFF) background
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        text: {
          primary: '#111827',   // gray-900 — 16.15:1 ratio (AAA)
          secondary: '#4B5563', // gray-600 — 5.74:1 ratio (AA)
          muted: '#6B7280',     // gray-500 — 4.64:1 ratio (AA)
          // DO NOT use gray-400 (#9CA3AF) — 3.03:1 fails AA
        },
        brand: {
          DEFAULT: '#1D4ED8',   // blue-700 — 7.12:1 on white (AAA)
          hover: '#1E40AF',     // blue-800 — 8.72:1 on white (AAA)
          // DO NOT use blue-400 or blue-500 for text — fails AA
        },
      },
    },
  },
};
```

### Automated Accessibility Testing

```ts
// tests/accessibility.spec.ts (Playwright)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES_TO_TEST = [
  '/',
  '/austin/plumbing',
  '/dallas/electrician',
  '/houston/hvac',
  '/contact',
];

for (const pagePath of PAGES_TO_TEST) {
  test(`accessibility: ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(`Violations on ${pagePath}:`);
      results.violations.forEach((violation) => {
        console.log(
          `  [${violation.impact}] ${violation.id}: ` +
            violation.description
        );
        violation.nodes.forEach((node) => {
          console.log(
            `    Element: ${node.html.substring(0, 80)}`
          );
          console.log(`    Fix: ${node.failureSummary}`);
        });
      });
    }

    expect(results.violations).toEqual([]);
  });
}

// Test keyboard navigation
test('keyboard navigation works on service page', async ({
  page,
}) => {
  await page.goto('/austin/plumbing');

  // Tab through interactive elements
  await page.keyboard.press('Tab'); // Skip nav link
  await page.keyboard.press('Enter'); // Activate skip link
  expect(
    await page.evaluate(() => document.activeElement?.id)
  ).toBe('main-content');

  // Tab through and verify all focusable elements are visible
  let tabCount = 0;
  while (tabCount < 20) {
    await page.keyboard.press('Tab');
    tabCount++;
    const activeElement = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.trim(),
      visible:
        (document.activeElement?.getBoundingClientRect().height ??
          0) > 0,
    }));

    if (activeElement.tag !== 'BODY') {
      expect(activeElement.visible).toBe(true);
    }
  }
});

// Test ARIA labels and roles
test('all images have alt text', async ({ page }) => {
  await page.goto('/austin/plumbing');
  const images = await page.locator('img').all();

  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const role = await img.getAttribute('role');
    const ariaHidden = await img.getAttribute('aria-hidden');

    const isDecorative =
      role === 'presentation' || ariaHidden === 'true';
    if (!isDecorative) {
      expect(
        alt,
        `Image missing alt: ${await img.getAttribute('src')}`
      ).toBeTruthy();
      expect(
        alt!.length,
        `Alt text too short: ${alt}`
      ).toBeGreaterThan(3);
    }
  }
});
```

### CI/CD Accessibility Gate

```yaml
# .github/workflows/a11y.yml
name: Accessibility Tests

on:
  pull_request:
    branches: [main]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 30000

      - name: Run accessibility tests
        run: npx playwright test tests/accessibility.spec.ts

      - name: Run axe-cli on key pages
        run: |
          npx @axe-core/cli http://localhost:3000/ \
            http://localhost:3000/austin/plumbing \
            http://localhost:3000/contact \
            --exit

      - name: Upload accessibility report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-report
          path: test-results/
```

### Accessibility Quick-Reference for SAB Sites

| WCAG Criterion | Requirement | SEO Overlap |
|---------------|-------------|-------------|
| 1.1.1 Non-text Content | Alt text for all meaningful images | Image SEO, image search visibility |
| 1.3.1 Info and Relationships | Semantic HTML (`<nav>`, `<main>`, `<article>`) | Googlebot content understanding |
| 1.4.3 Contrast (Minimum) | 4.5:1 for text, 3:1 for large text | User engagement signals |
| 2.1.1 Keyboard | All functionality via keyboard | No direct SEO, but legal compliance |
| 2.4.1 Bypass Blocks | Skip navigation link | No direct SEO |
| 2.4.2 Page Titled | Descriptive `<title>` | Direct ranking factor |
| 2.4.4 Link Purpose | Descriptive link text (not "click here") | Anchor text relevance |
| 2.4.6 Headings and Labels | Proper heading hierarchy | Content structure for SEO |
| 2.4.7 Focus Visible | Visible focus indicators | No direct SEO |
| 2.5.5 Target Size (WCAG 2.2) | 44x44px minimum | Mobile usability signal |
| 3.1.1 Language of Page | `lang` attribute on `<html>` | Language detection for i18n SEO |
| 4.1.2 Name, Role, Value | ARIA labels for custom controls | No direct SEO |

---

## Appendix A: Complete Performance Audit Checklist

Use this checklist before launching any programmatic SAB site:

### Core Web Vitals
- [ ] LCP < 2.5s on representative pages (measured in lab)
- [ ] INP < 200ms on pages with interactive elements
- [ ] CLS < 0.1 on all page templates
- [ ] Hero image has `fetchpriority="high"` and `loading="eager"`
- [ ] All images have explicit `width` and `height` or `aspect-ratio`
- [ ] No render-blocking CSS or JS in `<head>`
- [ ] Critical CSS inlined, non-critical CSS deferred

### HTTPS and Security
- [ ] HSTS header with `max-age=63072000; includeSubDomains; preload`
- [ ] No mixed content (all resources loaded over HTTPS)
- [ ] CSP header configured and tested
- [ ] Site submitted to HSTS preload list

### Mobile
- [ ] Viewport meta tag: `width=device-width, initial-scale=1.0`
- [ ] No `maximum-scale` or `user-scalable=no`
- [ ] All tap targets >= 48x48px with >= 8px spacing
- [ ] Base font size >= 16px
- [ ] No horizontal scrolling on any viewport
- [ ] Content parity between mobile and desktop

### Performance Budgets
- [ ] Total page weight < 800KB (gzipped)
- [ ] JavaScript < 150KB (gzipped)
- [ ] CSS < 50KB (gzipped)
- [ ] Images < 500KB total, < 200KB above fold
- [ ] Fonts < 100KB (1-2 variable fonts, subsetted)
- [ ] Third-party scripts < 100KB

### Fonts
- [ ] Body font uses `font-display: optional`
- [ ] Critical fonts preloaded in `<head>`
- [ ] Variable fonts used (single file per family)
- [ ] Fonts subsetted to required character ranges
- [ ] Fallback font metrics adjusted (`size-adjust`, `ascent-override`)

### Third-Party Scripts
- [ ] Analytics running via Partytown (web worker)
- [ ] Chat/widget scripts loaded on interaction or idle
- [ ] All third-party scripts audited for size and main thread time
- [ ] No third-party script blocks rendering

### Accessibility
- [ ] WCAG 2.2 AA compliance verified with axe-core
- [ ] Keyboard navigation tested on all interactive elements
- [ ] Skip navigation link present and functional
- [ ] All images have descriptive alt text
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Proper heading hierarchy (single `<h1>`, sequential levels)
- [ ] All form inputs have visible labels
- [ ] Focus indicators visible on all interactive elements

### CI/CD
- [ ] Lighthouse CI configured with performance budgets
- [ ] Accessibility tests in CI pipeline
- [ ] Mixed content check in CI pipeline
- [ ] Bundle size check in CI pipeline
- [ ] Deploy blocked on Lighthouse score < 90

### Monitoring
- [ ] Web Vitals RUM collecting field data
- [ ] PostHog dashboard tracking CWV by page template
- [ ] Alerts configured for CWV regression
- [ ] Monthly CrUX report review scheduled
- [ ] Safe Browsing check automated (weekly)

---

## Appendix B: Quick Command Reference

```bash
# Check CWV in the field (CrUX)
# Visit: https://pagespeed.web.dev/analysis?url=https://yourdomain.com

# Run Lighthouse locally
npx lighthouse https://yourdomain.com --output=html --view

# Run Lighthouse CI
npx lhci autorun

# Analyze Next.js bundle
ANALYZE=true npm run build

# Check mixed content
npx tsx scripts/check-mixed-content.ts

# Check image budgets
npx tsx scripts/check-image-budgets.ts

# Run accessibility tests
npx playwright test tests/accessibility.spec.ts

# Audit third-party scripts
npx tsx scripts/audit-third-party.ts

# Subset fonts
pyftsubset Font.ttf --output-file=font-latin.woff2 --flavor=woff2 \
  --unicodes="U+0000-00FF"
```
