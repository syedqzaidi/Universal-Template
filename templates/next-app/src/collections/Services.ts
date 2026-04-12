import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'
import { triggerRebuildAfterChange } from '../hooks/trigger-rebuild'
import {
  HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
  CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
  GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
} from '../blocks'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'category', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Service offerings -- each generates a page at /services/[slug]',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
    afterChange: [triggerRebuildAfterChange],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Service name displayed as the page title' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-safe identifier -- auto-generated from name',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Emergency', value: 'emergency' },
        { label: 'Maintenance', value: 'maintenance' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      maxLength: 300,
      localized: true,
      admin: { description: 'Brief description for cards, listings, and meta descriptions' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: { description: 'Full service description for the main content area' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Primary image for this service (used in cards and hero)' },
    },
    {
      name: 'gallery',
      type: 'array',
      admin: { description: 'Additional images for the service gallery' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'icon',
      type: 'text',
      admin: { description: 'Lucide icon name (e.g., "wrench", "zap", "home")' },
    },
    {
      name: 'features',
      type: 'array',
      admin: { description: 'Key features or selling points' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'icon', type: 'text' },
      ],
    },
    {
      name: 'pricing',
      type: 'group',
      admin: { description: 'Pricing information (optional)' },
      fields: [
        { name: 'startingAt', type: 'number', admin: { description: 'Starting price in dollars' } },
        { name: 'priceRange', type: 'text', admin: { description: 'e.g., "$150 - $500"' } },
        { name: 'unit', type: 'text', admin: { description: 'e.g., "per visit", "per hour"' } },
        { name: 'showPricing', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      admin: { description: 'Page layout -- add and reorder content sections' },
      blocks: [
        HeroBlock, ServiceDetailBlock, FAQBlock, TestimonialsBlock,
        CTABlock, LocationMapBlock, ContentBlock, StatsBlock,
        GalleryBlock, PricingBlock, TeamBlock, RelatedLinksBlock,
      ],
    },
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Cross-link to related services for internal linking' },
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: { description: 'FAQs specific to this service' },
    },
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Custom SEO title (overrides auto-generated). Max 60 chars.',
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Custom meta description (overrides auto-generated). Max 160 chars.',
        position: 'sidebar',
      },
    },
    {
      name: 'schemaType',
      type: 'select',
      defaultValue: 'Service',
      options: [
        { label: 'Service', value: 'Service' },
        { label: 'ProfessionalService', value: 'ProfessionalService' },
        { label: 'HomeAndConstructionBusiness', value: 'HomeAndConstructionBusiness' },
        { label: 'FinancialService', value: 'FinancialService' },
        { label: 'HealthAndBeautyBusiness', value: 'HealthAndBeautyBusiness' },
        { label: 'LegalService', value: 'LegalService' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Schema.org type for structured data (affects rich snippets in Google)',
      },
    },
    {
      name: 'keywords',
      type: 'group',
      admin: { description: 'Target keywords -- guides content writing and SEO optimization' },
      fields: [
        {
          name: 'primary',
          type: 'text',
          admin: { description: 'The #1 keyword this page must rank for.' },
        },
        {
          name: 'secondary',
          type: 'array',
          fields: [{ name: 'keyword', type: 'text', required: true }],
        },
        {
          name: 'longTail',
          type: 'array',
          fields: [{ name: 'phrase', type: 'text', required: true }],
        },
        {
          name: 'lsiTerms',
          type: 'textarea',
          admin: { description: 'Comma-separated LSI/semantic terms' },
        },
      ],
    },
  ],
}
