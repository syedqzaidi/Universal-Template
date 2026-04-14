import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ Section', plural: 'FAQ Sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Frequently Asked Questions', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual (pick FAQs below)', value: 'manual' },
        { label: 'Auto (pull from FAQ collection by service/location)', value: 'auto' },
      ],
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: {
        description: 'Select specific FAQs (only used when source is "manual")',
        condition: (_, siblingData) => siblingData?.source === 'manual',
      },
    },
    { name: 'maxItems', type: 'number', defaultValue: 8, admin: { description: 'Maximum FAQs to show' } },
    { name: 'generateSchema', type: 'checkbox', defaultValue: true, admin: { description: 'Generate FAQPage schema.org markup' } },
  ],
}
