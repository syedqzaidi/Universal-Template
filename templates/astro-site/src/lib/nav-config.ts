export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
  dynamic?: {
    collection: string
    pathPrefix: string
    labelField: string
  }
}

export interface FooterSection {
  heading: string
  links?: NavItem[]
  dynamic?: {
    collection: string
    pathPrefix: string
    labelField: string
    limit?: number
  }
}

export const primaryNav: NavItem[] = [
  {
    label: 'Services',
    href: '/services',
    dynamic: {
      collection: 'services',
      pathPrefix: '/services',
      labelField: 'name',
    },
  },
  { label: 'Locations', href: '/locations' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export const secondaryNav: NavItem[] = []

export const footerSections: FooterSection[] = [
  {
    heading: 'Locations',
    dynamic: {
      collection: 'locations',
      pathPrefix: '/locations',
      labelField: 'displayName',
      limit: 20,
    },
  },
  {
    heading: 'Company',
    links: [
      { label: 'Our Team', href: '/team' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]
