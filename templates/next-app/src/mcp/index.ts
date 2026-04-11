import type { mcpPlugin } from '@payloadcms/plugin-mcp'
import { allTools } from './tools'
import { allPrompts } from './prompts'

type PluginMCPServerConfig = Parameters<typeof mcpPlugin>[0]

export const mcpConfig: PluginMCPServerConfig = {
  collections: {
    pages: {
      description:
        'Website pages with SEO metadata, i18n (en/es/fr), nested doc hierarchy, versioning/drafts, and scheduled publishing. Fields: title, slug, excerpt, featuredImage, content.',
      enabled: { find: true, create: true, update: true, delete: true },
    },
    media: {
      description:
        'Uploaded images and files with localized alt text. Used for page featured images and content media.',
      enabled: { find: true, create: true, update: true, delete: false },
    },
    users: {
      description:
        'CMS users with roles (admin/editor/viewer). Read-only via MCP to prevent privilege escalation.',
      enabled: { find: true, create: false, update: false, delete: false },
    },
    services: {
      description:
        'Business services (plumbing, HVAC, etc.) with SEO metadata, pricing, features, and schema.org type.',
      enabled: { find: true, create: true, update: true, delete: false },
    },
    locations: {
      description:
        'Service areas with city, state, coordinates, population, and nearby locations.',
      enabled: { find: true, create: true, update: true, delete: false },
    },
    'service-pages': {
      description:
        'Cross-product service×location pages with content quality scoring, templates, and AI enrichment.',
      enabled: { find: true, create: true, update: true, delete: true },
    },
    'blog-posts': {
      description:
        'Blog articles with service/location relationships for internal linking.',
      enabled: { find: true, create: true, update: true, delete: false },
    },
    faqs: {
      description:
        'FAQ entries linked to services and/or locations for FAQ blocks and schema.org.',
      enabled: { find: true, create: true, update: true, delete: true },
    },
    testimonials: {
      description:
        'Client reviews with ratings, linked to services and locations.',
      enabled: { find: true, create: true, update: true, delete: false },
    },
    'team-members': {
      description:
        'Team members with location assignments and service specialties.',
      enabled: { find: true, create: true, update: true, delete: false },
    },
  },
  // Type cast: project uses Zod 4, MCP plugin types reference Zod 3.
  // At runtime this is safe — the MCP SDK's zod-compat layer (normalizeObjectSchema)
  // detects both Zod 3 (_def) and Zod 4 (_zod) schemas and handles them correctly.
  mcp: {
    tools: allTools as any,
    prompts: allPrompts as any,
  },
}
