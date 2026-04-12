import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, localized: true },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'favicon', type: 'upload', relationTo: 'media' },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Primary phone number (e.g., +1-555-123-4567)' },
      validate: (value: unknown) => {
        if (!value) return true
        if (!/^[+\d][\d\s()-]{6,}$/.test(value as string)) return 'Enter a valid phone number'
        return true
      },
    },
    { name: 'email', type: 'email' },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        {
          name: 'stateCode',
          type: 'text',
          maxLength: 2,
          validate: (value: unknown) => {
            if (!value) return true
            if (!/^[A-Z]{2}$/.test(value as string)) return 'Must be exactly 2 uppercase letters (e.g., "TX")'
            return true
          },
        },
        { name: 'zip', type: 'text' },
        { name: 'country', type: 'text', defaultValue: 'US' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Yelp', value: 'yelp' },
            { label: 'Google Business', value: 'google' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value: unknown) => {
            if (!value) return true
            try {
              new URL(value as string)
              return true
            } catch {
              return 'Enter a valid URL (e.g., https://facebook.com/yourpage)'
            }
          },
        },
      ],
    },
    { name: 'footerText', type: 'textarea', localized: true },
    { name: 'defaultSeoImage', type: 'upload', relationTo: 'media' },
    { name: 'googleAnalyticsId', type: 'text', admin: { description: 'e.g., G-XXXXXXXXXX' } },
    {
      name: 'businessSchema',
      type: 'json',
      admin: {
        description: 'Base Organization/LocalBusiness schema.org JSON-LD. Spread into the Organization schema on every page. Keys here override auto-generated values.',
      },
      validate: (value: unknown) => {
        if (!value) return true
        // Payload json fields pass parsed objects from the admin panel,
        // but may pass strings via the REST API or import/export.
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return 'businessSchema must be a JSON object (not an array or primitive).'
          }
          return true
        } catch {
          return 'Invalid JSON. Please enter a valid JSON object.'
        }
      },
    },
    {
      name: 'rebuildMode',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual (button/CLI only)', value: 'manual' },
        { label: 'Auto (webhook on publish)', value: 'auto' },
        { label: 'Auto with Review (queue bulk ops)', value: 'auto-review' },
      ],
      admin: { description: 'How Astro site rebuilds are triggered on content changes' },
    },
    {
      name: 'webhookUrl',
      type: 'text',
      admin: { description: 'Deploy webhook URL (Vercel, Cloudflare, or custom)' },
      validate: (value: unknown) => {
        if (!value) return true
        try {
          const parsed = new URL(value as string)
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return 'Webhook URL must use http:// or https://'
          }
          return true
        } catch {
          return 'Enter a valid URL (e.g., https://api.vercel.com/v1/integrations/deploy/...)'
        }
      },
    },
  ],
}
