import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'richText', localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'email', type: 'email' },
    {
      name: 'phone',
      type: 'text',
      validate: (value: unknown) => {
        if (!value) return true
        if (!/^[+\d][\d\s()-]{6,}$/.test(value as string)) return 'Enter a valid phone number'
        return true
      },
    },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      admin: { description: 'Locations this team member serves' },
    },
    {
      name: 'specialties',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'certifications',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'issuer', type: 'text' },
        { name: 'year', type: 'number' },
      ],
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
