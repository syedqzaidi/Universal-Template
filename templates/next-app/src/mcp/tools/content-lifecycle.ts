import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const contentLifecycleTools = [
  {
    name: 'publish_page',
    description: 'Publish a page by setting its status to published.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      await req.payload.update({ collection: 'pages', id, data: { _status: 'published' } })
      return text(`Page ${id} has been published.`)
    },
  },
  {
    name: 'unpublish_page',
    description: 'Unpublish a page by setting its status to draft.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      await req.payload.update({ collection: 'pages', id, data: { _status: 'draft' } })
      return text(`Page ${id} has been unpublished (set to draft).`)
    },
  },
  {
    name: 'duplicate_page',
    description: 'Duplicate a page, suffixing its slug with -copy.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const original = await req.payload.findByID({ collection: 'pages', id })
      const { id: _id, _status, createdAt, updatedAt, ...rest } = original as Record<string, unknown>
      const slug = typeof rest.slug === 'string' ? `${rest.slug}-copy` : 'page-copy'
      const created = await req.payload.create({
        collection: 'pages',
        data: { ...rest, slug } as Record<string, unknown>,
      })
      return text(`Page duplicated. New page ID: ${created.id}`)
    },
  },
  {
    name: 'schedule_page',
    description: 'Schedule a page to be published at a future date.',
    parameters: { id: z.string(), publishAt: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const publishAt = args.publishAt as string
      await req.payload.update({
        collection: 'pages',
        id,
        data: { _status: 'draft', publishedAt: publishAt },
      })
      return text(`Page ${id} scheduled for publication at ${publishAt}.`)
    },
  },
  {
    name: 'archive_page',
    description: 'Archive a page by setting it to draft and prepending [archived] to its title.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const page = await req.payload.findByID({ collection: 'pages', id }) as Record<string, unknown>
      const currentTitle = typeof page.title === 'string' ? page.title : String(page.title ?? '')
      const archivedTitle = currentTitle.startsWith('[archived] ')
        ? currentTitle
        : `[archived] ${currentTitle}`
      await req.payload.update({
        collection: 'pages',
        id,
        data: { _status: 'draft', title: archivedTitle },
      })
      return text(`Page ${id} has been archived.`)
    },
  },
  {
    name: 'bulk_publish',
    description: 'Publish multiple pages by their IDs.',
    parameters: { ids: z.array(z.string()) },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const ids = args.ids as string[]
      for (const id of ids) {
        await req.payload.update({ collection: 'pages', id, data: { _status: 'published' } })
      }
      return text(`Published ${ids.length} page(s).`)
    },
  },
  {
    name: 'bulk_unpublish',
    description: 'Unpublish multiple pages by their IDs.',
    parameters: { ids: z.array(z.string()) },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const ids = args.ids as string[]
      for (const id of ids) {
        await req.payload.update({ collection: 'pages', id, data: { _status: 'draft' } })
      }
      return text(`Unpublished ${ids.length} page(s).`)
    },
  },
]
