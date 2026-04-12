// -- Client Config --

export interface PayloadClientConfig {
  apiUrl: string            // e.g., "http://localhost:3158/api"
  apiKey?: string           // Optional API key for authenticated requests
  authCollection?: string   // Auth collection slug for API key header (default: 'users')
  defaultDepth?: number     // Default relationship population depth (default: 1)
  timeout?: number          // Request timeout in milliseconds (default: 30000)
}

// -- Generic Response --

export interface PayloadListResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

// -- Media --

export interface MediaSize {
  url: string
  width: number
  height: number | null
  mimeType: string
  filesize: number
  filename: string
}

export interface Media {
  id: string
  alt: string
  caption?: string
  url: string
  filename: string
  mimeType: string
  filesize: number
  width: number
  height: number
  sizes: {
    thumbnail?: MediaSize
    card?: MediaSize
    hero?: MediaSize
    heroMobile?: MediaSize
    gallery?: MediaSize
    galleryThumb?: MediaSize
    og?: MediaSize
    square?: MediaSize
    content?: MediaSize
  }
  createdAt: string
  updatedAt: string
}

// -- Collections --

export interface Service {
  id: string
  name: string
  slug: string
  category: 'residential' | 'commercial' | 'emergency' | 'maintenance'
  shortDescription: string
  description?: any // Lexical rich text JSON
  featuredImage?: Media | string
  gallery?: Array<{ image: Media | string; caption?: string }>
  icon?: string
  features?: Array<{ title: string; description?: string; icon?: string }>
  pricing?: {
    startingAt?: number
    priceRange?: string
    unit?: string
    showPricing?: boolean
  }
  layout?: Block[]
  relatedServices?: (Service | string)[]
  faqs?: (FAQ | string)[]
  seoTitle?: string
  seoDescription?: string
  schemaType?: string
  keywords?: KeywordGroup
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  displayName: string
  slug: string
  type: 'city' | 'neighborhood' | 'county' | 'region' | 'zip' | 'state'
  city: string
  state: string
  stateCode: string
  zipCodes?: string
  coordinates?: [number, number] // [longitude, latitude]
  population?: number
  timezone?: string
  description?: any // Lexical rich text JSON
  areaInfo?: string
  featuredImage?: Media | string
  parentLocation?: Location | string
  nearbyLocations?: (Location | string)[]
  seoTitle?: string
  seoDescription?: string
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface ServicePage {
  id: string
  title: string
  slug: string
  service: Service | string
  location: Location | string
  headline?: string
  introduction?: any // Lexical rich text JSON
  localContent?: any // Lexical rich text JSON
  layout?: Block[]
  seoTitle?: string
  seoDescription?: string
  relatedServicePages?: (ServicePage | string)[]
  contentSource?: 'template' | 'ai' | 'manual' | 'enriched'
  contentQualityScore?: number
  keywords?: KeywordGroup & { geoModifiers?: string }
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: any // Lexical rich text JSON
  featuredImage?: Media | string
  author?: TeamMember | string
  authorOverride?: string
  publishedAt?: string
  category?: 'tips' | 'news' | 'case-studies' | 'updates'
  tags?: Array<{ tag: string }>
  relatedServices?: (Service | string)[]
  relatedLocations?: (Location | string)[]
  seoTitle?: string
  seoDescription?: string
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface FAQ {
  id: string
  question: string
  answer: any // Lexical rich text JSON
  service?: Service | string
  location?: Location | string
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface Testimonial {
  id: string
  clientName: string
  clientTitle?: string
  review: string
  rating: number
  date?: string
  avatar?: Media | string
  service?: Service | string
  location?: Location | string
  featured?: boolean
  source?: 'google' | 'yelp' | 'direct' | 'facebook'
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio?: any // Lexical rich text JSON
  photo?: Media | string
  email?: string
  phone?: string
  locations?: (Location | string)[]
  specialties?: (Service | string)[]
  certifications?: Array<{ name: string; issuer?: string; year?: number }>
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: Media | string
  content?: any // Lexical rich text JSON
  meta?: SEOMeta
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

// -- Globals --

export interface SiteSettings {
  siteName: string
  tagline?: string
  logo?: Media | string
  favicon?: Media | string
  phone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    stateCode?: string
    zip?: string
    country?: string
  }
  socialLinks?: Array<{
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'yelp' | 'google'
    url: string
  }>
  footerText?: string
  defaultSeoImage?: Media | string
  googleAnalyticsId?: string
  businessSchema?: Record<string, any>
  rebuildMode?: 'manual' | 'auto' | 'auto-review'
  webhookUrl?: string
}

// -- Blocks --

export interface Block {
  id?: string
  blockType: string
  [key: string]: any
}

// -- SEO --

export interface SEOMeta {
  title?: string
  description?: string
  image?: Media | string
  ogTitle?: string
  robots?: string
  jsonLd?: Record<string, any>
}

export interface KeywordGroup {
  primary?: string
  secondary?: Array<{ keyword: string }>
  longTail?: Array<{ phrase: string }>
  lsiTerms?: string
}

// -- Client Interface --

export interface PayloadClient {
  // Generic methods
  fetch: <T>(endpoint: string, params?: Record<string, string>) => Promise<T>
  fetchList: <T>(collection: string, params?: Record<string, string>) => Promise<PayloadListResponse<T>>
  fetchById: <T>(collection: string, id: string, depth?: number) => Promise<T>
  fetchBySlug: <T>(collection: string, slug: string, depth?: number) => Promise<T | null>
  fetchPublished: <T>(collection: string, params?: Record<string, string>) => Promise<PayloadListResponse<T>>
  fetchPaginated: <T>(collection: string, page: number, limit: number, params?: Record<string, string>) => Promise<PayloadListResponse<T>>
  fetchGlobal: <T>(slug: string) => Promise<T>

  // Typed collection helpers
  getAllServices: (params?: Record<string, string>) => Promise<PayloadListResponse<Service>>
  getServiceBySlug: (slug: string) => Promise<Service | null>
  getAllLocations: (params?: Record<string, string>) => Promise<PayloadListResponse<Location>>
  getLocationBySlug: (slug: string) => Promise<Location | null>
  getAllServicePages: (params?: Record<string, string>) => Promise<PayloadListResponse<ServicePage>>
  getServicePage: (serviceSlug: string, locationSlug: string) => Promise<ServicePage | null>
  getAllBlogPosts: (params?: Record<string, string>) => Promise<PayloadListResponse<BlogPost>>
  getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>
  getFAQs: (params?: Record<string, string>) => Promise<PayloadListResponse<FAQ>>
  getFAQsByService: (serviceId: string) => Promise<PayloadListResponse<FAQ>>
  getFAQsByLocation: (locationId: string) => Promise<PayloadListResponse<FAQ>>
  getTestimonials: (params?: Record<string, string>) => Promise<PayloadListResponse<Testimonial>>
  getFeaturedTestimonials: () => Promise<PayloadListResponse<Testimonial>>
  getTeamMembers: (params?: Record<string, string>) => Promise<PayloadListResponse<TeamMember>>
  getAllPages: (params?: Record<string, string>) => Promise<PayloadListResponse<Page>>
  getPageBySlug: (slug: string) => Promise<Page | null>
  getSiteSettings: () => Promise<SiteSettings>
}
