import type { PageBlueprint } from '../types/blueprint'

const blueprints = new Map<string, PageBlueprint>()

export function registerBlueprint(pageType: string, blueprint: PageBlueprint): void {
  blueprints.set(pageType, blueprint)
}

export function getBlueprint(pageType: string): PageBlueprint | undefined {
  return blueprints.get(pageType)
}

export function getAllBlueprints(): Map<string, PageBlueprint> {
  return blueprints
}
