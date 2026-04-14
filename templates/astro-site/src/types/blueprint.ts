// ═══════════════════════════════════════════════
// Page Blueprint Design System — Type Definitions
// ═══════════════════════════════════════════════

// Token Types
export type BackgroundToken = 'default' | 'muted' | 'primary' | 'dark' | 'gradient' | 'auto'
export type WidthToken = 'contained' | 'full-bleed' | 'narrow'
export type SpacingToken = 'compact' | 'default' | 'spacious'
export type AnimationToken = 'fade-up' | 'fade-in' | 'stagger' | 'none'

// Core Blueprint Interfaces
export interface PageBlueprint {
  pageType: string
  purpose: string
  sections: SectionDefinition[]
  cro: CROConfig
  seo: BlueprintSEOConfig
  rhythm: RhythmConfig
  // Page-type-specific extensions (only one per blueprint)
  listing?: ListingConfig
  crossProduct?: CrossProductConfig
  blog?: BlogConfig
  contact?: ContactConfig
  team?: TeamConfig
  faq?: FAQConfig
  landing?: LandingConfig
  notFound?: NotFoundConfig
  entityDetail?: EntityDetailConfig
}

export interface SectionDefinition {
  name: string
  required: boolean
  position: 'fixed' | 'flexible'
  blocks: BlockChoice[]
  purpose: string
  background: BackgroundToken
  width: WidthToken
  animation: AnimationToken
}

export interface BlockChoice {
  blockType: string
  priority: 'preferred' | 'alternative'
  when?: string
}

// CRO, SEO, Rhythm Configs
export interface CTAPlacement {
  text: string
  link: string
  phone: string
}

export interface CROConfig {
  primaryCTA: CTAPlacement
  ctaFrequency: number
  trustSignalPositions: string[]
  aboveFoldRequirements: string[]
}

export interface BlueprintSEOConfig {
  schemaTypes: string[]
  metaTitlePattern: string
  metaDescPattern: string
  headingHierarchy: Record<string, string>
  internalLinkingRules: string[]
  noindex?: boolean
  httpStatus?: number
}

export interface RhythmConfig {
  sectionSpacing: SpacingToken
  backgroundAlternation: boolean
  visualBreaks: number[]
}

// Page-Type Extensions
export interface ListingConfig {
  cardComponent: string
  gridColumns: { sm: number; md: number; lg: number }
  cardFields: {
    image: string
    title: string
    subtitle?: string
    description: string
    badge?: string
    link: string
    meta?: string[]
    author?: string
  }
  filterBar: {
    enabled: boolean
    filters: string[]
    position: 'above' | 'sidebar'
  }
  pagination: {
    perPage: number
    layout: 'numbered' | 'load-more'
  }
  featuredPost?: boolean
  emptyState?: {
    heading: string
    message: string
    ctaText: string
    ctaHref: string
  }
}

export interface CrossProductConfig {
  contentUniqueness: {
    minimumUniquePercentage: number
    minimumUniqueWords: number
    minimumTotalWords: number
    qualityScoreThreshold: number
    uniqueSections: string[]
    sharedSections: string[]
    validation: {
      pairwiseSimilarityMax: number
      clusterSimilarityMax: number
      nearDuplicateThreshold: number
      checkFields: string[]
    }
  }
  internalLinkingMesh: {
    siblingsSameLocation: number
    siblingsSameOffering: number
    parentEntityLink: boolean
    parentLocationLink: boolean
  }
  localizationRules: Array<{
    type: string
    pattern: string
    condition: string
  }>
}

export interface BlogConfig {
  readingExperience: {
    maxContentWidth: string
    typographyScale: {
      h1: string
      h2: string
      h3: string
      body: string
      caption: string
    }
    displayReadTime: boolean
  }
  tableOfContents: {
    enabled: boolean
    position: 'sticky-sidebar'
    mobileCollapsible: boolean
    activeTracking: boolean
  }
  socialSharing: {
    position: 'sticky-sidebar'
    mobilePosition: 'bottom-bar'
    breakpoint: string
    platforms: string[]
  }
  authorBio: {
    enabled: boolean
    showPhoto: boolean
    showSocial: boolean
    linkToTeamPage: boolean
  }
  relatedPosts: {
    count: number
    strategy: 'same-category' | 'same-tags' | 'recent'
  }
}

export interface ContactConfig {
  form: {
    source: 'payload-form-builder'
    layout: 'stacked' | 'two-column'
    fields: {
      required: string[]
      optional: string[]
    }
    submitButton: { text: string; style: string }
    successState: { message: string; action: 'show-inline' | 'redirect' }
    rendering: {
      component: string
      island: boolean
    }
  }
  contactDetails: {
    showPhone: boolean
    showEmail: boolean
    showAddress: boolean
    showHours: boolean
  }
  followUp: {
    automationEnabled: boolean
    triggerEmail: string
  }
}

export interface TeamConfig {
  cardVariants: {
    leadership: {
      layout: string
      fields: string[]
      maxItems: number
      gridColumns: { sm: number; md: number }
    }
    standard: {
      layout: string
      fields: string[]
      gridColumns: { sm: number; md: number; lg: number; xl: number }
    }
  }
  interactions: {
    hoverEffect: 'reveal-contact'
    clickAction: 'expand-bio'
  }
  socialLinks: string[]
  filterByRole: boolean
}

export interface FAQConfig {
  grouping: {
    strategy: 'by-entity' | 'flat'
    generalFirst: boolean
    entityOrder: string
  }
  accordion: {
    behavior: 'single-open' | 'multi-open'
    animation: string
    iconStyle: string
    defaultOpen: number
  }
  search: {
    enabled: boolean
    position: string
    placeholder: string
    behavior: string
    noResults: string
  }
  schema: {
    generateFAQPage: boolean
    maxSchemaItems: number
    prioritize: string
  }
}

export interface LandingConfig {
  navigation: {
    showHeader: boolean
    showFooter: boolean
    showBreadcrumbs: boolean
  }
  form: {
    position: string
    sticky: boolean
    fields: string[]
    submitText: string
  }
  phoneNumber: {
    prominent: boolean
    sticky: boolean
    trackingNumber: boolean
  }
  urgency: {
    enabled: boolean
    style: 'banner' | 'countdown' | 'none'
  }
}

export interface NotFoundConfig {
  errorDisplay: {
    heading: string
    subheading?: string
    illustration: string
    tone: string
  }
  recovery: {
    searchEnabled: boolean
    suggestedLinks: string[]
    contactCTA: boolean
  }
  seo: {
    httpStatus: 404
  }
}

export interface EntityDetailConfig {
  featureDisplay: 'list' | 'grid' | 'alternating'
  relatedEntitiesCount: number
  pricingDisplay: boolean
  galleryLayout: 'grid' | 'masonry' | 'carousel'
  testimonialFilter: 'entity-specific'
  testimonialFallback: 'entity-only' | 'featured'
}
