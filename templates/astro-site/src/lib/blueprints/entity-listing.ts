import type { PageBlueprint } from '../../types/blueprint'

export const entityListingBlueprint: PageBlueprint = {
  pageType: 'entity-listing',
  purpose: 'Grid/list view of all entities in a collection with filtering and pagination',
  sections: [
    { name: 'page-header', required: true, position: 'fixed', blocks: [], purpose: 'Page title and description', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'filter-and-grid', required: true, position: 'fixed', blocks: [], purpose: 'FilterBar + entity card grid', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'mid-cta', required: true, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Conversion point mid-page', background: 'primary', width: 'contained', animation: 'fade-up' },
    { name: 'why-us', required: false, position: 'flexible', blocks: [{ blockType: 'serviceDetail', priority: 'preferred' }, { blockType: 'content', priority: 'alternative' }], purpose: 'Why choose us section', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'social-proof', required: false, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }, { blockType: 'stats', priority: 'alternative' }], purpose: 'Customer testimonials', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion opportunity', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'dynamic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['social-proof'],
    aboveFoldRequirements: ['page title', 'entity cards'],
  },
  seo: {
    schemaTypes: ['CollectionPage', 'BreadcrumbList'],
    metaTitlePattern: '{CollectionName} | {BusinessName}',
    metaDescPattern: 'Browse our {CollectionName}. {BusinessName}.',
    headingHierarchy: { h1: 'Collection name', h2: 'Section headings', h3: 'Card titles' },
    internalLinkingRules: ['Link to each entity detail page'],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: false, visualBreaks: [] },
  listing: {
    cardComponent: 'EntityCard',
    gridColumns: { sm: 1, md: 2, lg: 3 },
    cardFields: { image: 'featuredImage', title: 'name', subtitle: 'category', description: 'shortDescription', link: 'slug' },
    filterBar: { enabled: true, filters: ['category'], position: 'above' },
    pagination: { perPage: 12, layout: 'load-more' },
  },
}
