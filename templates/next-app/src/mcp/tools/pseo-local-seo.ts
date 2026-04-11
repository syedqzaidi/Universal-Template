import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const pseoLocalSeoTools = [
  {
    name: 'audit_nap_consistency',
    description:
      'Validate that phone/address format is consistent across all location records (NAP = Name, Address, Phone).',
    parameters: {
      phonePattern: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const pattern = (args.phonePattern as string) ?? '^\\(\\d{3}\\) \\d{3}-\\d{4}$'
        const phoneRegex = new RegExp(pattern)

        const result = await req.payload.find({
          collection: 'locations',
          limit: 500,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Showing ${result.docs.length} of ${result.totalDocs} total locations. Results may be incomplete.`,
          )
        }

        let consistentCount = 0
        let inconsistentCount = 0
        const issues: Array<{ id: string; displayName: string; slug: string; problems: string[] }> =
          []

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>
          const problems: string[] = []

          const displayName = d.displayName as string | undefined
          if (!displayName || displayName.trim() === '') {
            problems.push('Missing or empty displayName')
          }

          const phone = d.phone as string | undefined
          if (phone !== undefined && phone !== null) {
            if (!phoneRegex.test(phone)) {
              problems.push(`Phone "${phone}" does not match pattern ${pattern}`)
            }
          }

          const city = d.city as string | undefined
          const state = d.state as string | undefined
          const stateCode = d.stateCode as string | undefined

          if (!city || city.trim() === '') {
            problems.push('Missing city')
          }
          if (!state || state.trim() === '') {
            problems.push('Missing state')
          }
          if (!stateCode || stateCode.trim() === '') {
            problems.push('Missing stateCode')
          } else if (!/^[A-Z]{2}$/.test(stateCode)) {
            problems.push(`stateCode "${stateCode}" is not exactly 2 uppercase letters`)
          }

          if (problems.length > 0) {
            inconsistentCount++
            issues.push({
              id: String(d.id),
              displayName: (displayName as string) || '',
              slug: (d.slug as string) || '',
              problems,
            })
          } else {
            consistentCount++
          }
        }

        return text(
          JSON.stringify(
            {
              totalLocations: result.docs.length,
              consistentCount,
              inconsistentCount,
              phonePattern: pattern,
              issues,
              ...(warnings.length > 0 ? { warnings } : {}),
            },
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
    name: 'audit_testimonial_coverage',
    description:
      'Check minimum testimonial count per service+location combination against service-pages.',
    parameters: {
      minTestimonials: z.number().optional(),
      minRating: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const minTestimonials = (args.minTestimonials as number) ?? 2
        const minRating = (args.minRating as number) ?? 4

        const testimonialResult = await req.payload.find({
          collection: 'testimonials',
          limit: 500,
          depth: 0,
        })

        const warnings: string[] = []
        if (testimonialResult.totalDocs > testimonialResult.docs.length) {
          warnings.push(
            `Showing ${testimonialResult.docs.length} of ${testimonialResult.totalDocs} total testimonials. Results may be incomplete.`,
          )
        }

        // Filter by minRating and build coverage map
        const coverageMap = new Map<string, number>()
        for (const doc of testimonialResult.docs) {
          const d = doc as Record<string, unknown>
          const rating = d.rating as number | undefined
          if (rating === undefined || rating < minRating) continue

          const serviceId = d.service as string | undefined
          const locationId = d.location as string | undefined
          if (serviceId && locationId) {
            const key = `${serviceId}-${locationId}`
            coverageMap.set(key, (coverageMap.get(key) ?? 0) + 1)
          }
        }

        const spResult = await req.payload.find({
          collection: 'service-pages',
          limit: 500,
          depth: 0,
        })

        if (spResult.totalDocs > spResult.docs.length) {
          warnings.push(
            `Showing ${spResult.docs.length} of ${spResult.totalDocs} total service-pages. Results may be incomplete.`,
          )
        }

        const uncoveredPages: Array<{
          id: string
          slug: string
          serviceId: string
          locationId: string
          testimonialCount: number
        }> = []

        for (const doc of spResult.docs) {
          const d = doc as Record<string, unknown>
          const serviceId = String(d.service ?? '')
          const locationId = String(d.location ?? '')
          const key = `${serviceId}-${locationId}`
          const count = coverageMap.get(key) ?? 0

          if (count < minTestimonials) {
            uncoveredPages.push({
              id: String(d.id),
              slug: (d.slug as string) || '',
              serviceId,
              locationId,
              testimonialCount: count,
            })
          }
        }

        // Sort by testimonial count ascending (worst coverage first)
        uncoveredPages.sort((a, b) => a.testimonialCount - b.testimonialCount)

        const coveredCount = spResult.docs.length - uncoveredPages.length

        return text(
          JSON.stringify(
            {
              totalServicePages: spResult.docs.length,
              coveredCount,
              uncoveredCount: uncoveredPages.length,
              minTestimonials,
              minRating,
              uncoveredPages,
              ...(warnings.length > 0 ? { warnings } : {}),
            },
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
    name: 'audit_image_alt_advanced',
    description:
      'Validate image alt text against playbook rules (max 125 chars, no "image of...", unique per context, no keyword stuffing).',
    parameters: {
      limit: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const limit = (args.limit as number) ?? 100

        const result = await req.payload.find({
          collection: 'media',
          limit,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Showing ${result.docs.length} of ${result.totalDocs} total media items. Increase limit to audit more.`,
          )
        }

        let passCount = 0
        let criticalCount = 0
        const issues: Array<{
          id: string
          filename: string
          alt: string | null
          problems: string[]
        }> = []

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>
          const alt = (d.alt as string) || null
          const filename = (d.filename as string) || ''
          const problems: string[] = []

          if (!alt || alt.trim() === '') {
            problems.push('[critical] Missing alt text')
            criticalCount++
          } else {
            if (alt.length > 125) {
              problems.push(`Alt text too long (${alt.length} chars, max 125)`)
            }

            const altLower = alt.toLowerCase().trim()
            if (
              altLower.startsWith('image of') ||
              altLower.startsWith('photo of') ||
              altLower.startsWith('picture of')
            ) {
              problems.push('Alt text starts with redundant prefix ("image of", "photo of", or "picture of")')
            }

            const commaCount = (alt.match(/,/g) || []).length
            if (commaCount > 4) {
              problems.push(`Potential keyword stuffing (${commaCount} commas detected)`)
            }

            if (/^(IMG|DSC|DJI|DCIM|Screenshot|Screen Shot)[_\s-]?\d*/i.test(alt.trim())) {
              problems.push('Alt text appears to be a filename, not descriptive')
            }
          }

          if (problems.length > 0) {
            issues.push({
              id: String(d.id),
              filename,
              alt,
              problems,
            })
          } else {
            passCount++
          }
        }

        return text(
          JSON.stringify(
            {
              totalImages: result.docs.length,
              passCount,
              issueCount: issues.length,
              criticalCount,
              issues,
              ...(warnings.length > 0 ? { warnings } : {}),
            },
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
    name: 'validate_image_filenames',
    description:
      'Check media filenames against naming conventions (lowercase, hyphens, length, extension match).',
    parameters: {
      limit: z.number().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      try {
        const limit = (args.limit as number) ?? 100

        const result = await req.payload.find({
          collection: 'media',
          limit,
          depth: 0,
        })

        const warnings: string[] = []
        if (result.totalDocs > result.docs.length) {
          warnings.push(
            `Showing ${result.docs.length} of ${result.totalDocs} total media items. Increase limit to audit more.`,
          )
        }

        let validCount = 0
        let invalidCount = 0
        const issues: Array<{
          id: string
          filename: string
          mimeType: string
          problems: string[]
        }> = []

        const mimeToExtMap: Record<string, string[]> = {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
          'image/svg+xml': ['.svg'],
          'image/gif': ['.gif'],
          'image/avif': ['.avif'],
        }

        for (const doc of result.docs) {
          const d = doc as Record<string, unknown>
          const filename = (d.filename as string) || (d.url as string)?.split('/').pop() || ''
          const mimeType = (d.mimeType as string) || ''
          const problems: string[] = []

          if (!filename) {
            problems.push('No filename found')
          } else {
            const lastDot = filename.lastIndexOf('.')
            const nameWithoutExt = lastDot > 0 ? filename.substring(0, lastDot) : filename
            const ext = lastDot > 0 ? filename.substring(lastDot).toLowerCase() : ''

            // Check lowercase
            if (filename !== filename.toLowerCase()) {
              problems.push('Filename contains uppercase characters')
            }

            // Check for underscores or spaces in name part
            if (/[_ ]/.test(nameWithoutExt)) {
              problems.push('Filename uses underscores or spaces instead of hyphens')
            }

            // Check spaces specifically
            if (filename.includes(' ')) {
              problems.push('Filename contains spaces')
            }

            // Check name length
            if (nameWithoutExt.length > 60) {
              problems.push(`Filename too long (${nameWithoutExt.length} chars, max 60)`)
            }

            // Check extension matches mimeType
            if (mimeType && ext) {
              const allowedExts = mimeToExtMap[mimeType]
              if (allowedExts && !allowedExts.includes(ext)) {
                problems.push(
                  `Extension "${ext}" does not match mimeType "${mimeType}" (expected ${allowedExts.join(' or ')})`,
                )
              }
            }

            // Check for descriptive content
            if (!/[a-z]{3,}/.test(nameWithoutExt.toLowerCase())) {
              problems.push('Filename lacks descriptive words (only numbers or short fragments)')
            }
          }

          if (problems.length > 0) {
            invalidCount++
            issues.push({
              id: String(d.id),
              filename,
              mimeType,
              problems,
            })
          } else {
            validCount++
          }
        }

        return text(
          JSON.stringify(
            {
              totalImages: result.docs.length,
              validCount,
              invalidCount,
              issues,
              ...(warnings.length > 0 ? { warnings } : {}),
            },
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
