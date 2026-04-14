import type { PageBlueprint } from '../../types/blueprint'

export const landingPageBlueprint: PageBlueprint = {
  pageType: 'landing-page',
  purpose: 'High-conversion landing page with no navigation distractions',
  sections: [
    { name: 'hero-with-form', required: true, position: 'fixed', blocks: [{ blockType: 'hero', priority: 'preferred' }], purpose: 'Hero with embedded lead form', background: 'dark', width: 'full-bleed', animation: 'fade-in' },
    { name: 'trust-bar', required: true, position: 'fixed', blocks: [{ blockType: 'stats', priority: 'preferred' }], purpose: 'Trust metrics', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'problem-agitation', required: true, position: 'flexible', blocks: [{ blockType: 'content', priority: 'preferred' }], purpose: 'Agitate the problem the user faces', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'solution', required: true, position: 'flexible', blocks: [{ blockType: 'serviceDetail', priority: 'preferred' }], purpose: 'Present the solution', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'mid-cta', required: true, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Mid-page conversion point', background: 'primary', width: 'contained', animation: 'fade-up' },
    { name: 'social-proof', required: true, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }], purpose: 'Customer proof points', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'process', required: false, position: 'flexible', blocks: [{ blockType: 'stats', priority: 'preferred' }], purpose: 'How it works steps', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'objections', required: false, position: 'flexible', blocks: [{ blockType: 'faq', priority: 'preferred' }], purpose: 'Overcome objections via FAQ', background: 'default', width: 'narrow', animation: 'none' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion with urgency', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'Get My Free Quote', link: '', phone: 'tracking number' },
    ctaFrequency: 3,
    trustSignalPositions: ['trust-bar', 'social-proof'],
    aboveFoldRequirements: ['headline', 'form or CTA', 'phone number'],
  },
  seo: {
    schemaTypes: ['WebPage'],
    metaTitlePattern: '{OfferHeadline} | {BusinessName}',
    metaDescPattern: '{OfferDescription}. {CTA}.',
    headingHierarchy: { h1: 'Offer headline', h2: 'Section headings' },
    internalLinkingRules: [],
    noindex: true,
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: true, visualBreaks: [4] },
  landing: {
    navigation: { showHeader: false, showFooter: false, showBreadcrumbs: false },
    form: { position: 'sidebar', sticky: true, fields: ['name', 'email', 'phone'], submitText: 'Get My Free Quote' },
    phoneNumber: { prominent: true, sticky: true, trackingNumber: true },
    urgency: { enabled: false, style: 'none' },
  },
}
