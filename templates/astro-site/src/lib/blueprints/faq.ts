import type { PageBlueprint } from '../../types/blueprint'

export const faqBlueprint: PageBlueprint = {
  pageType: 'faq',
  purpose: 'Comprehensive FAQ page organized by category with search',
  sections: [
    { name: 'page-header', required: true, position: 'fixed', blocks: [], purpose: 'FAQ title + search bar', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'faq-by-category', required: true, position: 'fixed', blocks: [{ blockType: 'faq', priority: 'preferred' }], purpose: 'FAQ accordions grouped by entity/category', background: 'default', width: 'narrow', animation: 'none' },
    { name: 'still-have-questions', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Contact CTA for unanswered questions', background: 'primary', width: 'contained', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'Still have questions? Contact us', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: ['FAQ title', 'search input'],
  },
  seo: {
    schemaTypes: ['FAQPage', 'BreadcrumbList'],
    metaTitlePattern: 'FAQ | {BusinessName}',
    metaDescPattern: 'Frequently asked questions about {BusinessName}.',
    headingHierarchy: { h1: 'Frequently Asked Questions', h2: 'Category names', h3: 'Questions' },
    internalLinkingRules: ['Link to relevant entity pages from answers'],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: false, visualBreaks: [] },
  faq: {
    grouping: { strategy: 'by-entity', generalFirst: true, entityOrder: 'alphabetical' },
    accordion: { behavior: 'single-open', animation: 'slide-down', iconStyle: 'chevron', defaultOpen: 0 },
    search: { enabled: true, position: 'below-header', placeholder: 'Search FAQs...', behavior: 'client-side-filter', noResults: 'No matching questions found.' },
    schema: { generateFAQPage: true, maxSchemaItems: 50, prioritize: 'most-common' },
  },
}
