import type { CollectionAfterChangeHook } from 'payload'

export const sendFormSubmissionEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  // Log submission for now — Resend integration via shared package
  req.payload.logger.info(
    `Form submission received: ${JSON.stringify(doc.submissionData)}`,
  )

  return doc
}
