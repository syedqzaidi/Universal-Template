import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'rating', 'service', 'location', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'clientName', type: 'text', required: true },
    { name: 'clientTitle', type: 'text', admin: { description: 'e.g., "Homeowner" or "Business Owner"' } },
    { name: 'review', type: 'textarea', required: true, localized: true },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      required: true,
      validate: (value: unknown) => {
        if (value == null) return true
        if (!Number.isInteger(value)) return 'Rating must be a whole number (1-5)'
        return true
      },
    },
    { name: 'date', type: 'date' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    { name: 'service', type: 'relationship', relationTo: 'services' },
    { name: 'location', type: 'relationship', relationTo: 'locations' },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Yelp', value: 'yelp' },
        { label: 'Direct', value: 'direct' },
        { label: 'Facebook', value: 'facebook' },
      ],
    },
  ],
}
