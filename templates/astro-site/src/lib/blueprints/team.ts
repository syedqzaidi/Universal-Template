import type { PageBlueprint } from '../../types/blueprint'

export const teamBlueprint: PageBlueprint = {
  pageType: 'team',
  purpose: 'Team directory showcasing leadership and staff members',
  sections: [
    { name: 'page-header', required: true, position: 'fixed', blocks: [], purpose: 'Team page title and intro', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'leadership', required: false, position: 'fixed', blocks: [{ blockType: 'team', priority: 'preferred' }], purpose: 'Leadership team showcase', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'team-grid', required: true, position: 'fixed', blocks: [{ blockType: 'team', priority: 'preferred' }], purpose: 'Full team grid', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'credentials', required: false, position: 'flexible', blocks: [{ blockType: 'stats', priority: 'preferred' }], purpose: 'Team credentials and certifications', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'culture', required: false, position: 'flexible', blocks: [{ blockType: 'gallery', priority: 'preferred' }], purpose: 'Team culture photos', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'careers-cta', required: false, position: 'flexible', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Careers/hiring CTA', background: 'primary', width: 'contained', animation: 'fade-up' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Contact CTA', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'dynamic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['credentials'],
    aboveFoldRequirements: ['team title', 'team members'],
  },
  seo: {
    schemaTypes: ['WebPage', 'BreadcrumbList'],
    metaTitlePattern: 'Our Team | {BusinessName}',
    metaDescPattern: 'Meet the team at {BusinessName}.',
    headingHierarchy: { h1: 'Our Team', h2: 'Section headings', h3: 'Member names' },
    internalLinkingRules: [],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: false, visualBreaks: [] },
  team: {
    cardVariants: {
      leadership: { layout: 'horizontal', fields: ['name', 'role', 'bio', 'photo', 'social'], maxItems: 4, gridColumns: { sm: 1, md: 1 } },
      standard: { layout: 'vertical card', fields: ['name', 'role', 'photo'], gridColumns: { sm: 1, md: 2, lg: 3, xl: 4 } },
    },
    interactions: { hoverEffect: 'reveal-contact', clickAction: 'expand-bio' },
    socialLinks: ['linkedin', 'twitter', 'email'],
    filterByRole: false,
  },
}
