import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

import { SITE_NAME, MAX_SEED_ITEMS } from './pseo-constants'

export const pseoSeedingTools = [
  {
    name: 'seed_services',
    description:
      'Bulk-create service records from a JSON array string. Each item: {name, category, shortDescription, icon?}.',
    parameters: {
      services: z.string(),
      status: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const items = JSON.parse(args.services as string) as Record<string, unknown>[]
        if (items.length > MAX_SEED_ITEMS) {
          return text(`Error: Maximum ${MAX_SEED_ITEMS} items per call. Received ${items.length}.`)
        }
        const status = (args.status as string) || 'published'
        const created: string[] = []
        const failures: string[] = []

        for (const item of items) {
          try {
            const rec = item as Record<string, unknown>
            const name = rec.name as string
            const slug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
            const shortDescription = rec.shortDescription as string
            const seoTitle = `${name} | ${SITE_NAME}`
            const seoDescription =
              shortDescription && shortDescription.length > 160
                ? shortDescription.slice(0, 160)
                : shortDescription

            await req.payload.create({
              collection: 'services',
              data: {
                name,
                slug,
                category: rec.category,
                shortDescription,
                icon: rec.icon,
                status,
                seoTitle,
                seoDescription,
              } as Record<string, unknown>,
            })
            created.push(name)
          } catch (err) {
            const rec = item as Record<string, unknown>
            failures.push(
              `${rec.name ?? 'unknown'}: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }

        return text(
          JSON.stringify(
            { created: created.length, failed: failures.length, failures },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'seed_locations',
    description:
      'Bulk-create location records from a JSON array string. Each item: {displayName, city, state, stateCode, type?, zipCodes?, lat?, lng?, population?}.',
    parameters: {
      locations: z.string(),
      status: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const items = JSON.parse(args.locations as string) as Record<string, unknown>[]
        if (items.length > MAX_SEED_ITEMS) {
          return text(`Error: Maximum ${MAX_SEED_ITEMS} items per call. Received ${items.length}.`)
        }
        const status = (args.status as string) || 'published'
        const created: string[] = []
        const failures: string[] = []

        for (const item of items) {
          try {
            const rec = item as Record<string, unknown>
            const city = rec.city as string
            const stateCode = rec.stateCode as string
            const slug = `${city}-${stateCode}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')

            const data: Record<string, unknown> = {
              displayName: rec.displayName,
              city,
              state: rec.state,
              stateCode,
              slug,
              status,
            }

            if (rec.type) data.type = rec.type
            if (rec.zipCodes) data.zipCodes = rec.zipCodes
            if (rec.population) data.population = rec.population

            if (rec.lat != null && rec.lng != null) {
              data.coordinates = [rec.lng, rec.lat]
            }

            await req.payload.create({
              collection: 'locations',
              data,
            })
            created.push(rec.displayName as string)
          } catch (err) {
            const rec = item as Record<string, unknown>
            failures.push(
              `${rec.displayName ?? 'unknown'}: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }

        return text(
          JSON.stringify(
            { created: created.length, failed: failures.length, failures },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'seed_faqs',
    description:
      'Bulk-create FAQ records from a JSON array string. Each item: {question, answer, serviceName?, locationName?}.',
    parameters: {
      faqs: z.string(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const items = JSON.parse(args.faqs as string) as Record<string, unknown>[]
        if (items.length > MAX_SEED_ITEMS) {
          return text(`Error: Maximum ${MAX_SEED_ITEMS} items per call. Received ${items.length}.`)
        }
        const created: string[] = []
        const failures: string[] = []

        for (const item of items) {
          try {
            const rec = item as Record<string, unknown>
            const data: Record<string, unknown> = {
              question: rec.question,
              answer: rec.answer,
            }

            if (rec.serviceName) {
              const result = await req.payload.find({
                collection: 'services',
                where: { name: { equals: rec.serviceName } },
                limit: 1,
                depth: 0,
              })
              if (result.docs.length > 0) {
                data.service = String((result.docs[0] as Record<string, unknown>).id)
              }
            }

            if (rec.locationName) {
              const result = await req.payload.find({
                collection: 'locations',
                where: { displayName: { equals: rec.locationName } },
                limit: 1,
                depth: 0,
              })
              if (result.docs.length > 0) {
                data.location = String((result.docs[0] as Record<string, unknown>).id)
              }
            }

            await req.payload.create({
              collection: 'faqs',
              data,
            })
            created.push(rec.question as string)
          } catch (err) {
            const rec = item as Record<string, unknown>
            failures.push(
              `${rec.question ?? 'unknown'}: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }

        return text(
          JSON.stringify(
            { created: created.length, failed: failures.length, failures },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'seed_testimonials',
    description:
      'Bulk-create testimonial records from a JSON array string. Each item: {clientName, review, rating, serviceName?, locationName?, featured?, source?}.',
    parameters: {
      testimonials: z.string(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const items = JSON.parse(args.testimonials as string) as Record<string, unknown>[]
        if (items.length > MAX_SEED_ITEMS) {
          return text(`Error: Maximum ${MAX_SEED_ITEMS} items per call. Received ${items.length}.`)
        }
        const created: string[] = []
        const failures: string[] = []

        for (const item of items) {
          try {
            const rec = item as Record<string, unknown>
            const data: Record<string, unknown> = {
              clientName: rec.clientName,
              review: rec.review,
              rating: rec.rating,
            }

            if (rec.featured != null) data.featured = rec.featured
            if (rec.source) data.source = rec.source

            if (rec.serviceName) {
              const result = await req.payload.find({
                collection: 'services',
                where: { name: { equals: rec.serviceName } },
                limit: 1,
                depth: 0,
              })
              if (result.docs.length > 0) {
                data.service = String((result.docs[0] as Record<string, unknown>).id)
              }
            }

            if (rec.locationName) {
              const result = await req.payload.find({
                collection: 'locations',
                where: { displayName: { equals: rec.locationName } },
                limit: 1,
                depth: 0,
              })
              if (result.docs.length > 0) {
                data.location = String((result.docs[0] as Record<string, unknown>).id)
              }
            }

            await req.payload.create({
              collection: 'testimonials',
              data,
            })
            created.push(rec.clientName as string)
          } catch (err) {
            const rec = item as Record<string, unknown>
            failures.push(
              `${rec.clientName ?? 'unknown'}: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }

        return text(
          JSON.stringify(
            { created: created.length, failed: failures.length, failures },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
  {
    name: 'seed_team_members',
    description:
      'Bulk-create team member records from a JSON array string. Each item: {name, role, bio?, locationNames?, specialtyNames?}.',
    parameters: {
      members: z.string(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const items = JSON.parse(args.members as string) as Record<string, unknown>[]
        if (items.length > MAX_SEED_ITEMS) {
          return text(`Error: Maximum ${MAX_SEED_ITEMS} items per call. Received ${items.length}.`)
        }
        const created: string[] = []
        const failures: string[] = []

        for (const item of items) {
          try {
            const rec = item as Record<string, unknown>
            const data: Record<string, unknown> = {
              name: rec.name,
              role: rec.role,
            }

            if (rec.bio) data.bio = rec.bio

            if (Array.isArray(rec.locationNames) && rec.locationNames.length > 0) {
              const locationIds: string[] = []
              for (const locName of rec.locationNames as string[]) {
                const result = await req.payload.find({
                  collection: 'locations',
                  where: { displayName: { equals: locName } },
                  limit: 1,
                  depth: 0,
                })
                if (result.docs.length > 0) {
                  locationIds.push(String((result.docs[0] as Record<string, unknown>).id))
                }
              }
              if (locationIds.length > 0) data.locations = locationIds
            }

            if (Array.isArray(rec.specialtyNames) && rec.specialtyNames.length > 0) {
              const specialtyIds: string[] = []
              for (const specName of rec.specialtyNames as string[]) {
                const result = await req.payload.find({
                  collection: 'services',
                  where: { name: { equals: specName } },
                  limit: 1,
                  depth: 0,
                })
                if (result.docs.length > 0) {
                  specialtyIds.push(String((result.docs[0] as Record<string, unknown>).id))
                }
              }
              if (specialtyIds.length > 0) data.specialties = specialtyIds
            }

            await req.payload.create({
              collection: 'team-members',
              data,
            })
            created.push(rec.name as string)
          } catch (err) {
            const rec = item as Record<string, unknown>
            failures.push(
              `${rec.name ?? 'unknown'}: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }

        return text(
          JSON.stringify(
            { created: created.length, failed: failures.length, failures },
            null,
            2,
          ),
        )
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
]
