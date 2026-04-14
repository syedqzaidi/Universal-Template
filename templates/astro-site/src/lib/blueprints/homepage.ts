import type { PageBlueprint } from '../../types/blueprint'

export const homepageBlueprint: PageBlueprint = {
  pageType: 'homepage',
  purpose: 'Primary landing page that establishes brand, showcases offerings, and drives conversions',
  sections: [
    { name: 'hero', required: true, position: 'fixed', blocks: [{ blockType: 'hero', priority: 'preferred' }], purpose: 'Establish brand and primary value proposition', background: 'dark', width: 'full-bleed', animation: 'fade-in' },
    { name: 'trust-bar', required: true, position: 'fixed', blocks: [{ blockType: 'stats', priority: 'preferred' }], purpose: 'Build immediate credibility with key metrics', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'primary-offerings', required: true, position: 'fixed', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Showcase main services/offerings', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'mid-page-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Capture visitors who are ready to act', background: 'primary', width: 'contained', animation: 'fade-up' },
    { name: 'content-preview', required: false, position: 'flexible', blocks: [{ blockType: 'content', priority: 'preferred' }], purpose: 'Provide overview content or about summary', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'social-proof', required: true, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }, { blockType: 'stats', priority: 'alternative' }], purpose: 'Reinforce trust with customer testimonials', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'why-us', required: false, position: 'flexible', blocks: [{ blockType: 'serviceDetail', priority: 'preferred' }, { blockType: 'content', priority: 'alternative' }], purpose: 'Differentiate from competitors', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'faq-preview', required: false, position: 'flexible', blocks: [{ blockType: 'faq', priority: 'preferred' }], purpose: 'Address common questions to reduce friction', background: 'default', width: 'narrow', animation: 'none' },
    { name: 'location-overview', required: false, position: 'flexible', blocks: [{ blockType: 'locationMap', priority: 'preferred', when: 'business has physical locations' }], purpose: 'Show service area for local businesses', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion opportunity', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'dynamic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 4,
    trustSignalPositions: ['trust-bar', 'social-proof'],
    aboveFoldRequirements: ['hero with CTA', 'phone number'],
  },
  seo: {
    schemaTypes: ['Organization', 'WebSite', 'LocalBusiness'],
    metaTitlePattern: '{BusinessName} — {Tagline}',
    metaDescPattern: '{BusinessType} in {Location}. {ValueProp}. Call {Phone}.',
    headingHierarchy: { h1: 'Business name + value prop', h2: 'Section headings', h3: 'Subsection details' },
    internalLinkingRules: ['Link to all primary entity pages', 'Link to top locations'],
  },
  rhythm: { sectionSpacing: 'spacious', backgroundAlternation: true, visualBreaks: [3, 7] },
}
