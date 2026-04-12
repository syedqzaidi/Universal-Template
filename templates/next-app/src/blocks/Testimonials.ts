import type { Block } from 'payload'

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'What Our Customers Say', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'featured',
      options: [
        { label: 'Featured Only', value: 'featured' },
        { label: 'By Service', value: 'service' },
        { label: 'By Location', value: 'location' },
        { label: 'Manual Selection', value: 'manual' },
      ],
    },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    { name: 'maxItems', type: 'number', defaultValue: 6 },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'carousel',
      options: [
        { label: 'Carousel', value: 'carousel' },
        { label: 'Grid', value: 'grid' },
        { label: 'Stack', value: 'stack' },
      ],
    },
    { name: 'generateSchema', type: 'checkbox', defaultValue: true, admin: { description: 'Generate Review schema.org markup' } },
  ],
}
