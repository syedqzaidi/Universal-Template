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
  },
  // Cast tools/prompts to satisfy Zod 3 vs Zod 4 type mismatch
  // (MCP plugin uses Zod 3 internally, project uses Zod 4)
  mcp: {
    tools: allTools as PluginMCPServerConfig['mcp'] extends { tools?: infer T } ? T : never,
    prompts: allPrompts as PluginMCPServerConfig['mcp'] extends { prompts?: infer T } ? T : never,
  },
}
