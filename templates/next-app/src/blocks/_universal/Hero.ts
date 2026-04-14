import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero Section', plural: 'Hero Sections' },
  fields: [
    { name: 'heading', type: 'text', required: true, localized: true },
    { name: 'subheading', type: 'text', localized: true },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', defaultValue: 'Get a Free Quote', localized: true },
        { name: 'link', type: 'text' },
        { name: 'phone', type: 'text', admin: { description: 'Phone number for click-to-call' } },
      ],
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Left-aligned', value: 'left' },
        { label: 'Split (image + text)', value: 'split' },
        { label: 'Full-bleed background', value: 'fullbleed' },
      ],
    },
    {
      name: 'overlayOpacity',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 40,
      admin: { description: 'Dark overlay percentage on background image' },
    },
  ],
}
