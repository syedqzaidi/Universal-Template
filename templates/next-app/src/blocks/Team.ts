import type { Block } from 'payload'

export const TeamBlock: Block = {
  slug: 'team',
  interfaceName: 'TeamBlock',
  labels: { singular: 'Team Section', plural: 'Team Sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Meet Our Team', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'All Team Members', value: 'all' },
        { label: 'By Location', value: 'location' },
        { label: 'Manual Selection', value: 'manual' },
      ],
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'team-members',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    { name: 'maxItems', type: 'number', defaultValue: 8 },
    { name: 'showContact', type: 'checkbox', defaultValue: false },
  ],
}
