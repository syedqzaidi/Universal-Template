import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const searchRedirectsTools = [
  {
    name: 'reindex_search',
    description: 'Delete all documents in the search collection and reindex all published pages.',
    parameters: {} as Record<string, never>,
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      await req.payload.delete({
        collection: 'search',
        where: { id: { exists: true } },
      })

      const pages = await req.payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        limit: 1000,
      })

      for (const page of pages.docs) {
        await req.payload.create({
          collection: 'search',
          data: {
            doc: { value: page.id, relationTo: 'pages' },
            priority: 10,
          },
        })
      }

      const count = pages.docs.length
      return text(JSON.stringify({ success: true, reindexed: count }, null, 2))
    },
  },
  {
    name: 'create_redirect',
    description: 'Create a redirect document from one URL to another.',
    parameters: {
      from: z.string(),
      to: z.string(),
      type: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const from = args.from as string
      const to = args.to as string

      const redirect = await req.payload.create({
        collection: 'redirects',
        data: {
          from,
          to: {
            type: 'custom',
            url: to,
          },
        },
      })

      return text(JSON.stringify({ success: true, id: redirect.id, from, to }, null, 2))
    },
  },
  {
    name: 'bulk_import_redirects',
    description: 'Parse a JSON array of redirects and create each one. Input should be a JSON string of [{ from, to, type? }].',
    parameters: {
      redirects: z.string(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      let entries: Array<{ from: string; to: string; type?: string }>

      try {
        entries = JSON.parse(args.redirects as string)
      } catch {
        return text(JSON.stringify({ success: false, error: 'Invalid JSON: could not parse redirects string' }, null, 2))
      }

      let created = 0

      for (const entry of entries) {
        await req.payload.create({
          collection: 'redirects',
          data: {
            from: entry.from,
            to: {
              type: 'custom',
              url: entry.to,
            },
          },
        })
        created++
      }

      return text(JSON.stringify({ success: true, created }, null, 2))
    },
  },
]
