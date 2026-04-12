import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Image Gallery', plural: 'Image Galleries' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'images',
      type: 'array',
      minRows: 2,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    { name: 'columns', type: 'number', defaultValue: 3, min: 2, max: 4 },
  ],
}
