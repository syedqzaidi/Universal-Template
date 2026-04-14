import { generateSchemas } from './seo'

type SchemaGenerator = (data: any, baseUrl: string, siteSettings: any) => Record<string, any>[]

const generators = new Map<string, SchemaGenerator>()

export function registerSchemaGenerator(pageType: string, generator: SchemaGenerator): void {
  generators.set(pageType, generator)
}

export function generateSchemasForPage(
  pageType: string,
  data: any,
  baseUrl: string,
  siteSettings: any,
): Record<string, any>[] {
  const gen = generators.get(pageType)
  return gen ? gen(data, baseUrl, siteSettings) : []
}

export function getAllSchemaGenerators(): Map<string, SchemaGenerator> {
  return generators
}

// Bootstrap with existing generators
// The existing generateSchemas() function handles all current page types internally.
// New page types added by the generation engine will register individual generators here.
registerSchemaGenerator('home', (data, baseUrl, siteSettings) => generateSchemas('home', data, baseUrl, siteSettings))
registerSchemaGenerator('service', (data, baseUrl, siteSettings) => generateSchemas('service', data, baseUrl, siteSettings))
registerSchemaGenerator('location', (data, baseUrl, siteSettings) => generateSchemas('location', data, baseUrl, siteSettings))
registerSchemaGenerator('service-location', (data, baseUrl, siteSettings) => generateSchemas('service-location', data, baseUrl, siteSettings))
registerSchemaGenerator('blog', (data, baseUrl, siteSettings) => generateSchemas('blog', data, baseUrl, siteSettings))
registerSchemaGenerator('faq', (data, baseUrl, siteSettings) => generateSchemas('faq', data, baseUrl, siteSettings))
registerSchemaGenerator('team', (data, baseUrl, siteSettings) => generateSchemas('team', data, baseUrl, siteSettings))
registerSchemaGenerator('page', (data, baseUrl, siteSettings) => generateSchemas('page', data, baseUrl, siteSettings))
