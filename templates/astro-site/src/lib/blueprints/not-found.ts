import type { PageBlueprint } from '../../types/blueprint'

export const notFoundBlueprint: PageBlueprint = {
  pageType: '404',
  purpose: '404 error page with helpful recovery paths',
  sections: [
    { name: 'error-message', required: true, position: 'fixed', blocks: [], purpose: 'Friendly 404 message', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'search', required: true, position: 'fixed', blocks: [], purpose: 'Search input for recovery', background: 'default', width: 'narrow', animation: 'fade-up' },
    { name: 'popular-pages', required: true, position: 'fixed', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Links to popular pages', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'quick-links', required: false, position: 'flexible', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Quick navigation links', background: 'muted', width: 'contained', animation: 'stagger' },
    { name: 'contact-fallback', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Contact us fallback CTA', background: 'primary', width: 'contained', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'Contact Us', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: ['error message', 'search input'],
  },
  seo: {
    schemaTypes: [],
    metaTitlePattern: 'Page Not Found | {BusinessName}',
    metaDescPattern: '',
    headingHierarchy: { h1: 'Page Not Found' },
    internalLinkingRules: [],
    httpStatus: 404,
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: false, visualBreaks: [] },
  notFound: {
    errorDisplay: { heading: 'Page Not Found', subheading: 'The page you\'re looking for doesn\'t exist or has been moved.', illustration: 'minimal', tone: 'friendly' },
    recovery: { searchEnabled: true, suggestedLinks: ['/', '/services', '/contact'], contactCTA: true },
    seo: { httpStatus: 404 },
  },
}
