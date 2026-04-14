/**
 * Analytics event configuration.
 * Universal events are always tracked. Business-specific events
 * are appended by the generation engine via generate_collection.
 */

export interface AnalyticsEvent {
  name: string
  description: string
  properties: Record<string, string>
}

// Universal events tracked on every generated site
export const universalEvents: AnalyticsEvent[] = [
  {
    name: 'page_viewed',
    description: 'Fired on every page load',
    properties: {
      path: 'Current URL path',
      title: 'Page title',
      pageType: 'Blueprint page type (e.g., entity-detail, blog-post)',
      referrer: 'Document referrer',
    },
  },
  {
    name: 'cta_clicked',
    description: 'Fired when a CTA button or link is clicked',
    properties: {
      ctaText: 'Button/link text',
      ctaHref: 'Destination URL',
      ctaPosition: 'Section name from blueprint',
      pageType: 'Blueprint page type',
    },
  },
  {
    name: 'form_submitted',
    description: 'Fired when a form is successfully submitted',
    properties: {
      formId: 'Payload form ID',
      formTitle: 'Form title',
      pageType: 'Blueprint page type',
      source: 'Page URL where form was submitted',
    },
  },
  {
    name: 'search_performed',
    description: 'Fired when a user performs a search',
    properties: {
      query: 'Search query string',
      resultCount: 'Number of results returned',
    },
  },
  {
    name: 'phone_clicked',
    description: 'Fired when a phone number link is clicked',
    properties: {
      phoneNumber: 'Phone number clicked',
      position: 'Where on the page (header, footer, sticky-bar, inline)',
    },
  },
]

// Business-specific events — populated by the generation engine
export const businessEvents: AnalyticsEvent[] = []

export function registerBusinessEvent(event: AnalyticsEvent): void {
  businessEvents.push(event)
}

export function getAllEvents(): AnalyticsEvent[] {
  return [...universalEvents, ...businessEvents]
}
