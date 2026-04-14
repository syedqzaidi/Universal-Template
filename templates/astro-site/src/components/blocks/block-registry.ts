/**
 * Block registry — metadata layer for block type validation.
 *
 * Note: Astro can't dynamically import .astro components at runtime.
 * BlockRenderer uses static imports + conditional rendering.
 * This registry serves as a validation/metadata layer for generation tools.
 */
export const blockRegistry: Record<string, string> = {
  hero: 'HeroBlock',
  serviceDetail: 'ServiceDetailBlock',
  faq: 'FAQBlock',
  testimonials: 'TestimonialsBlock',
  cta: 'CTABlock',
  locationMap: 'LocationMapBlock',
  content: 'ContentBlock',
  stats: 'StatsBlock',
  gallery: 'GalleryBlock',
  pricing: 'PricingBlock',
  team: 'TeamBlock',
  relatedLinks: 'RelatedLinksBlock',
}

export function registerBlock(slug: string, componentName: string): void {
  blockRegistry[slug] = componentName
}

export function isKnownBlock(slug: string): boolean {
  return slug in blockRegistry
}

export function getBlockComponentName(slug: string): string | undefined {
  return blockRegistry[slug]
}
