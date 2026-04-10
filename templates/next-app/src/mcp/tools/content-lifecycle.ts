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
      try {
        await req.payload.update({ collection: 'pages', id, data: { _status: 'published' } })
        return text(`Page ${id} has been published.`)
      } catch (err) {
        return text(`Error: Failed to publish page ${id}. ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'unpublish_page',
    description: 'Unpublish a page by setting its status to draft.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      try {
        await req.payload.update({ collection: 'pages', id, data: { _status: 'draft' } })
        return text(`Page ${id} has been unpublished (set to draft).`)
      } catch (err) {
        return text(`Error: Failed to unpublish page ${id}. ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'duplicate_page',
    description: 'Duplicate a page, suffixing its slug with -copy.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      try {
        const original = await req.payload.findByID({ collection: 'pages', id, depth: 0 })
        const { id: _id, _status, createdAt, updatedAt, ...rest } = original as Record<string, unknown>
        const slug = typeof rest.slug === 'string' ? `${rest.slug}-copy` : 'page-copy'
        const created = await req.payload.create({
          collection: 'pages',
          data: { ...rest, slug, _status: 'draft' } as Record<string, unknown>,
        })
        return text(`Page duplicated. New page ID: ${created.id}`)
      } catch (err) {
        return text(`Error: Failed to duplicate page ${id}. ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'schedule_page',
    description: 'Schedule a page to be published at a future date.',
    parameters: { id: z.string(), publishAt: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      const publishAt = args.publishAt as string
      const parsedDate = new Date(publishAt)
      if (isNaN(parsedDate.getTime())) {
        return text(`Error: Invalid date "${publishAt}". Please provide a valid ISO 8601 date string.`)
      }
      try {
        await req.payload.update({
          collection: 'pages',
          id,
          data: { _status: 'draft', publishedAt: parsedDate.toISOString() },
        })
        return text(`Page ${id} scheduled for publication at ${parsedDate.toISOString()}.`)
      } catch (err) {
        return text(`Error: Failed to schedule page ${id}. ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'archive_page',
    description: 'Archive a page by setting it to draft and prepending [archived] to its title.',
    parameters: { id: z.string() },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const id = args.id as string
      try {
        const page = await req.payload.findByID({ collection: 'pages', id, depth: 0 }) as Record<string, unknown>
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
      } catch (err) {
        return text(`Error: Failed to archive page ${id}. ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'bulk_publish',
    description: 'Publish multiple pages by their IDs.',
    parameters: { ids: z.array(z.string()) },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const ids = args.ids as string[]
      const succeeded: string[] = []
      const failed: Array<{ id: string; error: string }> = []
      for (const id of ids) {
        try {
          await req.payload.update({ collection: 'pages', id, data: { _status: 'published' } })
          succeeded.push(id)
        } catch (err) {
          failed.push({ id, error: err instanceof Error ? err.message : String(err) })
        }
      }
      const summary = [`Published ${succeeded.length}/${ids.length} page(s).`]
      if (failed.length > 0) {
        summary.push(`Failed (${failed.length}): ${failed.map(f => `${f.id} (${f.error})`).join(', ')}`)
      }
      return text(summary.join(' '))
    },
  },
  {
    name: 'bulk_unpublish',
    description: 'Unpublish multiple pages by their IDs.',
    parameters: { ids: z.array(z.string()) },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const ids = args.ids as string[]
      const succeeded: string[] = []
      const failed: Array<{ id: string; error: string }> = []
      for (const id of ids) {
        try {
          await req.payload.update({ collection: 'pages', id, data: { _status: 'draft' } })
          succeeded.push(id)
        } catch (err) {
          failed.push({ id, error: err instanceof Error ? err.message : String(err) })
        }
      }
      const summary = [`Unpublished ${succeeded.length}/${ids.length} page(s).`]
      if (failed.length > 0) {
        summary.push(`Failed (${failed.length}): ${failed.map(f => `${f.id} (${f.error})`).join(', ')}`)
      }
      return text(summary.join(' '))
    },
  },
]
