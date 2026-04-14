import type { PageBlueprint } from '../../types/blueprint'

export const aboutBlueprint: PageBlueprint = {
  pageType: 'about',
  purpose: 'Company story, mission, values, and team preview',
  sections: [
    { name: 'hero', required: true, position: 'fixed', blocks: [{ blockType: 'hero', priority: 'preferred' }], purpose: 'About page hero', background: 'dark', width: 'full-bleed', animation: 'fade-in' },
    { name: 'origin-story', required: true, position: 'fixed', blocks: [{ blockType: 'content', priority: 'preferred' }], purpose: 'Company founding story', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'mission-values', required: true, position: 'flexible', blocks: [{ blockType: 'serviceDetail', priority: 'preferred' }], purpose: 'Mission statement and core values', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'by-the-numbers', required: false, position: 'flexible', blocks: [{ blockType: 'stats', priority: 'preferred' }], purpose: 'Company metrics and achievements', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'team-preview', required: false, position: 'flexible', blocks: [{ blockType: 'team', priority: 'preferred' }], purpose: 'Key team members preview', background: 'default', width: 'contained', animation: 'stagger' },
    { name: 'social-proof', required: false, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }], purpose: 'Customer testimonials', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'community', required: false, position: 'flexible', blocks: [{ blockType: 'gallery', priority: 'preferred' }], purpose: 'Community involvement photos', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'final-cta', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Contact CTA', background: 'dark', width: 'full-bleed', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'dynamic', link: '/contact', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['by-the-numbers', 'social-proof'],
    aboveFoldRequirements: ['company name', 'hero image'],
  },
  seo: {
    schemaTypes: ['Organization', 'BreadcrumbList'],
    metaTitlePattern: 'About Us | {BusinessName}',
    metaDescPattern: 'Learn about {BusinessName} — our story, mission, and team.',
    headingHierarchy: { h1: 'About {BusinessName}', h2: 'Section headings' },
    internalLinkingRules: ['Link to team page', 'Link to contact page'],
  },
  rhythm: { sectionSpacing: 'spacious', backgroundAlternation: true, visualBreaks: [3] },
}
