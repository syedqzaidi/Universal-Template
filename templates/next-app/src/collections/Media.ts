import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: [
      'image/png', 'image/jpeg', 'image/webp', 'image/avif',
      'image/svg+xml', 'image/gif', 'application/pdf',
    ],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, fit: 'cover', position: 'centre' },
      { name: 'card', width: 600, height: 400, fit: 'cover', position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, fit: 'cover', position: 'centre' },
      { name: 'heroMobile', width: 768, height: 1024, fit: 'cover', position: 'centre' },
      { name: 'gallery', width: 1200, height: 800, fit: 'cover', position: 'centre' },
      { name: 'galleryThumb', width: 300, height: 200, fit: 'cover', position: 'centre' },
      { name: 'og', width: 1200, height: 630, fit: 'cover', position: 'centre' },
      { name: 'square', width: 400, height: 400, fit: 'cover', position: 'centre' },
      { name: 'content', width: 800, height: undefined, fit: 'inside', position: 'centre' },
    ],
  },
  admin: {
    group: 'Content',
    description: 'Images, documents, and other files',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Alt text for accessibility and SEO (max 125 chars)' },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      admin: { description: 'Optional caption displayed below the image' },
    },
  ],
}
