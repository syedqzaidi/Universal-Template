import type { PageBlueprint } from '../../types/blueprint'

export const blogPostBlueprint: PageBlueprint = {
  pageType: 'blog-post',
  purpose: 'Individual blog article with reading experience optimization',
  sections: [
    { name: 'article-header', required: true, position: 'fixed', blocks: [], purpose: 'Article title, author, date, readTime', background: 'default', width: 'narrow', animation: 'fade-in' },
    { name: 'featured-image', required: true, position: 'fixed', blocks: [], purpose: 'Featured image display', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'article-body', required: true, position: 'fixed', blocks: [], purpose: 'Lexical richText article content', background: 'default', width: 'narrow', animation: 'none' },
    { name: 'in-content-cta', required: true, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'CTA within article flow', background: 'primary', width: 'narrow', animation: 'fade-up' },
    { name: 'author-bio', required: true, position: 'fixed', blocks: [], purpose: 'Author information and links', background: 'muted', width: 'narrow', animation: 'fade-up' },
    { name: 'related-entities', required: false, position: 'flexible', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Links to related services/entities', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'related-posts', required: true, position: 'fixed', blocks: [{ blockType: 'relatedLinks', priority: 'preferred' }], purpose: 'Links to related blog posts', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Final conversion opportunity', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'contextual to article topic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: [],
    aboveFoldRequirements: ['article title', 'featured image'],
  },
  seo: {
    schemaTypes: ['Article', 'Person', 'BreadcrumbList'],
    metaTitlePattern: '{ArticleTitle} | {BusinessName} Blog',
    metaDescPattern: '{ArticleExcerpt}',
    headingHierarchy: { h1: 'Article title', h2: 'Article sections', h3: 'Subsections' },
    internalLinkingRules: ['Link to related services', 'Link to related blog posts'],
  },
  rhythm: { sectionSpacing: 'compact', backgroundAlternation: false, visualBreaks: [] },
  blog: {
    readingExperience: {
      maxContentWidth: 'max-w-3xl',
      typographyScale: {
        h1: 'text-4xl md:text-5xl font-bold leading-tight',
        h2: 'text-2xl md:text-3xl font-semibold mt-12 mb-4',
        h3: 'text-xl md:text-2xl font-semibold mt-8 mb-3',
        body: 'text-lg leading-relaxed text-muted-foreground',
        caption: 'text-sm text-muted-foreground',
      },
      displayReadTime: true,
    },
    tableOfContents: { enabled: true, position: 'sticky-sidebar', mobileCollapsible: true, activeTracking: true },
    socialSharing: { position: 'sticky-sidebar', mobilePosition: 'bottom-bar', breakpoint: 'lg', platforms: ['twitter', 'facebook', 'linkedin', 'copy'] },
    authorBio: { enabled: true, showPhoto: true, showSocial: true, linkToTeamPage: true },
    relatedPosts: { count: 3, strategy: 'same-category' },
  },
}
