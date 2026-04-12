import type { Block } from 'payload'

export const RelatedLinksBlock: Block = {
  slug: 'relatedLinks',
  interfaceName: 'RelatedLinksBlock',
  labels: { singular: 'Related Links', plural: 'Related Links' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Related Services', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto (related services/locations)', value: 'auto' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'links',
      type: 'array',
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
    { name: 'maxItems', type: 'number', defaultValue: 6 },
  ],
}
