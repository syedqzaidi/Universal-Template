import type {
  TwentyClientConfig,
  GraphQLResponse,
  ObjectFilter,
  OrderByField,
  CreatePersonInput,
  UpdatePersonInput,
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  CreateNoteInput,
  UpdateNoteInput,
  CreateTaskInput,
  UpdateTaskInput,
  Person,
  Company,
  Opportunity,
  Note,
  Task,
  CreateObjectInput,
  CreateFieldInput,
  CreateRelationInput,
} from './types'

import { TwentyApiError, TwentyGraphQLError, TwentyRateLimitError } from './errors'

import {
  buildFindManyQuery,
  buildFindByIdQuery,
  buildFindByEmailQuery,
  buildCreateMutation,
  buildUpdateMutation,
  buildDeleteMutation,
  buildCreateManyMutation,
  buildUpsertMutation,
} from './queries'

import {
  buildCreateObjectMutation,
  buildCreateFieldMutation,
  buildCreateRelationMutation,
  buildListObjectsQuery,
} from './schema'

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_BATCH_SIZE = 60
const MAX_RETRIES = 3
const BASE_RETRY_MS = 1000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractNodes<T>(edges: Array<{ node: T }>): T[] {
  return edges.map((e) => e.node)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── CRUD Namespace ──────────────────────────────────────────────────────────

interface CrudNamespace<TEntity, TCreate, TUpdate> {
  findMany(
    filter?: ObjectFilter,
    orderBy?: OrderByField[],
    limit?: number,
    fields?: string[],
  ): Promise<TEntity[]>
  findById(id: string, fields?: string[]): Promise<TEntity>
  create(input: TCreate, fields?: string[]): Promise<TEntity>
  update(id: string, input: TUpdate, fields?: string[]): Promise<TEntity>
  delete(id: string): Promise<{ id: string }>
  createMany(inputs: TCreate[]): Promise<TEntity[]>
  upsert(inputs: TCreate[]): Promise<TEntity[]>
}

interface PeopleCrudNamespace extends CrudNamespace<Person, CreatePersonInput, UpdatePersonInput> {
  findByEmail(email: string, fields?: string[]): Promise<Person | null>
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class TwentyClient {
  private readonly apiUrl: string
  private readonly apiKey: string

  constructor(config: TwentyClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  // ── Core Execute ─────────────────────────────────────────────────────────

  async execute<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(`${this.apiUrl}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ query, variables }),
      })

      // Handle rate limiting with retry
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After')
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined

        if (attempt < MAX_RETRIES) {
          const delayMs = retryAfter
            ? retryAfter * 1000
            : BASE_RETRY_MS * Math.pow(2, attempt)
          await sleep(delayMs)
          lastError = new TwentyRateLimitError('Rate limit exceeded', retryAfter)
          continue
        }

        throw new TwentyRateLimitError('Rate limit exceeded after retries', retryAfter)
      }

      // Handle non-OK HTTP responses
      if (!response.ok) {
        let body: unknown
        try {
          body = await response.json()
        } catch {
          body = { message: await response.text().catch(() => 'Unknown error') }
        }
        throw TwentyApiError.fromResponse(response.status, body)
      }

      // Parse successful response
      const result = (await response.json()) as GraphQLResponse<T>

      // Check for GraphQL-level errors
      if (result.errors?.length) {
        throw new TwentyGraphQLError(result.errors)
      }

      return result.data
    }

    throw lastError ?? new Error('Unexpected retry exhaustion')
  }

  // ── Namespace Builders ───────────────────────────────────────────────────

  private buildCrud<TEntity, TCreate, TUpdate>(
    objectName: string,
  ): CrudNamespace<TEntity, TCreate, TUpdate> {
    const singularKey = {
      people: 'person',
      companies: 'company',
      opportunities: 'opportunity',
      notes: 'note',
      tasks: 'task',
    }[objectName]!

    const capitalSingular = {
      people: 'Person',
      companies: 'Company',
      opportunities: 'Opportunity',
      notes: 'Note',
      tasks: 'Task',
    }[objectName]!

    const capitalPlural = {
      people: 'People',
      companies: 'Companies',
      opportunities: 'Opportunities',
      notes: 'Notes',
      tasks: 'Tasks',
    }[objectName]!

    return {
      findMany: async (filter, orderBy, limit, fields) => {
        const query = buildFindManyQuery(objectName, fields)
        const data = await this.execute<Record<string, { edges: Array<{ node: TEntity }> }>>(
          query,
          { filter, orderBy, limit },
        )
        return extractNodes(data[objectName].edges)
      },

      findById: async (id, fields) => {
        const query = buildFindByIdQuery(objectName, fields)
        const data = await this.execute<Record<string, TEntity>>(query, { id })
        return data[singularKey]
      },

      create: async (input, fields) => {
        const query = buildCreateMutation(objectName, fields)
        const data = await this.execute<Record<string, TEntity>>(query, { input })
        return data[`create${capitalSingular}`]
      },

      update: async (id, input, fields) => {
        const query = buildUpdateMutation(objectName, fields)
        const data = await this.execute<Record<string, TEntity>>(query, { id, input })
        return data[`update${capitalSingular}`]
      },

      delete: async (id) => {
        const query = buildDeleteMutation(objectName)
        const data = await this.execute<Record<string, { id: string }>>(query, { id })
        return data[`delete${capitalSingular}`]
      },

      createMany: async (inputs) => {
        if (inputs.length > MAX_BATCH_SIZE) {
          throw new Error(`Batch size ${inputs.length} exceeds maximum of ${MAX_BATCH_SIZE}`)
        }
        const query = buildCreateManyMutation(objectName)
        const data = await this.execute<Record<string, TEntity[]>>(query, { data: inputs })
        return data[`create${capitalPlural}`]
      },

      upsert: async (inputs) => {
        if (inputs.length > MAX_BATCH_SIZE) {
          throw new Error(`Batch size ${inputs.length} exceeds maximum of ${MAX_BATCH_SIZE}`)
        }
        const query = buildUpsertMutation(objectName)
        const data = await this.execute<Record<string, TEntity[]>>(query, { data: inputs })
        return data[`upsert${capitalPlural}`]
      },
    }
  }

  // ── Namespaced Accessors ─────────────────────────────────────────────────

  private _people?: PeopleCrudNamespace
  get people(): PeopleCrudNamespace {
    if (!this._people) {
      const crud = this.buildCrud<Person, CreatePersonInput, UpdatePersonInput>('people')
      this._people = {
        ...crud,
        findByEmail: async (email: string, fields?: string[]) => {
          const query = buildFindByEmailQuery(fields)
          const data = await this.execute<{
            people: { edges: Array<{ node: Person }> }
          }>(query, {
            filter: { email: { eq: email } },
          })
          const nodes = extractNodes(data.people.edges)
          return nodes[0] ?? null
        },
      }
    }
    return this._people
  }

  private _companies?: CrudNamespace<Company, CreateCompanyInput, UpdateCompanyInput>
  get companies() {
    if (!this._companies) {
      this._companies = this.buildCrud<Company, CreateCompanyInput, UpdateCompanyInput>('companies')
    }
    return this._companies
  }

  private _opportunities?: CrudNamespace<Opportunity, CreateOpportunityInput, UpdateOpportunityInput>
  get opportunities() {
    if (!this._opportunities) {
      this._opportunities = this.buildCrud<
        Opportunity,
        CreateOpportunityInput,
        UpdateOpportunityInput
      >('opportunities')
    }
    return this._opportunities
  }

  private _notes?: CrudNamespace<Note, CreateNoteInput, UpdateNoteInput>
  get notes() {
    if (!this._notes) {
      this._notes = this.buildCrud<Note, CreateNoteInput, UpdateNoteInput>('notes')
    }
    return this._notes
  }

  private _tasks?: CrudNamespace<Task, CreateTaskInput, UpdateTaskInput>
  get tasks() {
    if (!this._tasks) {
      this._tasks = this.buildCrud<Task, CreateTaskInput, UpdateTaskInput>('tasks')
    }
    return this._tasks
  }

  // ── Metadata Namespace ───────────────────────────────────────────────────

  private _metadata?: {
    createObject(input: CreateObjectInput): Promise<Record<string, unknown>>
    createField(input: CreateFieldInput): Promise<Record<string, unknown>>
    createRelation(input: CreateRelationInput): Promise<Record<string, unknown>>
    listObjects(): Promise<Record<string, unknown>>
  }

  get metadata() {
    if (!this._metadata) {
      this._metadata = {
        createObject: async (input: CreateObjectInput) => {
          const query = buildCreateObjectMutation()
          return this.execute<Record<string, unknown>>(query, {
            input: { object: input },
          })
        },

        createField: async (input: CreateFieldInput) => {
          const query = buildCreateFieldMutation()
          return this.execute<Record<string, unknown>>(query, {
            input: { field: input },
          })
        },

        createRelation: async (input: CreateRelationInput) => {
          const query = buildCreateRelationMutation()
          return this.execute<Record<string, unknown>>(query, {
            input: { relation: input },
          })
        },

        listObjects: async () => {
          const query = buildListObjectsQuery()
          return this.execute<Record<string, unknown>>(query)
        },
      }
    }
    return this._metadata
  }
}
