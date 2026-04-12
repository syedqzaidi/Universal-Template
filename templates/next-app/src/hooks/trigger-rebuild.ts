import type { CollectionAfterChangeHook } from 'payload'
import { triggerRebuild } from '../webhooks/rebuild-handler'

// Collections that use this hook: services, locations, service-pages, blog-posts, pages
// Wire via: hooks.afterChange: [triggerRebuildAfterChange]

export const triggerRebuildAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only trigger on publish or unpublish (status change)
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc?._status === 'published'
  const statusChanged = wasPublished !== isPublished

  if (!statusChanged) return doc

  // Fetch rebuild config from SiteSettings
  let siteSettings
  try {
    siteSettings = await req.payload.findGlobal({ slug: 'site-settings' })
  } catch {
    // SiteSettings global has never been saved — default to manual (no rebuild)
    return doc
  }

  const rebuildMode = siteSettings?.rebuildMode
  const webhookUrl = siteSettings?.webhookUrl

  if (!webhookUrl) return doc

  switch (rebuildMode) {
    case 'auto':
      await triggerRebuild(webhookUrl)
      break

    case 'auto-review':
      // Auto for single edits, queue for bulk operations
      const isBulkOperation = (req as any)._bulkOperation === true
      if (isBulkOperation) {
        console.log(`[Rebuild] Queued: bulk operation on ${collection.slug}/${doc.id}`)
      } else {
        await triggerRebuild(webhookUrl)
      }
      break

    case 'manual':
    default:
      break
  }

  return doc
}
