import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import type { GenerationManifest, SeedManifest } from '../types/generation'

const ROOT = resolve(process.cwd(), '../..')
const MANIFEST_PATH = resolve(ROOT, '.generation-manifest.json')
const SEED_MANIFEST_PATH = resolve(ROOT, '.seed-manifest.json')

export function readManifest(): GenerationManifest | null {
  try {
    if (!existsSync(MANIFEST_PATH)) return null
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
  } catch {
    return null
  }
}

export function writeManifest(manifest: GenerationManifest): void {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')
}

export function createManifest(businessModel: string): GenerationManifest {
  const manifest: GenerationManifest = {
    businessModel,
    startedAt: new Date().toISOString(),
    steps: {
      analyze: { status: 'pending' },
      collections: { status: 'pending' },
      crossProducts: { status: 'pending' },
      blocks: { status: 'pending' },
      routes: { status: 'pending' },
      schemas: { status: 'pending' },
      crm: { status: 'pending' },
      email: { status: 'pending' },
      seed: { status: 'pending' },
      nav: { status: 'pending' },
      validate: { status: 'pending' },
    },
    generatedFiles: [],
  }
  writeManifest(manifest)
  return manifest
}

export function updateStep(
  stepName: string,
  status: 'completed' | 'in-progress' | 'pending' | 'deferred',
  outputs?: string[],
  error?: string,
): void {
  const manifest = readManifest()
  if (!manifest) return

  manifest.steps[stepName] = {
    ...manifest.steps[stepName],
    status,
    ...(outputs && { outputs }),
    ...(error && { error }),
    ...(status === 'in-progress' && { startedAt: new Date().toISOString() }),
    ...(status === 'completed' && { completedAt: new Date().toISOString() }),
  }

  if (outputs) {
    manifest.generatedFiles = [...new Set([...manifest.generatedFiles, ...outputs])]
  }

  writeManifest(manifest)
}

export function getResumePoint(): string | null {
  const manifest = readManifest()
  if (!manifest) return null

  const stepOrder = ['analyze', 'collections', 'crossProducts', 'blocks', 'routes', 'schemas', 'crm', 'email', 'seed', 'nav', 'validate']

  for (const step of stepOrder) {
    const s = manifest.steps[step]
    if (!s || s.status === 'pending' || s.status === 'in-progress') {
      return step
    }
  }

  return null
}

export function cleanupGeneration(): { deletedFiles: string[]; errors: string[] } {
  const manifest = readManifest()
  const deletedFiles: string[] = []
  const errors: string[] = []

  if (manifest) {
    for (const filePath of manifest.generatedFiles) {
      try {
        const absPath = resolve(ROOT, filePath)
        if (existsSync(absPath)) {
          unlinkSync(absPath)
          deletedFiles.push(filePath)
        }
      } catch (err) {
        errors.push(`Failed to delete ${filePath}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // Delete manifests
  try { if (existsSync(MANIFEST_PATH)) unlinkSync(MANIFEST_PATH) } catch {}
  try { if (existsSync(SEED_MANIFEST_PATH)) unlinkSync(SEED_MANIFEST_PATH) } catch {}

  return { deletedFiles, errors }
}

export function readSeedManifest(): SeedManifest | null {
  try {
    if (!existsSync(SEED_MANIFEST_PATH)) return null
    return JSON.parse(readFileSync(SEED_MANIFEST_PATH, 'utf-8'))
  } catch {
    return null
  }
}

export function writeSeedManifest(manifest: SeedManifest): void {
  writeFileSync(SEED_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')
}

export function updateSeedProgress(entry: { collection: string; id: string; slug: string }): void {
  const manifest = readSeedManifest() || {
    seededAt: new Date().toISOString(),
    entries: [],
    progress: { current: 0, total: 0 },
  }

  manifest.entries.push(entry)
  manifest.progress.current = manifest.entries.length

  writeSeedManifest(manifest)
}
