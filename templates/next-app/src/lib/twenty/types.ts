// ─── Name ────────────────────────────────────────────────────────────────────

export interface FullName {
  firstName: string
  lastName: string
}

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface Person {
  id: string
  name: FullName
  email?: string
  phone?: string
  city?: string
  jobTitle?: string
  linkedinUrl?: string
  companyId?: string
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  name: string
  domainName?: string
  address?: string
  employees?: number
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: string
  name?: string
  amount?: number
  closeDate?: string
  stage?: string
  probability?: number
  pointOfContactId?: string
  companyId?: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title?: string
  body?: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title?: string
  body?: string
  status?: string
  dueAt?: string
  assigneeId?: string
  createdAt: string
  updatedAt: string
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export type CreatePersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePersonInput = Partial<CreatePersonInput>

export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCompanyInput = Partial<CreateCompanyInput>

export type CreateOpportunityInput = Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateOpportunityInput = Partial<CreateOpportunityInput>

export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateNoteInput = Partial<CreateNoteInput>

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTaskInput = Partial<CreateTaskInput>

// ─── GraphQL Response Shapes ─────────────────────────────────────────────────

export interface GraphQLError {
  message: string
  extensions?: Record<string, unknown>
  path?: string[]
}

export interface GraphQLResponse<T> {
  data: T
  errors?: GraphQLError[]
}

// ─── Client Config ───────────────────────────────────────────────────────────

export interface TwentyClientConfig {
  apiUrl: string
  apiKey: string
}

// ─── Filter / OrderBy / Pagination ───────────────────────────────────────────

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'like'
  | 'ilike'
  | 'is'

export interface FieldFilter {
  [operator: string]: unknown
}

export interface ObjectFilter {
  and?: ObjectFilter[]
  or?: ObjectFilter[]
  not?: ObjectFilter
  [field: string]: FieldFilter | ObjectFilter[] | ObjectFilter | undefined
}

export type OrderByDirection = 'AscNullsFirst' | 'AscNullsLast' | 'DescNullsFirst' | 'DescNullsLast'

export interface OrderByField {
  [field: string]: OrderByDirection
}

export interface PaginationInput {
  first?: number
  after?: string
  last?: number
  before?: string
}

// ─── Metadata Types ──────────────────────────────────────────────────────────

export interface CreateObjectInput {
  nameSingular: string
  namePlural: string
  labelSingular: string
  labelPlural: string
  description?: string
  icon?: string
  isRemote?: boolean
}

export interface CreateFieldInput {
  objectMetadataId: string
  name: string
  label: string
  type: string
  description?: string
  icon?: string
  isNullable?: boolean
  defaultValue?: unknown
}

export interface CreateRelationInput {
  relationType: string
  fromObjectMetadataId: string
  toObjectMetadataId: string
  fromFieldMetadataId?: string
  toFieldMetadataId?: string
  fromName: string
  toName: string
  fromLabel: string
  toLabel: string
}
