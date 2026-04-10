# Conversion Rate Optimization (CRO) — Agency Web Stack

> Part of the [Programmatic SEO Blueprint](./PROGRAMMATIC_SEO_BLUEPRINT.md). This document covers high-converting page anatomy, CTA placement strategy, click-to-call implementation, lead forms, trust signals, urgency triggers, mobile optimization, A/B testing with PostHog, conversion tracking, and lead attribution for service-area business websites.

## Technical Blueprint — Payload CMS + Astro + Next.js + PostHog

---

## 1. Anatomy of a High-Converting Service+Location Page

A service+location page (e.g., `/plumbing/drain-cleaning/austin-tx`) must accomplish five things within the first 3 seconds of page load: identify the service, confirm the location, establish trust, present a clear CTA, and load fast enough that the visitor never bounces.

### Page Structure (Top to Bottom)

```
┌─────────────────────────────────────────────────┐
│  STICKY HEADER: Phone number + "Schedule Now"   │
├─────────────────────────────────────────────────┤
│  HERO SECTION                                   │
│  H1: "{Service} in {City}, {State}"             │
│  Subhead: Pain-point statement                  │
│  Primary CTA button + Phone number              │
│  Trust bar: Rating stars, review count,          │
│    license #, years in business                 │
├─────────────────────────────────────────────────┤
│  SOCIAL PROOF BAR                               │
│  3 review snippets with stars + source logos    │
├─────────────────────────────────────────────────┤
│  SERVICE DETAILS (2-3 paragraphs)               │
│  What the service includes, common problems     │
│  solved, equipment/methods used                 │
│  INLINE CTA: "Get a Free Estimate"             │
├─────────────────────────────────────────────────┤
│  PRICING / WHAT TO EXPECT                       │
│  Price ranges, factors affecting cost           │
│  "No hidden fees" guarantee callout             │
├─────────────────────────────────────────────────┤
│  WHY CHOOSE US (3-4 differentiators)            │
│  Icon + short text cards                        │
│  INLINE CTA: "Call Now" or "Book Online"        │
├─────────────────────────────────────────────────┤
│  PROCESS STEPS (1-2-3 how it works)             │
│  Step 1: Call/Book → Step 2: We Arrive →        │
│  Step 3: Problem Solved                         │
├─────────────────────────────────────────────────┤
│  FULL TESTIMONIAL BLOCK                         │
│  2-3 full reviews, ideally location-specific    │
├─────────────────────────────────────────────────┤
│  FAQ SECTION (Schema-marked)                    │
│  5-8 questions about this service in this area  │
│  INLINE CTA after FAQ                           │
├─────────────────────────────────────────────────┤
│  SERVICE AREA MAP + NEARBY AREAS                │
│  Embedded map, links to adjacent city pages     │
├─────────────────────────────────────────────────┤
│  FINAL CTA BLOCK                                │
│  Large CTA with urgency: "Same-Day Service      │
│  Available — Call Now"                          │
├─────────────────────────────────────────────────┤
│  FOOTER                                         │
│  NAP info, license, insurance, service areas    │
└─────────────────────────────────────────────────┘
│  MOBILE: STICKY BOTTOM BAR                      │
│  [📞 Call Now]  [📋 Free Quote]                 │
└─────────────────────────────────────────────────┘
```

### Critical Conversion Elements

| Element | Purpose | Impact on Conversion |
|---|---|---|
| H1 with service + city | Relevance confirmation | Reduces bounce 15-25% |
| Phone number above fold | Immediate action path | 30-50% of mobile leads |
| Star rating + count | Instant trust | +12-15% conversion lift |
| Guarantee badge | Risk reversal | +8-12% conversion lift |
| Sticky CTA (mobile) | Persistent action path | +20-30% mobile conversion |
| FAQ with schema | Answers objections | +5-10% conversion, SEO benefit |
| Process steps | Reduces uncertainty | +5-8% conversion lift |

### Performance Requirements

- Largest Contentful Paint (LCP): under 2.5 seconds
- First Input Delay (FID): under 100ms
- Cumulative Layout Shift (CLS): under 0.1
- Time to Interactive: under 3.5 seconds
- Phone number must be tappable within 1 second of page load

---

## 2. CTA Placement Strategy

### The Five CTA Positions

Every service+location page needs CTAs at these positions, each with a specific role:

**Position 1 — Hero (Above Fold)**
- Primary conversion point. This is the highest-intent CTA.
- Must be visible without scrolling on all devices.
- Two CTAs: one button ("Get Free Estimate"), one phone link ("Call (512) 555-0123").
- Button color must contrast with page background — use the brand's accent color.
- Never place more than two CTAs here; decision paralysis kills conversion.

**Position 2 — After Service Description (Mid-Content)**
- The visitor has now read what you do. Reinforce with a contextual CTA.
- Use different copy than the hero: "Ready to fix your {problem}? We're here to help."
- This catches visitors who scrolled past the hero without acting.
- Can be a full-width banner or an inline text link styled as a button.

**Position 3 — After Social Proof / Testimonials**
- Trust has been established. This is the second-highest converting position.
- Copy should reference trust: "Join 500+ happy homeowners in {City}."
- Include the phone number again.

**Position 4 — After FAQ**
- Objections have been answered. The visitor is now most informed.
- Direct, action-oriented copy: "Get Your Free Estimate Today."
- This is the bottom-of-page catch-all for visitors who read everything.

**Position 5 — Sticky CTA (Mobile Only)**
- Fixed bottom bar with two buttons: Call and Form.
- Must not obscure content — use a compact 56-64px height bar.
- Only appears after the user scrolls past the hero CTA (avoid doubling up).
- On desktop: use a sticky header with phone number and CTA button instead.

### CTA Copy Rules for Service Businesses

- Always lead with the benefit: "Get" or "Schedule" (not "Submit" or "Click Here")
- Include "Free" when offering free estimates (it removes friction)
- Add urgency when appropriate: "Same-Day Service Available"
- Phone number CTAs: always display the full number, never "Call Us"
- Format: "(512) 555-0123" — parentheses and hyphens aid scannability

### CTA Button Design Specifications

```
Primary CTA Button:
  - Background: Brand accent color (high contrast ratio, minimum 4.5:1)
  - Text: White or dark, 16-18px, font-weight 600-700
  - Padding: 16px 32px (desktop), 14px 24px (mobile)
  - Border-radius: 6-8px (avoid full-round pills for trust)
  - Min touch target: 48x48px (mobile)
  - Hover: Darken 10%, subtle shadow
  - Active: Scale 0.98, darken 15%

Secondary CTA (Phone):
  - Style: Outlined or ghost button
  - Phone icon left-aligned
  - Full number displayed
  - On mobile: triggers tel: link
  - On desktop: optionally copies number or opens dialer
```

---

## 3. Phone Number Click-to-Call Implementation

### Core Implementation

Phone calls are the primary conversion for local service businesses. Every phone number on every page must be a functioning `tel:` link with tracking.

```tsx
// components/ClickToCall.tsx
'use client';

import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

interface ClickToCallProps {
  phoneNumber: string;          // Raw: "5125550123"
  displayNumber: string;        // Formatted: "(512) 555-0123"
  location?: string;            // "austin-tx"
  service?: string;             // "drain-cleaning"
  placement: 'hero' | 'header' | 'sticky' | 'inline' | 'footer';
  variant?: 'button' | 'link' | 'icon-only';
  className?: string;
}

export function ClickToCall({
  phoneNumber,
  displayNumber,
  location,
  service,
  placement,
  variant = 'link',
  className = '',
}: ClickToCallProps) {
  const posthog = usePostHog();

  const handleClick = useCallback(() => {
    posthog?.capture('phone_click', {
      phone_number: phoneNumber,
      placement,
      location_slug: location,
      service_slug: service,
      page_url: window.location.pathname,
      device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
    });

    // Also fire a Google Ads conversion if gtag is present
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-XXXXXXXXX/XXXXXXXXXXXXX',
        event_callback: () => {},
      });
    }
  }, [posthog, phoneNumber, placement, location, service]);

  const telHref = `tel:+1${phoneNumber}`;

  if (variant === 'button') {
    return (
      <a
        href={telHref}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-6 py-3 bg-brand-accent
                     text-white font-semibold rounded-lg hover:bg-brand-accent-dark
                     transition-colors min-h-[48px] ${className}`}
        aria-label={`Call us at ${displayNumber}`}
      >
        <PhoneIcon className="w-5 h-5" />
        <span>{displayNumber}</span>
      </a>
    );
  }

  if (variant === 'icon-only') {
    return (
      <a
        href={telHref}
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-12 h-12
                     bg-brand-accent text-white rounded-full hover:bg-brand-accent-dark
                     transition-colors ${className}`}
        aria-label={`Call us at ${displayNumber}`}
      >
        <PhoneIcon className="w-6 h-6" />
      </a>
    );
  }

  return (
    <a
      href={telHref}
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-brand-accent
                   font-semibold hover:underline ${className}`}
      aria-label={`Call us at ${displayNumber}`}
    >
      <PhoneIcon className="w-4 h-4" />
      <span>{displayNumber}</span>
    </a>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24"
         strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0
               002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423
               -1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376
               -.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162
               -.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417
               -1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25
               2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}
```

### Dynamic Number Insertion (DNI) for Paid Traffic

When running Google Ads or other paid campaigns, use dynamic number insertion to attribute phone calls to specific campaigns:

```tsx
// lib/dynamic-number.ts

interface DNIConfig {
  defaultNumber: string;
  displayDefault: string;
  campaignNumbers: Record<string, { raw: string; display: string }>;
}

export function getDynamicNumber(config: DNIConfig): { raw: string; display: string } {
  if (typeof window === 'undefined') {
    return { raw: config.defaultNumber, display: config.displayDefault };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const gclid = params.get('gclid');

  // Google Ads traffic
  if (gclid || (utmSource === 'google' && utmMedium === 'cpc')) {
    const googleNumber = config.campaignNumbers['google_ads'];
    if (googleNumber) return googleNumber;
  }

  // Other campaign sources
  if (utmSource && config.campaignNumbers[utmSource]) {
    return config.campaignNumbers[utmSource];
  }

  return { raw: config.defaultNumber, display: config.displayDefault };
}
```

### Call Tracking Data Model in Payload CMS

```ts
// payload/collections/PhoneNumbers.ts
import type { CollectionConfig } from 'payload';

export const PhoneNumbers: CollectionConfig = {
  slug: 'phone-numbers',
  admin: {
    useAsTitle: 'label',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'e.g., "Main Line", "Google Ads Tracking"' },
    },
    {
      name: 'rawNumber',
      type: 'text',
      required: true,
      admin: { description: 'Digits only: 5125550123' },
      validate: (val: string) => {
        if (!/^\d{10}$/.test(val)) return 'Must be exactly 10 digits';
        return true;
      },
    },
    {
      name: 'displayNumber',
      type: 'text',
      required: true,
      admin: { description: 'Formatted: (512) 555-0123' },
    },
    {
      name: 'trackingSource',
      type: 'select',
      options: [
        { label: 'Default / Organic', value: 'organic' },
        { label: 'Google Ads', value: 'google_ads' },
        { label: 'Facebook Ads', value: 'facebook_ads' },
        { label: 'Bing Ads', value: 'bing_ads' },
        { label: 'Direct Mail', value: 'direct_mail' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
```

---

## 4. Form Design Best Practices

### Core Principle: Minimum Viable Fields

Every additional form field reduces completion rate by 5-10%. For service businesses, the minimum viable form is:

| Field | Required | Rationale |
|---|---|---|
| Name | Yes | Personalization in follow-up |
| Phone | Yes | Primary contact method for service businesses |
| Email | No (optional) | Secondary contact, useful for follow-up sequences |
| Service Needed | Yes (dropdown) | Pre-qualifies the lead, routes to correct team |
| Zip Code or City | Conditional | Only if the page is not already location-specific |
| Brief Description | No (textarea) | Helps dispatcher but should never be required |

That is **3 required fields**. No address. No last name. No "how did you hear about us." Collect those later.

### Lead Capture Form Component

```tsx
// components/LeadForm.tsx
'use client';

import { useState, useCallback, useRef, type FormEvent, type RefObject } from 'react';
import { usePostHog } from 'posthog-js/react';

interface LeadFormProps {
  services: Array<{ label: string; value: string }>;
  locationSlug?: string;
  serviceSlug?: string;
  placement: 'hero' | 'inline' | 'modal' | 'sidebar' | 'bottom';
  heading?: string;
  submitEndpoint?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  service?: string;
}

export function LeadForm({
  services,
  locationSlug,
  serviceSlug,
  placement,
  heading = 'Get Your Free Estimate',
  submitEndpoint = '/api/leads',
}: LeadFormProps) {
  const posthog = usePostHog();
  const formRef = useRef<HTMLFormElement>(null);
  const hasStartedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  // Track form interactions
  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      posthog?.capture('form_field_focus', {
        field: fieldName,
        form_placement: placement,
        location_slug: locationSlug,
        service_slug: serviceSlug,
      });
    },
    [posthog, placement, locationSlug, serviceSlug],
  );

  const trackFormStart = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    posthog?.capture('form_start', {
      form_placement: placement,
      location_slug: locationSlug,
      service_slug: serviceSlug,
      page_url: window.location.pathname,
    });
  }, [posthog, placement, locationSlug, serviceSlug]);

  // Inline validation
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Please enter your full name';
        return undefined;
      case 'phone':
        const digits = value.replace(/\D/g, '');
        if (!digits) return 'Phone number is required';
        if (digits.length < 10) return 'Please enter a valid 10-digit phone number';
        return undefined;
      case 'service':
        if (!value) return 'Please select a service';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Phone number auto-formatting
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const [phoneDisplay, setPhoneDisplay] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDisplay(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const data = {
      name: (formData.get('name') as string).trim(),
      phone: (formData.get('phone') as string).replace(/\D/g, ''),
      email: (formData.get('email') as string)?.trim() || '',
      service: formData.get('service') as string,
      message: (formData.get('message') as string)?.trim() || '',
      locationSlug: locationSlug || '',
      serviceSlug: serviceSlug || '',
      pageUrl: window.location.pathname,
      referrer: document.referrer,
      utmSource: new URLSearchParams(window.location.search).get('utm_source') || '',
      utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || '',
      utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
    };

    // Validate all required fields
    const newErrors: FormErrors = {};
    newErrors.name = validateField('name', data.name);
    newErrors.phone = validateField('phone', data.phone);
    newErrors.service = validateField('service', data.service);

    const hasErrors = Object.values(newErrors).some(Boolean);
    setErrors(newErrors);
    if (hasErrors) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Submission failed');

      const result = await response.json();

      // Track successful submission
      posthog?.capture('form_submission', {
        form_placement: placement,
        location_slug: locationSlug,
        service_slug: serviceSlug,
        service_selected: data.service,
        has_email: Boolean(data.email),
        has_message: Boolean(data.message),
        page_url: data.pageUrl,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        lead_id: result.id,
      });

      // Identify the user in PostHog for future session correlation
      posthog?.identify(result.id, {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        first_service: data.service,
        first_location: locationSlug,
      });

      setIsSuccess(true);
    } catch (err) {
      setServerError('Something went wrong. Please call us directly or try again.');
      posthog?.capture('form_submission_error', {
        form_placement: placement,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-3xl mb-2" aria-hidden="true">&#10003;</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          Thank You! We'll Call You Shortly.
        </h3>
        <p className="text-green-700">
          One of our team members will reach out within 15 minutes during
          business hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-1">{heading}</h3>
      <p className="text-sm text-gray-500 mb-4">
        No obligation. We'll get back to you within 15 minutes.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Honeypot — hidden from real users, bots will fill it in */}
        <input
          type="text"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
        />

        {/* Name */}
        <div>
          <label htmlFor={`name-${placement}`} className="sr-only">Your Name</label>
          <input
            id={`name-${placement}`}
            name="name"
            type="text"
            placeholder="Your Name"
            autoComplete="name"
            required
            onFocus={() => { trackFormStart(); trackFieldFocus('name'); }}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border rounded-lg text-base
              ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-brand-accent`}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1" role="alert">{errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor={`phone-${placement}`} className="sr-only">Phone Number</label>
          <input
            id={`phone-${placement}`}
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="Phone Number"
            autoComplete="tel"
            required
            value={phoneDisplay}
            onChange={handlePhoneChange}
            onFocus={() => trackFieldFocus('phone')}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border rounded-lg text-base
              ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-brand-accent`}
          />
          {errors.phone && (
            <p className="text-red-600 text-sm mt-1" role="alert">{errors.phone}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label htmlFor={`email-${placement}`} className="sr-only">Email (optional)</label>
          <input
            id={`email-${placement}`}
            name="email"
            type="email"
            placeholder="Email (optional)"
            autoComplete="email"
            onFocus={() => trackFieldFocus('email')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
              focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>

        {/* Service Dropdown */}
        <div>
          <label htmlFor={`service-${placement}`} className="sr-only">Service Needed</label>
          <select
            id={`service-${placement}`}
            name="service"
            required
            defaultValue={serviceSlug || ''}
            onFocus={() => trackFieldFocus('service')}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border rounded-lg text-base appearance-none
              bg-white ${errors.service ? 'border-red-400 bg-red-50' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-brand-accent`}
          >
            <option value="" disabled>Select a Service</option>
            {services.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {errors.service && (
            <p className="text-red-600 text-sm mt-1" role="alert">{errors.service}</p>
          )}
        </div>

        {/* Message (optional) */}
        <div>
          <label htmlFor={`message-${placement}`} className="sr-only">
            Describe your issue (optional)
          </label>
          <textarea
            id={`message-${placement}`}
            name="message"
            placeholder="Briefly describe your issue (optional)"
            rows={3}
            onFocus={() => trackFieldFocus('message')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
              resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>

        {serverError && (
          <p className="text-red-600 text-sm" role="alert">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-brand-accent text-white font-semibold
            rounded-lg text-base hover:bg-brand-accent-dark transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isSubmitting ? 'Sending...' : 'Get My Free Estimate'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By submitting, you agree to our{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
          We'll never share your info.
        </p>
      </form>
    </div>
  );
}
```

### Server-Side Form Handler (Next.js API Route)

```ts
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 submissions per 60 seconds per IP
  analytics: true,
});

export async function POST(req: NextRequest) {
  // Origin validation — reject requests from unexpected origins
  const origin = req.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  const payload = await getPayload({ config: configPromise });

  try {
    const body = await req.json();

    // Honeypot check — bots will fill in the hidden "website" field
    if (body.website) {
      // Silently accept to avoid tipping off the bot, but do not create a lead
      return NextResponse.json({ id: 'ok', status: 'success' });
    }

    // Server-side validation
    const { name, phone, service, locationSlug, serviceSlug, pageUrl,
            email, message, referrer, utmSource, utmMedium, utmCampaign } = body;

    if (!name || !phone || !service) {
      return NextResponse.json(
        { error: 'Name, phone, and service are required' },
        { status: 400 },
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 },
      );
    }

    // Create lead in Payload CMS
    const lead = await payload.create({
      collection: 'leads',
      data: {
        name,
        phone: phoneDigits,
        email: email || undefined,
        service,
        message: message || undefined,
        locationSlug: locationSlug || undefined,
        serviceSlug: serviceSlug || undefined,
        sourceUrl: pageUrl,
        referrer: referrer || undefined,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        status: 'new',
      },
    });

    // Send notification (webhook, email, SMS, etc.)
    await notifyTeam(lead);

    return NextResponse.json({ id: lead.id, status: 'success' });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function notifyTeam(lead: any) {
  // Integrate with your notification system:
  // - Webhook to CRM (ServiceTitan, Housecall Pro, etc.)
  // - Email to dispatch
  // - SMS to owner
  // - Slack notification

  // Example: webhook to a CRM
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          service: lead.service,
          message: lead.message,
          source_page: lead.sourceUrl,
          created_at: lead.createdAt,
        }),
      });

      if (!response.ok) {
        console.error(
          `notifyTeam webhook failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error('notifyTeam webhook error:', err);
    }
  }
}
```

### Leads Collection in Payload CMS

```ts
// payload/collections/Leads.ts
import type { CollectionConfig } from 'payload';

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'service', 'locationSlug', 'status', 'createdAt'],
    listSearchableFields: ['name', 'phone', 'email'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    {
      name: 'service',
      type: 'text',
      required: true,
      admin: { description: 'Service slug from the form dropdown' },
    },
    { name: 'message', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Booked', value: 'booked' },
        { label: 'Completed', value: 'completed' },
        { label: 'Lost', value: 'lost' },
      ],
      admin: { position: 'sidebar' },
    },
    // Attribution fields
    {
      name: 'attribution',
      type: 'group',
      admin: { description: 'Lead source attribution' },
      fields: [
        { name: 'locationSlug', type: 'text', label: 'Location' },
        { name: 'serviceSlug', type: 'text', label: 'Service' },
        { name: 'sourceUrl', type: 'text', label: 'Page URL' },
        { name: 'referrer', type: 'text' },
        { name: 'utmSource', type: 'text', label: 'UTM Source' },
        { name: 'utmMedium', type: 'text', label: 'UTM Medium' },
        { name: 'utmCampaign', type: 'text', label: 'UTM Campaign' },
      ],
    },
  ],
  // Flatten attribution fields for backward compatibility with the API route
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Move top-level attribution fields into the group if present
        if (data) {
          const attrFields = ['locationSlug', 'serviceSlug', 'sourceUrl',
                              'referrer', 'utmSource', 'utmMedium', 'utmCampaign'];
          if (!data.attribution) data.attribution = {};
          for (const field of attrFields) {
            if (data[field] !== undefined) {
              data.attribution[field] = data[field];
              delete data[field];
            }
          }
        }
        return data;
      },
    ],
  },
};
```

---

## 5. Trust Signals That Improve Conversion

### Trust Signal Hierarchy (Highest to Lowest Impact)

1. **Star rating + total review count** (e.g., "4.8 stars from 247 reviews") — displayed in hero
2. **Google/Yelp review source logos** — borrowed trust from recognized platforms
3. **License and insurance badges** — legal requirement display builds confidence
4. **"X Years in Business"** — longevity signal
5. **Guarantee badges** — "100% Satisfaction Guarantee," "No Surprise Pricing"
6. **Certifications** — EPA, NATE, Master Plumber, etc.
7. **BBB rating** — declining in importance but still recognized
8. **Industry association logos** — local chamber of commerce, trade associations
9. **"Locally Owned & Operated"** — differentiator against national chains
10. **Team photos** — real people, not stock photos

### Trust Bar Component

This is a horizontal strip that sits directly below the hero, showing key trust indicators:

```tsx
// components/TrustBar.tsx
interface TrustBarProps {
  rating: number;            // 4.8
  reviewCount: number;       // 247
  yearsInBusiness: number;   // 15
  licenseNumber?: string;    // "TACLA12345C"
  guarantees: string[];      // ["Satisfaction Guaranteed", "No Hidden Fees"]
  reviewSourceUrl?: string;  // Link to Google Business Profile
}

export function TrustBar({
  rating,
  reviewCount,
  yearsInBusiness,
  licenseNumber,
  guarantees,
  reviewSourceUrl,
}: TrustBarProps) {
  return (
    <div className="bg-gray-50 border-y border-gray-200 py-3">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center
                      justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
        {/* Star Rating */}
        <a
          href={reviewSourceUrl || '#reviews'}
          className="flex items-center gap-1.5 hover:text-brand-accent transition-colors"
        >
          <StarRating rating={rating} />
          <span className="font-semibold">{rating}</span>
          <span className="text-gray-500">({reviewCount} reviews)</span>
        </a>

        <Divider />

        {/* Years in Business */}
        <div className="flex items-center gap-1.5">
          <ShieldIcon className="w-4 h-4 text-brand-accent" />
          <span>{yearsInBusiness}+ Years in Business</span>
        </div>

        <Divider />

        {/* License */}
        {licenseNumber && (
          <>
            <div className="flex items-center gap-1.5">
              <BadgeIcon className="w-4 h-4 text-brand-accent" />
              <span>License #{licenseNumber}</span>
            </div>
            <Divider />
          </>
        )}

        {/* Guarantees */}
        {guarantees.map((g) => (
          <div key={g} className="flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span>{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex text-yellow-400" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullStars) return <FullStarIcon key={i} />;
        if (i === fullStars && hasHalf) return <HalfStarIcon key={i} />;
        return <EmptyStarIcon key={i} />;
      })}
    </div>
  );
}

function Divider() {
  return <span className="hidden sm:inline text-gray-300" aria-hidden="true">|</span>;
}
```

### Payload CMS Trust Signals Global Config

```ts
// payload/globals/BusinessInfo.ts
import type { GlobalConfig } from 'payload';

export const BusinessInfo: GlobalConfig = {
  slug: 'business-info',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: { step: 0.1, description: 'Average star rating (e.g., 4.8)' },
    },
    {
      name: 'reviewCount',
      type: 'number',
      admin: { description: 'Total number of reviews across platforms' },
    },
    {
      name: 'reviewSourceUrl',
      type: 'text',
      admin: { description: 'Link to Google Business Profile or review page' },
    },
    {
      name: 'yearsInBusiness',
      type: 'number',
    },
    {
      name: 'licenseNumber',
      type: 'text',
    },
    {
      name: 'guarantees',
      type: 'array',
      fields: [
        { name: 'text', type: 'text', required: true },
      ],
    },
    {
      name: 'certifications',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'logo', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'insuranceInfo',
      type: 'text',
      admin: { description: 'e.g., "Fully Licensed & Insured"' },
    },
  ],
};
```

---

## 6. Urgency and Scarcity Triggers

### Legitimate Urgency Techniques for Service Businesses

These must be truthful. Fake urgency destroys trust permanently.

**Same-Day / Emergency Availability**
- "Same-Day Service Available — Call Before 2 PM"
- "24/7 Emergency Service"
- Only display if the business actually offers it.

**Limited Scheduling Windows**
- "Next available appointment: Tomorrow, 8-10 AM" — dynamically pull from scheduling system if integrated
- "Only 3 slots remaining this week" — only if your scheduling data supports this

**Seasonal Demand Signals**
- "AC season is here — book before the wait times increase"
- "Winter freeze warnings: schedule your pipe inspection now"
- Tie to real weather or seasonal patterns in the service area.

**Coupon / Offer Expiration**
- "$50 Off Drain Cleaning — Offer Ends [End of Month]"
- Use a real date. Never use "Limited Time" without a date.

### Urgency Banner Component

```tsx
// components/UrgencyBanner.tsx
'use client';

import { usePostHog } from 'posthog-js/react';

interface UrgencyBannerProps {
  message: string;            // "Same-Day Service Available"
  subMessage?: string;        // "Call before 2 PM for today's appointment"
  offerCode?: string;         // "SAVE50"
  expirationDate?: string;    // "2026-04-30"
  variant: 'bar' | 'badge' | 'inline';
}

export function UrgencyBanner({
  message,
  subMessage,
  offerCode,
  expirationDate,
  variant,
}: UrgencyBannerProps) {
  const posthog = usePostHog();

  // Don't render expired offers
  if (expirationDate && new Date(expirationDate) < new Date()) {
    return null;
  }

  const handleClick = () => {
    posthog?.capture('urgency_banner_click', {
      message,
      offer_code: offerCode,
      variant,
      page_url: window.location.pathname,
    });
  };

  if (variant === 'badge') {
    return (
      <span
        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100
                   text-red-700 text-sm font-semibold rounded-full"
      >
        <ClockIcon className="w-3.5 h-3.5" />
        {message}
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-orange-700 font-medium text-sm my-2">
        <ClockIcon className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
        {subMessage && <span className="text-orange-500">— {subMessage}</span>}
      </div>
    );
  }

  // 'bar' variant: full-width banner
  return (
    <div
      className="bg-gradient-to-r from-orange-500 to-red-500 text-white
                 py-2 px-4 text-center text-sm font-medium cursor-pointer"
      onClick={handleClick}
      role="status"
    >
      <span className="font-bold">{message}</span>
      {subMessage && <span className="ml-2 opacity-90">— {subMessage}</span>}
      {offerCode && (
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs font-mono">
          Code: {offerCode}
        </span>
      )}
    </div>
  );
}
```

---

## 7. Social Proof Placement

### Placement Rules

| Position | Type of Social Proof | Why It Works |
|---|---|---|
| Hero area (within/below) | Aggregate: "4.8 stars, 247 reviews" | Instant credibility scan |
| After service description | 1 short review about that specific service | Validates what they just read |
| After pricing section | Review mentioning fair pricing / no surprises | Counters price objection |
| Dedicated testimonial block | 2-3 full reviews with names and photos | Deep trust building |
| Near final CTA | "Join 500+ happy {City} homeowners" | Bandwagon effect at decision point |

### Key Rules
- Never show a testimonial without a first name and last initial at minimum.
- Include the service type in the review text when possible ("John did an amazing job on our water heater replacement").
- Location-specific reviews outperform generic ones by 20-30%. Filter reviews by city when available.
- Show the review source (Google, Yelp) — third-party validation matters more than self-published.
- Always show real star ratings. Never fabricate or round up.

### Testimonial Component

```tsx
// components/Testimonial.tsx
interface TestimonialProps {
  name: string;           // "Sarah M."
  location?: string;      // "Austin, TX"
  rating: number;         // 5
  text: string;           // The review text
  source: 'google' | 'yelp' | 'facebook' | 'bbb';
  date?: string;          // "2 weeks ago" or "March 2026"
  service?: string;       // "Water Heater Repair"
  avatarUrl?: string;
}

export function Testimonial({
  name,
  location,
  rating,
  text,
  source,
  date,
  service,
  avatarUrl,
}: TestimonialProps) {
  return (
    <blockquote className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center
                          justify-center text-brand-accent font-bold text-sm">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            {location && <span>{location}</span>}
            {date && <span>- {date}</span>}
          </div>
        </div>
        <div className="ml-auto">
          <SourceLogo source={source} />
        </div>
      </div>

      <div className="flex mb-2">
        <StarRating rating={rating} />
      </div>

      {service && (
        <div className="text-xs text-brand-accent font-medium mb-2 uppercase tracking-wide">
          {service}
        </div>
      )}

      <p className="text-gray-700 text-sm leading-relaxed">"{text}"</p>
    </blockquote>
  );
}

function SourceLogo({ source }: { source: string }) {
  const logos: Record<string, string> = {
    google: '/images/google-logo.svg',
    yelp: '/images/yelp-logo.svg',
    facebook: '/images/facebook-logo.svg',
    bbb: '/images/bbb-logo.svg',
  };
  return (
    <img
      src={logos[source] || ''}
      alt={`Review from ${source}`}
      className="h-5 w-auto opacity-60"
      loading="lazy"
    />
  );
}
```

### Testimonials Collection in Payload CMS

```ts
// payload/collections/Testimonials.ts
import type { CollectionConfig } from 'payload';

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'rating', 'service', 'location', 'source'],
  },
  fields: [
    { name: 'customerName', type: 'text', required: true, label: 'Name (e.g., "Sarah M.")' },
    { name: 'customerLocation', type: 'text', label: 'City, State' },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'text', type: 'textarea', required: true },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Yelp', value: 'yelp' },
        { label: 'Facebook', value: 'facebook' },
        { label: 'BBB', value: 'bbb' },
      ],
    },
    { name: 'reviewDate', type: 'date' },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: { description: 'Which service this review is about' },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'Which location this review is from' },
    },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show on homepage and high-priority pages' },
    },
  ],
};
```

---

## 8. Mobile Conversion Optimization

### Mobile-Specific Requirements

Mobile accounts for 60-75% of local service business traffic. Every conversion path must be designed mobile-first.

### Sticky Bottom CTA Bar

```tsx
// components/StickyMobileCTA.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';

interface StickyMobileCTAProps {
  phoneNumber: string;
  displayNumber: string;
  formUrl?: string;
  locationSlug?: string;
  serviceSlug?: string;
}

export function StickyMobileCTA({
  phoneNumber,
  displayNumber,
  formUrl = '#contact-form',
  locationSlug,
  serviceSlug,
}: StickyMobileCTAProps) {
  const posthog = usePostHog();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show after scrolling past the hero (approx 400px)
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    // Only show on mobile
    if (window.innerWidth >= 768) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const handlePhoneClick = () => {
    posthog?.capture('phone_click', {
      placement: 'sticky_mobile_bar',
      location_slug: locationSlug,
      service_slug: serviceSlug,
      page_url: window.location.pathname,
      device_type: 'mobile',
    });
  };

  const handleFormClick = () => {
    posthog?.capture('cta_click', {
      cta_type: 'form_scroll',
      placement: 'sticky_mobile_bar',
      location_slug: locationSlug,
      service_slug: serviceSlug,
    });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                 bg-white border-t border-gray-200 shadow-lg
                 safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex gap-2 p-2">
        <a
          href={`tel:+1${phoneNumber}`}
          onClick={handlePhoneClick}
          className="flex-1 flex items-center justify-center gap-2 py-3
                     bg-brand-accent text-white font-semibold rounded-lg
                     active:bg-brand-accent-dark min-h-[48px]"
        >
          <PhoneIcon className="w-5 h-5" />
          Call Now
        </a>
        <a
          href={formUrl}
          onClick={handleFormClick}
          className="flex-1 flex items-center justify-center gap-2 py-3
                     bg-gray-900 text-white font-semibold rounded-lg
                     active:bg-gray-800 min-h-[48px]"
        >
          <FormIcon className="w-5 h-5" />
          Free Quote
        </a>
      </div>
    </div>
  );
}
```

### Mobile Form Optimization Checklist

1. **Input types**: Use `type="tel"` with `inputMode="numeric"` for phone fields (brings up numeric keyboard). Use `type="email"` for email (brings up @ keyboard).
2. **Autocomplete attributes**: Add `autoComplete="name"`, `autoComplete="tel"`, `autoComplete="email"` so browsers can autofill.
3. **Touch targets**: Every button and input must be at least 48x48px. Spacing between tap targets must be at least 8px.
4. **No pinch-zoom needed**: Font size minimum 16px on all form inputs (prevents iOS auto-zoom).
5. **No horizontal scrolling**: Test every page at 320px width.
6. **Thumb zone**: Primary CTAs must be in the bottom 60% of the screen — the natural thumb reach zone.
7. **Safe area insets**: Account for iPhone notch/home indicator with `env(safe-area-inset-bottom)`.
8. **Disable double-tap zoom on buttons**: Use `touch-action: manipulation` on interactive elements.

### Mobile CSS Utilities

```css
/* globals.css additions for mobile CRO */

/* Prevent iOS zoom on input focus (requires 16px minimum) */
input, select, textarea {
  font-size: 16px;
}

/* Safe area padding for sticky elements */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Thumb-friendly touch targets */
.touch-target {
  min-height: 48px;
  min-width: 48px;
  touch-action: manipulation;
}

/* Prevent text selection on CTA buttons */
.cta-button {
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

---

## 9. A/B Testing Strategy with PostHog

### What to Test (Priority Order)

| Priority | Element | Hypothesis | Expected Impact |
|---|---|---|---|
| 1 | CTA button text | "Get Free Estimate" vs "Schedule Service" vs "Call Now" | 5-15% conversion lift |
| 2 | Hero headline | Pain-point vs benefit-focused vs direct service statement | 3-10% lift |
| 3 | Phone number visibility | Header-only vs header+hero vs header+hero+sticky | 10-20% lift for phone leads |
| 4 | Form length | 3 fields vs 5 fields | 10-25% lift in form completions |
| 5 | Trust bar position | Below hero vs above hero vs integrated in hero | 3-8% lift |
| 6 | Urgency messaging | With urgency banner vs without | 5-12% lift |
| 7 | Testimonial count | 1 vs 3 vs 5 testimonials shown | 2-5% lift |
| 8 | CTA color | Brand accent vs green vs orange | 2-8% lift |

### Minimum Sample Size Calculations

For local service businesses, traffic is often low. You need to plan tests accordingly:

- **Minimum detectable effect (MDE)**: 15-20% relative lift (local businesses can't detect 2% changes)
- **Statistical significance**: 95% confidence (p < 0.05)
- **Power**: 80%
- **Baseline conversion rate**: Typical 3-8% for service pages

**Sample size formula reference:**
- At 5% baseline, 20% MDE: ~3,800 visitors per variant (7,600 total)
- At 5% baseline, 30% MDE: ~1,700 visitors per variant (3,400 total)
- At 8% baseline, 20% MDE: ~2,300 visitors per variant (4,600 total)

**Practical implication**: If a service+location page gets 500 visits/month, a test requires 7-15 months per variant at a 20% MDE. This is too long. Instead:

- **Test at the template level**, not the individual page level. Apply the same variation across ALL pages using a given template, and aggregate the traffic.
- **Run 2 variants max** (A vs B, never A/B/C/D).
- **Test big changes only** — button text changes, not button color shade changes.

### PostHog Feature Flag Implementation

```tsx
// lib/posthog-experiments.ts
import posthog from 'posthog-js';

/**
 * Define all experiments in one place so they can be managed consistently.
 * Each experiment has a flag key, variant names, and the element it controls.
 */
export const EXPERIMENTS = {
  hero_cta_text: {
    flagKey: 'hero-cta-text',
    variants: {
      control: 'Get Free Estimate',
      variant_a: 'Schedule Service Now',
      variant_b: 'Call for Free Quote',
    },
  },
  form_length: {
    flagKey: 'form-length',
    variants: {
      control: 'short',     // 3 fields
      variant_a: 'long',    // 5 fields
    },
  },
  sticky_cta: {
    flagKey: 'sticky-cta-enabled',
    variants: {
      control: true,
      variant_a: false,
    },
  },
} as const;

/**
 * Get the current variant for an experiment.
 * Returns the variant key (e.g., 'control', 'variant_a').
 */
export function getExperimentVariant(experimentKey: keyof typeof EXPERIMENTS): string {
  const experiment = EXPERIMENTS[experimentKey];
  const variant = posthog.getFeatureFlag(experiment.flagKey);
  return typeof variant === 'string' ? variant : 'control';
}
```

```tsx
// components/HeroCTA.tsx — A/B tested CTA
'use client';

import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { EXPERIMENTS } from '@/lib/posthog-experiments';

interface HeroCTAProps {
  phoneNumber: string;
  displayNumber: string;
  locationSlug: string;
  serviceSlug: string;
}

export function HeroCTA({ phoneNumber, displayNumber, locationSlug, serviceSlug }: HeroCTAProps) {
  const variant = useFeatureFlagVariantKey(EXPERIMENTS.hero_cta_text.flagKey) || 'control';
  const ctaText = EXPERIMENTS.hero_cta_text.variants[
    variant as keyof typeof EXPERIMENTS.hero_cta_text.variants
  ] || EXPERIMENTS.hero_cta_text.variants.control;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a
        href="#contact-form"
        className="px-8 py-4 bg-brand-accent text-white text-lg font-bold
                   rounded-lg hover:bg-brand-accent-dark transition-colors
                   text-center min-h-[48px]"
        data-experiment="hero-cta-text"
        data-variant={variant}
      >
        {ctaText}
      </a>
      <ClickToCall
        phoneNumber={phoneNumber}
        displayNumber={displayNumber}
        placement="hero"
        variant="button"
        location={locationSlug}
        service={serviceSlug}
      />
    </div>
  );
}
```

### PostHog Experiment Setup Checklist

1. Create feature flag in PostHog dashboard with multivariate options.
2. Set rollout to 100% with equal distribution across variants.
3. Define the **goal metric** as a PostHog action (e.g., `form_submission` event or `phone_click` event).
4. Set the experiment to require a minimum of 1,000 participants before evaluating.
5. Let the experiment run for at least 2 full weeks regardless of sample size (captures day-of-week variance).
6. Never peek and stop early on the first sign of significance — commit to the pre-defined sample size.

---

## 10. Conversion Tracking Setup

### PostHog Event Taxonomy

Define a consistent, structured event naming convention used across all client sites:

```ts
// lib/tracking-events.ts

/**
 * Standard event names for all service-area business sites.
 * These MUST be used consistently across all components.
 */
export const TRACKING_EVENTS = {
  // Form events
  FORM_START: 'form_start',                      // User focuses first field
  FORM_FIELD_FOCUS: 'form_field_focus',           // User focuses any field
  FORM_SUBMISSION: 'form_submission',             // Successful submission
  FORM_SUBMISSION_ERROR: 'form_submission_error', // Server error on submit
  FORM_ABANDONMENT: 'form_abandonment',           // Started but didn't submit (tracked via beforeunload)

  // Phone events
  PHONE_CLICK: 'phone_click',                     // Clicked tel: link

  // CTA events
  CTA_CLICK: 'cta_click',                         // Clicked any CTA button
  CTA_VIEW: 'cta_view',                           // CTA entered viewport (scroll tracking)

  // Page engagement
  PAGE_SCROLL_DEPTH: 'page_scroll_depth',          // 25%, 50%, 75%, 100% milestones
  PAGE_TIME_ON_PAGE: 'page_time_on_page',          // 30s, 60s, 120s milestones

  // Urgency / offer events
  URGENCY_BANNER_CLICK: 'urgency_banner_click',
  OFFER_CODE_COPY: 'offer_code_copy',

  // Navigation
  SERVICE_AREA_LINK_CLICK: 'service_area_link_click',  // Clicked to another city page
  FAQ_EXPAND: 'faq_expand',                             // Expanded an FAQ item
} as const;

/**
 * Standard properties that MUST be included with every event.
 */
export interface BaseEventProperties {
  page_url: string;
  location_slug?: string;
  service_slug?: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
}

export function getBaseProperties(locationSlug?: string, serviceSlug?: string): BaseEventProperties {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  return {
    page_url: typeof window !== 'undefined' ? window.location.pathname : '',
    location_slug: locationSlug,
    service_slug: serviceSlug,
    device_type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
  };
}
```

### Scroll Depth and Time-on-Page Tracking

```tsx
// components/PageEngagementTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { TRACKING_EVENTS, getBaseProperties } from '@/lib/tracking-events';

interface PageEngagementTrackerProps {
  locationSlug?: string;
  serviceSlug?: string;
}

export function PageEngagementTracker({ locationSlug, serviceSlug }: PageEngagementTrackerProps) {
  const posthog = usePostHog();
  const scrollMilestones = useRef(new Set<number>());
  const timeMilestones = useRef(new Set<number>());

  useEffect(() => {
    if (!posthog) return;

    const baseProps = getBaseProperties(locationSlug, serviceSlug);

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of [25, 50, 75, 100]) {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          posthog.capture(TRACKING_EVENTS.PAGE_SCROLL_DEPTH, {
            ...baseProps,
            scroll_depth: milestone,
          });
        }
      }
    };

    // Time on page tracking
    const timeIntervals = [30, 60, 120];
    const timers = timeIntervals.map((seconds) =>
      setTimeout(() => {
        if (!timeMilestones.current.has(seconds)) {
          timeMilestones.current.add(seconds);
          posthog.capture(TRACKING_EVENTS.PAGE_TIME_ON_PAGE, {
            ...baseProps,
            time_seconds: seconds,
          });
        }
      }, seconds * 1000),
    );

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      timers.forEach(clearTimeout);
    };
  }, [posthog, locationSlug, serviceSlug]);

  return null; // Invisible tracker component
}
```

### Form Abandonment Detection

```tsx
// hooks/useFormAbandonment.ts
'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { TRACKING_EVENTS, getBaseProperties } from '@/lib/tracking-events';

export function useFormAbandonment(
  formStarted: boolean,
  formSubmitted: boolean,
  placement: string,
  locationSlug?: string,
  serviceSlug?: string,
) {
  const posthog = usePostHog();
  const startedRef = useRef(formStarted);
  const submittedRef = useRef(formSubmitted);

  useEffect(() => { startedRef.current = formStarted; }, [formStarted]);
  useEffect(() => { submittedRef.current = formSubmitted; }, [formSubmitted]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (startedRef.current && !submittedRef.current) {
        posthog?.capture(TRACKING_EVENTS.FORM_ABANDONMENT, {
          ...getBaseProperties(locationSlug, serviceSlug),
          form_placement: placement,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [posthog, placement, locationSlug, serviceSlug]);
}
```

### PostHog Initialization

```tsx
// app/providers.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Guard against double-init in React 18 Strict Mode
    if (posthog.__loaded) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,  // We use explicit events for accuracy
      persistence: 'localStorage+cookie',
      cross_subdomain_cookie: false,
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug();
        }
      },
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

---

## 11. Lead Attribution

### Attribution Data Model

Every lead must carry full attribution data so you can answer: "Which service page in which city generated this lead, and how did they get there?"

The attribution chain:

```
Traffic Source (utm params, referrer, gclid)
  → Landing Page (service + location slug)
    → Conversion Action (form submit or phone click)
      → Lead Record (stored in Payload CMS)
        → PostHog Person Profile (linked by lead ID)
```

### First-Touch vs Last-Touch Attribution

For local service businesses, **first-touch attribution** is most useful because:
- The buying journey is short (often same-session)
- Paid traffic usually drives the first visit
- You need to know which ad/page brought them in

Capture first-touch data on initial page load and store it in localStorage. Only overwrite if empty.

```ts
// lib/attribution.ts

export interface AttributionData {
  firstTouchUrl: string;
  firstTouchReferrer: string;
  firstTouchUtmSource: string;
  firstTouchUtmMedium: string;
  firstTouchUtmCampaign: string;
  firstTouchUtmTerm: string;
  firstTouchGclid: string;
  firstTouchTimestamp: string;
  lastTouchUrl: string;
  lastTouchReferrer: string;
  lastTouchUtmSource: string;
  lastTouchUtmMedium: string;
  lastTouchUtmCampaign: string;
}

const STORAGE_KEY = 'lead_attribution';

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const now = new Date().toISOString();

  const current = {
    url: window.location.pathname,
    referrer: document.referrer,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmTerm: params.get('utm_term') || '',
    gclid: params.get('gclid') || '',
  };

  const existing = getStoredAttribution();

  // Set first-touch only if not already set
  if (!existing.firstTouchTimestamp) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        firstTouchUrl: current.url,
        firstTouchReferrer: current.referrer,
        firstTouchUtmSource: current.utmSource,
        firstTouchUtmMedium: current.utmMedium,
        firstTouchUtmCampaign: current.utmCampaign,
        firstTouchUtmTerm: current.utmTerm,
        firstTouchGclid: current.gclid,
        firstTouchTimestamp: now,
        // Also set as last touch
        lastTouchUrl: current.url,
        lastTouchReferrer: current.referrer,
        lastTouchUtmSource: current.utmSource,
        lastTouchUtmMedium: current.utmMedium,
        lastTouchUtmCampaign: current.utmCampaign,
      }),
    );
  } else {
    // Update last-touch only
    const data = { ...existing };
    data.lastTouchUrl = current.url;
    data.lastTouchReferrer = current.referrer;
    data.lastTouchUtmSource = current.utmSource || existing.lastTouchUtmSource;
    data.lastTouchUtmMedium = current.utmMedium || existing.lastTouchUtmMedium;
    data.lastTouchUtmCampaign = current.utmCampaign || existing.lastTouchUtmCampaign;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export function getStoredAttribution(): Partial<AttributionData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);

    // Expire first-touch attribution after 90 days — treat as new visitor
    if (parsed.firstTouchTimestamp) {
      const age = Date.now() - new Date(parsed.firstTouchTimestamp).getTime();
      if (age > ATTRIBUTION_TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return {};
      }
    }

    return parsed;
  } catch {
    return {};
  }
}

/**
 * Get attribution data to attach to a lead submission.
 * Extracts location and service slugs from the current URL path.
 */
export function getLeadAttribution(): Record<string, string> {
  const stored = getStoredAttribution();
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  // Expected URL patterns:
  // /{service}/{location}  e.g., /drain-cleaning/austin-tx
  // /{category}/{service}/{location}  e.g., /plumbing/drain-cleaning/austin-tx
  const serviceSlug = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : pathParts[0] || '';
  const locationSlug = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : '';

  return {
    serviceSlug,
    locationSlug,
    pageUrl: window.location.pathname,
    referrer: stored.firstTouchReferrer || document.referrer,
    utmSource: stored.firstTouchUtmSource || '',
    utmMedium: stored.firstTouchUtmMedium || '',
    utmCampaign: stored.firstTouchUtmCampaign || '',
    utmTerm: stored.firstTouchUtmTerm || '',
    gclid: stored.firstTouchGclid || '',
    firstTouchUrl: stored.firstTouchUrl || '',
    lastTouchUrl: stored.lastTouchUrl || window.location.pathname,
  };
}
```

### Attribution Capture on Page Load

```tsx
// components/AttributionCapture.tsx
'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}

// Include in root layout:
// <AttributionCapture />
```

### PostHog Dashboard: Key Reports to Create

1. **Conversion Funnel by Page**: Filter `form_submission` and `phone_click` events by `location_slug` and `service_slug`. Shows which pages convert best.
2. **Lead Source Breakdown**: Group by `utm_source` and `utm_medium` to see which channels drive leads.
3. **Service Demand by Location**: Pivot table of `service_slug` x `location_slug` from form submissions. Shows which services are most requested in each city.
4. **Form Abandonment Rate**: `form_start` count minus `form_submission` count, grouped by `form_placement`.
5. **CTA Click Heatmap**: `cta_click` events grouped by `placement` to see which positions drive the most engagement.
6. **Mobile vs Desktop Conversion**: Filter all conversion events by `device_type`.
7. **Time-to-Convert**: Use PostHog session recordings to measure time from page load to conversion action.

---

## 12. Implementation: Payload CMS CTA Blocks

### CTA Block for Payload CMS Page Builder

This defines a reusable CTA block that content editors can insert anywhere in page content:

```ts
// payload/blocks/CTABlock.ts
import type { Block } from 'payload';

export const CTABlock: Block = {
  slug: 'cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  imageURL: '/admin/cta-block-preview.png',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'standard',
      options: [
        { label: 'Standard (Button + Phone)', value: 'standard' },
        { label: 'Full-Width Banner', value: 'banner' },
        { label: 'Compact Inline', value: 'inline' },
        { label: 'With Form', value: 'with-form' },
        { label: 'Phone Only', value: 'phone-only' },
      ],
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Ready to Get Started?',
      admin: {
        description: 'CTA heading. Use {service} and {location} as dynamic placeholders.',
      },
    },
    {
      name: 'subheading',
      type: 'text',
      admin: {
        description: 'Optional subtext below the heading.',
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      defaultValue: 'Get Free Estimate',
      admin: {
        condition: (_, siblingData) => siblingData?.variant !== 'phone-only',
      },
    },
    {
      name: 'buttonLink',
      type: 'text',
      defaultValue: '#contact-form',
      admin: {
        description: 'URL or anchor link (e.g., #contact-form)',
        condition: (_, siblingData) =>
          siblingData?.variant !== 'phone-only' && siblingData?.variant !== 'with-form',
      },
    },
    {
      name: 'showPhoneNumber',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'urgencyText',
      type: 'text',
      admin: {
        description: 'Optional urgency message (e.g., "Same-Day Service Available")',
      },
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Light Gray', value: 'light' },
        { label: 'Brand Color', value: 'brand' },
        { label: 'Dark', value: 'dark' },
        { label: 'Transparent', value: 'transparent' },
      ],
    },
  ],
};
```

### CTA Block Renderer

```tsx
// components/blocks/CTABlockRenderer.tsx
'use client';

import { usePostHog } from 'posthog-js/react';
import { ClickToCall } from '@/components/ClickToCall';
import { LeadForm } from '@/components/LeadForm';
import { UrgencyBanner } from '@/components/UrgencyBanner';

interface CTABlockData {
  variant: 'standard' | 'banner' | 'inline' | 'with-form' | 'phone-only';
  heading: string;
  subheading?: string;
  buttonText?: string;
  buttonLink?: string;
  showPhoneNumber: boolean;
  urgencyText?: string;
  backgroundStyle: 'light' | 'brand' | 'dark' | 'transparent';
}

interface CTABlockRendererProps {
  block: CTABlockData;
  phoneNumber: string;
  displayNumber: string;
  services: Array<{ label: string; value: string }>;
  locationSlug?: string;
  serviceSlug?: string;
  blockIndex: number; // Position in the page for tracking
}

const bgStyles = {
  light: 'bg-gray-50 text-gray-900',
  brand: 'bg-brand-accent text-white',
  dark: 'bg-gray-900 text-white',
  transparent: 'bg-transparent text-gray-900',
};

export function CTABlockRenderer({
  block,
  phoneNumber,
  displayNumber,
  services,
  locationSlug,
  serviceSlug,
  blockIndex,
}: CTABlockRendererProps) {
  const posthog = usePostHog();

  // Interpolate dynamic placeholders in heading/subheading
  const interpolate = (text: string) =>
    text
      .replace(/\{service\}/g, serviceSlug?.replace(/-/g, ' ') || 'our services')
      .replace(/\{location\}/g, locationSlug?.replace(/-/g, ' ') || 'your area');

  const heading = interpolate(block.heading);
  const subheading = block.subheading ? interpolate(block.subheading) : undefined;

  const handleCTAClick = () => {
    posthog?.capture('cta_click', {
      cta_type: block.variant,
      cta_text: block.buttonText,
      cta_position: blockIndex,
      location_slug: locationSlug,
      service_slug: serviceSlug,
      page_url: window.location.pathname,
    });
  };

  if (block.variant === 'with-form') {
    return (
      <section className={`py-12 px-4 ${bgStyles[block.backgroundStyle]}`}>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{heading}</h2>
            {subheading && <p className="text-lg opacity-80 mb-4">{subheading}</p>}
            {block.urgencyText && (
              <UrgencyBanner message={block.urgencyText} variant="inline" />
            )}
            {block.showPhoneNumber && (
              <div className="mt-6">
                <p className="text-sm opacity-70 mb-1">Prefer to call?</p>
                <ClickToCall
                  phoneNumber={phoneNumber}
                  displayNumber={displayNumber}
                  placement="inline"
                  variant="button"
                  location={locationSlug}
                  service={serviceSlug}
                />
              </div>
            )}
          </div>
          <LeadForm
            services={services}
            locationSlug={locationSlug}
            serviceSlug={serviceSlug}
            placement="inline"
          />
        </div>
      </section>
    );
  }

  if (block.variant === 'banner') {
    return (
      <section className={`py-10 px-4 ${bgStyles[block.backgroundStyle]}`}>
        <div className="max-w-4xl mx-auto text-center">
          {block.urgencyText && (
            <UrgencyBanner message={block.urgencyText} variant="badge" />
          )}
          <h2 className="text-2xl md:text-3xl font-bold mt-3 mb-2">{heading}</h2>
          {subheading && <p className="text-lg opacity-80 mb-6">{subheading}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {block.buttonText && (
              <a
                href={block.buttonLink || '#contact-form'}
                onClick={handleCTAClick}
                className="px-8 py-4 bg-white text-brand-accent font-bold text-lg
                           rounded-lg hover:bg-gray-100 transition-colors min-h-[48px]
                           inline-flex items-center justify-center"
              >
                {block.buttonText}
              </a>
            )}
            {block.showPhoneNumber && (
              <ClickToCall
                phoneNumber={phoneNumber}
                displayNumber={displayNumber}
                placement="inline"
                variant="button"
                location={locationSlug}
                service={serviceSlug}
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  if (block.variant === 'phone-only') {
    return (
      <div className="text-center py-6">
        <p className="text-gray-600 mb-2">{heading}</p>
        <ClickToCall
          phoneNumber={phoneNumber}
          displayNumber={displayNumber}
          placement="inline"
          variant="button"
          location={locationSlug}
          service={serviceSlug}
        />
      </div>
    );
  }

  if (block.variant === 'inline') {
    return (
      <div className={`rounded-xl p-6 my-6 ${bgStyles[block.backgroundStyle]}`}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{heading}</h3>
            {subheading && <p className="text-sm opacity-80">{subheading}</p>}
          </div>
          <div className="flex gap-3">
            {block.buttonText && (
              <a
                href={block.buttonLink || '#contact-form'}
                onClick={handleCTAClick}
                className="px-6 py-3 bg-brand-accent text-white font-semibold
                           rounded-lg hover:bg-brand-accent-dark transition-colors
                           whitespace-nowrap min-h-[48px] inline-flex items-center"
              >
                {block.buttonText}
              </a>
            )}
            {block.showPhoneNumber && (
              <ClickToCall
                phoneNumber={phoneNumber}
                displayNumber={displayNumber}
                placement="inline"
                variant="link"
                location={locationSlug}
                service={serviceSlug}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: 'standard'
  return (
    <section className={`py-12 px-4 ${bgStyles[block.backgroundStyle]}`}>
      <div className="max-w-3xl mx-auto text-center">
        {block.urgencyText && (
          <UrgencyBanner message={block.urgencyText} variant="badge" />
        )}
        <h2 className="text-2xl md:text-3xl font-bold mt-3 mb-2">{heading}</h2>
        {subheading && <p className="text-lg opacity-80 mb-6">{subheading}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {block.buttonText && (
            <a
              href={block.buttonLink || '#contact-form'}
              onClick={handleCTAClick}
              className="px-8 py-4 bg-brand-accent text-white font-bold text-lg
                         rounded-lg hover:bg-brand-accent-dark transition-colors
                         min-h-[48px] inline-flex items-center justify-center"
            >
              {block.buttonText}
            </a>
          )}
          {block.showPhoneNumber && (
            <ClickToCall
              phoneNumber={phoneNumber}
              displayNumber={displayNumber}
              placement="inline"
              variant="button"
              location={locationSlug}
              service={serviceSlug}
            />
          )}
        </div>
      </div>
    </section>
  );
}
```

### Complete Block Registry

```ts
// payload/blocks/index.ts
import { CTABlock } from './CTABlock';

// Register CTA block in your page/service-page collection's layout field:
// {
//   name: 'layout',
//   type: 'blocks',
//   blocks: [CTABlock, RichTextBlock, TestimonialBlock, FAQBlock, ...],
// }

export { CTABlock };
```

---

## Summary: Implementation Checklist

When Claude Code implements this system, follow this sequence:

### Phase 1 — Data Layer
- [ ] Create `Leads` collection in Payload CMS (Section 4)
- [ ] Create `PhoneNumbers` collection in Payload CMS (Section 3)
- [ ] Create `Testimonials` collection in Payload CMS (Section 7)
- [ ] Create `BusinessInfo` global in Payload CMS (Section 5)
- [ ] Create `CTABlock` block definition (Section 12)
- [ ] Create `/api/leads` API route (Section 4)

### Phase 2 — Tracking Infrastructure
- [ ] Set up PostHog provider in root layout (Section 10)
- [ ] Implement `tracking-events.ts` event taxonomy (Section 10)
- [ ] Implement `attribution.ts` first-touch/last-touch capture (Section 11)
- [ ] Add `AttributionCapture` component to root layout (Section 11)
- [ ] Add `PageEngagementTracker` to service page template (Section 10)
- [ ] Implement `useFormAbandonment` hook (Section 10)

### Phase 3 — Conversion Components
- [ ] Build `ClickToCall` component with PostHog tracking (Section 3)
- [ ] Build `LeadForm` component with inline validation and tracking (Section 4)
- [ ] Build `TrustBar` component (Section 5)
- [ ] Build `UrgencyBanner` component (Section 6)
- [ ] Build `Testimonial` component (Section 7)
- [ ] Build `StickyMobileCTA` component (Section 8)
- [ ] Build `CTABlockRenderer` for Payload blocks (Section 12)

### Phase 4 — Page Template Assembly
- [ ] Wire all components into the service+location page template following the page structure diagram (Section 1)
- [ ] Ensure 5 CTA positions are covered (Section 2)
- [ ] Add mobile-specific CSS utilities (Section 8)
- [ ] Test all tel: links on mobile devices

### Phase 5 — A/B Testing and Optimization
- [ ] Define experiments in `posthog-experiments.ts` (Section 9)
- [ ] Implement feature flag integration in hero CTA (Section 9)
- [ ] Create PostHog dashboards for the 7 key reports (Section 11)
- [ ] Set up PostHog actions for conversion goals (form_submission, phone_click)
- [ ] Configure experiment with proper sample size thresholds

### Phase 6 — Dynamic Number Insertion (if running paid ads)
- [ ] Implement `getDynamicNumber` utility (Section 3)
- [ ] Wire tracking numbers from Payload CMS `PhoneNumbers` collection
- [ ] Verify call attribution flows through to lead records
