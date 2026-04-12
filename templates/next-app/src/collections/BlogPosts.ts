import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'
import { triggerRebuildAfterChange } from '../hooks/trigger-rebuild'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'category', '_status', 'publishedAt'],
    group: 'Content',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [autoGenerateSlug],
    afterChange: [triggerRebuildAfterChange],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea', maxLength: 300, localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'team-members',
      admin: { description: 'Select the author from the team. Use authorOverride for external authors.' },
    },
    {
      name: 'authorOverride',
      type: 'text',
      admin: { description: 'Fallback author name when the author is not a team member (overrides the relationship).' },
    },
    { name: 'publishedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Tips & Guides', value: 'tips' },
        { label: 'Industry News', value: 'news' },
        { label: 'Case Studies', value: 'case-studies' },
        { label: 'Company Updates', value: 'updates' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'relatedLocations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
    },
    {
      name: 'seoTitle',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Custom SEO title. Max 60 chars.',
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Custom meta description. Max 160 chars.',
        position: 'sidebar',
      },
    },
  ],
}
