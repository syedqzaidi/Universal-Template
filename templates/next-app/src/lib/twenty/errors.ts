import type { GraphQLError } from './types'

export class TwentyApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message)
    this.name = 'TwentyApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static fromResponse(status: number, body: unknown): TwentyApiError {
    const parsed = body as Record<string, unknown> | undefined

    if (status === 401 || status === 403) {
      return new TwentyAuthError(
        (parsed?.message as string) ?? 'Authentication failed',
        status,
      )
    }

    if (status === 404) {
      return new TwentyNotFoundError(
        (parsed?.message as string) ?? 'Resource not found',
      )
    }

    if (status === 422 || status === 400) {
      return new TwentyValidationError(
        (parsed?.message as string) ?? 'Validation failed',
        parsed?.errors ?? parsed?.details,
      )
    }

    if (status === 429) {
      const retryAfter = parsed?.retryAfter as number | undefined
      return new TwentyRateLimitError(
        (parsed?.message as string) ?? 'Rate limit exceeded',
        retryAfter,
      )
    }

    // Check for GraphQL errors in body
    const errors = parsed?.errors as GraphQLError[] | undefined
    if (errors?.length) {
      return new TwentyGraphQLError(errors)
    }

    return new TwentyApiError(
      (parsed?.message as string) ?? `API error (HTTP ${status})`,
      status,
      'UNKNOWN_ERROR',
      parsed,
    )
  }
}

export class TwentyGraphQLError extends TwentyApiError {
  readonly errors: GraphQLError[]

  constructor(errors: GraphQLError[]) {
    const message = errors.map((e) => e.message).join('; ')
    super(message, 200, 'GRAPHQL_ERROR', errors)
    this.name = 'TwentyGraphQLError'
    this.errors = errors
  }
}

export class TwentyNotFoundError extends TwentyApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'TwentyNotFoundError'
  }
}

export class TwentyValidationError extends TwentyApiError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details)
    this.name = 'TwentyValidationError'
  }
}

export class TwentyAuthError extends TwentyApiError {
  constructor(message = 'Authentication failed', status = 401) {
    super(message, status, 'AUTH_ERROR')
    this.name = 'TwentyAuthError'
  }
}

export class TwentyRateLimitError extends TwentyApiError {
  readonly retryAfter?: number

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT', { retryAfter })
    this.name = 'TwentyRateLimitError'
    this.retryAfter = retryAfter
  }
}
