import type { Field } from 'payload'

/**
 * Reusable slug field config with auto-generation UI component.
 * The slug auto-populates from name/title/displayName in the admin panel
 * with a lock toggle for manual override.
 */
export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL-safe identifier -- auto-generated from name. Click the lock to edit manually.',
    components: {
      Field: '/components/SlugField',
    },
  },
}
