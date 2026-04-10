import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const text = (t: string) => ({ content: [{ text: t, type: 'text' as const }] })

export const formsTools = [
  {
    name: 'form_submission_stats',
    description: 'Get submission counts per form, optionally filtered by date range',
    parameters: {
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    } as z.ZodRawShape,
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const startDate = args.startDate as string | undefined
      const endDate = args.endDate as string | undefined

      // Fetch all forms
      let forms: Array<Record<string, unknown>> = []
      try {
        const formsResult = await req.payload.find({ collection: 'forms', limit: 100 })
        forms = formsResult.docs as Array<Record<string, unknown>>
      } catch (err) {
        return text(
          `Error fetching forms: ${err instanceof Error ? err.message : String(err)}`,
        )
      }

      const stats: Array<{ formId: string; formTitle: string; submissionCount: number }> = []

      for (const form of forms) {
        const formId = String(form.id)
        const formTitle = (form.title as string) || formId

        // Build where clause for submissions
        const where: Record<string, unknown> = {
          form: { equals: formId },
        }

        if (startDate || endDate) {
          const dateFilter: Record<string, string> = {}
          if (startDate) dateFilter['greater_than_equal'] = startDate
          if (endDate) dateFilter['less_than_equal'] = endDate
          where['createdAt'] = dateFilter
        }

        try {
          const submissionsResult = await req.payload.find({
            collection: 'form-submissions',
            where: where as any,
            limit: 1,
          })
          stats.push({
            formId,
            formTitle,
            submissionCount: submissionsResult.totalDocs,
          })
        } catch {
          stats.push({ formId, formTitle, submissionCount: 0 })
        }
      }

      return text(JSON.stringify(stats, null, 2))
    },
  },
  {
    name: 'export_form_submissions',
    description: 'Export all submissions for a given form ID as JSON',
    parameters: {
      formId: z.string(),
    } as z.ZodRawShape,
    handler: async (args: Record<string, unknown>, req: PayloadRequest, _extra: unknown) => {
      const formId = args.formId as string

      if (!formId) {
        return text('Error: formId is required')
      }

      try {
        const result = await req.payload.find({
          collection: 'form-submissions',
          where: { form: { equals: formId } },
          limit: 500,
        })

        return text(JSON.stringify(result.docs, null, 2))
      } catch (err) {
        return text(
          `Error fetching submissions: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
  },
]
