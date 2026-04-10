import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const mediaTools = [
  {
    name: 'find_missing_alt_text',
    description: 'Find all media items that are missing alt text',
    parameters: {} as z.ZodRawShape,
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      // Try querying with where clause for missing alt
      let missingAlt: Array<{ id: string; filename?: string; url?: string }> = []

      try {
        // Query where alt field doesn't exist
        const missingExists = await req.payload.find({
          collection: 'media',
          where: { alt: { exists: false } },
          limit: 100,
        })
        missingAlt.push(
          ...missingExists.docs.map((doc: Record<string, unknown>) => ({
            id: String(doc.id),
            filename: doc.filename as string | undefined,
            url: doc.url as string | undefined,
          })),
        )
      } catch {
        // fallback: query all and filter in JS
      }

      try {
        // Query where alt is empty string
        const emptyAlt = await req.payload.find({
          collection: 'media',
          where: { alt: { equals: '' } },
          limit: 100,
        })
        for (const doc of emptyAlt.docs) {
          const id = String(doc.id)
          if (!missingAlt.some((m) => m.id === id)) {
            missingAlt.push({
              id,
              filename: (doc as Record<string, unknown>).filename as string | undefined,
              url: (doc as Record<string, unknown>).url as string | undefined,
            })
          }
        }
      } catch {
        // ignore
      }

      // If no results from targeted queries, fall back to fetching all and filtering
      if (missingAlt.length === 0) {
        try {
          const all = await req.payload.find({ collection: 'media', limit: 100 })
          missingAlt = all.docs
            .filter((doc: Record<string, unknown>) => {
              const alt = doc.alt
              return alt === undefined || alt === null || alt === ''
            })
            .map((doc: Record<string, unknown>) => ({
              id: String(doc.id),
              filename: doc.filename as string | undefined,
              url: doc.url as string | undefined,
            }))
        } catch (err) {
          return text(`Error querying media: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      return text(JSON.stringify(missingAlt, null, 2))
    },
  },
  {
    name: 'find_unused_media',
    description: 'Find media items that are not referenced by any page',
    parameters: {} as z.ZodRawShape,
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      // Get all media IDs (up to 100)
      let allMedia: Array<{ id: string; filename?: string }> = []
      try {
        const mediaResult = await req.payload.find({ collection: 'media', limit: 100 })
        allMedia = mediaResult.docs.map((doc: Record<string, unknown>) => ({
          id: String(doc.id),
          filename: doc.filename as string | undefined,
        }))
      } catch (err) {
        return text(`Error fetching media: ${err instanceof Error ? err.message : String(err)}`)
      }

      if (allMedia.length === 0) {
        return text(JSON.stringify([]))
      }

      // Collect all referenced media IDs from pages
      const referencedIds = new Set<string>()

      try {
        const pages = await req.payload.find({
          collection: 'pages',
          limit: 100,
          depth: 1,
        })

        for (const page of pages.docs) {
          const serialized = JSON.stringify(page)
          for (const media of allMedia) {
            if (serialized.includes(media.id)) {
              referencedIds.add(media.id)
            }
          }
        }
      } catch {
        // pages collection may not exist or have a different name; continue
      }

      // Also check posts collection if it exists
      try {
        const posts = await req.payload.find({
          collection: 'posts',
          limit: 100,
          depth: 1,
        })

        for (const post of posts.docs) {
          const serialized = JSON.stringify(post)
          for (const media of allMedia) {
            if (serialized.includes(media.id)) {
              referencedIds.add(media.id)
            }
          }
        }
      } catch {
        // posts collection may not exist; continue
      }

      const unused = allMedia.filter((m) => !referencedIds.has(m.id))
      return text(JSON.stringify(unused, null, 2))
    },
  },
]
