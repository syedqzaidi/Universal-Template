import type { SiteSettings } from '@template/shared/payload/types'

export function generateSchemas(
  pageType: string,
  data: any,
  baseUrl: string,
  siteSettings: SiteSettings,
): Record<string, any>[] {
  const schemas: Record<string, any>[] = []

  switch (pageType) {
    case 'home':
      schemas.push(generateOrganizationSchema(siteSettings, baseUrl))
      schemas.push(generateWebSiteSchema(baseUrl))
      if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
        const reviewSchema = generateReviewSchema(data.testimonials, siteSettings)
        if (reviewSchema) schemas.push(reviewSchema)
      }
      break
    case 'service':
      schemas.push(generateServiceSchema(data, baseUrl, siteSettings))
      schemas.push(generateOrganizationSchema(siteSettings, baseUrl))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Services', url: `${baseUrl}/services` },
        { name: data.name, url: `${baseUrl}/services/${data.slug}` },
      ]))
      break
    case 'location':
      schemas.push(generateLocalBusinessSchema(data, null, baseUrl, siteSettings))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Locations', url: `${baseUrl}/locations` },
        { name: data.displayName, url: `${baseUrl}/locations/${data.slug}` },
      ]))
      break
    case 'service-location': {
      const { service, location, page } = data
      schemas.push(generateLocalBusinessSchema(location, service, baseUrl, siteSettings))
      schemas.push(generateServiceSchema(service, baseUrl, siteSettings))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Services', url: `${baseUrl}/services` },
        { name: service?.name, url: `${baseUrl}/services/${service?.slug}` },
        { name: location?.displayName, url: `${baseUrl}/services/${service?.slug}/${location?.slug}` },
      ]))
      break
    }
    case 'blog':
      schemas.push(generateArticleSchema(data, baseUrl))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Blog', url: `${baseUrl}/blog` },
        { name: data.title, url: `${baseUrl}/blog/${data.slug}` },
      ]))
      break
    case 'faq':
      if (data.faqs && Array.isArray(data.faqs)) {
        schemas.push(generateFAQSchema(data.faqs))
      }
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'FAQ', url: `${baseUrl}/faq` },
      ]))
      break
    case 'team':
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: 'Our Team', url: `${baseUrl}/team` },
      ]))
      break
    case 'page':
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: baseUrl },
        { name: data.title || data.name || '', url: `${baseUrl}/${data.slug || ''}` },
      ]))
      break
  }

  return schemas
}

export function generateServiceSchema(service: any, baseUrl: string, siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': service.schemaType || 'Service',
    name: service.name,
    description: service.shortDescription,
    url: `${baseUrl}/services/${service.slug}`,
    image: typeof service.featuredImage === 'object' ? service.featuredImage?.url : undefined,
    provider: {
      '@type': 'LocalBusiness',
      name: siteSettings.siteName,
      url: baseUrl,
    },
    ...(service.pricing?.showPricing && {
      offers: {
        '@type': 'Offer',
        priceRange: service.pricing.priceRange,
      },
    }),
  }
}

export function generateLocalBusinessSchema(location: any, service: any, baseUrl: string, siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: service ? `${siteSettings.siteName} - ${location.displayName}` : siteSettings.siteName,
    url: service
      ? `${baseUrl}/services/${service.slug}/${location.slug}`
      : `${baseUrl}/locations/${location.slug}`,
    description: service
      ? `${service.name} services in ${location.displayName}`
      : `Services in ${location.displayName}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.city,
      addressRegion: location.stateCode,
    },
    ...(location.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      },
    }),
    areaServed: {
      '@type': 'City',
      name: location.city,
    },
  }
}

export function generateFAQSchema(faqs: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: typeof faq.answer === 'string' ? faq.answer : extractTextFromRichText(faq.answer),
      },
    })),
  }
}

export function generateReviewSchema(testimonials: any[], siteSettings: SiteSettings) {
  if (!testimonials.length) return null
  const ratings = testimonials.map((t) => t.rating).filter(Boolean)
  const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteSettings.siteName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: testimonials.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: testimonials.map((t) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.clientName },
      reviewRating: { '@type': 'Rating', ratingValue: t.rating },
      reviewBody: t.review,
      datePublished: t.date,
    })),
  }
}

export function generateArticleSchema(post: any, baseUrl: string) {
  const authorObj = typeof post.author === 'object' ? post.author : null
  const authorName = post.authorOverride || authorObj?.name || 'Staff'
  const authorUrl = authorObj?.slug ? `${baseUrl}/team#${authorObj.slug}` : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    url: `${baseUrl}/blog/${post.slug}`,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
    },
    image: typeof post.featuredImage === 'object' ? post.featuredImage?.url : undefined,
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationSchema(settings: SiteSettings, baseUrl: string) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: baseUrl,
    logo: typeof settings?.logo === 'object' ? (settings.logo as any)?.url : undefined,
    ...(settings?.phone && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: settings.phone,
        contactType: 'customer service',
      },
    }),
    ...(settings?.socialLinks && {
      sameAs: settings.socialLinks.map((s) => s.url),
    }),
  }

  if (settings?.businessSchema && typeof settings.businessSchema === 'object') {
    return { ...baseSchema, ...settings.businessSchema }
  }

  return baseSchema
}

export function generateWebSiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function extractTextFromRichText(richText: any): string {
  if (!richText?.root?.children) return ''
  return richText.root.children
    .map((node: any) => {
      if (node.type === 'paragraph') {
        return node.children?.map((child: any) => child.text || '').join('') || ''
      }
      return ''
    })
    .join(' ')
    .trim()
}
