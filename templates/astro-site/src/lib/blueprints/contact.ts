import type { PageBlueprint } from '../../types/blueprint'

export const contactBlueprint: PageBlueprint = {
  pageType: 'contact',
  purpose: 'Contact page with form, business details, and trust reinforcement',
  sections: [
    { name: 'page-header', required: true, position: 'fixed', blocks: [], purpose: 'Contact page title', background: 'default', width: 'contained', animation: 'fade-in' },
    { name: 'contact-form-and-info', required: true, position: 'fixed', blocks: [], purpose: 'PayloadForm island + contact details', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'locations-map', required: false, position: 'flexible', blocks: [{ blockType: 'locationMap', priority: 'preferred', when: 'business has physical locations' }], purpose: 'Location map for in-person visits', background: 'muted', width: 'contained', animation: 'fade-up' },
    { name: 'trust-reinforcement', required: false, position: 'flexible', blocks: [{ blockType: 'testimonials', priority: 'preferred' }], purpose: 'Testimonials to reinforce trust', background: 'default', width: 'contained', animation: 'fade-up' },
    { name: 'response-guarantee', required: true, position: 'fixed', blocks: [{ blockType: 'cta', priority: 'preferred' }], purpose: 'Response time guarantee CTA', background: 'primary', width: 'contained', animation: 'fade-up' },
  ],
  cro: {
    primaryCTA: { text: 'Send Message', link: '', phone: 'from SiteSettings' },
    ctaFrequency: 0,
    trustSignalPositions: ['trust-reinforcement'],
    aboveFoldRequirements: ['contact form', 'phone number'],
  },
  seo: {
    schemaTypes: ['ContactPage', 'BreadcrumbList'],
    metaTitlePattern: 'Contact Us | {BusinessName}',
    metaDescPattern: 'Get in touch with {BusinessName}. Call {Phone} or fill out our contact form.',
    headingHierarchy: { h1: 'Contact Us', h2: 'Section headings' },
    internalLinkingRules: [],
  },
  rhythm: { sectionSpacing: 'default', backgroundAlternation: false, visualBreaks: [] },
  contact: {
    form: {
      source: 'payload-form-builder',
      layout: 'two-column',
      fields: { required: ['name', 'email', 'message'], optional: ['phone', 'service', 'preferredDate'] },
      submitButton: { text: 'Send Message', style: 'primary' },
      successState: { message: 'Thank you! We\'ll get back to you shortly.', action: 'show-inline' },
      rendering: { component: 'PayloadForm', island: true },
    },
    contactDetails: { showPhone: true, showEmail: true, showAddress: true, showHours: true },
    followUp: { automationEnabled: true, triggerEmail: 'contact-confirmation' },
  },
}
