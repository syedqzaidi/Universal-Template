// ─── Metadata API Query/Mutation Builders ────────────────────────────────────

export function buildCreateObjectMutation(): string {
  return `
    mutation CreateOneObject($input: CreateOneObjectInput!) {
      createOneObject(input: $input) {
        id
        nameSingular
        namePlural
        labelSingular
        labelPlural
        description
        icon
        isActive
        createdAt
        updatedAt
      }
    }
  `.trim()
}

export function buildCreateFieldMutation(): string {
  return `
    mutation CreateOneField($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) {
        id
        name
        label
        type
        description
        icon
        isNullable
        createdAt
        updatedAt
      }
    }
  `.trim()
}

export function buildCreateRelationMutation(): string {
  return `
    mutation CreateOneRelation($input: CreateOneRelationInput!) {
      createOneRelation(input: $input) {
        id
        relationType
        fromObjectMetadataId
        toObjectMetadataId
        fromFieldMetadataId
        toFieldMetadataId
        createdAt
        updatedAt
      }
    }
  `.trim()
}

export function buildListObjectsQuery(): string {
  return `
    query ListObjects {
      objects(paging: { first: 1000 }) {
        edges {
          node {
            id
            nameSingular
            namePlural
            labelSingular
            labelPlural
            description
            icon
            isActive
            isCustom
            createdAt
            updatedAt
            fields(paging: { first: 1000 }) {
              edges {
                node {
                  id
                  name
                  label
                  type
                  description
                  icon
                  isNullable
                  isCustom
                }
              }
            }
          }
        }
      }
    }
  `.trim()
}
