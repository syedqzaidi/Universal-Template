import type { Block } from 'payload'

export const ServiceDetailBlock: Block = {
  slug: 'serviceDetail',
  interfaceName: 'ServiceDetailBlock',
  labels: { singular: 'Service Detail', plural: 'Service Details' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'icon', type: 'text' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Feature List', value: 'list' },
        { label: 'Grid Cards', value: 'grid' },
        { label: 'Alternating Rows', value: 'alternating' },
      ],
    },
  ],
}
