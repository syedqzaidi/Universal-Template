import type { PageBlueprint } from '../../types/blueprint'

export const crossProductBlueprint: PageBlueprint = {
  pageType: 'cross-product',
  purpose: 'Entity x Location programmatic SEO page with unique localized content',
  sections: [
    { name: 'hero', required: true, position: 'fixed', blocks: [{ blockType: 'hero', priority: 'preferred' }], purpose: 'Entity + location hero', background: 'dark', width: 'full-bleed', animation: 'fade-in' },
    { name: 'local-introduction', required: true, position: 'fixed', blocks: [{ blockType: 'content', priority: 'preferred' }], purpose: 'Unique localized introduction content', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'offering-details', required: true, position: 'flexible', blocks: [{ blockType: 'serviceDetail', priority: 'preferred' }], purpose: 'Localized entity features and details', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'pricing', required: false, position: 'flexible', blocks: [{ blockType: 'pricing', priority: 'preferred', when: 'entity has pricing data' }], purpose: 'Local pricing if applicable', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'mid-cta', required: true, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Conversion point', background: 'primary', width: 'contained', animation: 'fade-up' },
    { name: 'local-testimonials', required: true, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }], purpose: 'Location-specific social proof', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'location-info', required: true, position: 'flexible', blocks: [{ blockType: 'locationMap', priority: 'preferred', when: 'business has physical locations' }], purpose: 'Location details and map', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'faq', required: false, position: 'flexible', blocks: [{ blockType: 'faq', priority: 'preferred' }], purpose: 'Location-specific FAQ', background: 'default', width: 'narrow', animation: 'none' },
    { name: 'related-cross-products', required: true, position: 'fixed', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Internal linking mesh', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion opportunity', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'contextual to entity + location', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 3,
    trustSignalPositions: ['local-testimonials'],
    aboveFoldRequirements: ['entity + location name', 'CTA'],
  },
  seo: {
    schemaTypes: ['Service', 'LocalBusiness', 'FAQPage', 'BreadcrumbList'],
    metaTitlePattern: '{EntityName} in {LocationName} | {BusinessName}',
    metaDescPattern: '{EntityName} in {LocationName}. {BusinessName} — {CTA}. Call {Phone}.',
    headingHierarchy: { h1: 'Entity in Location', h2: 'Section headings', h3: 'Detail headings' },
    internalLinkingRules: ['Link to 3 same-location siblings', 'Link to 3 same-entity siblings', 'Link to parent entity', 'Link to parent location'],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: true, visualBreaks: [4] },
  crossProduct: {
    contentUniqueness: {
      minimumUniquePercentage: 55,
      minimumUniqueWords: 600,
      minimumTotalWords: 1000,
      qualityScoreThreshold: 65,
      uniqueSections: ['local-introduction', 'offering-details', 'faq', 'location-info'],
      sharedSections: ['hero', 'pricing', 'final-cta'],
      validation: { pairwiseSimilarityMax: 0.45, clusterSimilarityMax: 0.40, nearDuplicateThreshold: 0.60, checkFields: ['introduction', 'localContent', 'layout'] },
    },
    internalLinkingMesh: { siblingsSameLocation: 3, siblingsSameOffering: 3, parentEntityLink: true, parentLocationLink: true },
    localizationRules: [],
  },
}
