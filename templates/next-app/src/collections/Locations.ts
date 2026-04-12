import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrLoggedIn } from '../access'
import { autoGenerateSlug } from '../hooks/auto-generate-slug'
import { slugField } from '../fields/slug'
import { triggerRebuildAfterChange } from '../hooks/trigger-rebuild'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'city', 'state', 'type', '_status'],
    group: 'Content',
    description: 'Service areas -- cities, neighborhoods, zip codes',
  },
  versions: {
    drafts: {
      autosave: { interval: 1500 },
      schedulePublish: true,
    },
    maxPerDoc: 25,
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
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        const MAX_DEPTH = 10
        if (!data?.parentLocation) return data
        const currentId = originalDoc?.id
        if (!currentId) return data

        let parentId = typeof data.parentLocation === 'object'
          ? data.parentLocation.id
          : data.parentLocation
        const visited = new Set<string>()

        while (parentId) {
          if (parentId === currentId) {
            throw new Error(
              'Circular parentLocation detected: this location appears in its own ancestry chain. ' +
              'Choose a different parent location.'
            )
          }
          if (visited.has(parentId)) break
          if (visited.size >= MAX_DEPTH) break
          visited.add(parentId)

          let parent
          try {
            parent = await req.payload.findByID({
              collection: 'locations',
              id: parentId,
              depth: 0,
            })
          } catch {
            // Parent was deleted — chain is broken, no cycle possible
            break
          }
          parentId = parent?.parentLocation || null
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Display name (e.g., "Austin, TX" or "Downtown Austin")' },
    },
    slugField,
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'City', value: 'city' },
        { label: 'Neighborhood', value: 'neighborhood' },
        { label: 'County', value: 'county' },
        { label: 'Region', value: 'region' },
        { label: 'Zip Code', value: 'zip' },
        { label: 'State', value: 'state' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'city', type: 'text', required: true },
    {
      name: 'state',
      type: 'text',
      required: true,
      admin: { description: 'Full state name (e.g., "Texas")' },
    },
    {
      name: 'stateCode',
      type: 'text',
      required: true,
      maxLength: 2,
      admin: { description: 'Two-letter state code (e.g., "TX")' },
      validate: (value: unknown) => {
        if (!value) return true
        if (!/^[A-Z]{2}$/.test(value as string)) return 'Must be exactly 2 uppercase letters (e.g., "TX")'
        return true
      },
    },
    {
      name: 'zipCodes',
      type: 'text',
      admin: { description: 'Comma-separated zip codes served in this area' },
    },
    {
      name: 'coordinates',
      type: 'point',
      admin: { description: 'Latitude/longitude for map embeds' },
      validate: (value: unknown) => {
        if (!value) return true
        const [lng, lat] = value as [number, number]
        if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90'
        if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180'
        return true
      },
    },
    {
      name: 'population',
      type: 'number',
      min: 0,
      admin: { description: 'Population (for content generation and prioritization)' },
    },
    {
      name: 'timezone',
      type: 'text',
      admin: { description: 'e.g., "America/Chicago"' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: { description: 'About this location -- local information, service area details' },
    },
    {
      name: 'areaInfo',
      type: 'textarea',
      localized: true,
      admin: { description: 'Brief area description for use in cross-product pages' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Representative image of this area' },
    },
    {
      name: 'parentLocation',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'Parent location (e.g., city is parent of neighborhood)' },
    },
    {
      name: 'nearbyLocations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      admin: { description: 'Nearby areas for cross-linking' },
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
