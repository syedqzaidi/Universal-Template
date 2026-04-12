import type { Block } from 'payload'

export const PricingBlock: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: { singular: 'Pricing Table', plural: 'Pricing Tables' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Our Pricing', localized: true },
    { name: 'subheading', type: 'text', localized: true },
    {
      name: 'tiers',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'price', type: 'text', required: true, admin: { description: 'e.g., "$150", "From $99", "Custom"' } },
        { name: 'unit', type: 'text', admin: { description: 'e.g., "/visit", "/hour"' } },
        { name: 'description', type: 'textarea', localized: true },
        {
          name: 'features',
          type: 'array',
          fields: [
            { name: 'feature', type: 'text', required: true, localized: true },
            { name: 'included', type: 'checkbox', defaultValue: true },
          ],
        },
        { name: 'highlighted', type: 'checkbox', defaultValue: false },
        { name: 'ctaText', type: 'text', defaultValue: 'Get Started', localized: true },
        { name: 'ctaLink', type: 'text' },
      ],
    },
    { name: 'disclaimer', type: 'text', localized: true, admin: { description: 'e.g., "Prices may vary by location"' } },
  ],
}
