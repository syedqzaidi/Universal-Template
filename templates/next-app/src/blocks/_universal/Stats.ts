import type { Block } from 'payload'

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats / Counters', plural: 'Stats / Counters' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'stats',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g., "500+", "24/7", "98%"' } },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'icon', type: 'text' },
      ],
    },
  ],
}
