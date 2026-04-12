import type { CollectionBeforeChangeHook } from 'payload'

export const autoGenerateServicePageSlug: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create' || !data.service || !data.location) return data
  if (data.slug && data.title) return data

  let serviceDoc
  let locationDoc
  try {
    serviceDoc = await req.payload.findByID({
      collection: 'services',
      id: data.service,
    })
    locationDoc = await req.payload.findByID({
      collection: 'locations',
      id: data.location,
    })
  } catch {
    // Referenced doc was deleted — let Payload's required relationship validation handle it
    return data
  }

  if (!data.slug && serviceDoc?.slug && locationDoc?.slug) {
    data.slug = `${serviceDoc.slug}-in-${locationDoc.slug}`
  }

  // Auto-generate title if not provided
  if (!data.title && serviceDoc?.name && locationDoc?.displayName) {
    data.title = `${serviceDoc.name} in ${locationDoc.displayName}`
  }

  return data
}
