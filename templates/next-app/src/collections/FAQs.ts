import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'service', 'location', 'updatedAt'],
    group: 'Content',
    description: 'Frequently asked questions -- used in FAQ blocks and FAQ schema markup',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'richText', required: true, localized: true },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: { description: 'Service this FAQ applies to (leave empty for global)' },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'Location this FAQ applies to (leave empty for global)' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order within a FAQ block (lower = first)' },
    },
  ],
}
