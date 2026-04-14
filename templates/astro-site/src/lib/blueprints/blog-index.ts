import type { PageBlueprint } from '../../types/blueprint'

export const blogIndexBlueprint: PageBlueprint = {
  pageType: 'blog-index',
  purpose: 'Blog listing page with featured post, filtering, and pagination',
  sections: [
    { name: 'page-header', required: true, position: 'fixed', blocks: [], purpose: 'Blog page title', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'featured-post', required: false, position: 'fixed', blocks: [], purpose: 'Featured/latest blog post highlight', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'filter-and-grid', required: true, position: 'fixed', blocks: [], purpose: 'Category filter + blog post card grid', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'newsletter-cta', required: false, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Newsletter signup CTA', background: 'muted', width: 'narrow', animation: 'fade-up' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion opportunity', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'dynamic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: ['blog title', 'featured post or post grid'],
  },
  seo: {
    schemaTypes: ['CollectionPage', 'BreadcrumbList'],
    metaTitlePattern: 'Blog | {BusinessName}',
    metaDescPattern: 'Latest articles and insights from {BusinessName}.',
    headingHierarchy: { h1: 'Blog', h2: 'Post titles' },
    internalLinkingRules: ['Link to each blog post'],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: false, visualBreaks: [] },
  listing: {
    cardComponent: 'BlogCard',
    gridColumns: { sm: 1, md: 2, lg: 3 },
    cardFields: { image: 'featuredImage', title: 'title', description: 'excerpt', link: 'slug', meta: ['date', 'readTime'], author: 'author.name' },
    filterBar: { enabled: true, filters: ['category'], position: 'above' },
    pagination: { perPage: 12, layout: 'load-more' },
    featuredPost: true,
  },
}
