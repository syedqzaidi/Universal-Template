import type { CollectionBeforeChangeHook } from 'payload'

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'your', 'our', 'my', 'his', 'her', 'its', 'their', 'this', 'that',
  'near', 'area',
])

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((word) => !STOP_WORDS.has(word))
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const ARTICLE_WORDS = new Set(['a', 'an', 'the'])

function slugifyLight(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((word) => !ARTICLE_WORDS.has(word))
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const autoGenerateSlug: CollectionBeforeChangeHook = ({ data, operation, collection }) => {
  if (operation === 'create' && !data.slug) {
    const source = data.name || data.title || data.displayName || ''
    if (source) {
      const slug = collection.slug === 'blog-posts' ? slugifyLight(source) : slugify(source)
      if (slug) {
        data.slug = slug
      } else {
        // All words were stop-words — fall back to basic cleanup without stop-word removal
        const fallback = source
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        if (fallback) {
          data.slug = fallback
        }
      }
    }
  }
  return data
}
