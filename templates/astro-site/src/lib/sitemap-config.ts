export interface SitemapCollection {
  slug: string
  pathPrefix: string
  changefreq: string
  priority: number
  getPath: (doc: any) => string
}

export const sitemapCollections: SitemapCollection[] = [
  {
    slug: 'services',
    pathPrefix: '/services',
    changefreq: 'monthly',
    priority: 0.8,
    getPath: (d) => `/${d.slug}`,
  },
  {
    slug: 'locations',
    pathPrefix: '/locations',
    changefreq: 'monthly',
    priority: 0.7,
    getPath: (d) => `/${d.slug}`,
  },
  {
    slug: 'service-pages',
    pathPrefix: '/services',
    changefreq: 'monthly',
    priority: 0.6,
    getPath: (d) => `/${d.service?.slug}/${d.location?.slug}`,
  },
  {
    slug: 'blog-posts',
    pathPrefix: '/blog',
    changefreq: 'weekly',
    priority: 0.5,
    getPath: (d) => `/${d.slug}`,
  },
  {
    slug: 'pages',
    pathPrefix: '',
    changefreq: 'monthly',
    priority: 0.4,
    getPath: (d) => `/${d.slug}`,
  },
]
