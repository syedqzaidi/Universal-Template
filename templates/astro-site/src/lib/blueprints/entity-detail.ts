import type { PageBlueprint } from '../../types/blueprint'

export const entityDetailBlueprint: PageBlueprint = {
  pageType: 'entity-detail',
  purpose: 'Detailed view of a single entity (service, product, etc.) optimized for conversion',
  sections: [
    { name: 'hero', required: true, position: 'fixed', blocks: [{ blockType: 'hero', priority: 'preferred' }], purpose: 'Entity name and hero image', background: 'dark', width: 'full-bleed', animation: 'fade-in' },
    { name: 'entity-overview', required: true, position: 'fixed', blocks: [{ blockType: 'content', priority: 'preferred' }], purpose: 'Detailed description of the entity', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'features', required: true, position: 'flexible', blocks: [{ blockType: 'serviceDetail', priority: 'preferred' }], purpose: 'Feature list or key details', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'pricing', required: false, position: 'flexible', blocks: [{ blockType: 'pricing', priority: 'preferred', when: 'entity has pricing data' }], purpose: 'Pricing information if applicable', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'mid-cta', required: true, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Conversion point after feature details', background: 'primary', width: 'contained', animation: 'fade-up' },
    { name: 'gallery', required: false, position: 'flexible', blocks: [{ blockType: 'gallery', priority: 'preferred' }], purpose: 'Visual showcase of the entity', background: 'default', width: 'full-bleed', animation: 'fade-in' },
    { name: 'testimonials', required: true, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }], purpose: 'Entity-specific social proof', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'faq', required: false, position: 'flexible', blocks: [{ blockType: 'faq', priority: 'preferred' }], purpose: 'Entity-specific FAQ', background: 'default', width: 'narrow', animation: 'none' },
    { name: 'related-entities', required: true, position: 'fixed', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Internal linking to related entities', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion opportunity', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'contextual to entity', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 3,
    trustSignalPositions: ['testimonials'],
    aboveFoldRequirements: ['entity name', 'hero image', 'CTA button'],
  },
  seo: {
    schemaTypes: ['Service', 'FAQPage', 'BreadcrumbList'],
    metaTitlePattern: '{EntityName} | {BusinessName}',
    metaDescPattern: '{EntityDescription}. {BusinessName} — {CTA}.',
    headingHierarchy: { h1: 'Entity name', h2: 'Section headings', h3: 'Feature names' },
    internalLinkingRules: ['Link to related entities', 'Link to parent listing', 'Link to cross-product pages'],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: true, visualBreaks: [4] },
  entityDetail: {
    featureDisplay: 'alternating',
    relatedEntitiesCount: 5,
    pricingDisplay: true,
    galleryLayout: 'grid',
    testimonialFilter: 'entity-specific',
    testimonialFallback: 'entity-only',
  },
}
