// ─── Object Name Mapping ─────────────────────────────────────────────────────

interface ObjectMeta {
  singular: string
  plural: string
  capitalSingular: string
  capitalPlural: string
}

const OBJECT_MAP: Record<string, ObjectMeta> = {
  people: {
    singular: 'person',
    plural: 'people',
    capitalSingular: 'Person',
    capitalPlural: 'People',
  },
  companies: {
    singular: 'company',
    plural: 'companies',
    capitalSingular: 'Company',
    capitalPlural: 'Companies',
  },
  opportunities: {
    singular: 'opportunity',
    plural: 'opportunities',
    capitalSingular: 'Opportunity',
    capitalPlural: 'Opportunities',
  },
  notes: {
    singular: 'note',
    plural: 'notes',
    capitalSingular: 'Note',
    capitalPlural: 'Notes',
  },
  tasks: {
    singular: 'task',
    plural: 'tasks',
    capitalSingular: 'Task',
    capitalPlural: 'Tasks',
  },
}

function getMeta(object: string): ObjectMeta {
  const meta = OBJECT_MAP[object]
  if (!meta) throw new Error(`Unknown object type: ${object}`)
  return meta
}

// ─── Default Fields ──────────────────────────────────────────────────────────

const DEFAULT_FIELDS: Record<string, string> = {
  people: `
    id
    name { firstName lastName }
    emails { primaryEmail }
    phones { primaryPhoneNumber }
    city
    jobTitle
    linkedinUrl
    companyId
    createdAt
    updatedAt
  `,
  companies: `
    id
    name
    domainName
    address
    employees
    createdAt
    updatedAt
  `,
  opportunities: `
    id
    name
    amount
    closeDate
    stage
    probability
    pointOfContactId
    companyId
    createdAt
    updatedAt
  `,
  notes: `
    id
    title
    body
    createdAt
    updatedAt
  `,
  tasks: `
    id
    title
    body
    status
    dueAt
    assigneeId
    createdAt
    updatedAt
  `,
}

function selectionSet(object: string, fields?: string[]): string {
  if (fields?.length) return fields.join('\n    ')
  return DEFAULT_FIELDS[object]?.trim() ?? 'id'
}

// ─── Query Builders ──────────────────────────────────────────────────────────

export function buildFindManyQuery(object: string, fields?: string[]): string {
  const meta = getMeta(object)
  const selection = selectionSet(object, fields)

  return `
    query FindMany${meta.capitalPlural}($filter: ${meta.capitalSingular}FilterInput, $orderBy: [${meta.capitalSingular}OrderByInput!], $limit: Int) {
      ${meta.plural}(filter: $filter, orderBy: $orderBy, first: $limit) {
        edges {
          node {
            ${selection}
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `.trim()
}

export function buildFindByIdQuery(object: string, fields?: string[]): string {
  const meta = getMeta(object)
  const selection = selectionSet(object, fields)

  return `
    query Find${meta.capitalSingular}ById($id: ID!) {
      ${meta.singular}(id: $id) {
        ${selection}
      }
    }
  `.trim()
}

export function buildFindByEmailQuery(fields?: string[]): string {
  const selection = selectionSet('people', fields)

  return `
    query FindPersonByEmail($filter: PersonFilterInput) {
      people(filter: $filter, first: 1) {
        edges {
          node {
            ${selection}
          }
        }
      }
    }
  `.trim()
}

export function buildCreateMutation(object: string, fields?: string[]): string {
  const meta = getMeta(object)
  const selection = selectionSet(object, fields)

  return `
    mutation Create${meta.capitalSingular}($input: ${meta.capitalSingular}CreateInput!) {
      create${meta.capitalSingular}(data: $input) {
        ${selection}
      }
    }
  `.trim()
}

export function buildUpdateMutation(object: string, fields?: string[]): string {
  const meta = getMeta(object)
  const selection = selectionSet(object, fields)

  return `
    mutation Update${meta.capitalSingular}($id: ID!, $input: ${meta.capitalSingular}UpdateInput!) {
      update${meta.capitalSingular}(id: $id, data: $input) {
        ${selection}
      }
    }
  `.trim()
}

export function buildDeleteMutation(object: string): string {
  const meta = getMeta(object)

  return `
    mutation Delete${meta.capitalSingular}($id: ID!) {
      delete${meta.capitalSingular}(id: $id) {
        id
      }
    }
  `.trim()
}

export function buildCreateManyMutation(object: string, fields?: string[]): string {
  const meta = getMeta(object)
  const selection = selectionSet(object, fields)

  return `
    mutation Create${meta.capitalPlural}($data: [${meta.capitalSingular}CreateInput!]!) {
      create${meta.capitalPlural}(data: $data) {
        ${selection}
      }
    }
  `.trim()
}

export function buildUpsertMutation(object: string, fields?: string[]): string {
  const meta = getMeta(object)
  const selection = selectionSet(object, fields)

  return `
    mutation Upsert${meta.capitalPlural}($data: [${meta.capitalSingular}CreateInput!]!) {
      upsert${meta.capitalPlural}(data: $data) {
        ${selection}
      }
    }
  `.trim()
}
