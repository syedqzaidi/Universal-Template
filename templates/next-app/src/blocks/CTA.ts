import type { Block } from 'payload'

export const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  labels: { singular: 'Call to Action', plural: 'Calls to Action' },
  fields: [
    { name: 'heading', type: 'text', required: true, localized: true },
    { name: 'subheading', type: 'text', localized: true },
    { name: 'buttonText', type: 'text', defaultValue: 'Contact Us', localized: true },
    { name: 'buttonLink', type: 'text' },
    { name: 'phone', type: 'text', admin: { description: 'Phone number for click-to-call CTA' } },
    { name: 'showForm', type: 'checkbox', defaultValue: false },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      admin: { condition: (_, siblingData) => siblingData?.showForm },
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'banner',
      options: [
        { label: 'Banner', value: 'banner' },
        { label: 'Card', value: 'card' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Full-width', value: 'fullwidth' },
      ],
    },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
  ],
}
