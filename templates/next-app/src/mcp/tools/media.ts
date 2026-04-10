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

      const warnings: string[] = []

      try {
        // Query where alt field doesn't exist
        const missingExists = await req.payload.find({
          collection: 'media',
          where: { alt: { exists: false } },
          limit: 100,
        })
        if (missingExists.totalDocs > missingExists.docs.length) {
          warnings.push(
            `Warning: results truncated — ${missingExists.totalDocs} total docs but only ${missingExists.docs.length} returned for "alt missing" query.`,
          )
        }
        missingAlt.push(
          ...missingExists.docs.map((doc: Record<string, unknown>) => ({
            id: String(doc.id),
            filename: doc.filename as string | undefined,
            url: doc.url as string | undefined,
          })),
        )
      } catch (err) {
        // fallback: query all and filter in JS
        warnings.push(
          `Warning: "alt exists: false" query failed (${err instanceof Error ? err.message : String(err)}); falling back to full scan.`,
        )
      }

      try {
        // Query where alt is empty string
        const emptyAlt = await req.payload.find({
          collection: 'media',
          where: { alt: { equals: '' } },
          limit: 100,
        })
        if (emptyAlt.totalDocs > emptyAlt.docs.length) {
          warnings.push(
            `Warning: results truncated — ${emptyAlt.totalDocs} total docs but only ${emptyAlt.docs.length} returned for "alt empty" query.`,
          )
        }
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
      } catch (err) {
        warnings.push(
          `Warning: "alt equals: ''" query failed (${err instanceof Error ? err.message : String(err)}); results may be incomplete.`,
        )
      }

      // If no results from targeted queries, fall back to fetching all and filtering
      if (missingAlt.length === 0) {
        try {
          const all = await req.payload.find({ collection: 'media', limit: 100 })
          if (all.totalDocs > all.docs.length) {
            warnings.push(
              `Warning: results truncated — ${all.totalDocs} total docs but only ${all.docs.length} returned for fallback full-scan query.`,
            )
          }
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

      const output = warnings.length > 0
        ? warnings.join('\n') + '\n\n' + JSON.stringify(missingAlt, null, 2)
        : JSON.stringify(missingAlt, null, 2)
      return text(output)
    },
  },
  {
    name: 'find_unused_media',
    description: 'Find media items that are not referenced by any page',
    parameters: {} as z.ZodRawShape,
    handler: async (_args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      // Get all media IDs (up to 100)
      let allMedia: Array<{ id: string; filename?: string }> = []
      const unusedWarnings: string[] = []
      try {
        const mediaResult = await req.payload.find({ collection: 'media', limit: 100 })
        if (mediaResult.totalDocs > mediaResult.docs.length) {
          unusedWarnings.push(
            `Warning: results truncated — ${mediaResult.totalDocs} total media items but only ${mediaResult.docs.length} returned. Unused-media results may be incomplete.`,
          )
        }
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

        if (pages.totalDocs > pages.docs.length) {
          unusedWarnings.push(
            `Warning: pages results truncated — ${pages.totalDocs} total pages but only ${pages.docs.length} scanned. Some media references may be missed.`,
          )
        }

        for (const page of pages.docs) {
          const serialized = JSON.stringify(page)
          for (const media of allMedia) {
            // Use quoted ID to avoid false positives from short/numeric substring matches
            if (serialized.includes('"' + String(media.id) + '"')) {
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

        if (posts.totalDocs > posts.docs.length) {
          unusedWarnings.push(
            `Warning: posts results truncated — ${posts.totalDocs} total posts but only ${posts.docs.length} scanned. Some media references may be missed.`,
          )
        }

        for (const post of posts.docs) {
          const serialized = JSON.stringify(post)
          for (const media of allMedia) {
            // Use quoted ID to avoid false positives from short/numeric substring matches
            if (serialized.includes('"' + String(media.id) + '"')) {
              referencedIds.add(media.id)
            }
          }
        }
      } catch {
        // posts collection may not exist; continue
      }

      const unused = allMedia.filter((m) => !referencedIds.has(m.id))
      const unusedOutput = unusedWarnings.length > 0
        ? unusedWarnings.join('\n') + '\n\n' + JSON.stringify(unused, null, 2)
        : JSON.stringify(unused, null, 2)
      return text(unusedOutput)
    },
  },
]
