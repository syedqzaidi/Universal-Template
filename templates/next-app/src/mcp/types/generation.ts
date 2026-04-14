// ═══════════════════════════════════════════════
// Universal Generation Platform — Type Definitions
// ═══════════════════════════════════════════════

// ── Business Model (Top-level analysis output) ──

export interface BusinessModel {
  businessName: string
  businessType: string
  industry: string
  description: string
  entities: EntityDefinition[]
  relationships: Relationship[]
  crossProducts: CrossProduct[]
  primaryConversion: ConversionGoal
  secondaryConversions: ConversionGoal[]
  userJourneys: UserJourney[]
  contentPillars: string[]
  seoStrategy: SEOStrategy
  crmPipeline: PipelineDefinition
  emailSequences: EmailSequence[]
  schemaOrgTypes: string[]
  urlPatterns: URLPattern[]
  navStructure: NavDefinition
}

// ── Entity Definitions ──

export interface EntityDefinition {
  name: string
  slug: string
  purpose: string
  fields: FieldDefinition[]
  hasPublicPages: boolean
  hasVersioning: boolean
  hasBlocks: boolean
  sortField?: string
  adminGroup: string
}

export interface FieldDefinition {
  name: string
  type: 'text' | 'textarea' | 'richText' | 'number' | 'select' | 'checkbox' |
        'date' | 'email' | 'upload' | 'relationship' | 'array' | 'group' | 'point' | 'json'
  required?: boolean
  unique?: boolean
  localized?: boolean
  validation?: string
  options?: string[]
  relationTo?: string
  hasMany?: boolean
  fields?: FieldDefinition[]
  min?: number
  max?: number
  defaultValue?: any
  adminPosition?: 'sidebar'
  description?: string
}

export interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  fieldName: string
  required?: boolean
}

export interface CrossProduct {
  entity1: string
  entity2: string
  slug: string
  urlPattern: string
  titlePattern: string
  purpose: string
}

// ── Conversion & User Journeys ──

export interface ConversionGoal {
  action: string
  type: 'form' | 'phone' | 'link' | 'purchase'
  ctaText: string
  ctaStyle: 'primary' | 'secondary'
}

export interface UserJourney {
  name: string
  steps: string[]
  conversionPoint: string
  intent: 'informational' | 'transactional' | 'navigational'
}

// ── CRM & Email ──

export interface PipelineDefinition {
  name: string
  stages: string[]
  contactProperties: ContactProperty[]
  automations: CRMAutomation[]
}

export interface ContactProperty {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  options?: string[]
  source: string
}

export interface CRMAutomation {
  trigger: string
  action: string
  delay?: string
  condition?: string
}

export interface EmailSequence {
  name: string
  trigger: string
  delay?: string
  subject: string
  purpose: string
  dataFields: string[]
}

// ── SEO & URL Strategy ──

export interface SEOStrategy {
  keywordPatterns: string[]
  targetIntents: string[]
  contentPillars: string[]
  internalLinkingRules: string[]
  localSEO: boolean
}

export interface URLPattern {
  pattern: string
  collection: string
  pageType: string
  priority: number
}

// ── Navigation ──

export interface NavDefinition {
  primary: NavItem[]
  secondary: NavItem[]
  footer: FooterSection[]
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
  collection?: string
  fetchMethod?: string
}

export interface FooterSection {
  heading: string
  links: NavItem[]
}

// ── Generation Output & Manifests ──

export interface GenerationOutput {
  collections: string[]
  blocks: string[]
  hooks: string[]
  globals: string[]
  pages: string[]
  components: string[]
  blockComponents: string[]
  payloadConfigUpdates: string[]
  sharedClientUpdates: string[]
  sharedTypeUpdates: string[]
  seoUpdates: string[]
  sitemapConfig: string
  navConfig: string
  crmConfig: string
  emailTemplates: string[]
  emailTriggers: string
  analyticsConfig: string
  seedScript: string
  buildResult: 'pass' | 'fail'
  errors: string[]
}

export interface GenerationManifest {
  businessModel: string
  startedAt: string
  steps: Record<string, {
    status: 'completed' | 'in-progress' | 'pending' | 'deferred'
    outputs?: string[]
    error?: string
    startedAt?: string
    completedAt?: string
  }>
  generatedFiles: string[]
}

export interface SeedManifest {
  seededAt: string
  entries: Array<{
    collection: string
    id: string
    slug: string
  }>
  progress: {
    current: number
    total: number
  }
}
