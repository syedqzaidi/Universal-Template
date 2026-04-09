import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'alt', type: 'text', required: true, localized: true },
  ],
}
