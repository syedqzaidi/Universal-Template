import type { Block } from 'payload'

export const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: { singular: 'Content Section', plural: 'Content Sections' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'No Image', value: 'none' },
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
        { label: 'Above', value: 'above' },
        { label: 'Below', value: 'below' },
      ],
    },
  ],
}
