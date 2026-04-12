import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateServicePageSlug } from '../hooks/auto-generate-service-page-slug'
import { slugField } from '../fields/slug'
import { triggerRebuildAfterChange } from '../hooks/trigger-rebuild'
import {
  HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
  CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
  GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
} from '../blocks'

export const ServicePages: CollectionConfig = {
  slug: 'service-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'service', 'location', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Service + Location combination pages -- the core of programmatic SEO',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 10,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateServicePageSlug],
    afterChange: [triggerRebuildAfterChange],
    beforeValidate: [
      async ({ data, operation }) => {
        if (!data) return data
        const isPublishing = data._status === 'published'
        const score = data.contentQualityScore
        // Intentional: gate only fires when score IS set and below 50.
        // Unscored pages (undefined/null) are allowed to publish — new pages
        // start with no score and must be publishable during initial setup.
        if (isPublishing && typeof score === 'number' && score < 50) {
          throw new Error(
            `Cannot publish: contentQualityScore is ${score} (minimum 50 required). ` +
            `Save as draft and improve content quality before publishing.`
          )
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Page title -- auto-generated as "[Service] in [Location]" but customizable' },
    },
    slugField,
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      admin: { description: 'Which service this page is about' },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
      admin: { description: 'Which location this page targets' },
    },
    {
      name: 'headline',
      type: 'text',
      localized: true,
      admin: { description: 'Custom headline (e.g., "Expert Plumbing Services in Austin, TX")' },
    },
    {
      name: 'introduction',
      type: 'richText',
      localized: true,
      admin: { description: 'Unique intro paragraph for this service+location combo' },
    },
    {
      name: 'localContent',
      type: 'richText',
      localized: true,
      admin: { description: 'Location-specific content -- local regulations, area-specific tips' },
    },
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      admin: { description: 'Page content sections' },
      blocks: [
        HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
        CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
        GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
      ],
    },
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: { description: 'Custom SEO title for this specific combination. Max 60 chars.' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: { description: 'Custom meta description. Max 160 chars.' },
    },
    {
      name: 'relatedServicePages',
      type: 'relationship',
      relationTo: 'service-pages',
      hasMany: true,
      admin: { description: 'Related service+location pages for cross-linking' },
    },
    {
      name: 'contentSource',
      type: 'select',
      defaultValue: 'template',
      options: [
        { label: 'Template Generated', value: 'template' },
        { label: 'AI Generated', value: 'ai' },
        { label: 'Manually Written', value: 'manual' },
        { label: 'Enriched', value: 'enriched' },
      ],
      admin: { position: 'sidebar', description: 'Track how this page\'s content was created' },
    },
    {
      name: 'contentQualityScore',
      type: 'number',
      min: 0,
      max: 100,
      admin: { position: 'sidebar', description: 'Content quality score (0-100)' },
    },
    {
      name: 'keywords',
      type: 'group',
      fields: [
        { name: 'primary', type: 'text' },
        { name: 'secondary', type: 'array', fields: [{ name: 'keyword', type: 'text', required: true }] },
        { name: 'longTail', type: 'array', fields: [{ name: 'phrase', type: 'text', required: true }] },
        { name: 'lsiTerms', type: 'textarea' },
        { name: 'geoModifiers', type: 'textarea' },
      ],
    },
  ],
}
