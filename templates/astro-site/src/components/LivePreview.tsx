import { useLivePreview } from '@payloadcms/live-preview-react'

interface Props {
  initialData: Record<string, any>
  serverURL: string
}

export default function LivePreview({ initialData, serverURL }: Props) {
  const { data, isLoading } = useLivePreview<Record<string, any>>({
    initialData,
    serverURL,
    depth: 2,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading preview...
      </div>
    )
  }

  const title = data.title || data.name || data.displayName || ''
  const description = data.shortDescription || data.excerpt || ''
  const image = typeof data.featuredImage === 'object'
    ? data.featuredImage?.url || data.featuredImage?.sizes?.card?.url
    : null

  return (
    <article className="max-w-4xl mx-auto px-4">
      <h1 className="text-4xl font-bold py-8">{title}</h1>
      {description && (
        <p className="text-lg text-muted-foreground mb-8">{description}</p>
      )}
      {image && (
        <img src={image} alt={title} className="w-full rounded-lg mb-8" />
      )}
      {data.layout && Array.isArray(data.layout) && (
        <div className="space-y-8">
          {data.layout.map((block: any, i: number) => (
            <div key={i} className="border rounded-lg p-6 bg-muted/30">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {block.blockType}
              </span>
              {block.heading && <h2 className="text-2xl font-semibold mt-2">{block.heading}</h2>}
              {block.content && <p className="mt-2">{typeof block.content === 'string' ? block.content : ''}</p>}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
